/* =========================================================================
 * COMMON GROUND, THE LONG ROAD,  game.js
 * The whole game: state, board, dice, movement, the shuffled decks, and the
 * render layer. Vanilla JS, no framework, no build step. All flavour text
 * lives in data/content.js; this file is pure mechanics + DOM.
 *
 * THE GAME
 *   A field-coordination Snakes & Ladders for a UN Country Team. You always
 *   play against AI rivals. Roll one or two dice, race a hundred squares to a
 *   finished mandate. Climb ladders, dodge snakes, and collect trophies,
 *   diamonds and surprise cards along the way. Every landing is read aloud.
 *
 * The board fills the screen (cells are rectangles). Snakes, ladders and
 * tokens are drawn in real pixel space so nothing distorts, and redraw on
 * resize. All shapes are CSS/SVG, no external images.
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});

  // ---- tiny helpers ------------------------------------------------------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const app = () => document.getElementById("app");
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  // Player names are typed by humans now, so escape them before innerHTML.
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function makeDeck(cards) {
    let order = shuffle(cards), i = 0;
    return function draw() {
      if (i >= order.length) { order = shuffle(cards); i = 0; }
      return order[i++];
    };
  }

  // ---- board geometry ----------------------------------------------------
  function cell(n) {
    const row = Math.floor((n - 1) / 10);          // 0 at the bottom
    const idx = (n - 1) % 10;
    const col = row % 2 === 0 ? idx : 9 - idx;      // boustrophedon
    const vrow = 9 - row;                           // 0 at the top (visual)
    return { col, vrow };
  }
  // percent coordinates (for token positioning)
  function centerPct(n) {
    const c = cell(n);
    return { x: (c.col + 0.5) * 10, y: (c.vrow + 0.5) * 10 };
  }
  // pixel coordinates inside the measured board (for SVG drawing)
  function centerPx(n, bw, bh) {
    const c = cell(n);
    return { x: (c.col + 0.5) * (bw / 10), y: (c.vrow + 0.5) * (bh / 10) };
  }

  // square number at a visual (col, vrow); inverse of cell()
  function squareAt(col, vrow) {
    const row = 9 - vrow;
    const idx = row % 2 === 0 ? col : 9 - col;
    return row * 10 + idx + 1;
  }

  // ---- dynamic board: a fresh, valid layout every game ------------------
  // Ladders and snakes run STRAIGHT UP A COLUMN (no diagonals). A vertical line
  // in a column always connects a lower square (more vrow) to a higher one.
  function generateBoard() {
    const used = new Set([1, 100]);
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const ladders = {}, snakes = {};
    function placeVertical(isLadder, target) {
      let placed = 0, g = 0;
      while (placed < target && g++ < 600) {
        const col = rnd(0, 9);
        const vTop = rnd(0, 6);          // smaller vrow = higher square
        const vBot = vTop + rnd(2, 4);   // larger vrow = lower square
        if (vBot > 9) continue;
        const topSq = squareAt(col, vTop), botSq = squareAt(col, vBot);
        if (topSq === 100 || botSq === 1 || topSq === 1 || botSq === 100) continue;
        // reserve EVERY cell the chute passes through, so ladders and tunnels
        // never share a box. A chute is clear only if all its cells are free.
        const span = [];
        for (let v = vTop; v <= vBot; v++) span.push(squareAt(col, v));
        if (span.some((s) => used.has(s))) continue;
        span.forEach((s) => used.add(s));
        if (isLadder) ladders[botSq] = topSq; else snakes[topSq] = botSq;
        placed++;
      }
    }
    placeVertical(true, 6);
    placeVertical(false, 6);
    const take = (n) => {
      const out = []; let gg = 0;
      while (out.length < n && gg++ < 700) {
        const s = rnd(2, 99);
        if (used.has(s)) continue;
        used.add(s); out.push(s);
      }
      return out;
    };
    return { ladders, snakes, trophies: take(4), diamonds: take(5), surprises: take(6), fieldNotes: take(5) };
  }

  // Draw a card, favouring ones whose tag matches the crisis theatre, so the
  // challenges and openings fit where you are posted. Avoid repeating the last
  // card so back-to-back draws stay varied.
  const lastDrawn = new WeakMap();
  function weightedDraw(cards, tags) {
    const pool = [];
    cards.forEach((c) => {
      const match = c.tag && c.tag !== "any" && tags && tags.indexOf(c.tag) >= 0;
      const w = match ? 3 : 1;
      for (let i = 0; i < w; i++) pool.push(c);
    });
    let pick = pool[Math.floor(Math.random() * pool.length)], tries = 0;
    while (pick === lastDrawn.get(cards) && tries++ < 5) pick = pool[Math.floor(Math.random() * pool.length)];
    lastDrawn.set(cards, pick);
    return pick;
  }

  // ---- the UN 2.0 Quintet of Change -------------------------------------
  // Every player carries the five capabilities. Ladders strengthen one, snakes
  // set one back (never below zero). The capability touched is inferred from
  // the card's tag, so the nudge fits the event.
  function newQuintet() {
    const q = {};
    CG.QUINTET.forEach((c) => (q[c.key] = 0));
    return q;
  }
  function applyQuintet(p, tag, dir) {
    const key = CG.quintetForTag(tag);
    const meta = CG.quintetMeta(key);
    const level = Math.max(0, (p.quintet[key] || 0) + dir);
    p.quintet[key] = level;
    return { key, meta, dir, level };
  }

  // Fill {role} / {theatre} placeholders for the player who landed here.
  function fillCard(card, p) {
    const role = p.role.name, theatre = (S.theatre && S.theatre.name) || "";
    const sub = (s) => String(s).replace(/\{role\}/g, role).replace(/\{theatre\}/g, theatre);
    return Object.assign({}, card, { title: sub(card.title), why: sub(card.why), fact: sub(card.fact) });
  }

  // ---- state -------------------------------------------------------------
  const S = {
    players: [],
    current: 0,
    theatre: null,
    busy: false,
    over: false,
    settings: { music: true, voice: true, diceCount: 1 },
    decks: {},
    zoneSpoken: -1,
  };

  // Token colours, all distinct from ladder-wood and snake-blue.
  const COLORS = ["#2f6bff", "#e8439b", "#7c4dff", "#ff7a1a"];

  let boardBox = null, overlaySvg = null, resizeObs = null, relayoutHandler = null;
  let decksReady = false;

  // =======================================================================
  // SCREENS
  // =======================================================================
  function ensureDecks() {
    if (decksReady) return;
    S.decks.note = makeDeck(CG.FIELD_NOTES);
    S.decks.trophy = makeDeck(CG.TROPHY_CARDS);
    S.decks.diamond = makeDeck(CG.DIAMOND_CARDS);
    S.decks.surprise = makeDeck(CG.SURPRISE_CARDS);
    decksReady = true;
  }

  function renderTitle() {
    teardownBoard();
    const root = app();
    root.innerHTML = "";
    const wrap = el("div", "screen title-screen");
    wrap.appendChild(el("div", "title-glow"));
    if (CG.Platform) {
      const back = el("button", "back-link", "← Games");
      back.onclick = () => { CG.Narrate.stop(); CG.Platform.show(); };
      wrap.appendChild(back);
    }
    wrap.appendChild(el("div", "logo-mark", "◆"));
    wrap.appendChild(el("h1", "title", "Common Ground"));
    wrap.appendChild(el("p", "subtitle", "The Long Road"));
    wrap.appendChild(el("p", "tagline",
      "A field-coordination Snakes &amp; Ladders for a UN Country Team. Roll the dice, ride the lucky breaks, survive the crises, collect trophies and diamonds, and race a hundred squares to a finished mandate."));

    wrap.appendChild(el("p", "pick-label", "Dice"));
    const diceRow = el("div", "seg-row");
    [{ n: 1, label: "🎲 One die" }, { n: 2, label: "🎲🎲 Two dice" }].forEach((opt) => {
      const b = el("button", "seg" + (S.settings.diceCount === opt.n ? " on" : ""), opt.label);
      b.onclick = () => {
        S.settings.diceCount = opt.n;
        diceRow.querySelectorAll(".seg").forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
        CG.Audio.sfx.click();
      };
      diceRow.appendChild(b);
    });
    wrap.appendChild(diceRow);

    const toggles = el("div", "toggle-row");
    toggles.appendChild(toggle("🎵 Music", S.settings.music, (on) => { S.settings.music = on; CG.Audio.setMuted(!on); }));
    toggles.appendChild(toggle("🗣️ Narration", S.settings.voice, (on) => { S.settings.voice = on; CG.Narrate.setEnabled(on); }));
    wrap.appendChild(toggles);

    const go = el("button", "btn btn-primary big", "Build your table ▸");
    go.style.marginTop = "22px";
    go.onclick = () => { CG.Audio.sfx.click(); openSetup(); };
    wrap.appendChild(go);

    wrap.appendChild(el("p", "credit",
      "Music and narration are generated live in your browser. No downloads, no accounts. Headphones recommended."));
    wrap.appendChild(el("p", "byline", "Designed by <b>Digital Solutions Lab</b>"));
    root.appendChild(wrap);
  }

  function toggle(label, on, fn) {
    const b = el("button", "chip-toggle" + (on ? " on" : ""), label);
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.onclick = () => {
      const now = b.classList.toggle("on");
      b.setAttribute("aria-pressed", now ? "true" : "false");
      fn(now);
    };
    return b;
  }

  // ---- the table: choose Human or AI for every seat ---------------------
  function openSetup() {
    CG.Setup.open({
      icon: "◆",
      title: "The Long Road",
      subtitle: "Set the table",
      intro: "Choose who takes each seat. Pick Human and name yourself; pick AI and a rival coordinator joins the field. Two to four play.",
      seatColors: COLORS,
      minSeats: 2, maxSeats: 4, defaultSeats: 2,
      startLabel: "Deal the postings ▸",
      onBack: () => renderTitle(),
      onStart: (roster) => beginDeal(roster),
    });
  }

  // ---- the deal ----------------------------------------------------------
  function beginDeal(roster) {
    if (S.settings.music) CG.Audio.start();
    CG.Narrate.setEnabled(S.settings.voice);

    // fresh, surprising every game: random theatre, board layout, roles
    S.theatre = CG.THEATRES[Math.floor(Math.random() * CG.THEATRES.length)];
    S.board = generateBoard();
    const roles = shuffle(CG.ROLES);
    S.players = roster.map((seat, i) => ({
      name: seat.name,
      isAI: seat.isAI,
      role: roles[i % roles.length],
      pos: 1,
      color: COLORS[i % COLORS.length],
      trophies: 0,
      diamonds: 0,
      quintet: newQuintet(),
      bonusRoll: false,
      skipNext: false,
    }));
    S.current = 0; S.over = false; S.zoneSpoken = -1;
    renderDeal();
  }

  function renderDeal() {
    const root = app();
    root.innerHTML = "";
    const wrap = el("div", "screen deal-screen");
    wrap.appendChild(el("p", "deal-kicker", "Your posting"));
    wrap.appendChild(el("h2", "deal-head", "The Country Team"));

    const theatre = el("div", "deal-card theatre-card");
    theatre.innerHTML =
      `<div class="deal-icon">${S.theatre.icon}</div>` +
      `<div class="deal-label">Crisis Theatre</div>` +
      `<div class="deal-title">${S.theatre.name}</div>` +
      `<div class="deal-text">${S.theatre.blurb}</div>`;
    wrap.appendChild(theatre);

    const row = el("div", "deal-roles");
    S.players.forEach((p, i) => {
      const c = el("div", "deal-card role-card");
      c.style.setProperty("--tok", p.color);
      c.style.animationDelay = (0.08 * i) + "s";
      c.innerHTML =
        `<div class="deal-avatar" style="--tok:${p.color}">${p.role.icon}</div>` +
        `<div class="deal-label" style="color:${p.color}">${p.name}</div>` +
        `<div class="deal-title small">${p.role.name}</div>` +
        `<div class="deal-text">${p.role.tag}</div>`;
      row.appendChild(c);
    });
    wrap.appendChild(row);

    const go = el("button", "btn btn-primary big", "Begin the Road ▸");
    go.onclick = () => { CG.Audio.sfx.pick(); renderBoard(); kickOff(); };
    wrap.appendChild(go);
    root.appendChild(wrap);
    CG.Narrate.auto(CG.STORY.opening);
  }

  // =======================================================================
  // BOARD
  // =======================================================================
  const NS = "http://www.w3.org/2000/svg";

  function teardownBoard() {
    if (resizeObs) { try { resizeObs.disconnect(); } catch (e) {} resizeObs = null; }
    if (relayoutHandler) { window.removeEventListener("resize", relayoutHandler); relayoutHandler = null; }
    boardBox = null; overlaySvg = null;
  }

  function renderBoard() {
    teardownBoard();
    const B = S.board;
    const root = app();
    root.innerHTML = "";
    const wrap = el("div", "screen board-screen");
    wrap.appendChild(el("div", "bg-layer"));

    const bar = el("header", "hud-top");
    bar.innerHTML = `<div class="brand">◆ <b>Common Ground</b><span> · The Long Road</span></div>`;
    bar.appendChild(el("div", "theatre-chip", `${S.theatre.icon} ${S.theatre.name}`));
    const ctrls = el("div", "hud-ctrls");
    ctrls.appendChild(toggle("🎵", S.settings.music, (on) => { S.settings.music = on; CG.Audio.setMuted(!on); }));
    ctrls.appendChild(toggle("🗣️", S.settings.voice, (on) => { S.settings.voice = on; CG.Narrate.setEnabled(on); }));
    const restart = el("button", "chip-toggle", "↺");
    restart.title = "New game";
    restart.onclick = () => { CG.Narrate.stop(); renderTitle(); };
    ctrls.appendChild(restart);
    bar.appendChild(ctrls);
    wrap.appendChild(bar);

    const standings = el("aside", "standings"); standings.id = "standings";
    wrap.appendChild(standings);

    const stage = el("div", "board-stage");
    boardBox = el("div", "board-box"); boardBox.id = "boardBox";

    const grid = el("div", "grid"); grid.id = "grid";
    for (let vr = 0; vr < 10; vr++) {
      for (let col = 0; col < 10; col++) {
        const row = 9 - vr;
        const n = row % 2 === 0 ? row * 10 + col + 1 : row * 10 + (9 - col) + 1;
        const sq = el("div", "sq");
        sq.dataset.n = n;
        if ((vr + col) % 2 === 0) sq.classList.add("alt");
        let tag = `<span class="sq-n">${n}</span>`;
        if (n === 1) { sq.classList.add("startsq"); tag += `<span class="sq-ic">✈️</span>`; }
        else if (n === 100) { sq.classList.add("finish"); tag += `<span class="sq-ic">🏁</span>`; }
        else if (B.trophies.includes(n)) { sq.classList.add("sp-trophy"); tag += `<span class="sq-ic">🏆</span>`; }
        else if (B.diamonds.includes(n)) { sq.classList.add("sp-diamond"); tag += `<span class="sq-ic">💎</span>`; }
        else if (B.surprises.includes(n)) { sq.classList.add("sp-surprise"); tag += `<span class="sq-ic">❓</span>`; }
        else if (B.fieldNotes.includes(n)) { sq.classList.add("sp-note"); tag += `<span class="sq-ic">★</span>`; }
        sq.innerHTML = tag;
        grid.appendChild(sq);
      }
    }
    boardBox.appendChild(grid);

    overlaySvg = document.createElementNS(NS, "svg");
    overlaySvg.setAttribute("class", "overlay");
    boardBox.appendChild(overlaySvg);

    const fx = el("div", "fx"); fx.id = "fx"; boardBox.appendChild(fx);
    const tokens = el("div", "token-layer"); tokens.id = "tokens"; boardBox.appendChild(tokens);
    stage.appendChild(boardBox);
    wrap.appendChild(stage);

    const dock = el("div", "dice-dock"); dock.id = "dock";
    let diceHtml = "";
    for (let i = 0; i < S.settings.diceCount; i++) diceHtml += `<div class="die" id="die${i}">${pips(1)}</div>`;
    dock.innerHTML = `<div class="turn-tag" id="turnTag">Your move</div><div class="dice" id="dice">${diceHtml}</div>`;
    const btn = el("button", "btn btn-roll", "🎲 Roll"); btn.id = "rollBtn"; btn.onclick = onRoll;
    dock.appendChild(btn);
    wrap.appendChild(dock);

    const toasts = el("div", "toast-area"); toasts.id = "toasts";
    wrap.appendChild(toasts);
    wrap.appendChild(el("div", "board-credit", "Designed by <b>Digital Solutions Lab</b>"));

    root.appendChild(wrap);

    // Draw immediately (reading clientWidth forces a synchronous layout, so this
    // works even in a hidden tab where rAF/ResizeObserver may not fire), then
    // keep redrawing on real resizes.
    renderStandings();
    relayout();
    relayoutHandler = () => relayout();
    window.addEventListener("resize", relayoutHandler);
    try {
      resizeObs = new ResizeObserver(() => relayout());
      resizeObs.observe(boardBox);
    } catch (e) { /* ResizeObserver unavailable: window resize still covers it */ }
  }

  function relayout() {
    if (!boardBox) return;
    drawOverlay();
    renderTokens();
  }

  // ---- SVG overlay drawn in pixel space ---------------------------------
  function drawOverlay() {
    if (!boardBox || !overlaySvg || !S.board) return;
    const B = S.board;
    const bw = boardBox.clientWidth, bh = boardBox.clientHeight;
    if (!bw || !bh) return;
    const unit = Math.min(bw / 10, bh / 10);
    overlaySvg.setAttribute("viewBox", `0 0 ${bw} ${bh}`);
    overlaySvg.innerHTML = "";
    overlaySvg.appendChild(buildDefs());
    Object.keys(B.ladders).forEach((foot) =>
      drawLadder(centerPx(+foot, bw, bh), centerPx(B.ladders[foot], bw, bh), unit, +foot));
    Object.keys(B.snakes).forEach((head) =>
      drawTunnel(centerPx(+head, bw, bh), centerPx(B.snakes[head], bw, bh), unit, +head));
  }

  function buildDefs() {
    const defs = document.createElementNS(NS, "defs");
    defs.innerHTML =
      // ladder rail: solid 3D green, shaded across its width like a cylinder
      `<linearGradient id="ladderRail" x1="0" y1="0" x2="1" y2="0">` +
        `<stop offset="0" stop-color="#176233"/><stop offset="0.42" stop-color="#5fd083"/>` +
        `<stop offset="0.58" stop-color="#54c679"/><stop offset="1" stop-color="#176233"/>` +
      `</linearGradient>` +
      // ladder rung: rounded green bar
      `<linearGradient id="ladderRung" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="#6ad592"/><stop offset="1" stop-color="#2f9e54"/>` +
      `</linearGradient>` +
      // tunnel pipe: glossy teal-steel cylinder
      `<linearGradient id="portalPipe" x1="0" y1="0" x2="1" y2="0">` +
        `<stop offset="0" stop-color="#123846"/><stop offset="0.5" stop-color="#3f8aa6"/><stop offset="1" stop-color="#123846"/>` +
      `</linearGradient>` +
      // the dark mouth of the tunnel, deep in the middle, lit at the rim
      `<radialGradient id="portalGrad" cx="0.5" cy="0.42" r="0.62">` +
        `<stop offset="0" stop-color="#05080c"/><stop offset="0.5" stop-color="#0f2230"/>` +
        `<stop offset="0.82" stop-color="#1f5066"/><stop offset="1" stop-color="#3f8aa6"/>` +
      `</radialGradient>` +
      // soft glow around the mouth
      `<radialGradient id="portalGlow" cx="0.5" cy="0.5" r="0.5">` +
        `<stop offset="0" stop-color="#86e6ff" stop-opacity="0.85"/><stop offset="1" stop-color="#86e6ff" stop-opacity="0"/>` +
      `</radialGradient>` +
      `<filter id="soft" x="-40%" y="-40%" width="180%" height="180%">` +
        `<feDropShadow dx="0" dy="1.2" stdDeviation="1.2" flood-color="#10233f" flood-opacity="0.28"/>` +
      `</filter>`;
    return defs;
  }

  // create an SVG element with attrs and append it to a parent (svg by default)
  function mk(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    (parent || overlaySvg).appendChild(e);
    return e;
  }

  // A TUNNEL that drops you back: a glossy vertical pipe from the lit mouth
  // (head, the higher square) down to an exit (tail), with a beveled rim, a deep
  // dark opening, a soft glow, and downward chevrons. Straight and vertical.
  // The whole shape lives in a <g.tunnel> so it can be found and animated; the
  // mouth sits in <g.tunnel-mouth> so it can swell when it swallows a player.
  function drawTunnel(head, tail, unit, headSq) {
    const dx = tail.x - head.x, dy = tail.y - head.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;     // head (top) -> tail (bottom)
    const px = -uy, py = ux;                  // across the pipe
    const W = unit * 0.15;                     // pipe half-width
    const g = mk("g", { class: "tunnel", "data-head": headSq });

    // pipe body, rounded at the exit
    const hL = { x: head.x + px * W, y: head.y + py * W };
    const hR = { x: head.x - px * W, y: head.y - py * W };
    const tL = { x: tail.x + px * W, y: tail.y + py * W };
    const tR = { x: tail.x - px * W, y: tail.y - py * W };
    const tip = { x: tail.x + ux * W, y: tail.y + uy * W };
    mk("path", {
      d: `M ${hL.x} ${hL.y} L ${tL.x} ${tL.y} Q ${tip.x} ${tip.y} ${tR.x} ${tR.y} L ${hR.x} ${hR.y} Z`,
      fill: "url(#portalPipe)", stroke: "#0e2d3c", "stroke-width": Math.max(0.4, unit * 0.018), "stroke-linejoin": "round", filter: "url(#soft)",
    }, g);
    // glossy highlight running down one side of the pipe
    mk("path", { d: `M ${head.x + px * W * 0.45} ${head.y + py * W * 0.45} L ${tail.x + px * W * 0.45} ${tail.y + py * W * 0.45}`, fill: "none", stroke: "#cdf2ff", "stroke-width": Math.max(0.3, unit * 0.02), "stroke-linecap": "round", opacity: "0.35" }, g);

    // downward chevrons (it takes you back)
    const arrows = Math.max(1, Math.round(len / (unit * 0.9)));
    for (let i = 1; i <= arrows; i++) {
      const t = i / (arrows + 1), cx = head.x + dx * t, cy = head.y + dy * t;
      const aw = W * 0.5, ah = W * 0.42;
      mk("path", {
        d: `M ${cx + px * aw - ux * ah} ${cy + py * aw - uy * ah} L ${cx + ux * ah} ${cy + uy * ah} L ${cx - px * aw - ux * ah} ${cy - py * aw - uy * ah}`,
        fill: "none", stroke: "#e3f7ff", "stroke-width": Math.max(0.3, unit * 0.022), "stroke-linecap": "round", "stroke-linejoin": "round", opacity: "0.7",
      }, g);
    }

    // exit opening at the bottom
    mk("ellipse", { cx: tail.x, cy: tail.y, rx: W * 0.72, ry: W * 0.4, fill: "#06141d", opacity: "0.88" }, g);

    // the lit mouth at the top, in its own group so it can swell on a swallow
    const m = mk("g", { class: "tunnel-mouth" }, g);
    mk("ellipse", { cx: head.x, cy: head.y, rx: W * 1.85, ry: W * 1.12, fill: "url(#portalGlow)", opacity: "0.75" }, m);
    mk("ellipse", { cx: head.x, cy: head.y, rx: W * 1.5, ry: W * 0.92, fill: "#d2ecf4", stroke: "#5f93a6", "stroke-width": Math.max(0.4, unit * 0.016), filter: "url(#soft)" }, m);
    mk("ellipse", { cx: head.x, cy: head.y, rx: W * 1.18, ry: W * 0.7, fill: "#5b8497" }, m);
    mk("ellipse", { cx: head.x, cy: head.y, rx: W * 0.95, ry: W * 0.56, fill: "url(#portalGrad)" }, m);
    // a crescent glint on the rim
    mk("path", { d: `M ${head.x - W * 0.72} ${head.y - W * 0.06} A ${W * 0.85} ${W * 0.48} 0 0 1 ${head.x + W * 0.45} ${head.y - W * 0.44}`, fill: "none", stroke: "#f0ffff", "stroke-width": Math.max(0.3, unit * 0.014), "stroke-linecap": "round", opacity: "0.6" }, m);
  }

  function drawLadder(foot, top, unit, footSq) {
    const dx = top.x - foot.x, dy = top.y - foot.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const w = unit * 0.17;
    const g = mk("g", { class: "ladder", "data-foot": footSq });
    const line = (x1, y1, x2, y2, cls, sw) =>
      mk("line", { x1, y1, x2, y2, class: cls, "stroke-width": sw, "stroke-linecap": "round" }, g);
    const railW = Math.max(1.0, unit * 0.08), edgeW = railW * 1.7;
    // dark green underside, nudged down a touch for a 3D lift
    [-1, 1].forEach((s) => {
      line(foot.x + nx * w * s, foot.y + ny * w * s + unit * 0.022, top.x + nx * w * s, top.y + ny * w * s + unit * 0.022, "ladder-edge", edgeW);
    });
    // solid 3D green rails
    [-1, 1].forEach((s) => {
      line(foot.x + nx * w * s, foot.y + ny * w * s, top.x + nx * w * s, top.y + ny * w * s, "ladder-rail", railW);
    });
    const rungs = Math.max(3, Math.round(len / (unit * 0.6)));
    for (let i = 1; i < rungs; i++) {
      const t = i / rungs, cx = foot.x + dx * t, cy = foot.y + dy * t;
      line(cx + nx * w, cy + ny * w, cx - nx * w, cy - ny * w, "ladder-rung", railW * 0.82);
    }
  }

  // ---- standings ---------------------------------------------------------
  function renderStandings() {
    const box = $("#standings");
    if (!box) return;
    box.innerHTML = "";
    const order = S.players.map((p, i) => ({ p, i })).sort((a, b) => b.p.pos - a.p.pos);
    order.forEach(({ p, i }) => {
      const card = el("div", "scard" + (i === S.current && !S.over ? " active" : ""));
      card.style.setProperty("--tok", p.color);
      let loot = "";
      if (p.trophies) loot += `<span>🏆${p.trophies > 1 ? "×" + p.trophies : ""}</span>`;
      if (p.diamonds) loot += `<span>💎${p.diamonds > 1 ? "×" + p.diamonds : ""}</span>`;
      card.innerHTML =
        `<span class="savatar" style="--tok:${p.color}">${p.role.icon}</span>` +
        `<span class="sinfo"><b>${p.name}</b><small>${p.role.name}</small>${loot ? `<span class="sloot">${loot}</span>` : ""}</span>` +
        `<span class="spos">${p.pos}</span>`;
      box.appendChild(card);
    });
    // Show the Quintet meter for the player in focus: the one whose turn it is
    // (so it follows hotseat humans), or the first human otherwise.
    const focus = quintetFocus();
    if (focus && focus.quintet) box.appendChild(quintPanel(focus));
  }

  function quintetFocus() {
    const cur = S.players[S.current];
    if (cur && !cur.isAI) return cur;
    return S.players.find((p) => !p.isAI) || S.players[0];
  }

  // A player's UN 2.0 Quintet of Change, shown casually as a meter.
  function quintPanel(p) {
    const panel = el("div", "quint-panel");
    let chips = "";
    CG.QUINTET.forEach((q) => {
      const lvl = p.quintet[q.key] || 0;
      chips +=
        `<span class="qchip${lvl > 0 ? " on" : ""}" title="${q.name}: ${q.blurb}">` +
          `<span class="q-ic">${q.icon}</span><span class="q-lv">${lvl}</span>` +
        `</span>`;
    });
    const multipleHumans = S.players.filter((x) => !x.isAI).length > 1;
    const label = multipleHumans ? `${esc(p.name)} · Quintet of Change` : "UN 2.0 Quintet of Change";
    panel.innerHTML =
      `<div class="quint-label">${label}</div>` +
      `<div class="quint-row">${chips}</div>`;
    return panel;
  }

  function pips(v) {
    const map = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
    const on = new Set(map[v] || []);
    let html = "";
    for (let i = 0; i < 9; i++) html += `<i class="pip${on.has(i) ? " on" : ""}"></i>`;
    return html;
  }

  // =======================================================================
  // TOKENS + MOVEMENT
  // =======================================================================
  function tokenSize() {
    if (!boardBox) return 28;
    return Math.min(boardBox.clientWidth, boardBox.clientHeight) / 10 * 0.74;
  }

  function renderTokens() {
    const layer = $("#tokens");
    if (!layer) return;
    layer.innerHTML = "";
    const size = tokenSize();
    const bySquare = {};
    S.players.forEach((p, i) => (bySquare[p.pos] = bySquare[p.pos] || []).push(i));
    S.players.forEach((p, i) => {
      const c = centerPct(p.pos);
      const group = bySquare[p.pos];
      const k = group.indexOf(i);
      const spread = group.length > 1 ? (k - (group.length - 1) / 2) * (size * 0.5) : 0;
      const t = el("div", "token" + (i === S.current && !S.over ? " active" : ""));
      t.id = "tok" + i;
      t.style.setProperty("--tok", p.color);
      t.style.width = size + "px"; t.style.height = size + "px";
      t.style.left = `calc(${c.x}% + ${spread}px)`;
      t.style.top = c.y + "%";
      t.innerHTML = `<span class="tok-face" style="font-size:${size * 0.5}px">${p.role.icon}</span>`;
      layer.appendChild(t);
    });
  }

  function moveTokenTo(i, n) {
    const t = $("#tok" + i);
    if (!t) return;
    const c = centerPct(n);
    t.style.left = c.x + "%";
    t.style.top = c.y + "%";
  }

  function toast(msg, kind) {
    const area = $("#toasts");
    if (!area) return;
    const t = el("div", "toast " + (kind || ""), msg);
    area.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 350); }, 2600);
    while (area.children.length > 4) area.removeChild(area.firstChild);
  }

  function burst(n, kind, count) {
    const fx = $("#fx");
    if (!fx) return;
    const c = centerPct(n);
    count = count || 14;
    for (let i = 0; i < count; i++) {
      const p = el("div", "particle " + kind);
      p.style.left = c.x + "%"; p.style.top = c.y + "%";
      let ang, dist;
      if (kind === "down") { ang = Math.PI / 2 + (Math.random() - 0.5) * 1.4; dist = 12 + Math.random() * 22; }
      else { ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.3; dist = 18 + Math.random() * 30; }
      p.style.setProperty("--dx", (Math.cos(ang) * dist) + "px");
      p.style.setProperty("--dy", (Math.sin(ang) * dist) + "px");
      p.style.animationDelay = (Math.random() * 0.1) + "s";
      fx.appendChild(p);
      setTimeout(() => p.remove(), 1100);
    }
  }

  function shake() {
    if (!boardBox) return;
    boardBox.classList.remove("shake"); void boardBox.offsetWidth; boardBox.classList.add("shake");
    setTimeout(() => boardBox.classList.remove("shake"), 500);
  }

  // =======================================================================
  // TURN FLOW
  // =======================================================================
  function kickOff() { setTurnTag(); if (S.players[S.current].isAI) scheduleAI(); }

  function setTurnTag() {
    const tt = $("#turnTag");
    const p = S.players[S.current];
    if (tt) tt.innerHTML = S.over ? "Game over" :
      `<span class="dot" style="background:${p.color}"></span>${p.isAI ? p.name + " is moving…" : "Your move"}`;
    const btn = $("#rollBtn");
    if (btn) { btn.disabled = S.busy || S.over || p.isAI; btn.classList.toggle("ai", p.isAI && !S.over); }
  }

  function scheduleAI() {
    if (S.over) return;
    setTurnTag();
    setTimeout(() => { if (!S.over && S.players[S.current].isAI) onRoll(); }, 850);
  }

  // Hide the floating panels (standings + dice dock) while a token travels, so
  // the board is clean to watch; bring them back only when a roll is needed.
  function setMoving(on) {
    const s = $(".board-screen");
    if (s) s.classList.toggle("moving", !!on);
  }

  async function onRoll() {
    if (S.busy || S.over) return;
    S.busy = true;
    const btn = $("#rollBtn"); if (btn) btn.disabled = true;

    const p = S.players[S.current];
    const rolls = [];
    for (let i = 0; i < S.settings.diceCount; i++) rolls.push(1 + Math.floor(Math.random() * 6));
    if (S.settings.music) CG.Audio.sfx.dice();

    await animateDice(rolls);
    const sum = rolls.reduce((a, b) => a + b, 0);
    const doubles = rolls.length === 2 && rolls[0] === rolls[1];
    const rollText = rolls.length > 1 ? `${rolls.join(" + ")} = <b>${sum}</b>` : `<b>${sum}</b>`;
    toast(`${p.name} rolls ${rollText}${doubles ? " · doubles" : ""}`, "roll");

    let target = p.pos + sum, bounced = false;
    if (target > 100) { target = 100 - (target - 100); bounced = true; }

    setMoving(true); // clear the board while the token travels
    await walk(p, target);
    if (bounced) toast(`${p.name} overshoots and bounces back to ${target}`, "muted");

    await resolveLanding(p, 0);
    setMoving(false); // a roll is coming up: bring the panels back
    if (p.pos === 100) return finish(p);

    const again = doubles || p.bonusRoll;
    p.bonusRoll = false;
    if (again && !S.over) {
      if (S.settings.music) CG.Audio.sfx.doubles();
      toast(`${p.name} earns another roll`, "good");
      S.busy = false; setTurnTag();
      if (p.isAI) scheduleAI();
      return;
    }
    endTurn();
  }

  function endTurn() {
    S.busy = false;
    let guard = 0;
    do {
      S.current = (S.current + 1) % S.players.length;
      const np = S.players[S.current];
      if (np.skipNext) { np.skipNext = false; toast(`${np.name} loses a turn`, "muted"); }
      else break;
    } while (++guard <= S.players.length);
    renderStandings(); renderTokens(); setTurnTag();
    if (!S.over && S.players[S.current].isAI) scheduleAI();
  }

  async function animateDice(values) {
    const dice = values.map((_, i) => $("#die" + i));
    dice.forEach((e) => e && e.classList.add("rolling"));
    for (let i = 0; i < 9; i++) {
      dice.forEach((e) => e && (e.innerHTML = pips(1 + Math.floor(Math.random() * 6))));
      await sleep(65);
    }
    dice.forEach((e, i) => {
      if (!e) return;
      e.innerHTML = pips(values[i]); e.classList.remove("rolling"); e.classList.add("settle");
    });
    setTimeout(() => dice.forEach((e) => e && e.classList.remove("settle")), 260);
    await sleep(200);
  }

  async function walk(p, target) {
    const idx = S.players.indexOf(p);
    const dir = target >= p.pos ? 1 : -1;
    while (p.pos !== target) {
      p.pos += dir;
      moveTokenTo(idx, p.pos);
      if (S.settings.music) CG.Audio.sfx.step();
      maybeSpeakZone(p);
      renderStandings();
      await sleep(235);
    }
    if (S.settings.music) CG.Audio.setProgress(p.pos);
    renderTokens();
  }

  function maybeSpeakZone(p) {
    if (p.isAI) return;
    const z = Math.min(3, Math.floor((p.pos - 1) / 25));
    if (z > S.zoneSpoken) { S.zoneSpoken = z; CG.Narrate.auto(CG.STORY.zones[z]); }
  }

  async function resolveLanding(p, depth) {
    depth = depth || 0;
    const B = S.board;
    const tags = (S.theatre && S.theatre.tags) || [];
    const n = p.pos;
    if (B.ladders[n]) {
      const card = weightedDraw(CG.LADDER_CARDS, tags);
      const q = applyQuintet(p, card.tag, +1);
      await showCard(p, card, "ladder", B.ladders[n], q);
      if (S.settings.music) CG.Audio.sfx.ladder();
      toast(`${p.name} climbs to ${B.ladders[n]}`, "good");
      if (!p.isAI) toast(`${q.meta.icon} ${q.meta.name} strengthened`, "good");
      await slide(p, B.ladders[n], "up", n);
    } else if (B.snakes[n]) {
      const card = weightedDraw(CG.SNAKE_CARDS, tags);
      const q = applyQuintet(p, card.tag, -1);
      await showCard(p, card, "snake", B.snakes[n], q);
      if (S.settings.music) CG.Audio.sfx.snake();
      toast(`${p.name} drops down to ${B.snakes[n]}`, "bad");
      if (!p.isAI) toast(`${q.meta.icon} ${q.meta.name} set back`, "bad");
      shake();
      await slide(p, B.snakes[n], "down", n);
    } else if (B.trophies.includes(n)) {
      const card = fillCard(S.decks.trophy(), p);
      p.trophies++;
      await showCard(p, card, "trophy", null);
      if (S.settings.music) CG.Audio.sfx.note();
      burst(n, "up", 18);
      p.bonusRoll = true;
      toast(`${p.name} collects a trophy 🏆`, "good");
    } else if (B.diamonds.includes(n)) {
      const card = S.decks.diamond();
      p.diamonds++;
      await showCard(p, card, "diamond", null);
      if (S.settings.music) CG.Audio.sfx.note();
      burst(n, "up", 18);
      toast(`${p.name} finds a diamond 💎`, "good");
      await hop(p, 3, depth);
    } else if (B.surprises.includes(n)) {
      const card = S.decks.surprise();
      await showCard(p, card, "surprise", null);
      await applySurprise(p, card, depth);
    } else if (B.fieldNotes.includes(n)) {
      const note = S.decks.note();
      if (S.settings.music) CG.Audio.sfx.note();
      await showNote(p, note);
    }
    renderStandings();
  }

  async function applySurprise(p, card, depth) {
    switch (card.effect) {
      case "bonus": p.bonusRoll = true; toast(`${p.name} earns a bonus roll`, "good"); break;
      case "skip": p.skipNext = true; toast(`${p.name} will lose a turn`, "bad"); break;
      case "gem": p.diamonds++; burst(p.pos, "up", 14); toast(`${p.name} pockets a diamond 💎`, "good"); break;
      case "advance": toast(`${p.name} jumps ahead`, "good"); await hop(p, 3, depth); break;
      default: break;
    }
  }

  // a forward hop (treasure / lucky break); may chain once into another square
  async function hop(p, n, depth) {
    const dest = Math.min(100, p.pos + n);
    if (dest === p.pos) return;
    await walk(p, dest);
    if (p.pos === 100) return; // onRoll will detect the win
    if (depth < 2) await resolveLanding(p, depth + 1);
  }

  async function slide(p, to, kind, fromSq) {
    const i = S.players.indexOf(p);
    const t = $("#tok" + i);
    if (t) t.classList.add("sliding");
    // give the chute some life as it is used
    if (kind === "up") animateLadder(fromSq);
    else animateTunnel(fromSq);
    p.pos = to;
    moveTokenTo(i, to);
    burst(to, kind, kind === "up" ? 18 : 14);
    await sleep(780);
    if (t) t.classList.remove("sliding");
    if (S.settings.music) CG.Audio.setProgress(p.pos);
    renderTokens();
  }

  // shake the ladder being climbed
  function animateLadder(footSq) {
    if (!overlaySvg || footSq == null) return;
    const g = overlaySvg.querySelector(`.ladder[data-foot="${footSq}"]`);
    if (!g) return;
    g.classList.remove("shake");
    void g.getBBox();           // force a reflow so the animation can replay
    g.classList.add("shake");
    setTimeout(() => g.classList.remove("shake"), 700);
  }

  // swell the tunnel mouth as it swallows a player
  function animateTunnel(headSq) {
    if (!overlaySvg || headSq == null) return;
    const m = overlaySvg.querySelector(`.tunnel[data-head="${headSq}"] .tunnel-mouth`);
    if (!m) return;
    m.classList.remove("swallow");
    void m.getBBox();
    m.classList.add("swallow");
    setTimeout(() => m.classList.remove("swallow"), 760);
  }

  // =======================================================================
  // CARD OVERLAYS
  // =======================================================================
  const CONT = { ladder: "Climb ▸", snake: "Down you go ▾", trophy: "Collect ▸", diamond: "Grab it ▸", surprise: "Open it ▸" };
  const BAND = { ladder: "A LADDER", snake: "A TUNNEL", trophy: "A TROPHY", diamond: "A DIAMOND", surprise: "A SURPRISE" };

  // Read a card aloud and, for an AI player, dismiss it only once the voice has
  // finished, so we never advance to the next card or player mid-sentence. With
  // narration off (or unsupported) we fall back to a fixed reading pause. A
  // safety cap guards against a voice that never reports it ended.
  function narrateCard(p, spoken, over, done, fallbackMs) {
    const voiced = CG.Narrate.isEnabled() && CG.Narrate.supported();
    if (!p.isAI) { CG.Narrate.auto(spoken); return; } // human paces with the button
    let advanced = false;
    const advance = () => { if (!advanced) { advanced = true; if (over.parentNode) done(); } };
    if (voiced) {
      CG.Narrate.auto(spoken, { onend: () => setTimeout(advance, 650) });
      setTimeout(advance, 16000); // safety: never freeze on a stuck voice
    } else {
      CG.Narrate.auto(spoken);
      setTimeout(advance, fallbackMs);
    }
  }

  function showCard(p, card, kind, dest, q) {
    return new Promise((resolve) => {
      const quintSpoken = q
        ? ` Your ${q.meta.name} capability ${q.dir > 0 ? "grows stronger" : "takes a hit"}.`
        : "";
      const text = `${card.why} ${card.fact}`;
      const spoken = `${card.title}. ${text}${quintSpoken}`;
      const over = el("div", "overlay-card");
      const c = el("div", `event-card ${kind}`);
      const moveHtml = dest != null
        ? `<div class="ec-move">${p.pos} ${kind === "ladder" ? "▲" : "▼"} ${dest}</div>` : "";
      const quintHtml = q
        ? `<div class="ec-quint ${q.dir > 0 ? "up" : "down"}">` +
            `<span class="eq-ic">${q.meta.icon}</span>` +
            `<span class="eq-txt"><b>${q.meta.name}</b> ${q.dir > 0 ? "strengthened" : "set back"}` +
            `<small>UN 2.0 Quintet of Change</small></span>` +
            `<span class="eq-delta">${q.dir > 0 ? "+1" : "−1"}</span>` +
          `</div>`
        : "";
      c.innerHTML =
        `<div class="ec-band">${BAND[kind] || ""}</div>` +
        `<div class="ec-icon">${card.icon}</div>` +
        `<div class="ec-title">${card.title}</div>` +
        moveHtml +
        `<div class="ec-why">${card.why}</div>` +
        `<div class="ec-fact"><span>Fun fact</span>${card.fact}</div>` +
        quintHtml;
      const actions = el("div", "ec-actions");
      const speak = el("button", "btn btn-ghost", "🔊 Read aloud");
      speak.onclick = () => CG.Narrate.speak(`${card.title}. ${text}`);
      const cont = el("button", "btn btn-primary", CONT[kind] || "Continue ▸");
      const done = () => { over.classList.remove("show"); setTimeout(() => over.remove(), 250); resolve(); };
      cont.onclick = done;
      actions.appendChild(speak); actions.appendChild(cont);
      c.appendChild(actions);
      over.appendChild(c);
      app().appendChild(over);
      requestAnimationFrame(() => over.classList.add("show"));
      narrateCard(p, spoken, over, done, 3300);
    });
  }

  function showNote(p, note) {
    return new Promise((resolve) => {
      const spoken = `Field note. ${note}`;
      const over = el("div", "overlay-card");
      const c = el("div", "event-card note");
      c.innerHTML =
        `<div class="ec-band">FIELD NOTE</div>` +
        `<div class="ec-icon">★</div>` +
        `<div class="ec-fact big"><span>From the field</span>${note}</div>`;
      const actions = el("div", "ec-actions");
      const speak = el("button", "btn btn-ghost", "🔊 Read aloud");
      speak.onclick = () => CG.Narrate.speak(`Field note. ${note}`);
      const cont = el("button", "btn btn-primary", "Carry on ▸");
      const done = () => { over.classList.remove("show"); setTimeout(() => over.remove(), 250); resolve(); };
      cont.onclick = done;
      actions.appendChild(speak); actions.appendChild(cont);
      c.appendChild(actions);
      over.appendChild(c);
      app().appendChild(over);
      requestAnimationFrame(() => over.classList.add("show"));
      if (p.isAI) setTimeout(() => { if (over.parentNode) done(); }, 2600);
    });
  }

  // =======================================================================
  // FINISH
  // =======================================================================
  function finish(winner) {
    S.over = true; S.busy = false;
    setMoving(false);
    renderStandings(); renderTokens();
    if (S.settings.music) { winner.isAI ? CG.Audio.sfx.lose() : CG.Audio.sfx.win(); CG.Audio.setProgress(100); }
    if (!winner.isAI) confetti();

    const youWon = !winner.isAI;
    // Recap the winner's run, whoever they are (works for hotseat humans too).
    let line = youWon
      ? (winner.name === "You" ? CG.STORY.winVsAI
          : `${winner.name} reaches the end of the road first, leaving the country a little stronger, a little fairer, and quite able to do without them. Mandate complete.`)
      : CG.STORY.loseVsAI;
    const loot = [];
    if (winner.trophies) loot.push(`${winner.trophies} ${winner.trophies > 1 ? "trophies" : "trophy"}`);
    if (winner.diamonds) loot.push(`${winner.diamonds} ${winner.diamonds > 1 ? "diamonds" : "diamond"}`);
    if (loot.length) line += ` Along the way ${youWon && winner.name === "You" ? "you" : winner.name} gathered ${loot.join(" and ")}.`;
    const built = CG.QUINTET.filter((q) => (winner.quintet[q.key] || 0) > 0).map((q) => q.name);
    if (built.length) line += ` Strongest capabilities of the UN 2.0 Quintet: ${built.join(", ")}.`;
    CG.Narrate.auto(line);

    const over = el("div", "overlay-card show");
    const c = el("div", "event-card win");
    c.innerHTML =
      `<div class="ec-band">${youWon ? "MANDATE COMPLETE" : "THE RIVAL FINISHES FIRST"}</div>` +
      `<div class="ec-icon">${youWon ? "🏆" : "🏳️"}</div>` +
      `<div class="ec-title">${youWon ? esc(winner.name) + " completes the mandate" : esc(winner.name) + " gets there first"}</div>` +
      `<div class="ec-why">${esc(line)}</div>`;
    const actions = el("div", "ec-actions");
    const again = el("button", "btn btn-primary", "Run the road again ▸");
    again.onclick = () => { over.remove(); CG.Narrate.stop(); renderTitle(); };
    const speak = el("button", "btn btn-ghost", "🔊 Read aloud");
    speak.onclick = () => CG.Narrate.speak(line);
    actions.appendChild(speak); actions.appendChild(again);
    c.appendChild(actions);
    over.appendChild(c);
    app().appendChild(over);
  }

  function confetti() {
    const fx = $("#fx");
    if (!fx) return;
    const cols = ["#2f6bff", "#ffce5a", "#7c4dff", "#3ed598", "#e8439b"];
    for (let i = 0; i < 64; i++) {
      const p = el("div", "confetti");
      p.style.left = (8 + Math.random() * 84) + "%";
      p.style.top = "-4%";
      p.style.background = cols[i % cols.length];
      p.style.setProperty("--dx", ((Math.random() - 0.5) * 40) + "px");
      p.style.setProperty("--dy", (70 + Math.random() * 40) + "px");
      p.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg");
      p.style.animationDelay = (Math.random() * 0.6) + "s";
      fx.appendChild(p);
      setTimeout(() => p.remove(), 2600);
    }
  }

  // ---- public API (the platform launcher mounts the game) ---------------
  CG.SnakesGame = {
    title: "Common Ground: The Long Road",
    show: function () { ensureDecks(); teardownBoard(); renderTitle(); },
  };
})();
