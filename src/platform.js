/* =========================================================================
 * COMMON GROUND, platform.js
 * The launcher, the game chooser and the router. Common Ground has three
 * games: The Long Road (CG.SnakesGame, a cinematic Snakes & Ladders played
 * solo or in a multiplayer Crisis Theatre), Hold the Line (CG.TowerDefense, a
 * solo tower defence) and Situation Report (CG.SitRep, a two-officer word
 * game, solo, same-device or online).
 *
 * Each game has its own address, so a game can be linked, bookmarked and
 * shared on its own:
 *   /              the chooser
 *   /longroad/     The Long Road
 *   /holdtheline/  Hold the Line
 *   /sitrep/       Situation Report
 * Every address serves the same app (see src/boot.js); this file reads the
 * last path segment and opens the matching game instead of the chooser. A
 * chooser card navigates to its game's address, and each game's in-game Quit
 * button calls CG.Platform.show(), which navigates back to the chooser, so
 * the browser's Back button does the obvious thing throughout.
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // ---- the routes --------------------------------------------------------
  // available() keeps a missing module from stranding the page on a blank
  // screen: the address simply falls back to the chooser.
  const ROUTES = {
    longroad: {
      available: () => !!(CG.Lobby || CG.SnakesGame),
      start: () => (CG.Lobby ? CG.Lobby.show() : CG.SnakesGame.show()),
    },
    holdtheline: {
      available: () => !!CG.TowerDefense,
      start: () => CG.TowerDefense.show(),
    },
    sitrep: {
      available: () => !!CG.SitRep,
      start: () => CG.SitRep.show(),
    },
  };

  // Which game this address asks for, if any. Works served from a folder
  // (/sitrep/), opened as a file (sitrep/index.html) and with ?game=sitrep.
  function routeKey() {
    const path = location.pathname.replace(/\/index\.html?$/i, "").replace(/\/+$/, "");
    const seg = decodeURIComponent(path.split("/").pop() || "").toLowerCase();
    if (ROUTES[seg]) return seg;
    const q = (/[?&]game=([a-z]+)/i.exec(location.search) || [])[1];
    return q && ROUTES[q.toLowerCase()] ? q.toLowerCase() : "";
  }
  // <base href> on a game page points at the site root, so "./" is the
  // chooser and "sitrep/" is a game, from any address.
  const isFile = location.protocol === "file:";
  const homeUrl = () => new URL(isFile ? "index.html" : "./", document.baseURI).href;
  const gameUrl = (key) => new URL(key + (isFile ? "/index.html" : "/"), document.baseURI).href;
  function go(key) {
    if (routeKey() === key) return ROUTES[key].start();
    location.href = gameUrl(key);
  }

  function onReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  // The chooser: one card per game. The Long Road opens into the multiplayer
  // lobby (name yourself, see the open Crisis Theatres, join one); Hold the
  // Line and Situation Report open their own titles. If a game module is missing, its
  // card is simply hidden so the page still works.
  // The way back from a game. From a game's own address that means going to
  // the chooser's address; from the chooser it just redraws.
  function show() {
    if (routeKey()) { location.href = homeUrl(); return; }
    renderChooser();
  }

  function renderChooser() {
    if (CG.Narrate) CG.Narrate.stop();
    const root = document.getElementById("app");
    if (!root) return;
    root.innerHTML = "";
    const wrap = el("div", "screen title-screen home-screen");
    wrap.appendChild(el("div", "title-glow"));
    wrap.appendChild(el("div", "logo-mark", "◆"));
    wrap.appendChild(el("h1", "title", "Common Ground"));
    wrap.appendChild(el("p", "subtitle", "Three ways to play"));
    wrap.appendChild(el("p", "tagline",
      "Three games about the same work: a UN Country Team holding a crisis together. Pick one to begin."));

    const row = el("div", "home-row");

    if (CG.Lobby || CG.SnakesGame) {
      const a = gameCard("◆", "The Long Road",
        "A cinematic race of Ladders and Holes. Roll the dice, ride the lucky breaks, survive the crises, and reach a finished mandate. Solo or multiplayer.",
        "Enter ▸", () => go("longroad"));
      row.appendChild(a);
    }
    if (CG.TowerDefense) {
      const b = gameCard("🛡️", "Hold the Line",
        "A tower defence. Waves of crises march on the community you protect. Place UN partners along the road and hold the line through every wave. Solo.",
        "Enter ▸", () => go("holdtheline"));
      row.appendChild(b);
    }
    if (CG.SitRep) {
      const c = gameCard("📡", "Situation Report",
        "A word game for two field officers. Watch each other type, use each other's reports, and be the first to decode the five-letter cable from the humanitarian, development and peacebuilding glossary. Solo, same device or online.",
        "Enter ▸", () => go("sitrep"));
      c.classList.add("is-new");
      row.appendChild(c);
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

  CG.Platform = { show, go, routeKey, gameUrl, homeUrl };
  onReady(() => {
    initBackdropDismiss();
    initPullToRefresh();
    const key = routeKey();
    if (key && ROUTES[key].available()) ROUTES[key].start();
    else renderChooser();
  });
})();
