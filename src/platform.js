/* =========================================================================
 * COMMON GROUND, platform.js
 * The game launcher. Boots the page and lets the player choose which game to
 * play. Each game registers itself (CG.SnakesGame, CG.MandateGame) and exposes
 * a show() method; the launcher just mounts the chosen one. Games return here
 * via their own "back to games" link. More games can be added as cards below.
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

    const mandate = el("button", "game-card mandate-card");
    mandate.innerHTML =
      `<div class="gc-icon">🧭🏁</div>` +
      `<div class="gc-title">The Mandate</div>` +
      `<div class="gc-sub">Find the path to the mission</div>` +
      `<div class="gc-desc">Start from your own gate and find your way to the centre, where the mission is accomplished. Roll the die, take the shortcuts, dodge the traps that get you lost. A different route every time, finished only when the last team is home.</div>` +
      `<div class="gc-play">Play ▸</div>`;
    mandate.onclick = () => CG.MandateGame && CG.MandateGame.show();

    grid.appendChild(snakes);
    grid.appendChild(mandate);
    wrap.appendChild(grid);
    wrap.appendChild(el("p", "byline", "Designed by <b>Digital Solutions Lab</b>"));
    root.appendChild(wrap);
  }

  // Tap outside a floating card to dismiss it. Clicking the dim backdrop runs
  // the card's own primary action (Continue / Carry on / Run again), so the
  // game flow resolves exactly as if the button were pressed. Crossroads cards
  // have no primary button (a choice must be made), so they stay put.
  function initBackdropDismiss() {
    document.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.classList && t.classList.contains("overlay-card")) {
        const primary = t.querySelector(".btn-primary");
        if (primary) primary.click();
      }
    });
  }

  // Pull-to-refresh for touch screens. The page disables native overscroll, so
  // we roll our own: pull down from the top past a threshold and release to
  // hard-reload (a fresh, cache-busted load of the page).
  function initPullToRefresh() {
    const THRESHOLD = 80;
    let startY = 0, active = false, dy = 0, ind = null;

    const atTop = (node) => {
      let n = node;
      while (n && n !== document.body && n.nodeType === 1) {
        if (n.scrollHeight > n.clientHeight + 1) {
          const oy = getComputedStyle(n).overflowY;
          if (oy === "auto" || oy === "scroll") return n.scrollTop <= 0;
        }
        n = n.parentElement;
      }
      return true;
    };
    const ensureInd = () => {
      if (ind) return ind;
      ind = el("div", "ptr",
        `<span class="ptr-arrow">↓</span><span class="ptr-txt">Pull to refresh</span>`);
      document.body.appendChild(ind);
      return ind;
    };
    const remove = () => {
      if (!ind) return;
      const node = ind; ind = null;
      node.style.transform = "translate(-50%, -100%)";
      setTimeout(() => node.remove(), 200);
    };

    document.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1 || !atTop(e.target)) { active = false; return; }
      active = true; startY = e.touches[0].clientY; dy = 0;
    }, { passive: true });

    document.addEventListener("touchmove", (e) => {
      if (!active) return;
      dy = e.touches[0].clientY - startY;
      if (dy <= 0) { remove(); return; }
      const pull = Math.min(dy * 0.5, THRESHOLD * 1.3);
      const node = ensureInd();
      node.style.transform = `translate(-50%, ${pull}px) translateY(-100%)`;
      const ready = dy >= THRESHOLD;
      node.classList.toggle("ready", ready);
      node.querySelector(".ptr-txt").textContent = ready ? "Release to refresh" : "Pull to refresh";
    }, { passive: true });

    document.addEventListener("touchend", () => {
      if (active && dy >= THRESHOLD) {
        if (ind) ind.querySelector(".ptr-txt").textContent = "Refreshing…";
        const u = new URL(location.href);
        u.searchParams.set("_", Date.now());
        location.replace(u.toString());
        return;
      }
      active = false; remove();
    });
  }

  CG.Platform = { show };
  document.addEventListener("DOMContentLoaded", () => {
    show();
    initBackdropDismiss();
    initPullToRefresh();
  });
})();
