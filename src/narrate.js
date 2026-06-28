/* =========================================================================
 * COMMON GROUND, THE LONG ROAD,  narrate.js
 * Spoken narration via the browser's built-in Web Speech API. No network, no
 * keys, no external assets. Reads the story and card text aloud in a warm
 * English voice. Degrades gracefully where speech synthesis is unavailable.
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

  // Preferred warm English voices, in order. Falls back to any en-* voice.
  const PREFERRED = [
    "Google UK English Female",
    "Microsoft Libby Online (Natural) - English (United Kingdom)",
    "Microsoft Sonia Online (Natural) - English (United Kingdom)",
    "Microsoft Aria Online (Natural) - English (United States)",
    "Samantha",
    "Google US English",
    "Daniel",
    "Microsoft Hazel - English (Great Britain)",
  ];

  function loadVoices() {
    if (!supported) return;
    voices = window.speechSynthesis.getVoices() || [];
    chosen = null;
    for (const want of PREFERRED) {
      const v = voices.find((x) => x.name === want);
      if (v) { chosen = v; return; }
    }
    // Otherwise prefer a British or US English voice, then any English voice.
    chosen =
      voices.find((x) => /en[-_]GB/i.test(x.lang)) ||
      voices.find((x) => /en[-_]US/i.test(x.lang)) ||
      voices.find((x) => /^en/i.test(x.lang)) ||
      null;
  }

  if (supported) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  N.supported = function () { return supported; };
  N.setEnabled = function (on) { enabled = !!on; if (!enabled) N.stop(); };
  N.isEnabled = function () { return enabled; };
  N.stop = function () { if (supported) try { window.speechSynthesis.cancel(); } catch (e) {} };

  function clean(text) {
    return String(text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

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
    try {
      window.speechSynthesis.cancel();
      if (!chosen) loadVoices();
      const u = new SpeechSynthesisUtterance(t);
      if (chosen) u.voice = chosen;
      u.lang = (chosen && chosen.lang) || "en-GB";
      u.rate = (opts && opts.rate) || 0.96; // a touch slower, warmer
      u.pitch = (opts && opts.pitch) || 1.0;
      u.volume = 1.0;
      u.onend = fire;
      u.onerror = fire;
      window.speechSynthesis.speak(u);
    } catch (e) { fire(); }
  };

  // Speak only when narration is enabled (story beats, card reveals).
  // When narration is off, the line is silent but onend still fires so any
  // waiting caller proceeds immediately.
  N.auto = function (text, opts) {
    if (enabled) N.speak(text, opts);
    else if (opts && opts.onend) opts.onend();
  };
})();
