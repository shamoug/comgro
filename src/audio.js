/* =========================================================================
 * COMMON GROUND, audio.js
 * Original, royalty-free, fully synthesised audio via the Web Audio API.
 * No external files: every note is generated in-browser, so it ships free
 * and credited to "procedural synthesis." Mood shifts by Act. Soft UI SFX.
 * Honours the global mute toggle and "reduced motion" (also quiets audio).
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
  let currentAct = 1;
  let step = 0;

  // Pentatonic-friendly scales per act mood (semitone offsets from a root).
  const ROOT = 220; // A3
  const MOODS = {
    1: { name: "calm",      chords: [[0, 4, 7, 11], [2, 5, 9, 12], [-3, 0, 4, 7], [5, 9, 12, 16]], tempo: 2400, lead: [0, 4, 7, 9, 12], wave: "sine", bright: 0.10 },
    2: { name: "tense",     chords: [[0, 3, 7, 10], [-2, 1, 5, 8], [0, 3, 7, 12], [3, 7, 10, 14]], tempo: 1700, lead: [0, 3, 5, 7, 10], wave: "triangle", bright: 0.16 },
    3: { name: "convergent",chords: [[0, 4, 7, 11], [-3, 0, 4, 9], [2, 5, 9, 14], [4, 7, 11, 16]], tempo: 1500, lead: [0, 2, 4, 7, 11], wave: "triangle", bright: 0.14 },
    4: { name: "triumphant",chords: [[0, 4, 7, 12], [5, 9, 12, 16], [7, 11, 14, 19], [0, 4, 7, 12]], tempo: 1400, lead: [0, 4, 7, 12, 16], wave: "sawtooth", bright: 0.12 },
  };

  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.0; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.6; sfxGain.connect(master);
  }

  function midiToFreq(semi) { return ROOT * Math.pow(2, semi / 12); }

  function playNote(freq, t, dur, type, gainVal, dest) {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    const peak = gainVal == null ? 0.15 : gainVal;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || musicGain);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function scheduleBar() {
    if (!ctx || muted) return;
    const mood = MOODS[currentAct] || MOODS[1];
    const now = ctx.currentTime + 0.05;
    const chord = mood.chords[step % mood.chords.length];
    // pad chord
    chord.forEach((semi, i) => {
      playNote(midiToFreq(semi - 12), now, (mood.tempo / 1000) * 1.1, mood.wave, 0.05, musicGain);
    });
    // gentle bass
    playNote(midiToFreq(chord[0] - 24), now, (mood.tempo / 1000) * 1.0, "sine", 0.10, musicGain);
    // sparse lead arpeggio
    const beats = 4;
    for (let b = 0; b < beats; b++) {
      if (Math.random() < (0.35 + mood.bright)) {
        const n = mood.lead[(step + b) % mood.lead.length] + (Math.random() < 0.3 ? 12 : 0);
        playNote(midiToFreq(n), now + (b * mood.tempo / 1000) / beats, 0.25, "triangle", mood.bright, musicGain);
      }
    }
    step++;
    loopTimer = setTimeout(scheduleBar, mood.tempo);
  }

  Audio.start = function () {
    ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    if (started) return;
    started = true;
    if (!muted) musicGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 2);
    scheduleBar();
  };

  Audio.setAct = function (act) {
    currentAct = clampAct(act);
    step = 0;
  };
  function clampAct(a) { return Math.max(1, Math.min(4, a || 1)); }

  Audio.setMuted = function (m) {
    muted = m;
    if (!ctx) { if (!m) Audio.start(); return; }
    if (m) {
      musicGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    } else {
      if (!started) Audio.start();
      else musicGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5);
      if (ctx.state === "suspended") ctx.resume();
    }
  };
  Audio.isMuted = () => muted;

  // ---- SFX ---------------------------------------------------------------
  function blip(freqs, dur, type, gain) {
    ensure();
    if (!ctx || muted) return;
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;
    freqs.forEach((f, i) => playNote(f, t + i * 0.05, dur, type || "sine", gain == null ? 0.25 : gain, sfxGain));
  }

  Audio.sfx = {
    card:     () => blip([440, 660], 0.12, "triangle", 0.18),
    play:     () => blip([523, 784], 0.14, "triangle", 0.2),
    gain:     () => blip([659, 880, 1047], 0.1, "sine", 0.16),
    crisis:   () => blip([220, 175, 140], 0.22, "sawtooth", 0.18),
    trust:    () => blip([392, 523], 0.12, "sine", 0.16),
    milestone:() => blip([523, 659, 784, 1047], 0.18, "triangle", 0.22),
    click:    () => blip([300], 0.05, "sine", 0.1),
    win:      () => blip([523, 659, 784, 1047, 1319], 0.22, "triangle", 0.24),
    lose:     () => blip([330, 262, 196, 147], 0.3, "sine", 0.2),
    deal:     () => blip([520, 580], 0.07, "sine", 0.1),
    crit:     () => blip([784, 1047, 1319, 1568, 2093], 0.16, "triangle", 0.26), // rising fanfare
    setback:  () => blip([392, 311, 247], 0.26, "sine", 0.18),                    // gentle "womp"
    dice:     () => diceRattle(),
  };

  // A short dice-rattle: a few quick noisy taps.
  function diceRattle() {
    ensure(); if (!ctx || muted) return;
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      const f = 200 + Math.floor((i * 137) % 400);
      playNote(f, t + i * 0.06, 0.05, "square", 0.06, sfxGain);
    }
  }

  Audio.sting = function (tier) {
    ensure(); if (!ctx || muted) return;
    const t = ctx.currentTime;
    const seq = tier === "gold" ? [523, 659, 784, 1047, 1319, 1568]
      : tier === "silver" ? [523, 659, 784, 1047]
      : tier === "bronze" ? [440, 554, 659]
      : [440, 349, 262]; // loss
    seq.forEach((f, i) => playNote(f, t + i * 0.12, 0.4, "triangle", 0.22, sfxGain));
  };
})();
