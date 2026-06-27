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
  const B = CG.BOARD;

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

  // ---- state -------------------------------------------------------------
  const S = {
    players: [],
    current: 0,
    theatre: null,
    busy: false,
    over: false,
    settings: { music: true, voice: true, diceCount: 2 },
    decks: {},
    zoneSpoken: -1,
  };

  // Token colours, all distinct from ladder-wood and snake-green.
  const COLORS = ["#2f6bff", "#e8439b", "#7c4dff", "#ff7a1a"];
  const NAMES = ["Blue Mission", "Magenta Mission", "Violet Mission", "Amber Mission"];

  let boardBox = null, overlaySvg = null, resizeObs = null, relayoutHandler = null;

  // =======================================================================
  // SCREENS
  // =======================================================================
  function start() {
    S.decks.snake = makeDeck(CG.SNAKE_CARDS);
    S.decks.ladder = makeDeck(CG.LADDER_CARDS);
    S.decks.note = makeDeck(CG.FIELD_NOTES);
    S.decks.trophy = makeDeck(CG.TROPHY_CARDS);
    S.decks.diamond = makeDeck(CG.DIAMOND_CARDS);
    S.decks.surprise = makeDeck(CG.SURPRISE_CARDS);
    renderTitle();
  }

  function renderTitle() {
    teardownBoard();
    const root = app();
    root.innerHTML = "";
    const wrap = el("div", "screen title-screen");
    wrap.appendChild(el("div", "title-glow"));
    wrap.appendChild(el("div", "logo-mark", "◆"));
    wrap.appendChild(el("h1", "title", "Common Ground"));
    wrap.appendChild(el("p", "subtitle", "The Long Road"));
    wrap.appendChild(el("p", "tagline",
      "A field-coordination Snakes &amp; Ladders for a UN Country Team. Roll the dice, ride the lucky breaks, survive the crises, collect trophies and diamonds, and race a hundred squares to a finished mandate."));

    wrap.appendChild(el("p", "pick-label", "Choose your table"));
    const modes = el("div", "mode-row");
    [1, 2, 3].forEach((n) => {
      const b = el("button", "btn btn-primary",
        `<span class="mode-n">You + ${n}</span><span class="mode-sub">${n === 1 ? "rival" : "rivals"}</span>`);
      b.onclick = () => beginDeal(n + 1);
      modes.appendChild(b);
    });
    wrap.appendChild(modes);

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

  // ---- the deal ----------------------------------------------------------
  function beginDeal(numPlayers) {
    if (S.settings.music) CG.Audio.start();
    CG.Narrate.setEnabled(S.settings.voice);

    S.theatre = CG.THEATRES[Math.floor(Math.random() * CG.THEATRES.length)];
    const roles = shuffle(CG.ROLES);
    S.players = [];
    for (let i = 0; i < numPlayers; i++) {
      S.players.push({
        name: i === 0 ? "You" : NAMES[i] || ("Rival " + i),
        isAI: i !== 0,
        role: roles[i],
        pos: 1,
        color: COLORS[i % COLORS.length],
        trophies: 0,
        diamonds: 0,
        bonusRoll: false,
        skipNext: false,
      });
    }
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
    if (!boardBox || !overlaySvg) return;
    const bw = boardBox.clientWidth, bh = boardBox.clientHeight;
    if (!bw || !bh) return;
    const unit = Math.min(bw / 10, bh / 10);
    overlaySvg.setAttribute("viewBox", `0 0 ${bw} ${bh}`);
    overlaySvg.innerHTML = "";
    overlaySvg.appendChild(buildDefs());
    Object.keys(B.ladders).forEach((foot) =>
      drawLadder(centerPx(+foot, bw, bh), centerPx(B.ladders[foot], bw, bh), unit));
    Object.keys(B.snakes).forEach((head) =>
      drawSnake(centerPx(+head, bw, bh), centerPx(B.snakes[head], bw, bh), unit));
  }

  function buildDefs() {
    const defs = document.createElementNS(NS, "defs");
    defs.innerHTML =
      `<linearGradient id="snakeGrad" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="#6fb6ff"/><stop offset="0.5" stop-color="#3b86f0"/><stop offset="1" stop-color="#2461c8"/>` +
      `</linearGradient>` +
      `<radialGradient id="headGrad" cx="0.4" cy="0.32" r="0.85">` +
        `<stop offset="0" stop-color="#8fc6ff"/><stop offset="1" stop-color="#2f72db"/>` +
      `</radialGradient>` +
      `<linearGradient id="woodGrad" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="#d79b56"/><stop offset="1" stop-color="#a9692f"/>` +
      `</linearGradient>` +
      `<filter id="soft" x="-40%" y="-40%" width="180%" height="180%">` +
        `<feDropShadow dx="0" dy="1.2" stdDeviation="1.2" flood-color="#10233f" flood-opacity="0.28"/>` +
      `</filter>`;
    return defs;
  }

  function bez(p0, p1, p2, p3, t) {
    const m = 1 - t, a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
    return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
  }
  function svgEl(name, attrs) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    overlaySvg.appendChild(e);
    return e;
  }

  // A slim blue snake: a thin, tapered S-curved body with a small slim head,
  // tiny eyes and a forked tongue. No hood. Drawn in pixel space, kept slim
  // and 3D (gradient fill + outline + soft drop shadow).
  function drawSnake(head, tail, unit) {
    const dx = tail.x - head.x, dy = tail.y - head.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const bow = Math.min(unit * 1.5, len * 0.26);
    const c1 = { x: head.x + dx * 0.32 + nx * bow, y: head.y + dy * 0.32 + ny * bow };
    const c2 = { x: head.x + dx * 0.70 - nx * bow, y: head.y + dy * 0.70 - ny * bow };
    const neck = { x: head.x + dx * 0.05, y: head.y + dy * 0.05 };

    // ---- slim tapered body ----
    const N = 36, left = [], right = [], mids = [];
    const wHead = unit * 0.1, wTail = unit * 0.03;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const p = bez(neck, c1, c2, tail, t);
      const pn = bez(neck, c1, c2, tail, Math.min(1, t + 0.01));
      const tx = pn.x - p.x, ty = pn.y - p.y, tl = Math.hypot(tx, ty) || 1;
      const ox = -ty / tl, oy = tx / tl;
      const w = wHead + (wTail - wHead) * Math.pow(t, 0.8);
      left.push({ x: p.x + ox * w, y: p.y + oy * w });
      right.push({ x: p.x - ox * w, y: p.y - oy * w });
      mids.push({ p, ox, oy, w });
    }
    let d = `M ${left[0].x} ${left[0].y}`;
    left.forEach((p) => (d += ` L ${p.x} ${p.y}`));
    for (let i = right.length - 1; i >= 0; i--) d += ` L ${right[i].x} ${right[i].y}`;
    d += " Z";
    svgEl("path", { d, fill: "url(#snakeGrad)", stroke: "#1747a8", "stroke-width": Math.max(0.4, unit * 0.018), "stroke-linejoin": "round", filter: "url(#soft)" });

    // thin belly highlight down the centre
    const bd = `M ${neck.x} ${neck.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${tail.x} ${tail.y}`;
    svgEl("path", { d: bd, fill: "none", stroke: "#dcefff", "stroke-width": Math.max(0.3, unit * 0.022), "stroke-linecap": "round", opacity: "0.5" });

    // a few faint scale bands
    for (let i = 4; i < N - 3; i += 4) {
      const m = mids[i];
      svgEl("line", {
        x1: m.p.x + m.ox * m.w * 0.85, y1: m.p.y + m.oy * m.w * 0.85,
        x2: m.p.x - m.ox * m.w * 0.85, y2: m.p.y - m.oy * m.w * 0.85,
        stroke: "#2461c8", "stroke-width": Math.max(0.25, unit * 0.012), opacity: "0.45",
      });
    }

    // ---- small slim head ----
    const ang = Math.atan2(c1.y - head.y, c1.x - head.x); // toward the body
    const faceAng = ang + Math.PI;                         // where it looks
    const fx = Math.cos(faceAng), fy = Math.sin(faceAng);
    const sx = Math.cos(faceAng + Math.PI / 2), sy = Math.sin(faceAng + Math.PI / 2);
    const hp = { x: head.x, y: head.y };
    const hr = unit * 0.2;                                 // small head
    const headDeg = faceAng * 180 / Math.PI;
    svgEl("ellipse", { cx: hp.x, cy: hp.y, rx: hr, ry: hr * 0.6, fill: "url(#headGrad)", stroke: "#1747a8", "stroke-width": Math.max(0.4, unit * 0.018), transform: `rotate(${headDeg} ${hp.x} ${hp.y})`, filter: "url(#soft)" });

    // tiny eyes
    [-1, 1].forEach((s) => {
      const ex = hp.x + fx * hr * 0.1 + sx * hr * 0.42 * s;
      const ey = hp.y + fy * hr * 0.1 + sy * hr * 0.42 * s;
      svgEl("circle", { cx: ex, cy: ey, r: hr * 0.24, fill: "#ffffff" });
      svgEl("circle", { cx: ex + fx * hr * 0.05, cy: ey + fy * hr * 0.05, r: hr * 0.12, fill: "#0c1830" });
    });

    // forked tongue
    const sn = { x: hp.x + fx * hr * 1.15, y: hp.y + fy * hr * 1.15 };
    const tip = { x: hp.x + fx * hr * 2.1, y: hp.y + fy * hr * 2.1 };
    const fork = hr * 0.45;
    svgEl("path", {
      d: `M ${sn.x} ${sn.y} L ${tip.x} ${tip.y} ` +
         `M ${tip.x} ${tip.y} L ${tip.x + sx * fork + fx * fork * 0.5} ${tip.y + sy * fork + fy * fork * 0.5} ` +
         `M ${tip.x} ${tip.y} L ${tip.x - sx * fork + fx * fork * 0.5} ${tip.y - sy * fork + fy * fork * 0.5}`,
      stroke: "#e23b5a", "stroke-width": Math.max(0.4, unit * 0.024), fill: "none", "stroke-linecap": "round",
    });
    void nx; void ny;
  }

  function drawLadder(foot, top, unit) {
    const dx = top.x - foot.x, dy = top.y - foot.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const w = unit * 0.18;
    const line = (x1, y1, x2, y2, cls, sw) => {
      const p = document.createElementNS(NS, "line");
      p.setAttribute("x1", x1); p.setAttribute("y1", y1); p.setAttribute("x2", x2); p.setAttribute("y2", y2);
      p.setAttribute("class", cls); p.setAttribute("stroke-width", sw);
      overlaySvg.appendChild(p);
    };
    const railW = Math.max(1.0, unit * 0.085), edgeW = railW * 1.8;
    [-1, 1].forEach((s) => {
      line(foot.x + nx * w * s, foot.y + ny * w * s, top.x + nx * w * s, top.y + ny * w * s, "ladder-edge", edgeW);
    });
    [-1, 1].forEach((s) => {
      line(foot.x + nx * w * s, foot.y + ny * w * s, top.x + nx * w * s, top.y + ny * w * s, "ladder-rail", railW);
    });
    const rungs = Math.max(3, Math.round(len / (unit * 0.62)));
    for (let i = 1; i < rungs; i++) {
      const t = i / rungs, cx = foot.x + dx * t, cy = foot.y + dy * t;
      line(cx + nx * w, cy + ny * w, cx - nx * w, cy - ny * w, "ladder-rung", railW * 0.85);
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
    const n = p.pos;
    if (B.ladders[n]) {
      const card = S.decks.ladder();
      await showCard(p, card, "ladder", B.ladders[n]);
      if (S.settings.music) CG.Audio.sfx.ladder();
      toast(`${p.name} climbs to ${B.ladders[n]}`, "good");
      await slide(p, B.ladders[n], "up");
    } else if (B.snakes[n]) {
      const card = S.decks.snake();
      await showCard(p, card, "snake", B.snakes[n]);
      if (S.settings.music) CG.Audio.sfx.snake();
      toast(`${p.name} slides to ${B.snakes[n]}`, "bad");
      shake();
      await slide(p, B.snakes[n], "down");
    } else if (B.trophies.includes(n)) {
      const card = S.decks.trophy();
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

  async function slide(p, to, kind) {
    const i = S.players.indexOf(p);
    const t = $("#tok" + i);
    if (t) t.classList.add("sliding");
    p.pos = to;
    moveTokenTo(i, to);
    burst(to, kind, kind === "up" ? 18 : 14);
    await sleep(780);
    if (t) t.classList.remove("sliding");
    if (S.settings.music) CG.Audio.setProgress(p.pos);
    renderTokens();
  }

  // =======================================================================
  // CARD OVERLAYS
  // =======================================================================
  const CONT = { ladder: "Climb ▸", snake: "Slide ▾", trophy: "Collect ▸", diamond: "Grab it ▸", surprise: "Open it ▸" };
  const BAND = { ladder: "A LADDER", snake: "A SNAKE", trophy: "A TROPHY", diamond: "A DIAMOND", surprise: "A SURPRISE" };

  function showCard(p, card, kind, dest) {
    return new Promise((resolve) => {
      const text = `${card.why} ${card.fact}`;
      CG.Narrate.auto(`${card.title}. ${text}`);
      const over = el("div", "overlay-card");
      const c = el("div", `event-card ${kind}`);
      const moveHtml = dest != null
        ? `<div class="ec-move">${p.pos} ${kind === "ladder" ? "▲" : "▼"} ${dest}</div>` : "";
      c.innerHTML =
        `<div class="ec-band">${BAND[kind] || ""}</div>` +
        `<div class="ec-icon">${card.icon}</div>` +
        `<div class="ec-title">${card.title}</div>` +
        moveHtml +
        `<div class="ec-why">${card.why}</div>` +
        `<div class="ec-fact"><span>Fun fact</span>${card.fact}</div>`;
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
      if (p.isAI) setTimeout(() => { if (over.parentNode) done(); }, 3300);
    });
  }

  function showNote(p, note) {
    return new Promise((resolve) => {
      CG.Narrate.auto(`Field note. ${note}`);
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
    let line = youWon ? CG.STORY.winVsAI : CG.STORY.loseVsAI;
    const you = S.players[0];
    const loot = [];
    if (you.trophies) loot.push(`${you.trophies} ${you.trophies > 1 ? "trophies" : "trophy"}`);
    if (you.diamonds) loot.push(`${you.diamonds} ${you.diamonds > 1 ? "diamonds" : "diamond"}`);
    if (loot.length) line += ` Along the way you gathered ${loot.join(" and ")}.`;
    CG.Narrate.auto(line);

    const over = el("div", "overlay-card show");
    const c = el("div", "event-card win");
    c.innerHTML =
      `<div class="ec-band">${youWon ? "VICTORY" : "THE RIVAL FINISHES FIRST"}</div>` +
      `<div class="ec-icon">${youWon ? "🏆" : "🏳️"}</div>` +
      `<div class="ec-title">${youWon ? "Mandate Complete" : winner.name + " gets there first"}</div>` +
      `<div class="ec-why">${line}</div>`;
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

  // ---- boot --------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", start);
})();
