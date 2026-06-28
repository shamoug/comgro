/* =========================================================================
 * COMMON GROUND, ludo.js
 * Field Ludo: the classic four-colour race, now run on the SAME engine of
 * Ladders and Holes as The Long Road. You start with a Crisis Theatre and a
 * named coordinator with a job title in every seat. Roll a six to deploy, race
 * all four teams around the cross and home to the centre, and send rivals back
 * to base on the way. Every special cell deals a full card: a ladder lifts you,
 * a hole drops you, a landmine resets you, and trophies, diamonds and surprises
 * are scattered between, each read aloud with a real coordination fact.
 *
 * Vanilla JS, no framework. Shares CG.Audio, CG.Narrate, CG.Setup and all the
 * decks in data/content.js. The board, dice and tokens are CSS/SVG, no images.
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});
  const $ = (sel, root) => (root || document).querySelector(sel);
  const app = () => document.getElementById("app");
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rnd = (n) => Math.floor(Math.random() * n);
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  // Finishing order: the race is not over until the LAST team is all home.
  const MEDALS = ["🥇", "🥈", "🥉", "🎖️"];
  function ordinal(n) { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

  // ---- shuffled decks (shared content, same as The Long Road) ------------
  function makeDeck(cards) {
    let order = shuffle(cards), i = 0;
    return function draw() { if (i >= order.length) { order = shuffle(cards); i = 0; } return order[i++]; };
  }
  // Draw a card, favouring ones whose tag matches the crisis theatre, and avoid
  // repeating the last card so back-to-back draws stay varied.
  const lastDrawn = new WeakMap();
  function weightedDraw(cards, tags) {
    const pool = [];
    cards.forEach((c) => {
      const match = c.tag && c.tag !== "any" && tags && tags.indexOf(c.tag) >= 0;
      const w = match ? 3 : 1;
      for (let i = 0; i < w; i++) pool.push(c);
    });
    let pick = pool[rnd(pool.length)], tries = 0;
    while (pick === lastDrawn.get(cards) && tries++ < 5) pick = pool[rnd(pool.length)];
    lastDrawn.set(cards, pick);
    return pick;
  }
  // Fill {role} / {theatre} placeholders for the team that landed here.
  function fillCard(card, p) {
    const role = p.role ? p.role.name : "", theatre = (S.theatre && S.theatre.name) || "";
    const sub = (s) => String(s).replace(/\{role\}/g, role).replace(/\{theatre\}/g, theatre);
    return Object.assign({}, card, { title: sub(card.title), why: sub(card.why), fact: sub(card.fact) });
  }

  // ---- the UN 2.0 Quintet of Change -------------------------------------
  // Every team carries the five capabilities. Ladders, captures and home runs
  // strengthen one; holes, landmines and captures-against set one back. The
  // capability touched is inferred from the card's tag, so the nudge fits.
  function newQuintet() { const q = {}; CG.QUINTET.forEach((c) => (q[c.key] = 0)); return q; }
  function applyQuintet(p, tag, dir) {
    const key = CG.quintetForTag(tag);
    const meta = CG.quintetMeta(key);
    p.quintet[key] = (p.quintet[key] || 0) + dir;   // can climb positive or fall negative
    return { key, meta, dir, level: p.quintet[key] };
  }

  // ---- the 56-cell main loop (x = col, y = row, 0..14) ------------------
  const LOOP = [
    [1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[6,5],[6,4],[6,3],[6,2],[6,1],[6,0],
    [7,0],[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,6],[9,6],[10,6],[11,6],[12,6],
    [13,6],[14,6],[14,7],[14,8],[13,8],[12,8],[11,8],[10,8],[9,8],[8,8],[8,9],
    [8,10],[8,11],[8,12],[8,13],[8,14],[7,14],[6,14],[6,13],[6,12],[6,11],[6,10],
    [6,9],[6,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8],[0,7],[0,6],
  ];
  const CENTER = [7, 7];
  // each token needs progress 61 to finish: 0..54 loop, 55..60 home, 61 centre
  const SAFE = new Set([0, 14, 28, 42, 8, 22, 36, 50]); // loop indices that protect

  const LCOLORS = [
    { key: "red",    name: "Red",    color: "#e5564b", start: 0,  home: [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]], base: [[1,1],[4,1],[1,4],[4,4]],     yard: [0,0] },
    { key: "green",  name: "Green",  color: "#2f9e54", start: 14, home: [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]], base: [[10,1],[13,1],[10,4],[13,4]], yard: [9,0] },
    { key: "yellow", name: "Yellow", color: "#f0b429", start: 28, home: [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]], base: [[10,10],[13,10],[10,13],[13,13]], yard: [9,9] },
    { key: "blue",   name: "Blue",   color: "#2f6bff", start: 42, home: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]], base: [[1,10],[4,10],[1,13],[4,13]], yard: [0,9] },
  ];

  // lookup maps for rendering the board
  const loopAt = {}; LOOP.forEach(([x, y], i) => (loopAt[x + "," + y] = i));
  const homeAt = {}; LCOLORS.forEach((c) => c.home.forEach(([x, y]) => (homeAt[x + "," + y] = c.key)));
  const START_COLOR = { 0: "red", 14: "green", 28: "yellow", 42: "blue" };

  // ---- specials scattered on the track (fresh every game) ---------------
  // The same logic as Ladders and Holes: a ladder lifts you and draws a ladder
  // card; a hole or landmine drops you and draws a setback card; trophies,
  // diamonds, surprises and field notes are drawn from the shared decks. The
  // mix leans toward holes, dangers and surprises, as asked.
  const SPECIALS = {
    hole:     { icon: "🕳️", band: "A HOLE",      kind: "snake",    act: "back",    amount: 6 },
    ambush:   { icon: "⚠️", band: "A SETBACK",   kind: "snake",    act: "back",    amount: 11 },
    mine:     { icon: "💣", band: "A LANDMINE",  kind: "snake",    act: "base" },
    ladder:   { icon: "🪜", band: "A LADDER",    kind: "ladder",   act: "forward", amount: 6 },
    fasttrack:{ icon: "🚀", band: "A FAST TRACK",kind: "ladder",   act: "forward", amount: 10 },
    trophy:   { icon: "🏆", band: "A TROPHY",    kind: "trophy",   act: "again" },
    diamond:  { icon: "💎", band: "A DIAMOND",   kind: "diamond",  act: "hop",     amount: 3 },
    surprise: { icon: "❓", band: "A SURPRISE",  kind: "surprise", act: "effect" },
    note:     { icon: "★",  band: "FIELD NOTE",  kind: "note",     act: "none" },
  };
  // 18 specials per game on the 48 unprotected cells: holes and dangers and
  // surprises dominate, with a handful of openings to climb.
  const SPECIAL_PLAN = [
    "hole", "hole", "hole", "hole", "hole",
    "ambush", "ambush",
    "mine", "mine",
    "surprise", "surprise", "surprise",
    "ladder", "ladder",
    "fasttrack",
    "trophy",
    "diamond",
    "note",
  ];
  function generateSpecials() {
    const avail = [];
    for (let i = 0; i < 56; i++) if (!SAFE.has(i)) avail.push(i);
    const cells = shuffle(avail);
    const out = {};
    SPECIAL_PLAN.forEach((type, idx) => { if (idx < cells.length) out[cells[idx]] = type; });
    return out;
  }

  function cellPos(x, y) { return { x: ((x + 0.5) / 15) * 100, y: ((y + 0.5) / 15) * 100 }; }
  // absolute board cell for a token at progress p of a colour
  function progCell(c, p) {
    if (p <= 54) return LOOP[(c.start + p) % 56];
    if (p <= 60) return c.home[p - 55];
    return CENTER;
  }

  // ---- state -------------------------------------------------------------
  const S = { players: [], current: 0, theatre: null, busy: false, over: false, pending: null, specials: {}, decks: {}, settings: { music: true, voice: true, diceCount: 1 } };
  let boardBox = null, resizeObs = null, decksReady = false;

  // =======================================================================
  // SCREENS
  // =======================================================================
  function show() { ensureDecks(); teardown(); renderTitle(); }

  function ensureDecks() {
    if (decksReady) return;
    S.decks.trophy = makeDeck(CG.TROPHY_CARDS);
    S.decks.diamond = makeDeck(CG.DIAMOND_CARDS);
    S.decks.surprise = makeDeck(CG.SURPRISE_CARDS);
    S.decks.note = makeDeck(CG.FIELD_NOTES);
    decksReady = true;
  }

  function renderTitle() {
    const root = app();
    root.innerHTML = "";
    const wrap = el("div", "screen title-screen");
    wrap.appendChild(el("div", "title-glow"));
    if (CG.Platform) {
      const back = el("button", "back-link", "← Games");
      back.onclick = () => { if (CG.Narrate) CG.Narrate.stop(); CG.Platform.show(); };
      wrap.appendChild(back);
    }
    wrap.appendChild(el("div", "logo-mark", "🎲"));
    wrap.appendChild(el("h1", "title", "Field Ludo"));
    wrap.appendChild(el("p", "subtitle", "Four teams, one crisis"));
    wrap.appendChild(el("p", "tagline",
      "Ladders and Holes in Ludo form. Take a posting, name your coordinators, then roll a six to deploy. Climb the lucky breaks, fall down the holes, dodge the landmines, and bring all four teams home through the centre to win."));

    wrap.appendChild(el("p", "pick-label", "Dice"));
    const diceRow = el("div", "seg-row");
    [{ n: 1, label: "🎲 One die" }, { n: 2, label: "🎲🎲 Two dice" }].forEach((opt) => {
      const b = el("button", "seg" + (S.settings.diceCount === opt.n ? " on" : ""), opt.label);
      b.onclick = () => {
        S.settings.diceCount = opt.n;
        diceRow.querySelectorAll(".seg").forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
        if (CG.Audio) CG.Audio.sfx.click();
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
    go.onclick = () => { if (CG.Audio) CG.Audio.sfx.click(); openSetup(); };
    wrap.appendChild(go);

    wrap.appendChild(el("p", "credit",
      "Each team carries the UN 2.0 Quintet of Change: Data, Innovation, Digital, Strategic Foresight, and Behavioural Science. Ladders, captures and home runs strengthen them; holes and landmines set them back."));
    wrap.appendChild(el("p", "byline", "Designed by <b>Digital Solutions Lab</b>"));
    root.appendChild(wrap);
  }

  // ---- the table: choose Human or AI for every seat ---------------------
  function openSetup() {
    CG.Setup.open({
      icon: "🎲",
      title: "Field Ludo",
      subtitle: "Set the table",
      intro: "Choose who takes each seat. Pick Human and name your coordinator; pick AI and a rival joins. Two to four teams race. A job title and posting are dealt next.",
      seatColors: LCOLORS.map((c) => c.color),
      minSeats: 2, maxSeats: 4, defaultSeats: 2,
      startLabel: "Deal the postings ▸",
      onBack: () => renderTitle(),
      onStart: (roster) => newGame(roster),
    });
  }

  function toggle(label, on, fn) {
    const b = el("button", "chip-toggle" + (on ? " on" : ""), label);
    b.onclick = () => { fn(b.classList.toggle("on")); };
    return b;
  }

  function newGame(roster) {
    if (S.settings.music) CG.Audio.start();
    CG.Narrate.setEnabled(S.settings.voice);
    ensureDecks();
    // fresh, surprising every game: random theatre, roles, special layout
    S.theatre = CG.THEATRES[rnd(CG.THEATRES.length)];
    const roles = shuffle(CG.ROLES);
    S.players = roster.map((seat, i) => {
      const c = LCOLORS[i];
      return {
        name: seat.name,
        isAI: seat.isAI, c,
        role: roles[i % roles.length],
        tokens: [{ p: -1 }, { p: -1 }, { p: -1 }, { p: -1 }],
        quintet: newQuintet(),
        trophies: 0, diamonds: 0, skipNext: false,
        finished: false, rank: 0,
      };
    });
    S.current = 0; S.over = false; S.busy = false; S.pending = null;
    S.specials = generateSpecials();
    renderDeal();
  }

  // ---- the deal: the scenario and every team's coordinator --------------
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
      c.style.setProperty("--tok", p.c.color);
      c.style.animationDelay = (0.08 * i) + "s";
      c.innerHTML =
        `<div class="deal-avatar" style="--tok:${p.c.color}">${p.role.icon}</div>` +
        `<div class="deal-label" style="color:${p.c.color}">${esc(p.name)} · ${p.c.name}</div>` +
        `<div class="deal-title small">${p.role.name}</div>` +
        `<div class="deal-text">${p.role.tag}</div>`;
      row.appendChild(c);
    });
    wrap.appendChild(row);

    const go = el("button", "btn btn-primary big", "Take the field ▸");
    go.onclick = () => { if (CG.Audio) CG.Audio.sfx.pick(); renderBoard(); startPlay(); };
    wrap.appendChild(go);
    root.appendChild(wrap);
    CG.Narrate.auto(
      "You arrive in " + S.theatre.name + ". Four teams take the field, each led by a coordinator with a job to do. Roll a six to send a team out. Climb the ladders, mind the holes and landmines, gather trophies and diamonds, and bring all four teams home through the centre. The UN 2.0 Quintet of Change travels with you. Roll, and begin.");
  }

  function startPlay() {
    setTurn();
    if (S.players[S.current].isAI) scheduleAI();
  }

  // =======================================================================
  // BOARD
  // =======================================================================
  function teardown() { if (resizeObs) { try { resizeObs.disconnect(); } catch (e) {} resizeObs = null; } boardBox = null; }

  function renderBoard() {
    teardown();
    const root = app();
    root.innerHTML = "";
    const wrap = el("div", "screen board-screen ludo-screen");
    wrap.appendChild(el("div", "bg-layer"));

    const bar = el("header", "hud-top");
    bar.innerHTML = `<div class="brand">🎲 <b>Field Ludo</b></div>`;
    if (S.theatre) bar.appendChild(el("div", "theatre-chip", `${S.theatre.icon} ${S.theatre.name}`));
    const ctrls = el("div", "hud-ctrls");
    ctrls.appendChild(toggle("🎵", S.settings.music, (on) => { S.settings.music = on; CG.Audio.setMuted(!on); }));
    ctrls.appendChild(toggle("🗣️", S.settings.voice, (on) => { S.settings.voice = on; CG.Narrate.setEnabled(on); }));
    const home = el("button", "chip-toggle", "⌂");
    home.title = "Games";
    home.onclick = () => { if (CG.Narrate) CG.Narrate.stop(); CG.Platform.show(); };
    ctrls.appendChild(home);
    bar.appendChild(ctrls);
    wrap.appendChild(bar);

    const standings = el("aside", "standings"); standings.id = "lstandings";
    wrap.appendChild(standings);

    const stage = el("div", "board-stage");
    boardBox = el("div", "board-box ludo"); boardBox.id = "lboard";
    const grid = el("div", "ludo-grid");
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        const sq = el("div", "lc");
        const key = x + "," + y;
        if (x === 7 && y === 7) sq.classList.add("lc-center");
        else if (homeAt[key]) sq.classList.add("lc-home", "lc-" + homeAt[key]);
        else if (loopAt[key] !== undefined) {
          const li = loopAt[key];
          sq.classList.add("lc-path");
          if (START_COLOR[li]) sq.classList.add("lc-start", "lc-" + START_COLOR[li]);
          else if (SAFE.has(li)) sq.classList.add("lc-safe");
          if (S.specials[li]) { sq.classList.add("lc-special"); sq.innerHTML = `<span class="lc-ic">${SPECIALS[S.specials[li]].icon}</span>`; }
        } else {
          const yard = yardColorAt(x, y);
          if (yard) sq.classList.add("lc-yard", "lc-" + yard);
        }
        grid.appendChild(sq);
      }
    }
    boardBox.appendChild(grid);
    // soft rounded yard panels in every corner (classic Ludo home base look)
    LCOLORS.forEach((c) => {
      const [ox, oy] = c.yard;
      const panel = el("div", "ludo-yard lc-" + c.key);
      panel.style.left = (ox / 15 * 100) + "%";
      panel.style.top = (oy / 15 * 100) + "%";
      panel.style.width = (6 / 15 * 100) + "%";
      panel.style.height = (6 / 15 * 100) + "%";
      boardBox.appendChild(panel);
    });
    // a centre emblem where every team finishes
    const emblem = el("div", "ludo-center", "🏁");
    const cpos = cellPos(7, 7);
    emblem.style.left = cpos.x + "%"; emblem.style.top = cpos.y + "%";
    boardBox.appendChild(emblem);
    // base rings for tokens
    S.players.forEach((p) => p.c.base.forEach(([bx, by]) => {
      const ring = el("div", "lc-ring lc-" + p.c.key);
      const pos = cellPos(bx, by);
      ring.style.left = pos.x + "%"; ring.style.top = pos.y + "%";
      boardBox.appendChild(ring);
    }));
    const tokens = el("div", "token-layer"); tokens.id = "ltokens"; boardBox.appendChild(tokens);
    const fx = el("div", "fx"); fx.id = "lfx"; boardBox.appendChild(fx);
    stage.appendChild(boardBox);
    wrap.appendChild(stage);

    const dock = el("div", "dice-dock"); dock.id = "ldock";
    let diceHtml = "";
    for (let i = 0; i < S.settings.diceCount; i++) diceHtml += `<div class="die" id="ldie${i}">${pips(1)}</div>`;
    dock.innerHTML = `<div class="turn-tag" id="lturn">Your move</div><div class="dice">${diceHtml}</div>`;
    const btn = el("button", "btn btn-roll", "🎲 Roll"); btn.id = "lroll"; btn.onclick = onRoll;
    dock.appendChild(btn);
    wrap.appendChild(dock);

    wrap.appendChild(el("div", "toast-area", "")); $("div.toast-area", wrap).id = "ltoasts";
    wrap.appendChild(el("div", "board-credit", "Designed by <b>Digital Solutions Lab</b>"));
    root.appendChild(wrap);

    renderTokens();
    renderStandings();
    try { resizeObs = new ResizeObserver(() => renderTokens()); resizeObs.observe(boardBox); } catch (e) {}
  }

  // which colour's 6x6 yard a cell falls in (corners), else null
  function yardColorAt(x, y) {
    for (const c of LCOLORS) {
      const [ox, oy] = c.yard;
      if (x >= ox && x <= ox + 5 && y >= oy && y <= oy + 5) return c.key;
    }
    return null;
  }

  function tokenSize() { if (!boardBox) return 22; return (Math.min(boardBox.clientWidth, boardBox.clientHeight) / 15) * 0.78; }

  function cellKeyOf(pi, ti) {
    const p = S.players[pi]; const t = p.tokens[ti];
    if (t.p < 0) return "base-" + pi + "-" + ti;
    const cl = progCell(p.c, t.p);
    return "c-" + cl[0] + "," + cl[1];
  }
  function posOf(p, t, ti) {
    if (t.p < 0) { const b = p.c.base[ti]; return cellPos(b[0], b[1]); }
    const cl = progCell(p.c, t.p); return cellPos(cl[0], cl[1]);
  }

  function renderTokens() {
    const layer = $("#ltokens"); if (!layer) return;
    layer.innerHTML = "";
    const size = tokenSize();
    const groups = {};
    S.players.forEach((p, pi) => p.tokens.forEach((t, ti) => { const k = cellKeyOf(pi, ti); (groups[k] = groups[k] || []).push(pi + "-" + ti); }));
    const movable = S.pending && !S.players[S.current].isAI ? S.pending.moves : [];
    S.players.forEach((p, pi) => p.tokens.forEach((t, ti) => {
      const pos = posOf(p, t, ti);
      const k = cellKeyOf(pi, ti); const grp = groups[k]; const idx = grp.indexOf(pi + "-" + ti);
      const off = grp.length > 1 ? (idx - (grp.length - 1) / 2) * (size * 0.42) : 0;
      const canMove = pi === S.current && movable.indexOf(ti) >= 0;
      const e = el("div", "ltoken lc-" + p.c.key + (t.p === 61 ? " done" : "") + (canMove ? " movable" : ""));
      e.style.width = size + "px"; e.style.height = size + "px";
      e.style.left = `calc(${pos.x}% + ${off}px)`; e.style.top = pos.y + "%";
      e.style.setProperty("--tok", p.c.color);
      e.style.color = p.c.color;
      e.innerHTML = `<span class="ltok-face" style="font-size:${size * 0.46}px">${p.role ? p.role.icon : ""}</span>`;
      if (canMove) e.onclick = () => playMove(ti);
      layer.appendChild(e);
    }));
  }

  function renderStandings() {
    const box = $("#lstandings"); if (!box) return;
    box.innerHTML = "";
    const homeCount = (p) => p.tokens.filter((t) => t.p === 61).length;
    // Finishers rank to the top in placing order; the rest sort by teams home.
    const order = S.players.map((p, i) => ({ p, i })).sort((a, b) => {
      if (a.p.finished && b.p.finished) return a.p.rank - b.p.rank;
      if (a.p.finished) return -1;
      if (b.p.finished) return 1;
      return homeCount(b.p) - homeCount(a.p);
    });
    order.forEach(({ p, i }) => {
      const home = homeCount(p);
      let loot = "";
      if (p.trophies) loot += `<span>🏆${p.trophies > 1 ? "×" + p.trophies : ""}</span>`;
      if (p.diamonds) loot += `<span>💎${p.diamonds > 1 ? "×" + p.diamonds : ""}</span>`;
      const card = el("div", "scard" + (i === S.current && !S.over ? " active" : "") + (p.finished ? " done" : ""));
      card.style.setProperty("--tok", p.c.color);
      const posCell = p.finished ? (MEDALS[p.rank - 1] || "#" + p.rank) : home;
      card.innerHTML =
        `<span class="savatar" style="--tok:${p.c.color};background:${p.c.color}">${p.role ? p.role.icon : ""}</span>` +
        `<span class="sinfo"><b>${esc(p.name)}</b><small>${esc(p.role ? p.role.name : p.c.name)} · ${home}/4 home</small>${loot ? `<span class="sloot">${loot}</span>` : ""}</span>` +
        `<span class="spos">${posCell}</span>`;
      box.appendChild(card);
    });
    const focus = quintetFocus();
    if (focus && focus.quintet) box.appendChild(quintPanel(focus));
  }

  function quintetFocus() {
    const cur = S.players[S.current];
    if (cur && !cur.isAI) return cur;
    return S.players.find((p) => !p.isAI) || S.players[0];
  }

  // A team's UN 2.0 Quintet of Change, shown casually as a meter.
  function quintPanel(p) {
    const panel = el("div", "quint-panel");
    let chips = "";
    CG.QUINTET.forEach((q) => {
      const lvl = p.quintet[q.key] || 0;
      chips +=
        `<span class="qchip${lvl > 0 ? " on" : lvl < 0 ? " neg" : ""}" title="${q.name}: ${q.blurb}">` +
          `<span class="q-ic">${q.icon}</span><span class="q-lv">${lvl}</span>` +
        `</span>`;
    });
    const multipleHumans = S.players.filter((x) => !x.isAI).length > 1;
    const label = multipleHumans ? `${esc(p.name)} · Quintet` : "UN 2.0 Quintet of Change";
    panel.innerHTML =
      `<div class="quint-label">${label}</div>` +
      `<div class="quint-row">${chips}</div>`;
    return panel;
  }

  function pips(v) {
    const map = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
    const on = new Set(map[v] || []); let h = "";
    for (let i = 0; i < 9; i++) h += `<i class="pip${on.has(i) ? " on" : ""}"></i>`;
    return h;
  }

  function toast(msg, kind) {
    const area = $("#ltoasts"); if (!area) return;
    const t = el("div", "toast " + (kind || ""), msg); area.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 350); }, 2400);
    while (area.children.length > 4) area.removeChild(area.firstChild);
  }

  function burst(cell, kind) {
    const fx = $("#lfx"); if (!fx) return;
    const pos = cellPos(cell[0], cell[1]);
    for (let i = 0; i < 14; i++) {
      const p = el("div", "particle " + (kind || "up"));
      p.style.left = pos.x + "%"; p.style.top = pos.y + "%";
      const a = Math.random() * Math.PI * 2, d = 14 + Math.random() * 24;
      p.style.setProperty("--dx", Math.cos(a) * d + "px"); p.style.setProperty("--dy", Math.sin(a) * d + "px");
      fx.appendChild(p); setTimeout(() => p.remove(), 1000);
    }
  }

  // =======================================================================
  // CARD OVERLAYS (shared look with The Long Road)
  // =======================================================================
  const CONT = { ladder: "Climb ▸", snake: "Down you go ▾", trophy: "Collect ▸", diamond: "Grab it ▸", surprise: "Open it ▸", note: "Carry on ▸" };
  const BAND = { ladder: "A LADDER", snake: "A HOLE", trophy: "A TROPHY", diamond: "A DIAMOND", surprise: "A SURPRISE", note: "FIELD NOTE" };

  // Read a card aloud and, for an AI player, dismiss it only once the voice has
  // finished, so we never advance mid-sentence. With narration off we fall back
  // to a fixed reading pause; a safety cap guards against a stuck voice.
  function narrateCard(p, spoken, over, done, fallbackMs) {
    const voiced = CG.Narrate.isEnabled() && CG.Narrate.supported();
    if (!p.isAI) { CG.Narrate.auto(spoken); return; } // human paces with the button
    let advanced = false;
    const advance = () => { if (!advanced) { advanced = true; if (over.parentNode) done(); } };
    if (voiced) {
      CG.Narrate.auto(spoken, { onend: () => setTimeout(advance, 650) });
      setTimeout(advance, 16000);
    } else {
      CG.Narrate.auto(spoken);
      setTimeout(advance, fallbackMs);
    }
  }

  function showCard(p, card, kind, moveText, q, band) {
    return new Promise((resolve) => {
      const quintSpoken = q
        ? ` Your ${q.meta.name} capability ${q.dir > 0 ? "grows stronger" : "takes a hit"}.`
        : "";
      const text = `${card.why} ${card.fact}`;
      const spoken = `${card.title}. ${text}${quintSpoken}`;
      const over = el("div", "overlay-card");
      const c = el("div", `event-card ${kind}`);
      const moveHtml = moveText ? `<div class="ec-move">${esc(moveText)}</div>` : "";
      const quintHtml = q
        ? `<div class="ec-quint ${q.dir > 0 ? "up" : "down"}">` +
            `<span class="eq-ic">${q.meta.icon}</span>` +
            `<span class="eq-txt"><b>${q.meta.name}</b> ${q.dir > 0 ? "strengthened" : "set back"}` +
            `<small>UN 2.0 Quintet of Change</small></span>` +
            `<span class="eq-delta">${q.dir > 0 ? "+1" : "−1"}</span>` +
          `</div>`
        : "";
      c.innerHTML =
        `<div class="ec-band">${band || BAND[kind] || ""}</div>` +
        `<div class="ec-icon">${card.icon}</div>` +
        `<div class="ec-title">${card.title}</div>` +
        moveHtml +
        `<div class="ec-why">${card.why}</div>` +
        `<div class="ec-fact"><span>Side fact</span>${card.fact}</div>` +
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
      narrateCard(p, spoken, over, done, 2600);
    });
  }

  // =======================================================================
  // TURN FLOW
  // =======================================================================
  function setTurn(txt) {
    const tt = $("#lturn"); const p = S.players[S.current];
    if (tt) tt.innerHTML = S.over ? "Game over" : `<span class="dot" style="background:${p.c.color}"></span>${txt || (p.isAI ? p.name + " is rolling…" : "Your move")}`;
    const btn = $("#lroll"); if (btn) { btn.disabled = S.busy || S.over || p.isAI || !!S.pending; btn.classList.toggle("ai", p.isAI && !S.over); }
  }

  function scheduleAI() { if (S.over) return; setTurn(); setTimeout(() => { if (!S.over && S.players[S.current].isAI && !S.busy) onRoll(); }, 800); }

  // With one die, a 6 deploys from base; with two, a 6 on either die deploys and
  // tokens advance by the sum. `step` is how far a board token moves.
  function legalMoves(p, step, canDeploy) {
    const out = [];
    p.tokens.forEach((t, i) => {
      if (t.p < 0) { if (canDeploy) out.push(i); }
      else if (t.p < 61 && t.p + step <= 61) out.push(i);
    });
    return out;
  }

  async function onRoll() {
    if (S.busy || S.over || S.pending) return;
    S.busy = true; const btn = $("#lroll"); if (btn) btn.disabled = true;
    const p = S.players[S.current];
    const rolls = [];
    for (let i = 0; i < S.settings.diceCount; i++) rolls.push(1 + rnd(6));
    if (S.settings.music) CG.Audio.sfx.dice();
    await animateDice(rolls);
    const step = rolls.reduce((a, b) => a + b, 0);
    const two = rolls.length === 2;
    const canDeploy = two ? rolls.indexOf(6) >= 0 : rolls[0] === 6;
    const doubles = two && rolls[0] === rolls[1];
    const again = two ? doubles : rolls[0] === 6;   // who gets another roll
    const rollText = two ? `${rolls.join(" + ")} = ${step}` : String(step);
    toast(`${p.name} rolls ${rollText}${doubles ? " · doubles" : ""}`, "roll");
    const moves = legalMoves(p, step, canDeploy);
    if (moves.length === 0) {
      await sleep(450);
      S.busy = false;
      endTurn(false);
      return;
    }
    if (p.isAI) {
      const ti = aiPick(p, step, canDeploy, moves);
      await resolveMove(p, ti, step, again);
    } else if (moves.length === 1) {
      await resolveMove(p, moves[0], step, again);
    } else {
      // let the human choose which team to move
      S.pending = { step, again, moves };
      setTurn("Tap a team to move");
      renderTokens();
    }
  }

  async function playMove(ti) {
    if (!S.pending) return;
    const { step, again } = S.pending; const p = S.players[S.current];
    if (S.pending.moves.indexOf(ti) < 0) return;
    S.pending = null;
    await resolveMove(p, ti, step, again);
  }

  async function resolveMove(p, ti, step, again) {
    const captured = await doMove(p, ti, step);
    const special = await resolveSpecial(p, ti, 0);
    renderStandings();
    if (allHome(p) && !p.finished) return playerFinishes(p);
    S.busy = false;
    endTurn(again || captured || special.extra);
  }

  // A token that ENDS its move on a special cell deals a full card, same as the
  // Ladders and Holes board: a ladder lifts and draws a ladder card; a hole or
  // landmine drops and draws a setback card; trophies, diamonds, surprises and
  // notes are drawn from the shared decks. Forward moves can chain once or twice.
  async function resolveSpecial(p, ti, depth) {
    const t = p.tokens[ti];
    if (t.p < 0 || t.p > 54) return { extra: false };
    const li = (p.c.start + t.p) % 56;
    const typeKey = S.specials[li];
    if (!typeKey) return { extra: false };
    const sp = SPECIALS[typeKey];
    const tags = (S.theatre && S.theatre.tags) || [];
    const cl = LOOP[li];
    let extra = false;

    if (sp.kind === "note") {
      if (S.settings.music) CG.Audio.sfx.note();
      await showNote(p, S.decks.note());
      return { extra: false };
    }

    if (sp.kind === "ladder") {
      const card = weightedDraw(CG.LADDER_CARDS, tags);
      const q = applyQuintet(p, card.tag, +1);
      await showCard(p, card, "ladder", "Forward " + sp.amount, q, sp.band);
      if (S.settings.music) CG.Audio.sfx.ladder();
      const np = Math.min(61, t.p + sp.amount);
      await stepTo(p, ti, np);
      burst(t.p <= 54 ? LOOP[(p.c.start + t.p) % 56] : CENTER, "up");
      if (!p.isAI) toast(`${q.meta.icon} ${q.meta.name} strengthened`, "good");
      checkCapture(p, t);
      landedHome(p, t);
      if (depth < 2) { const r = await resolveSpecial(p, ti, depth + 1); if (r.extra) extra = true; }
      return { extra };
    }

    if (sp.kind === "snake") {
      const card = weightedDraw(CG.SNAKE_CARDS, tags);
      const q = applyQuintet(p, card.tag, -1);
      const moveText = sp.act === "base" ? "Back to base" : "Back " + sp.amount;
      await showCard(p, card, "snake", moveText, q, sp.band);
      if (S.settings.music) CG.Audio.sfx.snake();
      if (sp.act === "base") {
        t.p = -1; renderTokens(); burst(cl, "down");
        toast(`${p.name} is sent back to base`, "bad");
      } else {
        const np = Math.max(0, t.p - sp.amount);
        await stepTo(p, ti, np);
        burst(LOOP[(p.c.start + t.p) % 56] || cl, "down");
      }
      if (!p.isAI) toast(`${q.meta.icon} ${q.meta.name} set back`, "bad");
      return { extra: false };
    }

    if (sp.kind === "trophy") {
      const card = fillCard(S.decks.trophy(), p);
      p.trophies++;
      await showCard(p, card, "trophy", null, null, sp.band);
      if (S.settings.music) CG.Audio.sfx.note();
      burst(cl, "up");
      toast(`${p.name} collects a trophy 🏆, roll again`, "good");
      return { extra: true };
    }

    if (sp.kind === "diamond") {
      const card = S.decks.diamond();
      p.diamonds++;
      await showCard(p, card, "diamond", "Forward " + (sp.amount || 3), null, sp.band);
      if (S.settings.music) CG.Audio.sfx.note();
      burst(cl, "up");
      toast(`${p.name} finds a diamond 💎`, "good");
      await stepTo(p, ti, Math.min(61, t.p + (sp.amount || 3)));
      checkCapture(p, t);
      landedHome(p, t);
      if (depth < 2) { const r = await resolveSpecial(p, ti, depth + 1); if (r.extra) extra = true; }
      return { extra };
    }

    if (sp.kind === "surprise") {
      const card = S.decks.surprise();
      await showCard(p, card, "surprise", null, null, sp.band);
      const r = await applySurprise(p, card, ti, depth);
      return { extra: r };
    }

    return { extra: false };
  }

  async function applySurprise(p, card, ti, depth) {
    const t = p.tokens[ti];
    switch (card.effect) {
      case "bonus":
        toast(`${p.name} earns a bonus roll`, "good");
        return true;
      case "skip":
        p.skipNext = true; toast(`${p.name} will lose a turn`, "bad");
        return false;
      case "gem":
        p.diamonds++; burst(LOOP[(p.c.start + t.p) % 56] || CENTER, "up");
        toast(`${p.name} pockets a diamond 💎`, "good");
        return false;
      case "advance": {
        toast(`${p.name} jumps ahead`, "good");
        await stepTo(p, ti, Math.min(61, t.p + 3));
        checkCapture(p, t); landedHome(p, t);
        if (depth < 2) { const r = await resolveSpecial(p, ti, depth + 1); return r.extra; }
        return false;
      }
      default: return false;
    }
  }

  // A team that completes its run to the centre (progress 61) strengthens one
  // capability and gets a small celebration.
  function landedHome(p, t) {
    if (t.p !== 61) return;
    if (S.settings.music) CG.Audio.sfx.note();
    burst(CENTER, "up");
    toast(`${p.name} brings a team home`, "good");
    const q = applyQuintet(p, null, +1);
    if (!p.isAI) toast(`${q.meta.icon} ${q.meta.name} strengthened`, "good");
    renderStandings();
  }

  async function stepTo(p, ti, target) {
    const t = p.tokens[ti];
    if (t.p === target) return;
    const dir = target > t.p ? 1 : -1;
    while (t.p !== target) { t.p += dir; renderTokens(); if (S.settings.music) CG.Audio.sfx.step(); await sleep(150); }
  }

  async function doMove(p, ti, step) {
    const t = p.tokens[ti];
    let captured = false;
    if (t.p < 0) {
      t.p = 0;
      renderTokens();
      if (S.settings.music) CG.Audio.sfx.doubles();
      await sleep(220);
      captured = checkCapture(p, t);
    } else {
      const target = t.p + step;
      for (let q = t.p + 1; q <= target; q++) {
        t.p = q;
        renderTokens();
        if (S.settings.music) CG.Audio.sfx.step();
        await sleep(165);
      }
      captured = checkCapture(p, t);
      if (t.p === 61) {
        landedHome(p, t);
      }
    }
    return captured;
  }

  function checkCapture(p, t) {
    if (t.p < 0 || t.p > 54) return false;
    const li = (p.c.start + t.p) % 56;
    if (SAFE.has(li)) return false;
    let did = false;
    const hit = new Set();
    S.players.forEach((o) => {
      if (o === p) return;
      o.tokens.forEach((ot) => {
        if (ot.p >= 0 && ot.p <= 54 && (o.c.start + ot.p) % 56 === li) {
          ot.p = -1; did = true; hit.add(o);
        }
      });
    });
    if (did) {
      const cl = LOOP[li];
      burst(cl, "down");
      if (S.settings.music) CG.Audio.sfx.snake();
      toast(`${p.name} sends a rival back to base!`, "bad");
      // a capture is a ladder for the mover and a hole for the captured
      const qp = applyQuintet(p, null, +1);
      if (!p.isAI) toast(`${qp.meta.icon} ${qp.meta.name} strengthened`, "good");
      hit.forEach((o) => {
        const qo = applyQuintet(o, null, -1);
        if (!o.isAI) toast(`${qo.meta.icon} ${qo.meta.name} set back`, "bad");
      });
      renderTokens();
      renderStandings();
    }
    return did;
  }

  function aiPick(p, step, canDeploy, moves) {
    let best = moves[0], bestScore = -1e9;
    moves.forEach((ti) => {
      const t = p.tokens[ti];
      let score = 0;
      if (t.p < 0) { score = 5; }                 // deploy
      else {
        const np = t.p + step;
        score = 2 + np * 0.1;                       // progress
        if (np === 61) score += 30;                 // bring a team home
        // would this land capture an unsafe rival?
        if (np <= 54) {
          const li = (p.c.start + np) % 56;
          if (!SAFE.has(li)) {
            S.players.forEach((o) => { if (o !== p) o.tokens.forEach((ot) => { if (ot.p >= 0 && ot.p <= 54 && (o.c.start + ot.p) % 56 === li) score += 40; }); });
          }
          // nudge toward openings, away from holes and landmines
          const sp = S.specials[li];
          if (sp) {
            const kind = SPECIALS[sp].kind;
            if (kind === "ladder" || kind === "trophy" || kind === "diamond") score += 8;
            else if (kind === "snake") score -= (SPECIALS[sp].act === "base" ? 14 : 7);
          }
        }
        if (np <= 54 && SAFE.has((p.c.start + np) % 56)) score += 4; // reach safety
      }
      if (score > bestScore) { bestScore = score; best = ti; }
    });
    return best;
  }

  function endTurn(extra) {
    if (S.over) return;
    if (extra && !S.players[S.current].finished) { setTurn(); if (S.players[S.current].isAI) scheduleAI(); return; }
    let guard = 0;
    do {
      S.current = (S.current + 1) % S.players.length;
      const np = S.players[S.current];
      if (np.finished) continue;                 // finished teams sit out
      if (np.skipNext) { np.skipNext = false; toast(`${np.name} loses a turn`, "muted"); continue; }
      break;
    } while (++guard <= S.players.length * 2);
    renderStandings(); renderTokens(); setTurn();
    if (S.players[S.current].isAI) scheduleAI();
  }

  function allHome(p) { return p.tokens.every((t) => t.p === 61); }

  async function animateDice(values) {
    const dice = values.map((_, i) => $("#ldie" + i));
    dice.forEach((e) => e && e.classList.add("rolling"));
    for (let i = 0; i < 9; i++) {
      dice.forEach((e) => e && (e.innerHTML = pips(1 + rnd(6))));
      await sleep(60);
    }
    dice.forEach((e, i) => {
      if (!e) return;
      e.innerHTML = pips(values[i]); e.classList.remove("rolling"); e.classList.add("settle");
    });
    setTimeout(() => dice.forEach((e) => e && e.classList.remove("settle")), 260);
    await sleep(160);
  }

  // A team that brings all four home is placed (1st, 2nd, ...) but the race
  // keeps running: it is not over until the LAST team is home too.
  function playerFinishes(p) {
    if (p.finished) return;
    p.finished = true; S.busy = false; S.pending = null;
    p.rank = S.players.filter((x) => x.finished).length;
    const isLast = S.players.every((x) => x.finished);
    if (S.settings.music) CG.Audio.sfx.win();
    if (!p.isAI) confetti();
    renderStandings(); renderTokens(); setTurn();
    toast(`${p.name} brings every team home · ${ordinal(p.rank)} ${MEDALS[p.rank - 1] || "🏁"}`, "good");
    showFinishCard(p, isLast, () => {
      if (isLast) return endGame();
      endTurn(false); // hand the field to the next team still racing
    });
  }

  // The finishing team's placement card. AI auto-advances once read; a human
  // taps to play on (or to see the final standings).
  function showFinishCard(p, isLast, done) {
    const spoken = `${p.name} brings every team home, finishing in ${ordinal(p.rank)} place.`;
    const over = el("div", "overlay-card");
    const c = el("div", "event-card trophy");
    c.innerHTML =
      `<div class="ec-band">${ordinal(p.rank).toUpperCase()} PLACE</div>` +
      `<div class="ec-icon">${MEDALS[p.rank - 1] || "🏁"}</div>` +
      `<div class="ec-title">${esc(p.name)} is all home</div>` +
      `<div class="ec-why">All four teams reach the centre in ${ordinal(p.rank)} place.` +
        `${isLast ? " Every team is home now." : " The rest of the field plays on."}</div>`;
    const actions = el("div", "ec-actions");
    const cont = el("button", "btn btn-primary", isLast ? "Final standings ▸" : "Play on ▸");
    const finishDone = () => { over.classList.remove("show"); setTimeout(() => over.remove(), 250); done(); };
    cont.onclick = finishDone;
    actions.appendChild(cont);
    c.appendChild(actions); over.appendChild(c); app().appendChild(over);
    requestAnimationFrame(() => over.classList.add("show"));
    narrateCard(p, spoken, over, finishDone, 3000);
  }

  // Every team is home: show the full finishing order and wrap up.
  function endGame() {
    S.over = true; S.busy = false; S.pending = null;
    renderStandings(); renderTokens(); setTurn();
    const order = S.players.slice().sort((a, b) => a.rank - b.rank);
    const winner = order[0];
    const human = S.players.find((x) => !x.isAI);
    if (S.settings.music) CG.Audio.sfx.win();
    if (human && human.rank === 1) confetti();

    let line;
    if (human && human.rank === 1) {
      line = `${human.name}, ${human.role ? human.role.name : "coordinator"} in ${S.theatre ? S.theatre.name : "the field"}, brings all four teams home first. A clean sweep. Well played.`;
    } else if (human) {
      line = `${winner.name} brings every team home first; ${human.name} comes ${ordinal(human.rank)}. Every team is home in the end.`;
    } else {
      line = `${winner.name} leads the field home. Every team made it.`;
    }
    const built = winner && winner.quintet ? CG.QUINTET.filter((q) => (winner.quintet[q.key] || 0) > 0).map((q) => q.name) : [];
    if (built.length) line += ` Strongest capabilities of the UN 2.0 Quintet: ${built.join(", ")}.`;
    CG.Narrate.auto(line);

    let rows = "";
    order.forEach((p) => {
      const loot = [];
      if (p.trophies) loot.push(`🏆${p.trophies > 1 ? "×" + p.trophies : ""}`);
      if (p.diamonds) loot.push(`💎${p.diamonds > 1 ? "×" + p.diamonds : ""}`);
      rows +=
        `<div class="final-row">` +
          `<span class="final-medal">${MEDALS[p.rank - 1] || "#" + p.rank}</span>` +
          `<span class="final-name" style="color:${p.c.color}">${esc(p.name)}</span>` +
          `<span class="final-role">${esc(p.role ? p.role.name : p.c.name)}</span>` +
          `<span class="final-loot">${loot.join(" ")}</span>` +
        `</div>`;
    });

    const over = el("div", "overlay-card show");
    const c = el("div", "event-card win");
    c.innerHTML =
      `<div class="ec-band">FINAL STANDINGS</div>` +
      `<div class="ec-icon">🏁</div>` +
      `<div class="ec-title">Every team home</div>` +
      `<div class="final-list">${rows}</div>` +
      `<div class="ec-why">${esc(line)}</div>`;
    const actions = el("div", "ec-actions");
    const speak = el("button", "btn btn-ghost", "🔊 Read aloud"); speak.onclick = () => CG.Narrate.speak(line);
    const again = el("button", "btn btn-primary", "Play again ▸"); again.onclick = () => { over.remove(); renderTitle(); };
    const games = el("button", "btn btn-ghost", "← Games"); games.onclick = () => { over.remove(); CG.Platform.show(); };
    actions.appendChild(games); actions.appendChild(speak); actions.appendChild(again);
    c.appendChild(actions); over.appendChild(c); app().appendChild(over);
  }

  function confetti() {
    const fx = $("#lfx"); if (!fx) return;
    const cols = ["#e5564b", "#2f9e54", "#f0b429", "#2f6bff"];
    for (let i = 0; i < 60; i++) {
      const p = el("div", "confetti");
      p.style.left = (8 + Math.random() * 84) + "%"; p.style.top = "-4%";
      p.style.background = cols[i % cols.length];
      p.style.setProperty("--dx", (Math.random() - 0.5) * 40 + "px");
      p.style.setProperty("--dy", 70 + Math.random() * 40 + "px");
      p.style.setProperty("--rot", Math.random() * 720 - 360 + "deg");
      p.style.animationDelay = Math.random() * 0.6 + "s";
      fx.appendChild(p); setTimeout(() => p.remove(), 2600);
    }
  }

  CG.LudoGame = { title: "Field Ludo", show };
})();
