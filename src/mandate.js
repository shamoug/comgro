/* =========================================================================
 * COMMON GROUND, THE MANDATE,  mandate.js
 * The second game on the platform: a HEDGE MAZE. Each player enters from a
 * different gate on a different side of a great green maze, the kind you see in
 * the gardens of European castles, and tries to thread the corridors to the
 * fountain at the centre, where the mission is accomplished. The maze is random
 * every game, but it is a perfect maze (a spanning tree, lightly braided), so a
 * path from every gate to the centre always exists.
 *
 * It runs on exactly the mechanics of The Long Road: roll a die, walk the
 * corridors, and let the surprises carry you. Shortcuts (secret passages) cut
 * you toward the centre and strengthen a UN 2.0 capability; traps get you lost
 * and set one back; trophies, diamonds, surprises and field notes are all the
 * same decks. You must spend every step you roll, so the dice push you past
 * turnings and into dead ends: that is how you get lost. Reach the centre and
 * you are home. The mission is accomplished only when the LAST player arrives.
 *
 * Vanilla JS, no framework, no build step. All flavour text lives in
 * data/content.js; this file is mechanics + DOM only. The maze, the hedges, the
 * die and the tokens are all CSS and inline SVG, no external images, and
 * everything redraws on resize.
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
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  // Draw a card customised to the player: weight it up if its tag matches the
  // player's job title and affiliation (role tags) or the scenario they were
  // posted to (theatre tags). So every card a player draws relates to them.
  const lastDrawn = new WeakMap();
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

  // ---- layout constants --------------------------------------------------
  const GRID = 11;                 // odd, so the maze has a true centre cell
  const MID = (GRID - 1) / 2;      // 5: the middle row / column
  const NS = "http://www.w3.org/2000/svg";
  const CENTER = { r: MID, c: MID };
  const DIRS = {
    N: { dr: -1, dc: 0, opp: "S" }, S: { dr: 1, dc: 0, opp: "N" },
    E: { dr: 0, dc: 1, opp: "W" }, W: { dr: 0, dc: -1, opp: "E" },
  };
  const ARROW = { N: "⬆️", S: "⬇️", E: "➡️", W: "⬅️" };
  const DIRNAME = { N: "North", S: "South", E: "East", W: "West" };

  // the four gates, one per side; players take them in this order, so two
  // players always face each other across the maze.
  const SIDES = [
    { gate: "N", name: "the North gate", cell: { r: 0, c: MID } },
    { gate: "S", name: "the South gate", cell: { r: GRID - 1, c: MID } },
    { gate: "E", name: "the East gate", cell: { r: MID, c: GRID - 1 } },
    { gate: "W", name: "the West gate", cell: { r: MID, c: 0 } },
  ];

  // ---- the UN 2.0 Quintet (shared team tally) ---------------------------
  function newQuintet() {
    const q = {};
    CG.QUINTET.forEach((c) => (q[c.key] = 0));
    return q;
  }
  // A shortcut strengthens a capability, a trap sets one back; the capability
  // is inferred from the card's tag, exactly as in The Long Road.
  function applyQuintet(p, tag, dir) {
    const key = CG.quintetForTag(tag);
    const meta = CG.quintetMeta(key);
    S.quintet[key] = (S.quintet[key] || 0) + dir;
    p.contrib[key] = (p.contrib[key] || 0) + dir;
    award(p, dir > 0 ? 3 : -2);
    return { key, meta, dir, level: S.quintet[key] };
  }
  function award(p, pts) { p.points = Math.max(0, (p.points || 0) + pts); }
  function flashQuint(key, dir) {
    const chip = $('#standings [data-q="' + key + '"]');
    if (!chip) return;
    const cls = dir > 0 ? "pulse-up" : "pulse-down";
    chip.classList.remove(cls); void chip.offsetWidth; chip.classList.add(cls);
    setTimeout(() => chip.classList.remove(cls), 950);
  }

  function fillCard(card, p) {
    const role = p.role.name, aff = CG.affShort(p.role.aff), theatre = (S.theatre && S.theatre.name) || "";
    const sub = (s) => String(s == null ? "" : s)
      .replace(/\{role\}/g, role).replace(/\{aff\}/g, aff).replace(/\{theatre\}/g, theatre);
    return Object.assign({}, card, { title: sub(card.title), why: sub(card.why), fact: sub(card.fact) });
  }

  // Data shown in the shared hover card for one player.
  function playerInfo(p) {
    return {
      name: p.name, role: p.role.name, aff: p.role.aff, icon: p.role.icon, color: p.color,
      scoreLabel: "Perseverance", score: p.points || 0,
      quintet: CG.QUINTET.map((q) => ({ icon: q.icon, name: q.name, lvl: (p.contrib && p.contrib[q.key]) || 0 })),
    };
  }

  // The identity banner shown at the top of every in-play card.
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

  // ---- state -------------------------------------------------------------
  const S = {
    players: [],
    current: 0,
    theatre: null,
    busy: false,
    over: false,
    // autoPlay off means "wait for the user to click": every seat, Human and AI,
    // waits for a Roll click and every card waits for a Continue click. Turn it
    // on and the whole table threads the maze by itself. Toggled live on the board.
    settings: { music: true, voice: true, autoPlay: false },
    cells: [],          // GRID x GRID, each { walls:{N,E,S,W} }
    dist: [],           // GRID x GRID distance (in steps) to the centre
    maxDist: 1,
    special: {},        // "r,c" -> { kind, to? }
    gates: [],          // open border openings, one per player
    quintet: {},
    zoneSpoken: -1,
    finishedCount: 0,
    decks: {},
  };

  const COLORS = ["#2f6bff", "#e8439b", "#7c4dff", "#ef9f25"];
  const MEDALS = ["🥇", "🥈", "🥉", "🎖️"];
  function ordinal(n) {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  let mazeBox = null, mazeSvg = null, resizeObs = null, relayoutHandler = null;
  let decksReady = false;

  function ensureDecks() {
    if (decksReady) return;
    // Field notes are plain wisdom strings (no tag), so they cycle as a deck.
    // Every other deck is drawn per player via weightedDraw, customised to
    // their job title, affiliation and scenario.
    S.decks.note = makeDeck(CG.FIELD_NOTES);
    decksReady = true;
  }

  // =======================================================================
  // THE MAZE,  a fresh perfect maze every game, lightly braided.
  // =======================================================================
  const key = (r, c) => r + "," + c;
  const inGrid = (r, c) => r >= 0 && r < GRID && c >= 0 && c < GRID;
  const cellAt = (r, c) => S.cells[r][c];
  const isCenter = (cell) => cell.r === CENTER.r && cell.c === CENTER.c;
  const atCenter = (p) => isCenter(p.cell);
  const distOf = (cell) => S.dist[cell.r][cell.c];

  // open passages out of a cell (no hedge between), as {r,c,dir}
  function openNeighbors(cell) {
    const out = [];
    const w = cellAt(cell.r, cell.c).walls;
    for (const d in DIRS) {
      if (w[d]) continue;
      const nr = cell.r + DIRS[d].dr, nc = cell.c + DIRS[d].dc;
      if (inGrid(nr, nc)) out.push({ r: nr, c: nc, dir: d });
    }
    return out;
  }

  // carve a perfect maze with a randomised depth-first backtracker from the
  // centre outward, then braid a few dead ends so there are real choices.
  function generateMaze() {
    const cells = [];
    for (let r = 0; r < GRID; r++) {
      const row = [];
      for (let c = 0; c < GRID; c++) row.push({ walls: { N: true, E: true, S: true, W: true } });
      cells.push(row);
    }
    S.cells = cells;

    const seen = new Set();
    const stack = [{ r: CENTER.r, c: CENTER.c }];
    seen.add(key(CENTER.r, CENTER.c));
    while (stack.length) {
      const cur = stack[stack.length - 1];
      const opts = [];
      for (const d in DIRS) {
        const nr = cur.r + DIRS[d].dr, nc = cur.c + DIRS[d].dc;
        if (inGrid(nr, nc) && !seen.has(key(nr, nc))) opts.push({ d, nr, nc });
      }
      if (!opts.length) { stack.pop(); continue; }
      const pick = opts[Math.floor(Math.random() * opts.length)];
      cells[cur.r][cur.c].walls[pick.d] = false;
      cells[pick.nr][pick.nc].walls[DIRS[pick.d].opp] = false;
      seen.add(key(pick.nr, pick.nc));
      stack.push({ r: pick.nr, c: pick.nc });
    }

    // braid: knock one extra wall on roughly a third of dead ends, to add loops
    // and alternative routes (more ways to get lost, fewer pure dead ends).
    for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) {
      const w = cells[r][c].walls;
      const walls = ["N", "E", "S", "W"].filter((d) => w[d]);
      if (walls.length >= 3 && Math.random() < 0.34) {
        const cands = shuffle(walls).filter((d) => {
          const nr = r + DIRS[d].dr, nc = c + DIRS[d].dc;
          return inGrid(nr, nc);
        });
        if (cands.length) {
          const d = cands[0], nr = r + DIRS[d].dr, nc = c + DIRS[d].dc;
          cells[r][c].walls[d] = false;
          cells[nr][nc].walls[DIRS[d].opp] = false;
        }
      }
    }

    computeDist();
    placeSpecials();
  }

  // breadth-first distance from the centre to every cell (a path always exists)
  function computeDist() {
    const dist = [];
    for (let r = 0; r < GRID; r++) dist.push(new Array(GRID).fill(-1));
    dist[CENTER.r][CENTER.c] = 0;
    let frontier = [{ r: CENTER.r, c: CENTER.c }], max = 0;
    while (frontier.length) {
      const next = [];
      frontier.forEach((cell) => {
        openNeighbors(cell).forEach((n) => {
          if (dist[n.r][n.c] === -1) {
            dist[n.r][n.c] = dist[cell.r][cell.c] + 1;
            if (dist[n.r][n.c] > max) max = dist[n.r][n.c];
            next.push({ r: n.r, c: n.c });
          }
        });
      });
      frontier = next;
    }
    S.dist = dist;
    S.maxDist = Math.max(1, max);
  }

  // sprinkle the special cells across the maze (never on the centre or a gate).
  function placeSpecials() {
    S.special = {};
    const gateKeys = new Set(SIDES.map((s) => key(s.cell.r, s.cell.c)));
    const pool = shuffle((function () {
      const a = [];
      for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) {
        if (isCenter({ r, c })) continue;
        if (gateKeys.has(key(r, c))) continue;
        if (S.dist[r][c] < 1) continue;
        a.push({ r, c });
      }
      return a;
    })());

    let i = 0;
    const take = (n) => pool.slice(i, (i += n));

    // shortcuts (secret passages) cut TOWARD the centre; traps get you LOST.
    take(5).forEach((cell) => (S.special[key(cell.r, cell.c)] = { kind: "shortcut", to: toward(cell, rnd(3, 5)) }));
    take(5).forEach((cell) => (S.special[key(cell.r, cell.c)] = { kind: "trap", to: away(cell, rnd(3, 7)) }));
    take(4).forEach((cell) => (S.special[key(cell.r, cell.c)] = { kind: "trophy" }));
    take(5).forEach((cell) => (S.special[key(cell.r, cell.c)] = { kind: "diamond" }));
    take(6).forEach((cell) => (S.special[key(cell.r, cell.c)] = { kind: "surprise" }));
    take(5).forEach((cell) => (S.special[key(cell.r, cell.c)] = { kind: "note" }));
  }

  const specialAt = (cell) => S.special[key(cell.r, cell.c)] || null;

  // a cell roughly k steps closer to the centre, along an actual maze path
  // (never the centre itself, so a shortcut never wins the game outright).
  function toward(cell, k) {
    let cur = { r: cell.r, c: cell.c }, prev = null;
    for (let s = 0; s < k; s++) {
      if (distOf(cur) <= 1) break;
      const nb = openNeighbors(cur).filter((n) => distOf(n) < distOf(cur));
      if (!nb.length) break;
      const nx = nb[Math.floor(Math.random() * nb.length)];
      prev = cur; cur = { r: nx.r, c: nx.c };
    }
    return cur;
  }
  // a cell roughly k steps FARTHER from the centre: where the trap leaves you lost.
  function away(cell, k) {
    let cur = { r: cell.r, c: cell.c };
    for (let s = 0; s < k; s++) {
      const nb = openNeighbors(cur).filter((n) => distOf(n) > distOf(cur));
      if (!nb.length) break;
      const nx = nb[Math.floor(Math.random() * nb.length)];
      cur = { r: nx.r, c: nx.c };
    }
    return cur;
  }

  // =======================================================================
  // SCREENS
  // =======================================================================
  function renderTitle() {
    teardown();
    const root = app();
    root.innerHTML = "";
    const wrap = el("div", "screen title-screen");
    wrap.appendChild(el("div", "title-glow"));
    if (CG.Platform) {
      const back = el("button", "back-link", "← Games");
      back.onclick = () => { CG.Narrate.stop(); CG.Platform.show(); };
      wrap.appendChild(back);
    }
    wrap.appendChild(el("div", "logo-mark mandate-logo", "◆"));
    wrap.appendChild(el("h1", "title", "Common Ground"));
    wrap.appendChild(el("p", "subtitle", "The Mandate"));
    wrap.appendChild(el("p", "tagline",
      "A great green hedge maze, the kind that hides in the gardens of old castles. Every player enters from a different gate and threads the corridors toward the fountain at the centre, where the mission is accomplished. Roll the die, ride the shortcuts and surprises, dodge the traps that get you lost, and do not stop rolling until you find the path home. A different maze every time."));

    const legend = el("div", "mandate-legend");
    legend.innerHTML = [
      { ic: "🏁", name: "The Centre", blurb: "Reach it to accomplish the mission" },
      { ic: "🪙", name: "Golden coins", blurb: "A coin trail toward the centre" },
      { ic: "🕳️", name: "Trap", blurb: "You get lost, back into the hedges" },
      { ic: "🏆", name: "Trophy", blurb: "Recognition, and another roll" },
      { ic: "💎", name: "Diamond", blurb: "A windfall that carries you on" },
      { ic: "❓", name: "Surprise", blurb: "A mystery, for better or worse" },
    ].map((r) =>
      `<span class="ml-chip"><span class="ml-ic">${r.ic}</span><b>${r.name}</b><small>${r.blurb}</small></span>`).join("");
    wrap.appendChild(legend);

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

  function openSetup() {
    CG.Setup.open({
      icon: "◆",
      title: "The Mandate",
      subtitle: "Set the table",
      intro: "Choose who takes each seat. Pick Human and name yourself; pick AI and a rival coordinator joins the field. Two to four play, each entering the maze from their own gate.",
      seatColors: COLORS,
      minSeats: 2, maxSeats: 4, defaultSeats: 2,
      startLabel: "Deal the postings ▸",
      onBack: () => renderTitle(),
      onStart: (roster) => beginDeal(roster),
    });
  }

  function beginDeal(roster) {
    if (S.settings.music) CG.Audio.start();
    CG.Narrate.setEnabled(S.settings.voice);

    S.theatre = CG.THEATRES[Math.floor(Math.random() * CG.THEATRES.length)];
    generateMaze();
    const roles = shuffle(CG.ROLES);
    S.gates = [];
    S.players = roster.map((seat, i) => {
      const side = SIDES[i % SIDES.length];
      S.gates.push({ gate: side.gate, cell: { r: side.cell.r, c: side.cell.c } });
      return {
        name: seat.name,
        isAI: seat.isAI,
        role: roles[i % roles.length],
        tags: CG.roleTags(roles[i % roles.length]),  // job-title/affiliation domains, to customise this player's cards
        entry: side,
        cell: { r: side.cell.r, c: side.cell.c },
        prev: null,
        color: COLORS[i % COLORS.length],
        trophies: 0, diamonds: 0,
        points: 0,
        contrib: newQuintet(),
        bonusRoll: false, skipNext: false,
        finished: false, rank: 0,
      };
    });
    S.current = 0; S.over = false; S.zoneSpoken = -1; S.finishedCount = 0;
    S.quintet = newQuintet();
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
        `<div class="deal-label" style="color:${p.color}">${esc(p.name)}</div>` +
        `<div class="deal-title small">${p.role.name}</div>` +
        `<div class="deal-text">${p.role.tag}</div>` +
        `<div class="deal-entry">Enters from ${esc(p.entry.name)}</div>`;
      row.appendChild(c);
    });
    wrap.appendChild(row);

    const go = el("button", "btn btn-primary big", "Enter the maze ▸");
    go.onclick = () => { CG.Audio.sfx.pick(); renderBoard(); kickOff(); };
    wrap.appendChild(go);
    root.appendChild(wrap);
    CG.Narrate.auto(CG.MANDATE_STORY.opening);
  }

  // =======================================================================
  // BOARD
  // =======================================================================
  function teardown() {
    if (resizeObs) { try { resizeObs.disconnect(); } catch (e) {} resizeObs = null; }
    if (relayoutHandler) { window.removeEventListener("resize", relayoutHandler); relayoutHandler = null; }
    mazeBox = null; mazeSvg = null;
  }

  function renderBoard() {
    teardown();
    const root = app();
    root.innerHTML = "";
    const wrap = el("div", "screen board-screen mandate-screen maze-screen");
    wrap.appendChild(el("div", "bg-layer mandate-bg"));

    const bar = el("header", "hud-top");
    bar.innerHTML = `<div class="brand">◆ <b>Common Ground</b><span> · The Mandate</span></div>`;
    bar.appendChild(el("div", "theatre-chip", `${S.theatre.icon} ${S.theatre.name}`));
    const ctrls = el("div", "hud-ctrls");
    ctrls.appendChild(toggle("🎵", S.settings.music, (on) => { S.settings.music = on; CG.Audio.setMuted(!on); }));
    ctrls.appendChild(toggle("🗣️", S.settings.voice, (on) => { S.settings.voice = on; CG.Narrate.setEnabled(on); }));
    // Auto-play: when on, the whole table rolls and turns the cards by itself;
    // when off, every move waits for a click. Changeable at any point in the game.
    ctrls.appendChild(toggle("▶️ Auto", S.settings.autoPlay, (on) => {
      S.settings.autoPlay = on;
      toast(on ? "Auto-play on: the table moves on its own" : "Auto-play off: click to move", on ? "good" : "muted");
      setTurnTag();
      if (on) maybeAutoRoll();
    }));
    const restart = el("button", "chip-toggle", "↺");
    restart.title = "New game";
    restart.onclick = () => { CG.Narrate.stop(); renderTitle(); };
    ctrls.appendChild(restart);
    bar.appendChild(ctrls);
    wrap.appendChild(bar);

    const standings = el("aside", "standings"); standings.id = "standings";
    wrap.appendChild(standings);

    const stage = el("div", "board-stage maze-stage");
    mazeBox = el("div", "board-box maze-box"); mazeBox.id = "mazeBox";
    mazeSvg = document.createElementNS(NS, "svg");
    mazeSvg.setAttribute("class", "maze-svg");
    mazeSvg.setAttribute("viewBox", "0 0 100 100");
    mazeBox.appendChild(mazeSvg);
    const cellLayer = el("div", "cell-layer"); cellLayer.id = "cellLayer"; mazeBox.appendChild(cellLayer);
    const fx = el("div", "fx"); fx.id = "fx"; mazeBox.appendChild(fx);
    const tokens = el("div", "token-layer"); tokens.id = "tokens"; mazeBox.appendChild(tokens);
    stage.appendChild(mazeBox);
    wrap.appendChild(stage);

    const dock = el("div", "dice-dock"); dock.id = "dock";
    dock.innerHTML =
      `<div class="turn-tag" id="turnTag">Your move</div>` +
      `<div class="dice" id="dice"><div class="die" id="die0">${pips(1)}</div></div>`;
    const btn = el("button", "btn btn-roll", "🎲 Roll"); btn.id = "rollBtn"; btn.onclick = onRoll;
    dock.appendChild(btn);
    wrap.appendChild(dock);

    const toasts = el("div", "toast-area"); toasts.id = "toasts"; wrap.appendChild(toasts);
    wrap.appendChild(el("div", "board-credit", "Designed by <b>Digital Solutions Lab</b>"));
    root.appendChild(wrap);

    renderStandings();
    relayout();
    relayoutHandler = () => relayout();
    window.addEventListener("resize", relayoutHandler);
    try { resizeObs = new ResizeObserver(() => relayout()); resizeObs.observe(mazeBox.parentNode); }
    catch (e) { /* window resize still covers it */ }
  }

  // keep the maze a true square inside the stage, then redraw everything.
  function sizeBox() {
    if (!mazeBox) return;
    const stage = mazeBox.parentNode;
    const cs = getComputedStyle(stage);
    const availW = stage.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
    const availH = stage.clientHeight - parseFloat(cs.paddingTop || 0) - parseFloat(cs.paddingBottom || 0);
    const size = Math.max(40, Math.min(availW, availH));
    mazeBox.style.width = size + "px";
    mazeBox.style.height = size + "px";
  }

  function relayout() {
    if (!mazeBox) return;
    sizeBox();
    drawMaze();
    renderCells();
    renderTokens();
  }

  // ---- draw the hedges --------------------------------------------------
  function drawMaze() {
    if (!mazeSvg) return;
    const cs = 100 / GRID;
    const gate = (r, c, side) => S.gates.some((g) => g.cell.r === r && g.cell.c === c && g.gate === side);
    const segs = [];
    for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) {
      const w = cellAt(r, c).walls;
      const x = c * cs, y = r * cs;
      if (w.N && !gate(r, c, "N")) segs.push([x, y, x + cs, y]);
      if (w.W && !gate(r, c, "W")) segs.push([x, y, x, y + cs]);
      if (r === GRID - 1 && w.S && !gate(r, c, "S")) segs.push([x, y + cs, x + cs, y + cs]);
      if (c === GRID - 1 && w.E && !gate(r, c, "E")) segs.push([x + cs, y, x + cs, y + cs]);
    }
    const d = segs.map((s) => `M ${s[0].toFixed(2)} ${s[1].toFixed(2)} L ${s[2].toFixed(2)} ${s[3].toFixed(2)}`).join(" ");
    const ww = cs * 0.30;
    const path = (dd, col, w) =>
      `<path d="${dd}" fill="none" stroke="${col}" stroke-width="${w.toFixed(3)}" stroke-linecap="round" stroke-linejoin="round"/>`;

    // a paving TILE under every cell, so each step the player takes reads as one
    // physical tile along the corridor (the maze has no wall-cells: every cell
    // is walkable, the hedges are the thin walls between them).
    const tw = cs * 0.66, tr = tw * 0.22;
    let tiles = "";
    for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) {
      const x = (c + 0.5) * cs - tw / 2, y = (r + 0.5) * cs - tw / 2;
      tiles +=
        `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${tw.toFixed(2)}" height="${tw.toFixed(2)}" ` +
        `rx="${tr.toFixed(2)}" fill="url(#mazeTile)" stroke="#c7b88a" stroke-width="${(cs * 0.012).toFixed(3)}" opacity="0.95"/>`;
    }

    mazeSvg.innerHTML =
      `<defs>` +
        `<radialGradient id="mazeGround" cx="0.5" cy="0.5" r="0.72">` +
          `<stop offset="0" stop-color="#eef4dc"/><stop offset="1" stop-color="#dde7c4"/>` +
        `</radialGradient>` +
        `<linearGradient id="mazeTile" x1="0" y1="0" x2="0" y2="1">` +
          `<stop offset="0" stop-color="#fbf6e6"/><stop offset="1" stop-color="#ece2c4"/>` +
        `</linearGradient>` +
      `</defs>` +
      `<rect x="0" y="0" width="100" height="100" rx="2.5" fill="url(#mazeGround)"/>` +
      tiles +                            // the stepping tiles, one per step
      path(d, "#1f5230", ww * 1.08) +   // deep shadow root
      path(d, "#2e7a3d", ww) +          // hedge body
      path(d, "#3f9a4c", ww * 0.62) +   // sunlit top
      path(d, "#7cc06a", ww * 0.20);    // bright highlight
  }

  // ---- cell markers (centre, gates, specials) ---------------------------
  const SPECIAL_ICON = { shortcut: "🪙", trap: "🕳️", trophy: "🏆", diamond: "💎", surprise: "❓", note: "★" };
  function cellPctX(c) { return (c + 0.5) * (100 / GRID); }
  function cellPctY(r) { return (r + 0.5) * (100 / GRID); }

  function renderCells() {
    const layer = $("#cellLayer");
    if (!layer) return;
    layer.innerHTML = "";
    const cw = (mazeBox ? mazeBox.clientWidth : 480) / GRID;
    const ic = Math.max(11, cw * 0.5);

    const place = (r, c, cls, html, fontPx) => {
      const d = el("div", "maze-cell " + cls, html);
      d.style.left = cellPctX(c) + "%";
      d.style.top = cellPctY(r) + "%";
      if (fontPx) d.style.fontSize = fontPx + "px";
      layer.appendChild(d);
      return d;
    };

    // the gates, tinted in each player's colour
    S.players.forEach((p) => {
      const g = place(p.entry.cell.r, p.entry.cell.c, "mc-gate",
        `<span class="mg-ring" style="--tok:${p.color}"></span>`, null);
      g.style.setProperty("--tok", p.color);
    });

    // the specials
    Object.keys(S.special).forEach((k) => {
      const sp = S.special[k];
      const [r, c] = k.split(",").map(Number);
      place(r, c, "mc-sp mc-" + sp.kind, `<span class="mc-ic">${SPECIAL_ICON[sp.kind]}</span>`, ic);
    });

    // the centre, the fountain at the heart of the maze
    const goal = place(CENTER.r, CENTER.c, "mc-goal",
      `<span class="mc-ic">🏁</span><span class="mc-label">The Centre</span>`, ic * 1.04);
    goal.style.setProperty("--tok", "#ef9f25");
  }

  // ---- tokens -----------------------------------------------------------
  function tokenSize() {
    if (!mazeBox) return 30;
    return Math.max(22, mazeBox.clientWidth / GRID * 0.74);
  }
  function renderTokens() {
    const layer = $("#tokens");
    if (!layer) return;
    layer.innerHTML = "";
    const size = tokenSize();
    const byCell = {};
    S.players.forEach((p, i) => (byCell[key(p.cell.r, p.cell.c)] = byCell[key(p.cell.r, p.cell.c)] || []).push(i));
    S.players.forEach((p, i) => {
      const group = byCell[key(p.cell.r, p.cell.c)];
      const k = group.indexOf(i);
      const spread = group.length > 1 ? (k - (group.length - 1) / 2) * (size * 0.5) : 0;
      const t = el("div", "token" + (i === S.current && !S.over ? " active" : "") + (p.finished ? " done" : ""));
      t.id = "tok" + i;
      t.style.setProperty("--tok", p.color);
      t.style.width = size + "px"; t.style.height = size + "px";
      t.style.left = `calc(${cellPctX(p.cell.c)}% + ${spread}px)`;
      t.style.top = cellPctY(p.cell.r) + "%";
      t.innerHTML = `<span class="tok-face" style="font-size:${size * 0.5}px">${p.role.icon}</span>`;
      if (CG.Hover) CG.Hover.bind(t, () => playerInfo(p));
      layer.appendChild(t);
    });
  }
  function moveToken(i) {
    const t = $("#tok" + i);
    if (!t) return;
    const p = S.players[i];
    t.style.left = cellPctX(p.cell.c) + "%";
    t.style.top = cellPctY(p.cell.r) + "%";
  }

  // ---- standings --------------------------------------------------------
  function renderStandings() {
    const box = $("#standings");
    if (!box) return;
    box.innerHTML = "";
    // finishers float to the top in placing order; the rest sort by how close
    // they are to the centre (smaller distance = nearer home).
    const order = S.players.map((p, i) => ({ p, i })).sort((a, b) => {
      if (a.p.finished && b.p.finished) return a.p.rank - b.p.rank;
      if (a.p.finished) return -1;
      if (b.p.finished) return 1;
      return distOf(a.p.cell) - distOf(b.p.cell);
    });
    order.forEach(({ p, i }) => {
      const card = el("div", "scard" + (i === S.current && !S.over ? " active" : "") + (p.finished ? " done" : ""));
      card.style.setProperty("--tok", p.color);
      let loot = `<span>⭐ ${p.points}</span>`;
      if (p.trophies) loot += `<span>🏆${p.trophies > 1 ? "×" + p.trophies : ""}</span>`;
      if (p.diamonds) loot += `<span>💎${p.diamonds > 1 ? "×" + p.diamonds : ""}</span>`;
      const posCell = p.finished ? (MEDALS[p.rank - 1] || "#" + p.rank) : "🧭 " + distOf(p.cell);
      card.innerHTML =
        `<span class="savatar" style="--tok:${p.color}">${p.role.icon}</span>` +
        `<span class="sinfo"><b>${esc(p.name)}</b><small>${esc(p.role.name)}</small><span class="sloot">${loot}</span></span>` +
        `<span class="spos" title="${p.finished ? "Finishing place" : "Corridors to the centre"}">${posCell}</span>`;
      if (CG.Hover) CG.Hover.bind(card, () => playerInfo(p));
      box.appendChild(card);
    });
    box.appendChild(quintPanel());
  }

  function quintPanel() {
    const panel = el("div", "quint-panel");
    let chips = "";
    CG.QUINTET.forEach((q) => {
      const lvl = S.quintet[q.key] || 0;
      chips +=
        `<span class="qchip${lvl > 0 ? " on" : lvl < 0 ? " neg" : ""}" data-q="${q.key}" title="${q.name}: ${q.blurb}">` +
          `<span class="q-ic">${q.icon}</span><span class="q-lv">${lvl}</span></span>`;
    });
    panel.innerHTML = `<div class="quint-label">UN 2.0 Quintet of Change</div><div class="quint-row">${chips}</div>`;
    return panel;
  }

  function pips(v) {
    const map = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
    const on = new Set(map[v] || []);
    let html = "";
    for (let i = 0; i < 9; i++) html += `<i class="pip${on.has(i) ? " on" : ""}"></i>`;
    return html;
  }

  // ---- fx ---------------------------------------------------------------
  function toast(msg, kind) {
    const area = $("#toasts");
    if (!area) return;
    const t = el("div", "toast " + (kind || ""), msg);
    area.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 350); }, 2600);
    while (area.children.length > 4) area.removeChild(area.firstChild);
  }
  function burst(cell, kind, count) {
    const fx = $("#fx");
    if (!fx) return;
    count = count || 14;
    for (let i = 0; i < count; i++) {
      const p = el("div", "particle " + kind);
      p.style.left = cellPctX(cell.c) + "%"; p.style.top = cellPctY(cell.r) + "%";
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
    if (!mazeBox) return;
    mazeBox.classList.remove("shake"); void mazeBox.offsetWidth; mazeBox.classList.add("shake");
    setTimeout(() => mazeBox.classList.remove("shake"), 500);
  }
  function setMoving(on) {
    const s = $(".board-screen");
    if (s) s.classList.toggle("moving", !!on);
  }
  function progress(p) { return Math.round((1 - distOf(p.cell) / S.maxDist) * 100); }

  // =======================================================================
  // TURN FLOW
  // =======================================================================
  function kickOff() { maybeAutoRoll(); }

  function setTurnTag() {
    const tt = $("#turnTag");
    const p = S.players[S.current];
    const label = S.settings.autoPlay
      ? (p.isAI ? esc(p.name) + " is moving…" : "Auto-playing…")
      : (p.isAI ? "Roll for " + esc(p.name) : "Your move");
    if (tt) tt.innerHTML = S.over ? "Mission complete" :
      `<span class="dot" style="background:${p.color}"></span>${label}`;
    const btn = $("#rollBtn");
    // In manual play the button is live for every seat (you click to roll even
    // for the AI); in auto-play it is disabled because the table rolls itself.
    if (btn) { btn.disabled = S.busy || S.over || S.settings.autoPlay; btn.classList.toggle("ai", p.isAI && !S.over && S.settings.autoPlay); }
  }
  // Roll the current seat automatically, but only while auto-play is on. With it
  // off, every seat (Human or AI) waits for the user to click Roll.
  function maybeAutoRoll() {
    if (S.over) return;
    setTurnTag();
    if (!S.settings.autoPlay) return;
    setTimeout(() => { if (!S.over && !S.busy && S.settings.autoPlay) onRoll(); }, 750);
  }

  async function onRoll() {
    if (S.busy || S.over) return;
    S.busy = true;
    const btn = $("#rollBtn"); if (btn) btn.disabled = true;
    const p = S.players[S.current];

    const value = rnd(1, 6);
    if (S.settings.music) CG.Audio.sfx.dice();
    await animateDice([value]);
    toast(`${p.name} rolls a ${value}`, "roll");

    setMoving(true);
    const reached = await stepThrough(p, value);
    if (reached) { setMoving(false); return playerFinishes(p); }
    await resolveLanding(p);
    setMoving(false);
    if (atCenter(p) && !p.finished) return playerFinishes(p);

    const again = p.bonusRoll; p.bonusRoll = false;
    if (again && !S.over) {
      if (S.settings.music) CG.Audio.sfx.doubles();
      toast(`${p.name} rolls again`, "good");
      S.busy = false;
      maybeAutoRoll();
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
      if (np.finished) continue;
      if (np.skipNext) { np.skipNext = false; toast(`${np.name} loses a turn`, "muted"); continue; }
      break;
    } while (++guard <= S.players.length * 2);
    renderStandings(); renderTokens();
    maybeAutoRoll();
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

  // the moves available from a cell: open passages, minus the one we came from,
  // unless this is a dead end (then we must turn back). Returns {r,c,dir}[].
  function movesFrom(p) {
    const nb = openNeighbors(p.cell);
    if (!p.prev) return nb;
    const fwd = nb.filter((n) => !(n.r === p.prev.r && n.c === p.prev.c));
    return fwd.length ? fwd : nb;
  }

  // walk exactly `steps` corridors. Corridors are forced; junctions are a
  // choice (human picks, AI mostly heads for the centre but sometimes wanders);
  // dead ends bounce you back. Stop early only if you reach the centre.
  async function stepThrough(p, steps) {
    const idx = S.players.indexOf(p);
    let reached = false;
    for (let s = 0; s < steps; s++) {
      const moves = movesFrom(p);
      if (!moves.length) break;                  // fully boxed in (cannot happen)
      let mv;
      if (moves.length === 1) mv = moves[0];
      else mv = await chooseDir(p, moves);
      p.prev = { r: p.cell.r, c: p.cell.c };
      p.cell = { r: mv.r, c: mv.c };
      moveToken(idx);
      if (S.settings.music) { CG.Audio.sfx.step(); CG.Audio.setProgress(progress(p)); }
      maybeSpeakZone(p);
      renderStandings();
      await sleep(225);
      if (atCenter(p)) { reached = true; break; }
    }
    renderTokens();
    return reached;
  }

  // the junction overlay: which passage to take.
  function chooseDir(p, moves) {
    return new Promise((resolve) => {
      if (p.isAI) {
        let pick;
        if (Math.random() < 0.62) {
          const best = Math.min.apply(null, moves.map((m) => S.dist[m.r][m.c]));
          const good = moves.filter((m) => S.dist[m.r][m.c] === best);
          pick = good[Math.floor(Math.random() * good.length)];
        } else pick = moves[Math.floor(Math.random() * moves.length)];
        setTimeout(() => resolve(pick), 360);
        return;
      }
      const over = el("div", "overlay-card show");
      const c = el("div", "event-card fork-card maze-junction");
      c.innerHTML =
        whoHtml(p) +
        `<div class="ec-band">A JUNCTION</div>` +
        `<div class="ec-icon">🧭</div>` +
        `<div class="ec-title">Which way?</div>` +
        `<div class="ec-why">The hedges branch. The fountain is at the centre, but the dice make you spend every step, so choose with care, or get gloriously lost.</div>`;
      const grid = el("div", "maze-dirs");
      moves.forEach((m) => {
        const b = el("button", "btn btn-ghost maze-dir");
        b.innerHTML = `<span class="md-arrow">${ARROW[m.dir]}</span><span class="md-name">${DIRNAME[m.dir]}</span>`;
        b.onclick = () => {
          over.classList.remove("show"); setTimeout(() => over.remove(), 200);
          CG.Audio.sfx.click(); resolve(m);
        };
        grid.appendChild(b);
      });
      c.appendChild(grid);
      over.appendChild(c);
      app().appendChild(over);
    });
  }

  // a forward dash toward the centre (diamond / lucky break)
  async function hopToward(p, k) {
    const idx = S.players.indexOf(p);
    for (let i = 0; i < k; i++) {
      if (atCenter(p)) break;
      const nb = openNeighbors(p.cell).filter((n) => distOf(n) < distOf(p.cell));
      if (!nb.length) break;
      const nx = nb[Math.floor(Math.random() * nb.length)];
      p.prev = { r: p.cell.r, c: p.cell.c };
      p.cell = { r: nx.r, c: nx.c };
      moveToken(idx);
      if (S.settings.music) { CG.Audio.sfx.step(); CG.Audio.setProgress(progress(p)); }
      renderStandings();
      await sleep(215);
    }
    renderTokens();
  }

  // a warp along a special's pre-computed exit (shortcut forward, trap back).
  async function warpTo(p, dest, kind) {
    const idx = S.players.indexOf(p);
    const t = $("#tok" + idx);
    if (t) t.classList.add("sliding");
    if (kind === "up") animateGate(idx);
    p.prev = null;
    p.cell = { r: dest.r, c: dest.c };
    moveToken(idx);
    burst(p.cell, kind, kind === "up" ? 18 : 14);
    await sleep(780);
    if (t) t.classList.remove("sliding");
    if (S.settings.music) CG.Audio.setProgress(progress(p));
    renderStandings(); renderTokens();
  }
  function animateGate() { /* reserved for future hedge flourish */ }

  function maybeSpeakZone(p) {
    if (p.isAI) return;
    const z = Math.min(3, Math.floor(progress(p) / 25));
    if (z > S.zoneSpoken) { S.zoneSpoken = z; CG.Narrate.auto(CG.MANDATE_STORY.zones[z]); }
  }

  // =======================================================================
  // LANDINGS
  // =======================================================================
  async function resolveLanding(p, depth) {
    depth = depth || 0;
    const sp = specialAt(p.cell);
    if (!sp) return;
    if (sp.kind === "shortcut") {
      const card = fillCard(weightedDraw(CG.LADDER_CARDS, p), p);
      const q = applyQuintet(p, card.tag, +1);
      await showCard(p, card, "shortcut", q);
      if (S.settings.music) CG.Audio.sfx.ladder();
      toast(`${p.name} follows a trail of golden coins`, "good");
      if (!p.isAI) toast(`${q.meta.icon} ${q.meta.name} strengthened`, "good");
      await warpTo(p, sp.to, "up");
    } else if (sp.kind === "trap") {
      const card = fillCard(weightedDraw(CG.SNAKE_CARDS, p), p);
      const q = applyQuintet(p, card.tag, -1);
      await showCard(p, card, "trap", q);
      if (S.settings.music) CG.Audio.sfx.snake();
      toast(`${p.name} gets lost in the hedges`, "bad");
      if (!p.isAI) toast(`${q.meta.icon} ${q.meta.name} set back`, "bad");
      shake();
      await warpTo(p, sp.to, "down");
    } else if (sp.kind === "trophy") {
      const card = fillCard(weightedDraw(CG.TROPHY_CARDS, p), p);
      p.trophies++; award(p, 5); p.bonusRoll = true;
      await showCard(p, card, "trophy", null);
      if (S.settings.music) CG.Audio.sfx.note();
      burst(p.cell, "up", 18);
      toast(`${p.name} collects a trophy 🏆`, "good");
    } else if (sp.kind === "diamond") {
      const card = fillCard(weightedDraw(CG.DIAMOND_CARDS, p), p);
      p.diamonds++; award(p, 4);
      await showCard(p, card, "diamond", null);
      if (S.settings.music) CG.Audio.sfx.note();
      burst(p.cell, "up", 18);
      toast(`${p.name} finds a diamond 💎`, "good");
      await hopToward(p, 3);
    } else if (sp.kind === "surprise") {
      const card = fillCard(weightedDraw(CG.SURPRISE_CARDS, p), p);
      await showCard(p, card, "surprise", null);
      await applySurprise(p, card, depth);
    } else if (sp.kind === "note") {
      const note = S.decks.note();
      if (S.settings.music) CG.Audio.sfx.note();
      await showNote(p, note);
    }
    renderStandings();
  }

  // every special cell of one kind, as {r,c}[]
  function specialsOfKind(kind) {
    const out = [];
    Object.keys(S.special).forEach((k) => {
      if (S.special[k].kind !== kind) return;
      const [r, c] = k.split(",").map(Number);
      out.push({ r, c });
    });
    return out;
  }
  // the nearest such cell that lies ahead of `fromDist`: toward=true means closer
  // to the centre (good news), toward=false means deeper into the hedges (bad).
  function nearestAhead(cells, fromDist, toward) {
    const cand = cells.filter((c) => toward ? distOf(c) < fromDist : distOf(c) > fromDist);
    if (!cand.length) return null;
    cand.sort((a, b) => Math.abs(distOf(a) - fromDist) - Math.abs(distOf(b) - fromDist));
    return cand[0];
  }

  // From time to time a surprise warps the player to the next landmark, picked by
  // the mood of the card: good news (anything but a "skip") follows a trail of
  // coins to the next shortcut, trophy or diamond toward the centre; bad news
  // drops them at the next trap deeper in the hedges, and once in a while sends
  // them right back to their gate. Returns true when it took over the surprise.
  async function surpriseJump(p, card, depth) {
    if (Math.random() >= 0.3) return false;             // just now and then
    const fromDist = distOf(p.cell);
    if (card.effect !== "skip") {                       // good news draws you in
      const opts = [
        { cell: nearestAhead(specialsOfKind("shortcut"), fromDist, true), msg: `A turn of luck sweeps ${p.name} to a trail of golden coins` },
        { cell: nearestAhead(specialsOfKind("trophy"), fromDist, true), msg: `Good news leads ${p.name} to the next trophy 🏆` },
        { cell: nearestAhead(specialsOfKind("diamond"), fromDist, true), msg: `Good news leads ${p.name} to the next diamond 💎` },
      ].filter((o) => o.cell);
      if (!opts.length) return false;
      const o = opts[Math.floor(Math.random() * opts.length)];
      toast(o.msg, "good");
      await warpTo(p, o.cell, "up");
      if (!atCenter(p) && depth < 2) await resolveLanding(p, depth + 1);
      return true;
    }
    // bad news: usually the next trap, occasionally right back to the gate
    if (Math.random() < 0.25) {
      toast(`Bad news sends ${p.name} right back to the gate`, "bad");
      shake();
      await warpTo(p, { r: p.entry.cell.r, c: p.entry.cell.c }, "down");
      return true;
    }
    const trap = nearestAhead(specialsOfKind("trap"), fromDist, false);
    if (!trap) return false;
    toast(`Bad news leaves ${p.name} lost at the next trap`, "bad");
    await warpTo(p, trap, "down");
    if (depth < 2) await resolveLanding(p, depth + 1);
    return true;
  }

  async function applySurprise(p, card, depth) {
    if (await surpriseJump(p, card, depth)) return;
    switch (card.effect) {
      case "bonus": p.bonusRoll = true; toast(`${p.name} earns a bonus roll`, "good"); break;
      case "skip": p.skipNext = true; toast(`${p.name} will lose a turn`, "bad"); break;
      case "gem": p.diamonds++; award(p, 4); burst(p.cell, "up", 14); toast(`${p.name} pockets a diamond 💎`, "good"); break;
      case "advance": toast(`${p.name} threads ahead`, "good"); await hopToward(p, 3); break;
      default: break;
    }
  }

  // =======================================================================
  // CARD OVERLAYS
  // =======================================================================
  const CONT = { shortcut: "Pocket them ▸", trap: "Lost again ▾", trophy: "Collect ▸", diamond: "Grab it ▸", surprise: "Open it ▸" };
  const BAND = { shortcut: "GOLDEN COINS", trap: "A TRAP", trophy: "A TROPHY", diamond: "A DIAMOND", surprise: "A SURPRISE" };

  function narrateCard(p, spoken, over, done, fallbackMs, cont) {
    const voiced = CG.Narrate.isEnabled() && CG.Narrate.supported();
    if (!S.settings.autoPlay) {
      // Manual play: every seat (Human or AI) waits for the user to click
      // Continue; hold it disabled while the narrator is still reading the line.
      if (cont && voiced) {
        cont.disabled = true;
        let freed = false;
        const free = () => { if (!freed) { freed = true; cont.disabled = false; } };
        CG.Narrate.auto(spoken, { onend: free });
        setTimeout(free, 20000);
      } else {
        CG.Narrate.auto(spoken);
      }
      return;
    }
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

  function showCard(p, card, kind, q) {
    return new Promise((resolve) => {
      const quintSpoken = q
        ? ` Your ${q.meta.name} capability ${q.dir > 0 ? "grows stronger" : "takes a hit"}.`
        : "";
      const text = `${card.why} ${card.fact}`;
      const spoken = `${card.title}. ${text}${quintSpoken}`;
      const over = el("div", "overlay-card");
      const c = el("div", `event-card ${kind === "shortcut" ? "ladder" : kind === "trap" ? "snake" : kind}`);
      const quintHtml = q
        ? `<div class="ec-quint ${q.dir > 0 ? "up" : "down"}">` +
            `<span class="eq-ic">${q.meta.icon}</span>` +
            `<span class="eq-txt"><b>${esc(q.meta.name)}</b> ${q.dir > 0 ? "strengthened" : "set back"}` +
            `<small>UN 2.0 Quintet of Change</small></span>` +
            `<span class="eq-delta">${q.dir > 0 ? "+1" : "−1"}</span>` +
          `</div>`
        : "";
      c.innerHTML =
        whoHtml(p) +
        `<div class="ec-band">${BAND[kind] || ""}</div>` +
        `<div class="ec-icon">${card.icon}</div>` +
        `<div class="ec-title">${esc(card.title)}</div>` +
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
      if (q) flashQuint(q.key, q.dir);
      requestAnimationFrame(() => over.classList.add("show"));
      narrateCard(p, spoken, over, done, 3300, cont);
    });
  }

  function showNote(p, note) {
    return new Promise((resolve) => {
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
      const done = () => { over.classList.remove("show"); setTimeout(() => over.remove(), 250); resolve(); };
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
  function playerFinishes(p) {
    if (p.finished) return;
    p.finished = true;
    S.finishedCount++;
    p.rank = S.finishedCount;
    award(p, 6);
    S.busy = false;
    setMoving(false);
    const isLast = S.players.every((x) => x.finished);
    if (S.settings.music) { CG.Audio.sfx.win(); CG.Audio.setProgress(100); }
    if (!p.isAI) confetti();
    burst(p.cell, "up", 22);
    renderStandings(); renderTokens(); setTurnTag();
    toast(`${p.name} reaches the centre · ${ordinal(p.rank)} home`, "good");
    showFinishCard(p, isLast, () => { if (isLast) return endGame(); endTurn(); });
  }

  function showFinishCard(p, isLast, done) {
    const spoken = `${p.name} reaches the centre of the maze, ${ordinal(p.rank)} of the field. The mission is accomplished here.`;
    const over = el("div", "overlay-card");
    const c = el("div", "event-card trophy");
    c.innerHTML =
      `<div class="ec-band">${ordinal(p.rank).toUpperCase()} HOME</div>` +
      `<div class="ec-icon">${MEDALS[p.rank - 1] || "🏁"}</div>` +
      `<div class="ec-title">${esc(p.name)} reaches the centre</div>` +
      `<div class="ec-why">${esc(p.role.name)} threads the last hedge and accomplishes the mission ${ordinal(p.rank)}.` +
        `${isLast ? " Every team is home now. The maze is solved." : " The rest of the field is still finding the way."}</div>`;
    const actions = el("div", "ec-actions");
    const cont = el("button", "btn btn-primary", isLast ? "Final standings ▸" : "Play on ▸");
    const fin = () => { over.classList.remove("show"); setTimeout(() => over.remove(), 250); done(); };
    cont.onclick = fin;
    actions.appendChild(cont);
    c.appendChild(actions);
    over.appendChild(c);
    app().appendChild(over);
    requestAnimationFrame(() => over.classList.add("show"));
    narrateCard(p, spoken, over, fin, 3000, cont);
  }

  // Crowning the table, the same spirit as The Long Road: first to the centre is
  // only one way to be remembered. Speed, Perseverance, and a champion for each
  // UN 2.0 capability pushed furthest. Uncrowned if there is no clear leader.
  function computeChampions() {
    const champs = [];
    const top = (valueOf) => {
      const best = Math.max.apply(null, S.players.map(valueOf));
      if (best <= 0) return null;
      return { best, who: S.players.filter((p) => valueOf(p) === best) };
    };

    const speed = S.players.find((p) => p.rank === 1);
    if (speed) champs.push({ icon: "🏃", title: "Speed", who: [speed], note: "first to the centre" });

    const pers = top((p) => p.points || 0);
    if (pers) champs.push({ icon: "💪", title: "Perseverance", who: pers.who, note: `the most points banked, ${pers.best}` });

    CG.QUINTET.forEach((q) => {
      const lead = top((p) => (p.contrib && p.contrib[q.key]) || 0);
      if (lead) champs.push({ icon: q.icon, title: q.name, who: lead.who, note: `pushed ${q.name} furthest, +${lead.best}` });
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
    return `<div class="champ-head">Champions of the Maze</div><div class="champ-list">${rows}</div>`;
  }

  function championsLine(champs) {
    if (!champs.length) return "";
    const parts = champs.map((c) => `${c.who.map((p) => p.name).join(" and ")}, ${c.title} champion`);
    return ` And the champions of the maze: ${parts.join("; ")}.`;
  }

  function endGame() {
    S.over = true; S.busy = false;
    setMoving(false);
    renderStandings(); renderTokens(); setTurnTag();
    const order = S.players.slice().sort((a, b) => a.rank - b.rank);
    const winner = order[0];
    const human = S.players.find((x) => !x.isAI);
    if (S.settings.music) { CG.Audio.sfx.win(); CG.Audio.setProgress(100); }
    if (human && human.rank === 1) confetti();

    let line;
    if (human && human.rank === 1) line = CG.MANDATE_STORY.winYou;
    else if (human) line = `${winner.name} reaches the centre first; ${human.name === "You" ? "you finish" : human.name + " finishes"} ${ordinal(human.rank)}. Every team found the way in the end.`;
    else line = `${winner.name} ${CG.MANDATE_STORY.winOther}`;
    const built = CG.QUINTET.filter((q) => (S.quintet[q.key] || 0) > 0).map((q) => q.name);
    if (built.length) line += ` The table's strongest capabilities of the UN 2.0 Quintet: ${built.join(", ")}.`;
    const champs = computeChampions();
    const spoken = line + championsLine(champs);
    CG.Narrate.auto(spoken);

    const over = el("div", "overlay-card show");
    const c = el("div", "event-card win");
    c.innerHTML =
      `<div class="ec-band">THE MAZE IS SOLVED</div>` +
      `<div class="ec-icon">🏁</div>` +
      `<div class="ec-title">The whole table reaches the centre</div>` +
      championsHtml(champs) +
      `<div class="ec-why">${esc(line)}</div>`;
    const actions = el("div", "ec-actions");
    const again = el("button", "btn btn-primary", "Run a new maze ▸");
    again.onclick = () => { over.remove(); CG.Narrate.stop(); renderTitle(); };
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
    const cols = ["#2f9e54", "#2f6bff", "#ffce5a", "#7c4dff", "#e8439b"];
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

  // ---- public API -------------------------------------------------------
  CG.MandateGame = {
    title: "Common Ground: The Mandate",
    show: function () { ensureDecks(); teardown(); renderTitle(); },
  };
})();
