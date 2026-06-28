/* =========================================================================
 * COMMON GROUND, THE MANDATE,  mandate.js
 * The second game on the platform, in the spirit of the Game of Life. You
 * travel a winding road of squares, but you do not only race: you make choices
 * and build a legacy. Three resources travel with each player (Funding, Trust,
 * Capacity) and the whole table shares the UN 2.0 Quintet of Change, exactly as
 * in The Long Road. The HIGHEST LEGACY completes the mandate, so the fastest
 * finish is not always the winning one.
 *
 * Vanilla JS, no framework, no build step. All flavour text lives in
 * data/content.js; this file is mechanics + DOM only. The road, the nodes, the
 * spinner and the tokens are all CSS and inline SVG, no external images, and
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

  // ---- layout constants --------------------------------------------------
  const ROWS = 5;             // the road winds down in five rows
  const PER = 7;              // squares per row (boustrophedon)
  const SPINE = ROWS * PER;   // 35 squares on the main spine
  const XL = 8, XR = 92;      // horizontal margins, percent
  const NS = "http://www.w3.org/2000/svg";

  // ---- the UN 2.0 Quintet (shared team tally) ---------------------------
  function newQuintet() {
    const q = {};
    CG.QUINTET.forEach((c) => (q[c.key] = 0));
    return q;
  }
  // Resolve which capability a card touches, and in which direction, WITHOUT
  // mutating, so the very same result can be shown on the card and then applied.
  // Explicit eff.quintet wins; otherwise it is inferred from the card's tag,
  // and a setback (defaultDir < 0) sets the capability back instead of building it.
  function resolveQuintet(eff, tag, defaultDir) {
    if (eff && eff.quintet) {
      const key = eff.quintet;
      return { key, meta: CG.quintetMeta(key), dir: eff.quintetDir || 1 };
    }
    if (tag) {
      const key = CG.quintetForTag(tag);
      return { key, meta: CG.quintetMeta(key), dir: defaultDir || 1 };
    }
    return null;
  }
  // Commit a resolved quintet nudge to the shared tally and the player, then
  // pulse its chip in the standings panel so the change never passes unseen.
  function commitQuintet(p, q) {
    if (!q) return null;
    S.quintet[q.key] = (S.quintet[q.key] || 0) + q.dir;
    if (p && p.contrib) p.contrib[q.key] = (p.contrib[q.key] || 0) + q.dir;
    q.level = S.quintet[q.key];
    return q;
  }
  function flashQuint(key, dir) {
    const chip = $('#standings [data-q="' + key + '"]');
    if (!chip) return;
    const cls = dir > 0 ? "pulse-up" : "pulse-down";
    chip.classList.remove(cls); void chip.offsetWidth; chip.classList.add(cls);
    setTimeout(() => chip.classList.remove(cls), 950);
  }
  // The UN 2.0 Quintet block shown on an event / resource card, so the player
  // sees which of the five capabilities a movement just strengthened or set back.
  function quintBlockHtml(q) {
    if (!q) return "";
    return `<div class="ec-quint ${q.dir > 0 ? "up" : "down"}">` +
        `<span class="eq-ic">${q.meta.icon}</span>` +
        `<span class="eq-txt"><b>${esc(q.meta.name)}</b> ${q.dir > 0 ? "strengthened" : "set back"}` +
          `<small>UN 2.0 Quintet of Change</small></span>` +
        `<span class="eq-delta">${q.dir > 0 ? "+1" : "−1"}</span>` +
      `</div>`;
  }

  // weighted, theatre-aware draw that avoids repeating the last card
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

  function fillText(s, p) {
    const role = p.role.name, theatre = (S.theatre && S.theatre.name) || "";
    return String(s).replace(/\{role\}/g, role).replace(/\{theatre\}/g, theatre);
  }

  // ---- state -------------------------------------------------------------
  const S = {
    players: [],
    current: 0,
    theatre: null,
    busy: false,
    over: false,
    settings: { music: true, voice: true },
    nodes: [],          // the road graph
    startId: 0,
    finishId: 0,
    finishDepth: 1,
    zoneSpoken: -1,
    finishedCount: 0,
    quintet: {},
    spinRot: 0,
    decks: {},
  };

  const COLORS = ["#2f9e54", "#2f6bff", "#e8439b", "#ef9f25"];
  const MEDALS = ["🥇", "🥈", "🥉", "🎖️"];
  const FINISH_BONUS = [10, 6, 3, 1];      // legacy bonus by finishing place
  function ordinal(n) {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  function legacy(p) {
    return (p.funding || 0) + (p.trust || 0) + (p.capacity || 0) +
           (p.milestones || 0) * 3 + (p.finishBonus || 0);
  }

  // Data shown in the shared hover card for one player.
  function playerInfo(p) {
    return {
      name: p.name, role: p.role.name, aff: p.role.aff, icon: p.role.icon, color: p.color,
      scoreLabel: "Legacy", score: legacy(p),
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

  let roadBox = null, roadSvg = null, resizeObs = null, relayoutHandler = null;
  let decksReady = false;

  function ensureDecks() {
    if (decksReady) return;
    S.decks.decision = makeDeck(CG.MANDATE_DECISIONS);
    S.decks.event = makeDeck(CG.MANDATE_EVENTS);
    S.decks.funding = makeDeck(CG.MANDATE_FUNDING);
    S.decks.trust = makeDeck(CG.MANDATE_TRUST);
    S.decks.capacity = makeDeck(CG.MANDATE_CAPACITY);
    S.decks.milestone = makeDeck(CG.MANDATE_MILESTONES);
    S.decks.note = makeDeck(CG.FIELD_NOTES);
    decksReady = true;
  }

  // =======================================================================
  // THE ROAD,  a fresh winding graph every game, with one real fork.
  // =======================================================================
  function rowY(r) { return 15 + r * (72 / (ROWS - 1)); }   // 15..87 percent

  function spinePos(i) {
    const r = Math.floor(i / PER), col = i % PER;
    const t = col / (PER - 1);
    const x = (r % 2 === 0) ? (XL + t * (XR - XL)) : (XR - t * (XR - XL));
    const y = rowY(r) + Math.sin(i * 1.27) * 1.6;   // gentle, tidy undulation
    return { x, y };
  }

  function generateRoad() {
    const nodes = [];
    for (let i = 0; i < SPINE; i++) {
      const pos = spinePos(i);
      nodes.push({ id: i, x: pos.x, y: pos.y, type: null, next: i < SPINE - 1 ? [i + 1] : [], depth: i, branch: false });
    }
    nodes[0].type = "start";
    nodes[SPINE - 1].type = "finish";

    // Forks: each replaces a same-row triple F..F+3 with a parallel high road.
    // Both routes are three hops, so finishing distance is identical and the
    // choice is purely which squares you pass. We bow the branch up into the
    // open space above the row. With a taller board there is room for two real
    // decision points, on different rows, so no two branches collide.
    const lift = Math.min(13, (72 / (ROWS - 1)) * 0.62);
    const interior = shuffle((function () { const a = []; for (let r = 1; r <= ROWS - 2; r++) a.push(r); return a; })());
    const forkRows = interior.slice(0, 2);      // up to two forks
    S.forks = [];
    let bid = SPINE;
    forkRows.forEach((r) => {
      const F = r * PER + rnd(0, PER - 4);      // F..F+3 stay inside the row
      const J = F + 3;
      const b1 = { id: bid, type: null, depth: nodes[F + 1].depth, branch: true,
                   x: nodes[F + 1].x, y: nodes[F + 1].y - lift, next: [bid + 1] };
      const b2 = { id: bid + 1, type: null, depth: nodes[F + 2].depth, branch: true,
                   x: nodes[F + 2].x, y: nodes[F + 2].y - lift, next: [J] };
      nodes.push(b1, b2);
      nodes[F].next = [F + 1, b1.id];           // route A (low) and route B (high)
      nodes[F].type = "fork";
      S.forks.push({ F, J, low: [F + 1, F + 2], high: [b1.id, b2.id] });
      bid += 2;
    });

    // Assign square types to every node that is not start / finish / fork.
    // The mix leans on the lively squares (crossroads, events, milestones) so a
    // longer road stays eventful rather than turning into a string of notes.
    const open = nodes.filter((n) => n.type == null).map((n) => n.id);
    const bag = [];
    const want = [
      ["crossroads", 7], ["milestone", 4], ["funding", 5],
      ["trust", 5], ["capacity", 5], ["event", 7], ["note", 3],
    ];
    want.forEach(([type, n]) => { for (let i = 0; i < n; i++) bag.push(type); });
    while (bag.length < open.length) bag.push("note");
    const deck = shuffle(bag).slice(0, open.length);
    open.forEach((id, k) => (nodes[id].type = deck[k]));

    // prevOf: first parent of each node, for backward moves.
    const prevOf = {};
    nodes.forEach((n) => n.next.forEach((c) => { if (prevOf[c] == null) prevOf[c] = n.id; }));
    S.prevOf = prevOf;

    S.nodes = nodes;
    S.startId = 0;
    S.finishId = SPINE - 1;
    S.finishDepth = nodes[SPINE - 1].depth;
    return nodes;
  }

  const node = (id) => S.nodes[id];

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
      "A journey of choices for a UN Country Team, in the spirit of the Game of Life. Spin the wheel, travel a winding road, and at every fork decide what you value: speed or trust, funding or independence, your logo or the result. Build funding, trust and local capacity. The richest legacy completes the mandate, not the fastest finish."));

    const legend = el("div", "mandate-legend");
    legend.innerHTML =
      CG.MANDATE_RESOURCES.map((r) =>
        `<span class="ml-chip"><span class="ml-ic">${r.icon}</span><b>${r.name}</b><small>${r.blurb}</small></span>`).join("");
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
      intro: "Choose who takes each seat. Pick Human and name yourself; pick AI and a rival coordinator joins the field. Two to four play.",
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
    generateRoad();
    const roles = shuffle(CG.ROLES);
    S.players = roster.map((seat, i) => ({
      name: seat.name,
      isAI: seat.isAI,
      role: roles[i % roles.length],
      node: S.startId,
      color: COLORS[i % COLORS.length],
      funding: 0, trust: 0, capacity: 0, milestones: 0,
      finishBonus: 0,
      contrib: newQuintet(),   // this player's net push to each of the five capabilities
      bonusSpin: false,
      skipNext: false,
      finished: false,
      rank: 0,
    }));
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
        `<div class="deal-text">${p.role.tag}</div>`;
      row.appendChild(c);
    });
    wrap.appendChild(row);

    const go = el("button", "btn btn-primary big", "Begin the Mandate ▸");
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
    roadBox = null; roadSvg = null;
  }

  function renderBoard() {
    teardown();
    const root = app();
    root.innerHTML = "";
    const wrap = el("div", "screen board-screen mandate-screen");
    wrap.appendChild(el("div", "bg-layer mandate-bg"));

    const bar = el("header", "hud-top");
    bar.innerHTML = `<div class="brand">◆ <b>Common Ground</b><span> · The Mandate</span></div>`;
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
    roadBox = el("div", "board-box road"); roadBox.id = "roadBox";
    roadSvg = document.createElementNS(NS, "svg");
    roadSvg.setAttribute("class", "road-svg");
    roadBox.appendChild(roadSvg);
    const nodeLayer = el("div", "node-layer"); nodeLayer.id = "nodeLayer"; roadBox.appendChild(nodeLayer);
    const fx = el("div", "fx"); fx.id = "fx"; roadBox.appendChild(fx);
    const tokens = el("div", "token-layer"); tokens.id = "tokens"; roadBox.appendChild(tokens);
    stage.appendChild(roadBox);
    wrap.appendChild(stage);

    // the spinner dock
    const dock = el("div", "dice-dock spin-dock"); dock.id = "dock";
    const tag = el("div", "turn-tag"); tag.id = "turnTag"; tag.innerHTML = "Your move";
    const spinnerWrap = el("div", "spinner");
    spinnerWrap.innerHTML = `<div class="spin-ptr"></div>` + buildWheel();
    const btn = el("button", "btn btn-roll", "🌀 Spin"); btn.id = "spinBtn"; btn.onclick = onSpin;
    dock.appendChild(tag); dock.appendChild(spinnerWrap); dock.appendChild(btn);
    wrap.appendChild(dock);

    const toasts = el("div", "toast-area"); toasts.id = "toasts"; wrap.appendChild(toasts);
    wrap.appendChild(el("div", "board-credit", "Designed by <b>Digital Solutions Lab</b>"));
    root.appendChild(wrap);

    renderStandings();
    relayout();
    relayoutHandler = () => relayout();
    window.addEventListener("resize", relayoutHandler);
    try { resizeObs = new ResizeObserver(() => relayout()); resizeObs.observe(roadBox); }
    catch (e) { /* window resize still covers it */ }
  }

  function relayout() {
    if (!roadBox) return;
    drawRoad();
    renderNodes();
    renderTokens();
  }

  // ---- the spinning wheel (1..6) ----------------------------------------
  const WHEEL_COLORS = ["#2f9e54", "#2f6bff", "#7c4dff", "#e8439b", "#ef9f25", "#11aecb"];
  function wheelPt(cx, cy, r, deg) {
    const a = (deg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }
  function buildWheel() {
    const C = 50, R = 47;
    let inner = "";
    for (let i = 0; i < 6; i++) {
      const a0 = i * 60, a1 = a0 + 60;
      const p0 = wheelPt(C, C, R, a0), p1 = wheelPt(C, C, R, a1);
      inner += `<path d="M ${C} ${C} L ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${R} ${R} 0 0 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Z" fill="${WHEEL_COLORS[i]}" stroke="#fff" stroke-width="1"/>`;
      const tp = wheelPt(C, C, R * 0.64, a0 + 30);
      inner += `<text x="${tp.x.toFixed(2)}" y="${tp.y.toFixed(2)}" fill="#fff" font-size="15" font-weight="800" font-family="Space Grotesk, sans-serif" text-anchor="middle" dominant-baseline="central">${i + 1}</text>`;
    }
    return `<svg class="wheel" id="wheel" viewBox="0 0 100 100">${inner}` +
      `<circle cx="50" cy="50" r="9" fill="#fff" stroke="#d7e0ee" stroke-width="1.5"/>` +
      `<circle cx="50" cy="50" r="3.4" fill="#2a4366"/></svg>`;
  }

  async function spinWheel(value) {
    const wheel = $("#wheel");
    if (!wheel) { await sleep(200); return; }
    const sectorCenter = (value - 1) * 60 + 30;
    const jitter = (Math.random() - 0.5) * 36;           // stays inside the sector
    const target = (360 - sectorCenter + jitter);
    let next = S.spinRot + 360 * 5;
    next += ((target - (next % 360)) % 360 + 360) % 360; // land on the value
    S.spinRot = next;
    wheel.style.transition = "transform 1.15s cubic-bezier(.17,.67,.2,1)";
    wheel.style.transform = `rotate(${next}deg)`;
    await sleep(1230);
  }

  // ---- draw the road ----------------------------------------------------
  function px(id, bw, bh) { const n = node(id); return { x: n.x / 100 * bw, y: n.y / 100 * bh }; }

  // Catmull-Rom through points -> a smooth bezier path string.
  function spline(pts) {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }

  function drawRoad() {
    if (!roadBox || !roadSvg) return;
    const bw = roadBox.clientWidth, bh = roadBox.clientHeight;
    if (!bw || !bh) return;
    const unit = Math.min(bw, bh);
    const roadW = Math.max(14, unit * 0.052);
    roadSvg.setAttribute("viewBox", `0 0 ${bw} ${bh}`);

    // the main spine, then each high-road branch.
    const mainPts = [];
    for (let i = 0; i < SPINE; i++) mainPts.push(px(i, bw, bh));
    const branches = (S.forks || []).map((f) =>
      spline([px(f.F, bw, bh), px(f.high[0], bw, bh), px(f.high[1], bw, bh), px(f.J, bw, bh)]));

    const path = (d, cls, w) => `<path d="${d}" class="${cls}" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="${w}"/>`;
    const dMain = spline(mainPts);
    const bw78 = roadW * 0.78;
    let svg = path(dMain, "road-shadow", roadW + 6);
    branches.forEach((d) => { svg += path(d, "road-shadow", bw78 + 6); });
    branches.forEach((d) => { svg += path(d, "road-fill alt", bw78); });
    svg += path(dMain, "road-fill", roadW);
    branches.forEach((d) => { svg += path(d, "road-dash", Math.max(1.5, roadW * 0.07)); });
    svg += path(dMain, "road-dash", Math.max(1.6, roadW * 0.08));
    roadSvg.innerHTML = svg;
  }

  // ---- nodes ------------------------------------------------------------
  const NODE_ICON = {
    start: "🚩", finish: "🏁", crossroads: "⚖️", milestone: "⭐",
    funding: "💰", trust: "🤝", capacity: "👥", event: "⚡", note: "★", fork: "⑂",
  };
  const NODE_LABEL = { start: "Day One", finish: "Handover", crossroads: "Crossroads", milestone: "Milestone", fork: "The road forks" };

  // Stations are deliberately a touch smaller than the pawns, so the player
  // pieces always read as the foreground and the tiles as the board beneath.
  function nodeSize() {
    if (!roadBox) return 26;
    return Math.max(19, Math.min(roadBox.clientWidth, roadBox.clientHeight) * 0.062);
  }

  function renderNodes() {
    const layer = $("#nodeLayer");
    if (!layer) return;
    layer.innerHTML = "";
    const size = nodeSize();
    S.nodes.forEach((n) => {
      const d = el("div", "mnode mn-" + n.type + (n.branch ? " branch" : ""));
      d.style.width = size + "px"; d.style.height = size + "px";
      d.style.left = n.x + "%"; d.style.top = n.y + "%";
      d.style.fontSize = (size * 0.46) + "px";
      d.innerHTML = `<span class="mn-ic">${NODE_ICON[n.type] || ""}</span>`;
      if (NODE_LABEL[n.type] && !n.branch) {
        const lab = el("span", "mn-label", NODE_LABEL[n.type]);
        lab.style.fontSize = Math.max(8, size * 0.26) + "px";
        d.appendChild(lab);
      }
      layer.appendChild(d);
    });
  }

  // ---- tokens -----------------------------------------------------------
  function tokenSize() {
    if (!roadBox) return 32;
    return Math.max(24, Math.min(roadBox.clientWidth, roadBox.clientHeight) * 0.082);
  }
  function renderTokens() {
    const layer = $("#tokens");
    if (!layer) return;
    layer.innerHTML = "";
    const size = tokenSize();
    const byNode = {};
    S.players.forEach((p, i) => (byNode[p.node] = byNode[p.node] || []).push(i));
    S.players.forEach((p, i) => {
      const n = node(p.node);
      const group = byNode[p.node];
      const k = group.indexOf(i);
      const spread = group.length > 1 ? (k - (group.length - 1) / 2) * (size * 0.52) : 0;
      const t = el("div", "token" + (i === S.current && !S.over ? " active" : "") + (p.finished ? " done" : ""));
      t.id = "tok" + i;
      t.style.setProperty("--tok", p.color);
      t.style.width = size + "px"; t.style.height = size + "px";
      t.style.left = `calc(${n.x}% + ${spread}px)`;
      t.style.top = n.y + "%";
      t.innerHTML = `<span class="tok-face" style="font-size:${size * 0.5}px">${p.role.icon}</span>`;
      if (CG.Hover) CG.Hover.bind(t, () => playerInfo(p));
      layer.appendChild(t);
    });
  }
  function moveTokenTo(i, id) {
    const t = $("#tok" + i);
    if (!t) return;
    const n = node(id);
    t.style.left = n.x + "%";
    t.style.top = n.y + "%";
  }

  // ---- standings (ranked by legacy) -------------------------------------
  function renderStandings() {
    const box = $("#standings");
    if (!box) return;
    box.innerHTML = "";
    const order = S.players.map((p, i) => ({ p, i }))
      .sort((a, b) => legacy(b.p) - legacy(a.p) || (a.p.rank || 9) - (b.p.rank || 9));
    order.forEach(({ p, i }) => {
      const card = el("div", "scard" + (i === S.current && !S.over ? " active" : "") + (p.finished ? " done" : ""));
      card.style.setProperty("--tok", p.color);
      const res =
        `<span class="sres"><span>💰${p.funding}</span><span>🤝${p.trust}</span><span>👥${p.capacity}</span>` +
        (p.milestones ? `<span>⭐${p.milestones}</span>` : "") + `</span>`;
      card.innerHTML =
        `<span class="savatar" style="--tok:${p.color}">${p.role.icon}</span>` +
        `<span class="sinfo"><b>${esc(p.name)}</b><small>${esc(p.role.name)}</small>${res}</span>` +
        `<span class="spos" title="Legacy score">${p.finished ? "🏁 " : ""}${legacy(p)}</span>`;
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
  function burst(id, kind, count) {
    const fx = $("#fx");
    if (!fx) return;
    const n = node(id);
    count = count || 14;
    for (let i = 0; i < count; i++) {
      const p = el("div", "particle " + kind);
      p.style.left = n.x + "%"; p.style.top = n.y + "%";
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
    if (!roadBox) return;
    roadBox.classList.remove("shake"); void roadBox.offsetWidth; roadBox.classList.add("shake");
    setTimeout(() => roadBox.classList.remove("shake"), 500);
  }
  function setMoving(on) {
    const s = $(".board-screen");
    if (s) s.classList.toggle("moving", !!on);
  }

  // =======================================================================
  // TURN FLOW
  // =======================================================================
  function kickOff() { setTurnTag(); if (S.players[S.current].isAI) scheduleAI(); }

  function setTurnTag() {
    const tt = $("#turnTag");
    const p = S.players[S.current];
    if (tt) tt.innerHTML = S.over ? "Mandate complete" :
      `<span class="dot" style="background:${p.color}"></span>${p.isAI ? esc(p.name) + " is moving…" : "Your move"}`;
    const btn = $("#spinBtn");
    if (btn) { btn.disabled = S.busy || S.over || p.isAI; btn.classList.toggle("ai", p.isAI && !S.over); }
  }
  function scheduleAI() {
    if (S.over) return;
    setTurnTag();
    setTimeout(() => { if (!S.over && S.players[S.current].isAI) onSpin(); }, 850);
  }

  async function onSpin() {
    if (S.busy || S.over) return;
    S.busy = true;
    const btn = $("#spinBtn"); if (btn) btn.disabled = true;
    const p = S.players[S.current];

    const value = rnd(1, 6);
    if (S.settings.music) CG.Audio.sfx.dice();
    await spinWheel(value);
    toast(`${p.name} spins a ${value}`, "roll");

    setMoving(true);
    await walk(p, value);
    await resolveLanding(p, 0);
    setMoving(false);

    if (node(p.node).type === "finish" && !p.finished) return playerFinishes(p);

    if (p.bonusSpin && !S.over) {
      p.bonusSpin = false;
      if (S.settings.music) CG.Audio.sfx.doubles();
      toast(`${p.name} spins again`, "good");
      S.busy = false; setTurnTag();
      if (p.isAI) scheduleAI();
      return;
    }
    p.bonusSpin = false;
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
    renderStandings(); renderTokens(); setTurnTag();
    if (!S.over && S.players[S.current].isAI) scheduleAI();
  }

  // walk N squares along the graph, pausing at the fork to choose a route.
  async function walk(p, steps) {
    const idx = S.players.indexOf(p);
    let remaining = steps;
    while (remaining > 0) {
      const n = node(p.node);
      if (!n.next || n.next.length === 0) break;          // already home
      let nextId = n.next[0];
      if (n.next.length > 1) nextId = await chooseFork(p, n.next);
      p.node = nextId;
      moveTokenTo(idx, nextId);
      if (S.settings.music) { CG.Audio.sfx.step(); CG.Audio.setProgress(progress(p)); }
      maybeSpeakZone(p);
      renderStandings();
      await sleep(240);
      remaining--;
      if (node(nextId).type === "finish") break;
    }
    renderTokens();
  }

  function progress(p) { return Math.round(node(p.node).depth / S.finishDepth * 100); }

  function maybeSpeakZone(p) {
    if (p.isAI) return;
    const z = Math.min(3, Math.floor(node(p.node).depth / (S.finishDepth / 4 + 0.001)));
    if (z > S.zoneSpoken) { S.zoneSpoken = z; CG.Narrate.auto(CG.MANDATE_STORY.zones[z]); }
  }

  function chooseFork(p, nexts) {
    return new Promise((resolve) => {
      if (p.isAI) { setTimeout(() => resolve(nexts[Math.floor(Math.random() * nexts.length)]), 420); return; }
      const over = el("div", "overlay-card show");
      const c = el("div", "event-card fork-card");
      c.innerHTML =
        whoHtml(p) +
        `<div class="ec-band">THE ROAD FORKS</div>` +
        `<div class="ec-icon">⑂</div>` +
        `<div class="ec-title">Which way?</div>` +
        `<div class="ec-why">Two roads, the same distance, different squares ahead. Trust your instinct.</div>`;
      const actions = el("div", "ec-actions");
      const hi = el("button", "btn btn-primary", "↑ The high road");
      const lo = el("button", "btn btn-ghost", "↓ The main road");
      const pick = (id) => { over.classList.remove("show"); setTimeout(() => over.remove(), 220); CG.Audio.sfx.click(); resolve(id); };
      hi.onclick = () => pick(nexts[1]);
      lo.onclick = () => pick(nexts[0]);
      actions.appendChild(hi); actions.appendChild(lo);
      c.appendChild(actions);
      over.appendChild(c);
      app().appendChild(over);
    });
  }

  // a forward / backward hop driven by a card's move effect
  async function hop(p, n) {
    const idx = S.players.indexOf(p);
    const back = n < 0;
    let steps = Math.abs(n);
    while (steps-- > 0) {
      const cur = node(p.node);
      const nid = back ? S.prevOf[p.node] : (cur.next && cur.next[0]);
      if (nid == null) break;
      p.node = nid;
      moveTokenTo(idx, nid);
      if (S.settings.music) { CG.Audio.sfx.step(); CG.Audio.setProgress(progress(p)); }
      renderStandings();
      await sleep(220);
      if (!back && node(nid).type === "finish") break;
    }
    renderTokens();
  }

  // =======================================================================
  // LANDINGS
  // =======================================================================
  async function resolveLanding(p, depth) {
    const t = node(p.node).type;
    const tags = (S.theatre && S.theatre.tags) || [];
    if (t === "funding" || t === "trust" || t === "capacity") {
      const deck = S.decks[t];
      const card = deck();
      const q = resolveQuintet(card.eff, card.tag, 1);
      await showResourceCard(p, card, t, q);
      if (S.settings.music) CG.Audio.sfx.note();
      await applyEffects(p, card.eff, card.tag, null, q);
    } else if (t === "milestone") {
      const card = S.decks.milestone();
      p.milestones++;
      p.bonusSpin = true;
      await showMilestoneCard(p, card);
      if (S.settings.music) CG.Audio.sfx.ladder();
      burst(p.node, "up", 20);
      toast(`${p.name} reaches a milestone ⭐`, "good");
    } else if (t === "event") {
      const card = weightedDraw(CG.MANDATE_EVENTS, tags);
      const q = resolveQuintet(card.eff, card.tag, card.kind === "bad" ? -1 : 1);
      await showEventCard(p, card, q);
      if (S.settings.music) (card.kind === "bad" ? CG.Audio.sfx.snake : CG.Audio.sfx.ladder)();
      if (card.kind === "bad") shake();
      await applyEffects(p, card.eff, card.tag, null, q);
    } else if (t === "crossroads") {
      const card = weightedDraw(CG.MANDATE_DECISIONS, tags);
      const choice = await showDecision(p, card);
      if (S.settings.music) CG.Audio.sfx.pick();
      await applyEffects(p, choice.eff, card.tag, choice.label);
    } else if (t === "note") {
      const note = S.decks.note();
      if (S.settings.music) CG.Audio.sfx.note();
      await showNote(p, note);
    }
    renderStandings();
  }

  // apply a card / choice effect: resources, a Quintet nudge, then movement.
  async function applyEffects(p, eff, tag, choiceLabel, q) {
    if (!eff) return;
    const parts = [];
    ["funding", "trust", "capacity"].forEach((k) => {
      if (eff[k]) {
        p[k] = Math.max(0, (p[k] || 0) + eff[k]);
        const ic = { funding: "💰", trust: "🤝", capacity: "👥" }[k];
        parts.push(`${eff[k] > 0 ? "+" : ""}${eff[k]} ${ic}`);
      }
    });
    // Quintet of Change: use the result already shown on the card when given,
    // otherwise resolve one now (a building move, +1).
    if (q === undefined) q = resolveQuintet(eff, tag, 1);
    commitQuintet(p, q);
    if (parts.length) toast(`${p.name}: ${parts.join("  ")}`, parts.some((s) => s[0] === "-") ? "bad" : "good");
    renderStandings();
    if (q) {
      flashQuint(q.key, q.dir);
      if (!p.isAI) toast(`${q.meta.icon} ${q.meta.name} ${q.dir > 0 ? "strengthened" : "set back"}`, q.dir > 0 ? "good" : "bad");
    }
    if (eff.skip) { p.skipNext = true; toast(`${p.name} will lose a turn`, "muted"); }
    if (eff.bonus) { p.bonusSpin = true; toast(`${p.name} spins again`, "good"); }
    if (eff.move) {
      await sleep(220);
      toast(`${p.name} ${eff.move > 0 ? "moves ahead " + eff.move : "slips back " + Math.abs(eff.move)}`, eff.move > 0 ? "good" : "bad");
      await hop(p, eff.move);
    }
  }

  // =======================================================================
  // CARD OVERLAYS
  // =======================================================================
  function narrateCard(p, spoken, over, done, fallbackMs) {
    const voiced = CG.Narrate.isEnabled() && CG.Narrate.supported();
    if (!p.isAI) { CG.Narrate.auto(spoken); return; }
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

  const RES_META = {
    funding: { band: "FUNDING", cls: "funding", cont: "Bank it ▸" },
    trust: { band: "TRUST", cls: "trust", cont: "Earn it ▸" },
    capacity: { band: "CAPACITY", cls: "capacity", cont: "Build it ▸" },
  };

  // A short spoken aside naming the capability a card just moved, so narration
  // matches the on-card Quintet block (mirrors The Long Road's showCard).
  function quintSpoken(q) {
    return q ? ` Your ${q.meta.name} capability ${q.dir > 0 ? "grows stronger" : "takes a hit"}.` : "";
  }

  function showResourceCard(p, card, kind, q) {
    return new Promise((resolve) => {
      const m = RES_META[kind];
      const why = fillText(card.why, p), fact = fillText(card.fact, p);
      const spoken = `${card.title}. ${why} ${fact}${quintSpoken(q)}`;
      const over = el("div", "overlay-card");
      const c = el("div", `event-card ${m.cls}`);
      c.innerHTML =
        whoHtml(p) +
        `<div class="ec-band">${m.band}</div>` +
        `<div class="ec-icon">${card.icon}</div>` +
        `<div class="ec-title">${esc(card.title)}</div>` +
        effChips(card.eff) +
        `<div class="ec-why">${why}</div>` +
        `<div class="ec-fact"><span>Side fact</span>${fact}</div>` +
        quintBlockHtml(q);
      finishOverlay(c, over, kind, spoken, p, resolve, m.cont, why + " " + fact, 3000);
    });
  }

  function showMilestoneCard(p, card) {
    return new Promise((resolve) => {
      const why = fillText(card.why, p), fact = fillText(card.fact, p);
      const spoken = `Milestone. ${card.title}. ${why} ${fact}`;
      const over = el("div", "overlay-card");
      const c = el("div", "event-card milestone");
      c.innerHTML =
        whoHtml(p) +
        `<div class="ec-band">MILESTONE</div>` +
        `<div class="ec-icon">${card.icon}</div>` +
        `<div class="ec-title">${esc(card.title)}</div>` +
        `<div class="ec-move">+3 legacy · spin again</div>` +
        `<div class="ec-why">${why}</div>` +
        `<div class="ec-fact"><span>Side fact</span>${fact}</div>`;
      finishOverlay(c, over, "milestone", spoken, p, resolve, "Collect ▸", why + " " + fact, 3000);
    });
  }

  function showEventCard(p, card, q) {
    return new Promise((resolve) => {
      const spoken = `${card.title}. ${card.why} ${card.fact}${quintSpoken(q)}`;
      const over = el("div", "overlay-card");
      const c = el("div", `event-card ${card.kind === "bad" ? "snake" : "ladder"}`);
      c.innerHTML =
        whoHtml(p) +
        `<div class="ec-band">${card.kind === "bad" ? "A SETBACK" : "A BREAK"}</div>` +
        `<div class="ec-icon">${card.icon}</div>` +
        `<div class="ec-title">${esc(card.title)}</div>` +
        effChips(card.eff) +
        `<div class="ec-why">${card.why}</div>` +
        `<div class="ec-fact"><span>Side fact</span>${card.fact}</div>` +
        quintBlockHtml(q);
      finishOverlay(c, over, card.kind === "bad" ? "snake" : "ladder", spoken, p, resolve,
        card.kind === "bad" ? "Take the hit ▾" : "Ride it ▸", card.why + " " + card.fact, 3000);
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
      finishOverlay(c, over, "note", spoken, p, resolve, "Carry on ▸", note, 2600);
    });
  }

  // shared scaffolding: read-aloud + continue buttons, voice pacing for AI.
  function finishOverlay(c, over, kind, spoken, p, resolve, contLabel, readText, fallbackMs) {
    const actions = el("div", "ec-actions");
    const speak = el("button", "btn btn-ghost", "🔊 Read aloud");
    speak.onclick = () => CG.Narrate.speak(readText);
    const cont = el("button", "btn btn-primary", contLabel);
    const done = () => { over.classList.remove("show"); setTimeout(() => over.remove(), 250); resolve(); };
    cont.onclick = done;
    actions.appendChild(speak); actions.appendChild(cont);
    c.appendChild(actions);
    over.appendChild(c);
    app().appendChild(over);
    requestAnimationFrame(() => over.classList.add("show"));
    narrateCard(p, spoken, over, done, fallbackMs);
  }

  // the crossroads: a choice with consequences. Resolves to the chosen option.
  function showDecision(p, card) {
    return new Promise((resolve) => {
      const prompt = fillText(card.prompt, p);
      const spoken = `Crossroads. ${card.title}. ${prompt}`;
      const over = el("div", "overlay-card");
      const c = el("div", "event-card crossroads");
      c.innerHTML =
        whoHtml(p) +
        `<div class="ec-band">CROSSROADS</div>` +
        `<div class="ec-icon">${card.icon}</div>` +
        `<div class="ec-title">${esc(card.title)}</div>` +
        `<div class="ec-why">${prompt}</div>`;
      const opts = el("div", "ec-options");
      [card.a, card.b].forEach((opt) => {
        const b = el("button", "ec-opt");
        b.innerHTML =
          `<span class="eo-label">${esc(opt.label)}</span>` +
          `<span class="eo-detail">${esc(opt.detail)}</span>` +
          `<span class="eo-eff">${effChips(opt.eff, true)}</span>`;
        b.onclick = () => { over.classList.remove("show"); setTimeout(() => over.remove(), 220); resolve(opt); };
        opts.appendChild(b);
      });
      c.appendChild(opts);
      const actions = el("div", "ec-actions");
      const speak = el("button", "btn btn-ghost", "🔊 Read aloud");
      speak.onclick = () => CG.Narrate.speak(`${card.title}. ${prompt}`);
      actions.appendChild(speak);
      c.appendChild(actions);
      over.appendChild(c);
      app().appendChild(over);
      requestAnimationFrame(() => over.classList.add("show"));

      if (p.isAI) {
        CG.Narrate.auto(spoken);
        const score = (o) => (o.eff.funding || 0) + (o.eff.trust || 0) + (o.eff.capacity || 0) +
          (o.eff.move || 0) + (o.eff.bonus ? 2 : 0) - (o.eff.skip ? 2 : 0);
        const choice = score(card.b) > score(card.a) ? card.b
          : score(card.a) > score(card.b) ? card.a
          : (Math.random() < 0.5 ? card.a : card.b);
        setTimeout(() => {
          if (!over.parentNode) return;
          over.classList.remove("show"); setTimeout(() => over.remove(), 220); resolve(choice);
        }, CG.Narrate.isEnabled() && CG.Narrate.supported() ? 2600 : 1800);
      } else {
        CG.Narrate.auto(spoken);
      }
    });
  }

  // small +/- resource chips shown on a card or option
  function effChips(eff, inline) {
    if (!eff) return "";
    const map = { funding: "💰", trust: "🤝", capacity: "👥" };
    const chips = [];
    ["funding", "trust", "capacity"].forEach((k) => {
      if (eff[k]) chips.push(`<span class="ef ${eff[k] > 0 ? "up" : "down"}">${eff[k] > 0 ? "+" : ""}${eff[k]} ${map[k]}</span>`);
    });
    if (eff.move) chips.push(`<span class="ef ${eff.move > 0 ? "up" : "down"}">${eff.move > 0 ? "▲" : "▼"}${Math.abs(eff.move)}</span>`);
    if (eff.quintet) {
      const qm = CG.quintetMeta(eff.quintet), qd = eff.quintetDir || 1;
      chips.push(`<span class="ef ${qd > 0 ? "up" : "down"}" title="${esc(qm.name)} · UN 2.0 Quintet">${qm.icon} ${qd > 0 ? "+" : "−"}1</span>`);
    }
    if (eff.bonus) chips.push(`<span class="ef up">spin again</span>`);
    if (eff.skip) chips.push(`<span class="ef down">lose a turn</span>`);
    if (!chips.length) return "";
    return `<div class="ec-effs${inline ? " inline" : ""}">${chips.join("")}</div>`;
  }

  // =======================================================================
  // FINISH
  // =======================================================================
  function playerFinishes(p) {
    if (p.finished) return;
    p.finished = true;
    S.finishedCount++;
    p.rank = S.finishedCount;
    p.finishBonus = FINISH_BONUS[p.rank - 1] || 0;
    S.busy = false;
    setMoving(false);
    const isLast = S.players.every((x) => x.finished);
    if (S.settings.music) { CG.Audio.sfx.win(); CG.Audio.setProgress(100); }
    burst(p.node, "up", 22);
    renderStandings(); renderTokens(); setTurnTag();
    toast(`${p.name} reaches the handover · ${ordinal(p.rank)} home (+${p.finishBonus} legacy)`, "good");
    showFinishCard(p, isLast, () => { if (isLast) return endGame(); endTurn(); });
  }

  function showFinishCard(p, isLast, done) {
    const spoken = `${p.name} reaches the handover, ${ordinal(p.rank)} of the field, with a finishing bonus of ${p.finishBonus} to their legacy.`;
    const over = el("div", "overlay-card");
    const c = el("div", "event-card milestone");
    c.innerHTML =
      `<div class="ec-band">${ordinal(p.rank).toUpperCase()} HOME</div>` +
      `<div class="ec-icon">${MEDALS[p.rank - 1] || "🏁"}</div>` +
      `<div class="ec-title">${esc(p.name)} reaches the handover</div>` +
      `<div class="ec-move">+${p.finishBonus} legacy · total ${legacy(p)}</div>` +
      `<div class="ec-why">${esc(p.role.name)} completes the journey ${ordinal(p.rank)}.` +
        `${isLast ? " Every team is home now. Time to count the legacy." : " The race for legacy plays on."}</div>`;
    const actions = el("div", "ec-actions");
    const cont = el("button", "btn btn-primary", isLast ? "Final legacy ▸" : "Play on ▸");
    const fin = () => { over.classList.remove("show"); setTimeout(() => over.remove(), 250); done(); };
    cont.onclick = fin;
    actions.appendChild(cont);
    c.appendChild(actions);
    over.appendChild(c);
    app().appendChild(over);
    requestAnimationFrame(() => over.classList.add("show"));
    narrateCard(p, spoken, over, fin, 3000);
  }

  // Crowning the table, the same spirit as The Long Road: finishing first is
  // only one way to be remembered. We hand out a champion for each kind of
  // greatness, Speed (first to the handover), Legacy (the deepest legacy
  // banked), and one for each UN 2.0 capability the player pushed furthest. A
  // category with no clear leader is simply left uncrowned; positive ties share.
  function computeChampions() {
    const champs = [];
    const top = (valueOf) => {
      const best = Math.max.apply(null, S.players.map(valueOf));
      if (best <= 0) return null;
      return { best, who: S.players.filter((p) => valueOf(p) === best) };
    };

    const speed = S.players.find((p) => p.rank === 1);
    if (speed) champs.push({ icon: "🏃", title: "Speed", who: [speed], note: "first to the handover" });

    const leg = top((p) => legacy(p));
    if (leg) champs.push({ icon: "🏛️", title: "Legacy", who: leg.who, note: `the deepest legacy, ${leg.best}` });

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
    return `<div class="champ-head">Champions of the Mandate</div><div class="champ-list">${rows}</div>`;
  }

  function championsLine(champs) {
    if (!champs.length) return "";
    const parts = champs.map((c) => `${c.who.map((p) => p.name).join(" and ")}, ${c.title} champion`);
    return ` And the champions of the mandate: ${parts.join("; ")}.`;
  }

  function endGame() {
    S.over = true; S.busy = false;
    setMoving(false);
    renderStandings(); renderTokens(); setTurnTag();
    const order = S.players.slice().sort((a, b) => legacy(b) - legacy(a) || a.rank - b.rank);
    const winner = order[0];
    const human = S.players.find((x) => !x.isAI);
    if (S.settings.music) { CG.Audio.sfx.win(); CG.Audio.setProgress(100); }
    if (human && winner === human) confetti();

    let line;
    if (human && winner === human) line = CG.MANDATE_STORY.winYou;
    else line = `${winner.name} ${CG.MANDATE_STORY.winOther}`;
    const built = CG.QUINTET.filter((q) => (S.quintet[q.key] || 0) > 0).map((q) => q.name);
    if (built.length) line += ` The table's strongest capabilities of the UN 2.0 Quintet: ${built.join(", ")}.`;
    const champs = computeChampions();
    CG.Narrate.auto(line + championsLine(champs));

    let rows = "";
    order.forEach((p, i) => {
      rows +=
        `<div class="final-row">` +
          `<span class="final-medal">${MEDALS[i] || "#" + (i + 1)}</span>` +
          `<span class="final-name" style="color:${p.color}">${esc(p.name)}</span>` +
          `<span class="final-role">💰${p.funding} 🤝${p.trust} 👥${p.capacity}${p.milestones ? " ⭐" + p.milestones : ""}</span>` +
          `<span class="final-loot"><b>${legacy(p)}</b></span>` +
        `</div>`;
    });

    const over = el("div", "overlay-card show");
    const c = el("div", "event-card win");
    c.innerHTML =
      `<div class="ec-band">FINAL LEGACY</div>` +
      `<div class="ec-icon">🏛️</div>` +
      `<div class="ec-title">${esc(winner.name)} leaves the deepest legacy</div>` +
      `<div class="final-list">${rows}</div>` +
      championsHtml(champs) +
      `<div class="ec-why">${esc(line)}</div>`;
    const actions = el("div", "ec-actions");
    const again = el("button", "btn btn-primary", "Run it again ▸");
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
