/* =========================================================================
 * COMMON GROUND, THE LONG ROAD,  audio.js
 * Original, royalty-free, fully synthesised audio via the Web Audio API.
 * No external files: every note is generated in-browser. The score is a
 * cinematic, building loop, a low drone, a slow chord pad, a soft heartbeat
 * pulse, and a sparse melody, that shifts mood across four board "zones".
 * Soft, tactile SFX for dice, climbs, slides and victory.
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});
  const Audio = (CG.Audio = {});

  let ctx = null;
  let master = null;
  let musicGain = null;
  let sfxGain = null;
  let reverb = null;      // a hall reverb the richer SFX are sent into
  let reverbGain = null;
  let started = false;
  let muted = false;
  let loopTimer = null;
  let zone = 0; // 0..3
  let step = 0;

  const ROOT = 110; // A2, a deep, filmic root

  // Four moods, one per board zone. Each grows more rich and resolved.
  //   pad  : chord (semitone offsets) held under everything
  //   lead : notes the sparse melody can pick from
  //   tempo: ms per bar         drone: low sustained interval
  const ZONES = [
    { name: "arrival",   pads: [[0,7,12,16],[ -3,4,9,12],[2,9,14,17],[0,7,12,16]], lead:[12,16,19,24], tempo: 3000, wave: "sine",     bright: 0.06, drone:[0,7] },
    { name: "pressure",  pads: [[0,3,7,10],[ -2,5,8,12],[0,3,10,14],[3,7,10,15]],  lead:[12,15,19,22], tempo: 2400, wave: "triangle", bright: 0.10, drone:[0,6] },
    { name: "converge",  pads: [[0,4,7,11],[ -3,4,9,14],[2,7,11,16],[4,9,12,16]],  lead:[12,16,19,23], tempo: 2200, wave: "triangle", bright: 0.09, drone:[0,7] },
    { name: "legacy",    pads: [[0,4,7,12],[5,9,12,17],[7,12,16,19],[0,4,7,12]],   lead:[16,19,24,28], tempo: 2000, wave: "sawtooth", bright: 0.08, drone:[0,12] },
  ];

  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.0; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.7; sfxGain.connect(master);
    reverb = ctx.createConvolver(); reverb.buffer = makeReverbIR(2.4, 2.6);
    reverbGain = ctx.createGain(); reverbGain.gain.value = 0.8;
    reverb.connect(reverbGain); reverbGain.connect(master);
  }

  // A synthesised hall impulse: exponentially-decaying stereo noise. Convolving
  // a dry tone with this gives it space and tail, the difference between a cheap
  // beep and a sound that feels designed.
  function makeReverbIR(seconds, decay) {
    const rate = ctx.sampleRate;
    const len = Math.max(1, Math.floor(rate * seconds));
    const ir = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return ir;
  }

  function freq(semi) { return ROOT * Math.pow(2, semi / 12); }

  // A single voice with its own filter, so pads sound warm not buzzy.
  function voice(f, t, dur, type, peak, dest, glideTo) {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 1800;
    o.type = type || "sine";
    o.frequency.setValueAtTime(f, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + Math.min(0.4, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); lp.connect(g); g.connect(dest || musicGain);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function scheduleBar() {
    if (!ctx || muted) return;
    const z = ZONES[zone] || ZONES[0];
    const now = ctx.currentTime + 0.05;
    const bar = z.tempo / 1000;
    const pad = z.pads[step % z.pads.length];

    // Low drone (two voices, an octave-ish apart): the cinematic bed.
    z.drone.forEach((d) => voice(freq(d - 12), now, bar * 1.15, "sine", 0.09, musicGain));

    // Slow chord pad.
    pad.forEach((semi) => voice(freq(semi), now, bar * 1.05, z.wave, 0.045, musicGain));

    // Soft heartbeat pulse on beats 1 and 3, tension you can feel.
    voice(freq(z.drone[0] - 24), now, 0.18, "sine", 0.16, musicGain);
    voice(freq(z.drone[0] - 24), now + bar * 0.5, 0.16, "sine", 0.12, musicGain);

    // Sparse melody: a few bell-like notes, more frequent in later zones.
    const beats = 4;
    for (let b = 0; b < beats; b++) {
      if (Math.random() < 0.28 + z.bright + zone * 0.04) {
        const n = z.lead[(step + b) % z.lead.length] + (Math.random() < 0.25 ? 12 : 0);
        voice(freq(n), now + (b * bar) / beats, 0.5, "triangle", z.bright, musicGain);
      }
    }
    step++;
    loopTimer = setTimeout(scheduleBar, z.tempo);
  }

  Audio.start = function () {
    ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    if (started) return;
    started = true;
    if (!muted) musicGain.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 3);
    scheduleBar();
  };

  // Set the musical zone from a board position (1..100).
  Audio.setProgress = function (pos) {
    const z = Math.max(0, Math.min(3, Math.floor((pos - 1) / 25)));
    if (z !== zone) { zone = z; step = 0; }
  };

  Audio.setMuted = function (m) {
    muted = m;
    if (!ctx) { if (!m) Audio.start(); return; }
    if (m) {
      musicGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    } else {
      if (!started) Audio.start();
      else musicGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.6);
      if (ctx.state === "suspended") ctx.resume();
    }
  };
  Audio.isMuted = () => muted;

  // ---- SFX --------------------------------------------------------------
  function seq(freqs, gap, dur, type, gain) {
    ensure();
    if (!ctx || muted) return;
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;
    freqs.forEach((f, i) => voice(f, t + i * gap, dur, type || "sine", gain == null ? 0.22 : gain, sfxGain));
  }

  // A rattle of quick noisy taps for the dice tumble.
  function diceRattle() {
    ensure(); if (!ctx || muted) return;
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;
    for (let i = 0; i < 7; i++) {
      voice(180 + ((i * 149) % 420), t + i * 0.05, 0.045, "square", 0.06, sfxGain);
    }
  }

  // A glissando: up for a climb, down for a slide.
  function glide(from, to, dur, gain) {
    ensure(); if (!ctx || muted) return;
    if (ctx.state === "suspended") ctx.resume();
    voice(from, ctx.currentTime, dur, "triangle", gain == null ? 0.2 : gain, sfxGain, to);
  }

  // A single FM bell/glockenspiel note: a sine carrier whose pitch is shaped by
  // a fast-decaying modulator, giving a bright metallic "ting" with a soft tail.
  // Sent dry to the SFX bus and wet to the reverb so it rings in a hall.
  function bell(f, t, dur, peak, wet) {
    if (!ctx) return;
    const car = ctx.createOscillator(); car.type = "sine"; car.frequency.value = f;
    const mod = ctx.createOscillator(); mod.type = "sine"; mod.frequency.value = f * 1.5;
    const modAmt = ctx.createGain();
    modAmt.gain.setValueAtTime(f * 1.4, t);
    modAmt.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.5);
    mod.connect(modAmt); modAmt.connect(car.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.006);   // instant mallet attack
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);   // long bell decay
    car.connect(g); g.connect(sfxGain);
    if (reverb) { const w = ctx.createGain(); w.gain.value = wet == null ? 0.6 : wet; g.connect(w); w.connect(reverb); }
    car.start(t); car.stop(t + dur + 0.05); mod.start(t); mod.stop(t + dur + 0.05);
  }

  // A warm, mellow tone built from two detuned voices through a lowpass: a soft
  // horn rather than a buzzy raw oscillator. Optional downward glide for a sigh.
  function warmTone(f, t, dur, peak, cutoff, glideTo, wet) {
    if (!ctx) return;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = cutoff || 1500;
    [-7, 7].forEach((cents) => {
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.detune.value = cents;
      o.frequency.setValueAtTime(f, t);
      if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
      o.connect(lp); o.start(t); o.stop(t + dur + 0.05);
    });
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    lp.connect(g); g.connect(sfxGain);
    if (reverb) { const w = ctx.createGain(); w.gain.value = wet == null ? 0.5 : wet; g.connect(w); w.connect(reverb); }
  }

  // Success: a bright rising glockenspiel arpeggio with a shimmering chord on
  // top, ringing out in the reverb. Clean, joyful, "you did it".
  function celebrate() {
    ensure(); if (!ctx || muted) return;
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;
    // ascending major pentatonic: C5 D5 E5 G5 A5 C6
    const run = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    run.forEach((f, i) => bell(f, t + i * 0.085, 1.6, 0.24, 0.55));
    // a shimmering chord left ringing above once the run lands
    [1046.5, 1318.5, 1567.98].forEach((f, i) => bell(f, t + 0.55 + i * 0.015, 2.2, 0.12, 0.75));
  }

  // Setback: the classic "sad trombone" descent, three mellow horn notes
  // stepping down with the last one drooping off, warm and a little comic.
  function sadTrombone() {
    ensure(); if (!ctx || muted) return;
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;
    warmTone(311.13, t,        0.4, 0.2, 1500, 293.66, 0.4);  // E♭4 -> D4
    warmTone(293.66, t + 0.34, 0.4, 0.2, 1450, 277.18, 0.4);  // D4  -> C♯4
    warmTone(277.18, t + 0.68, 1.0, 0.22, 1400, 196.0, 0.55); // C♯4 droops down to G3
  }

  Audio.sfx = {
    step:   () => seq([440], 0, 0.05, "sine", 0.08),
    dice:   () => diceRattle(),
    doubles:() => seq([523, 659, 880], 0.06, 0.14, "triangle", 0.2),
    ladder: () => glide(330, 990, 0.7, 0.22),                 // whoosh up
    snake:  () => glide(660, 180, 0.8, 0.22),                 // slither down
    note:   () => seq([784, 1047], 0.07, 0.16, "sine", 0.14), // a gentle chime
    pick:   () => seq([523, 784], 0.05, 0.12, "triangle", 0.16),
    click:  () => seq([320], 0, 0.05, "sine", 0.1),
    win:    () => seq([523, 659, 784, 1047, 1319, 1568], 0.12, 0.4, "triangle", 0.24),
    lose:   () => seq([392, 330, 262, 196], 0.14, 0.4, "sine", 0.2),
    clap:   () => celebrate(),                                // rising glockenspiel for a success
    wah:    () => sadTrombone(),                              // sad-trombone descent for a setback
  };
})();
