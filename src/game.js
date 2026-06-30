/* =========================================================================
 * COMMON GROUND, THE LONG ROAD,  game.js
 * The whole game: state, board, dice, movement, the shuffled decks, and the
 * render layer. Vanilla JS, no framework, no build step. All flavour text
 * lives in data/content.js; this file is pure mechanics + DOM.
 *
 * THE GAME
 *   A field-coordination Ladders & Holes for a UN Country Team. You always
 *   play against AI rivals. Roll one or two dice, race a hundred squares to a
 *   finished mandate. Climb ladders, dodge holes, and collect trophies,
 *   diamonds and surprise cards along the way. Every landing is read aloud.
 *
 * The board fills the screen (cells are rectangles). Holes, ladders and
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
  // Ladders and holes run STRAIGHT UP A COLUMN (no diagonals). A vertical line
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
        // reserve EVERY cell the chute passes through, so ladders and holes
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
    // Always plant one surprise in the home stretch (95-99) and mark it as
    // always-negative, so the final approach carries a real risk to the end.
    const takeIn = (lo, hi) => {
      const opts = [];
      for (let s = lo; s <= hi; s++) if (!used.has(s)) opts.push(s);
      if (!opts.length) return null;
      const s = opts[Math.floor(Math.random() * opts.length)];
      used.add(s); return s;
    };
    const negativeSurprise = takeIn(95, 99);
    const surprises = take(negativeSurprise == null ? 6 : 5);
    if (negativeSurprise != null) surprises.push(negativeSurprise);
    return { ladders, snakes, trophies: take(4), diamonds: take(5), surprises, fieldNotes: take(5), negativeSurprise };
  }

  // Draw a card, favouring ones whose tag matches the crisis theatre, so the
  // challenges and openings fit where you are posted. Avoid repeating the last
  // card so back-to-back draws stay varied.
  const lastDrawn = new WeakMap();
  // Draw a card customised to the player: weight it up if its tag matches the
  // player's job title and affiliation (role tags) or the scenario they were
  // posted to (theatre tags). So every card a player draws relates to them.
  function weightedDraw(cards, p) {
    const roleTags = (p && p.tags) || [];
    const theatreTags = (S.theatre && S.theatre.tags) || [];
    const pool = [];
    cards.forEach((c) => {
      let w = 1;
      if (c.tag && c.tag !== "any") {
        if (roleTags.indexOf(c.tag) >= 0) w += 3;       // job title / affiliation
        if (theatreTags.indexOf(c.tag) >= 0) w += 1;    // scenario
      }
      for (let i = 0; i < w; i++) pool.push(c);
    });
    let pick = pool[Math.floor(Math.random() * pool.length)], tries = 0;
    while (pick === lastDrawn.get(cards) && tries++ < 5) pick = pool[Math.floor(Math.random() * pool.length)];
    lastDrawn.set(cards, pick);
    return pick;
  }

  // ---- the UN 2.0 Quintet of Change -------------------------------------
  // The whole table shares one set of five capabilities: the progress the
  // country team makes together. A win can strengthen one and a setback set one
  // back, so the counters tally collectively and a capability can fall below
  // zero. The capability is taken from the card itself (an explicit "quint", or
  // a principled mapping of its tag) so the nudge fits the fact. A card whose
  // fact relates to no capability simply touches none.
  function newQuintet() {
    const q = {};
    CG.QUINTET.forEach((c) => (q[c.key] = 0));
    return q;
  }
  function applyQuintet(p, card, dir) {
    // Perseverance is banked for every climb or setback, capability or not, so
    // progress always counts; points never fall below zero.
    award(p, dir > 0 ? 3 : -2);
    // Nudge a capability only when the card's fact genuinely demonstrates one.
    const key = (card && card.quint) || CG.quintetForTag(card && card.tag);
    if (!key) return null;
    const meta = CG.quintetMeta(key);
    const level = (S.quintet[key] || 0) + dir;   // shared tally; can climb positive or fall negative
    S.quintet[key] = level;
    p.contrib[key] = (p.contrib[key] || 0) + dir; // this player's net push on it
    return { key, meta, dir, level };
  }

  // Bank (or dock) perseverance points; the running score that crowns the
  // Perseverance champion at the end. It floors at zero.
  function award(p, pts) {
    const before = p.points || 0;
    p.points = Math.max(0, before + pts);
    const delta = p.points - before;       // the real change after the zero floor
    if (delta) flashScore(delta);
  }

  // Flash a big +N / -N over the board for a beat: green for gains, red for
  // losses, then fade away. A pure bit of feedback, no game state.
  function flashScore(delta) {
    const host = boardBox;
    if (!host) return;                 // only over a live board, never over the lobby
    const sign = delta > 0 ? "+" : "-";
    const f = el("div", "score-pop " + (delta > 0 ? "gain" : "loss"), sign + Math.abs(delta));
    host.appendChild(f);
    setTimeout(() => f.remove(), 1300);
  }

  // Build the data shown in the shared hover card for one player.
  function playerInfo(p) {
    return {
      name: p.name, role: p.role.name, aff: p.role.aff, icon: p.role.icon, color: p.color,
      scoreLabel: "Perseverance", score: p.points || 0,
      quintet: CG.QUINTET.map((q) => ({ icon: q.icon, name: q.name, lvl: (p.contrib && p.contrib[q.key]) || 0 })),
    };
  }

  // The identity banner shown at the top of every in-play card, so it is
  // always clear which player the card is for: their name, job title and
  // affiliation, tinted with their token colour.
  function whoHtml(p) {
    return `<div class="ec-who" style="--who:${p.color}">` +
        `<span class="ec-who-ic">${p.role.icon}</span>` +
        `<span class="ec-who-id">` +
          `<b>${esc(p.name)}</b>` +
          `<small>${esc(p.role.name)}</small>` +
        `</span>` +
        `<span class="ec-who-aff" title="${esc(p.role.aff)}">${esc(CG.affShort(p.role.aff))}</span>` +
      `</div>`;
  }

  // Fill {role} / {aff} / {theatre} placeholders for the player who landed
  // here, so any card can address them by job title, affiliation and scenario.
  function fillCard(card, p) {
    const role = p.role.name, aff = CG.affShort(p.role.aff), theatre = (S.theatre && S.theatre.name) || "";
    const sub = (s) => String(s == null ? "" : s)
      .replace(/\{role\}/g, role).replace(/\{aff\}/g, aff).replace(/\{theatre\}/g, theatre);
    return Object.assign({}, card, { title: sub(card.title), why: sub(card.why), fact: sub(card.fact) });
  }

  // ---- state -------------------------------------------------------------
  const S = {
    players: [],
    current: 0,
    theatre: null,
    busy: false,
    over: false,
    // autoPlay governs the EVENT CARDS only (Continue / Climb / Down you go /
    // Carry on...): off, each card waits for a click; on, they advance by
    // themselves, for Human and AI alike. The die roll is never affected by it
    // (AI rolls itself, Human clicks Roll). Toggled live on the board.
    settings: { music: true, voice: true, diceCount: 1, autoPlay: true },
    decks: {},
    zoneSpoken: -1,
    quintet: {},   // shared team tally, reset each game in startGame()
    // Multiplayer link. When online, the shared game state lives in the JSON
    // store; only the browser that controls the current seat acts, and it
    // writes the result for the others to read. seq guards against re-applying
    // our own echoed write or an older snapshot.
    // beat/show broadcast every roll and card so remote players see the whole
    // turn (movement + the actual card), not just the final position. shownBeat
    // is the last beat THIS browser has played, to avoid replaying it.
    net: { online: false, gameId: null, hostId: null, seq: 0, acting: false, lastEvent: "", beat: 0, shownBeat: 0, show: null },
  };

  // Token colours, all distinct from ladder-wood and hole-green.
  const COLORS = ["#2f6bff", "#e8439b", "#7c4dff", "#ff7a1a"];
  // Finishing order: the road is not done until the LAST player is home.
  const MEDALS = ["🥇", "🥈", "🥉", "🎖️"];
  function ordinal(n) {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  let boardBox = null, overlaySvg = null, resizeObs = null, relayoutHandler = null;
  let decksReady = false;

  // =======================================================================
  // SCREENS
  // =======================================================================
  function ensureDecks() {
    if (decksReady) return;
    // Field notes are plain wisdom strings (no tag), so they cycle as a deck.
    // Every other deck is drawn per player via weightedDraw, customised to
    // their job title, affiliation and scenario.
    S.decks.note = makeDeck(CG.FIELD_NOTES);
    decksReady = true;
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
      "A field-coordination game of Ladders and Holes for a UN Country Team. Roll the die, ride the lucky breaks, survive the crises, collect trophies and diamonds, and race a hundred squares to a finished mandate."));

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
      tags: CG.roleTags(roles[i % roles.length]),  // job-title/affiliation domains, to customise this player's cards
      pos: 1,
      color: COLORS[i % COLORS.length],
      trophies: 0,
      diamonds: 0,
      points: 0,            // perseverance score, built from every gain along the road
      contrib: newQuintet(), // this player's net contribution to each of the five capabilities
      bonusRoll: false,
      skipNext: false,
      finished: false,
      finishTries: 0,      // failed attempts to land squarely on 100; mercy kicks in at 8
      rank: 0,
    }));
    S.current = 0; S.over = false; S.zoneSpoken = -1;
    S.quintet = newQuintet();
    renderDeal();
  }

  function renderDeal() {
    const root = app();
    root.innerHTML = "";
    const wrap = el("div", "screen deal-screen");
    wrap.appendChild(el("p", "deal-kicker", "Your posting"));
    wrap.appendChild(el("h2", "deal-head", "The Country Team"));

    const kind = CG.theatreKindMeta(S.theatre);
    const theatre = el("div", "deal-card theatre-card");
    theatre.innerHTML =
      `<div class="deal-icon">${S.theatre.icon}</div>` +
      `<div class="deal-label">Crisis Theatre <span class="kind-badge ${kind.key}">${kind.icon} ${kind.label}</span></div>` +
      `<div class="deal-title">${S.theatre.name}</div>` +
      `<div class="deal-text">${esc(CG.theatreStory(S.theatre))}</div>`;
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
    clearRemoteCard(); cancelAllWalks();
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
    // The theatre name is a button: tap it any time to re-read the background.
    const tChip = el("button", "theatre-chip clickable", `${S.theatre.icon} ${esc(S.theatre.name)}`);
    tChip.title = "Theatre background";
    tChip.onclick = () => showTheatreIntro();
    bar.appendChild(tChip);
    // Icon-only controls (the .icons class strips text sizing/padding so each is
    // a clean round icon button). A title on every one explains what it does.
    const ctrls = el("div", "hud-ctrls icons");
    const music = toggle("🎵", S.settings.music, (on) => { S.settings.music = on; CG.Audio.setMuted(!on); });
    music.title = "Music"; ctrls.appendChild(music);
    const voice = toggle("🗣️", S.settings.voice, (on) => { S.settings.voice = on; CG.Narrate.setEnabled(on); });
    voice.title = "Narration"; ctrls.appendChild(voice);
    // Auto-cards: when on, the event cards (Continue, Climb, Down you go, Carry
    // on...) advance by themselves; when off, each waits for a click. This never
    // touches the die roll. Changeable at any point in the game.
    const auto = toggle("▶️", S.settings.autoPlay, (on) => {
      S.settings.autoPlay = on;
      toast(on ? "Auto cards on: cards advance on their own" : "Auto cards off: click to continue", on ? "good" : "muted");
    });
    auto.title = "Auto cards"; ctrls.appendChild(auto);
    const quit = el("button", "chip-toggle", "✕");
    quit.title = S.net.online ? "Leave theatre" : "Quit game";
    quit.onclick = () => {
      if (S.net.online) return leaveGame();
      CG.Narrate.stop(); teardownBoard(); CG.Platform.show();
    };
    ctrls.appendChild(quit);
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
    dock.innerHTML = `<div class="turn-tag" id="turnTag">Your move</div>` +
      `<div class="dice" id="dice"><div class="die" id="die0">${pips(1)}</div></div>`;
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
      // ladder rail: solid 3D blue, shaded across its width like a cylinder
      `<linearGradient id="ladderRail" x1="0" y1="0" x2="1" y2="0">` +
        `<stop offset="0" stop-color="#15407a"/><stop offset="0.42" stop-color="#6aa6ee"/>` +
        `<stop offset="0.58" stop-color="#5f9be6"/><stop offset="1" stop-color="#15407a"/>` +
      `</linearGradient>` +
      // ladder rung: rounded blue bar
      `<linearGradient id="ladderRung" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="#7ab0f0"/><stop offset="1" stop-color="#2f63b0"/>` +
      `</linearGradient>` +
      // tunnel pipe: glossy light-green cylinder
      `<linearGradient id="portalPipe" x1="0" y1="0" x2="1" y2="0">` +
        `<stop offset="0" stop-color="#4ea36a"/><stop offset="0.42" stop-color="#cdf0d8"/>` +
        `<stop offset="0.58" stop-color="#c2ecce"/><stop offset="1" stop-color="#4ea36a"/>` +
      `</linearGradient>` +
      // the dark mouth of the tunnel, deep in the middle, lit at the green rim
      `<radialGradient id="portalGrad" cx="0.5" cy="0.42" r="0.62">` +
        `<stop offset="0" stop-color="#0c1a10"/><stop offset="0.5" stop-color="#1f4a2c"/>` +
        `<stop offset="0.82" stop-color="#5aa873"/><stop offset="1" stop-color="#cdf0d8"/>` +
      `</radialGradient>` +
      // soft glow around the mouth
      `<radialGradient id="portalGlow" cx="0.5" cy="0.5" r="0.5">` +
        `<stop offset="0" stop-color="#bff5d0" stop-opacity="0.85"/><stop offset="1" stop-color="#bff5d0" stop-opacity="0"/>` +
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
      fill: "url(#portalPipe)", stroke: "#2c6b42", "stroke-width": Math.max(0.4, unit * 0.018), "stroke-linejoin": "round", filter: "url(#soft)",
    }, g);
    // glossy highlight running down one side of the pipe
    mk("path", { d: `M ${head.x + px * W * 0.45} ${head.y + py * W * 0.45} L ${tail.x + px * W * 0.45} ${tail.y + py * W * 0.45}`, fill: "none", stroke: "#eafff0", "stroke-width": Math.max(0.3, unit * 0.02), "stroke-linecap": "round", opacity: "0.35" }, g);

    // downward chevrons (it takes you back)
    const arrows = Math.max(1, Math.round(len / (unit * 0.9)));
    for (let i = 1; i <= arrows; i++) {
      const t = i / (arrows + 1), cx = head.x + dx * t, cy = head.y + dy * t;
      const aw = W * 0.5, ah = W * 0.42;
      mk("path", {
        d: `M ${cx + px * aw - ux * ah} ${cy + py * aw - uy * ah} L ${cx + ux * ah} ${cy + uy * ah} L ${cx - px * aw - ux * ah} ${cy - py * aw - uy * ah}`,
        fill: "none", stroke: "#eafff0", "stroke-width": Math.max(0.3, unit * 0.022), "stroke-linecap": "round", "stroke-linejoin": "round", opacity: "0.7",
      }, g);
    }

    // exit opening at the bottom
    mk("ellipse", { cx: tail.x, cy: tail.y, rx: W * 0.72, ry: W * 0.4, fill: "#0a1c11", opacity: "0.88" }, g);

    // the lit mouth at the top, in its own group so it can swell on a swallow
    const m = mk("g", { class: "tunnel-mouth" }, g);
    mk("ellipse", { cx: head.x, cy: head.y, rx: W * 1.85, ry: W * 1.12, fill: "url(#portalGlow)", opacity: "0.75" }, m);
    mk("ellipse", { cx: head.x, cy: head.y, rx: W * 1.5, ry: W * 0.92, fill: "#dcf4e3", stroke: "#6fa680", "stroke-width": Math.max(0.4, unit * 0.016), filter: "url(#soft)" }, m);
    mk("ellipse", { cx: head.x, cy: head.y, rx: W * 1.18, ry: W * 0.7, fill: "#6f9b7c" }, m);
    mk("ellipse", { cx: head.x, cy: head.y, rx: W * 0.95, ry: W * 0.56, fill: "url(#portalGrad)" }, m);
    // a crescent glint on the rim
    mk("path", { d: `M ${head.x - W * 0.72} ${head.y - W * 0.06} A ${W * 0.85} ${W * 0.48} 0 0 1 ${head.x + W * 0.45} ${head.y - W * 0.44}`, fill: "none", stroke: "#f0fff5", "stroke-width": Math.max(0.3, unit * 0.014), "stroke-linecap": "round", opacity: "0.6" }, m);
  }

  function drawLadder(foot, top, unit, footSq) {
    const dx = top.x - foot.x, dy = top.y - foot.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;   // across the ladder
    const w = unit * 0.17;                   // half-distance between the rails
    const g = mk("g", { class: "ladder", "data-foot": footSq, filter: "url(#soft)" });
    const seg = (x1, y1, x2, y2, color, sw, op) =>
      mk("line", { x1, y1, x2, y2, stroke: color, "stroke-width": sw, "stroke-linecap": "round", ...(op != null ? { opacity: op } : {}) }, g);

    const railW = Math.max(1.2, unit * 0.085);
    // a glossy rounded tube: dark base, mid body, bright core highlight, drawn
    // along the same line so the stacked widths read as a lit cylinder.
    const tube = (ax, ay, bx, by, baseW, dark, mid, light) => {
      seg(ax, ay, bx, by, dark, baseW);
      seg(ax, ay, bx, by, mid, baseW * 0.72);
      seg(ax, ay, bx, by, light, baseW * 0.26, 0.85);
    };

    // soft cast shadow of each rail, nudged down-right for a 3D lift
    [-1, 1].forEach((s) =>
      seg(foot.x + nx * w * s + unit * 0.02, foot.y + ny * w * s + unit * 0.03,
          top.x + nx * w * s + unit * 0.02, top.y + ny * w * s + unit * 0.03,
          "#14365f", railW * 1.05, 0.22));

    // rungs first, so the rails overlap their ends cleanly
    const rungs = Math.max(3, Math.round(len / (unit * 0.6)));
    for (let i = 1; i < rungs; i++) {
      const t = i / rungs, cx = foot.x + dx * t, cy = foot.y + dy * t;
      tube(cx + nx * w, cy + ny * w, cx - nx * w, cy - ny * w, railW * 0.8, "#1f5396", "#4f93e6", "#cfe6ff");
    }

    // the two side rails
    [-1, 1].forEach((s) =>
      tube(foot.x + nx * w * s, foot.y + ny * w * s, top.x + nx * w * s, top.y + ny * w * s,
           railW, "#1d4e8f", "#5b97dd", "#dcecff"));

    // rounded caps at the foot and the top of each rail
    [-1, 1].forEach((s) => {
      [foot, top].forEach((end) =>
        mk("circle", { cx: end.x + nx * w * s, cy: end.y + ny * w * s, r: railW * 0.62,
          fill: "#8fc0f5", stroke: "#1d4e8f", "stroke-width": Math.max(0.3, unit * 0.01) }, g));
    });
  }

  // ---- standings ---------------------------------------------------------
  function renderStandings() {
    const box = $("#standings");
    if (!box) return;
    box.innerHTML = "";
    // Finishers rank to the top in placing order; the rest sort by position.
    const order = S.players.map((p, i) => ({ p, i })).sort((a, b) => {
      if (a.p.finished && b.p.finished) return a.p.rank - b.p.rank;
      if (a.p.finished) return -1;
      if (b.p.finished) return 1;
      return b.p.pos - a.p.pos;
    });
    order.forEach(({ p, i }) => {
      const card = el("div", "scard" + (i === S.current && !S.over ? " active" : "") + (p.finished ? " done" : ""));
      card.style.setProperty("--tok", p.color);
      let loot = `<span>⭐ ${p.points}</span>`;
      if (p.trophies) loot += `<span>🏆${p.trophies > 1 ? "×" + p.trophies : ""}</span>`;
      if (p.diamonds) loot += `<span>💎${p.diamonds > 1 ? "×" + p.diamonds : ""}</span>`;
      const posCell = p.finished ? (MEDALS[p.rank - 1] || "#" + p.rank) : p.pos;
      card.innerHTML =
        `<span class="savatar" style="--tok:${p.color}">${p.role.icon}</span>` +
        `<span class="sinfo"><b>${p.name}</b><small>${p.role.name}</small>${loot ? `<span class="sloot">${loot}</span>` : ""}</span>` +
        `<span class="spos">${posCell}</span>`;
      if (CG.Hover) CG.Hover.bind(card, () => playerInfo(p));
      box.appendChild(card);
    });
    // One shared Quintet meter for the whole table: it tallies the progress
    // every player makes together, so it climbs and dips as anyone plays.
    box.appendChild(quintPanel());
  }

  // The team's shared UN 2.0 Quintet of Change, shown casually as a meter.
  function quintPanel() {
    const panel = el("div", "quint-panel");
    let chips = "";
    CG.QUINTET.forEach((q) => {
      const lvl = S.quintet[q.key] || 0;
      chips +=
        `<span class="qchip${lvl > 0 ? " on" : lvl < 0 ? " neg" : ""}" title="${q.name}: ${q.blurb}">` +
          `<span class="q-ic">${q.icon}</span><span class="q-lv">${lvl}</span>` +
        `</span>`;
    });
    panel.innerHTML =
      `<div class="quint-label">UN 2.0 Quintet of Change</div>` +
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
      if (CG.Hover) CG.Hover.bind(t, () => playerInfo(p));
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
    // A seat is "mine to roll" when it is a human seat that I own (or, solo,
    // simply the human seat). The AI rolls itself; the Auto toggle only governs
    // the cards, never the roll. Online, another player's seat shows their name.
    const mine = p && !p.isAI && (!S.net.online || p.ownerId === myId());
    if (tt) tt.innerHTML = S.over ? "Game over" :
      `<span class="dot" style="background:${p.color}"></span>${mine ? "Your move" : esc(p.name) + " is moving…"}`;
    const btn = $("#rollBtn");
    if (btn) { btn.disabled = S.busy || S.over || !mine; btn.classList.toggle("ai", !mine && !S.over); }
  }

  function scheduleAI() {
    if (S.over) return;
    if (S.net.online && !iControl()) { setTurnTag(); return; } // not our AI to drive
    setTurnTag();
    setTimeout(() => { if (!S.over && S.players[S.current].isAI && iControl()) onRoll(); }, 850);
  }

  // Hide the floating panels (standings + dice dock) while a token travels, so
  // the board is clean to watch; bring them back only when a roll is needed.
  function setMoving(on) {
    const s = $(".board-screen");
    if (s) s.classList.toggle("moving", !!on);
  }

  async function onRoll() {
    if (S.busy || S.over) return;
    if (S.net.online && !iControl()) return;   // only the seat's controller may roll
    S.busy = true;
    const btn = $("#rollBtn"); if (btn) btn.disabled = true;

    const p = S.players[S.current];
    // Online: mark that we are mid-turn so an incoming snapshot does not
    // interrupt the animation. We deliberately do NOT write here: the free store
    // throttles writes, so we keep to one write per turn (the hand-off in
    // endTurn). Tokens still snap on the observers' side when that lands.
    if (S.net.online) { S.net.acting = true; lastProgressAt = CG.Net.now(); }

    // Exact-landing keeps its teeth: you finish ON square 100, never past it.
    // But no one rolls forever. Once a player has reached square 90, we count a
    // "try" each turn they roll from there and fail to land on 100 (overshooting
    // and bouncing). After 8 failed tries the field steps in and rolls exactly
    // what lands them home.
    const gap = 100 - p.pos;
    const nearBefore = p.pos >= 90;
    const mercy = p.finishTries >= 8 && !p.finished;

    if (mercy && (gap < 1 || gap > 6)) {
      // A snake has knocked them out of a single die's reach: wave them across.
      if (S.settings.music) CG.Audio.sfx.dice();
      toast(`After ${p.finishTries} near-misses, the field waves ${p.name} home`, "good");
      setMoving(true);
      await walk(p, 100);
      setMoving(false);
      return playerFinishes(p);
    }

    // forced exact roll on mercy, otherwise a fair single die
    const roll = mercy ? gap : 1 + Math.floor(Math.random() * 6);
    if (mercy) toast(`After ${p.finishTries} near-misses, ${p.name} rolls exactly what the road needs`, "good");
    if (S.settings.music) CG.Audio.sfx.dice();

    await animateDice([roll]);
    toast(`${p.name} rolls <b>${roll}</b>`, "roll");
    // Tell the table the roll (and where the mover is leaving from) so watchers
    // see the die and the move, not just the result.
    if (S.net.online) emitBeat({ t: "roll", seat: S.current, value: roll }, `${p.name} rolls ${roll}`);

    let target = p.pos + roll, bounced = false;
    if (target > 100) { target = 100 - (target - 100); bounced = true; }

    setMoving(true); // clear the board while the token travels
    await walk(p, target);
    if (bounced) toast(`${p.name} overshoots and bounces back to ${target}`, "muted");

    await resolveLanding(p, 0);
    setMoving(false); // a roll is coming up: bring the panels back
    if (p.pos === 100 && !p.finished) return playerFinishes(p);
    // a turn that started at square 90 or beyond but did not land on 100 is a
    // failed try; once these reach 8 the mercy intervention above fires next turn.
    if (nearBefore) p.finishTries++;

    // A trophy can grant another roll (there are no doubles with a single die).
    const again = p.bonusRoll;
    p.bonusRoll = false;
    if (again && !S.over) {
      if (S.settings.music) CG.Audio.sfx.doubles();
      toast(`${p.name} earns another roll`, "good");
      S.busy = false;
      if (S.net.online) lastProgressAt = CG.Net.now();  // stay acting; no extra write
      setTurnTag();
      if (p.isAI) scheduleAI();
      return;
    }
    endTurn();
  }

  function endTurn() {
    S.busy = false;
    const moved = S.players[S.current];
    let guard = 0;
    do {
      S.current = (S.current + 1) % S.players.length;
      const np = S.players[S.current];
      if (np.finished) continue;                 // finished players sit out
      if (np.skipNext) { np.skipNext = false; toast(`${np.name} loses a turn`, "muted"); continue; }
      break;
    } while (++guard <= S.players.length * 2);
    renderStandings(); renderTokens(); setTurnTag();
    if (S.net.online) {
      // Hand the turn to the table: write where the mover ended, then take the
      // next turn only if it is ours (an AI we host, or another seat we own).
      S.net.acting = false;
      lastProgressAt = CG.Net.now();
      const home = moved.finished ? ` and finishes ${ordinal(moved.rank)} ${MEDALS[moved.rank - 1] || "🏁"}` : "";
      pushState(`${moved.name} moves to square ${moved.pos}${home}`).then(() => maybeAct());
      return;
    }
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
    if (!boardBox) return;             // the board is gone (player left): draw nothing
    depth = depth || 0;
    const B = S.board;
    const n = p.pos;
    if (B.ladders[n]) {
      const card = fillCard(weightedDraw(CG.LADDER_CARDS, p), p);
      const q = applyQuintet(p, card, +1);
      if (S.net.online) emitCardBeat(p, "ladder", card, B.ladders[n], q, null, `${p.name} climbs to ${B.ladders[n]}`);
      await showCard(p, card, "ladder", B.ladders[n], q);
      if (S.settings.music) { CG.Audio.sfx.ladder(); CG.Audio.sfx.clap(); }
      toast(`${p.name} climbs to ${B.ladders[n]}`, "good");
      if (!p.isAI && q) toast(`${q.meta.icon} ${q.meta.name} strengthened`, "good");
      await slide(p, B.ladders[n], "up", n);
    } else if (B.snakes[n]) {
      const card = fillCard(weightedDraw(CG.SNAKE_CARDS, p), p);
      const q = applyQuintet(p, card, -1);
      if (S.net.online) emitCardBeat(p, "snake", card, B.snakes[n], q, null, `${p.name} drops down to ${B.snakes[n]}`);
      await showCard(p, card, "snake", B.snakes[n], q);
      if (S.settings.music) { CG.Audio.sfx.snake(); CG.Audio.sfx.wah(); }
      toast(`${p.name} drops down to ${B.snakes[n]}`, "bad");
      if (!p.isAI && q) toast(`${q.meta.icon} ${q.meta.name} set back`, "bad");
      shake();
      await slide(p, B.snakes[n], "down", n);
    } else if (B.trophies.includes(n)) {
      const card = fillCard(weightedDraw(CG.TROPHY_CARDS, p), p);
      p.trophies++;
      award(p, 5);
      if (S.net.online) emitCardBeat(p, "trophy", card, null, null, null, `${p.name} collects a trophy 🏆`);
      await showCard(p, card, "trophy", null);
      if (S.settings.music) CG.Audio.sfx.note();
      burst(n, "up", 18);
      p.bonusRoll = true;
      toast(`${p.name} collects a trophy 🏆`, "good");
    } else if (B.diamonds.includes(n)) {
      const card = fillCard(weightedDraw(CG.DIAMOND_CARDS, p), p);
      p.diamonds++;
      award(p, 4);
      if (S.net.online) emitCardBeat(p, "diamond", card, null, null, null, `${p.name} finds a diamond 💎`);
      await showCard(p, card, "diamond", null);
      if (S.settings.music) CG.Audio.sfx.note();
      burst(n, "up", 18);
      toast(`${p.name} finds a diamond 💎`, "good");
      await hop(p, 3, depth);
    } else if (B.surprises.includes(n)) {
      const card = fillCard(weightedDraw(CG.SURPRISE_CARDS, p), p);
      const outcome = planSurprise(p, card);
      if (S.net.online) emitCardBeat(p, "surprise", card, null, null, outcome.consequence, `${p.name} hits a surprise`);
      await showCard(p, card, "surprise", null, null, outcome.consequence);
      await applySurprise(p, outcome, depth);
    } else if (B.fieldNotes.includes(n)) {
      const note = S.decks.note();
      if (S.settings.music) CG.Audio.sfx.note();
      if (S.net.online) emitBeat({ t: "note", seat: S.players.indexOf(p), note }, `${p.name} reads a field note`);
      await showNote(p, note);
    }
    renderStandings();
  }

  // The nearest landmark ahead of `from` from a list of squares, or null.
  function nextAhead(from, squares) {
    const ahead = squares.filter((s) => s > from).sort((a, b) => a - b);
    return ahead.length ? ahead[0] : null;
  }

  // A surprise ALWAYS moves you. Usually it is a hop forward or back; sometimes
  // it sweeps you to the next ladder or drops you into the next hole; and once in
  // a blue moon it carries you all the way to the finish or right back to square
  // one. The card's mood (a "skip" card is the bad news, everything else is good)
  // tilts the winds, but either way can happen. After the move we resolve the new
  // square so a ladder climbs and a hole drops, bounded so it cannot loop.
  function planSurprise(p, card) {
    const B = S.board;
    const forcedBad = p.pos === B.negativeSurprise;
    const good = !forcedBad && card.effect !== "skip";
    const ladder = nextAhead(p.pos, Object.keys(B.ladders).map(Number));
    const hole = nextAhead(p.pos, Object.keys(B.snakes).map(Number));
    const fwd = Math.min(100, p.pos + 2 + Math.floor(Math.random() * 5)); // +2..+6
    const back = Math.max(1, p.pos - (2 + Math.floor(Math.random() * 4))); // -2..-5
    const r = Math.random();

    let dest, msg, kind, type;
    if (forcedBad) {
      // the home-stretch trap: always a genuine setback, never a reprieve.
      if (r < 0.15)             { dest = 1;    type = "one";  msg = `Disaster sends ${p.name} right back to square one`; kind = "bad"; }
      else if (r < 0.45 && hole != null) { dest = hole; type = "hole"; msg = `Bad news drops ${p.name} into the next hole`; kind = "bad"; }
      else                      { dest = back; type = "back"; msg = `${p.name} is pushed back to ${back}`; kind = "bad"; }
    } else if (good) {
      // Good news only ever helps: forward, up to the next ladder, or the finish.
      if (r < 0.05)      { dest = 100;    type = "finish"; msg = `An extraordinary break sweeps ${p.name} to the finish 🏁`; kind = "good"; }
      else if (r < 0.40) { dest = ladder; type = "ladder"; msg = `Good news carries ${p.name} to the next ladder`; kind = "good"; }
      else               { dest = fwd;    type = "fwd";    msg = `${p.name} is swept forward to ${fwd}`; kind = "good"; }
    } else {
      // Bad news only ever hurts: back, down into the next hole, or square one.
      if (r < 0.05)      { dest = 1;      type = "one";    msg = `Disaster sends ${p.name} right back to square one`; kind = "bad"; }
      else if (r < 0.40) { dest = hole;   type = "hole";   msg = `Bad news drops ${p.name} into the next hole`; kind = "bad"; }
      else               { dest = back;   type = "back";   msg = `${p.name} is pushed back to ${back}`; kind = "bad"; }
    }
    // The next ladder or hole can be missing near the top of the board; fall back
    // to a plain hop so a surprise never fails to move you.
    if (dest == null) { dest = good ? fwd : back; type = good ? "fwd" : "back"; msg = good ? `${p.name} is swept forward to ${dest}` : `${p.name} is pushed back to ${dest}`; }
    if (dest === p.pos) { dest = good ? Math.min(100, p.pos + 1) : Math.max(1, p.pos - 1); type = good ? "fwd" : "back"; }

    return { dest, msg, kind, consequence: surpriseLine(p, dest, type) };
  }

  // The imposed-move line printed on the surprise card: what happens, how many
  // steps, and where the player is sent next.
  function surpriseLine(p, dest, type) {
    const steps = Math.abs(dest - p.pos);
    const s = steps === 1 ? "step" : "steps";
    switch (type) {
      case "finish": return `As a result, you are swept all the way to the finish at square 100.`;
      case "one":    return `As a result, you are sent all the way back to square one.`;
      case "ladder": return `As a result, you are ordered ${steps} ${s} forward to the next ladder at square ${dest}, then up you climb.`;
      case "hole":   return `As a result, you are ordered ${steps} ${s} forward to the next hole at square ${dest}, then down you go.`;
      case "fwd":    return `As a result, you move ${steps} ${s} forward to square ${dest}.`;
      case "back":   return `As a result, you are sent ${steps} ${s} back to square ${dest}.`;
      default:       return `As a result, you move to square ${dest}.`;
    }
  }

  async function applySurprise(p, outcome, depth) {
    const { dest, msg, kind } = outcome;
    toast(msg, kind);
    if (dest < p.pos) shake();
    await walk(p, dest);
    if (p.pos === 100) return;           // onRoll detects the win
    if (depth < 2) await resolveLanding(p, depth + 1);
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
  const BAND = { ladder: "A LADDER", snake: "A HOLE", trophy: "A TROPHY", diamond: "A DIAMOND", surprise: "A SURPRISE" };

  // Read a card aloud and, for an AI player, dismiss it only once the voice has
  // finished, so we never advance to the next card or player mid-sentence. With
  // narration off (or unsupported) we fall back to a fixed reading pause. A
  // safety cap guards against a voice that never reports it ended.
  function narrateCard(p, spoken, over, done, fallbackMs, cont) {
    const voiced = CG.Narrate.isEnabled() && CG.Narrate.supported();
    if (!S.settings.autoPlay) {
      // Manual play: read the line aloud, but leave Continue live the whole time
      // so the user can proceed whenever they like, even before the narrator has
      // finished (skipping the reading by hand is fine).
      CG.Narrate.auto(spoken);
      return;
    }
    // Auto play: never advance before the whole card has been read. With a voice,
    // wait for the narrator to finish the entire line; without one, hold long
    // enough to read the card through, scaled to how much text it carries.
    let advanced = false;
    const advance = () => { if (!advanced) { advanced = true; if (over.parentNode) done(); } };
    if (voiced) {
      CG.Narrate.auto(spoken, { onend: () => setTimeout(advance, 700) });
      setTimeout(advance, 30000); // safety: never freeze on a stuck voice
    } else {
      CG.Narrate.auto(spoken);
      const words = String(spoken).trim().split(/\s+/).filter(Boolean).length;
      setTimeout(advance, Math.min(14000, Math.max(fallbackMs, words * 320)));
    }
  }

  function showCard(p, card, kind, dest, q, moveLine) {
    return new Promise((resolve) => {
      if (!boardBox) return resolve();   // board gone (player left): show nothing
      const quintSpoken = q
        ? ` Your ${q.meta.name} capability ${q.dir > 0 ? "grows stronger" : "takes a hit"}.`
        : "";
      const text = `${card.why} ${card.fact}`;
      const spoken = `${card.title}. ${text}${quintSpoken}${moveLine ? " " + moveLine : ""}`;
      const over = el("div", "overlay-card");
      const c = el("div", `event-card ${kind}`);
      const moveHtml = moveLine
        ? `<div class="ec-move ec-impose">${moveLine}</div>`
        : (dest != null
          ? `<div class="ec-move">${p.pos} ${kind === "ladder" ? "▲" : "▼"} ${dest}</div>` : "");
      const quintHtml = q
        ? `<div class="ec-quint ${q.dir > 0 ? "up" : "down"}">` +
            `<span class="eq-ic">${q.meta.icon}</span>` +
            `<span class="eq-txt"><b>${q.meta.name}</b> ${q.dir > 0 ? "strengthened" : "set back"}` +
            `<small>UN 2.0 Quintet of Change</small></span>` +
            `<span class="eq-delta">${q.dir > 0 ? "+1" : "−1"}</span>` +
          `</div>`
        : "";
      c.innerHTML =
        whoHtml(p) +
        `<div class="ec-band">${BAND[kind] || ""}</div>` +
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
      const done = () => { CG.Narrate.stop(); over.classList.remove("show"); setTimeout(() => over.remove(), 250); resolve(); };
      cont.onclick = done;
      actions.appendChild(speak); actions.appendChild(cont);
      c.appendChild(actions);
      over.appendChild(c);
      app().appendChild(over);
      requestAnimationFrame(() => over.classList.add("show"));
      narrateCard(p, spoken, over, done, 3300, cont);
    });
  }

  function showNote(p, note) {
    return new Promise((resolve) => {
      if (!boardBox) return resolve();   // board gone (player left): show nothing
      const spoken = `Field note. ${note}`;
      const over = el("div", "overlay-card");
      const c = el("div", "event-card note");
      c.innerHTML =
        whoHtml(p) +
        `<div class="ec-band">FIELD NOTE</div>` +
        `<div class="ec-icon">★</div>` +
        `<div class="ec-fact big"><span>From the field</span>${note}</div>`;
      const actions = el("div", "ec-actions");
      const speak = el("button", "btn btn-ghost", "🔊 Read aloud");
      speak.onclick = () => CG.Narrate.speak(`Field note. ${note}`);
      const cont = el("button", "btn btn-primary", "Carry on ▸");
      const done = () => { CG.Narrate.stop(); over.classList.remove("show"); setTimeout(() => over.remove(), 250); resolve(); };
      cont.onclick = done;
      actions.appendChild(speak); actions.appendChild(cont);
      c.appendChild(actions);
      over.appendChild(c);
      app().appendChild(over);
      requestAnimationFrame(() => over.classList.add("show"));
      narrateCard(p, spoken, over, done, 2600, cont);
    });
  }

  // =======================================================================
  // FINISH
  // =======================================================================
  // A player reaching square 100 is placed (1st, 2nd, ...) but the game keeps
  // going: the road is not over until the LAST player is home too.
  function playerFinishes(p) {
    if (p.finished) return;
    p.finished = true;
    p.rank = S.players.filter((x) => x.finished).length;
    S.busy = false;
    setMoving(false);
    const isLast = S.players.every((x) => x.finished);
    if (S.settings.music) { CG.Audio.sfx.win(); CG.Audio.sfx.clap(); CG.Audio.setProgress(100); }
    if (!p.isAI) confetti();
    renderStandings(); renderTokens(); setTurnTag();
    toast(`${p.name} completes the mandate · ${ordinal(p.rank)} ${MEDALS[p.rank - 1] || "🏁"}`, "good");
    showFinishCard(p, isLast, () => {
      if (isLast) return endGame(true);
      endTurn(); // hand the road to the next player still running
    });
  }

  // The finishing player's placement card. AI players auto-advance once the
  // line has been read; a human taps to play on (or to see the standings).
  function showFinishCard(p, isLast, done) {
    if (!boardBox) return;             // board gone (player left): show nothing
    const spoken = `${p.name} completes the mandate, finishing in ${ordinal(p.rank)} place.`;
    const over = el("div", "overlay-card");
    const c = el("div", "event-card trophy");
    c.innerHTML =
      `<div class="ec-band">${ordinal(p.rank).toUpperCase()} PLACE</div>` +
      `<div class="ec-icon">${MEDALS[p.rank - 1] || "🏁"}</div>` +
      `<div class="ec-title">${esc(p.name)} reaches the end of the road</div>` +
      `<div class="ec-why">${esc(p.role.name)} completes the mandate in ${ordinal(p.rank)} place.` +
        `${isLast ? " The whole table is home now." : " The rest of the field plays on."}</div>`;
    const actions = el("div", "ec-actions");
    const cont = el("button", "btn btn-primary", isLast ? "Final standings ▸" : "Play on ▸");
    const finishDone = () => { CG.Narrate.stop(); over.classList.remove("show"); setTimeout(() => over.remove(), 250); done(); };
    cont.onclick = finishDone;
    actions.appendChild(cont);
    c.appendChild(actions);
    over.appendChild(c);
    app().appendChild(over);
    requestAnimationFrame(() => over.classList.add("show"));
    narrateCard(p, spoken, over, finishDone, 3000, cont);
  }

  // Crowning the table: finishing first is only one way to win. Every player
  // can leave a mark, so we hand out a trophy for each kind of greatness:
  //   Speed,        first across the line;
  //   Perseverance, the most points banked along the road;
  //   and one champion for each UN 2.0 capability, the player who pushed it
  //   furthest. A category with no clear leader (nobody scored, or it ends in a
  //   tie at zero) is simply left uncrowned. Ties at a positive score are shared.
  function computeChampions() {
    const champs = [];
    const top = (valueOf) => {
      const best = Math.max.apply(null, S.players.map(valueOf));
      if (best <= 0) return null;
      return { best, who: S.players.filter((p) => valueOf(p) === best) };
    };

    const speed = S.players.find((p) => p.rank === 1);
    if (speed) champs.push({
      icon: "🏃", title: "Speed", who: [speed],
      note: "first to complete the mandate",
    });

    const pers = top((p) => p.points || 0);
    if (pers) champs.push({
      icon: "💪", title: "Perseverance", who: pers.who,
      note: `the most points banked, ${pers.best}`,
    });

    CG.QUINTET.forEach((q) => {
      const lead = top((p) => p.contrib[q.key] || 0);
      if (lead) champs.push({
        icon: q.icon, title: q.name, who: lead.who,
        note: `pushed ${q.name} furthest, +${lead.best}`,
      });
    });
    return champs;
  }

  function championsHtml(champs) {
    if (!champs.length) return "";
    const rows = champs.map((c) => {
      const names = c.who
        .map((p) => `<span class="champ-who" style="color:${p.color}">${esc(p.name)}</span>`)
        .join(", ");
      return `<div class="champ-row">` +
        `<span class="champ-ic">${c.icon}</span>` +
        `<span class="champ-body"><span class="champ-title">${esc(c.title)} champion</span>` +
        `<span class="champ-names">${names}</span>` +
        `<span class="champ-note">${esc(c.note)}</span></span>` +
      `</div>`;
    }).join("");
    return `<div class="champ-head">Champions of the Road</div><div class="champ-list">${rows}</div>`;
  }

  // Spoken celebration: every champion read out by name, so no winner is missed.
  function championsLine(champs) {
    if (!champs.length) return "";
    const parts = champs.map((c) => {
      const names = c.who.map((p) => p.name).join(" and ");
      return `${names}, ${c.title} champion`;
    });
    return ` And the champions of the road: ${parts.join("; ")}.`;
  }

  // Every player is home: show the full finishing order and wrap up.
  function endGame(local) {
    if (!boardBox) return;             // board gone (player left): show nothing
    S.over = true; S.busy = false;
    setMoving(false);
    renderStandings(); renderTokens(); setTurnTag();
    if (S.net.online) {
      // Stop driving; if we are the browser that saw the finish, write the final
      // state once. An over game falls out of the lobby list on its own.
      S.net.acting = false;
      CG.Net.stopPoll();
      if (local) pushState("The whole table is home", { summary: true });
    }
    const order = S.players.slice().sort((a, b) => a.rank - b.rank);
    const winner = order[0];
    const human = S.players.find((x) => !x.isAI);
    if (S.settings.music) { CG.Audio.sfx.win(); CG.Audio.sfx.clap(); CG.Audio.setProgress(100); }
    if (human && human.rank === 1) confetti();

    let line;
    if (human && human.rank === 1) {
      line = human.name === "You" ? CG.STORY.winVsAI
        : `${human.name} reaches the end of the road first, leaving the country a little stronger, a little fairer, and quite able to do without them. Mandate complete.`;
    } else if (human) {
      line = `${winner.name} reaches the end first; ${human.name === "You" ? "you finish" : human.name + " finishes"} ${ordinal(human.rank)}. Every team made it home in the end.`;
    } else {
      line = `${winner.name} leads the field home. Every team completed the road.`;
    }
    const built = CG.QUINTET.filter((q) => (S.quintet[q.key] || 0) > 0).map((q) => q.name);
    if (built.length) line += ` The country team's strongest capabilities of the UN 2.0 Quintet: ${built.join(", ")}.`;
    // The champions are shown as their own list below, so the spoken line adds
    // them but the printed narrative keeps just the story beat.
    const champs = computeChampions();
    const spoken = line + championsLine(champs);
    CG.Narrate.auto(spoken);

    const over = el("div", "overlay-card show");
    const c = el("div", "event-card win");
    c.innerHTML =
      `<div class="ec-band">FINAL STANDINGS</div>` +
      `<div class="ec-icon">🏁</div>` +
      `<div class="ec-title">The whole table is home</div>` +
      championsHtml(champs) +
      `<div class="ec-why">${esc(line)}</div>`;
    const actions = el("div", "ec-actions");
    const again = el("button", "btn btn-primary", S.net.online ? "Back to the theatres ▸" : "Run the road again ▸");
    again.onclick = () => {
      over.remove(); CG.Narrate.stop();
      if (S.net.online) { S.net.online = false; CG.Net.stopPoll(); teardownBoard(); CG.Lobby ? CG.Lobby.show() : renderTitle(); }
      else renderTitle();
    };
    const speak = el("button", "btn btn-ghost", "🔊 Read aloud");
    speak.onclick = () => CG.Narrate.speak(spoken);
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

  // =======================================================================
  // MULTIPLAYER
  // Several browsers share one game through the JSON store. The seat whose turn
  // it is has exactly one controller: a human seat is driven by its owner, an
  // AI seat by the game host. So only ever one browser acts per turn and writes
  // never collide. Everyone else polls, applies the new state, and renders it.
  // =======================================================================
  const myId = () => (CG.Net ? CG.Net.clientId : "local");

  // Do I control whoever's turn it is right now?
  function iControl() {
    if (!S.net.online) return true;            // solo: always
    const p = S.players[S.current];
    if (!p) return false;
    if (p.isAI) return S.net.hostId === myId(); // host drives the AI seats
    return p.ownerId === myId();                // a human seat is driven by its owner
  }
  function iOwnAnySeat() {
    return S.players.some((p) => !p.isAI && p.ownerId === myId());
  }

  // Flatten the live state into the plain object stored for the table.
  function serialize() {
    return {
      id: S.net.gameId,
      hostId: S.net.hostId,
      theatreIdx: CG.THEATRES.indexOf(S.theatre),
      theatre: { name: S.theatre.name, icon: S.theatre.icon },
      board: S.board,
      diceCount: S.settings.diceCount,
      current: S.current,
      over: S.over,
      quintet: S.quintet,
      seq: S.net.seq,
      lastWriter: myId(),
      lastEvent: S.net.lastEvent || "",
      beat: S.net.beat || 0,
      show: S.net.show || null,
      players: S.players.map((p) => ({
        name: p.name, isAI: p.isAI, ownerId: p.ownerId || null,
        roleIdx: CG.ROLES.indexOf(p.role), icon: p.role.icon, color: p.color,
        pos: p.pos, points: p.points, trophies: p.trophies, diamonds: p.diamonds,
        contrib: p.contrib, finished: p.finished, rank: p.rank,
        skipNext: p.skipNext, bonusRoll: p.bonusRoll, finishTries: p.finishTries,
      })),
    };
  }

  // Rebuild the live state from a stored game (roles and the theatre are
  // restored by index so every browser draws the same board and people).
  function deserialize(game) {
    S.net.gameId = game.id;
    S.net.hostId = game.hostId;
    S.theatre = CG.THEATRES[game.theatreIdx] || CG.THEATRES[0];
    S.board = game.board;
    S.settings.diceCount = game.diceCount || 1;
    S.current = game.current || 0;
    S.over = !!game.over;
    S.quintet = game.quintet || newQuintet();
    S.net.seq = game.seq || 0;
    S.net.beat = game.beat || 0;
    S.players = (game.players || []).map((sp) => {
      const role = CG.ROLES[sp.roleIdx] || CG.ROLES[0];
      return {
        name: sp.name, isAI: sp.isAI, ownerId: sp.ownerId || null,
        role, tags: CG.roleTags(role), color: sp.color,
        pos: sp.pos || 1, points: sp.points || 0,
        trophies: sp.trophies || 0, diamonds: sp.diamonds || 0,
        contrib: sp.contrib || newQuintet(),
        finished: !!sp.finished, rank: sp.rank || 0,
        skipNext: !!sp.skipNext, bonusRoll: !!sp.bonusRoll, finishTries: sp.finishTries || 0,
      };
    });
  }

  // Write the current state for the table. Bumps seq so the others know it is
  // newer than what they hold (and newer than our own last write, so we do not
  // re-apply our echo). Fire and forget: a failed write retries next turn, it
  // must never stall the animation.
  function pushState(eventText, opts) {
    if (!S.net.online) return Promise.resolve();
    S.net.seq = (S.net.seq || 0) + 1;
    if (eventText != null) S.net.lastEvent = eventText;
    const game = serialize();
    return CG.Net.putGame(game, opts).catch((e) => { /* try again next turn */ });
  }

  // Broadcast one beat of a turn (a roll or a card) so every other browser can
  // play it: the show payload travels in the state, tagged with a rising beat
  // number and our id, and the others present it (and skip our own echo). Only
  // the acting browser ever calls this, and only online.
  function emitBeat(show, eventText) {
    if (!S.net.online) return Promise.resolve();
    S.net.beat = (S.net.beat || 0) + 1;
    S.net.shownBeat = S.net.beat;                 // we are showing it live ourselves
    S.net.show = Object.assign({ beat: S.net.beat, by: myId() }, show);
    return pushState(eventText);
  }
  const slimCard = (c) => ({ icon: c.icon, title: c.title, why: c.why, fact: c.fact });
  // Tell the table which card a player just drew, before we animate it locally.
  function emitCardBeat(p, kind, card, dest, q, moveLine, eventText) {
    emitBeat({ t: "card", seat: S.players.indexOf(p), kind, card: slimCard(card),
      dest: dest == null ? null : dest, q: q || null, moveLine: moveLine || null }, eventText);
  }

  // Take whatever turn is now ours to take. Called after entering a game and
  // after every applied remote update. Does nothing on a seat we do not drive.
  // It does NOT rebuild the tokens (that would snap a token mid-walk); syncTokens
  // owns the token positions while watching a remote turn.
  function maybeAct() {
    setTurnTag(); renderStandings();
    if (S.over || S.busy) return;
    if (!iControl()) return;
    const p = S.players[S.current];
    if (p.isAI) scheduleAI();        // host rolls for the AI
    // a human seat we own: the Roll button is live (setTurnTag enabled it)
  }

  // A remote snapshot arrived from the poll. Apply it unless it is stale, our
  // own echo, or we are mid-move (we re-check on the next tick). Tokens glide to
  // the shared positions (so the move is visible) and any new beat (a roll or a
  // card the acting player just hit) is presented, so watchers see the whole
  // turn, not just the result.
  function applyRemote(game) {
    if (!S.net.online) return;
    if (!game) return handleGameGone();
    if ((game.seq || 0) <= (S.net.seq || 0)) return;   // nothing newer than we hold
    if (S.busy || S.net.acting) return;                // do not disturb our own turn
    const wasOver = S.over;
    const prev = S.players.map((p) => p.pos);
    deserialize(game);
    const show = game.show;
    const newBeat = !!(show && (show.beat || 0) > (S.net.shownBeat || 0) && show.by !== myId());
    if (show && (show.beat || 0) > (S.net.shownBeat || 0)) S.net.shownBeat = show.beat;
    // Animate every token to its new square. The mover (the seat the beat is
    // about) walks square by square; we learn how long that takes so the card
    // can wait for the walk to finish before it covers the board.
    const walkMs = syncTokens(prev, show ? show.seat : -1);
    renderStandings();
    if (newBeat) {
      if (show.t === "roll") presentRemote(show);                              // the die, at once
      else setTimeout(() => { if (boardBox) presentRemote(show); }, walkMs);   // the card, after the walk
    } else if (game.lastEvent && game.lastWriter !== myId()) {
      toast(game.lastEvent, "muted");
    }
    if (S.over && !wasOver) return showRemoteOver();
    maybeAct();
  }

  // Watching a remote turn, a token walks one square at a time (so the motion
  // reads like a real move). Animate every token to its new square: the mover
  // steps along the board path; a big jump (a ladder or hole slide) glides
  // straight there. Returns how long the mover's walk takes.
  const STEP_MS = 170;
  let obsGen = 0;
  const obsWalk = {};   // seat index -> { gen, timer } of a walk in progress
  function cancelWalk(i) { if (obsWalk[i] && obsWalk[i].timer) clearTimeout(obsWalk[i].timer); obsWalk[i] = null; }
  function cancelAllWalks() { Object.keys(obsWalk).forEach((k) => cancelWalk(k)); }

  function syncTokens(prev, moverSeat) {
    const layer = $("#tokens");
    if (!layer) return 0;
    if (layer.children.length !== S.players.length) { renderTokens(); return 0; }
    let moverMs = 0;
    S.players.forEach((p, i) => {
      const t = $("#tok" + i);
      if (!t) return;
      t.classList.toggle("active", i === S.current && !S.over);
      const from = prev ? prev[i] : p.pos;
      if (from === p.pos) return;
      let ms;
      if (Math.abs(p.pos - from) <= 6) { ms = stepToken(i, from, p.pos); }        // a roll / hop: walk it
      else { cancelWalk(i); t.classList.add("remote-move"); moveTokenTo(i, p.pos); ms = 520; }  // a slide: glide
      if (i === moverSeat) moverMs = ms;
    });
    return moverMs;
  }

  // Step a token from one square to the next along the board, returning the total
  // walk duration. A later walk for the same seat cancels this one.
  function stepToken(i, from, to) {
    cancelWalk(i);
    const t = $("#tok" + i);
    if (t) t.classList.remove("remote-move");   // use the short per-step transition
    const dir = to >= from ? 1 : -1;
    const gen = ++obsGen;
    obsWalk[i] = { gen, timer: null };
    let cur = from;
    const stepOnce = () => {
      if (!obsWalk[i] || obsWalk[i].gen !== gen || !boardBox) return;
      cur += dir;
      moveTokenTo(i, cur);
      if (cur === to) { obsWalk[i] = null; return; }
      obsWalk[i].timer = setTimeout(stepOnce, STEP_MS);
    };
    obsWalk[i].timer = setTimeout(stepOnce, 20);
    return Math.abs(to - from) * STEP_MS + 140;
  }

  // Present a beat broadcast by the acting player: a roll (flash the die) or a
  // card / field note (a read-only card that auto-dismisses, so it never blocks).
  function presentRemote(show) {
    if (!boardBox || !show) return;
    if (show.t === "roll") {
      const seat = S.players[show.seat];
      const d = $("#die0");
      if (d) { d.innerHTML = pips(show.value); d.classList.remove("settle"); void d.offsetWidth; d.classList.add("settle"); }
      if (seat) toast(`${seat.name} rolls ${show.value}`, "roll");
      return;
    }
    if (show.t === "card" || show.t === "note") showRemoteCard(show);
  }

  // The read-only "watch" card other players' turns show. Replaces any previous
  // one and clears itself after a few seconds (or on a click).
  let remoteCardEl = null;
  function clearRemoteCard() { if (remoteCardEl) { const e = remoteCardEl; remoteCardEl = null; e.classList.remove("show"); setTimeout(() => e.remove(), 200); } }
  function showRemoteCard(show) {
    if (!boardBox) return;
    clearRemoteCard();
    const seat = S.players[show.seat];
    const over = el("div", "overlay-card watch");
    let c;
    if (show.t === "note") {
      c = el("div", "event-card note");
      c.innerHTML = (seat ? whoHtml(seat) : "") +
        `<div class="ec-band">FIELD NOTE</div><div class="ec-icon">★</div>` +
        `<div class="ec-fact big"><span>From the field</span>${esc(show.note)}</div>`;
    } else {
      const card = show.card || {}, kind = show.kind || "surprise", q = show.q;
      const moveHtml = show.moveLine
        ? `<div class="ec-move ec-impose">${esc(show.moveLine)}</div>`
        : (show.dest != null ? `<div class="ec-move">${kind === "ladder" ? "▲" : "▼"} ${show.dest}</div>` : "");
      const quintHtml = q
        ? `<div class="ec-quint ${q.dir > 0 ? "up" : "down"}"><span class="eq-ic">${q.meta.icon}</span>` +
          `<span class="eq-txt"><b>${esc(q.meta.name)}</b> ${q.dir > 0 ? "strengthened" : "set back"}` +
          `<small>UN 2.0 Quintet of Change</small></span><span class="eq-delta">${q.dir > 0 ? "+1" : "−1"}</span></div>`
        : "";
      c = el("div", "event-card " + kind);
      c.innerHTML = (seat ? whoHtml(seat) : "") +
        `<div class="ec-band">${BAND[kind] || ""}</div>` +
        `<div class="ec-icon">${card.icon || "◆"}</div>` +
        `<div class="ec-title">${esc(card.title || "")}</div>` + moveHtml +
        (card.why ? `<div class="ec-why">${esc(card.why)}</div>` : "") +
        (card.fact ? `<div class="ec-fact"><span>Side fact</span>${esc(card.fact)}</div>` : "") +
        quintHtml;
    }
    c.appendChild(el("div", "ec-watch", `👀 watching ${esc(seat ? seat.name : "the table")}`));
    over.appendChild(c);
    over.onclick = clearRemoteCard;
    app().appendChild(over);
    remoteCardEl = over;
    requestAnimationFrame(() => over.classList.add("show"));
    setTimeout(() => { if (remoteCardEl === over) clearRemoteCard(); }, 4600);
  }

  // Host failover: if it is a human seat's turn but it has gone quiet for a
  // while (the owner closed their tab), the host hands the seat back to the AI
  // so the road does not stall, and it becomes joinable again.
  let lastProgressAt = 0;
  function checkStall(game) {
    if (!S.net.online || S.net.hostId !== myId() || !game || game.over) return;
    const cur = game.players && game.players[game.current];
    if (!cur || cur.isAI) { lastProgressAt = CG.Net.now(); return; }
    if ((game.seq || 0) !== (S.net.seq || 0)) { lastProgressAt = CG.Net.now(); return; }
    if (!lastProgressAt) lastProgressAt = CG.Net.now();
    if (CG.Net.now() - lastProgressAt > 60000) {
      lastProgressAt = CG.Net.now();
      S.players[game.current].isAI = true;
      S.players[game.current].ownerId = null;
      toast(`${cur.name} went quiet, the field takes the seat`, "muted");
      pushState(`${cur.name}'s seat is now run by the field`, { summary: true })
        .then(() => maybeAct());
    }
  }

  function handleGameGone() {
    if (!S.net.online) return;
    S.net.online = false; S.over = true; CG.Net.stopPoll(); teardownBoard();
    toast("This theatre has closed", "muted");
    setTimeout(() => CG.Lobby && CG.Lobby.show(), 1200);
  }

  function showRemoteOver() {
    CG.Net.stopPoll();
    endGame(false);
  }

  // Start polling the shared game and wire each snapshot through apply + stall.
  function startSync() {
    if (!S.net.online || !CG.Net) return;
    CG.Net.poll(S.net.gameId, (game) => { checkStall(game); applyRemote(game); });
  }

  // Release the seats we own (so others can take them) and leave for the lobby.
  function leaveGame() {
    CG.Narrate.stop(); teardownBoard(); CG.Net.stopPoll();
    if (S.net.online && iOwnAnySeat() && !S.over) {
      S.players.forEach((p) => { if (!p.isAI && p.ownerId === myId()) { p.ownerId = null; p.isAI = true; } });
      pushState(`A coordinator has left ${S.theatre.name}`, { summary: true });
    }
    // Stop the loop: any in-flight turn or scheduled AI move bails out, and the
    // card renderers go quiet, so nothing from this game pops up over the lobby.
    S.over = true;
    S.net.online = false;
    CG.Lobby ? CG.Lobby.show() : CG.Platform.show();
  }

  // Build the shared game object a host opens a new online theatre with: the
  // creator takes seat one, the rest start as AI seats anyone can take over.
  function buildOnlineGame(hostName, seatCount) {
    const theatre = CG.THEATRES[Math.floor(Math.random() * CG.THEATRES.length)];
    const board = generateBoard();
    const roles = shuffle(CG.ROLES);
    const names = (CG.AGENT_NAMES && CG.AGENT_NAMES.length ? CG.AGENT_NAMES : ["Amara", "Diego", "Mei", "Kofi"]).slice();
    const taken = [];
    const players = [];
    for (let i = 0; i < seatCount; i++) {
      const isAI = i !== 0;
      let nm;
      if (!isAI) nm = hostName;
      else {
        const pool = names.filter((n) => taken.indexOf(n) < 0);
        nm = (pool.length ? pool : names)[Math.floor(Math.random() * (pool.length ? pool.length : names.length))];
      }
      taken.push(nm);
      players.push({
        name: nm, isAI, ownerId: isAI ? null : myId(),
        roleIdx: CG.ROLES.indexOf(roles[i % roles.length]), icon: roles[i % roles.length].icon,
        color: COLORS[i % COLORS.length], pos: 1, points: 0, trophies: 0, diamonds: 0,
        contrib: newQuintet(), finished: false, rank: 0,
        skipNext: false, bonusRoll: false, finishTries: 0,
      });
    }
    return {
      id: null, hostId: myId(),
      theatreIdx: CG.THEATRES.indexOf(theatre), theatre: { name: theatre.name, icon: theatre.icon },
      board, diceCount: 1, current: 0, over: false,
      quintet: newQuintet(), seq: 1, lastWriter: myId(), lastEvent: "",
      players,
    };
  }

  // Enter a shared game: light up audio/narration to the local preferences,
  // restore the state, draw the board, then take any turn that is ours. opts.intro
  // shows the theatre's background first (the host has no join screen to read it).
  function showMulti(game, opts) {
    ensureDecks();
    if (S.settings.music) CG.Audio.start();
    CG.Narrate.setEnabled(S.settings.voice);
    deserialize(game);
    S.net.online = true; S.busy = false; S.zoneSpoken = -1;
    S.net.shownBeat = game.beat || 0;   // do not replay the beat in progress as we arrive
    lastProgressAt = CG.Net.now();
    renderBoard();
    startSync();
    maybeAct();
    if (opts && opts.intro) showTheatreIntro("Enter the theatre ▸");
  }

  // A card naming the theatre, its kind, and its one-paragraph story. Shown as
  // the host's entry intro, and again whenever the theatre name is tapped.
  function showTheatreIntro(label) {
    if (!boardBox) return;                       // not on the board: nothing to show over
    const t = S.theatre;
    const kind = CG.theatreKindMeta(t);
    const over = el("div", "overlay-card");
    const c = el("div", "event-card note");
    c.innerHTML =
      `<div class="ec-band">${kind.icon} ${kind.label.toUpperCase()}</div>` +
      `<div class="ec-icon">${t.icon}</div>` +
      `<div class="ec-title">${esc(t.name)}</div>` +
      `<div class="ec-fact big"><span>Your posting</span>${esc(CG.theatreStory(t))}</div>`;
    const actions = el("div", "ec-actions");
    const cont = el("button", "btn btn-primary", label || "Close ▸");
    cont.onclick = () => { over.classList.remove("show"); setTimeout(() => over.remove(), 250); };
    actions.appendChild(cont);
    c.appendChild(actions);
    over.appendChild(c);
    app().appendChild(over);
    requestAnimationFrame(() => over.classList.add("show"));
  }

  // ---- public API (the platform launcher mounts the game) ---------------
  CG.SnakesGame = {
    title: "Common Ground: The Long Road",
    show: function () { ensureDecks(); teardownBoard(); S.net.online = false; renderTitle(); },
    // Multiplayer entry points, used by the lobby.
    buildOnlineGame,
    showMulti,
  };
})();
