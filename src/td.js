/* =========================================================================
 * COMMON GROUND, HOLD THE LINE,  td.js
 * The second game: a Tower Defence for a UN Country Team. Waves of named crises
 * (the same field crises as The Long Road, CG.SNAKE_CARDS) march down roads
 * toward the communities you protect. You spend Funding to place UN partner
 * sectors along the roads; each one works the crises that pass. Let a crisis
 * reach a community and you lose Resilience. Hold the line through every wave
 * and the mandate is delivered.
 *
 * Highlights:
 *  - A road network drawn fresh every game. On a wide screen it flows left to
 *    right; on a tall phone it flows top to bottom, so it fits the device.
 *  - One to three communities, each at the end of its own branch. Branches fork
 *    off a shared trunk and spread apart to fill the space.
 *  - The crisis source and every community carry a name and an icon you can tap:
 *    the source tells the story of the crisis type; each community gives its
 *    name, population and history.
 *  - Eight partner sectors, each with a running cost paid by nearby Pooled Funds,
 *    with the money flows drawn on the field.
 *
 * Solo, single browser. Reuses the shell: CG.Audio, CG.Narrate, the theatres and
 * crisis decks in data/content.js, and the overlay-card / title-screen looks.
 * Vanilla JS, no build step. The play field is one <canvas>; HUD, shop and cards
 * are DOM on top.
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
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  // grid dimensions + flow axis are chosen per game to fit the device
  let COLS = 16, ROWS = 9;

  // ---- sectors: UN partner archetypes + the Pooled Fund -----------------
  // kind: attack | support | fund.  upkeep: Funding per second, paid from the
  // moment it is placed.  bonus: crisis tags it is especially effective against.
  const BUILDINGS = {
    health: {
      key: "health", icon: "🏥", name: "Health Response", aff: "WHO / UNICEF", kind: "attack",
      color: "#11aecb", cost: 85, upkeep: 3, range: 2.7, fire: 0.55, dmg: 15, splash: 0, slow: 0,
      bonus: ["health"], desc: "Fast, close-range care. Cuts down disease outbreaks the quickest.",
    },
    wash: {
      key: "wash", icon: "💧", name: "WASH & Water", aff: "UNICEF", kind: "attack",
      color: "#1f9fd6", cost: 80, upkeep: 3, range: 2.4, fire: 0.7, dmg: 12, splash: 0.9, slow: 0,
      bonus: ["health", "flood"], desc: "Clean water and sanitation. Splashes a cluster and blunts water-borne crises.",
    },
    logistics: {
      key: "logistics", icon: "🚚", name: "Logistics Cluster", aff: "WFP", kind: "attack",
      color: "#ef9f25", cost: 115, upkeep: 4, range: 2.3, fire: 1.15, dmg: 20, splash: 1.15, slow: 0.35,
      bonus: ["supply", "access", "flood", "storm"], desc: "Slows and hits a whole cluster at once. Reopens the blocked road.",
    },
    riskcomm: {
      key: "riskcomm", icon: "📣", name: "Risk Communication", aff: "WHO / UNESCO", kind: "attack",
      color: "#e8439b", cost: 100, upkeep: 4, range: 3.0, fire: 0.8, dmg: 22, splash: 0, slow: 0,
      bonus: ["info", "data", "governance"], desc: "Trusted messaging. Reaches far and counters rumour and refusal.",
    },
    protection: {
      key: "protection", icon: "🛡️", name: "Protection & Peace", aff: "UNHCR / DPO", kind: "attack",
      color: "#7c4dff", cost: 150, upkeep: 6, range: 3.5, fire: 1.0, dmg: 52, splash: 0, slow: 0,
      bonus: ["displacement", "governance", "access"], desc: "Long reach, heavy single hits. Holds the line against conflict.",
    },
    coord: {
      key: "coord", icon: "🧭", name: "Coordination Hub", aff: "OCHA / RCO", kind: "support",
      color: "#2f6bff", cost: 110, upkeep: 3, range: 2.6, fire: 0, dmg: 0, splash: 0, slow: 0, bonus: [],
      desc: "No attack. Delivering as One: +30% damage, +15% range to nearby partners.",
    },
    foresight: {
      key: "foresight", icon: "🔭", name: "Early Warning", aff: "WMO / Anticipatory Action", kind: "support",
      color: "#16a99a", cost: 120, upkeep: 4, range: 3.0, fire: 0, dmg: 0, slowAura: 0.35, bonus: [],
      desc: "No attack. Anticipatory action slows every crisis in range, buying the team time.",
    },
    fund: {
      key: "fund", icon: "💰", name: "Pooled Fund", aff: "OCHA / Donors", kind: "fund",
      color: "#2f9e54", cost: 130, upkeep: 0, income: 18, range: 3.0, fire: 0, dmg: 0, bonus: [],
      desc: "Pays the running cost of nearby partners first, then adds any surplus to your treasury.",
    },
  };
  const SHOP_ORDER = ["health", "wash", "logistics", "riskcomm", "protection", "coord", "foresight", "fund"];

  // Which crisis tags make each sector relevant to a posting. Coordination and
  // the Pooled Fund are universal (a UN response always needs coordination and
  // money), so they are offered everywhere; the rest are offered only where the
  // theatre's crises call for them. computeOffered() guarantees at least three.
  const SECTOR_FOR = {
    health: ["health"],
    wash: ["health", "flood", "storm"],
    logistics: ["supply", "access", "flood", "storm"],
    riskcomm: ["info", "data", "governance", "behaviour", "digital"],
    protection: ["displacement", "governance", "access"],
    foresight: ["storm", "flood", "climate", "drought", "foresight"],
  };
  const SECTOR_UNIVERSAL = new Set(["coord", "fund"]);
  // Offer the crisis-fighting sectors this theatre's tags call for, always at
  // least three of them (topped up so there is enough variety to hold the line
  // under the same-type spacing rule), plus the universal coordination + fund.
  function computeOffered(theatre) {
    const tags = new Set((theatre && theatre.tags) || []);
    let crisis = Object.keys(SECTOR_FOR).filter((k) => (SECTOR_FOR[k] || []).some((t) => tags.has(t)));
    const fallback = ["protection", "health", "logistics", "foresight", "wash", "riskcomm"];
    for (let i = 0; crisis.length < 3 && i < fallback.length; i++) if (crisis.indexOf(fallback[i]) < 0) crisis.push(fallback[i]);
    return SHOP_ORDER.filter((k) => crisis.indexOf(k) >= 0 || SECTOR_UNIVERSAL.has(k));   // keep shop order
  }

  const DIFF = {
    steady:        { key: "steady",        label: "Steady",        lives: 24, funding: 380, hpMul: 0.82, waves: 10, comm: [1, 2] },
    testing:       { key: "testing",       label: "Testing",       lives: 20, funding: 340, hpMul: 1.0,  waves: 12, comm: [2, 2] },
    overstretched: { key: "overstretched", label: "Overstretched", lives: 16, funding: 300, hpMul: 1.28, waves: 14, comm: [2, 3] },
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
  const TAG_EMOJI = {
    flood: "🌊", drought: "🏜️", storm: "🌀", climate: "🌡️", health: "🦠",
    displacement: "🚶", access: "🚧", supply: "📦", governance: "🏛️", funding: "📉",
    youth: "✊", data: "📊", digital: "📡", info: "📱", community: "🤝",
    behaviour: "🧠", foresight: "🔭",
  };
  const TAG_WORD = (CG.TAG_CHALLENGE) || {
    flood: "flooding", drought: "drought", storm: "cyclones", climate: "a shifting climate",
    health: "disease outbreaks", displacement: "mass displacement", access: "blocked access",
    supply: "fragile supply lines", governance: "weak institutions", funding: "tight funding",
    info: "rumour and misinformation", data: "thin data", digital: "patchy connectivity",
    community: "frayed local trust", foresight: "sudden-onset hazards",
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
  // COMMUNITY + SOURCE PROFILES  (generated fresh per game)
  // =======================================================================
  const CNAME_PRE = ["New", "Old", "Lower", "Upper", "North", "South", "Little", "Greater", "Port", "East", "West"];
  const CNAME_ROOT = ["Harran", "Keddah", "Tamsin", "Asmal", "Maral", "Karan", "Tovrid", "Amran", "Beros", "Deir", "Esan", "Faro", "Sund", "Rael", "Miran", "Qasr", "Adwa", "Bahr", "Cala", "Neroot", "Sabra", "Lira", "Omdel", "Zayn"];
  const CNAME_SUF = ["", "", "", "town", "port", "field", "crossing", "reach", "gate"];
  const CTYPES = [
    { label: "displacement camp", icon: "⛺", lo: 8000, hi: 70000 },
    { label: "village", icon: "🏘️", lo: 1200, hi: 9000 },
    { label: "market town", icon: "🏙️", lo: 12000, hi: 95000 },
    { label: "city", icon: "🌆", lo: 130000, hi: 1400000 },
  ];
  const HIST = [
    "It grew up around a river crossing and has weathered {hazard} more than once.",
    "Half its families arrived in the last decade, pushed from their homes by {hazard} further inland.",
    "Its clinic and school serve a dozen smaller settlements scattered around it.",
    "Once a quiet stop on the trade road, it now anchors the whole district.",
    "Elders still tell of the year {hazard} nearly emptied the place, and of the return that followed.",
    "The market here sets prices for the region, so when it closes the hunger spreads fast.",
    "A young population, restless and connected, keeps the place looking forward.",
    "It sits at the end of the line: when the road is cut, help arrives last.",
  ];

  function fmtPop(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + " million";
    return n.toLocaleString("en-US");
  }
  function genCommunity(theatre, taken) {
    const type = rand(CTYPES);
    let name;
    let guard = 0;
    do {
      const root = rand(CNAME_ROOT);
      name = root;
      if (Math.random() < 0.5) name = rand(CNAME_PRE) + " " + name;
      const suf = rand(CNAME_SUF);
      if (suf) name = name + suf;
      guard++;
    } while (taken.indexOf(name) >= 0 && guard < 20);
    taken.push(name);
    const pop = Math.round(randInt(type.lo, type.hi) / 100) * 100;
    const tags = (theatre.tags || []);
    const hz = tags.length ? (TAG_WORD[rand(tags)] || "hard seasons") : "hard seasons";
    const hist = rand(HIST).replace("{hazard}", hz);
    return { icon: type.icon, name, typeLabel: type.label, pop, hist };
  }
  function genSource(theatre) {
    const tags = (theatre.tags && theatre.tags.length) ? theatre.tags : ["health"];
    const lead = tags[0];
    const icon = TAG_EMOJI[lead] || theatre.icon || "⚠️";
    const word = TAG_WORD[lead] || "crisis";
    const name = "The " + cap(word.split(" ").slice(-1)[0]) + " Front";
    const kind = CG.theatreKindMeta ? CG.theatreKindMeta(theatre) : null;
    const list = tags.slice(0, 3).map((t) => TAG_WORD[t]).filter(Boolean);
    let hazards = list.length === 1 ? list[0] : list.length === 2 ? list[0] + " and " + list[1] : list.slice(0, -1).join(", ") + " and " + list[list.length - 1];
    const story = `${theatre.blurb} ${kind ? kind.frame + " " : ""}This is where the crises mass before they move on the community: ${hazards}. Each wave that forms here follows the road until the team stops it.`;
    return { icon, name, story };
  }

  // =======================================================================
  // STATE
  // =======================================================================
  const S = {
    settings: { music: true, voice: true },
    theatre: null, diff: null, axis: "h",
    lives: 0, funding: 0, netRate: 0, waveNo: 0, waves: [],
    map: null,
    enemies: [], towers: [], shots: [], floats: [],
    selectedType: null, selectedTower: null, hoverCell: null, offered: [],
    phase: "prep", spawnQueue: [], spawnTimer: 0,
    speed: 1, paused: false, frozen: false,
    running: false, raf: 0, lastT: 0, time: 0,
    killed: 0, leaked: 0,
  };

  let cv = null, ctx = null, dpr = 1;
  let cell = 40, ox = 0, oy = 0, boardW = 0, boardH = 0;

  // =======================================================================
  // MAP GENERATION  (fresh every game)
  // =======================================================================
  // The crisis source and every community sit OUTSIDE the board, each on a
  // different edge (top / right / bottom / left). Roads enter from the source's
  // edge, meet at a central hub, then branch out to each community's edge, so
  // the branches fan away from one another and the whole space is used.
  function edgePos(edge) {
    return (edge === "L" || edge === "R") ? randInt(1, ROWS - 2) : randInt(1, COLS - 2);
  }
  function edgeInfo(edge, pos) {
    switch (edge) {
      case "L": return { cell: [0, pos], ext: [-1, pos], horiz: true };
      case "R": return { cell: [COLS - 1, pos], ext: [COLS, pos], horiz: true };
      case "T": return { cell: [pos, 0], ext: [pos, -1], horiz: false };
      default:  return { cell: [pos, ROWS - 1], ext: [pos, ROWS], horiz: false };
    }
  }
  // an adjacent-cell path from a to b with a single right-angle bend
  function routeL(a, b, vFirst) {
    const cells = [[a[0], a[1]]];
    if (vFirst) { pushRun(cells, a[0], a[1], a[0], b[1]); pushRun(cells, a[0], b[1], b[0], b[1]); }
    else { pushRun(cells, a[0], a[1], b[0], a[1]); pushRun(cells, b[0], a[1], b[0], b[1]); }
    return cells;
  }
  function pushRun(cells, c0, r0, c1, r1) {
    let c = c0, r = r0;
    const dc = Math.sign(c1 - c0);
    while (c !== c1) { c += dc; cells.push([c, r]); }
    const dr = Math.sign(r1 - r0);
    while (r !== r1) { r += dr; cells.push([c, r]); }
  }

  function genMap(diff) {
    const edges = ["L", "R", "T", "B"];
    for (let i = edges.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [edges[i], edges[j]] = [edges[j], edges[i]]; }
    const [cmin, cmax] = diff.comm;
    const nComm = Math.min(3, randInt(cmin, cmax));   // at most three: one edge each, plus the source
    const sourceEdge = edges[0];
    const commEdges = edges.slice(1, 1 + nComm);
    const hub = [clamp(Math.round(COLS / 2) + randInt(-1, 1), 2, COLS - 3), clamp(Math.round(ROWS / 2) + randInt(-1, 1), 1, ROWS - 2)];

    // trunk: from the source edge in to the hub (leave the edge perpendicular)
    const sI = edgeInfo(sourceEdge, edgePos(sourceEdge));
    const trunk = [sI.ext].concat(routeL(sI.cell, hub, !sI.horiz));

    const taken = [];
    const paths = [], communities = [];
    commEdges.forEach((edge) => {
      const eI = edgeInfo(edge, edgePos(edge));
      const branch = routeL(hub, eI.cell, eI.horiz);          // reach the edge perpendicular
      const cells = trunk.concat(branch.slice(1)).concat([eI.ext]);
      paths.push(cells);
      communities.push(Object.assign({ c: eI.ext[0], r: eI.ext[1], edge }, genCommunity(S.theatre, taken)));
    });

    const source = Object.assign({ c: sI.ext[0], r: sI.ext[1], edge: sourceEdge }, genSource(S.theatre));
    const pathSet = new Set();
    paths.forEach((p) => p.forEach(([c, r]) => pathSet.add(c + "," + r)));
    return { source, communities, paths, pathSet, nComm, hub };
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
      "Waves of crises march on the communities you protect. Place UN partner sectors along the roads, cover their running cost with pooled funds, and hold the line through every wave to deliver the mandate."));
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
          `<div class="tdt-icon">${t.icon}</div><div class="tdt-name">${esc(t.name)}</div>` +
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

  function pickGrid() {
    if (window.innerWidth >= window.innerHeight) { COLS = 16; ROWS = 9; S.axis = "h"; }
    else { COLS = 11; ROWS = 16; S.axis = "v"; }
  }

  function startGame(theatre, diff) {
    stop();
    S.theatre = theatre; S.diff = diff;
    pickGrid();
    S.funding = diff.funding; S.netRate = 0;
    S.waveNo = 0; S.waves = buildWaves(theatre, diff);
    S.map = genMap(diff);
    S.enemies = []; S.towers = []; S.shots = []; S.floats = [];
    S.selectedType = null; S.selectedTower = null; S.hoverCell = null;
    S.offered = computeOffered(theatre);
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
  // STAGE
  // =======================================================================
  function mountStage() {
    const root = app(); root.innerHTML = "";
    const stage = el("div", "td-stage");
    cv = document.createElement("canvas"); cv.className = "td-canvas";
    stage.appendChild(cv); ctx = cv.getContext("2d");

    const hud = el("div", "td-hud");
    hud.innerHTML =
      `<div class="td-h-left"><span class="td-theatre"><span class="tdh-ic">${S.theatre.icon}</span>${esc(S.theatre.name)}</span></div>` +
      `<div class="td-h-stats">` +
        `<span class="td-stat wave" id="td-wave">Wave 0 / ${S.diff.waves}</span>` +
        `<span class="td-stat lives" id="td-lives" title="A single crisis reaching any community loses the game">🏛️ ${S.map.communities.length} · no breach</span>` +
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
    cv.addEventListener("mouseleave", () => { S.hoverCell = null; cv && (cv.style.cursor = "default"); });
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
    const compact = w < 560;
    const padTop = compact ? 54 : 64, padBot = compact ? 116 : 96, padX = 10;
    const availW = w - padX * 2, availH = h - padTop - padBot;
    // reserve ~1.5 cells of margin on every side so the source and communities,
    // which sit one cell outside the board, and their labels have room.
    const M = 3;
    cell = Math.max(18, Math.floor(Math.min(availW / (COLS + M), availH / (ROWS + M))));
    boardW = cell * COLS; boardH = cell * ROWS;
    ox = Math.round((w - boardW) / 2);
    oy = Math.round(padTop + (availH - boardH) / 2);
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
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    S.hoverCell = cellAt(px, py);
    let cursor = "default";
    if (endpointAt(px, py) || enemyAt(px, py)) cursor = "pointer";
    else if (S.selectedType && S.hoverCell && buildable(S.hoverCell[0], S.hoverCell[1])) cursor = "crosshair";
    else if (S.hoverCell && towerAt(S.hoverCell[0], S.hoverCell[1])) cursor = "pointer";
    cv.style.cursor = cursor;
  }
  function onClick(e) {
    if (S.frozen) return;
    const rect = cv.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    // 1) source / community icons -> their story
    const ep = endpointAt(px, py);
    if (ep === "source") { showSourceCard(); return; }
    if (ep && ep.community) { showCommunityCard(ep.community, ep.idx); return; }
    // 2) a crisis on the road -> what it is
    const hitE = enemyAt(px, py);
    if (hitE) { showEnemyCard(hitE); return; }
    // 3) build / select
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
  function endpointAt(px, py) {
    const r = cell * 0.6;
    if (Math.hypot(cxOf(S.map.source.c) - px, cyOf(S.map.source.r) - py) <= r) return "source";
    for (let i = 0; i < S.map.communities.length; i++) {
      const cm = S.map.communities[i];
      if (Math.hypot(cxOf(cm.c) - px, cyOf(cm.r) - py) <= r) return { community: cm, idx: i };
    }
    return null;
  }

  // Two sectors of the SAME type may not sit within each other's radius, so the
  // same kind of partner has to be spread out across the field.
  function sameTypeConflict(type, c, r) {
    const range = BUILDINGS[type].range;
    return S.towers.some((t) => t.type === type && Math.hypot(t.c - c, t.r - r) <= range);
  }
  function placeTower(c, r) {
    const def = BUILDINGS[S.selectedType];
    if (!def) return;
    if (S.funding < def.cost) { flash("Not enough funding"); CG.Audio && CG.Audio.sfx.wah(); return; }
    if (sameTypeConflict(def.key, c, r)) { flash(`Two ${def.name} sectors cannot overlap`); CG.Audio && CG.Audio.sfx.wah(); return; }
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
  // BOTTOM BAR
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
      else money = `<span>Running cost</span><b class="neg">-${Math.round(st.upkeep)}/s</b><span>Funded</span><b class="${t.funded ? "pos" : "neg"}">${t.funded ? "yes" : (t.offline ? "offline" : "treasury")}</b>`;
      const middle = def.kind === "attack" ? `<span>Damage</span><b>${Math.round(st.dmg)}</b><span>Range</span><b>${st.range.toFixed(1)}</b>` :
        def.slowAura ? `<span>Slows</span><b>-${Math.round(def.slowAura * 100)}%</b>` :
        def.kind === "support" ? `<span>Aura</span><b>+30% dmg</b>` : ``;
      panel.innerHTML =
        `<div class="tdi-id"><span class="tdi-ic" style="--c:${def.color}">${def.icon}</span>` +
          `<div><b>${def.name}</b><small>${def.aff} · level ${t.lvl}</small></div></div>` +
        `<div class="tdi-stats">${middle}${money}</div>`;
      const acts = el("div", "tdi-acts");
      const up = el("button", "btn btn-primary sm", canUp ? `⬆ Upgrade · 💰${upgradeCost(t)}` : "Max level");
      up.disabled = !canUp; up.onclick = () => upgradeTower(t);
      const sell = el("button", "btn btn-ghost sm", `Sell · 💰${Math.round(t.spent * 0.6)}`);
      sell.onclick = () => sellTower(t);
      const close = el("button", "btn btn-ghost sm", "Close");
      close.onclick = () => { S.selectedTower = null; renderBar(); };
      acts.appendChild(up); acts.appendChild(sell); acts.appendChild(close);
      panel.appendChild(acts); bar.appendChild(panel);
      return;
    }
    const shop = el("div", "td-shop");
    (S.offered.length ? S.offered : SHOP_ORDER).forEach((k) => {
      const def = BUILDINGS[k];
      const b = el("button", "td-shopitem" + (S.selectedType === k ? " on" : ""));
      b.style.setProperty("--c", def.color);
      b.disabled = S.funding < def.cost;
      const money = def.kind === "fund" ? `<span class="tsi-run pos">+${def.income}/s</span>` : `<span class="tsi-run neg">-${def.upkeep}/s</span>`;
      b.innerHTML = `<span class="tsi-ic">${def.icon}</span><span class="tsi-nm">${def.name}</span><span class="tsi-cost">💰 ${def.cost}</span>${money}`;
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
    if (l) l.textContent = `🏛️ ${S.map.communities.length} · no breach`;
    if (f) f.textContent = `💰 ${Math.floor(S.funding)}`;
    if (rt) { const n = Math.round(S.netRate); rt.textContent = (n >= 0 ? "▲ +" : "▼ ") + n + "/s"; rt.className = "td-stat rate " + (n >= 0 ? "pos" : "neg"); }
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
    if (wave.boss) S.spawnQueue.push({ tag: rand(wave.mix), hp: wave.hp * 9, boss: true, reward: 55, comm: randInt(0, nComm - 1) });
    else for (let i = 0; i < wave.count; i++) {
      const tag = rand(wave.mix);
      S.spawnQueue.push({ tag, hp: Math.round(wave.hp * (TAG_HP[tag] || 1)), boss: false, reward: 6 + Math.round(S.waveNo * 1.2), comm: randInt(0, nComm - 1) });
    }
    S.spawnTimer = 0; S.curWave = wave;
    updateHud(); renderBar();
    CG.Audio && (wave.boss ? CG.Audio.sfx.snake() : CG.Audio.sfx.note());
    toast(wave.boss ? "A major crisis is bearing down" : `Wave ${S.waveNo} incoming`, wave.boss ? "bad" : "");
  }
  function spawnOne(spec) {
    const card = cardFor(spec.tag);
    const speed = (TAG_SPEED[spec.tag] || 1.2) * (spec.boss ? 0.62 : 1);
    const e = { card, tag: spec.tag, boss: !!spec.boss, hp: spec.hp, maxHp: spec.hp, reward: spec.reward,
      commIdx: spec.comm, seg: 0, t: 0, speed, slowT: 0, tempMul: 1, auraMul: 1, effMul: 1, prog: 0, x: 0, y: 0 };
    positionEnemy(e); S.enemies.push(e);
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
  // LOOP
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
    if (S.phase === "wave" && S.spawnQueue.length) {
      S.spawnTimer -= dt;
      if (S.spawnTimer <= 0) { spawnOne(S.spawnQueue.shift()); S.spawnTimer = S.curWave ? S.curWave.interval : 0.7; }
    }
    economy(dt);
    applyAuras();
    for (const e of S.enemies) moveEnemy(e, dt);
    for (let i = S.enemies.length - 1; i >= 0; i--) {
      const e = S.enemies[i];
      if (e.dead) { S.enemies.splice(i, 1); continue; }
      if (e.leaked) {
        S.enemies.splice(i, 1); S.leaked++;
        // a single crisis reaching any community loses the game outright
        const cm = S.map.communities[e.commIdx];
        return lose({ cm, card: e.card });
      }
    }
    for (const t of S.towers) tickTower(t, dt);
    for (let i = S.shots.length - 1; i >= 0; i--) { if (stepShot(S.shots[i], dt)) S.shots.splice(i, 1); }
    for (let i = S.floats.length - 1; i >= 0; i--) { const f = S.floats[i]; f.t += dt; if (!f.spark) f.y -= 22 * dt; if (f.t > 1.1) S.floats.splice(i, 1); }
    if (S.phase === "wave" && !S.spawnQueue.length && !S.enemies.length) waveCleared();
  }

  function economy(dt) {
    const funds = S.towers.filter((t) => BUILDINGS[t.type].kind === "fund");
    const costed = S.towers.filter((t) => BUILDINGS[t.type].upkeep > 0);
    costed.forEach((t) => { t.funded = false; t.fundedBy = null; });
    let toTreasury = 0;
    funds.forEach((f) => {
      const st = statsOf(f);
      let budget = st.income;
      const near = costed.filter((t) => !t.funded && Math.hypot(t.c - f.c, t.r - f.r) <= st.range)
        .sort((a, b) => Math.hypot(a.c - f.c, a.r - f.r) - Math.hypot(b.c - f.c, b.r - f.r));
      for (const t of near) { const up = statsOf(t).upkeep; if (budget >= up) { budget -= up; t.funded = true; t.fundedBy = f; } }
      f.surplus = budget; toTreasury += budget;
    });
    const unfunded = costed.filter((t) => !t.funded);
    const hasCash = S.funding > 0;
    let fromTreasury = 0;
    unfunded.forEach((t) => { if (hasCash) { t.offline = false; fromTreasury += statsOf(t).upkeep; } else { t.offline = true; } });
    S.towers.forEach((t) => { if (t.funded || BUILDINGS[t.type].kind === "fund" || BUILDINGS[t.type].upkeep === 0) t.offline = false; });
    const net = toTreasury - fromTreasury;
    S.netRate = net;
    S.funding = Math.max(0, S.funding + net * dt);
    updateHud();
  }

  // Early Warning slows crises in range (anticipatory action buys time).
  function applyAuras() {
    for (const e of S.enemies) e.auraMul = 1;
    for (const f of S.towers) {
      const def = BUILDINGS[f.type];
      if (!def.slowAura || f.offline) continue;
      const st = statsOf(f);
      for (const e of S.enemies) {
        if (e.dead || e.leaked) continue;
        if (Math.hypot(e.x - f.x, e.y - f.y) / cell <= st.range) e.auraMul = Math.min(e.auraMul, 1 - def.slowAura);
      }
    }
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
    let tempMul = 1;
    if (e.slowT > 0) { e.slowT -= dt; tempMul = e.tempMul; }
    e.effMul = Math.min(tempMul, e.auraMul || 1);
    const path = S.map.paths[e.commIdx];
    let remain = e.speed * e.effMul * dt;
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
    if (def.kind !== "attack" || def.fire === 0 || t.offline) return;
    t.cool -= dt;
    const st = statsOf(t);
    let best = null, bestProg = -1;
    for (const e of S.enemies) {
      if (e.dead || e.leaked) continue;
      const d = Math.hypot(e.x - t.x, e.y - t.y) / cell;
      if (d <= st.range && e.prog > bestProg) { best = e; bestProg = e.prog; }
    }
    if (best) { t.angle = Math.atan2(best.y - t.y, best.x - t.x); if (t.cool <= 0) { t.cool = st.fire; fire(t, best, st); } }
    else if (t.cool < 0) t.cool = 0;
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
      for (const e of S.enemies) { if (e.dead || e.leaked) continue; if (Math.hypot(e.x - x, e.y - y) <= rad) { damage(e, s.dmg, s.bonus); if (s.slow > 0) { e.tempMul = 1 - s.slow; e.slowT = 1.3; } } }
      spark(x, y, s.color, true);
    } else {
      const e = s.target;
      if (e && !e.dead && !e.leaked) { damage(e, s.dmg, s.bonus); if (s.slow > 0) { e.tempMul = 1 - s.slow; e.slowT = 1.3; } }
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
    drawEndpoints();
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
    ctx.strokeStyle = "rgba(40,80,130,0.055)"; ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(ox + c * cell, oy); ctx.lineTo(ox + c * cell, oy + boardH); ctx.stroke(); }
    for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(ox, oy + r * cell); ctx.lineTo(ox + boardW, oy + r * cell); ctx.stroke(); }
  }
  function strokePath(path, width) {
    ctx.beginPath();
    path.forEach(([c, r], i) => { const x = cxOf(c), y = cyOf(r); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.lineWidth = width; ctx.stroke();
  }
  function drawPaths() {
    // butt caps so the road ends flush (no rounded stub); round joins keep the
    // corners smooth. The ends tuck under the round source / community icons.
    ctx.lineJoin = "round"; ctx.lineCap = "butt";
    ctx.strokeStyle = "rgba(90,70,40,0.18)"; S.map.paths.forEach((p) => strokePath(p, cell * 0.84)); // soft casing
    ctx.strokeStyle = "#b98f57"; S.map.paths.forEach((p) => strokePath(p, cell * 0.72));             // dark edge
    ctx.strokeStyle = "#e7d0a2"; S.map.paths.forEach((p) => strokePath(p, cell * 0.52));             // road body
    ctx.setLineDash([cell * 0.16, cell * 0.24]);
    ctx.strokeStyle = "rgba(255,255,255,0.65)"; S.map.paths.forEach((p) => strokePath(p, 2));         // centre line
    ctx.setLineDash([]);
  }
  function drawEndpoints() {
    const src = S.map.source;
    drawPad(src.c, src.r, src.icon, "#e5564b", "#fbe4e1");
    drawLabel(src.c, src.r, src.name, "#b23b34", src.edge);
    S.map.communities.forEach((cm) => {
      drawPad(cm.c, cm.r, cm.icon, "#2f6bff", "#e6efff");
      drawLabel(cm.c, cm.r, cm.name, "#1f56d6", cm.edge);
    });
  }
  // round icon: a filled circle with a coloured ring, the emoji, and an "i" hint
  function drawPad(c, r, emoji, ring, bg) {
    const x = cxOf(c), y = cyOf(r), rad = cell * 0.46;
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fillStyle = bg; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = ring; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.stroke();
    ctx.font = `${Math.round(cell * 0.5)}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(emoji, x, y + 1);
    const ix = x + rad * 0.72, iy = y - rad * 0.72;
    ctx.beginPath(); ctx.arc(ix, iy, 6, 0, Math.PI * 2); ctx.fillStyle = ring; ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "700 9px Inter, sans-serif"; ctx.fillText("i", ix, iy + 0.5);
  }
  function drawLabel(c, r, text, color, edge) {
    const cx = cxOf(c);
    // put the name on the outward side so it never sits over the board
    let y = cyOf(r) + cell * 0.62;
    if (edge === "T") y = cyOf(r) - cell * 0.62;
    ctx.font = "700 11px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const boxW = Math.min(ctx.measureText(text).width + 12, cell * 3);
    const scrW = cv.width / dpr;
    const x = clamp(cx, boxW / 2 + 2, scrW - boxW / 2 - 2);
    ctx.fillStyle = "rgba(255,255,255,0.92)"; roundRect(x - boxW / 2, y - 8, boxW, 16, 8); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 1; roundRect(x - boxW / 2, y - 8, boxW, 16, 8); ctx.stroke();
    ctx.fillStyle = color; ctx.fillText(text, x, y + 1);
  }
  function drawBuildHints() {
    // when a sector is picked, show the exclusion rings of same-type sectors
    if (S.selectedType) {
      const rng = BUILDINGS[S.selectedType].range * cell;
      for (const o of S.towers) {
        if (o.type !== S.selectedType) continue;
        ctx.beginPath(); ctx.arc(o.x, o.y, rng, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(229,86,75,0.07)"; ctx.fill();
        ctx.strokeStyle = "rgba(229,86,75,0.4)"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    const hc = S.hoverCell;
    if (hc && S.selectedType) {
      const [c, r] = hc;
      const ok = buildable(c, r) && !towerAt(c, r) && S.funding >= BUILDINGS[S.selectedType].cost && !sameTypeConflict(S.selectedType, c, r);
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
          ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2); ctx.fillStyle = "#2f9e54"; ctx.fill();
        }
      });
    });
  }
  function drawTowers() {
    for (const t of S.towers) {
      const def = BUILDINGS[t.type];
      const x = t.x, y = t.y, s = cell * 0.78, off = t.offline;
      ctx.globalAlpha = off ? 0.45 : 1;
      ctx.fillStyle = "#ffffff"; roundRect(x - s / 2, y - s / 2, s, s, 9); ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = def.color; roundRect(x - s / 2, y - s / 2, s, s, 9); ctx.stroke();
      if (def.kind === "support" || def.kind === "fund") {
        ctx.beginPath(); ctx.arc(x, y, s * 0.62, 0, Math.PI * 2);
        ctx.strokeStyle = def.kind === "fund" ? "rgba(47,158,84,0.4)" : hexA(def.color, 0.4);
        ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.font = `${Math.round(cell * 0.44)}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(def.icon, x, y + 1);
      for (let i = 0; i < t.lvl; i++) { ctx.beginPath(); ctx.arc(x - s / 2 + 7 + i * 8, y + s / 2 - 6, 3, 0, Math.PI * 2); ctx.fillStyle = def.color; ctx.fill(); }
      ctx.globalAlpha = 1;
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
      ctx.lineWidth = 2; ctx.strokeStyle = (e.effMul < 1) ? "#11aecb" : "rgba(255,255,255,0.7)"; ctx.stroke();
      ctx.font = `${Math.round(rad * 1.3)}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(e.card.icon, e.x, e.y + 1);
      const bw = rad * 2.2, bh = 4, bx = e.x - bw / 2, by = e.y - rad - 8;
      ctx.fillStyle = "rgba(0,0,0,0.25)"; roundRect(bx, by, bw, bh, 2); ctx.fill();
      ctx.fillStyle = e.boss ? "#ef9f25" : "#2f9e54"; roundRect(bx, by, bw * clamp(e.hp / e.maxHp, 0, 1), bh, 2); ctx.fill();
    }
  }
  function drawShots() { for (const s of S.shots) { ctx.beginPath(); ctx.arc(s.x, s.y, s.splash > 0 ? 5 : 3.5, 0, Math.PI * 2); ctx.fillStyle = s.color; ctx.fill(); } }
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
  function openCard(kind, band, icon, title, sub, body, factLabel, factBody, spoken, freeze) {
    if (freeze) S.frozen = true;
    const over = el("div", "overlay-card");
    const c = el("div", `event-card ${kind}`);
    c.innerHTML =
      `<div class="ec-band">${band}</div>` +
      `<div class="ec-icon">${icon}</div>` +
      `<div class="ec-title">${title}</div>` +
      (sub ? `<div class="ec-move">${sub}</div>` : "") +
      `<div class="ec-why">${body}</div>` +
      (factBody ? `<div class="ec-fact"><span>${factLabel}</span>${factBody}</div>` : "");
    const actions = el("div", "ec-actions");
    const speak = el("button", "btn btn-ghost", "🔊 Read aloud");
    speak.onclick = () => CG.Narrate && CG.Narrate.speak(spoken);
    const go = el("button", "btn btn-primary", "Back to the line ▸");
    const done = () => { CG.Narrate && CG.Narrate.stop(); if (freeze) S.frozen = false; over.classList.remove("show"); setTimeout(() => over.remove(), 250); };
    go.onclick = done;
    actions.appendChild(speak); actions.appendChild(go);
    c.appendChild(actions); over.appendChild(c); app().appendChild(over);
    requestAnimationFrame(() => over.classList.add("show"));
    CG.Narrate && CG.Narrate.auto(spoken);
  }

  function introCard() {
    const kind = CG.theatreKindMeta ? CG.theatreKindMeta(S.theatre) : null;
    const story = CG.theatreStory ? CG.theatreStory(S.theatre) : S.theatre.blurb;
    const nc = S.map.communities.length;
    const commLine = (nc === 1 ? "One community depends on you" : `${nc} communities depend on you, each at the end of its own road`) + ". Not one crisis may reach a community: a single breach loses the mandate.";
    const sectorNames = S.offered.map((k) => `${BUILDINGS[k].icon} ${BUILDINGS[k].name}`).join(", ");
    openCard("note", "YOUR POSTING", S.theatre.icon, esc(S.theatre.name),
      (kind ? `${kind.icon} ${kind.label} · ${nc} communit${nc > 1 ? "ies" : "y"}` : ""),
      esc(story), "How to play",
      `${commLine} This posting fields the sectors its crises call for: ${sectorNames}. Spend Funding to place them along the roads; every partner has a running cost, so keep a Pooled Fund nearby to pay it. Tap the crisis source, any community, or any crisis to learn about it. Hold the line through all ${S.diff.waves} waves to deliver the mandate.`,
      `Your posting. ${S.theatre.name}. ${story}`, false);
  }
  function showSourceCard() {
    const src = S.map.source;
    openCard("snake", "THE CRISIS SOURCE", src.icon, esc(src.name), "Where the waves form",
      esc(src.story), null, null, `${src.name}. ${src.story}`, true);
  }
  function showCommunityCard(cm, i) {
    openCard("trophy", "A COMMUNITY YOU PROTECT", cm.icon, esc(cm.name),
      `${cap(cm.typeLabel)} · about ${fmtPop(cm.pop)} people`,
      esc(cm.hist), "Why it matters",
      "Every crisis that reaches it costs the whole response. This is what the line is for.",
      `${cm.name}. A ${cm.typeLabel} of about ${fmtPop(cm.pop)} people. ${cm.hist}`, true);
  }
  function showEnemyCard(e) {
    const card = e.card;
    openCard("snake", "A CRISIS ON THE ROAD", card.icon, esc(card.title),
      `${e.boss ? "Major crisis" : "Crisis"} · ${esc(e.tag)}`,
      esc(card.why), "Side fact", esc(card.fact), `${card.title}. ${card.why}`, true);
  }
  function betweenCard() {
    const wave = S.curWave;
    const card = cardFor(wave && wave.mix ? rand(wave.mix) : "any");
    const over = el("div", "overlay-card");
    const c = el("div", "event-card snake");
    c.innerHTML =
      `<div class="ec-band">WAVE ${S.waveNo} HELD</div><div class="ec-icon">${card.icon}</div>` +
      `<div class="ec-title">${esc(card.title)}</div><div class="ec-why">${esc(card.why)}</div>` +
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
      `You held ${esc(S.theatre.name)} through every wave without a single crisis reaching a community. ${S.killed} contained, ${nc} communit${nc > 1 ? "ies" : "y"} untouched. Mandate delivered.`,
      "Mandate delivered");
    CG.Narrate && CG.Narrate.auto(`The line holds. You held ${S.theatre.name} through every wave. The mandate is delivered.`);
  }
  function lose(breach) {
    S.phase = "over";
    if (S.settings.music && CG.Audio) { CG.Audio.sfx.lose(); CG.Audio.sfx.wah(); }
    const where = breach ? `${esc(breach.card.title)} reached ${esc(breach.cm.name)}` : `${esc(S.theatre.name)} was overrun`;
    endCard("snake", (breach && breach.card.icon) || "🌊", "A community is breached",
      `${where} at wave ${S.waveNo} of ${S.diff.waves}. One crisis through the line loses the mandate: the response contained ${S.killed} before it, and regroups to try again.`,
      "The line breaks");
    CG.Narrate && CG.Narrate.auto(`${breach ? breach.card.title + " reached " + breach.cm.name + "." : "A community is overrun."} One crisis through the line loses the mandate. The response will regroup and try again.`);
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

  CG.TowerDefense._t = {
    S,
    step: (dt, n) => { for (let i = 0; i < (n || 1); i++) update(dt || 1 / 60); },
    place: (type, c, r) => { S.selectedType = type; placeTower(c, r); return towerAt(c, r); },
    setAxis: (ax) => { S.axis = ax; if (ax === "h") { COLS = 16; ROWS = 9; } else { COLS = 11; ROWS = 16; } },
    startWave, statsOf, economy, applyAuras, draw, resize, buildable, genMap, computeOffered, BUILDINGS,
    dims: () => ({ COLS, ROWS, axis: S.axis }),
  };
})();
