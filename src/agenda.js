/* =========================================================================
 * COMMON GROUND, AGENDA 2030,  agenda.js
 * The fifth game: a television quiz show about the Sustainable Development
 * Goals, in the spirit of “Who Wants to Be a Millionaire?”.
 *
 * Ten questions a show, drawn from the bank in data/agenda.js: four warm-up,
 * three harder, three for the brave. Up to five contestants answer each
 * question in secret, then the lights dim for five seconds of suspense, the
 * right answer lights up, and the show moves on. Most right answers wins;
 * a tie goes to whoever was quicker on the answers they got right.
 *
 * Two ways to play:
 *   Host a show   One main screen (a projector, a TV, a laptop) opens a show
 *                 with a random five-letter code, a link and a QR code.
 *                 Contestants scan it with their phones, type a name and
 *                 pick an avatar. When the last seat is taken the show
 *                 starts by itself. Phones become private answer pads; the
 *                 main screen carries the stage, the music and the reveal.
 *   Play solo     You against one to four AI contestants on one screen.
 *
 * The main screen is the host: it alone writes the show's state, which keeps
 * every phone in step without races. Phones talk to it over the live
 * channel (join, pick, react, heartbeat) and re-send a pick until the host
 * confirms it. The right answer stays on the host until the reveal.
 *
 * Rides CG.Net.room("agenda") on the shared MQTT broker. The QR code is
 * drawn from qrcode-generator, loaded only when a show is opened. Music and
 * effects are synthesised live (Web Audio), no files. Vanilla JS.
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});
  const app = () => document.getElementById("app");
  const $ = (id) => document.getElementById(id);
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  const rand = (a) => a[Math.floor(Math.random() * a.length)];
  const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const clean = (s) => String(s || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 18);
  const now = () => Date.now();
  function ls(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || "null");
      if (val === null) { localStorage.removeItem(key); return null; }
      localStorage.setItem(key, JSON.stringify(val)); return val;
    } catch (e) { return val === undefined ? null : val; }
  }
  // The host speaks. The stage tracks whether a line is still being read
  // (S.talking) so the show never moves on mid-sentence, and the music ducks
  // underneath. A line cut off by a newer one, a pause or the voice toggle
  // counts as finished.
  let talkDone = null;
  function finishTalk() { const f = talkDone; talkDone = null; if (f) f(); }
  function say(text, onend) {
    finishTalk();
    const speaking = text && CG.Narrate && settings.voice && S.role !== "phone" && S.role !== "watch" && CG.Narrate.supported();
    const fin = () => {
      if (talkDone !== fin) return;
      talkDone = null; S.talking = false; S.talkEnd = now();
      SA.duck(false);
      if (onend) onend();
    };
    talkDone = fin;
    if (!speaking) { fin(); return; }
    S.talking = true; S.talkStart = now();
    SA.duck(true);
    CG.Narrate.auto(text, { onend: fin });
  }
  function hush() { if (CG.Narrate) CG.Narrate.stop(); finishTalk(); }
  const TALK_GAP = 1400;     // a breath after the host finishes, before the show moves on
  const TALK_CAP = 75000;    // never wait longer than this for a voice that went quiet
  const talkOver = () => (S.talking ? now() - S.talkStart > TALK_CAP : now() - (S.talkEnd || 0) >= TALK_GAP);
  const buzz = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };

  // =======================================================================
  // THE SHOW, IN NUMBERS
  // =======================================================================
  const QCOUNT = 10;
  const TIERS = [1, 1, 1, 1, 2, 2, 2, 3, 3, 3];
  const TIER_NAMES = { 1: "Warm-up", 2: "Harder", 3: "For the brave" };
  const LETTERS = ["A", "B", "C", "D"];
  const INTRO_MS = 2200;       // the question and its answers land
  const ANSWER_S = 30;         // seconds to answer, the same for every question
  const FINAL_S = ANSWER_S;    // the countdown score runs the whole answer time
  const SUSPENSE_MS = 5000;    // lights down, final answers are in
  const REVEAL_MS = 7500;      // the right answer and the fact
  const COUNTDOWN_MS = 6500;   // “tonight's contestants”, then 3, 2, 1
  const QUIET_MS = 25000;      // a phone silent this long is “away”
  const SEAT_COLORS = ["#f5c542", "#3fd0ff", "#ff5d8f", "#7cf29c", "#b48cff"];
  const AVATARS = ["🦁", "🐘", "🦒", "🐢", "🐬", "🦉", "🐝", "🦋", "🐼", "🦊", "🐧", "🐙", "🌻", "🌳", "🌍", "⭐"];
  const CODE_ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const QR_LIB = "https://unpkg.com/qrcode-generator@1.4.4/qrcode.js";
  const LEVELS = {
    casual: { label: "Casual", acc: [0.72, 0.52, 0.34], blurb: "Friendly rivals who know the headlines and guess the rest." },
    sharp:  { label: "Sharp",  acc: [0.88, 0.70, 0.50], blurb: "They read the SDG report. Most of it." },
    expert: { label: "Expert", acc: [0.96, 0.86, 0.70], blurb: "Former Resident Coordinators. They know the targets by number." },
  };

  const settings = Object.assign({ music: true, voice: true, sfx: true, timer: 20, seats: 4, rivals: 3, level: "sharp", avatar: "", name: "" },
    ls("cg_agenda_settings") || {});
  const saveSettings = () => ls("cg_agenda_settings", settings);
  function stats() { return Object.assign({ shows: 0, wins: 0, right: 0, asked: 0, best: 0 }, ls("cg_agenda_stats") || {}); }

  const GOAL = (n) => (CG.SDG_GOALS || [])[n] || { n, name: "The 2030 Agenda", color: "#1a5fb4" };
  const myId = () => (CG.Net ? CG.Net.clientId : "local");
  let ROOM = null;
  function room() {
    if (!ROOM && CG.Net && CG.Net.room) ROOM = CG.Net.room("agenda", summaryOf);
    return ROOM;
  }

  // =======================================================================
  // SOUND: an original game-show score, synthesised live
  // =======================================================================
  // Every note is generated in the browser: no files, nothing to license.
  // The band is built from oscillators and noise: a string section (five
  // detuned saws with vibrato, spread across the stereo field), brass with a
  // filter swell, a felt piano, a choir "aah" through vowel formants, bells,
  // a bass and a drum kit, all in one hall reverb. The cues:
  //   theme      the title, lobby and results anthem: 16 bars in D minor
  //              that lift to F major. It builds pass by pass (piano and
  //              strings, then bass and drums, then the full band with a
  //              brass melody and choir) and breathes every third pass.
  //   question   the question landing: a low string pulse that climbs a
  //              semitone with every question
  //   countdown  the 30-second answer clock, in time at 120 bpm (see below)
  //   reveal     a soft piano and strings bed under the host's explanation
  // The music ducks under the host's voice so every word is clear.
  const SA = (function () {
    let ctx = null, master, musicBus, sfxBus, verb, comp, duckG;
    let mode = "off", level = 0, nextT = 0, step = 0, timer = null, musicOn = true, sfxOn = true;
    const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

    function ensure() {
      if (ctx) return ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 3.5;
      master = ctx.createGain(); master.gain.value = 0.85;
      master.connect(comp); comp.connect(ctx.destination);
      duckG = ctx.createGain(); duckG.gain.value = 1; duckG.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? 0.55 : 0; musicBus.connect(duckG);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.8; sfxBus.connect(master);
      // a warm hall: decaying stereo noise, gently low-passed so the tail is soft
      verb = ctx.createConvolver();
      const len = Math.floor(ctx.sampleRate * 3), ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch); let lp = 0;
        for (let i = 0; i < len; i++) { lp += ((Math.random() * 2 - 1) - lp) * 0.35; d[i] = lp * Math.pow(1 - i / len, 3.2) * 1.6; }
      }
      verb.buffer = ir;
      const vg = ctx.createGain(); vg.gain.value = 0.45; verb.connect(vg); vg.connect(master);
      return ctx;
    }
    function unlock() { if (!ensure()) return; if (ctx.state === "suspended") ctx.resume(); }

    // Route a voice to its bus, through a stereo panner when asked.
    function route(node, dest, pan) {
      if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; node.connect(p); p.connect(dest); return p; }
      node.connect(dest); return node;
    }
    // One shaped voice: oscillator(s) -> lowpass -> envelope -> bus (+ reverb send)
    //   dets: detune list in cents (a section, not a soloist); vib: vibrato depth
    function tone(o) {
      if (!ctx) return;
      const t = o.t, dur = o.dur, dest = o.bus || musicBus;
      const g = ctx.createGain();
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = o.cut || 2400; lp.Q.value = o.q || 0.7;
      lp.frequency.setValueAtTime(o.cut || 2400, t);
      if (o.cutTo) lp.frequency.exponentialRampToValueAtTime(o.cutTo, t + (o.cutT || dur));
      const det = o.dets || (o.detune ? [-o.detune, o.detune] : [0]);
      let lfo = null;
      if (o.vib) {
        lfo = ctx.createOscillator(); lfo.frequency.value = o.vibR || 5.4;
        const lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(o.vib, t + Math.min(0.6, dur * 0.5));
        lfo.connect(lg); lfo.lg = lg; lfo.start(t); lfo.stop(t + dur + 0.1);
      }
      det.forEach((d) => {
        const osc = ctx.createOscillator(); osc.type = o.type || "sine"; osc.detune.value = d;
        osc.frequency.setValueAtTime(o.f, t);
        if (o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide, t + (o.glideT || dur));
        if (lfo) lfo.lg.connect(osc.detune);
        osc.connect(lp); osc.start(t); osc.stop(t + dur + 0.1);
      });
      const a = o.a == null ? 0.01 : o.a;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(o.v / Math.sqrt(det.length), t + a);
      if (o.hold) g.gain.setValueAtTime(o.v / Math.sqrt(det.length), t + a + o.hold);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      lp.connect(g);
      const out = route(g, dest, o.pan);
      if (o.wet) { const w = ctx.createGain(); w.gain.value = o.wet; out.connect(w); w.connect(verb); }
    }
    function noise(o) {
      if (!ctx) return;
      const t = o.t, dur = o.dur;
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = o.ft || "highpass"; f.frequency.value = o.ff || 6000; f.Q.value = o.q || 0.8;
      f.frequency.setValueAtTime(o.ff || 6000, t);
      if (o.ffTo) f.frequency.exponentialRampToValueAtTime(o.ffTo, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(o.v, t + (o.a || 0.003));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g);
      const out = route(g, o.bus || musicBus, o.pan);
      if (o.wet) { const w = ctx.createGain(); w.gain.value = o.wet; out.connect(w); w.connect(verb); }
      src.start(t); src.stop(t + dur + 0.05);
    }

    // ---- the band ---------------------------------------------------------
    function kick(t, v, bus) { tone({ t, dur: 0.35, f: 130, glide: 38, glideT: 0.22, v: v || 0.5, type: "sine", cut: 900, bus }); }
    function snare(t, v, bus) {
      noise({ t, dur: 0.2, v: v || 0.12, ft: "bandpass", ff: 1900, q: 0.6, bus, wet: 0.2 });
      tone({ t, dur: 0.11, f: 200, glide: 150, v: (v || 0.12) * 0.9, type: "triangle", cut: 1200, bus });
    }
    function timp(t, m, v, bus) {
      tone({ t, dur: 1.1, f: mtof(m) * 1.04, glide: mtof(m), glideT: 0.08, v: v || 0.35, type: "sine", cut: 700, bus, wet: 0.35 });
      noise({ t, dur: 0.08, v: (v || 0.35) * 0.25, ft: "lowpass", ff: 900, bus });
    }
    function hat(t, v, bus, open) { noise({ t, dur: open ? 0.22 : 0.05, v: v || 0.05, ft: "highpass", ff: 7500, bus, pan: 0.25 }); }
    function bell(t, m, v, bus, dur) {
      tone({ t, dur: dur || 1.4, f: mtof(m), v: v || 0.12, type: "sine", cut: 6000, bus, wet: 0.6 });
      tone({ t, dur: (dur || 1.4) * 0.5, f: mtof(m) * 2.76, v: (v || 0.12) * 0.25, type: "sine", cut: 9000, bus, wet: 0.6 });
    }
    function brass(t, ms, dur, v, bus) {
      ms.forEach((m, i) => tone({ t, dur, f: mtof(m), v: v / ms.length * 2, type: "sawtooth", detune: 9, a: 0.06, cut: 500, cutTo: 2600, cutT: Math.min(dur, 0.5), bus, wet: 0.45, pan: ms.length > 1 ? (i / (ms.length - 1) - 0.5) * 0.6 : 0 }));
    }
    function crash(t, v, bus) { noise({ t, dur: 2.2, v: v || 0.12, ft: "highpass", ff: 4000, a: 0.002, bus, wet: 0.5, pan: -0.3 }); }
    // the string section: five players a part, spread left to right
    function strings(t, ms, dur, v, o) {
      o = o || {};
      ms.forEach((m, i) => tone({ t, dur, f: mtof(m), v, type: "sawtooth", dets: [-15, -6, 0, 7, 14], a: o.a || 0.35, hold: dur * 0.6,
        cut: o.cut || 1500, vib: 9, vibR: 5 + i * 0.3, bus: o.bus, wet: 0.5, pan: ms.length > 1 ? (i / (ms.length - 1) - 0.5) * 0.9 : 0 }));
    }
    // a felt piano: a soft hammer, a body that darkens as it rings
    function piano(t, m, v, dur, bus, pan) {
      tone({ t, dur: dur || 1.2, f: mtof(m), v, type: "triangle", a: 0.004, cut: 3200, cutTo: 700, bus, wet: 0.35, pan });
      tone({ t, dur: (dur || 1.2) * 0.4, f: mtof(m) * 2, v: v * 0.3, type: "sine", a: 0.003, cut: 5000, bus, wet: 0.35, pan });
    }
    // a choir "aah": breathy saws through two vowel formants
    function choir(t, ms, dur, v, bus) {
      ms.forEach((m, i) => {
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(v, t + 0.6);
        g.gain.setValueAtTime(v, t + dur * 0.7);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        [[720, 7], [1150, 9]].forEach(([fq, q]) => {
          const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = fq; bp.Q.value = q;
          [-10, 0, 11].forEach((d) => {
            const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(m); o.detune.value = d;
            o.connect(bp); o.start(t); o.stop(t + dur + 0.1);
          });
          bp.connect(g);
        });
        const out = route(g, bus || musicBus, (i % 2 ? 0.35 : -0.35));
        const w = ctx.createGain(); w.gain.value = 0.7; out.connect(w); w.connect(verb);
      });
    }
    function bassNote(t, m, dur, v, bus) {
      tone({ t, dur, f: mtof(m), v, type: "sawtooth", a: 0.006, cut: 520, cutTo: 180, bus });
      tone({ t, dur, f: mtof(m), v: v * 0.8, type: "sine", a: 0.006, cut: 400, bus });
    }

    // ---- the theme ---------------------------------------------------------
    // Chords: a bass root and an upper voicing.
    const CH = {
      Dm: [38, [62, 65, 69]], Bb: [34, [62, 65, 70]], F: [41, [60, 65, 69]], C: [36, [60, 64, 67]],
      Gm: [43, [62, 67, 70]], A: [45, [61, 64, 69]],
    };
    const PROG = ["Dm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A", "Bb", "C", "Dm", "F", "Gm", "C", "F", "A"];
    // The melody, one bar a line: [16th step, note, length in 16ths].
    const MEL = [
      [[0, 74, 4], [4, 69, 2], [6, 74, 2], [8, 76, 4], [12, 77, 4]],
      [[0, 77, 6], [6, 76, 2], [8, 74, 8]],
      [[0, 72, 4], [4, 77, 4], [8, 81, 6], [14, 79, 2]],
      [[0, 79, 12], [12, 76, 2], [14, 77, 2]],
      [[0, 74, 4], [4, 69, 2], [6, 74, 2], [8, 76, 4], [12, 77, 4]],
      [[0, 79, 6], [6, 77, 2], [8, 74, 8]],
      [[0, 82, 4], [4, 81, 4], [8, 79, 4], [12, 77, 4]],
      [[0, 76, 8], [8, 73, 4], [12, 69, 4]],
      [[0, 77, 4], [4, 77, 2], [6, 79, 2], [8, 81, 8]],
      [[0, 79, 4], [4, 76, 4], [8, 72, 8]],
      [[0, 74, 4], [4, 77, 4], [8, 81, 4], [12, 86, 4]],
      [[0, 84, 12], [12, 81, 4]],
      [[0, 82, 6], [6, 81, 2], [8, 79, 4], [12, 74, 4]],
      [[0, 76, 6], [6, 77, 2], [8, 79, 8]],
      [[0, 81, 4], [4, 79, 4], [8, 77, 4], [12, 76, 4]],
      [[0, 76, 8], [8, 73, 4], [12, 76, 4]],
    ];
    const ARP = [0, 1, 2, 3, 2, 1, 2, 3];
    // How full the band is, by pass and bar: 0 piano and strings, 1 with
    // bass and drums, 2 the full band. Every third pass breathes.
    function intensity(pass, b) {
      const k = pass % 3;
      if (k === 0) return pass === 0 ? (b < 4 ? 0 : b < 8 ? 1 : 2) : (b < 2 ? 1 : 2);
      if (k === 1) return 2;
      return b < 12 ? 0 : 1;
    }
    function themeStep(t, s) {
      const sd = stepDur(), bar = Math.floor(s / 16), i = s % 16, b = bar % 16, pass = Math.floor(bar / 16);
      const [root, ch] = CH[PROG[b]];
      const lv = intensity(pass, b);
      if (i === 0) {
        strings(t, lv === 2 ? [ch[0] - 12, ch[1] - 12, ch[2] - 12, ch[0]] : ch.map((m) => m - 12), sd * 16 * 1.04, lv === 2 ? 0.05 : 0.04, { cut: lv === 2 ? 2200 : 1300 });
        if (lv === 2) choir(t, [ch[0], ch[2]], sd * 16 * 1.02, 0.05);
        if (lv >= 1) timp(t, root - 12 + (root < 36 ? 12 : 0), lv === 2 ? 0.2 : 0.12);
        if (lv === 2 && b % 8 === 0) crash(t, 0.08);
      }
      // the piano: an eighth-note arpeggio across the chord
      if (i % 2 === 0) {
        const notes = [ch[0], ch[1], ch[2], ch[0] + 12];
        piano(t, notes[ARP[(i / 2) % 8]] + (lv === 0 ? 0 : 12), lv === 2 ? 0.035 : 0.05, 0.9, null, (i % 4 ? 0.3 : -0.3));
      }
      // bass: a driving, syncopated root
      if (lv >= 1 && [0, 3, 6, 8, 11, 14].indexOf(i) >= 0) bassNote(t, root + (i === 6 || i === 14 ? 12 : 0), sd * 2.2, 0.08);
      // drums
      if (lv >= 1) {
        if (i === 0 || i === 8 || (lv === 2 && i === 10)) kick(t, lv === 2 ? 0.42 : 0.3);
        if (i % 2 === 0) hat(t, i % 4 === 2 ? 0.035 : 0.02, null, lv === 2 && i === 14);
        if (lv === 2 && (i === 4 || i === 12)) snare(t, 0.09);
      }
      // a timpani roll into each half of the tune
      if (lv >= 1 && (b === 7 || b === 15) && i >= 8) timp(t, 33, 0.05 + (i - 8) * 0.025);
      // the melody: bells when it is quiet, a horn, then the brass lead
      const mel = MEL[b];
      for (const [st, m, len] of mel) {
        if (st !== i) continue;
        const dur = len * sd;
        if (lv === 0) bell(t, m, 0.06, null, Math.max(1, dur * 1.4));
        else if (lv === 1) tone({ t, dur: dur * 1.05, f: mtof(m - 12), v: 0.07, type: "sawtooth", detune: 6, a: 0.05, hold: dur * 0.6, cut: 1300, vib: 10, wet: 0.45 });
        else {
          tone({ t, dur: dur * 1.05, f: mtof(m), v: 0.06, type: "sawtooth", detune: 8, a: 0.03, hold: dur * 0.65, cut: 900, cutTo: 2800, cutT: Math.min(dur, 0.25), vib: 12, wet: 0.4, pan: -0.15 });
          tone({ t, dur: dur * 1.05, f: mtof(m - 12), v: 0.045, type: "sawtooth", detune: 10, a: 0.04, hold: dur * 0.65, cut: 1100, vib: 10, wet: 0.4, pan: 0.15 });
        }
      }
    }

    // ---- the question landing ------------------------------------------
    // A 3-3-2 pulse on the root under a minor pad that leans to the flat
    // sixth, a ticking clock. Every question climbs a semitone.
    const PULSE = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0];
    function questionStep(t, s) {
      const bar = Math.floor(s / 16), i = s % 16, k = 45 + level, flat6 = bar % 4 >= 2;
      if (i === 0 && bar % 2 === 0) strings(t, [k, k + 3, k + 7 + (flat6 ? 1 : 0)], stepDur() * 32 * 1.02, 0.035, { cut: 700 + level * 90, a: 0.6 });
      if (PULSE[i]) bassNote(t, k - 12 + (flat6 && i >= 8 ? 1 : 0), 0.22, 0.1);
      if (i % 4 === 0) tone({ t, dur: 0.05, f: i % 8 === 0 ? 1560 : 1170, v: 0.03, type: "sine", cut: 5000, pan: i % 8 ? 0.3 : -0.3 });
      if (i === 0) kick(t, 0.25);
      if (i === 10) kick(t, 0.16);
      if (i % 2 === 1) hat(t, 0.012 + level * 0.002);
    }

    // ---- the reveal bed ---------------------------------------------------
    // Warm and unhurried, in F major, quiet enough for the host to be heard.
    const RPROG = [CH.F, CH.C, CH.Dm, CH.Bb];
    function revealStep(t, s) {
      const sd = stepDur(), bar = Math.floor(s / 16), i = s % 16;
      const [root, ch] = RPROG[bar % 4];
      if (i === 0) {
        strings(t, ch.map((m) => m - 12), sd * 16 * 1.05, 0.03, { cut: 1000, a: 1.2 });
        bassNote(t, root, sd * 16, 0.045);
      }
      if (i === 0 || i === 6 || i === 10) piano(t, ch[[0, 2, 1][[0, 6, 10].indexOf(i)]] + 12, 0.04, 2.2, null, i === 6 ? 0.3 : -0.2);
      if (i === 14 && bar % 2 === 1) bell(t, ch[2] + 24, 0.03, null, 2);
    }

    function stepDur() { return mode === "theme" ? 60 / 100 / 4 : mode === "reveal" ? 60 / 72 / 4 : 60 / (96 + level * 3) / 4; }
    function scheduleStep(t, s) {
      if (mode === "theme") themeStep(t, s);
      else if (mode === "question") questionStep(t, s);
      else if (mode === "reveal") revealStep(t, s);
    }
    function pump() {
      if (!ctx || mode === "off") return;
      while (nextT < ctx.currentTime + 0.2) { scheduleStep(nextT, step); nextT += stepDur(); step++; }
    }
    function setMode(m, lvl) {
      if (lvl != null) level = lvl;
      if (m === mode) return;
      mode = m;
      if (timer) { clearInterval(timer); timer = null; }
      if (!ensure() || m === "off") return;
      unlock();
      // the reveal bed waits for the right-or-wrong sting to ring out
      step = 0; nextT = ctx.currentTime + (m === "reveal" ? 1.8 : 0.06);
      timer = setInterval(pump, 40);
    }
    function setMusic(on) {
      musicOn = !!on;
      if (ctx) musicBus.gain.setTargetAtTime(musicOn ? 0.55 : 0, ctx.currentTime, 0.15);
      if (!musicOn) stopCountdown();
    }
    function setSfx(on) { sfxOn = !!on; }
    // Lower the music while the host speaks.
    function duck(on) { if (ctx && duckG) duckG.gain.setTargetAtTime(on ? 0.38 : 1, ctx.currentTime, on ? 0.12 : 0.6); }
    const T = () => (ensure() ? (unlock(), ctx.currentTime + 0.02) : null);
    const fx = (fn) => { if (!sfxOn) return; const t = T(); if (t != null) fn(t); };
    const mus = (fn) => { if (!musicOn) return; const t = T(); if (t != null) fn(t); };

    // ---- the answer clock ------------------------------------------------
    // A cue in strict time at 120 bpm, counted back from zero so every
    // second's tick lands on a beat and the last bar always resolves on the
    // buzzer, whatever time is left (after a pause it simply starts later in
    // the cue). Chords move i, VI, VII, V a bar at a time. It builds in
    // layers by the seconds left:
    //   always     a string ostinato in eighths, the tick-tock of the clock,
    //              a bass pulse and a timpani on each bar
    //   20 left    kick drum on one and three
    //   16 left    hi-hats
    //   12 left    brass stabs on each bar
    //   10 left    the whole cue lifts a semitone, the kick on every beat,
    //              the bass doubles
    //    8 left    snare on the backbeat, high strings tremolo
    //    3 left    a snare roll into the buzzer and a full-band hit
    // It plays through its own gain so a lock-in or a pause can fade it.
    let cdBus = null;
    function countdown(sec) {
      if (!musicOn || !ensure()) return;
      unlock(); stopCountdown();
      setMode("off");
      const t0 = ctx.currentTime + 0.03, d = Math.max(0.5, sec), end = t0 + d, B = 0.5;
      cdBus = ctx.createGain(); cdBus.gain.value = 1; cdBus.connect(duckG);
      const bus = cdBus, base = 45 + Math.min(level, 9);
      const CPROG = [[0, 0], [-4, 1], [-2, 1], [-5, 1]];
      const N = Math.floor(d / B);
      for (let b = N; b >= 1; b--) {
        const at = end - b * B, L = b * B;
        const p = Math.max(0, Math.min(1, 1 - L / 30));
        const pos = (b - 1) % 4, down = pos === 3;            // 3 = first beat of the bar
        const be = Math.floor((b - 1) / 4);
        const [off, maj] = CPROG[(3 - (be % 4) + 4) % 4];     // the last bar is always V
        const k = base + (L <= 10 ? 1 : 0);
        const r = k + off, third = r + (maj ? 4 : 3), fifth = r + 7;
        // the ostinato
        const pat = [r, fifth, r + 12, fifth];
        for (let e = 0; e < 2; e++) {
          tone({ t: at + e * B / 2, dur: 0.22, f: mtof(pat[((3 - pos) * 2 + e) % 4] - 12), v: 0.06 + p * 0.05, type: "sawtooth", dets: [-7, 7], a: 0.005,
            cut: 700 + p * 2600, bus, pan: e ? 0.35 : -0.35 });
        }
        // the clock: tick on the whole second, tock on the half
        const whole = b % 2 === 0;
        tone({ t: at, dur: 0.06, f: whole ? 1568 : 1175, v: (whole ? 0.05 : 0.03) + p * 0.05, type: "sine", cut: 7000, bus, pan: whole ? -0.2 : 0.2 });
        // bass
        bassNote(at, r - 12, 0.28, 0.08 + p * 0.04, bus);
        if (L <= 10) bassNote(at + B / 2, r - 12, 0.2, 0.08, bus);
        if (down) {
          strings(at, [r, third, fifth], 2.05, 0.03 + p * 0.035, { bus, cut: 600 + p * 2800, a: 0.25 });
          const pc = ((r - 33) % 12 + 12) % 12;
          timp(at, 33 + (pc > 6 ? pc - 12 : pc), 0.12 + p * 0.25, bus);
          if (L <= 12) brass(at, [r - 12, r, third, fifth], 0.5, 0.12 + p * 0.1, bus);
        }
        if ((L <= 20 && (down || pos === 1)) || L <= 10) kick(at, 0.3 + p * 0.25, bus);
        if (L <= 16) { hat(at + B / 2, 0.03, bus); if (L <= 10) hat(at, 0.025, bus); }
        if (L <= 8 && (pos === 2 || pos === 0)) snare(at, 0.08 + p * 0.04, bus);
        if (L <= 8) for (let q = 0; q < 4; q++) tone({ t: at + q * B / 4, dur: 0.11, f: mtof(fifth + 12), v: 0.02 + p * 0.015, type: "sawtooth", dets: [-9, 9], a: 0.004, cut: 4200, bus, pan: 0.4 });
      }
      // the snare roll into zero
      let x = Math.max(t0, end - 3), gap = 0.12;
      while (x < end) { noise({ t: x, dur: 0.06, v: 0.03 + 0.08 * (1 - (end - x) / 3), ft: "bandpass", ff: 2400, q: 0.7, bus }); gap = Math.max(0.03, gap * 0.92); x += gap; }
      // time's up
      const kk = base + 1;
      brass(end, [kk - 12, kk - 5, kk, kk + 3], 1.6, 0.26, bus); kick(end, 0.65, bus); crash(end, 0.12, bus); timp(end, 33 + 1, 0.4, bus);
    }
    function stopCountdown() {
      if (!cdBus || !ctx) return;
      const b = cdBus; cdBus = null;
      b.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
      setTimeout(() => { try { b.disconnect(); } catch (e) {} }, 900);
    }

    return {
      unlock, setMode, setMusic, setSfx, duck, mode: () => mode, countdown, stopCountdown,
      // the opening sting: a timpani roll into the theme's first phrase
      intro: () => mus((t) => {
        for (let i = 0; i < 14; i++) timp(t + i * (0.11 - i * 0.004), 33, 0.08 + i * 0.016, sfxBus);
        const h = t + 1.3;
        brass(h, [38, 50, 57, 62, 65], 2.6, 0.22, sfxBus); kick(h, 0.6, sfxBus); crash(h, 0.14, sfxBus);
        strings(h, [50, 57, 62, 65, 69], 2.8, 0.05, { bus: sfxBus, cut: 2600, a: 0.05 });
        [[0, 74], [0.3, 69], [0.45, 74], [0.6, 76], [0.9, 77]].forEach(([dt, m]) => bell(h + 0.2 + dt, m + 12, 0.07, sfxBus, 1.6));
      }),
      whoosh: () => fx((t) => noise({ t, dur: 0.55, v: 0.12, ft: "bandpass", ff: 300, ffTo: 3200, q: 1.2, a: 0.2, bus: sfxBus, wet: 0.3 })),
      plate: (i) => fx((t) => tone({ t, dur: 0.35, f: mtof(69 + [0, 3, 7, 12][i % 4] + level), v: 0.08, type: "triangle", cut: 4000, bus: sfxBus, wet: 0.3, pan: (i - 1.5) * 0.3 })),
      select: () => fx((t) => { tone({ t, dur: 0.12, f: 660, v: 0.08, type: "square", cut: 2400, bus: sfxBus }); tone({ t: t + 0.06, dur: 0.16, f: 990, v: 0.07, type: "square", cut: 2600, bus: sfxBus }); }),
      lock: () => fx((t) => {
        kick(t, 0.55, sfxBus);
        [45, 52, 57, 64].forEach((m) => tone({ t, dur: 1.3, f: mtof(m + level), v: 0.07, type: "sawtooth", detune: 8, a: 0.008, cut: 1800, cutTo: 300, bus: sfxBus, wet: 0.5 }));
        bell(t + 0.02, 88 + level, 0.06, sfxBus, 1.2);
      }),
      tick: (last) => fx((t) => tone({ t, dur: 0.06, f: last ? 1760 : 1320, v: last ? 0.1 : 0.06, type: "sine", cut: 6000, bus: sfxBus })),
      // five seconds of suspense: a heartbeat, a rising drone, a snare roll
      suspense: (sec) => mus((t) => {
        const d = sec || 5;
        tone({ t, dur: d + 0.4, f: mtof(33 + level), glide: mtof(45 + level), glideT: d, v: 0.12, type: "sawtooth", detune: 14, a: 0.8, hold: d - 1.2, cut: 300, cutTo: 2200, bus: sfxBus });
        strings(t, [57 + level, 60 + level, 64 + level], d + 0.3, 0.035, { bus: sfxBus, cut: 900, a: 1.4 });
        tone({ t, dur: d + 0.4, f: mtof(64 + level), glide: mtof(76 + level), glideT: d, v: 0.03, type: "sine", a: 1, hold: d - 1.6, cut: 5000, bus: sfxBus, wet: 0.5 });
        for (let b = 0; b < d; b++) { kick(t + b, 0.42, sfxBus); kick(t + b + 0.24, 0.3, sfxBus); }
        let x = t + 1.2, gap = 0.16;
        while (x < t + d) { noise({ t: x, dur: 0.07, v: 0.02 + 0.05 * ((x - t) / d), ft: "bandpass", ff: 2200, q: 0.6, bus: sfxBus }); gap = Math.max(0.035, gap * 0.94); x += gap; }
      }),
      correct: () => fx((t) => {
        const k = 57 + level;
        brass(t, [k - 12, k - 5, k, k + 4, k + 7], 2.2, 0.26, sfxBus); kick(t, 0.5, sfxBus); crash(t, 0.08, sfxBus);
        choir(t + 0.05, [k + 4, k + 7, k + 12], 2.2, 0.05, sfxBus);
        [0, 4, 7, 12, 16].forEach((d, i) => bell(t + 0.1 + i * 0.07, k + 12 + d, 0.07, sfxBus));
      }),
      wrong: () => fx((t) => {
        const k = 45 + level;
        [[k, k - 1], [k + 3, k + 2], [k + 6, k + 4]].forEach(([a, b]) => tone({ t, dur: 1.6, f: mtof(a), glide: mtof(b), glideT: 1.2, v: 0.08, type: "sawtooth", detune: 10, a: 0.02, cut: 900, cutTo: 250, bus: sfxBus, wet: 0.4 }));
        kick(t, 0.5, sfxBus); timp(t + 0.02, 33, 0.3, sfxBus);
      }),
      join: () => fx((t) => { tone({ t, dur: 0.25, f: 520, glide: 1040, glideT: 0.12, v: 0.09, type: "sine", cut: 5000, bus: sfxBus }); bell(t + 0.1, 84, 0.07, sfxBus); }),
      count: (n) => fx((t) => { timp(t, n ? 40 : 45, n ? 0.3 : 0.45, sfxBus); if (!n) crash(t, 0.1, sfxBus); }),
      pop: () => fx((t) => tone({ t, dur: 0.12, f: 880 + Math.random() * 400, glide: 1800, glideT: 0.1, v: 0.04, type: "sine", cut: 6000, bus: sfxBus, pan: Math.random() - 0.5 })),
      // the winner's fanfare: the theme's hook in brass, landing in F major
      fanfare: () => mus((t) => {
        const seq = [[38, [62, 65, 69, 74]], [34, [62, 65, 70, 74]], [36, [60, 64, 67, 72]], [41, [65, 69, 72, 77]]];
        seq.forEach(([r, ch], i) => {
          const at = t + i * 0.42, len = i === 3 ? 3.2 : 0.5;
          brass(at, [r].concat(ch), len, i === 3 ? 0.3 : 0.22, sfxBus); timp(at, r - 12 + (r < 36 ? 12 : 0), 0.3, sfxBus);
          if (i === 3) {
            crash(at, 0.14, sfxBus);
            strings(at, [53, 60, 65, 69, 72], 3.4, 0.05, { bus: sfxBus, cut: 3000, a: 0.08 });
            choir(at, [65, 69, 72], 3.2, 0.06, sfxBus);
            [77, 81, 84, 89, 93].forEach((m, j) => bell(at + 0.1 + j * 0.08, m, 0.07, sfxBus, 2));
          }
        });
      }),
    };
  })();

  // =======================================================================
  // THE QUESTION BANK
  // =======================================================================
  // Draw ten: four tier-1, three tier-2, three tier-3, avoiding the ones this
  // browser has asked recently. The answers are shuffled, so a letter means
  // nothing from one show to the next.
  function buildDeck() {
    const bank = CG.AGENDA_QS || [];
    const recent = new Set(ls("cg_agenda_recent") || []);
    const pick = [];
    const used = new Set();
    TIERS.forEach((tier) => {
      const fresh = [], any = [];
      bank.forEach((q, i) => { if (q[1] === tier && !used.has(i)) (recent.has(qKey(q)) ? any : fresh).push(i); });
      const pool = fresh.length ? fresh : any;
      // spread the Goals: prefer a Goal not yet in this show
      const goals = new Set(pick.map((i) => bank[i][0]));
      const spread = pool.filter((i) => !goals.has(bank[i][0]));
      const i = rand(spread.length ? spread : pool);
      used.add(i); pick.push(i);
    });
    const keys = pick.map((i) => qKey(bank[i]));
    const keep = (ls("cg_agenda_recent") || []).filter((k) => keys.indexOf(k) < 0).concat(keys);
    ls("cg_agenda_recent", keep.slice(-Math.max(40, Math.floor(bank.length * 0.7))));
    return pick.map((i) => {
      const q = bank[i];
      const order = shuffle([0, 1, 2, 3]);
      return { g: q[0], t: q[1], q: q[2], a: order.map((k) => q[3][k]), c: order.indexOf(q[4]), f: q[5] || "", s: q[6] || "" };
    });
  }
  function qKey(q) { return q[0] + ":" + q[2].slice(0, 48); }

  // =======================================================================
  // STATE
  // =======================================================================
  //  role  "solo"  this screen is the stage and you are contestant 0
  //        "host"  this screen is the stage of an online show (no contestant)
  //        "phone" this screen is one contestant's private answer pad
  //        "watch" a phone that came too late: it follows along
  const S = {
    role: null, g: null, deck: null, picks: {},
    t0: 0, pk: -1, raf: 0, loop: null, lastTick: -1,
    me: { sel: -1, locked: false, fifty: null, qi: -1 },
    net: { seen: {}, tick: null, lastPut: 0, joinAt: 0, joining: null, hostSeen: 0 },
    aiTimers: [], overlay: null, mounted: false, lastPhase: "",
    talking: false, talkStart: 0, talkEnd: 0, allInAt: 0, autoNext: null,
  };
  // AI vs AI: every seat is an AI contestant and nobody at the screen plays.
  const isAuto = () => !!(S.g && S.g.auto);
  // The seat played at this screen: 0 in solo, none when hosting or watching AIs.
  const meSeat = () => (S.role === "solo" && !isAuto() ? 0 : -1);

  function blankPlayer(i) { return { name: "", ownerId: null, icon: "", color: SEAT_COLORS[i], vacant: true, score: 0, ms: 0, fifty: false, away: false, isAI: false }; }

  function newShow(opts) {
    const g = {
      kind: "agenda", v: 1, id: null, hostId: myId(), seq: 1,
      mode: opts.mode, timer: ANSWER_S, level: opts.level || "sharp",
      seats: opts.seats, players: [],
      qs: [], qi: -1, answers: [], locked: [], phase: "lobby", phaseLen: 0, pk: 0, show: 1, over: false,
    };
    for (let i = 0; i < opts.seats; i++) g.players.push(blankPlayer(i));
    return g;
  }
  const filled = (g) => g.players.filter((p) => !p.vacant);
  const active = (g) => g.players.filter((p) => !p.vacant && !p.away);

  function summaryOf(g) {
    return {
      kind: "agenda", code: g.id, phase: g.phase, qi: g.qi, seats: g.seats, hostId: g.hostId,
      players: filled(g).map((p) => ({ name: p.name, icon: p.icon, color: p.color, score: p.score })),
    };
  }

  // =======================================================================
  // THE HOST ENGINE (solo and host screens)
  // =======================================================================
  const isStage = () => S.role === "solo" || S.role === "host";

  function publish(opts) {
    const g = S.g;
    if (!g || S.role !== "host" || !room()) return;
    g.seq = (g.seq || 0) + 1;
    S.net.lastPut = now();
    room().put(g, opts || null).catch(() => {});
  }
  function saveDeck() { if (S.role === "host" && S.g && S.g.id) ls("cg_agenda_deck_" + S.g.id, { deck: S.deck, picks: S.picks }); }

  function setPhase(phase, len) {
    const g = S.g;
    g.paused = false; g.left = 0;
    g.phase = phase; g.phaseLen = len || 0; g.pk = (g.pk || 0) + 1;
    S.t0 = now(); S.pk = g.pk;
    publish({ summary: phase === "lobby" || phase === "countdown" || phase === "final" });
    onPhase(true);
  }
  // While the host has paused the show, the clock stands still at the time
  // that was left; on resume every screen restarts it from there.
  function elapsed() { const g = S.g; return g && g.paused ? Math.max(0, g.phaseLen - (g.left || 0)) : now() - S.t0; }
  const canPause = (g) => !!g && ["question", "suspense", "reveal"].indexOf(g.phase) >= 0;

  function pauseShow() {
    const g = S.g;
    if (!isStage() || !canPause(g) || g.paused) return;
    g.left = Math.max(0, g.phaseLen - elapsed());
    g.paused = true; g.pz = (g.pz || 0) + 1;
    clearAI();
    SA.stopCountdown(); SA.setMode("off");
    hush();
    SA.select();
    publish();
    paintPause();
  }
  function resumeShow() {
    const g = S.g;
    if (!isStage() || !g || !g.paused) return;
    const left = g.left || 0;
    g.paused = false; g.pz = (g.pz || 0) + 1;
    S.t0 = now() - (g.phaseLen - left);
    S.cdStarted = false; S.lastTick = -1;
    if (g.phase === "question" && S.role === "solo") scheduleAI(g.qi, left);
    SA.select();
    publish();
    musicForPhase();
    paintPause();
  }
  function togglePause() { const g = S.g; if (g && g.paused) resumeShow(); else pauseShow(); }
  // The pause button in the top bar and the curtain over the stage.
  function paintPause() {
    const g = S.g, btn = $("ag-pause");
    if (btn) {
      btn.disabled = !canPause(g);
      btn.classList.toggle("on", !!(g && g.paused));
      btn.textContent = g && g.paused ? "▶" : "⏸";
      btn.title = g && g.paused ? "Resume the show (space)" : "Pause the show (space)";
    }
    const st = $("ag-stage");
    if (!st) return;
    let cur = $("ag-paused");
    if (g && g.paused) {
      if (!cur) {
        cur = el("div", "ag-paused");
        cur.id = "ag-paused";
        const card = el("div", "ag-paused-card", '<div class="ag-paused-ic">⏸</div><h3>Show paused</h3><p>The clock has stopped. Every phone is waiting.</p>');
        const go = el("button", "ag-btn gold big", "Resume the show ▸");
        go.onclick = resumeShow;
        card.appendChild(go);
        card.appendChild(el("small", "", "or press the space bar"));
        cur.appendChild(card);
        st.appendChild(cur);
      }
    } else if (cur) cur.remove();
    st.classList.toggle("is-paused", !!(g && g.paused));
  }

  function startCountdown() {
    const g = S.g;
    if (!S.deck) { S.deck = buildDeck(); S.picks = {}; saveDeck(); }
    g.qs = S.deck.map((d) => ({ g: d.g, t: d.t }));
    g.over = false;
    setPhase("countdown", COUNTDOWN_MS);
  }
  function startQuestion(qi) {
    const g = S.g, d = S.deck[qi];
    g.qi = qi;
    g.qs[qi] = { g: d.g, t: d.t, q: d.q, a: d.a };
    g.locked = g.players.map(() => false);
    S.picks[qi] = S.picks[qi] || {};
    S.allInAt = 0;
    document.querySelectorAll(".ag-pod.score-pop").forEach((n) => n.classList.remove("score-pop"));
    saveDeck();
    setPhase("question", INTRO_MS + g.timer * 1000);
    if (S.role === "solo") scheduleAI(qi);
  }
  function recordPick(qi, p, c, ms, fifty) {
    const g = S.g;
    if (g.phase !== "question" || g.paused || g.qi !== qi || !g.players[p] || g.locked[p]) return false;
    S.picks[qi][p] = { c, ms: Math.max(0, Math.min(ms | 0, g.timer * 1000)) };
    if (fifty) g.players[p].fifty = true;
    g.locked[p] = true;
    saveDeck();
    return true;
  }
  function toSuspense() {
    clearAI();
    setPhase("suspense", SUSPENSE_MS);
  }
  function toReveal() {
    const g = S.g, qi = g.qi, d = S.deck[qi];
    const picks = S.picks[qi] || {};
    g.answers[qi] = g.players.map((p, i) => (picks[i] ? picks[i].c : -1));
    g.players.forEach((p, i) => {
      if (picks[i] && picks[i].c === d.c) { p.score++; p.ms += picks[i].ms; }
    });
    g.qs[qi] = Object.assign({}, g.qs[qi], { c: d.c, f: d.f, s: d.s });
    setPhase("reveal", REVEAL_MS);
  }
  function toFinal() {
    const g = S.g;
    g.over = true;
    setPhase("final", 0);
    if (S.role === "solo" && !g.auto) recordSolo();
    if (S.role === "host") ls("cg_agenda_deck_" + g.id, null);
  }
  function playAgain() {
    const g = S.g;
    stopAutoNext();
    closeOverlay();
    g.players.forEach((p) => { p.score = 0; p.ms = 0; p.fifty = false; });
    g.qi = -1; g.answers = []; g.locked = []; g.show = (g.show || 1) + 1;
    S.deck = null; S.picks = {};
    startCountdown();
  }

  // Runs four times a second on the stage: moves the show along.
  function hostLoop() {
    const g = S.g;
    if (!g || !isStage() || g.paused) return;
    const t = elapsed();
    if (g.phase === "lobby") {
      if (filled(g).length === g.seats) startCountdown();
    } else if (g.phase === "countdown") {
      if (t >= g.phaseLen) startQuestion(0);
    } else if (g.phase === "question") {
      // Players always get the full answer time. When everyone has locked
      // in, the host may choose to reveal early (see revealNow).
      if (t >= g.phaseLen) toSuspense();
      else if (allLocked(g) !== S.allIn) { S.allIn = allLocked(g); updateBoard(); }
      // AI vs AI: once every AI is in and the host has read the question, go on.
      if (g.phase === "question" && isAuto() && allLocked(g) && talkOver()) {
        if (!S.allInAt) S.allInAt = now();
        else if (now() - S.allInAt > 1200) toSuspense();
      }
    } else if (g.phase === "suspense") {
      if (t >= g.phaseLen) toReveal();
    } else if (g.phase === "reveal") {
      // The show waits for the host to finish explaining the answer.
      if (t >= g.phaseLen && talkOver()) { if (g.qi + 1 < QCOUNT) startQuestion(g.qi + 1); else toFinal(); }
    }
  }

  function allLocked(g) {
    const act = g.players.map((p, i) => i).filter((i) => !g.players[i].vacant && !g.players[i].away);
    return act.length > 0 && act.every((i) => g.locked[i]);
  }
  // The host's choice, once every answer is in: skip the rest of the clock.
  function revealNow() {
    const g = S.g;
    if (!isStage() || !g || g.phase !== "question" || g.paused || !allLocked(g)) return;
    SA.select();
    toSuspense();
  }

  // ---- AI contestants (solo) ---------------------------------------------
  function clearAI() { S.aiTimers.forEach(clearTimeout); S.aiTimers = []; }
  function scheduleAI(qi, leftMs) {
    clearAI();
    const g = S.g, d = S.deck[qi], lv = LEVELS[g.level] || LEVELS.sharp;
    g.players.forEach((p, i) => {
      if (!p.isAI || g.locked[i]) return;
      // After a pause, an AI still to answer does so within the time left.
      // In AI vs AI they answer a little quicker, so the show keeps moving.
      const wait = leftMs != null ? randInt(600, Math.max(900, leftMs - 1200))
        : INTRO_MS + (g.auto ? randInt(2500, 15000) : randInt(1800, Math.max(2500, g.timer * 1000 - 1200)));
      S.aiTimers.push(setTimeout(() => {
        if (S.g !== g || g.phase !== "question" || g.qi !== qi) return;
        // When watching AIs, one may spend their 50:50 on a hard question.
        let boost = 0;
        if (g.auto && !p.fifty && d.t >= 2 && Math.random() < (d.t === 3 ? 0.45 : 0.15)) { p.fifty = true; boost = 0.22; toast(`${p.name} plays the 50:50`); }
        const right = Math.random() < lv.acc[d.t - 1] + (p.skill || 0) + boost;
        const c = right ? d.c : rand([0, 1, 2, 3].filter((k) => k !== d.c));
        if (recordPick(qi, i, c, Math.max(0, elapsed() - INTRO_MS), false)) { SA.pop(); paintPods(); updateBoard(); }
      }, wait));
    });
  }

  // ---- the host's ear: phones talking over the live channel -------------
  function onHostLive(m) {
    const g = S.g;
    if (!g || S.role !== "host" || !m || !m.by) return;
    S.net.seen[m.by] = now();
    const idx = g.players.findIndex((p) => !p.vacant && p.ownerId === m.by);
    if (idx >= 0 && g.players[idx].away) { g.players[idx].away = false; publish(); paintPods(); }
    if (m.t === "join") hostJoin(m);
    else if (m.t === "pick" && idx >= 0) {
      if (recordPick(m.qi, idx, m.c | 0, m.ms, !!m.f)) { SA.pop(); publish(); paintPods(); updateBoard(); }
      else if (g.locked[idx] && g.qi === m.qi) publish();   // they missed the confirmation
    } else if (m.t === "react") floatReact(idx, String(m.e || "").slice(0, 4));
    else if (m.t === "leave" && idx >= 0) {
      if (g.phase === "lobby") { g.players[idx] = blankPlayer(idx); toast(`${m.name || "A contestant"} stepped out`); }
      else g.players[idx].away = true;
      publish({ summary: true }); paintAll();
    }
  }
  function hostJoin(m) {
    const g = S.g;
    let idx = g.players.findIndex((p) => !p.vacant && p.ownerId === m.by);
    if (idx < 0) {
      // An open seat can be taken at any point: a latecomer plays from the
      // next question (or this one, if the clock is still running).
      if (g.phase === "final") return;
      idx = g.players.findIndex((p) => p.vacant);
      if (idx < 0) return;
      let name = clean(m.name) || "Contestant";
      const taken = filled(g).map((p) => p.name.toLowerCase());
      if (taken.indexOf(name.toLowerCase()) >= 0) name = name.slice(0, 15) + " " + (idx + 1);
      const icons = filled(g).map((p) => p.icon);
      const icon = AVATARS.indexOf(m.icon) >= 0 && icons.indexOf(m.icon) < 0 ? m.icon : rand(AVATARS.filter((a) => icons.indexOf(a) < 0));
      Object.assign(g.players[idx], { name, ownerId: m.by, icon, vacant: false, away: false, score: 0, ms: 0, fifty: false });
      SA.join();
      if (g.phase !== "lobby") toast(`${name} joins the show`);
      say(g.phase === "lobby" ? `Welcome, ${name}!` : `And joining us now, ${name}!`);
      publish({ summary: true });
      paintAll();
      const pod = $("ag-pod" + idx); if (pod) burst(pod, g.players[idx].color, 26);
    } else publish();
  }

  function hostTick() {
    const g = S.g;
    if (!g || S.role !== "host") return;
    room().sendLive(g.id, { t: "hb", by: myId() });
    const t = now();
    let changed = false;
    g.players.forEach((p) => {
      if (p.vacant || !p.ownerId) return;
      if (!S.net.seen[p.ownerId]) S.net.seen[p.ownerId] = t;
      if (!p.away && t - S.net.seen[p.ownerId] > QUIET_MS) {
        if (g.phase === "lobby") { const i = g.players.indexOf(p); g.players[i] = blankPlayer(i); }
        else p.away = true;
        changed = true;
      }
    });
    if (changed) { publish({ summary: true }); paintAll(); }
    else if (t - S.net.lastPut > 45000) publish({ summary: true });   // keep the show in the list
  }

  // =======================================================================
  // THE PHONE
  // =======================================================================
  const mySeat = () => (S.g ? S.g.players.findIndex((p) => !p.vacant && p.ownerId === myId()) : -1);
  function phoneLive(m) {
    if (!m || m.by === myId()) return;
    if (S.g && m.by === S.g.hostId) S.net.hostSeen = now();
  }
  function sendLive(msg) {
    if (!S.g || !room()) return;
    msg.by = myId();
    room().sendLive(S.g.id, msg);
  }
  function phoneTick() {
    const g = S.g;
    if (!g || (S.role !== "phone" && S.role !== "watch")) return;
    sendLive({ t: "hb" });
    const seat = mySeat();
    if (S.net.joining && seat < 0) {
      if (now() - S.net.joinAt > 12000) { S.net.joining = null; paintPhone(true); }
      else sendLive({ t: "join", name: S.net.joining.name, icon: S.net.joining.icon });
    }
    if (seat >= 0 && g.phase === "question" && S.me.locked && S.me.qi === g.qi && !g.locked[seat]) sendPick();
    const quiet = S.net.hostSeen && now() - S.net.hostSeen > 15000;
    const w = $("ag-ph-warn"); if (w) w.classList.toggle("on", !!quiet);
  }
  function sendPick() {
    const g = S.g;
    sendLive({ t: "pick", qi: g.qi, c: S.me.sel, ms: S.me.ms, f: S.me.fifty ? 1 : 0 });
  }

  // Every state the host publishes lands here (phones and watchers).
  function applyRemote(ng) {
    if (!S.mounted || (S.role !== "phone" && S.role !== "watch")) return;
    if (!ng) { showGone(); return; }
    if (S.g && ng.seq && S.g.seq && ng.seq < S.g.seq && ng.show === S.g.show) return;
    const was = S.g;
    S.g = ng;
    S.net.hostSeen = now();
    const seat = mySeat();
    if (S.net.joining && seat >= 0) { S.net.joining = null; S.role = "phone"; SA.join(); buzz(30); }
    if (!was || ng.pk !== S.pk) { S.pk = ng.pk; S.t0 = now(); S.pz = ng.pz; onPhase(false); }
    else paintPhone(false);
    if (ng.pz !== S.pz) {
      S.pz = ng.pz;
      if (!ng.paused) S.t0 = now() - (ng.phaseLen - (ng.left || 0));
      buzz(25);
    }
    paintPhonePause();
  }

  // =======================================================================
  // PHASES: what every screen does when the show moves on
  // =======================================================================
  function onPhase(local) {
    const g = S.g;
    if (!g) return;
    if (g.qi !== S.me.qi && g.phase === "question") { S.me = { sel: -1, locked: false, fifty: null, qi: g.qi, ms: 0 }; }
    S.lastTick = -1; S.cdStarted = false;
    if (g.phase !== "question") SA.stopCountdown();
    if (isStage()) stagePhase(); else paintPhone(true);
  }

  // =======================================================================
  // SCREENS: title, setups, join
  // =======================================================================
  function teardown() {
    clearAI();
    stopAutoNext();
    stopList();
    if (S.loop) { clearInterval(S.loop); S.loop = null; }
    if (S.net.tick) { clearInterval(S.net.tick); S.net.tick = null; }
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    if (room() && S.g && S.g.id) { room().unwatch(); room().offLive(); }
    closeOverlay(true);
    SA.setMode("off");
    S.mounted = false; S.role = null; S.g = null; S.deck = null; S.picks = {}; S.net.joining = null;
    hush(); S.talking = false;
    window.removeEventListener("resize", fitStage);
  }
  function setQuery(key, val) {
    try {
      const u = new URL(location.href);
      ["room", "host"].forEach((k) => u.searchParams.delete(k));
      if (key) u.searchParams.set(key, val);
      history.replaceState(null, "", u.toString());
    } catch (e) {}
  }
  function queryParam(k) { try { return new URL(location.href).searchParams.get(k) || ""; } catch (e) { return ""; } }

  // The host's patter: a different way in to each question.
  const ORD = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  function questionIntro(qi, tier) {
    const n = ORD[qi] || String(qi + 1);
    if (qi === 0) return rand(["Here's your first question.", "Question one, for the warm-up."]);
    if (qi === QCOUNT - 1) return rand(["The final question.", "Question ten… the last one."]);
    if (qi === 4) return `Question five. Things get harder from here.`;
    if (qi === 7) return `Question eight. This is for the brave.`;
    return rand([`Question ${n}.`, `Here's question ${n}.`, `On to question ${n}.`, tier === 3 ? `Question ${n}. Take a deep breath.` : `Question ${n}, coming up.`]);
  }

  function wheelSvg(cls, centre) {
    const R = 50, r = 31, n = 17;
    let paths = "";
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 - Math.PI / 2 + 0.012, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2 - 0.012;
      const p = (rad, a) => `${(60 + rad * Math.cos(a)).toFixed(2)},${(60 + rad * Math.sin(a)).toFixed(2)}`;
      paths += `<path d="M${p(R, a0)} A${R},${R} 0 0 1 ${p(R, a1)} L${p(r, a1)} A${r},${r} 0 0 0 ${p(r, a0)} Z" fill="${GOAL(i + 1).color}"/>`;
    }
    return `<svg class="${cls || ""}" viewBox="0 0 120 120" aria-hidden="true"><g class="ag-wheel-spin">${paths}</g>${centre || ""}</svg>`;
  }

  function toggle(label, on, fn) {
    const b = el("button", "ag-chip" + (on ? " on" : ""), label);
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.onclick = () => { const v = b.classList.toggle("on"); b.setAttribute("aria-pressed", v ? "true" : "false"); SA.select(); fn(v); };
    return b;
  }
  function seg(values, cur, onPick, label) {
    const row = el("div", "ag-seg");
    values.forEach((v) => {
      const b = el("button", v === cur ? "on" : "", label ? label(v) : String(v));
      b.onclick = () => { row.querySelectorAll("button").forEach((x) => x.classList.remove("on")); b.classList.add("on"); SA.select(); onPick(v); };
      row.appendChild(b);
    });
    return row;
  }
  function screen(cls) {
    const root = app(); root.innerHTML = "";
    const wrap = el("div", "ag-screen " + (cls || ""));
    wrap.appendChild(el("div", "ag-bg", `<i class="ag-beam b1"></i><i class="ag-beam b2"></i><i class="ag-beam b3"></i><i class="ag-stars"></i>`));
    const inner = el("div", "ag-inner");
    wrap.appendChild(inner);
    root.appendChild(wrap);
    return inner;
  }
  function backBtn(label, fn) {
    const b = el("button", "ag-back", label);
    b.onclick = () => { SA.select(); fn(); };
    return b;
  }
  function nudge(input) {
    if (!input) return;
    input.focus(); input.classList.add("ag-shake");
    setTimeout(() => input.classList.remove("ag-shake"), 500);
  }

  function show() {
    // A phone that scanned a code goes straight to the door.
    const code = queryParam("room").toUpperCase(), hostCode = queryParam("host").toUpperCase();
    if (hostCode) return resumeHost(hostCode);
    if (code) return renderJoin(code);
    renderTitle();
  }

  function renderTitle() {
    teardown(); setQuery(null);
    const w = screen("ag-title");
    w.appendChild(backBtn("← Games", () => CG.Platform.show()));
    const logo = el("div", "ag-logo");
    logo.innerHTML = wheelSvg("ag-logo-wheel", `<text x="60" y="57" class="ag-logo-y">2030</text><text x="60" y="72" class="ag-logo-s">AGENDA</text>`);
    w.appendChild(logo);
    w.appendChild(el("h1", "ag-h1", "Agenda 2030"));
    w.appendChild(el("p", "ag-sub", "The Global Goals quiz show"));
    w.appendChild(el("p", "ag-tag",
      "Ten questions on the Sustainable Development Goals, each harder than the last. Up to five contestants answer in secret. " +
      "Five seconds of suspense. Then the lights tell the truth."));

    const modes = el("div", "ag-modes");
    const card = (ic, t, b, cls, go) => {
      const c = el("button", "ag-mode " + (cls || ""));
      c.innerHTML = `<span class="ag-mode-ic">${ic}</span><span class="ag-mode-t">${t}</span><span class="ag-mode-b">${b}</span>`;
      c.onclick = () => { SA.unlock(); SA.select(); go(); };
      modes.appendChild(c);
    };
    card("📺", "Host a show", "Put this screen on the wall. Players scan the QR code with their phones and the show starts when every seat is taken.", "hero", renderHostSetup);
    card("📱", "Join a show", "Got a code, or a show on the big screen? Join from your phone and answer in secret.", "", () => renderJoin(""));
    card("🤖", "Play solo", "You against up to four AI contestants, right here.", "", renderSoloSetup);
    card("🎬", "AI vs AI", "Sit back and watch two to five AI contestants play the show on their own. Good for a screen in the hall.", "", renderAutoSetup);
    w.appendChild(modes);

    const tg = el("div", "ag-toggles");
    tg.appendChild(toggle("🎵 Music", settings.music, (on) => { settings.music = on; saveSettings(); SA.setMusic(on); }));
    tg.appendChild(toggle("🔊 Effects", settings.sfx, (on) => { settings.sfx = on; saveSettings(); SA.setSfx(on); }));
    tg.appendChild(toggle("🎙️ Host voice", settings.voice, (on) => { settings.voice = on; saveSettings(); if (CG.Narrate) CG.Narrate.setEnabled(on); }));
    w.appendChild(tg);

    if (CG.Narrate && CG.Narrate.voices && CG.Narrate.supported()) w.appendChild(voicePicker());

    const how = el("button", "ag-link", "How it works");
    how.onclick = showHowTo;
    w.appendChild(how);
    const st = stats();
    if (st.shows) w.appendChild(el("p", "ag-record", `<b>Your record</b> · ${st.shows} show${st.shows === 1 ? "" : "s"} · ${st.wins} won · ${st.right} of ${st.asked} right · best ${st.best}/10`));
    const n = (CG.AGENDA_QS || []).length;
    w.appendChild(el("p", "ag-credit", `${n} questions, each checked against official UN sources. Music is generated live in your browser.`));
    SA.setMode(settings.music ? "theme" : "off");
  }

  function renderHostSetup() {
    teardown();
    const w = screen("ag-setup");
    w.appendChild(backBtn("← Back", renderTitle));
    w.appendChild(el("div", "ag-mini-logo", wheelSvg("", "")));
    w.appendChild(el("h1", "ag-h2", "Host a show"));
    w.appendChild(el("p", "ag-tag", "This screen becomes the stage. Each contestant joins on their own phone by scanning the code."));
    let seats = settings.seats;
    w.appendChild(el("p", "ag-label", "How many contestants?"));
    const seatNote = el("p", "ag-note");
    const seatPaint = () => { seatNote.innerHTML = seats === 1 ? "One contestant against the clock." : `The show starts when the <b>${seats}th</b> player joins.`.replace("2th", "2nd").replace("3th", "3rd"); };
    w.appendChild(seg([1, 2, 3, 4, 5], seats, (v) => { seats = v; seatPaint(); }, (v) => `<b>${v}</b> ${v === 1 ? "player" : "players"}`));
    seatPaint(); w.appendChild(seatNote);
    w.appendChild(el("p", "ag-note", `Every question gives ${ANSWER_S} seconds to answer. You can still add or remove seats on the QR screen while people join, or start early.`));
    const go = el("button", "ag-btn gold big", "Open the show ▸");
    go.onclick = async () => {
      SA.unlock();
      if (!room()) return flash("Online play is unavailable here. Try solo.");
      settings.seats = seats; saveSettings();
      go.disabled = true; go.textContent = "Opening the studio…";
      try {
        const g = newShow({ mode: "host", seats });
        let code = "";
        for (let i = 0; i < 8; i++) { code = makeCode(); if (!(await room().has(code))) break; }
        await room().create(g, { id: code });
        enterHost(g);
      } catch (e) {
        go.disabled = false; go.textContent = "Open the show ▸";
        flash("Could not reach the show servers. Check the connection and try again.");
      }
    };
    w.appendChild(go);
  }
  function makeCode() { let s = ""; for (let i = 0; i < 5; i++) s += CODE_ABC[Math.floor(Math.random() * CODE_ABC.length)]; return s; }

  function renderSoloSetup() {
    teardown();
    const w = screen("ag-setup");
    w.appendChild(backBtn("← Back", renderTitle));
    w.appendChild(el("div", "ag-mini-logo", wheelSvg("", "")));
    w.appendChild(el("h1", "ag-h2", "Play solo"));
    let rivals = settings.rivals, level = settings.level, icon = settings.avatar || AVATARS[0];
    w.appendChild(el("p", "ag-label", "Your name"));
    const name = el("input", "ag-input"); name.maxLength = 18; name.placeholder = "Your name";
    name.value = settings.name || (CG.Net && CG.Net.getName ? CG.Net.getName() : "") || "";
    w.appendChild(name);
    w.appendChild(el("p", "ag-label", "Your avatar"));
    w.appendChild(avatarPicker(icon, (a) => { icon = a; }));
    w.appendChild(el("p", "ag-label", "AI contestants"));
    w.appendChild(seg([1, 2, 3, 4], rivals, (v) => { rivals = v; }));
    w.appendChild(el("p", "ag-label", "How good are they?"));
    const note = el("p", "ag-note", LEVELS[level].blurb);
    w.appendChild(seg(Object.keys(LEVELS), level, (v) => { level = v; note.textContent = LEVELS[v].blurb; }, (v) => LEVELS[v].label));
    w.appendChild(note);
    w.appendChild(el("p", "ag-note", `${ANSWER_S} seconds on the clock for every question.`));
    const go = el("button", "ag-btn gold big", "Lights, camera ▸");
    go.onclick = () => {
      const nm = clean(name.value);
      if (!nm) return nudge(name);
      Object.assign(settings, { rivals, level, avatar: icon, name: nm }); saveSettings();
      SA.unlock();
      const g = newShow({ mode: "solo", seats: rivals + 1, level });
      Object.assign(g.players[0], { name: nm, icon, vacant: false, ownerId: myId() });
      const names = shuffle(CG.AGENT_NAMES || ["Amara", "Diego", "Mei", "Kofi", "Leila"]).filter((n) => n.toLowerCase() !== nm.toLowerCase());
      const icons = shuffle(AVATARS.filter((a) => a !== icon));
      for (let i = 1; i <= rivals; i++) Object.assign(g.players[i], { name: names[i - 1], icon: icons[i - 1], vacant: false, isAI: true, skill: (Math.random() - 0.5) * 0.12 });
      enterSolo(g);
    };
    w.appendChild(go);
  }
  // AI vs AI: pick how many contestants and how good; the show runs itself.
  function renderAutoSetup() {
    teardown();
    const w = screen("ag-setup");
    w.appendChild(backBtn("← Back", renderTitle));
    w.appendChild(el("div", "ag-mini-logo", wheelSvg("", "")));
    w.appendChild(el("h1", "ag-h2", "AI vs AI"));
    w.appendChild(el("p", "ag-tag", "Watch the AI contestants play the whole show, with the host, the music and the facts. When it ends, the next show starts by itself."));
    let count = Math.max(2, Math.min(5, settings.autoSeats || 4)), level = settings.level;
    w.appendChild(el("p", "ag-label", "How many AI contestants?"));
    w.appendChild(seg([2, 3, 4, 5], count, (v) => { count = v; }));
    w.appendChild(el("p", "ag-label", "How good are they?"));
    const note = el("p", "ag-note", LEVELS[level].blurb);
    w.appendChild(seg(Object.keys(LEVELS), level, (v) => { level = v; note.textContent = LEVELS[v].blurb; }, (v) => LEVELS[v].label));
    w.appendChild(note);
    w.appendChild(el("p", "ag-note", "Press the space bar to pause at any time."));
    const go = el("button", "ag-btn gold big", "Roll the show ▸");
    go.onclick = () => {
      Object.assign(settings, { autoSeats: count, level }); saveSettings();
      SA.unlock();
      const g = newShow({ mode: "solo", seats: count, level });
      g.auto = true;
      const names = shuffle(CG.AGENT_NAMES || ["Amara", "Diego", "Mei", "Kofi", "Leila"]);
      const icons = shuffle(AVATARS);
      g.players.forEach((p, i) => Object.assign(p, { name: names[i] || "AI " + (i + 1), icon: icons[i], vacant: false, isAI: true, skill: (Math.random() - 0.5) * 0.14 }));
      enterSolo(g);
    };
    w.appendChild(go);
  }
  // Pick the host's voice from what this device offers (best first).
  function voicePicker() {
    const box = el("div", "ag-voice");
    const fill = () => {
      const list = CG.Narrate.voices();
      box.innerHTML = "";
      if (!list.length) return;
      box.appendChild(el("span", "ag-voice-l", "Voice"));
      const sel = el("select", "ag-voice-s");
      list.slice(0, 24).forEach((v) => {
        const o = el("option", "", esc(v.name.replace(/^Microsoft |^Google /, "").replace(/ - English.*$/, "")) + (v.natural ? " ★" : ""));
        o.value = v.name; if (v.name === CG.Narrate.voiceName()) o.selected = true;
        sel.appendChild(o);
      });
      sel.onchange = () => { CG.Narrate.setVoice(sel.value); CG.Narrate.sample(); };
      box.appendChild(sel);
      const t = el("button", "ag-chip", "▶ Listen");
      t.onclick = () => CG.Narrate.sample();
      box.appendChild(t);
    };
    fill();
    if (window.speechSynthesis) window.speechSynthesis.addEventListener("voiceschanged", () => { if (box.isConnected) fill(); });
    return box;
  }

  function avatarPicker(cur, onPick) {
    const row = el("div", "ag-avatars");
    AVATARS.forEach((a) => {
      const b = el("button", a === cur ? "on" : "", a);
      b.onclick = () => { row.querySelectorAll("button").forEach((x) => x.classList.remove("on")); b.classList.add("on"); SA.pop(); onPick(a); };
      row.appendChild(b);
    });
    return row;
  }
  function flash(msg) {
    const t = el("div", "ag-flash", esc(msg));
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  // ---- joining: the door a phone walks through ---------------------------
  let listTimer = null, listGen = 0;
  function stopList() { listGen++; if (listTimer) { clearTimeout(listTimer); listTimer = null; } }

  function renderJoin(code) {
    teardown();
    const w = screen("ag-join");
    w.appendChild(backBtn("← Back", () => { setQuery(null); renderTitle(); }));
    w.appendChild(el("div", "ag-mini-logo", wheelSvg("", "")));
    w.appendChild(el("h1", "ag-h2", code ? "You're invited" : "Join a show"));
    if (code) w.appendChild(el("p", "ag-codeline", `Show <b>${esc(code)}</b>`));
    else w.appendChild(el("p", "ag-tag", "Type the five-letter code from the big screen, or pick an open show below."));

    let codeIn = null;
    if (!code) {
      codeIn = el("input", "ag-input ag-code-in"); codeIn.maxLength = 5; codeIn.placeholder = "CODE";
      codeIn.autocapitalize = "characters"; codeIn.autocomplete = "off"; codeIn.spellcheck = false;
      codeIn.oninput = () => { codeIn.value = codeIn.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); };
      w.appendChild(codeIn);
    }
    w.appendChild(el("p", "ag-label", "Your name"));
    const name = el("input", "ag-input"); name.maxLength = 18; name.placeholder = "What should the host call you?";
    name.value = settings.name || (CG.Net && CG.Net.getName ? CG.Net.getName() : "") || "";
    w.appendChild(name);
    let icon = settings.avatar || rand(AVATARS);
    w.appendChild(el("p", "ag-label", "Pick your avatar"));
    w.appendChild(avatarPicker(icon, (a) => { icon = a; }));
    const go = el("button", "ag-btn gold big", "I'm in ▸");
    const enter = () => {
      const c = code || (codeIn && codeIn.value.trim().toUpperCase());
      const nm = clean(name.value);
      if (!c || c.length < 5) return nudge(codeIn);
      if (!nm) return nudge(name);
      settings.name = nm; settings.avatar = icon; saveSettings();
      if (CG.Net && CG.Net.setName) CG.Net.setName(nm);
      SA.unlock();
      go.disabled = true; go.textContent = "Finding the studio…";
      joinShow(c, nm, icon).catch(() => { go.disabled = false; go.textContent = "I'm in ▸"; });
    };
    go.onclick = enter;
    name.onkeydown = (e) => { if (e.key === "Enter") enter(); };
    w.appendChild(go);

    if (!code) {
      w.appendChild(el("p", "ag-label", "Open shows"));
      const list = el("div", "ag-shows", `<div class="ag-empty">Looking for shows…</div>`);
      w.appendChild(list);
      const load = async () => {
        if (!room()) { list.innerHTML = `<div class="ag-empty">Online play is unavailable here.</div>`; return; }
        try {
          const rooms = (await room().list({ readOnly: true })).filter((r) => r.kind === "agenda");
          if (!list.isConnected) return;
          if (!rooms.length) { list.innerHTML = `<div class="ag-empty">No open shows right now. Ask someone to host one, or play solo.</div>`; return; }
          list.innerHTML = "";
          rooms.forEach((r) => {
            const open = r.phase === "lobby" && (r.players || []).length < r.seats;
            const row = el("button", "ag-show-row" + (open ? "" : " busy"));
            row.innerHTML = `<span class="ag-show-code">${esc(r.code || r.id)}</span>` +
              `<span class="ag-show-who">${(r.players || []).map((p) => `<i style="--c:${p.color}">${p.icon}</i>`).join("") || "<small>empty studio</small>"}</span>` +
              `<span class="ag-show-st">${open ? `${(r.players || []).length}/${r.seats} · join` : r.phase === "final" ? "finished" : "on air"}</span>`;
            row.onclick = () => { if (!open) return flash("That show is already on air."); codeIn.value = r.code || r.id; SA.select(); name.focus(); };
            list.appendChild(row);
          });
        } catch (e) { if (list.isConnected) list.innerHTML = `<div class="ag-empty">Could not reach the shows. Check the connection.</div>`; }
      };
      load();
      const gen = ++listGen;
      const tick = () => { listTimer = setTimeout(() => { if (gen !== listGen) return; load(); tick(); }, 4000); };
      tick();
    }
    setTimeout(() => { try { (code ? name : codeIn).focus(); } catch (e) {} }, 60);
  }

  async function joinShow(code, nm, icon) {
    if (!room()) { flash("Online play is unavailable here."); throw new Error("no net"); }
    let g = null;
    try { g = await room().get(code); } catch (e) { g = null; }
    if (!g || g.kind !== "agenda") { flash(`No show called ${code} is on air.`); throw new Error("none"); }
    stopList();
    setQuery("room", code);
    const seated = g.players.some((p) => !p.vacant && p.ownerId === myId());
    S.role = seated ? "phone" : (g.phase !== "final" && g.players.some((p) => p.vacant)) ? "phone" : "watch";
    S.g = g; S.pk = g.pk; S.t0 = now();
    if (!seated && S.role === "phone") { S.net.joining = { name: nm, icon }; S.net.joinAt = now(); }
    mountPhone();
    room().watch(code, applyRemote);
    room().onLive(code, phoneLive);
    S.net.tick = setInterval(phoneTick, 1500);
    if (S.net.joining) sendLive({ t: "join", name: nm, icon });
    if (S.role === "watch") toast("Every seat is taken. You're watching; if a seat opens, you can jump in.");
  }

  // =======================================================================
  // ENTERING THE STAGE
  // =======================================================================
  function enterSolo(g) {
    teardown();
    S.role = "solo"; S.g = g; S.deck = null; S.picks = {};
    mountStage();
    S.loop = setInterval(hostLoop, 200);
    startCountdown();
  }
  function enterHost(g) {
    teardown();
    S.role = "host"; S.g = g;
    const saved = ls("cg_agenda_deck_" + g.id);
    S.deck = saved ? saved.deck : null; S.picks = (saved && saved.picks) || {};
    setQuery("host", g.id);
    mountStage();
    room().watch(g.id, (ng) => { if (!ng && S.role === "host") { toast("The show was closed"); setTimeout(renderTitle, 1200); } });
    room().onLive(g.id, onHostLive);
    S.loop = setInterval(hostLoop, 200);
    S.net.tick = setInterval(hostTick, 2500);
    S.net.lastPut = now();
    S.t0 = now(); S.pk = g.pk;
    stagePhase();
    loadQR().then(paintQR).catch(paintQR);
  }
  async function resumeHost(code) {
    const w = screen("ag-setup");
    w.appendChild(el("p", "ag-tag", "Reconnecting the studio…"));
    let g = null;
    try { g = room() ? await room().get(code) : null; } catch (e) { g = null; }
    if (!g || g.hostId !== myId()) { setQuery(null); return renderTitle(); }
    enterHost(g);
    if (g.phase !== "lobby" && g.phase !== "final" && !S.deck) {   // the answers were lost with the page
      g.phase = "lobby"; toast("The studio lost its cue cards. Starting a fresh show with the same players.");
      startCountdown();
    } else if (g.phase !== "lobby" && g.phase !== "final") {
      // pick up where we were, with fresh time on the clock
      if (g.phase === "question") { S.picks[g.qi] = S.picks[g.qi] || {}; setPhase("question", INTRO_MS + g.timer * 1000); }
      else if (g.phase === "suspense") toReveal();
      else setPhase(g.phase, g.phase === "countdown" ? COUNTDOWN_MS : REVEAL_MS);
    }
  }

  // =======================================================================
  // THE STAGE (solo and host)
  // =======================================================================
  function mountStage() {
    const root = app(); root.innerHTML = "";
    const st = el("div", "ag-stage" + (S.role === "solo" ? " solo" : " hosting"));
    st.id = "ag-stage";
    st.innerHTML =
      `<div class="ag-bg"><i class="ag-beam b1"></i><i class="ag-beam b2"></i><i class="ag-beam b3"></i><i class="ag-stars"></i><i class="ag-floor"></i></div>` +
      `<header class="ag-top">` +
        `<div class="ag-top-l"><button class="ag-ic" id="ag-quit" title="Leave the show">✕</button>` +
          `<div class="ag-brand">${wheelSvg("ag-brand-wheel", "")}<b>Agenda 2030</b></div></div>` +
        `<div class="ag-top-c" id="ag-prog"></div>` +
        `<div class="ag-top-r">` +
          (S.role === "host" ? `<span class="ag-codechip" id="ag-codechip"></span>` : "") +
          (isAuto() ? `<span class="ag-codechip">🤖 <b>AI vs AI</b></span>` : "") +
          `<button class="ag-ic ag-pause" id="ag-pause" title="Pause the show (space)">⏸</button>` +
          `<button class="ag-ic${settings.music ? " on" : ""}" id="ag-music" title="Music">🎵</button>` +
          `<button class="ag-ic${settings.voice ? " on" : ""}" id="ag-voice" title="Host voice">🎙️</button>` +
        `</div>` +
      `</header>` +
      `<main class="ag-main">` +
        `<section class="ag-centre" id="ag-centre"></section>` +
        `<aside class="ag-ladder" id="ag-ladder"></aside>` +
      `</main>` +
      `<footer class="ag-pods" id="ag-pods"></footer>` +
      (S.role === "host" ? `<div class="ag-miniqr" id="ag-miniqr"></div>` : "") +
      `<div class="ag-fx" id="ag-fx"></div><div class="ag-toasts" id="ag-toasts"></div>`;
    root.appendChild(st);
    S.mounted = true;
    $("ag-quit").onclick = confirmLeave;
    $("ag-pause").onclick = togglePause;
    if (!keyHooked) {
      keyHooked = true;
      document.addEventListener("keydown", (e) => {
        if (!isStage() || !S.mounted || !$("ag-stage")) return;
        if (e.target && /input|textarea|select|button/i.test(e.target.tagName)) return;
        if (e.code === "Space" || e.key === "p" || e.key === "P") { e.preventDefault(); togglePause(); }
      });
    }
    $("ag-music").onclick = (e) => { settings.music = !settings.music; saveSettings(); SA.setMusic(settings.music); e.currentTarget.classList.toggle("on", settings.music); if (settings.music) musicForPhase(); };
    $("ag-voice").onclick = (e) => { settings.voice = !settings.voice; saveSettings(); if (CG.Narrate) { CG.Narrate.setEnabled(settings.voice); } if (!settings.voice) hush(); e.currentTarget.classList.toggle("on", settings.voice); };
    if (CG.Narrate) CG.Narrate.setEnabled(settings.voice);
    SA.setMusic(settings.music); SA.setSfx(settings.sfx);
    window.addEventListener("resize", fitStage);
    startRaf();
  }
  let keyHooked = false;
  function fitStage() { /* layout is pure CSS; kept for symmetry with other games */ }

  function musicForPhase() {
    const g = S.g;
    if (!g) return;
    const lvl = Math.max(0, g.qi);
    if (g.phase === "lobby" || g.phase === "final") SA.setMode("theme");
    else if (g.phase === "question") SA.setMode(S.cdStarted ? "off" : "question", lvl);
    else if (g.phase === "reveal") SA.setMode("reveal", lvl);
    else SA.setMode("off", lvl);
  }

  function stagePhase() {
    const g = S.g;
    if (!g || !S.mounted) return;
    const st = $("ag-stage");
    st.dataset.phase = g.phase;
    musicForPhase();
    paintAll();
    if (g.phase === "countdown") showCountdown();
    else if (g.phase === "question") {
      closeOverlay();
      SA.whoosh();
      const d = g.qs[g.qi];
      [0, 1, 2, 3].forEach((i) => setTimeout(() => { if (S.g === g && g.phase === "question") SA.plate(i); }, 900 + i * 260));
      say(`${questionIntro(g.qi, d.t)} ${d.q}`);
    } else if (g.phase === "suspense") {
      SA.suspense(SUSPENSE_MS / 1000);
      say(rand(["Final answers are in.", "Everyone's locked in. Let's see…", "No more changes now. Here it comes…", "The answers are in. Lights down…"]));
    } else if (g.phase === "reveal") {
      revealFx();
    } else if (g.phase === "final") {
      showFinal();
    }
  }

  function paintAll() {
    if (!S.mounted) return;
    if (isStage()) { paintTop(); paintCentre(); paintLadder(); paintPods(); }
    else paintPhone(false);
  }

  function paintTop() {
    const g = S.g, p = $("ag-prog");
    if (!p) return;
    if (g.phase === "lobby") p.innerHTML = `<span class="ag-onair">● ON AIR SOON</span>`;
    else if (g.phase === "countdown") p.innerHTML = `<span class="ag-onair live">● LIVE</span>`;
    else if (g.phase === "final") p.innerHTML = `<span class="ag-onair live">● THE RESULTS</span>`;
    else {
      const d = g.qs[g.qi] || {};
      p.innerHTML = `<span class="ag-qn">Question <b>${g.qi + 1}</b> of ${QCOUNT}</span><span class="ag-tier t${d.t}">${TIER_NAMES[d.t] || ""}</span>`;
    }
    const cc = $("ag-codechip");
    if (cc) cc.innerHTML = `Join · <b>${esc(g.id)}</b>`;
    paintMiniQR();
    paintPause();
  }

  function paintCentre() {
    const g = S.g, c = $("ag-centre");
    if (!c) return;
    if (g.phase === "lobby") return paintLobby(c);
    if (g.phase === "countdown") { c.innerHTML = ""; c.dataset.key = ""; return; }
    if (g.phase === "final") { c.innerHTML = ""; c.dataset.key = ""; return; }
    const d = g.qs[g.qi];
    if (!d) return;
    const goal = GOAL(d.g);
    const key = g.qi + ":" + g.phase;
    if (c.dataset.key === g.qi + "" && c.querySelector(".ag-board")) { updateBoard(); return; }
    c.dataset.key = g.qi + "";
    c.innerHTML =
      `<div class="ag-board">` +
        `<div class="ag-emblem" style="--goal:${goal.color}">` +
          `<svg class="ag-timer" viewBox="0 0 120 120"><circle cx="60" cy="60" r="56" class="ag-timer-bg"/><circle cx="60" cy="60" r="56" class="ag-timer-fg" id="ag-timer-fg"/></svg>` +
          wheelSvg("ag-em-wheel", `<circle cx="60" cy="60" r="28" class="ag-em-hub"/><text x="60" y="58" class="ag-em-goal" id="ag-em-lab">${d.g ? "SDG" : "2030"}</text><text x="60" y="76" class="ag-em-num" id="ag-secs">${d.g || "★"}</text>`) +
        `</div>` +
        `<div class="ag-goal-tag" style="--goal:${goal.color}">${d.g ? `SDG ${d.g} · ` : ""}${esc(goal.name)}</div>` +
        `<div class="ag-q"><span>${esc(d.q)}</span></div>` +
        `<div class="ag-plates" id="ag-plates">${d.a.map((a, i) =>
          `<button class="ag-plate" id="ag-plate${i}" style="--d:${i}"><span class="ag-pl-l">${LETTERS[i]}</span><span class="ag-pl-t">${esc(a)}</span><span class="ag-pl-who" id="ag-who${i}"></span></button>`).join("")}</div>` +
        `<div class="ag-under" id="ag-under"></div>` +
      `</div>`;
    if (meSeat() === 0) {
      d.a.forEach((_, i) => { $("ag-plate" + i).onclick = () => soloSelect(i); });
    } else d.a.forEach((_, i) => { $("ag-plate" + i).tabIndex = -1; });
    void key;
    updateBoard();
  }

  // Plate states, the line under the board and the answer chips.
  function updateBoard() {
    const g = S.g, d = g.qs[g.qi];
    if (!d) return;
    const reveal = g.phase === "reveal" && d.c != null;
    const mine = meSeat();
    for (let i = 0; i < 4; i++) {
      const p = $("ag-plate" + i);
      if (!p) continue;
      const gone = mine >= 0 && S.me.fifty && S.me.fifty.indexOf(i) >= 0 && !reveal;
      p.classList.toggle("gone", !!gone);
      p.classList.toggle("sel", mine >= 0 && S.me.sel === i && !reveal);
      p.classList.toggle("locked", mine >= 0 && S.me.sel === i && S.me.locked && !reveal);
      p.classList.toggle("right", reveal && d.c === i);
      p.classList.toggle("wrong", reveal && d.c !== i && mine >= 0 && g.answers[g.qi] && g.answers[g.qi][mine] === i);
      p.classList.toggle("dim", reveal && d.c !== i);
      p.disabled = mine < 0 || g.phase !== "question" || S.me.locked || !!gone;
      const who = $("ag-who" + i);
      if (who) who.innerHTML = reveal && g.answers[g.qi]
        ? g.players.map((pl, k) => (g.answers[g.qi][k] === i ? `<i style="--c:${pl.color}"><span>${pl.icon}</span><em>${esc(pl.name)}</em></i>` : "")).join("")
        : "";
    }
    const u = $("ag-under");
    if (!u) return;
    if (reveal) {
      const goal = GOAL(d.g);
      const right = g.answers[g.qi] ? g.answers[g.qi].filter((x) => x === d.c).length : 0;
      const n = filled(g).length;
      u.innerHTML = `<div class="ag-fact" style="--goal:${goal.color}"><b>${LETTERS[d.c]}: ${esc(d.a[d.c])}</b>` +
        `<span>${esc(d.f)}</span>` +
        `<small>${right} of ${n} got it right${d.s ? ` · <a href="${esc(d.s)}" target="_blank" rel="noopener">source</a>` : ""}</small></div>`;
    } else if (g.phase === "suspense") {
      u.innerHTML = `<div class="ag-status hush">Final answers are in…</div>`;
    } else if (mine === 0 && g.phase === "question") {
      const me = g.players[0];
      u.innerHTML = "";
      const row = el("div", "ag-actions");
      const fifty = el("button", "ag-life" + (me.fifty ? " used" : ""), `<b>50:50</b><small>${me.fifty ? "used" : "lifeline"}</small>`);
      fifty.disabled = me.fifty || S.me.locked;
      fifty.onclick = () => useFifty();
      row.appendChild(fifty);
      if (S.me.locked && allLocked(g)) {
        const now_ = el("button", "ag-btn gold", "Everyone's in · Reveal now ▸");
        now_.onclick = revealNow;
        row.appendChild(now_);
      } else if (S.me.locked) row.appendChild(el("div", "ag-status", `🔒 Locked in: <b>${LETTERS[S.me.sel]}</b>. Waiting for the others…`));
      else if (S.me.sel >= 0) {
        const fin = el("button", "ag-btn gold final", `Final answer: ${LETTERS[S.me.sel]} ▸`);
        fin.onclick = soloLock;
        row.appendChild(fin);
      } else row.appendChild(el("div", "ag-status", "Choose an answer"));
      u.appendChild(row);
    } else if (g.phase === "question" && isAuto()) {
      const n = active(g).length, k = g.players.filter((p, i) => !p.vacant && g.locked[i]).length;
      u.innerHTML = `<div class="ag-status">🤖 AI vs AI · <b>${k}</b> of ${n} locked in</div>`;
    } else if (g.phase === "question") {
      const n = active(g).length, k = g.players.filter((p, i) => !p.vacant && g.locked[i]).length;
      u.innerHTML = `<div class="ag-status">Answer on your phones · <b>${k}</b> of ${n} locked in</div>`;
      if (allLocked(g)) {
        u.innerHTML = "";
        const row = el("div", "ag-actions");
        row.appendChild(el("div", "ag-status", `All <b>${n}</b> locked in`));
        const go = el("button", "ag-btn gold", "Reveal now ▸");
        go.onclick = revealNow;
        row.appendChild(go);
        u.appendChild(row);
      }
    } else u.innerHTML = "";
  }

  function paintLadder() {
    const g = S.g, lad = $("ag-ladder");
    if (!lad) return;
    let html = `<div class="ag-rung top"><span>★</span><b>2030</b></div>`;
    for (let i = QCOUNT - 1; i >= 0; i--) {
      const d = g.qs[i];
      const cls = i === g.qi && g.phase !== "final" ? " now" : i < g.qi || (i === g.qi && (g.phase === "reveal" || g.phase === "final")) ? " done" : "";
      const ms = i === 3 || i === 6 ? " milestone" : "";
      const ans = g.answers[i], right = ans && d && d.c != null ? ans.filter((x) => x === d.c).length : null;
      const goal = d && (i <= g.qi) ? GOAL(d.g) : null;
      html += `<div class="ag-rung${cls}${ms}"><span class="ag-rn">${i + 1}</span>` +
        `<i class="ag-rdot" style="${goal ? `--c:${goal.color}` : ""}">${goal && d.g ? d.g : ""}</i>` +
        `<b>${right != null ? `${right}/${filled(g).length} ✓` : TIER_NAMES[TIERS[i]]}</b></div>`;
    }
    lad.innerHTML = html;
  }

  // The podiums are built once per seat and then only patched: a part's
  // HTML is replaced only when it actually changed, so nothing re-renders,
  // the thinking dots never restart and the names never move.
  function podPart(pod, cls, html) {
    let n = pod.querySelector(":scope > ." + cls);
    if (!n) { n = el("div", cls); pod.appendChild(n); }
    if (n.__html !== html) { n.innerHTML = html; n.__html = html; }
  }
  function paintPods() {
    const g = S.g, f = $("ag-pods");
    if (!f) return;
    const reveal = g.phase === "reveal" || g.phase === "final";
    const d = g.qs[g.qi] || {};
    const ranks = rank(g);
    while (f.children.length > g.players.length) f.lastChild.remove();
    g.players.forEach((p, i) => {
      let pod = f.children[i];
      if (!pod) { pod = el("div", "ag-pod"); f.appendChild(pod); }
      pod.id = "ag-pod" + i;
      pod.style.setProperty("--c", p.color);
      const cls = "ag-pod" + (p.vacant ? " empty" : "") + (p.away ? " away" : "") + (meSeat() === i ? " me" : "") +
        (!p.vacant && g.phase === "question" && g.locked[i] ? " is-locked" : "") +
        (!p.vacant && g.phase === "reveal" && g.answers[g.qi] && g.answers[g.qi][i] === d.c ? " is-right" : "") +
        (pod.classList.contains("score-pop") ? " score-pop" : "");
      if (pod.className !== cls) pod.className = cls;
      if (p.vacant) {
        podPart(pod, "ag-pod-av", "＋");
        podPart(pod, "ag-pod-nm", `Seat ${i + 1}`);
        podPart(pod, "ag-pod-sc", "");
        podPart(pod, "ag-pod-st", "waiting…");
        return;
      }
      let st = "";
      if (g.phase === "lobby") st = "ready ✓";
      else if (g.phase === "countdown") st = "here we go";
      else if (g.phase === "question") st = g.locked[i] ? "🔒 locked in" : p.away ? "away" : '<span class="ag-dots">thinking</span>';
      else if (g.phase === "suspense") st = g.locked[i] ? "🔒 locked in" : "no answer";
      else if (reveal && g.phase === "reveal") {
        const a = g.answers[g.qi] && g.answers[g.qi][i] != null ? g.answers[g.qi][i] : -1;
        st = a < 0 ? "no answer" : a === d.c ? `<b class="ok">${LETTERS[a]} ✓ right</b>` : `<b class="no">${LETTERS[a]} ✗</b>`;
      } else if (g.phase === "final") st = `#${ranks.indexOf(i) + 1}`;
      podPart(pod, "ag-pod-av", p.icon + (p.fifty ? '<i class="ag-pod-life" title="50:50 used">½</i>' : ""));
      podPart(pod, "ag-pod-nm", esc(p.name) + (p.isAI ? " <small>AI</small>" : ""));
      podPart(pod, "ag-pod-sc", `<b>${p.score}</b><small>right</small>`);
      podPart(pod, "ag-pod-st", st);
    });
  }
  // Seats in finishing order: most right, then quickest on those.
  function rank(g) {
    return g.players.map((p, i) => i).filter((i) => !g.players[i].vacant)
      .sort((a, b) => (g.players[b].score - g.players[a].score) || (g.players[a].ms - g.players[b].ms));
  }

  // ---- the lobby: the QR code wall ---------------------------------------
  function joinUrl() {
    const g = S.g;
    const base = CG.Platform && CG.Platform.gameUrl ? CG.Platform.gameUrl("agenda") : location.href.split("?")[0];
    return base + "?room=" + encodeURIComponent(g.id);
  }
  function paintLobby(c) {
    const g = S.g;
    const n = filled(g).length;
    const url = joinUrl();
    if (!c.querySelector(".ag-lobby")) {
      c.dataset.key = "lobby";
      c.innerHTML =
        `<div class="ag-lobby">` +
          `<div class="ag-lobby-l">` +
            `<div class="ag-kicker">Scan to join the show</div>` +
            `<div class="ag-qr" id="ag-qr"><div class="ag-qr-wait">Drawing your code…</div></div>` +
          `</div>` +
          `<div class="ag-lobby-r">` +
            `<div class="ag-kicker">or go to</div>` +
            `<div class="ag-url" id="ag-url"></div>` +
            `<div class="ag-kicker">and enter the code</div>` +
            `<div class="ag-bigcode" id="ag-bigcode"></div>` +
            `<div class="ag-waiting" id="ag-waiting"></div>` +
            `<div class="ag-lobby-acts" id="ag-lobby-acts"></div>` +
          `</div>` +
        `</div>`;
      paintQR();
    }
    $("ag-url").innerHTML = `<span>${esc(url.replace(/^https?:\/\//, ""))}</span>`;
    const copy = el("button", "ag-copy", "Copy link");
    copy.onclick = () => { copyText(url); copy.textContent = "Copied ✓"; SA.select(); setTimeout(() => { copy.textContent = "Copy link"; }, 1600); };
    $("ag-url").appendChild(copy);
    $("ag-bigcode").innerHTML = g.id.split("").map((ch, i) => `<span style="--i:${i}">${esc(ch)}</span>`).join("");
    const left = g.seats - n;
    $("ag-waiting").innerHTML = left > 0
      ? `<b>${n}</b> of ${g.seats} contestants in. Waiting for <b>${left}</b> more${left === 1 ? "" : ""}…<br><small>The show starts the moment the last seat is taken.</small>`
      : `<b>Everyone's in.</b> Stand by…`;
    const acts = $("ag-lobby-acts"); acts.innerHTML = "";
    if (n >= 1 && left > 0) {
      const go = el("button", "ag-btn gold", `Start now with ${n} ▸`);
      // Empty seats stay open: anyone can still scan in and take one mid-show.
      go.onclick = () => { if (filled(S.g).length < 1) return; SA.select(); startCountdown(); };
      acts.appendChild(go);
    }
    if (g.seats < 5) {
      const more = el("button", "ag-btn ghost", "＋ Seat");
      more.onclick = () => { g.seats++; g.players.push(blankPlayer(g.players.length)); SA.select(); publish({ summary: true }); paintAll(); };
      acts.appendChild(more);
    }
    if (g.seats > Math.max(1, n) && g.seats > 1) {
      const less = el("button", "ag-btn ghost", "－ Seat");
      less.onclick = () => {
        const i = g.players.map((p) => p.vacant).lastIndexOf(true);
        if (i < 0) return;
        g.players.splice(i, 1); g.seats--;
        g.players.forEach((p, k) => { p.color = SEAT_COLORS[k]; });
        SA.select(); publish({ summary: true }); paintAll();
      };
      acts.appendChild(less);
    }
  }

  function loadQR() {
    if (window.qrcode) return Promise.resolve();
    if (loadQR.p) return loadQR.p;
    loadQR.p = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = QR_LIB; s.async = true;
      s.onload = () => res(); s.onerror = () => { loadQR.p = null; rej(new Error("qr")); };
      document.head.appendChild(s);
    });
    return loadQR.p;
  }
  // A QR code drawn as SVG: crisp square modules (merged per row so the
  // scanner sees solid runs), standard finder squares, a quiet zone of four,
  // and a small SDG wheel in the middle. Error correction H restores the
  // few modules the wheel covers; the wheel stays under 8% of the area.
  function qrSvg(text) {
    const qr = window.qrcode(0, "H");
    qr.addData(text); qr.make();
    const n = qr.getModuleCount(), m = 4, size = n + m * 2;
    let logo = Math.floor(n * 0.2); if (logo % 2 !== n % 2) logo--;
    const lo = (n - logo) / 2;
    const inLogo = (r, c) => r >= lo && r < lo + logo && c >= lo && c < lo + logo;
    let d = "";
    for (let r = 0; r < n; r++) {
      let c = 0;
      while (c < n) {
        if (!qr.isDark(r, c) || inLogo(r, c)) { c++; continue; }
        let e = c; while (e < n && qr.isDark(r, e) && !inLogo(r, e)) e++;
        d += `M${c + m} ${r + m}h${e - c}v1h${c - e}z`;
        c = e;
      }
    }
    const cx = size / 2, rr = logo / 2 - 0.15;
    let wedges = "";
    for (let i = 0; i < 17; i++) {
      const a0 = (i / 17) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / 17) * Math.PI * 2 - Math.PI / 2;
      const P = (rad, a) => `${(cx + rad * Math.cos(a)).toFixed(3)},${(cx + rad * Math.sin(a)).toFixed(3)}`;
      wedges += `<path d="M${P(rr, a0)} A${rr},${rr} 0 0 1 ${P(rr, a1)} L${P(rr * 0.5, a1)} A${rr * 0.5},${rr * 0.5} 0 0 0 ${P(rr * 0.5, a0)} Z" fill="${GOAL(i + 1).color}"/>`;
    }
    return `<svg viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="QR code to join the show">` +
      `<rect width="${size}" height="${size}" fill="#fff"/><path fill="#0b1430" d="${d}"/>` +
      `<g shape-rendering="geometricPrecision">${wedges}</g></svg>`;
  }
  function paintQR() {
    const box = $("ag-qr");
    if (!box || !S.g) return;
    if (!window.qrcode) { box.innerHTML = `<div class="ag-qr-wait">QR code unavailable offline.<br>Use the link and code →</div>`; return; }
    try { box.innerHTML = qrSvg(joinUrl()); } catch (e) { box.innerHTML = `<div class="ag-qr-wait">Use the link and code →</div>`; }
  }
  // In-show corner card: for people in the room who are not playing yet.
  // They scan to watch on their phone, or to take a seat if one is open.
  let miniKey = "";
  function paintMiniQR() {
    const box = $("ag-miniqr"), g = S.g;
    if (!box || !g) return;
    const show = g.phase !== "lobby";
    box.classList.toggle("on", show);
    if (!show) return;
    const open = g.players.filter((p) => p.vacant).length;
    const key = g.id + ":" + open + ":" + (window.qrcode ? 1 : 0);
    if (key === miniKey && box.firstChild) return;
    miniKey = key;
    let qr = "";
    try { qr = window.qrcode ? qrSvg(joinUrl()) : ""; } catch (e) { qr = ""; }
    box.innerHTML = (qr ? `<div class="ag-miniqr-code">${qr}</div>` : "") +
      `<div class="ag-miniqr-t"><b>${open ? `Scan to join` : "Scan to watch"}</b>` +
      `<span>${open ? `${open} seat${open === 1 ? "" : "s"} open` : "on your phone"}</span>` +
      `<code>${esc(g.id)}</code></div>`;
  }

  function copyText(t) {
    try { if (navigator.clipboard) { navigator.clipboard.writeText(t); return; } } catch (e) {}
    const ta = el("textarea"); ta.value = t; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    ta.remove();
  }

  // ---- solo: choosing and locking ----------------------------------------
  function soloSelect(i) {
    const g = S.g;
    if (meSeat() !== 0 || g.phase !== "question" || S.me.locked || g.paused) return;
    if (S.me.fifty && S.me.fifty.indexOf(i) >= 0) return;
    if (elapsed() < INTRO_MS - 400) return;
    S.me.sel = i; SA.select(); updateBoard();
  }
  function soloLock() {
    const g = S.g;
    if (S.me.sel < 0 || S.me.locked) return;
    S.me.locked = true;
    S.me.ms = Math.max(0, elapsed() - INTRO_MS);
    recordPick(g.qi, 0, S.me.sel, S.me.ms, !!S.me.fifty);
    SA.lock(); updateBoard(); paintPods();
  }
  function useFifty() {
    const g = S.g;
    if (meSeat() !== 0 || g.players[0].fifty || S.me.locked) return;
    const d = S.deck[g.qi];
    S.me.fifty = shuffle([0, 1, 2, 3].filter((k) => k !== d.c)).slice(0, 2);
    g.players[0].fifty = true;
    if (S.me.fifty.indexOf(S.me.sel) >= 0) S.me.sel = -1;
    SA.whoosh(); updateBoard(); paintPods();
  }

  // ---- the timer ring and the ticking clock ------------------------------
  function startRaf() {
    const frame = () => {
      S.raf = requestAnimationFrame(frame);
      const g = S.g;
      if (!g) return;
      if (g.phase !== "question") return;
      const total = g.timer * 1000;
      const left = Math.max(0, Math.min(total, g.phaseLen - elapsed()));
      const frac = left / total;
      const fg = $("ag-timer-fg");
      if (fg) { fg.style.strokeDashoffset = String(351.86 * (1 - frac)); fg.classList.toggle("hot", left < 5000); }
      const pb = $("ag-ph-bar");
      if (pb) { pb.style.transform = `scaleX(${frac})`; pb.classList.toggle("hot", left < 5000); }
      const secs = Math.ceil(left / 1000);
      const s = $("ag-secs");
      if (s && elapsed() > INTRO_MS) { s.textContent = secs; const lb = $("ag-em-lab"); if (lb) lb.textContent = "SECS"; }
      const ps = $("ag-ph-secs"); if (ps) ps.textContent = secs;
      // The question bed runs first; the countdown score takes the last ten seconds.
      if (isStage() && !g.paused && !S.cdStarted && elapsed() > INTRO_MS && left <= FINAL_S * 1000) { S.cdStarted = true; SA.countdown(Math.max(1, left / 1000)); }
      if (secs !== S.lastTick && elapsed() > INTRO_MS && !g.paused) {
        S.lastTick = secs;
        if (secs > 0 && (S.role === "phone" ? !S.me.locked && secs <= 5 : !settings.music)) SA.tick(secs <= 3);
      }
    };
    if (!S.raf) S.raf = requestAnimationFrame(frame);
  }

  // ---- show moments -------------------------------------------------------
  function showCountdown() {
    const g = S.g;
    SA.setMode("off");
    SA.intro();
    const c = el("div", "ag-count");
    c.innerHTML = `<div class="ag-count-k">Tonight's contestants</div>` +
      `<div class="ag-lineup">${filled(g).map((p, i) => `<div class="ag-line-p" style="--c:${p.color};--i:${i}"><span>${p.icon}</span><b>${esc(p.name)}</b></div>`).join("")}</div>` +
      `<div class="ag-count-n" id="ag-count-n"></div>`;
    openOverlay(c, "ag-over-count");
    const names = filled(g).map((p) => p.name);
    const list = names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0];
    say(`Good evening, and welcome to Agenda 2030! Tonight's contestants are… ${list}. Ten questions, thirty seconds on the clock for each. Let's play!`);
    const nEl = $("ag-count-n");
    [3, 2, 1, 0].forEach((k, j) => setTimeout(() => {
      if (!nEl.isConnected) return;
      nEl.textContent = k ? k : "Let's play!";
      nEl.classList.remove("pop"); void nEl.offsetWidth; nEl.classList.add("pop");
      SA.count(k);
    }, COUNTDOWN_MS - 4200 + j * 1000));
  }

  function revealFx() {
    const g = S.g, d = g.qs[g.qi];
    const plate = $("ag-plate" + d.c);
    const st = $("ag-stage");
    if (st) { st.classList.remove("flash"); void st.offsetWidth; st.classList.add("flash"); }
    if (meSeat() === 0) {
      const mine = g.answers[g.qi] ? g.answers[g.qi][0] : -1;
      if (mine === d.c) { SA.correct(); if (plate) burst(plate, "#7cf29c", 34); }
      else SA.wrong();
    } else {
      const any = g.answers[g.qi] && g.answers[g.qi].some((x) => x === d.c);
      if (any) SA.correct(); else SA.wrong();
      if (plate) burst(plate, "#7cf29c", 30);
    }
    g.players.forEach((p, i) => {
      if (g.answers[g.qi] && g.answers[g.qi][i] === d.c) { const pod = $("ag-pod" + i); if (pod) { pod.classList.add("score-pop"); burst(pod, p.color, 14); } }
    });
    const right = g.answers[g.qi] ? g.answers[g.qi].filter((x) => x === d.c).length : 0;
    const n = filled(g).length;
    const crowd = n < 2 ? "" : right === n ? " Everybody got that one!" : right === 0 ? " Ooh, nobody got that one." : right === 1 ? " Just one of you got it." : "";
    say(`${rand(["The right answer is…", "And the answer is…", "It's…"])} ${LETTERS[d.c]}! ${d.a[d.c]}.${crowd} ${d.f}`);
  }

  function showFinal() {
    const g = S.g;
    const order = rank(g);
    const top = order.length ? g.players[order[0]] : null;
    const tie = order.length > 1 && g.players[order[0]].score === g.players[order[1]].score && g.players[order[0]].ms === g.players[order[1]].ms;
    SA.setMode("off");
    SA.fanfare();
    setTimeout(() => { if (S.g === g && g.phase === "final") SA.setMode(settings.music ? "theme" : "off"); }, 4200);
    confettiRain(g.players.filter((p) => !p.vacant).map((p) => p.color));
    const c = el("div", "ag-final");
    const podium = [1, 0, 2].filter((k) => order[k] != null).map((k) => {
      const p = g.players[order[k]];
      return `<div class="ag-step s${k + 1}" style="--c:${p.color};--i:${k}"><div class="ag-step-av">${k === 0 ? `<i class="ag-crown">👑</i>` : ""}${p.icon}</div>` +
        `<b>${esc(p.name)}</b><small>${p.score}/10</small><div class="ag-step-block">${k + 1}</div></div>`;
    }).join("");
    const rest = order.slice(3).map((i, k) => `<li><span>#${k + 4}</span>${g.players[i].icon} ${esc(g.players[i].name)}<b>${g.players[i].score}/10</b></li>`).join("");
    c.innerHTML =
      `<div class="ag-final-k">${tie ? "A dead heat" : "The winner"}</div>` +
      `<div class="ag-final-h">${top ? esc(top.name) : "Nobody"}${tie ? " and friends" : ""}</div>` +
      `<div class="ag-final-sub">${top ? `${top.score} of 10 right${tie ? "" : g.players.filter((p) => !p.vacant && p.score === top.score).length > 1 ? " · quickest on the buzzer" : ""}` : ""}</div>` +
      `<div class="ag-podium">${podium}</div>` +
      (rest ? `<ol class="ag-rest">${rest}</ol>` : "") +
      `<div class="ag-final-acts" id="ag-final-acts"></div>`;
    openOverlay(c, "ag-over-final");
    const acts = $("ag-final-acts");
    const again = el("button", "ag-btn gold", "Play again ▸");
    again.onclick = () => { SA.select(); playAgain(); };
    acts.appendChild(again);
    const sh = el("button", "ag-btn ghost", "Share");
    sh.onclick = () => share(g);
    acts.appendChild(sh);
    const out = el("button", "ag-btn ghost", S.role === "host" ? "Close the show" : "Leave");
    out.onclick = () => leave(true);
    acts.appendChild(out);
    if (g.auto) {
      // AI vs AI runs on its own: the next show starts after a short break.
      const note = el("p", "ag-final-next");
      c.appendChild(note);
      const stop = el("button", "ag-btn ghost", "Stop auto play");
      stop.onclick = () => { stopAutoNext(); note.textContent = "Auto play stopped. Press Play again for another show."; stop.remove(); };
      acts.appendChild(stop);
      let left = AUTO_NEXT_S;
      const paint = () => { note.innerHTML = `Next show starts in <b>${left}</b> s`; };
      paint();
      S.autoNext = setInterval(() => {
        if (S.g !== g || g.phase !== "final") return stopAutoNext();
        if (g.paused) return;
        if (S.talking && left <= 1) return;   // let the host finish the send-off
        left--; paint();
        if (left <= 0) { stopAutoNext(); playAgain(); }
      }, 1000);
    }
    say(top ? (tie ? `What a finish… it's a dead heat, at ${top.score} out of ten!` : `Ladies and gentlemen… the winner of tonight's show is… ${top.name}! With ${top.score} out of ten. Congratulations!`) : "");
  }

  const AUTO_NEXT_S = 25;
  function stopAutoNext() { if (S.autoNext) { clearInterval(S.autoNext); S.autoNext = null; } }

  function share(g) {
    const order = rank(g);
    const lines = order.map((i, k) => `${k + 1}. ${g.players[i].icon} ${g.players[i].name}: ${g.players[i].score}/10`).join("\n");
    const text = `Agenda 2030, the Global Goals quiz show 🌍\n${lines}\nPlay: ${CG.Platform && CG.Platform.gameUrl ? CG.Platform.gameUrl("agenda") : location.href}`;
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else { copyText(text); toast("Results copied ✓"); }
  }

  function recordSolo() {
    const g = S.g, st = stats();
    const order = rank(g);
    st.shows++; if (order[0] === 0) st.wins++;
    st.right += g.players[0].score; st.asked += QCOUNT; st.best = Math.max(st.best, g.players[0].score);
    ls("cg_agenda_stats", st);
  }

  // =======================================================================
  // THE PHONE: a private answer pad
  // =======================================================================
  function mountPhone() {
    const root = app(); root.innerHTML = "";
    const st = el("div", "ag-phone");
    st.id = "ag-phone";
    st.innerHTML =
      `<div class="ag-bg"><i class="ag-beam b1"></i><i class="ag-beam b2"></i><i class="ag-stars"></i></div>` +
      `<header class="ag-ph-top" id="ag-ph-top"></header>` +
      `<div class="ag-ph-warn" id="ag-ph-warn">📡 Waiting for the main screen…</div>` +
      `<main class="ag-ph-body" id="ag-ph-body"></main>` +
      `<div class="ag-fx" id="ag-fx"></div><div class="ag-toasts" id="ag-toasts"></div>`;
    root.appendChild(st);
    S.mounted = true;
    SA.setMusic(false); SA.setSfx(settings.sfx);
    startRaf();
    paintPhone(true);
  }

  function paintPhone(full) {
    const g = S.g;
    if (!g || !$("ag-phone")) return;
    const seat = mySeat(), me = seat >= 0 ? g.players[seat] : null;
    const top = $("ag-ph-top");
    top.innerHTML =
      `<button class="ag-ic sm" id="ag-ph-quit" title="Leave">✕</button>` +
      (me ? `<div class="ag-ph-me" style="--c:${me.color}"><span>${me.icon}</span><b>${esc(me.name)}</b></div><div class="ag-ph-score"><b>${me.score}</b><small>right</small></div>`
          : `<div class="ag-ph-me"><span>👀</span><b>${S.net.joining ? "Joining…" : "Watching"}</b></div><div class="ag-ph-score"><small>Show</small><b>${esc(g.id)}</b></div>`);
    $("ag-ph-quit").onclick = confirmLeave;
    const body = $("ag-ph-body");
    const key = g.pk + ":" + g.phase + ":" + (S.me.locked ? 1 : 0) + ":" + seat + ":" + (S.net.joining ? 1 : 0);
    if (!full && body.dataset.key === key) { phoneLight(); return; }
    body.dataset.key = key;
    body.className = "ag-ph-body ph-" + g.phase;

    if (S.net.joining && seat < 0) {
      body.innerHTML = `<div class="ag-ph-card"><div class="ag-spin">${wheelSvg("", "")}</div><h2>Taking your seat…</h2><p>Saying hello to the main screen.</p></div>`;
      return;
    }
    if (seat < 0 && S.role === "phone" && g.phase === "lobby") {
      body.innerHTML = `<div class="ag-ph-card"><h2>No seat yet</h2><p>The studio didn't answer, or the seats filled up.</p></div>`;
      const b = el("button", "ag-btn gold big", "Try again ▸");
      b.onclick = () => { S.net.joining = { name: settings.name || "Contestant", icon: settings.avatar || rand(AVATARS) }; S.net.joinAt = now(); sendLive({ t: "join", name: S.net.joining.name, icon: S.net.joining.icon }); paintPhone(true); };
      body.firstChild.appendChild(b);
      return;
    }
    if (g.phase === "lobby") {
      const n = filled(g).length;
      body.innerHTML =
        `<div class="ag-ph-card hello"><div class="ag-ph-big" style="--c:${me.color}">${me.icon}</div>` +
        `<h2>You're in, ${esc(me.name)}!</h2><p>Look up at the big screen. The show starts when every seat is taken.</p>` +
        `<div class="ag-ph-seats">${g.players.map((p) => `<i class="${p.vacant ? "open" : ""}" style="--c:${p.color}">${p.vacant ? "＋" : p.icon}</i>`).join("")}</div>` +
        `<small>${n} of ${g.seats} here</small></div>`;
      body.appendChild(reactBar());
      return;
    }
    if (g.phase === "countdown") {
      body.innerHTML = `<div class="ag-ph-card"><div class="ag-spin">${wheelSvg("", "")}</div><h2>Here we go!</h2><p>Ten questions. Answer in secret. Most right wins.</p>` +
        `<div class="ag-ph-rules"><span>🔒 Tap, then lock it in</span><span>½ One 50:50 per show</span><span>⏱ Ties go to the quickest</span></div></div>`;
      buzz([20, 60, 20]);
      return;
    }
    if (seat < 0 && !S.net.joining && g.phase !== "final" && g.players.some((p) => p.vacant)) {
      const b = el("button", "ag-btn gold ag-ph-take", "🪑 A seat is open · join the show ▸");
      b.onclick = () => {
        S.role = "phone";
        S.net.joining = { name: settings.name || "Contestant", icon: settings.avatar || rand(AVATARS) }; S.net.joinAt = now();
        sendLive({ t: "join", name: S.net.joining.name, icon: S.net.joining.icon }); SA.select(); paintPhone(true);
      };
      body.innerHTML = ""; body.appendChild(b);
      if (g.phase === "question" || g.phase === "suspense" || g.phase === "reveal") { const box = el("div", "ag-ph-watch"); body.appendChild(box); phoneQuestion(box, seat, me); }
      return;
    }
    if (g.phase === "question" || g.phase === "suspense" || g.phase === "reveal") return phoneQuestion(body, seat, me);
    if (g.phase === "final") {
      const order = rank(g), place = order.indexOf(seat);
      const top3 = order.slice(0, 5).map((i, k) => `<li style="--c:${g.players[i].color}"><span>${k + 1}</span>${g.players[i].icon} ${esc(g.players[i].name)}<b>${g.players[i].score}</b></li>`).join("");
      body.innerHTML = `<div class="ag-ph-card final">` +
        (me ? `<div class="ag-ph-place">${place === 0 ? "🏆" : place === 1 ? "🥈" : place === 2 ? "🥉" : "🎗️"}</div><h2>${place === 0 ? "You won the show!" : `You finished #${place + 1}`}</h2><p>${me.score} of 10 right</p>` : `<h2>The results</h2>`) +
        `<ol class="ag-ph-rank">${top3}</ol><p class="ag-ph-small">If the host plays again, you're already in.</p></div>`;
      body.appendChild(reactBar());
      if (me && place === 0) { confettiRain([me.color]); buzz([40, 60, 40, 60, 120]); }
      return;
    }
  }

  function phoneQuestion(body, seat, me) {
    const g = S.g, d = g.qs[g.qi];
    if (!d || !d.a) { body.innerHTML = `<div class="ag-ph-card"><h2>Stand by…</h2></div>`; return; }
    const goal = GOAL(d.g);
    const reveal = g.phase === "reveal" && d.c != null;
    const my = reveal && g.answers[g.qi] && seat >= 0 ? g.answers[g.qi][seat] : (S.me.locked ? S.me.sel : -1);
    body.innerHTML =
      `<div class="ag-ph-q" style="--goal:${goal.color}">` +
        `<div class="ag-ph-qh"><span class="ag-ph-qn">Q${g.qi + 1}/${QCOUNT}</span><span class="ag-ph-goal">${d.g ? `SDG ${d.g}` : "2030 Agenda"}</span><span class="ag-ph-secs" id="ag-ph-secs"></span></div>` +
        `<div class="ag-ph-bar"><i id="ag-ph-bar"></i></div>` +
        `<p class="ag-ph-qt">${esc(d.q)}</p>` +
      `</div>` +
      `<div class="ag-ph-pads">${d.a.map((a, i) => `<button class="ag-pad" id="ag-pad${i}" data-l="${LETTERS[i]}"><b>${LETTERS[i]}</b><span>${esc(a)}</span></button>`).join("")}</div>` +
      `<div class="ag-ph-act" id="ag-ph-act"></div>`;
    if (reveal) {
      const right = my === d.c;
      for (let i = 0; i < 4; i++) {
        const p = $("ag-pad" + i);
        p.disabled = true;
        p.classList.toggle("right", i === d.c);
        p.classList.toggle("wrong", i === my && !right);
        p.classList.toggle("dim", i !== d.c && i !== my);
      }
      const act = $("ag-ph-act");
      act.innerHTML = seat < 0 ? `<div class="ag-ph-verdict"><b>${LETTERS[d.c]}</b> was right</div>`
        : my < 0 ? `<div class="ag-ph-verdict miss">⏱ No answer this time</div>`
        : right ? `<div class="ag-ph-verdict ok">✓ Correct! <small>+1</small></div>` : `<div class="ag-ph-verdict no">✗ Not this time</div>`;
      if (d.f) act.appendChild(el("p", "ag-ph-fact", esc(d.f)));
      act.appendChild(reactBar());
      if (seat >= 0 && body.dataset.buzzed !== g.pk + "") {
        body.dataset.buzzed = g.pk + "";
        if (my === d.c) { SA.correct(); buzz([30, 50, 30]); burst($("ag-pad" + d.c), "#7cf29c", 24); } else { SA.wrong(); buzz(200); }
        phoneSplash(my < 0 ? "miss" : right ? "ok" : "no", me, d);
      }
      return;
    }
    if (g.phase === "suspense") {
      for (let i = 0; i < 4; i++) { const p = $("ag-pad" + i); p.disabled = true; p.classList.toggle("locked", i === my); p.classList.toggle("dim", i !== my); }
      $("ag-ph-act").innerHTML = `<div class="ag-ph-verdict hush">Final answers are in…</div>`;
      buzz([15, 400, 15, 400, 15]);
      return;
    }
    // answering
    for (let i = 0; i < 4; i++) {
      const p = $("ag-pad" + i);
      p.onclick = () => phoneSelect(i);
    }
    phoneLight();
  }
  // The verdict, full screen for a moment so nobody misses it: a big green
  // tick and the new score, or the right letter. A tap closes it early.
  function phoneSplash(kind, me, d) {
    const ph = $("ag-phone");
    if (!ph) return;
    const old = $("ag-ph-splash"); if (old) old.remove();
    const sp = el("div", "ag-ph-splash " + kind);
    sp.id = "ag-ph-splash";
    sp.innerHTML = kind === "ok"
      ? `<div class="ag-sp-ic">✓</div><h2>Correct!</h2><p><b>+1</b> · ${me ? `${me.score} right so far` : ""}</p>`
      : kind === "no"
        ? `<div class="ag-sp-ic">✗</div><h2>Not this time</h2><p>The answer was <b>${LETTERS[d.c]}</b>: ${esc(d.a[d.c])}</p>`
        : `<div class="ag-sp-ic">⏱</div><h2>No answer</h2><p>The answer was <b>${LETTERS[d.c]}</b>: ${esc(d.a[d.c])}</p>`;
    sp.onclick = () => sp.remove();
    ph.appendChild(sp);
    if (kind === "ok") confettiRain([me ? me.color : "#7cf29c", "#7cf29c"]);
    setTimeout(() => { sp.classList.add("out"); setTimeout(() => sp.remove(), 400); }, kind === "ok" ? 3200 : 2800);
  }
  // Repaint just the pads and the action row (no flicker while answering).
  function phoneLight() {
    const g = S.g;
    if (!g || g.phase !== "question") return;
    const seat = mySeat(), me = seat >= 0 ? g.players[seat] : null;
    const confirmed = seat >= 0 && g.locked[seat];
    for (let i = 0; i < 4; i++) {
      const p = $("ag-pad" + i);
      if (!p) return;
      const gone = S.me.fifty && S.me.fifty.indexOf(i) >= 0;
      p.classList.toggle("gone", !!gone);
      p.classList.toggle("sel", S.me.sel === i && !S.me.locked);
      p.classList.toggle("locked", S.me.sel === i && S.me.locked);
      p.classList.toggle("dim", S.me.locked && S.me.sel !== i);
      p.disabled = !me || S.me.locked || !!gone;
    }
    const act = $("ag-ph-act");
    if (!act) return;
    act.innerHTML = "";
    if (!me) { act.innerHTML = `<div class="ag-ph-verdict">👀 Watching</div>`; return; }
    if (S.me.locked) {
      const n = active(g).length, k = g.players.filter((p, i) => !p.vacant && g.locked[i]).length;
      act.innerHTML = `<div class="ag-ph-verdict lock">🔒 Locked in: <b>${LETTERS[S.me.sel]}</b><small>${confirmed ? `${k} of ${n} in · keep it secret` : "sending…"}</small></div>`;
      return;
    }
    const row = el("div", "ag-ph-row");
    const fifty = el("button", "ag-life" + (me.fifty || S.me.fifty ? " used" : ""), `<b>50:50</b><small>${me.fifty || S.me.fifty ? "used" : "lifeline"}</small>`);
    fifty.disabled = !!(me.fifty || S.me.fifty);
    fifty.onclick = phoneFifty;
    row.appendChild(fifty);
    const lock = el("button", "ag-btn gold final", S.me.sel >= 0 ? `Lock in ${LETTERS[S.me.sel]} ▸` : "Pick an answer");
    lock.disabled = S.me.sel < 0;
    lock.onclick = phoneLock;
    row.appendChild(lock);
    act.appendChild(row);
  }
  // On a phone: a curtain while the host has paused; the pads hold still.
  function paintPhonePause() {
    const ph = $("ag-phone"), g = S.g;
    if (!ph || !g) return;
    let cur = $("ag-ph-paused");
    if (g.paused) {
      if (!cur) {
        cur = el("div", "ag-paused ph", '<div class="ag-paused-card"><div class="ag-paused-ic">⏸</div><h3>Paused by the host</h3><p>Hold that thought. Your time is saved.</p></div>');
        cur.id = "ag-ph-paused";
        ph.appendChild(cur);
      }
    } else if (cur) cur.remove();
  }
  function phoneSelect(i) {
    if (S.me.locked || mySeat() < 0 || S.g.phase !== "question" || S.g.paused) return;
    if (S.me.fifty && S.me.fifty.indexOf(i) >= 0) return;
    S.me.sel = i; SA.select(); buzz(8); phoneLight();
  }
  function phoneLock() {
    const g = S.g;
    if (S.me.sel < 0 || S.me.locked || g.phase !== "question" || g.paused) return;
    S.me.locked = true; S.me.qi = g.qi;
    S.me.ms = Math.max(0, now() - S.t0 - INTRO_MS);
    SA.lock(); buzz(40);
    sendPick();
    paintPhone(true);
  }
  // The phone doesn't know the right answer, so the 50:50 asks the bank on
  // this device: the same question text, the same four options.
  function phoneFifty() {
    const g = S.g, d = g.qs[g.qi];
    const bank = CG.AGENDA_QS || [];
    const src = bank.find((q) => q[2] === d.q);
    if (!src) { toast("The 50:50 is unavailable for this question"); return; }
    const right = d.a.indexOf(src[3][src[4]]);
    if (right < 0) { toast("The 50:50 is unavailable for this question"); return; }
    S.me.fifty = shuffle([0, 1, 2, 3].filter((k) => k !== right)).slice(0, 2);
    if (S.me.fifty.indexOf(S.me.sel) >= 0) S.me.sel = -1;
    SA.whoosh(); buzz(20);
    phoneLight();
  }
  function reactBar() {
    const bar = el("div", "ag-reacts");
    ["👏", "🎉", "😮", "😂", "🔥", "🌍"].forEach((e) => {
      const b = el("button", "", e);
      b.onclick = () => { sendLive({ t: "react", e }); SA.pop(); buzz(6); b.classList.remove("hit"); void b.offsetWidth; b.classList.add("hit"); };
      bar.appendChild(b);
    });
    return bar;
  }
  function showGone() {
    const body = $("ag-ph-body");
    if (!body) return;
    body.innerHTML = `<div class="ag-ph-card"><h2>That's a wrap</h2><p>The host closed the show.</p></div>`;
    const b = el("button", "ag-btn gold big", "Back to the start ▸");
    b.onclick = () => { setQuery(null); renderTitle(); };
    body.firstChild.appendChild(b);
    if (room()) { room().unwatch(); room().offLive(); }
    if (S.net.tick) { clearInterval(S.net.tick); S.net.tick = null; }
  }

  // =======================================================================
  // OVERLAYS, LEAVING, HOW TO
  // =======================================================================
  function openOverlay(card, cls) {
    closeOverlay(true);
    const o = el("div", "ag-over " + (cls || ""));
    o.appendChild(card);
    (document.getElementById("ag-stage") || document.getElementById("ag-phone") || document.querySelector(".ag-screen") || app()).appendChild(o);
    S.overlay = o;
    setTimeout(() => o.classList.add("show"), 20);
    return o;
  }
  function closeOverlay(instant) {
    const o = S.overlay;
    if (!o) return;
    S.overlay = null;
    if (instant) o.remove();
    else { o.classList.remove("show"); setTimeout(() => o.remove(), 300); }
  }

  function confirmLeave() {
    const g = S.g;
    const c = el("div", "ag-dialog");
    const hosting = S.role === "host";
    c.innerHTML = `<h3>${hosting ? "Close the show?" : "Leave the show?"}</h3>` +
      `<p>${hosting ? "Every phone in the room is sent home." : S.role === "phone" ? "Your seat stays in the scores, but you won't answer any more." : "This show ends here."}</p>`;
    const row = el("div", "ag-dialog-acts");
    const stay = el("button", "ag-btn gold", "Stay");
    stay.onclick = () => closeOverlay();
    const go = el("button", "ag-btn ghost", hosting ? "Close the show" : "Leave");
    go.onclick = () => { closeOverlay(true); leave(true); };
    row.appendChild(go); row.appendChild(stay);
    c.appendChild(row);
    openOverlay(c, "ag-over-dialog");
    void g;
  }
  function leave() {
    const g = S.g;
    if (S.role === "host" && g && room()) { room().drop(g.id); ls("cg_agenda_deck_" + g.id, null); }
    if (S.role === "phone" && g) sendLive({ t: "leave", name: settings.name });
    teardown();
    setQuery(null);
    renderTitle();
  }

  function showHowTo() {
    const c = el("div", "ag-dialog how");
    c.innerHTML = `<h3>How the show works</h3>` +
      `<div class="ag-how-qr"><span>📺</span><span>On the screen everyone can see, tap <b>Host a show</b>, choose how many players, then <b>Open the show</b>. ` +
      `The <b>QR code</b> appears in big, with a short code and a link.</span></div>` +
      `<ol>` +
      `<li><i>📱</i><span><b>Everyone scans the QR code with their phone</b> (or opens the link and types the code), types a name and picks an avatar. When the last seat is taken, the show begins.</span></li>` +
      `<li><i>🤫</i><span><b>Answer in secret.</b> Each question shows on the big screen and on every phone. You have 30 seconds: tap A, B, C or D, then lock it in. Nobody sees your pick.</span></li>` +
      `<li><i>⏳</i><span><b>Five seconds of suspense,</b> then the right answer lights up, with a fact and its official source.</span></li>` +
      `<li><i>🏆</i><span><b>Ten questions, each harder than the last.</b> Most right answers wins. A tie goes to the quickest on their right answers.</span></li>` +
      `<li><i>½</i><span><b>One 50:50 each,</b> to take away two wrong answers once per show.</span></li>` +
      `<li><i>🚪</i><span><b>Late?</b> A small QR code stays in the corner during the show: scan it to watch, or to take a seat if one is open.</span></li>` +
      `</ol>`;
    const row = el("div", "ag-dialog-acts");
    const ok = el("button", "ag-btn ghost", "Got it");
    ok.onclick = () => closeOverlay();
    row.appendChild(ok);
    if (!S.g) {
      const host = el("button", "ag-btn gold", "📺 Host a show now ▸");
      host.onclick = () => { closeOverlay(true); renderHostSetup(); };
      row.appendChild(host);
    }
    c.appendChild(row);
    openOverlay(c, "ag-over-dialog");
  }

  // =======================================================================
  // FEEDBACK
  // =======================================================================
  function toast(msg) {
    const area = $("ag-toasts") || document.body;
    const t = el("div", "ag-toast", esc(msg));
    area.appendChild(t);
    setTimeout(() => t.classList.add("show"), 20);
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 3000);
  }
  function floatReact(seat, emoji) {
    const fx = $("ag-fx");
    if (!fx || !emoji) return;
    const pod = seat >= 0 ? $("ag-pod" + seat) : null;
    const r = pod ? pod.getBoundingClientRect() : { left: window.innerWidth / 2, width: 0, top: window.innerHeight - 80 };
    const e = el("span", "ag-float", esc(emoji));
    e.style.left = (r.left + r.width / 2 + randInt(-24, 24)) + "px";
    e.style.top = (r.top - 10) + "px";
    fx.appendChild(e);
    SA.pop();
    setTimeout(() => e.remove(), 2600);
  }
  function burst(node, color, n) {
    const fx = $("ag-fx");
    if (!fx || !node || !node.getBoundingClientRect) return;
    const r = node.getBoundingClientRect();
    const cols = [color, "#f5c542", "#ffffff", "#3fd0ff"];
    for (let i = 0; i < (n || 20); i++) {
      const p = el("span", "ag-conf");
      p.style.background = cols[i % cols.length];
      p.style.left = (r.left + r.width / 2) + "px";
      p.style.top = (r.top + r.height / 2) + "px";
      fx.appendChild(p);
      const a = Math.random() * Math.PI * 2, dd = randInt(50, 170);
      if (p.animate) p.animate([
        { transform: "translate(-50%,-50%) rotate(0deg)", opacity: 1 },
        { transform: `translate(${Math.cos(a) * dd}px, ${Math.sin(a) * dd + 50}px) rotate(${randInt(-360, 360)}deg)`, opacity: 0 },
      ], { duration: randInt(700, 1200), easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" });
      setTimeout(() => p.remove(), 1300);
    }
  }
  function confettiRain(colors) {
    const fx = $("ag-fx") || document.body;
    const cols = colors.concat(["#f5c542", "#3fd0ff", "#ff5d8f", "#7cf29c"]);
    for (let i = 0; i < 90; i++) {
      const p = el("span", "ag-conf");
      p.style.background = cols[i % cols.length];
      p.style.left = randInt(0, window.innerWidth) + "px";
      p.style.top = "-14px";
      fx.appendChild(p);
      if (p.animate) p.animate([
        { transform: "translateY(0) rotate(0deg)", opacity: 1 },
        { transform: `translate(${randInt(-90, 90)}px, ${window.innerHeight + 40}px) rotate(${randInt(-720, 720)}deg)`, opacity: 0.9 },
      ], { duration: randInt(2200, 3800), delay: randInt(0, 1200), easing: "cubic-bezier(.3,.1,.6,1)", fill: "forwards" });
      setTimeout(() => p.remove(), 5200);
    }
  }

  // ---- public API ----------------------------------------------------------
  CG.Agenda = {
    title: "Agenda 2030",
    show,
    // for tests
    _t: { buildDeck, newShow, rank, qrSvg, loadQR, S, SA },
  };
})();
