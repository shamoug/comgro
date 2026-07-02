/* =========================================================================
 * COMMON GROUND, HOLD THE LINE,  td.js
 * The second game: a Tower Defence for a UN Country Team. Waves of named crises
 * (the same field crises as The Long Road, CG.SNAKE_CARDS) march down roads
 * toward the communities you protect. You spend Funding to place UN partner
 * agencies along the roads; each one works the crises that pass. Let a crisis
 * reach a community and you lose Resilience. Hold the line through every wave
 * and the mandate is delivered.
 *
 * v2 adds: a freshly generated road network every game (dynamic, like The Long
 * Road), one to three communities to protect, a running cost (upkeep) on every
 * partner from the moment it is placed, Pooled Fund sectors that pay the running
 * cost of nearby partners, animated money flows to and from every item, and a
 * tap on any crisis to read what it is.
 *
 * Solo, single browser. Reuses the shell: CG.Audio (synth music + SFX),
 * CG.Narrate (spoken facts), the theatres and crisis decks in data/content.js,
 * and the overlay-card / event-card / title-screen looks from styles.css.
 * Vanilla JS, no build step. The play field is one <canvas>; the HUD, shop and
 * cards are DOM on top.
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
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  const COLS = 16, ROWS = 9;

  // ---- buildings: UN partner archetypes + the Pooled Fund sector --------
  // kind: attack | support | fund.  upkeep: Funding drained per second from the
  // moment it is placed.  bonus: crisis tags it is especially effective against.
  const BUILDINGS = {
    health: {
      key: "health", icon: "🏥", name: "Health Response", aff: "WHO / UNICEF", kind: "attack",
      color: "#11aecb", cost: 85, upkeep: 3, range: 2.7, fire: 0.55, dmg: 15, splash: 0, slow: 0,
      bonus: ["health"],
      desc: "Fast, close-range care. Cuts down disease outbreaks the quickest.",
    },
    logistics: {
      key: "logistics", icon: "🚚", name: "Logistics Cluster", aff: "WFP", kind: "attack",
      color: "#ef9f25", cost: 115, upkeep: 4, range: 2.3, fire: 1.15, dmg: 20, splash: 1.15, slow: 0.35,
      bonus: ["supply", "access", "flood", "storm"],
      desc: "Slows and hits a whole cluster at once. Reopens the blocked road.",
    },
    protection: {
      key: "protection", icon: "🛡️", name: "Protection & Peace", aff: "UNHCR / DPO", kind: "attack",
      color: "#7c4dff", cost: 150, upkeep: 6, range: 3.5, fire: 1.0, dmg: 52, splash: 0, slow: 0,
      bonus: ["displacement", "governance", "access"],
      desc: "Long reach, heavy single hits. Holds the line against conflict.",
    },
    coord: {
      key: "coord", icon: "🧭", name: "Coordination Hub", aff: "OCHA / RCO", kind: "support",
      color: "#2f6bff", cost: 110, upkeep: 3, range: 2.6, fire: 0, dmg: 0, splash: 0, slow: 0, bonus: [],
      desc: "No attack. Delivering as One: +30% damage, +15% range to nearby partners.",
    },
    fund: {
      key: "fund", icon: "💰", name: "Pooled Fund", aff: "OCHA / Donors", kind: "fund",
      color: "#2f9e54", cost: 130, upkeep: 0, income: 18, range: 3.0, fire: 0, dmg: 0, bonus: [],
      desc: "Pays the running cost of nearby partners first, then adds any surplus to your treasury.",
    },
  };
  const SHOP_ORDER = ["health", "logistics", "protection", "coord", "fund"];

  // ---- difficulty --------------------------------------------------------
  const DIFF = {
    steady:        { key: "steady",        label: "Steady",        lives: 24, funding: 360, hpMul: 0.82, waves: 10, comm: [1, 2] },
    testing:       { key: "testing",       label: "Testing",       lives: 20, funding: 320, hpMul: 1.0,  waves: 12, comm: [2, 2] },
    overstretched: { key: "overstretched", label: "Overstretched", lives: 16, funding: 280, hpMul: 1.28, waves: 14, comm: [2, 3] },
  };

  const TAG_SPEED = {
    health: 1.5, info: 1.7, data: 1.6, displacement: 1.3, access: 1.2,
    flood: 1.1, storm: 1.45, drought: 1.0, climate: 1.15, supply: 1.2,
    governance: 1.2, funding: 1.3, any: 1.35,
  };
  const TAG_HP = {
    drought: 1.3, governance: 1.25, climate: 1.15, funding: 1.1,
    health: 0.82, info: 0.8, data: 0.85, storm: 0.9,
  };

  let CARDS_BY_TAG = null;
  function indexCards() {
    if (CARDS_BY_TAG) return;
    CARDS_BY_TAG = {};
    (CG.SNAKE_CARDS || []).forEach((c) => { (CARDS_BY_TAG[c.tag] = CARDS_BY_TAG[c.tag] || []).push(c); });
  }
  function cardFor(tag) {
    indexCards();
    const list = CARDS_BY_TAG[tag] || CG.SNAKE_CARDS || [];
    return list.length ? rand(list) : { icon: "⚠️", title: "A Crisis", tag: tag || "any", why: "", fact: "" };
  }

  // =======================================================================
  // STATE
  // =======================================================================
  const S = {
    settings: { music: true, voice: true },
    theatre: null, diff: null,
    lives: 0, funding: 0, netRate: 0, waveNo: 0, waves: [],
    map: null,                 // { source, communities:[{c,r}], paths:[[cells]], pathSet }
    enemies: [], towers: [], shots: [], floats: [],
    selectedType: null, selectedTower: null, hoverCell: null,
    phase: "prep",             // prep | wave | over
    spawnQueue: [], spawnTimer: 0,
    speed: 1, paused: false, frozen: false,   // frozen: an inspect card is open
    running: false, raf: 0, lastT: 0, time: 0,
    killed: 0, leaked: 0,
  };

  let cv = null, ctx = null, dpr = 1;
  let cell = 40, ox = 0, oy = 0, boardW = 0, boardH = 0;

  // =======================================================================
  // MAP GENERATION  (fresh every game)
  // =======================================================================
  // A source on the left edge, one to three communities on the right, and a
  // meandering road from the source to each. Roads only ever move right (columns
  // strictly increase) with vertical weaves, so they never double back and stay
  // clean even where two of them overlap.
  function genMap(diff) {
    const [cmin, cmax] = diff.comm;
    const nComm = randInt(cmin, cmax);
    const source = { c: 0, r: randInt(1, ROWS - 2) };
    // spread community rows across the right edge
    const rows = [];
    for (let i = 0; i < nComm; i++) {
      let r = Math.round((i + 1) * ROWS / (nComm + 1)) + randInt(-1, 1);
      r = clamp(r, 1, ROWS - 2);
      while (rows.indexOf(r) >= 0) r = clamp(r + 1, 1, ROWS - 2);
      rows.push(r);
    }
    const communities = rows.map((r) => ({ c: COLS - 1, r }));
    const paths = communities.map((cm) => buildRoute(source, cm));
    const pathSet = new Set();
    paths.forEach((p) => p.forEach(([c, r]) => pathSet.add(c + "," + r)));
    return { source, communities, paths, pathSet, nComm };
  }

  // Adjacent-cell road from a to b: a few waypoints at strictly increasing
  // columns and random rows, joined horizontal-then-vertical.
  function buildRoute(a, b) {
    const cells = [[a.c, a.r]];
    const nMid = randInt(1, 2);
    const pts = [];
    let lastCol = a.c;
    for (let i = 0; i < nMid; i++) {
      let cc = Math.round(a.c + (b.c - a.c) * (i + 1) / (nMid + 1)) + randInt(-1, 1);
      cc = clamp(cc, lastCol + 1, b.c - 1);
      lastCol = cc;
      pts.push([cc, randInt(1, ROWS - 2)]);
    }
    pts.push([b.c, b.r]);
    let cur = [a.c, a.r];
    pts.forEach((p) => { pushRun(cells, cur[0], cur[1], p[0], p[1]); cur = p; });
    return cells;
  }
  function pushRun(cells, c0, r0, c1, r1) {
    let c = c0, r = r0;
    const dc = Math.sign(c1 - c0);
    while (c !== c1) { c += dc; cells.push([c, r]); }
    const dr = Math.sign(r1 - r0);
    while (r !== r1) { r += dr; cells.push([c, r]); }
  }

  const buildable = (c, r) => c >= 0 && c < COLS && r >= 0 && r < ROWS && !S.map.pathSet.has(c + "," + r);
  function towerAt(c, r) { return S.towers.find((t) => t.c === c && t.r === r) || null; }

  // =======================================================================
  // ENTRY: title screen
  // =======================================================================
  function show() {
    stop();
    CG.Narrate && CG.Narrate.stop();
    const root = app(); root.innerHTML = "";
    const wrap = el("div", "screen title-screen td-title");
    wrap.appendChild(el("div", "title-glow"));
    const back = el("button", "back-link", "← Games");
    back.onclick = () => { CG.Audio && CG.Audio.sfx.click(); CG.Platform.show(); };
    wrap.appendChild(back);
    wrap.appendChild(el("div", "logo-mark", "🛡️"));
    wrap.appendChild(el("h1", "title", "Common Ground"));
    wrap.appendChild(el("p", "subtitle", "Hold the Line"));
    wrap.appendChild(el("p", "tagline",
      "Waves of crises march on the communities you protect. Place UN partners along the roads, cover their running cost with pooled funds, and hold the line through every wave to deliver the mandate."));
    const toggles = el("div", "toggle-row");
    toggles.appendChild(toggle("🎵 Music", S.settings.music, (on) => { S.settings.music = on; CG.Audio && CG.Audio.setMuted(!on); }));
    toggles.appendChild(toggle("🗣️ Narration", S.settings.voice, (on) => { S.settings.voice = on; CG.Narrate && CG.Narrate.setEnabled(on); }));
    wrap.appendChild(toggles);
    const go = el("button", "btn btn-primary big", "Choose a posting ▸");
    go.style.marginTop = "22px";
    go.onclick = () => { CG.Audio && CG.Audio.sfx.click(); renderSelect(); };
    wrap.appendChild(go);
    wrap.appendChild(el("p", "credit", "Music and narration are generated live in your browser. No downloads, no accounts."));
    root.appendChild(wrap);
  }

  function toggle(label, on, fn) {
    const b = el("button", "chip-toggle" + (on ? " on" : ""), label);
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.onclick = () => { const now = b.classList.toggle("on"); b.setAttribute("aria-pressed", now ? "true" : "false"); fn(now); };
    return b;
  }

  // ---- posting select: a fresh random shortlist of theatres -------------
  function renderSelect() {
    let picks = shuffleN(CG.THEATRES || [], 3);
    let chosen = picks[0];
    let diffKey = "testing";

    const root = app(); root.innerHTML = "";
    const wrap = el("div", "screen title-screen setup-screen td-select");
    wrap.appendChild(el("div", "title-glow"));
    const back = el("button", "back-link", "← Back");
    back.onclick = () => show();
    wrap.appendChild(back);
    wrap.appendChild(el("div", "logo-mark", "🛡️"));
    wrap.appendChild(el("h1", "title", "Hold the Line"));
    wrap.appendChild(el("p", "subtitle", "Pick your posting"));
    wrap.appendChild(el("p", "tagline", "Every posting sends the crises it is prone to, on a road network drawn fresh for this game. Choose where to make your stand."));

    const row = el("div", "td-theatre-row");
    function paint() { row.querySelectorAll(".td-tcard").forEach((c, i) => c.classList.toggle("on", picks[i] === chosen)); }
    function fill() {
      row.innerHTML = "";
      picks.forEach((t) => {
        const kind = CG.theatreKindMeta ? CG.theatreKindMeta(t) : { key: "humanitarian", icon: "🆘", label: "Humanitarian" };
        const c = el("div", "td-tcard");
        c.innerHTML =
          `<div class="tdt-icon">${t.icon}</div>` +
          `<div class="tdt-name">${esc(t.name)}</div>` +
          `<div class="tdt-kind kind-badge ${kind.key}">${kind.icon} ${kind.label}</div>` +
          `<div class="tdt-blurb">${esc(t.blurb)}</div>` +
          `<div class="tdt-tags">${(t.tags || []).map((x) => `<span>${x}</span>`).join("")}</div>`;
        c.onclick = () => { chosen = t; CG.Audio && CG.Audio.sfx.click(); paint(); };
        row.appendChild(c);
      });
      paint();
    }
    fill();
    wrap.appendChild(row);

    const reroll = el("button", "btn btn-ghost", "🎲 Different postings");
    reroll.style.marginTop = "10px";
    reroll.onclick = () => { picks = shuffleN(CG.THEATRES || [], 3); chosen = picks[0]; CG.Audio && CG.Audio.sfx.click(); fill(); };
    wrap.appendChild(reroll);

    wrap.appendChild(el("p", "pick-label", "Pressure"));
    const seg = el("div", "seg-row");
    Object.keys(DIFF).forEach((k) => {
      const b = el("button", "seg" + (k === diffKey ? " on" : ""), DIFF[k].label);
      b.onclick = () => { diffKey = k; seg.querySelectorAll(".seg").forEach((x) => x.classList.remove("on")); b.classList.add("on"); CG.Audio && CG.Audio.sfx.click(); };
      seg.appendChild(b);
    });
    wrap.appendChild(seg);

    const go = el("button", "btn btn-primary big", "Take the posting ▸");
    go.style.marginTop = "20px";
    go.onclick = () => { CG.Audio && CG.Audio.sfx.pick(); startGame(chosen, DIFF[diffKey]); };
    wrap.appendChild(go);
    root.appendChild(wrap);
  }

  function shuffleN(arr, n) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a.slice(0, Math.min(n, a.length));
  }

  // =======================================================================
  // BUILD A GAME
  // =======================================================================
  function buildWaves(theatre, diff) {
    const base = (theatre.tags && theatre.tags.length) ? theatre.tags.slice() : ["health", "flood", "displacement"];
    const general = ["health", "displacement", "supply", "funding", "access", "governance", "info"];
    const waves = [];
    for (let w = 1; w <= diff.waves; w++) {
      const boss = w % 4 === 0;
      const mix = [];
      for (let i = 0; i < 6; i++) mix.push(rand(base));
      for (let i = 0; i < 2; i++) mix.push(rand(general));
      const count = boss ? 1 : Math.min(30, 5 + w * 2);
      const hp = Math.round((14 + w * w * 1.35 + w * 9) * diff.hpMul);
      const interval = Math.max(0.32, 1.05 - w * 0.05);
      waves.push({ n: w, boss, mix, count, hp, interval });
    }
    return waves;
  }

  function startGame(theatre, diff) {
    stop();
    S.theatre = theatre; S.diff = diff;
    S.lives = diff.lives; S.funding = diff.funding; S.netRate = 0;
    S.waveNo = 0; S.waves = buildWaves(theatre, diff);
    S.map = genMap(diff);
    S.enemies = []; S.towers = []; S.shots = []; S.floats = [];
    S.selectedType = null; S.selectedTower = null; S.hoverCell = null;
    S.phase = "prep"; S.spawnQueue = []; S.spawnTimer = 0;
    S.speed = 1; S.paused = false; S.frozen = false; S.time = 0;
    S.killed = 0; S.leaked = 0;

    if (S.settings.music && CG.Audio) CG.Audio.start();
    CG.Narrate && CG.Narrate.setEnabled(S.settings.voice);

    mountStage();
    loop();
    introCard();
  }

  // =======================================================================
  // STAGE: canvas + HUD + bar
  // =======================================================================
  function mountStage() {
    const root = app(); root.innerHTML = "";
    const stage = el("div", "td-stage");
    cv = document.createElement("canvas");
    cv.className = "td-canvas";
    stage.appendChild(cv);
    ctx = cv.getContext("2d");

    const hud = el("div", "td-hud");
    hud.innerHTML =
      `<div class="td-h-left"><span class="td-theatre"><span class="tdh-ic">${S.theatre.icon}</span>${esc(S.theatre.name)}</span></div>` +
      `<div class="td-h-stats">` +
        `<span class="td-stat wave" id="td-wave">Wave 0 / ${S.diff.waves}</span>` +
        `<span class="td-stat lives" id="td-lives">❤ ${S.lives}</span>` +
        `<span class="td-stat funds" id="td-funds">💰 ${Math.floor(S.funding)}</span>` +
        `<span class="td-stat rate" id="td-rate"></span>` +
      `</div>` +
      `<div class="td-h-right">` +
        `<button class="td-ic-btn" id="td-speed" title="Speed">▶▶ 1×</button>` +
        `<button class="td-ic-btn" id="td-pause" title="Pause">⏸</button>` +
        `<button class="td-ic-btn danger" id="td-quit" title="Quit to menu">✕</button>` +
      `</div>`;
    stage.appendChild(hud);

    const bar = el("div", "td-bar", ""); bar.id = "td-bar";
    stage.appendChild(bar);
    root.appendChild(stage);

    hud.querySelector("#td-speed").onclick = () => { S.speed = S.speed === 1 ? 2 : (S.speed === 2 ? 3 : 1); syncSpeed(); CG.Audio && CG.Audio.sfx.click(); };
    hud.querySelector("#td-pause").onclick = () => { S.paused = !S.paused; syncSpeed(); CG.Audio && CG.Audio.sfx.click(); };
    hud.querySelector("#td-quit").onclick = () => quit();

    cv.addEventListener("mousemove", onHover);
    cv.addEventListener("mouseleave", () => { S.hoverCell = null; });
    cv.addEventListener("click", onClick);
    window.addEventListener("resize", resize);
    resize(); renderBar(); syncSpeed();
  }

  function resize() {
    if (!cv) return;
    const stage = cv.parentElement;
    const w = stage.clientWidth || window.innerWidth;
    const h = stage.clientHeight || window.innerHeight;
    dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = w + "px"; cv.style.height = h + "px";
    const padTop = 64, padBot = 96, padX = 12;
    const availW = w - padX * 2, availH = h - padTop - padBot;
    cell = Math.max(24, Math.floor(Math.min(availW / COLS, availH / ROWS)));
    boardW = cell * COLS; boardH = cell * ROWS;
    ox = Math.round((w - boardW) / 2);
    oy = Math.round(padTop + (availH - boardH) / 2);
    // reposition placed buildings and any stationary enemies
    S.towers.forEach((t) => { t.x = cxOf(t.c); t.y = cyOf(t.r); });
    S.enemies.forEach((e) => positionEnemy(e));
  }

  function syncSpeed() {
    const sb = document.getElementById("td-speed");
    const pb = document.getElementById("td-pause");
    if (sb) sb.textContent = "▶▶ " + S.speed + "×";
    if (pb) { pb.textContent = S.paused ? "▶" : "⏸"; pb.classList.toggle("on", S.paused); }
  }

  const cxOf = (c) => ox + (c + 0.5) * cell;
  const cyOf = (r) => oy + (r + 0.5) * cell;
  function cellAt(px, py) {
    const c = Math.floor((px - ox) / cell), r = Math.floor((py - oy) / cell);
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return null;
    return [c, r];
  }

  // =======================================================================
  // INPUT
  // =======================================================================
  function onHover(e) {
    const rect = cv.getBoundingClientRect();
    S.hoverCell = cellAt(e.clientX - rect.left, e.clientY - rect.top);
  }
  function onClick(e) {
    if (S.frozen) return;
    const rect = cv.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    // 1) a crisis under the click -> read what it is
    const hitE = enemyAt(px, py);
    if (hitE) { showEnemyCard(hitE); return; }
    const cellHit = cellAt(px, py);
    if (!cellHit) { S.selectedTower = null; S.selectedType = null; renderBar(); return; }
    const [c, r] = cellHit;
    const existing = towerAt(c, r);
    if (existing) { S.selectedTower = existing; S.selectedType = null; renderBar(); return; }
    if (S.selectedType && buildable(c, r)) return placeTower(c, r);
    S.selectedTower = null; renderBar();
  }
  function enemyAt(px, py) {
    let best = null, bd = 1e9;
    for (const e of S.enemies) {
      if (e.dead || e.leaked) continue;
      const rad = (e.boss ? 0.42 : 0.3) * cell + 6;
      const d = Math.hypot(e.x - px, e.y - py);
      if (d <= rad && d < bd) { best = e; bd = d; }
    }
    return best;
  }

  function placeTower(c, r) {
    const def = BUILDINGS[S.selectedType];
    if (!def) return;
    if (S.funding < def.cost) { flash("Not enough funding"); CG.Audio && CG.Audio.sfx.wah(); return; }
    S.funding -= def.cost;
    const t = { type: def.key, c, r, x: cxOf(c), y: cyOf(r), lvl: 1, cool: 0, angle: -Math.PI / 2, spent: def.cost, funded: false, fundedBy: null, offline: false };
    S.towers.push(t);
    S.selectedTower = t; S.selectedType = null;
    CG.Audio && CG.Audio.sfx.pick();
    updateHud(); renderBar();
  }

  function statsOf(t) {
    const def = BUILDINGS[t.type];
    const lvlMul = 1 + (t.lvl - 1) * 0.45;
    let dmg = def.dmg * lvlMul;
    let range = def.range + (t.lvl - 1) * 0.35;
    const upkeep = (def.upkeep || 0) * (1 + (t.lvl - 1) * 0.5);
    const income = (def.income || 0) * (1 + (t.lvl - 1) * 0.5);
    if (def.kind === "attack") {
      let buffed = false;
      for (const o of S.towers) {
        if (o === t || o.type !== "coord") continue;
        const orange = BUILDINGS.coord.range + (o.lvl - 1) * 0.35;
        if (Math.hypot(o.c - t.c, o.r - t.r) <= orange) buffed = true;
      }
      if (buffed) { dmg *= 1.3; range += 0.15 * def.range; }
    }
    return { def, dmg, range, fire: def.fire, splash: def.splash, slow: def.slow, upkeep, income };
  }
  function upgradeCost(t) { return Math.round(BUILDINGS[t.type].cost * 0.8 * t.lvl); }
  function upgradeTower(t) {
    if (t.lvl >= 3) return;
    const cost = upgradeCost(t);
    if (S.funding < cost) { flash("Not enough funding"); CG.Audio && CG.Audio.sfx.wah(); return; }
    S.funding -= cost; t.lvl++; t.spent += cost;
    CG.Audio && CG.Audio.sfx.pick(); updateHud(); renderBar();
  }
  function sellTower(t) {
    S.funding += Math.round(t.spent * 0.6);
    S.towers = S.towers.filter((x) => x !== t);
    if (S.selectedTower === t) S.selectedTower = null;
    CG.Audio && CG.Audio.sfx.click(); updateHud(); renderBar();
  }

  // =======================================================================
  // BOTTOM BAR: shop, or the selected-item inspector
  // =======================================================================
  function renderBar() {
    const bar = document.getElementById("td-bar");
    if (!bar) return;
    bar.innerHTML = "";

    if (S.selectedTower) {
      const t = S.selectedTower, st = statsOf(t), def = st.def;
      const panel = el("div", "td-inspect");
      const canUp = t.lvl < 3;
      let money;
      if (def.kind === "fund") money = `<span>Income</span><b class="pos">+${Math.round(st.income)}/s</b>`;
      else money = `<span>Running cost</span><b class="neg">-${Math.round(st.upkeep)}/s</b>` +
        `<span>Funded</span><b class="${t.funded ? "pos" : "neg"}">${t.funded ? "yes" : (t.offline ? "offline" : "treasury")}</b>`;
      panel.innerHTML =
        `<div class="tdi-id"><span class="tdi-ic" style="--c:${def.color}">${def.icon}</span>` +
          `<div><b>${def.name}</b><small>${def.aff} · level ${t.lvl}</small></div></div>` +
        `<div class="tdi-stats">` +
          (def.kind === "attack" ? `<span>Damage</span><b>${Math.round(st.dmg)}</b><span>Range</span><b>${st.range.toFixed(1)}</b>` :
           def.kind === "support" ? `<span>Aura</span><b>+30% dmg</b>` : ``) +
          money +
        `</div>`;
      const acts = el("div", "tdi-acts");
      const up = el("button", "btn btn-primary sm", canUp ? `⬆ Upgrade · 💰${upgradeCost(t)}` : "Max level");
      up.disabled = !canUp; up.onclick = () => upgradeTower(t);
      const sell = el("button", "btn btn-ghost sm", `Sell · 💰${Math.round(t.spent * 0.6)}`);
      sell.onclick = () => sellTower(t);
      const close = el("button", "btn btn-ghost sm", "Close");
      close.onclick = () => { S.selectedTower = null; renderBar(); };
      acts.appendChild(up); acts.appendChild(sell); acts.appendChild(close);
      panel.appendChild(acts);
      bar.appendChild(panel);
      return;
    }

    const shop = el("div", "td-shop");
    SHOP_ORDER.forEach((k) => {
      const def = BUILDINGS[k];
      const b = el("button", "td-shopitem" + (S.selectedType === k ? " on" : ""));
      b.style.setProperty("--c", def.color);
      b.disabled = S.funding < def.cost;
      const money = def.kind === "fund" ? `<span class="tsi-run pos">+${def.income}/s</span>` : `<span class="tsi-run neg">-${def.upkeep}/s</span>`;
      b.innerHTML = `<span class="tsi-ic">${def.icon}</span><span class="tsi-nm">${def.name}</span>` +
        `<span class="tsi-cost">💰 ${def.cost}</span>${money}`;
      b.onclick = () => { S.selectedType = (S.selectedType === k ? null : k); S.selectedTower = null; CG.Audio && CG.Audio.sfx.click(); renderBar(); };
      b.title = def.desc;
      shop.appendChild(b);
    });
    bar.appendChild(shop);

    const ctrl = el("div", "td-wavectrl");
    if (S.phase === "prep" && S.waveNo < S.diff.waves) {
      const nextW = S.waves[S.waveNo];
      const btn = el("button", "btn btn-roll", `Send wave ${S.waveNo + 1} ▸`);
      btn.onclick = () => startWave();
      ctrl.appendChild(el("div", "td-hint", nextW && nextW.boss ? "⚠ A major crisis leads this wave" : "Place partners, then send the wave"));
      ctrl.appendChild(btn);
    } else if (S.phase === "wave") {
      ctrl.appendChild(el("div", "td-hint", "Wave in progress. Hold the line."));
    }
    bar.appendChild(ctrl);
  }

  function updateHud() {
    const w = document.getElementById("td-wave");
    const l = document.getElementById("td-lives");
    const f = document.getElementById("td-funds");
    const rt = document.getElementById("td-rate");
    if (w) w.textContent = `Wave ${S.waveNo} / ${S.diff.waves}`;
    if (l) l.textContent = `❤ ${S.lives}`;
    if (f) f.textContent = `💰 ${Math.floor(S.funding)}`;
    if (rt) {
      const n = Math.round(S.netRate);
      rt.textContent = (n >= 0 ? "▲ +" : "▼ ") + n + "/s";
      rt.className = "td-stat rate " + (n >= 0 ? "pos" : "neg");
    }
  }

  // =======================================================================
  // WAVES
  // =======================================================================
  function startWave() {
    if (S.phase !== "prep") return;
    S.waveNo++;
    const wave = S.waves[S.waveNo - 1];
    S.phase = "wave"; S.spawnQueue = [];
    const nComm = S.map.communities.length;
    if (wave.boss) {
      S.spawnQueue.push({ tag: rand(wave.mix), hp: wave.hp * 9, boss: true, reward: 55, comm: randInt(0, nComm - 1) });
    } else {
      for (let i = 0; i < wave.count; i++) {
        const tag = rand(wave.mix);
        S.spawnQueue.push({ tag, hp: Math.round(wave.hp * (TAG_HP[tag] || 1)), boss: false, reward: 6 + Math.round(S.waveNo * 1.2), comm: randInt(0, nComm - 1) });
      }
    }
    S.spawnTimer = 0; S.curWave = wave;
    updateHud(); renderBar();
    CG.Audio && (wave.boss ? CG.Audio.sfx.snake() : CG.Audio.sfx.note());
    toast(wave.boss ? "A major crisis is bearing down" : `Wave ${S.waveNo} incoming`, wave.boss ? "bad" : "");
  }

  function spawnOne(spec) {
    const card = cardFor(spec.tag);
    const speed = (TAG_SPEED[spec.tag] || 1.2) * (spec.boss ? 0.62 : 1);
    const e = {
      card, tag: spec.tag, boss: !!spec.boss, hp: spec.hp, maxHp: spec.hp, reward: spec.reward,
      commIdx: spec.comm, seg: 0, t: 0, speed, slowT: 0, slowMul: 1, prog: 0, x: 0, y: 0,
    };
    positionEnemy(e);
    S.enemies.push(e);
  }

  function waveCleared() {
    S.phase = "prep";
    const bonus = 20 + S.waveNo * 6;
    S.funding += bonus;
    const cm = S.map.communities[0];
    floatText(cxOf(cm.c), cyOf(cm.r) - cell, "+" + bonus + " funding", "#2f9e54");
    updateHud();
    if (S.waveNo >= S.diff.waves) return win();
    renderBar();
    if (S.waveNo % 2 === 0 || (S.curWave && S.curWave.boss)) betweenCard();
  }

  // =======================================================================
  // GAME LOOP
  // =======================================================================
  function loop() {
    S.running = true; S.lastT = performance.now();
    const frame = (now) => {
      if (!S.running) return;
      let dt = (now - S.lastT) / 1000; S.lastT = now;
      dt = Math.min(dt, 0.05);
      if (!S.paused && !S.frozen) { for (let i = 0; i < S.speed; i++) update(dt); }
      draw();
      S.raf = requestAnimationFrame(frame);
    };
    S.raf = requestAnimationFrame(frame);
  }

  function update(dt) {
    S.time += dt;
    // spawn
    if (S.phase === "wave" && S.spawnQueue.length) {
      S.spawnTimer -= dt;
      if (S.spawnTimer <= 0) { spawnOne(S.spawnQueue.shift()); S.spawnTimer = S.curWave ? S.curWave.interval : 0.7; }
    }
    // economy (upkeep, pooled funds, treasury)
    economy(dt);
    // enemies
    for (const e of S.enemies) moveEnemy(e, dt);
    for (let i = S.enemies.length - 1; i >= 0; i--) {
      const e = S.enemies[i];
      if (e.dead) { S.enemies.splice(i, 1); continue; }
      if (e.leaked) {
        S.enemies.splice(i, 1);
        const cost = e.boss ? 5 : 1; S.lives -= cost; S.leaked++;
        const cm = S.map.communities[e.commIdx];
        floatText(cxOf(cm.c), cyOf(cm.r), "-" + cost + " ❤", "#e5564b");
        CG.Audio && CG.Audio.sfx.wah(); updateHud();
        if (S.lives <= 0) { S.lives = 0; return lose(); }
      }
    }
    // towers fire
    for (const t of S.towers) tickTower(t, dt);
    // projectiles
    for (let i = S.shots.length - 1; i >= 0; i--) { if (stepShot(S.shots[i], dt)) S.shots.splice(i, 1); }
    // floats
    for (let i = S.floats.length - 1; i >= 0; i--) { const f = S.floats[i]; f.t += dt; if (!f.spark) f.y -= 22 * dt; if (f.t > 1.1) S.floats.splice(i, 1); }
    // wave end
    if (S.phase === "wave" && !S.spawnQueue.length && !S.enemies.length) waveCleared();
  }

  // ---- economy: running costs + pooled funds ----------------------------
  function economy(dt) {
    const funds = S.towers.filter((t) => BUILDINGS[t.type].kind === "fund");
    const costed = S.towers.filter((t) => BUILDINGS[t.type].upkeep > 0);
    costed.forEach((t) => { t.funded = false; t.fundedBy = null; });

    let toTreasury = 0; // surplus from funds
    funds.forEach((f) => {
      const st = statsOf(f);
      let budget = st.income;
      const near = costed
        .filter((t) => !t.funded && Math.hypot(t.c - f.c, t.r - f.r) <= st.range)
        .sort((a, b) => Math.hypot(a.c - f.c, a.r - f.r) - Math.hypot(b.c - f.c, b.r - f.r));
      for (const t of near) { const up = statsOf(t).upkeep; if (budget >= up) { budget -= up; t.funded = true; t.fundedBy = f; } }
      f.surplus = budget; f.allocated = st.income - budget;
      toTreasury += budget;
    });

    // unfunded partners draw upkeep from the treasury; if it is empty they idle
    const unfunded = costed.filter((t) => !t.funded);
    const treasuryHasCash = S.funding > 0;
    let fromTreasury = 0;
    unfunded.forEach((t) => {
      if (treasuryHasCash) { t.offline = false; fromTreasury += statsOf(t).upkeep; }
      else { t.offline = true; }
    });
    S.towers.forEach((t) => { if (t.funded || BUILDINGS[t.type].kind === "fund" || BUILDINGS[t.type].upkeep === 0) t.offline = false; });

    const net = toTreasury - fromTreasury;
    S.netRate = net;
    S.funding = Math.max(0, S.funding + net * dt);
    updateHud();
  }

  function positionEnemy(e) {
    const path = S.map.paths[e.commIdx];
    const a = path[Math.min(e.seg, path.length - 1)];
    const b = path[Math.min(e.seg + 1, path.length - 1)];
    e.x = cxOf(a[0] + (b[0] - a[0]) * e.t);
    e.y = cyOf(a[1] + (b[1] - a[1]) * e.t);
    e.prog = (e.seg + e.t) / (path.length - 1);
  }
  function moveEnemy(e, dt) {
    if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slowMul = 1; }
    const path = S.map.paths[e.commIdx];
    let remain = e.speed * e.slowMul * dt;
    while (remain > 0 && e.seg < path.length - 1) {
      const step = Math.min(remain, 1 - e.t);
      e.t += step; remain -= step;
      if (e.t >= 1 - 1e-6) { e.seg++; e.t = 0; }
    }
    if (e.seg >= path.length - 1) { e.leaked = true; const end = path[path.length - 1]; e.x = cxOf(end[0]); e.y = cyOf(end[1]); return; }
    positionEnemy(e);
  }

  function tickTower(t, dt) {
    const def = BUILDINGS[t.type];
    if (def.kind !== "attack" || def.fire === 0) return;
    if (t.offline) return;
    t.cool -= dt;
    const st = statsOf(t);
    let best = null, bestProg = -1;
    for (const e of S.enemies) {
      if (e.dead || e.leaked) continue;
      const d = Math.hypot(e.x - t.x, e.y - t.y) / cell;
      if (d <= st.range && e.prog > bestProg) { best = e; bestProg = e.prog; }
    }
    if (best) {
      t.angle = Math.atan2(best.y - t.y, best.x - t.x);
      if (t.cool <= 0) { t.cool = st.fire; fire(t, best, st); }
    } else if (t.cool < 0) t.cool = 0;
  }
  function fire(t, target, st) {
    const def = BUILDINGS[t.type];
    S.shots.push({ x: t.x, y: t.y, target, color: def.color, dmg: st.dmg, splash: st.splash, slow: st.slow, bonus: def.bonus, speed: 12 * cell, life: 0 });
  }
  function stepShot(s, dt) {
    s.life += dt;
    const tgt = s.target;
    const tx = (tgt && !tgt.dead && !tgt.leaked) ? tgt.x : s.lastX;
    const ty = (tgt && !tgt.dead && !tgt.leaked) ? tgt.y : s.lastY;
    if (tx == null) return true;
    s.lastX = tx; s.lastY = ty;
    const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
    const step = s.speed * dt;
    if (d <= step || s.life > 1.5) { hit(s, tx, ty); return true; }
    s.x += (dx / d) * step; s.y += (dy / d) * step;
    return false;
  }
  function damage(e, base, bonusTags) {
    let dmg = base;
    if (bonusTags && bonusTags.indexOf(e.tag) >= 0) dmg *= 1.7;
    e.hp -= dmg;
    if (e.hp <= 0 && !e.dead) {
      e.dead = true; S.killed++; S.funding += e.reward;
      floatText(e.x, e.y, "+" + e.reward, "#2f9e54"); updateHud();
      if (e.boss) CG.Audio && CG.Audio.sfx.ladder();
    }
  }
  function hit(s, x, y) {
    if (s.splash > 0) {
      const rad = s.splash * cell;
      for (const e of S.enemies) { if (e.dead || e.leaked) continue; if (Math.hypot(e.x - x, e.y - y) <= rad) { damage(e, s.dmg, s.bonus); if (s.slow > 0) { e.slowMul = 1 - s.slow; e.slowT = 1.3; } } }
      spark(x, y, s.color, true);
    } else {
      const e = s.target;
      if (e && !e.dead && !e.leaked) { damage(e, s.dmg, s.bonus); if (s.slow > 0) { e.slowMul = 1 - s.slow; e.slowT = 1.3; } }
      spark(x, y, s.color, false);
    }
  }
  function spark(x, y, color, big) { S.floats.push({ x, y, t: 0, spark: true, color, big: !!big }); }
  function floatText(x, y, text, color) { S.floats.push({ x, y, t: 0, text, color }); }

  // =======================================================================
  // DRAW
  // =======================================================================
  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = cv.width / dpr, h = cv.height / dpr;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#eef4fd"); g.addColorStop(1, "#dfe9f8");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    drawGround();
    drawPaths();
    drawBuildHints();
    drawMoneyFlows();
    drawTowers();
    drawEnemies();
    drawShots();
    drawFloats();
  }

  function drawGround() {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (S.map.pathSet.has(c + "," + r)) continue;
      const x = ox + c * cell, y = oy + r * cell;
      ctx.fillStyle = ((c + r) % 2 === 0) ? "rgba(120,170,120,0.10)" : "rgba(120,170,120,0.05)";
      ctx.fillRect(x, y, cell, cell);
    }
    ctx.strokeStyle = "rgba(40,80,130,0.06)"; ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(ox + c * cell, oy); ctx.lineTo(ox + c * cell, oy + boardH); ctx.stroke(); }
    for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(ox, oy + r * cell); ctx.lineTo(ox + boardW, oy + r * cell); ctx.stroke(); }
  }

  function drawPaths() {
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    S.map.paths.forEach((path) => {
      ctx.beginPath();
      path.forEach(([c, r], i) => { const x = cxOf(c), y = cyOf(r); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.strokeStyle = "#c8a56e"; ctx.lineWidth = cell * 0.72; ctx.stroke();
      ctx.strokeStyle = "#e6cfa0"; ctx.lineWidth = cell * 0.54; ctx.stroke();
      ctx.setLineDash([cell * 0.18, cell * 0.22]);
      ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 2; ctx.stroke();
      ctx.setLineDash([]);
    });
    // source and communities
    drawTile(S.map.source.c, S.map.source.r, "⚠️", "rgba(229,86,75,0.16)");
    S.map.communities.forEach((cm, i) => {
      drawTile(cm.c, cm.r, "🏛️", "rgba(47,107,255,0.16)");
      const ex = cxOf(cm.c), ey = cyOf(cm.r);
      ctx.font = `${Math.round(cell * 0.26)}px Inter, sans-serif`;
      ctx.textAlign = "center"; ctx.fillStyle = "#2f6bff"; ctx.textBaseline = "middle";
      ctx.fillText("Community" + (S.map.communities.length > 1 ? " " + (i + 1) : ""), ex, ey + cell * 0.6);
    });
  }
  function drawTile(c, r, emoji, bg) {
    const x = ox + c * cell, y = oy + r * cell;
    ctx.fillStyle = bg; roundRect(x + 3, y + 3, cell - 6, cell - 6, 8); ctx.fill();
    ctx.font = `${Math.round(cell * 0.5)}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(emoji, cxOf(c), cyOf(r));
  }

  function drawBuildHints() {
    const hc = S.hoverCell;
    if (hc && S.selectedType) {
      const [c, r] = hc;
      const ok = buildable(c, r) && !towerAt(c, r) && S.funding >= BUILDINGS[S.selectedType].cost;
      const x = ox + c * cell, y = oy + r * cell;
      ctx.fillStyle = ok ? "rgba(47,158,84,0.28)" : "rgba(229,86,75,0.28)";
      roundRect(x + 2, y + 2, cell - 4, cell - 4, 8); ctx.fill();
      if (ok) {
        ctx.beginPath(); ctx.arc(cxOf(c), cyOf(r), BUILDINGS[S.selectedType].range * cell, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(47,158,84,0.10)"; ctx.fill();
        ctx.strokeStyle = "rgba(47,158,84,0.5)"; ctx.lineWidth = 2; ctx.stroke();
      }
    }
    const t = S.selectedTower;
    if (t) {
      const st = statsOf(t);
      ctx.beginPath(); ctx.arc(t.x, t.y, st.range * cell, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(47,107,255,0.08)"; ctx.fill();
      ctx.strokeStyle = "rgba(47,107,255,0.5)"; ctx.lineWidth = 2; ctx.stroke();
    }
  }

  // money flowing from each Pooled Fund to the partners it pays, as little
  // green beads travelling along the link.
  function drawMoneyFlows() {
    S.towers.forEach((f) => {
      if (BUILDINGS[f.type].kind !== "fund") return;
      const covered = S.towers.filter((t) => t.fundedBy === f);
      covered.forEach((t) => {
        ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = "rgba(47,158,84,0.28)"; ctx.lineWidth = 2; ctx.stroke();
        for (let k = 0; k < 2; k++) {
          const frac = ((S.time * 0.6 + k * 0.5) % 1);
          const bx = f.x + (t.x - f.x) * frac, by = f.y + (t.y - f.y) * frac;
          ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#2f9e54"; ctx.fill();
        }
      });
    });
  }

  function drawTowers() {
    for (const t of S.towers) {
      const def = BUILDINGS[t.type];
      const x = t.x, y = t.y, s = cell * 0.78;
      const off = t.offline;
      ctx.globalAlpha = off ? 0.45 : 1;
      ctx.fillStyle = "#ffffff"; roundRect(x - s / 2, y - s / 2, s, s, 9); ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = def.color; roundRect(x - s / 2, y - s / 2, s, s, 9); ctx.stroke();
      if (def.kind === "support" || def.kind === "fund") {
        ctx.beginPath(); ctx.arc(x, y, s * 0.62, 0, Math.PI * 2);
        ctx.strokeStyle = def.kind === "fund" ? "rgba(47,158,84,0.4)" : "rgba(47,107,255,0.35)"; ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.font = `${Math.round(cell * 0.44)}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(def.icon, x, y + 1);
      for (let i = 0; i < t.lvl; i++) { ctx.beginPath(); ctx.arc(x - s / 2 + 7 + i * 8, y + s / 2 - 6, 3, 0, Math.PI * 2); ctx.fillStyle = def.color; ctx.fill(); }
      ctx.globalAlpha = 1;
      // per-item money label
      const st = statsOf(t);
      ctx.font = "700 11px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "top";
      if (def.kind === "fund") { ctx.fillStyle = "#2f9e54"; ctx.fillText("+" + Math.round(st.income) + "/s", x, y + s / 2 + 2); }
      else if (def.upkeep > 0) {
        if (off) { ctx.fillStyle = "#e5564b"; ctx.fillText("no funds", x, y + s / 2 + 2); }
        else { ctx.fillStyle = t.funded ? "#2f9e54" : "#c07a1a"; ctx.fillText("-" + Math.round(st.upkeep) + "/s", x, y + s / 2 + 2); }
      }
    }
  }

  function drawEnemies() {
    for (const e of S.enemies) {
      const rad = (e.boss ? 0.42 : 0.3) * cell;
      ctx.beginPath(); ctx.arc(e.x, e.y, rad, 0, Math.PI * 2);
      ctx.fillStyle = e.boss ? "#7a1220" : "#b23b34"; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = e.slowMul < 1 ? "#11aecb" : "rgba(255,255,255,0.7)"; ctx.stroke();
      ctx.font = `${Math.round(rad * 1.3)}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(e.card.icon, e.x, e.y + 1);
      const bw = rad * 2.2, bh = 4, bx = e.x - bw / 2, by = e.y - rad - 8;
      ctx.fillStyle = "rgba(0,0,0,0.25)"; roundRect(bx, by, bw, bh, 2); ctx.fill();
      ctx.fillStyle = e.boss ? "#ef9f25" : "#2f9e54"; roundRect(bx, by, bw * clamp(e.hp / e.maxHp, 0, 1), bh, 2); ctx.fill();
    }
  }
  function drawShots() {
    for (const s of S.shots) { ctx.beginPath(); ctx.arc(s.x, s.y, s.splash > 0 ? 5 : 3.5, 0, Math.PI * 2); ctx.fillStyle = s.color; ctx.fill(); }
  }
  function drawFloats() {
    for (const f of S.floats) {
      if (f.spark) { const a = 1 - f.t / 1.1; ctx.beginPath(); ctx.arc(f.x, f.y, (f.big ? 16 : 9) * (0.4 + f.t * 2), 0, Math.PI * 2); ctx.strokeStyle = hexA(f.color, a * 0.7); ctx.lineWidth = 2; ctx.stroke(); }
      else if (f.text) { const a = clamp(1 - f.t / 1.1, 0, 1); ctx.font = "700 13px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = hexA(f.color, a); ctx.fillText(f.text, f.x, f.y); }
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function hexA(hex, a) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(a, 0, 1)})`;
  }

  // =======================================================================
  // CARDS + TOASTS
  // =======================================================================
  function introCard() {
    const kind = CG.theatreKindMeta ? CG.theatreKindMeta(S.theatre) : null;
    const story = CG.theatreStory ? CG.theatreStory(S.theatre) : S.theatre.blurb;
    const nc = S.map.communities.length;
    const commLine = nc === 1 ? "One community depends on you." : `${nc} communities depend on you, each at the end of its own road.`;
    const over = el("div", "overlay-card");
    const c = el("div", "event-card note");
    c.innerHTML =
      `<div class="ec-band">YOUR POSTING</div>` +
      `<div class="ec-icon">${S.theatre.icon}</div>` +
      `<div class="ec-title">${esc(S.theatre.name)}</div>` +
      (kind ? `<div class="ec-move">${kind.icon} ${kind.label} · ${nc} community${nc > 1 ? "ies" : ""}</div>` : "") +
      `<div class="ec-why">${esc(story)}</div>` +
      `<div class="ec-fact"><span>How to play</span>${commLine} Spend Funding to place partners along the roads. Every partner has a running cost, so place a Pooled Fund nearby to pay it. Tap any crisis to read what it is. Hold the line through all ${S.diff.waves} waves to deliver the mandate.</div>`;
    const actions = el("div", "ec-actions");
    const speak = el("button", "btn btn-ghost", "🔊 Read aloud");
    speak.onclick = () => CG.Narrate && CG.Narrate.speak(`${S.theatre.name}. ${story}`);
    const go = el("button", "btn btn-primary", "Take the line ▸");
    go.onclick = () => { CG.Narrate && CG.Narrate.stop(); over.classList.remove("show"); setTimeout(() => over.remove(), 250); };
    actions.appendChild(speak); actions.appendChild(go);
    c.appendChild(actions); over.appendChild(c); app().appendChild(over);
    requestAnimationFrame(() => over.classList.add("show"));
    CG.Narrate && CG.Narrate.auto(`Your posting. ${S.theatre.name}. ${story}`);
  }

  // Tap a crisis to read what it is. The field freezes while the card is open.
  function showEnemyCard(e) {
    S.frozen = true;
    const card = e.card;
    const over = el("div", "overlay-card");
    const c = el("div", "event-card snake");
    c.innerHTML =
      `<div class="ec-band">A CRISIS ON THE ROAD</div>` +
      `<div class="ec-icon">${card.icon}</div>` +
      `<div class="ec-title">${esc(card.title)}</div>` +
      `<div class="ec-move">${e.boss ? "Major crisis" : "Crisis"} · ${esc(e.tag)}</div>` +
      `<div class="ec-why">${esc(card.why)}</div>` +
      `<div class="ec-fact"><span>Side fact</span>${esc(card.fact)}</div>`;
    const actions = el("div", "ec-actions");
    const speak = el("button", "btn btn-ghost", "🔊 Read aloud");
    speak.onclick = () => CG.Narrate && CG.Narrate.speak(`${card.title}. ${card.why} ${card.fact}`);
    const go = el("button", "btn btn-primary", "Back to the line ▸");
    const done = () => { CG.Narrate && CG.Narrate.stop(); S.frozen = false; over.classList.remove("show"); setTimeout(() => over.remove(), 250); };
    go.onclick = done;
    actions.appendChild(speak); actions.appendChild(go);
    c.appendChild(actions); over.appendChild(c); app().appendChild(over);
    requestAnimationFrame(() => over.classList.add("show"));
    CG.Narrate && CG.Narrate.auto(`${card.title}. ${card.why}`);
  }

  function betweenCard() {
    const wave = S.curWave;
    const card = cardFor(wave && wave.mix ? rand(wave.mix) : "any");
    const over = el("div", "overlay-card");
    const c = el("div", "event-card snake");
    c.innerHTML =
      `<div class="ec-band">WAVE ${S.waveNo} HELD</div>` +
      `<div class="ec-icon">${card.icon}</div>` +
      `<div class="ec-title">${esc(card.title)}</div>` +
      `<div class="ec-why">${esc(card.why)}</div>` +
      `<div class="ec-fact"><span>Side fact</span>${esc(card.fact)}</div>`;
    const actions = el("div", "ec-actions");
    const speak = el("button", "btn btn-ghost", "🔊 Read aloud");
    speak.onclick = () => CG.Narrate && CG.Narrate.speak(`${card.title}. ${card.why} ${card.fact}`);
    const go = el("button", "btn btn-primary", "Ready the next wave ▸");
    go.onclick = () => { CG.Narrate && CG.Narrate.stop(); over.classList.remove("show"); setTimeout(() => over.remove(), 250); };
    actions.appendChild(speak); actions.appendChild(go);
    c.appendChild(actions); over.appendChild(c); app().appendChild(over);
    requestAnimationFrame(() => over.classList.add("show"));
    CG.Narrate && CG.Narrate.auto(`Wave ${S.waveNo} held. ${card.title}. ${card.fact}`);
  }

  function win() {
    S.phase = "over";
    if (S.settings.music && CG.Audio) { CG.Audio.sfx.win(); CG.Audio.sfx.clap(); }
    const nc = S.map.communities.length;
    endCard("win", "🏛️", "The line holds",
      `You held ${esc(S.theatre.name)} through every wave. ${S.killed} crises contained, ${nc} community${nc > 1 ? "ies" : ""} still standing, ${S.lives} resilience remaining. Mandate delivered.`,
      "Mandate delivered");
    CG.Narrate && CG.Narrate.auto(`The line holds. You held ${S.theatre.name} through every wave. The mandate is delivered.`);
  }
  function lose() {
    S.phase = "over";
    if (S.settings.music && CG.Audio) { CG.Audio.sfx.lose(); CG.Audio.sfx.wah(); }
    endCard("snake", "🌊", "The communities are overrun",
      `${esc(S.theatre.name)} was overwhelmed at wave ${S.waveNo} of ${S.diff.waves}. ${S.killed} crises were held before the line broke. The response regroups to try again.`,
      "The line breaks");
    CG.Narrate && CG.Narrate.auto(`The communities are overrun. The line broke at wave ${S.waveNo}. The response will regroup and try again.`);
  }
  function endCard(kind, icon, title, body, band) {
    const over = el("div", "overlay-card show");
    const c = el("div", `event-card ${kind}`);
    c.innerHTML = `<div class="ec-band">${band}</div><div class="ec-icon">${icon}</div><div class="ec-title">${title}</div><div class="ec-why">${body}</div>`;
    const actions = el("div", "ec-actions");
    const again = el("button", "btn btn-primary", "Play again ▸");
    again.onclick = () => { over.remove(); CG.Narrate && CG.Narrate.stop(); renderSelect(); };
    const menu = el("button", "btn btn-ghost", "Games ▸");
    menu.onclick = () => { over.remove(); quit(); };
    actions.appendChild(menu); actions.appendChild(again);
    c.appendChild(actions); over.appendChild(c); app().appendChild(over);
  }

  function toast(msg, kind) {
    const t = el("div", "td-toast" + (kind ? " " + kind : ""), esc(msg));
    const stage = document.querySelector(".td-stage") || app();
    stage.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 1900);
  }
  function flash(msg) { toast(msg, "bad"); }

  // =======================================================================
  // TEARDOWN + QUIT
  // =======================================================================
  function stop() {
    S.running = false; if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0;
    window.removeEventListener("resize", resize); cv = null; ctx = null;
  }
  function quit() { CG.Narrate && CG.Narrate.stop(); stop(); CG.Platform ? CG.Platform.show() : show(); }

  CG.TowerDefense = { show };

  // Test/debug harness: rAF is paused in an offscreen/headless tab, so this lets
  // the simulation be stepped by hand for verification. No effect on normal play.
  CG.TowerDefense._t = {
    S,
    step: (dt, n) => { for (let i = 0; i < (n || 1); i++) update(dt || 1 / 60); },
    place: (type, c, r) => { S.selectedType = type; placeTower(c, r); return towerAt(c, r); },
    startWave, statsOf, economy, draw, resize, buildable, BUILDINGS,
  };
})();
