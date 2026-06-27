/* =========================================================================
 * COMMON GROUND, narrate.js
 * Optional spoken narration via the browser's built-in Web Speech API
 * (speechSynthesis). No network, no keys, no external assets. Reads game
 * text aloud in the currently selected language. Honours a settings toggle.
 *
 * It degrades gracefully: if the browser has no speech synthesis (or no voice
 * for the chosen language) the speaker buttons simply do nothing harmful.
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});
  const N = (CG.Narrate = {});

  const supported = typeof window.speechSynthesis !== "undefined" &&
    typeof window.SpeechSynthesisUtterance !== "undefined";

  // Map our language codes to BCP-47 voice locales.
  const LOCALE = { en: "en", fr: "fr", es: "es", zh: "zh-CN", ru: "ru", ar: "ar" };

  let voices = [];
  function loadVoices() { if (supported) voices = window.speechSynthesis.getVoices() || []; }
  if (supported) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function pickVoice(lang) {
    const want = (LOCALE[lang] || "en").toLowerCase();
    if (!voices.length) loadVoices();
    // exact-ish locale match first (e.g. zh-CN), then language prefix
    let v = voices.find((x) => x.lang && x.lang.toLowerCase() === want);
    if (!v) v = voices.find((x) => x.lang && x.lang.toLowerCase().indexOf(want.split("-")[0]) === 0);
    return v || null;
  }

  N.supported = function () { return supported; };
  N.enabled = function () { return !!(CG.state && CG.state.settings && CG.state.settings.narrate); };

  N.stop = function () { if (supported) try { window.speechSynthesis.cancel(); } catch (e) {} };

  // Strip simple HTML tags so we don't read "<strong>" aloud.
  function clean(text) {
    return String(text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  // Speak immediately (used by the speaker buttons regardless of the toggle).
  N.speak = function (text) {
    if (!supported) return;
    const t = clean(text);
    if (!t) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      const lang = (CG.state && CG.state.lang) || "en";
      const v = pickVoice(lang);
      if (v) u.voice = v;
      u.lang = (v && v.lang) || LOCALE[lang] || "en";
      u.rate = lang === "ar" || lang === "zh" ? 0.95 : 1.0;
      u.pitch = 1.0;
      window.speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  };

  // Speak only if the narration setting is on (auto-narration on phase text).
  N.auto = function (text) { if (N.enabled()) N.speak(text); };

  // Build a small speaker button that reads `getText()` aloud on click.
  // getText may be a string or a function returning a string.
  N.button = function (getText) {
    const b = document.createElement("button");
    b.className = "speak-btn";
    b.type = "button";
    b.setAttribute("aria-label", (CG.tc && CG.tc("ui.speak")) || "Read aloud");
    b.title = (CG.tc && CG.tc("ui.speak")) || "Read aloud";
    b.textContent = "🔊";
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      const txt = typeof getText === "function" ? getText() : getText;
      N.speak(txt);
    });
    return b;
  };
})();
