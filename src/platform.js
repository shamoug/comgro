/* =========================================================================
 * COMMON GROUND, platform.js
 * The game launcher. Boots the page and lets the player choose which game to
 * play. Each game registers itself (CG.SnakesGame, CG.LudoGame) and exposes a
 * show() method; the launcher just mounts the chosen one. Games return here
 * via their own "back to games" link.
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});
  const app = () => document.getElementById("app");
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function show() {
    if (CG.Narrate) CG.Narrate.stop();
    const root = app();
    root.innerHTML = "";
    const wrap = el("div", "screen platform-screen");
    wrap.appendChild(el("div", "title-glow"));
    wrap.appendChild(el("div", "logo-mark", "◆"));
    wrap.appendChild(el("h1", "title", "Common Ground"));
    wrap.appendChild(el("p", "subtitle", "The Game Room"));
    wrap.appendChild(el("p", "tagline",
      "Two games, one table. Pick how you want to play, gather your AI rivals, and learn a little about how real coordination works along the way."));

    const grid = el("div", "game-grid");

    const snakes = el("button", "game-card snakes-card");
    snakes.innerHTML =
      `<div class="gc-icon">🪜🕳️</div>` +
      `<div class="gc-title">The Long Road</div>` +
      `<div class="gc-sub">Ladders &amp; Holes</div>` +
      `<div class="gc-desc">Race a hundred squares to a finished mandate. Climb the lucky breaks, dodge the crises, collect trophies and diamonds. A different board every time.</div>` +
      `<div class="gc-play">Play ▸</div>`;
    snakes.onclick = () => CG.SnakesGame && CG.SnakesGame.show();

    const ludo = el("button", "game-card ludo-card");
    ludo.innerHTML =
      `<div class="gc-icon">🎲🏠</div>` +
      `<div class="gc-title">Field Ludo</div>` +
      `<div class="gc-sub">The classic, four colours</div>` +
      `<div class="gc-desc">Roll a six to deploy, race your four teams home, and send rivals back to base on the way. Simple, tense, and endlessly replayable.</div>` +
      `<div class="gc-play">Play ▸</div>`;
    ludo.onclick = () => CG.LudoGame && CG.LudoGame.show();

    grid.appendChild(snakes);
    grid.appendChild(ludo);
    wrap.appendChild(grid);
    wrap.appendChild(el("p", "byline", "Designed by <b>Digital Solutions Lab</b>"));
    root.appendChild(wrap);
  }

  CG.Platform = { show };
  document.addEventListener("DOMContentLoaded", show);
})();
