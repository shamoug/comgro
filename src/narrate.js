/* =========================================================================
 * COMMON GROUND, narrate.js
 * Spoken narration via the browser's built-in Web Speech API. No network, no
 * keys, no external assets. Shared by every game.
 *
 * Making a speech engine sound human comes down to three things, all here:
 *   1. The voice. Browsers ship very different voices, from robotic desktop
 *      ones to neural voices that sound like a person (Edge's “Natural”
 *      voices, Google's voices in Chrome, Apple's Enhanced and Premium
 *      voices). Every available voice is scored and the best English one
 *      wins, unless the player picked one (CG.Narrate.setVoice).
 *   2. Phrasing. Long text is spoken a phrase at a time with short breaths
 *      between sentences, a real pause at “…”, a lift at the end of a
 *      question and a touch more energy on an exclamation, with tiny random
 *      variation so it never drones. (It also sidesteps Chrome's habit of
 *      cutting a long utterance off after about fifteen seconds.)
 *   3. Clean words. Emoji and markup are dropped, and the abbreviations a
 *      voice stumbles on (SDG, UN, °C, &) are spelled the way people say them.
 *
 * The API is unchanged: speak, auto, stop, setEnabled, isEnabled, supported,
 * plus voices(), setVoice(name), voiceName() and sample().
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});
  const N = (CG.Narrate = {});

  const supported =
    typeof window.speechSynthesis !== "undefined" &&
    typeof window.SpeechSynthesisUtterance !== "undefined";

  let voices = [];
  let chosen = null;
  let enabled = true; // narration on by default; toggled from the UI
  let gen = 0;        // bumps on every new line or stop, cancelling the old chain

  function ls(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val); } catch (e) {}
    return null;
  }

  // ---- 1. choosing the voice ---------------------------------------------
  // Higher is better. Neural and premium voices first, then the good cloud
  // voices, then any English voice; the old robotic voices last.
  const FAVOURITES = [
    "Microsoft Sonia Online (Natural)", "Microsoft Libby Online (Natural)", "Microsoft Ryan Online (Natural)",
    "Microsoft Aria Online (Natural)", "Microsoft Jenny Online (Natural)", "Microsoft Guy Online (Natural)",
    "Microsoft Ava Online (Natural)", "Microsoft Andrew Online (Natural)", "Microsoft Emma Online (Natural)",
    "Google UK English Female", "Google UK English Male", "Google US English",
    "Samantha", "Daniel", "Serena", "Karen", "Moira", "Tessa",
  ];
  function score(v) {
    const n = v.name || "", lang = v.lang || "";
    if (!/^en/i.test(lang)) return -1;
    let s = 0;
    if (/natural|neural/i.test(n)) s += 100;
    if (/premium|enhanced|siri/i.test(n)) s += 85;
    if (/^google/i.test(n)) s += 60;
    if (v.localService === false) s += 10;
    const fav = FAVOURITES.findIndex((f) => n.indexOf(f) === 0);
    if (fav >= 0) s += 30 - fav;
    if (/en[-_]GB/i.test(lang)) s += 8; else if (/en[-_](US|AU|IE|CA|NZ)/i.test(lang)) s += 6;
    if (/espeak|compact|novelty|bad news|bells|boing|bubbles|cellos|whisper|zarvox|trinoids|jester|organ|superstar|wobble|albert|bahh|fred|junior|ralph|kathy/i.test(n)) s -= 200;
    if (/desktop/i.test(n)) s -= 15;   // the old Windows SAPI voices
    return s;
  }
  function loadVoices() {
    if (!supported) return;
    voices = (window.speechSynthesis.getVoices() || []).filter((v) => score(v) >= 0);
    voices.sort((a, b) => score(b) - score(a));
    const pick = ls("cg_voice");
    chosen = (pick && voices.find((v) => v.name === pick)) || voices[0] || null;
  }
  if (supported) {
    loadVoices();
    try { window.speechSynthesis.addEventListener("voiceschanged", loadVoices); }
    catch (e) { window.speechSynthesis.onvoiceschanged = loadVoices; }
  }
  const natural = () => !!chosen && score(chosen) >= 60;

  // ---- 3. clean words ----------------------------------------------------
  function clean(text) {
    return String(text || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}]/gu, " ")
      .replace(/[★◆▸►•·]/g, " ")
      .replace(/\bSDGs\b/g, "S D Gs").replace(/\bSDG\b/g, "S D G")
      .replace(/\bMDGs\b/g, "M D Gs").replace(/\bUN\b/g, "U N")
      .replace(/(\d)\s?°C/g, "$1 degrees Celsius").replace(/°/g, " degrees")
      .replace(/\s&\s/g, " and ").replace(/\be\.g\./gi, "for example").replace(/\bi\.e\./gi, "that is")
      .replace(/\bvs\.?\b/gi, "versus").replace(/US\$\s?/g, "US dollars ")
      .replace(/\.\.\./g, "…")
      .replace(/\s+([.,!?;:…])/g, "$1")
      .replace(/\s+/g, " ").trim();
  }

  // ---- 2. phrasing ---------------------------------------------------------
  // Split into phrases: sentences, “…” beats, and long clauses at a comma or
  // a colon. Each phrase carries the pause that should follow it.
  function phrases(text) {
    const out = [];
    // A sentence ends at . ! ? followed by a space (so 1.5 and U.S. stay
    // whole), or at an ellipsis.
    const parts = text.match(/.+?(?:[.!?]+["”’)]*(?=\s|$)|…+|$)\s*/g) || [text];
    parts.forEach((p) => {
      p = p.trim();
      if (!p) return;
      const end = /…$/.test(p) ? "beat" : /\?["”’)]*$/.test(p) ? "q" : /!["”’)]*$/.test(p) ? "x" : "s";
      // break a long sentence at its clauses so the voice can breathe
      if (p.length > 140) {
        // (no look-behind: older Safari cannot parse it)
        const bits = p.replace(/([,;:])\s+/g, "$1\u0001").split("\u0001");
        let acc = "";
        bits.forEach((b, i) => {
          acc = acc ? acc + " " + b : b;
          if (acc.length > 70 || i === bits.length - 1) { out.push({ t: acc, end: i === bits.length - 1 ? end : "c" }); acc = ""; }
        });
      } else out.push({ t: p, end });
    });
    return out;
  }
  const GAP = { s: [140, 260], q: [220, 340], x: [160, 280], c: [60, 140], beat: [650, 900] };
  const jitter = (a, b) => a + Math.random() * (b - a);

  // Speak now, regardless of toggle (used by explicit "read aloud" buttons).
  // opts.onend fires once when the voice finishes (or errors / can't speak),
  // so callers can wait for the line to finish before moving on.
  N.speak = function (text, opts) {
    const onend = opts && opts.onend;
    let fired = false;
    const fire = () => { if (!fired) { fired = true; if (onend) onend(); } };
    if (!supported) { fire(); return; }
    const t = clean(text);
    if (!t) { fire(); return; }
    const my = ++gen;
    try { window.speechSynthesis.cancel(); } catch (e) {}
    if (!chosen) loadVoices();
    const list = phrases(t);
    const baseRate = (opts && opts.rate) || (natural() ? 1.0 : 0.95);
    const basePitch = (opts && opts.pitch) || 1.0;
    let i = 0;
    const next = () => {
      if (my !== gen) return;
      if (i >= list.length) { fire(); return; }
      const ph = list[i++];
      let rate = baseRate * jitter(0.97, 1.03), pitch = basePitch + jitter(-0.03, 0.03);
      if (ph.end === "q") pitch += 0.06;
      if (ph.end === "x") { rate *= 1.04; pitch += 0.05; }
      if (ph.end === "beat") rate *= 0.94;      // slow into a dramatic pause
      try {
        const u = new SpeechSynthesisUtterance(ph.t);
        if (chosen) u.voice = chosen;
        u.lang = (chosen && chosen.lang) || "en-GB";
        u.rate = Math.max(0.6, Math.min(1.4, rate));
        u.pitch = Math.max(0.6, Math.min(1.5, pitch));
        u.volume = 1.0;
        let done = false;
        const after = () => {
          if (done) return; done = true;
          if (my !== gen) return;
          const g = GAP[ph.end] || GAP.s;
          setTimeout(next, i >= list.length ? 0 : jitter(g[0], g[1]));
        };
        u.onend = after;
        u.onerror = after;
        window.speechSynthesis.speak(u);
        // Safety net: some engines never fire onend; move on after a fair wait.
        setTimeout(after, 2500 + ph.t.length * 110);
      } catch (e) { fire(); }
    };
    next();
  };

  // Speak only when narration is enabled (story beats, card reveals).
  // When narration is off, the line is silent but onend still fires so any
  // waiting caller proceeds immediately.
  N.auto = function (text, opts) {
    if (enabled) N.speak(text, opts);
    else if (opts && opts.onend) opts.onend();
  };

  N.supported = function () { return supported; };
  N.setEnabled = function (on) { enabled = !!on; if (!enabled) N.stop(); };
  N.isEnabled = function () { return enabled; };
  N.stop = function () { gen++; if (supported) try { window.speechSynthesis.cancel(); } catch (e) {} };

  // The English voices on this device, best first, for a voice picker.
  N.voices = function () {
    if (!voices.length) loadVoices();
    return voices.map((v) => ({ name: v.name, lang: v.lang, natural: score(v) >= 60 }));
  };
  N.voiceName = function () { return chosen ? chosen.name : ""; };
  N.setVoice = function (name) { ls("cg_voice", name || null); loadVoices(); };
  N.sample = function () {
    N.speak("Good evening, and welcome to the show. Tonight… seventeen goals, ten questions, and one winner. Are you ready?");
  };
})();
