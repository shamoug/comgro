/* =========================================================================
 * COMMON GROUND, platform.js
 * The launcher and game chooser. Common Ground now has two games: The Long Road
 * (CG.SnakesGame, a cinematic Snakes & Ladders played solo or in a multiplayer
 * Crisis Theatre) and Hold the Line (CG.TowerDefense, a solo tower defence).
 * show() draws the chooser; each game's in-game Quit button calls back here.
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // The chooser: two cards, one per game. The Long Road opens into the
  // multiplayer lobby (name yourself, see the open Crisis Theatres, join one);
  // Hold the Line opens its own solo title. If a game module is missing, its
  // card is simply hidden so the page still works.
  function show() {
    if (CG.Narrate) CG.Narrate.stop();
    const root = document.getElementById("app");
    if (!root) return;
    root.innerHTML = "";
    const wrap = el("div", "screen title-screen home-screen");
    wrap.appendChild(el("div", "title-glow"));
    wrap.appendChild(el("div", "logo-mark", "◆"));
    wrap.appendChild(el("h1", "title", "Common Ground"));
    wrap.appendChild(el("p", "subtitle", "Two ways to play"));
    wrap.appendChild(el("p", "tagline",
      "A pair of games about the same work: a UN Country Team holding a crisis together. Pick one to begin."));

    const row = el("div", "home-row");

    if (CG.Lobby || CG.SnakesGame) {
      const a = gameCard("◆", "The Long Road",
        "A cinematic race of Ladders and Holes. Roll the dice, ride the lucky breaks, survive the crises, and reach a finished mandate. Solo or multiplayer.",
        "Enter ▸", () => { if (CG.Lobby) CG.Lobby.show(); else CG.SnakesGame.show(); });
      row.appendChild(a);
    }
    if (CG.TowerDefense) {
      const b = gameCard("🛡️", "Hold the Line",
        "A tower defence. Waves of crises march on the community you protect. Place UN partners along the road and hold the line through every wave. Solo.",
        "Enter ▸", () => CG.TowerDefense.show());
      row.appendChild(b);
    }
    wrap.appendChild(row);
    root.appendChild(wrap);
  }

  function gameCard(icon, title, body, cta, onGo) {
    const c = el("div", "home-card");
    c.innerHTML =
      `<div class="hc-icon">${icon}</div>` +
      `<div class="hc-title">${title}</div>` +
      `<div class="hc-body">${body}</div>`;
    const go = el("button", "btn btn-primary", cta);
    go.onclick = () => { if (CG.Audio) CG.Audio.sfx.pick(); onGo(); };
    c.appendChild(go);
    c.onclick = (e) => { if (e.target === go) return; if (CG.Audio) CG.Audio.sfx.click(); onGo(); };
    return c;
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
