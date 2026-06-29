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

  // One hand-clap: a sharp, brief crack of high noise with a snappy attack
  // and a fast decay, so a crowd of them reads as real clapping, not static.
  function clapTick(t, amp) {
    const len = 0.05;
    const sr = ctx.sampleRate;
    const buf = ctx.createBuffer(1, Math.max(1, Math.ceil(sr * len)), sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const p = i / d.length;
      // tiny silence then an instant attack, then exponential snap-off
      const env = p < 0.04 ? p / 0.04 : Math.pow(1 - (p - 0.04) / (1 - 0.04), 4);
      d[i] = (Math.random() * 2 - 1) * env;
    }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 1100;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 1900 + Math.random() * 1500; bp.Q.value = 1.4;
    const g = ctx.createGain(); g.gain.value = amp;
    src.connect(hp); hp.connect(bp); bp.connect(g); g.connect(sfxGain);
    src.start(t); src.stop(t + len + 0.02);
  }

  // A crowd of applause: a few sharp lead claps up front, then a dense wash
  // that swells and fades. Each clap is jittered in time so it never sounds
  // like a metronome.
  function applause(dur, gain) {
    if (!ctx) return;
    const t0 = ctx.currentTime;
    dur = dur || 1.6;
    const peak = gain == null ? 0.3 : gain;
    // three crisp foreground claps to kick it off
    [0, 0.12, 0.26].forEach((dt, i) => clapTick(t0 + dt, peak * (0.9 - i * 0.12)));
    // the crowd behind: many softer, denser claps swelling 0..1..0
    const claps = 48;
    for (let i = 0; i < claps; i++) {
      const phase = i / claps;
      const env = Math.sin(Math.PI * phase);
      const jitter = (Math.random() - 0.5) * 0.06;
      clapTick(t0 + 0.18 + phase * (dur - 0.18) + jitter, peak * (0.18 + env * 0.55));
    }
  }

  // Celebration cue: a bright rising "ta-da" arpeggio with a shimmer on top,
  // riding over a warm wash of applause. Used for a real success.
  function celebrate() {
    ensure(); if (!ctx || muted) return;
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;
    const arp = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6, a major lift
    arp.forEach((f, i) => voice(f, t + i * 0.08, 0.45, "triangle", 0.2, sfxGain));
    voice(1318.5, t + 0.34, 0.6, "sine", 0.12, sfxGain);   // sparkle high above
    voice(1567.98, t + 0.42, 0.5, "sine", 0.09, sfxGain);
    applause(1.7, 0.24);
  }

  // A long, descending, warbling wail: the cartoon "waaaaa" of disappointment.
  // A sawtooth tone bends downward with a vibrato wobble for the crying quality.
  function wah() {
    ensure(); if (!ctx || muted) return;
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;
    const dur = 1.1;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 1300;
    o.type = "sawtooth";
    o.frequency.setValueAtTime(470, t);
    o.frequency.exponentialRampToValueAtTime(150, t + dur);   // the falling "waaaa"
    // vibrato: a gentle wobble that gives it the crying warble
    const vib = ctx.createOscillator();
    const vibAmt = ctx.createGain();
    vib.type = "sine"; vib.frequency.value = 6.5; vibAmt.gain.value = 16;
    vib.connect(vibAmt); vibAmt.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.24, t + 0.08);
    g.gain.setValueAtTime(0.24, t + dur * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); lp.connect(g); g.connect(sfxGain);
    o.start(t); o.stop(t + dur + 0.05);
    vib.start(t); vib.stop(t + dur + 0.05);
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
    clap:   () => celebrate(),                                // applause + fanfare for a success
    wah:    () => wah(),                                      // descending "waaaa" for a setback
  };
})();
