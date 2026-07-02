/* =========================================================================
 * COMMON GROUND, HOLD THE LINE,  td.js
 * The second game: a Tower Defense for a UN Country Team. Waves of named
 * crises (the same field crises as The Long Road, CG.SNAKE_CARDS) march down a
 * road toward a community you protect. You spend Funding to place UN partner
 * agencies along the road; each one works the crises that pass. Let a crisis
 * reach the community and you lose Resilience. Hold the line through every wave
 * and the mandate is delivered.
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
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // ---- map geometry ------------------------------------------------------
  // A serpentine road across a COLS x ROWS grid. Waypoints only ever change one
  // axis at a time, so the road expands cleanly into a chain of adjacent cells.
  const COLS = 16, ROWS = 9;
  const WAYPOINTS = [
    [0, 1], [14, 1], [14, 3], [1, 3], [1, 5], [14, 5], [14, 7], [15, 7],
  ];
  function buildPath(wps) {
    const cells = [];
    for (let i = 0; i < wps.length - 1; i++) {
      let [c0, r0] = wps[i];
      const [c1, r1] = wps[i + 1];
      const dc = Math.sign(c1 - c0), dr = Math.sign(r1 - r0);
      if (i === 0) cells.push([c0, r0]);
      while (c0 !== c1 || r0 !== r1) { c0 += dc; r0 += dr; cells.push([c0, r0]); }
    }
    return cells;
  }
  const PATH = buildPath(WAYPOINTS);
  const PATH_SET = new Set(PATH.map(([c, r]) => c + "," + r));
  const END = PATH[PATH.length - 1];
  const START = PATH[0];

  // ---- towers: UN partner archetypes ------------------------------------
  // bonus: crisis tags this partner is especially effective against (x mult).
  const TOWERS = {
    health: {
      key: "health", icon: "🏥", name: "Health Response", aff: "WHO / UNICEF",
      color: "#11aecb", cost: 90, range: 2.7, fire: 0.55, dmg: 15, splash: 0, slow: 0,
      bonus: ["health"],
      desc: "Fast, close-range care. Cuts down disease outbreaks the quickest.",
    },
    logistics: {
      key: "logistics", icon: "🚚", name: "Logistics Cluster", aff: "WFP",
      color: "#ef9f25", cost: 120, range: 2.3, fire: 1.15, dmg: 20, splash: 1.15, slow: 0.35,
      bonus: ["supply", "access", "flood", "storm"],
      desc: "Slows and hits a whole cluster at once. Reopens the blocked road.",
    },
    protection: {
      key: "protection", icon: "🛡️", name: "Protection & Peace", aff: "UNHCR / DPO",
      color: "#7c4dff", cost: 160, range: 3.5, fire: 1.0, dmg: 52, splash: 0, slow: 0,
      bonus: ["displacement", "governance", "access"],
      desc: "Long reach, heavy single hits. Holds the line against conflict.",
    },
    coord: {
      key: "coord", icon: "🧭", name: "Coordination Hub", aff: "OCHA / RCO",
      color: "#2f6bff", cost: 110, range: 2.6, fire: 0, dmg: 0, splash: 0, slow: 0,
      bonus: [], support: true,
      desc: "No attack. Delivering as One: +30% damage, +15% range to nearby partners.",
    },
    recovery: {
      key: "recovery", icon: "🌐", name: "Recovery & Resilience", aff: "UNDP",
      color: "#2f9e54", cost: 130, range: 2.1, fire: 1.4, dmg: 11, splash: 0, slow: 0,
      bonus: ["climate", "drought", "funding", "data"], income: 3,
      desc: "Light attack, and earns +3 Funding every second. Pays for the response.",
    },
  };
  const TOWER_ORDER = ["health", "logistics", "protection", "coord", "recovery"];

  // ---- difficulty --------------------------------------------------------
  const DIFF = {
    steady:        { key: "steady",        label: "Steady",        lives: 25, funding: 360, hpMul: 0.82, waves: 10 },
    testing:       { key: "testing",       label: "Testing",       lives: 20, funding: 300, hpMul: 1.0,  waves: 12 },
    overstretched: { key: "overstretched", label: "Overstretched", lives: 15, funding: 260, hpMul: 1.28, waves: 14 },
  };

  // Per-tag pace and toughness of a crisis. Fast/fragile vs slow/tanky.
  const TAG_SPEED = {
    health: 1.5, info: 1.7, data: 1.6, displacement: 1.3, access: 1.2,
    flood: 1.1, storm: 1.45, drought: 1.0, climate: 1.15, supply: 1.2,
    governance: 1.2, funding: 1.3, any: 1.35,
  };
  const TAG_HP = {
    drought: 1.3, governance: 1.25, climate: 1.15, funding: 1.1,
    health: 0.82, info: 0.8, data: 0.85, storm: 0.9,
  };

  // Crisis cards grouped by tag, so a wave can be themed to a theatre.
  let CARDS_BY_TAG = null;
  function indexCards() {
    if (CARDS_BY_TAG) return;
    CARDS_BY_TAG = {};
    (CG.SNAKE_CARDS || []).forEach((c) => {
      (CARDS_BY_TAG[c.tag] = CARDS_BY_TAG[c.tag] || []).push(c);
    });
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
    lives: 0, funding: 0, waveNo: 0, waves: [],
    enemies: [], towers: [], shots: [], floats: [],
    selectedType: null,     // a tower to place from the shop
    selectedTower: null,    // a placed tower being inspected
    hoverCell: null,
    phase: "prep",          // prep | wave | over
    spawnQueue: [], spawnTimer: 0,
    speed: 1, paused: false,
    running: false, raf: 0, lastT: 0, incomeAcc: 0,
    killed: 0, leaked: 0,
  };

  // canvas + geometry (recomputed on resize)
  let cv = null, ctx = null, dpr = 1;
  let cell = 40, ox = 0, oy = 0, boardW = 0, boardH = 0;

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
      "Waves of crises march on the community you protect. Place UN partners along the road, work every crisis that passes, and hold the line through every wave to deliver the mandate."));

    const toggles = el("div", "toggle-row");
    toggles.appendChild(toggle("🎵 Music", S.settings.music, (on) => { S.settings.music = on; CG.Audio && CG.Audio.setMuted(!on); }));
    toggles.appendChild(toggle("🗣️ Narration", S.settings.voice, (on) => { S.settings.voice = on; CG.Narrate && CG.Narrate.setEnabled(on); }));
    wrap.appendChild(toggles);

    const go = el("button", "btn btn-primary big", "Choose a posting ▸");
    go.style.marginTop = "22px";
    go.onclick = () => { CG.Audio && CG.Audio.sfx.click(); renderSelect(); };
    wrap.appendChild(go);

    wrap.appendChild(el("p", "credit",
      "Music and narration are generated live in your browser. No downloads, no accounts."));
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

  // ---- posting select: pick a theatre + difficulty ----------------------
  function renderSelect() {
    const picks = shuffleN(CG.THEATRES || [], 3);
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
    wrap.appendChild(el("p", "tagline", "Each theatre sends the crises it is prone to. Choose where to make your stand."));

    const row = el("div", "td-theatre-row");
    function paint() {
      row.querySelectorAll(".td-tcard").forEach((c, i) => c.classList.toggle("on", picks[i] === chosen));
    }
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
    wrap.appendChild(row);
    paint();

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
      // tag mix: mostly this theatre's own hazards, seasoned with general ones
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
    S.lives = diff.lives; S.funding = diff.funding;
    S.waveNo = 0; S.waves = buildWaves(theatre, diff);
    S.enemies = []; S.towers = []; S.shots = []; S.floats = [];
    S.selectedType = null; S.selectedTower = null; S.hoverCell = null;
    S.phase = "prep"; S.spawnQueue = []; S.spawnTimer = 0;
    S.speed = 1; S.paused = false; S.incomeAcc = 0;
    S.killed = 0; S.leaked = 0;

    if (S.settings.music && CG.Audio) CG.Audio.start();
    CG.Narrate && CG.Narrate.setEnabled(S.settings.voice);

    mountStage();
    loop();
    introCard();
  }

  // =======================================================================
  // STAGE: canvas + HUD
  // =======================================================================
  function mountStage() {
    const root = app(); root.innerHTML = "";
    const stage = el("div", "td-stage");

    cv = document.createElement("canvas");
    cv.className = "td-canvas";
    stage.appendChild(cv);
    ctx = cv.getContext("2d");

    // top HUD
    const hud = el("div", "td-hud");
    hud.innerHTML =
      `<div class="td-h-left">` +
        `<span class="td-theatre"><span class="tdh-ic">${S.theatre.icon}</span>${esc(S.theatre.name)}</span>` +
      `</div>` +
      `<div class="td-h-stats">` +
        `<span class="td-stat wave" id="td-wave">Wave 0 / ${S.diff.waves}</span>` +
        `<span class="td-stat lives" id="td-lives">❤ ${S.lives}</span>` +
        `<span class="td-stat funds" id="td-funds">💰 ${S.funding}</span>` +
      `</div>` +
      `<div class="td-h-right">` +
        `<button class="td-ic-btn" id="td-speed" title="Speed">▶▶ 1×</button>` +
        `<button class="td-ic-btn" id="td-pause" title="Pause">⏸</button>` +
        `<button class="td-ic-btn danger" id="td-quit" title="Quit to menu">✕</button>` +
      `</div>`;
    stage.appendChild(hud);

    // bottom bar: shop or the selected-tower inspector
    const bar = el("div", "td-bar", "");
    bar.id = "td-bar";
    stage.appendChild(bar);

    root.appendChild(stage);

    // wire HUD
    hud.querySelector("#td-speed").onclick = () => { S.speed = S.speed === 1 ? 2 : (S.speed === 2 ? 3 : 1); syncSpeed(); CG.Audio && CG.Audio.sfx.click(); };
    hud.querySelector("#td-pause").onclick = () => { S.paused = !S.paused; syncSpeed(); CG.Audio && CG.Audio.sfx.click(); };
    hud.querySelector("#td-quit").onclick = () => quit();

    // canvas interaction
    cv.addEventListener("mousemove", onHover);
    cv.addEventListener("mouseleave", () => { S.hoverCell = null; });
    cv.addEventListener("click", onClick);

    window.addEventListener("resize", resize);
    resize();
    renderBar();
    syncSpeed();
  }

  function resize() {
    if (!cv) return;
    const stage = cv.parentElement;
    // The stage is full-viewport (100vw / 100dvh). Prefer the window size as the
    // source of truth: clientWidth/Height can read 0 before first layout.
    const w = stage.clientWidth || window.innerWidth;
    const h = stage.clientHeight || window.innerHeight;
    dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = w + "px"; cv.style.height = h + "px";
    // fit the grid, leaving room for the HUD (top) and bar (bottom)
    const padTop = 64, padBot = 96, padX = 12;
    const availW = w - padX * 2, availH = h - padTop - padBot;
    cell = Math.max(24, Math.floor(Math.min(availW / COLS, availH / ROWS)));
    boardW = cell * COLS; boardH = cell * ROWS;
    ox = Math.round((w - boardW) / 2);
    oy = Math.round(padTop + (availH - boardH) / 2);
  }

  function syncSpeed() {
    const sb = document.getElementById("td-speed");
    const pb = document.getElementById("td-pause");
    if (sb) sb.textContent = "▶▶ " + S.speed + "×";
    if (pb) { pb.textContent = S.paused ? "▶" : "⏸"; pb.classList.toggle("on", S.paused); }
  }

  // ---- coordinate helpers -----------------------------------------------
  const cxOf = (c) => ox + (c + 0.5) * cell;
  const cyOf = (r) => oy + (r + 0.5) * cell;
  function cellAt(px, py) {
    const c = Math.floor((px - ox) / cell), r = Math.floor((py - oy) / cell);
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return null;
    return [c, r];
  }
  const buildable = (c, r) => !PATH_SET.has(c + "," + r);
  function towerAt(c, r) { return S.towers.find((t) => t.c === c && t.r === r) || null; }

  // =======================================================================
  // INPUT
  // =======================================================================
  function onHover(e) {
    const rect = cv.getBoundingClientRect();
    S.hoverCell = cellAt(e.clientX - rect.left, e.clientY - rect.top);
  }
  function onClick(e) {
    const rect = cv.getBoundingClientRect();
    const cellHit = cellAt(e.clientX - rect.left, e.clientY - rect.top);
    if (!cellHit) { S.selectedTower = null; S.selectedType = null; renderBar(); return; }
    const [c, r] = cellHit;
    const existing = towerAt(c, r);
    if (existing) { S.selectedTower = existing; S.selectedType = null; renderBar(); return; }
    if (S.selectedType && buildable(c, r)) return placeTower(c, r);
    // clicked empty ground with nothing selected: clear inspector
    S.selectedTower = null; renderBar();
  }

  function placeTower(c, r) {
    const def = TOWERS[S.selectedType];
    if (!def) return;
    if (S.funding < def.cost) { flash("Not enough funding"); CG.Audio && CG.Audio.sfx.wah(); return; }
    S.funding -= def.cost;
    const t = { type: def.key, c, r, x: cxOf(c), y: cyOf(r), lvl: 1, cool: 0, angle: -Math.PI / 2, spent: def.cost };
    S.towers.push(t);
    S.selectedTower = t; S.selectedType = null;
    CG.Audio && CG.Audio.sfx.pick();
    updateHud(); renderBar();
  }

  // effective stats for a tower, folding in level and any Coordination aura.
  function statsOf(t) {
    const def = TOWERS[t.type];
    const lvlMul = 1 + (t.lvl - 1) * 0.45;
    let dmg = def.dmg * lvlMul;
    let range = def.range + (t.lvl - 1) * 0.35;
    // Coordination Hub aura: Delivering as One.
    if (!def.support) {
      let buffed = false;
      for (const o of S.towers) {
        if (o === t || o.type !== "coord") continue;
        const orange = TOWERS.coord.range + (o.lvl - 1) * 0.35;
        if (Math.hypot(o.c - t.c, o.r - t.r) <= orange) buffed = true;
      }
      if (buffed) { dmg *= 1.3; range += 0.15 * def.range; }
    }
    return { def, dmg, range, fire: def.fire, splash: def.splash, slow: def.slow };
  }

  function upgradeCost(t) { return Math.round(TOWERS[t.type].cost * 0.8 * t.lvl); }

  function upgradeTower(t) {
    if (t.lvl >= 3) return;
    const cost = upgradeCost(t);
    if (S.funding < cost) { flash("Not enough funding"); CG.Audio && CG.Audio.sfx.wah(); return; }
    S.funding -= cost; t.lvl++; t.spent += cost;
    CG.Audio && CG.Audio.sfx.pick();
    updateHud(); renderBar();
  }
  function sellTower(t) {
    const refund = Math.round(t.spent * 0.6);
    S.funding += refund;
    S.towers = S.towers.filter((x) => x !== t);
    if (S.selectedTower === t) S.selectedTower = null;
    CG.Audio && CG.Audio.sfx.click();
    updateHud(); renderBar();
  }

  // =======================================================================
  // BOTTOM BAR: shop, or the selected-tower inspector
  // =======================================================================
  function renderBar() {
    const bar = document.getElementById("td-bar");
    if (!bar) return;
    bar.innerHTML = "";

    if (S.selectedTower) {
      const t = S.selectedTower, st = statsOf(t), def = st.def;
      const panel = el("div", "td-inspect");
      const canUp = t.lvl < 3;
      panel.innerHTML =
        `<div class="tdi-id"><span class="tdi-ic" style="--c:${def.color}">${def.icon}</span>` +
          `<div><b>${def.name}</b><small>${def.aff} · level ${t.lvl}</small></div></div>` +
        `<div class="tdi-stats">` +
          (def.support
            ? `<span>Aura</span><b>+30% dmg</b>`
            : `<span>Damage</span><b>${Math.round(st.dmg)}</b><span>Range</span><b>${st.range.toFixed(1)}</b>`) +
          (def.income ? `<span>Income</span><b>+${def.income}/s</b>` : "") +
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

    // shop
    const shop = el("div", "td-shop");
    TOWER_ORDER.forEach((k) => {
      const def = TOWERS[k];
      const b = el("button", "td-shopitem" + (S.selectedType === k ? " on" : ""));
      b.style.setProperty("--c", def.color);
      b.disabled = S.funding < def.cost;
      b.innerHTML =
        `<span class="tsi-ic">${def.icon}</span>` +
        `<span class="tsi-nm">${def.name}</span>` +
        `<span class="tsi-cost">💰 ${def.cost}</span>`;
      b.onclick = () => {
        S.selectedType = (S.selectedType === k ? null : k);
        S.selectedTower = null;
        CG.Audio && CG.Audio.sfx.click();
        renderBar();
      };
      // hover explains the archetype
      b.title = def.desc;
      shop.appendChild(b);
    });
    bar.appendChild(shop);

    // wave control lives on the right of the shop
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
    if (w) w.textContent = `Wave ${S.waveNo} / ${S.diff.waves}`;
    if (l) l.textContent = `❤ ${S.lives}`;
    if (f) f.textContent = `💰 ${Math.floor(S.funding)}`;
  }

  // =======================================================================
  // WAVES
  // =======================================================================
  function startWave() {
    if (S.phase !== "prep") return;
    S.waveNo++;
    const wave = S.waves[S.waveNo - 1];
    S.phase = "wave";
    S.spawnQueue = [];
    if (wave.boss) {
      const tag = rand(wave.mix);
      S.spawnQueue.push({ tag, hp: wave.hp * 9, boss: true, reward: 55 });
    } else {
      for (let i = 0; i < wave.count; i++) {
        const tag = rand(wave.mix);
        S.spawnQueue.push({ tag, hp: Math.round(wave.hp * (TAG_HP[tag] || 1)), boss: false, reward: 6 + Math.round(S.waveNo * 1.2) });
      }
    }
    S.spawnTimer = 0;
    S.curWave = wave;
    updateHud(); renderBar();
    CG.Audio && (wave.boss ? CG.Audio.sfx.snake() : CG.Audio.sfx.note());
    toast(wave.boss ? "A major crisis is bearing down" : `Wave ${S.waveNo} incoming`, wave.boss ? "bad" : "");
  }

  function spawnOne(spec) {
    const card = cardFor(spec.tag);
    const speed = (TAG_SPEED[spec.tag] || 1.2) * (spec.boss ? 0.62 : 1);
    S.enemies.push({
      card, tag: spec.tag, boss: !!spec.boss,
      hp: spec.hp, maxHp: spec.hp, reward: spec.reward,
      seg: 0, t: 0, speed, slowT: 0, slowMul: 1,
      x: cxOf(START[0]), y: cyOf(START[1]),
    });
  }

  function waveCleared() {
    S.phase = "prep";
    const bonus = 20 + S.waveNo * 6;
    S.funding += bonus;
    floatText(cxOf(END[0]), cyOf(END[1]) - cell, "+" + bonus + " funding", "#2f9e54");
    updateHud();
    if (S.waveNo >= S.diff.waves) return win();
    renderBar();
    // Every second wave, a field fact between waves (spoken if narration on).
    if (S.waveNo % 2 === 0 || (S.curWave && S.curWave.boss)) betweenCard();
  }

  // =======================================================================
  // GAME LOOP
  // =======================================================================
  function loop() {
    S.running = true;
    S.lastT = performance.now();
    const frame = (now) => {
      if (!S.running) return;
      let dt = (now - S.lastT) / 1000;
      S.lastT = now;
      dt = Math.min(dt, 0.05);
      if (!S.paused) {
        const steps = S.speed;
        for (let i = 0; i < steps; i++) update(dt);
      }
      draw();
      S.raf = requestAnimationFrame(frame);
    };
    S.raf = requestAnimationFrame(frame);
  }

  function update(dt) {
    // spawn
    if (S.phase === "wave" && S.spawnQueue.length) {
      S.spawnTimer -= dt;
      if (S.spawnTimer <= 0) {
        spawnOne(S.spawnQueue.shift());
        S.spawnTimer = S.curWave ? S.curWave.interval : 0.7;
      }
    }

    // recovery-tower income
    let income = 0;
    for (const t of S.towers) { const d = TOWERS[t.type]; if (d.income) income += d.income; }
    if (income) { S.incomeAcc += income * dt; if (S.incomeAcc >= 1) { const add = Math.floor(S.incomeAcc); S.funding += add; S.incomeAcc -= add; updateHud(); if (S.selectedType) maybeReshop(); } }

    // enemies
    for (const e of S.enemies) moveEnemy(e, dt);
    // remove dead / leaked
    for (let i = S.enemies.length - 1; i >= 0; i--) {
      const e = S.enemies[i];
      if (e.dead) { S.enemies.splice(i, 1); continue; }
      if (e.leaked) {
        S.enemies.splice(i, 1);
        const cost = e.boss ? 5 : 1;
        S.lives -= cost; S.leaked++;
        floatText(cxOf(END[0]), cyOf(END[1]), "-" + cost + " ❤", "#e5564b");
        CG.Audio && CG.Audio.sfx.wah();
        updateHud();
        if (S.lives <= 0) { S.lives = 0; return lose(); }
      }
    }

    // towers fire
    for (const t of S.towers) tickTower(t, dt);

    // projectiles
    for (let i = S.shots.length - 1; i >= 0; i--) {
      if (stepShot(S.shots[i], dt)) S.shots.splice(i, 1);
    }

    // floating text
    for (let i = S.floats.length - 1; i >= 0; i--) {
      const f = S.floats[i]; f.t += dt; f.y -= 22 * dt;
      if (f.t > 1.1) S.floats.splice(i, 1);
    }

    // wave end: all spawned and all gone
    if (S.phase === "wave" && !S.spawnQueue.length && !S.enemies.length) waveCleared();
  }

  // If income changed affordability while the shop is open, refresh disabled states.
  let reshopAcc = 0;
  function maybeReshop() { reshopAcc++; if (reshopAcc % 20 === 0) renderBar(); }

  function moveEnemy(e, dt) {
    if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slowMul = 1; }
    const spd = e.speed * e.slowMul; // cells per second
    let remain = spd * dt;
    while (remain > 0 && e.seg < PATH.length - 1) {
      const a = PATH[e.seg], b = PATH[e.seg + 1];
      const segLen = 1; // adjacent cells are one apart
      const step = Math.min(remain, segLen - e.t);
      e.t += step; remain -= step;
      if (e.t >= segLen - 1e-6) { e.seg++; e.t = 0; }
    }
    if (e.seg >= PATH.length - 1) { e.leaked = true; e.x = cxOf(END[0]); e.y = cyOf(END[1]); return; }
    const a = PATH[e.seg], b = PATH[e.seg + 1];
    e.x = cxOf(a[0] + (b[0] - a[0]) * e.t);
    e.y = cyOf(a[1] + (b[1] - a[1]) * e.t);
    e.prog = e.seg + e.t; // for "furthest along" targeting
  }

  function tickTower(t, dt) {
    const def = TOWERS[t.type];
    if (def.support || def.fire === 0) return;
    t.cool -= dt;
    const st = statsOf(t);
    // aim at the enemy furthest along the path, within range
    let best = null, bestProg = -1;
    for (const e of S.enemies) {
      if (e.dead || e.leaked) continue;
      const d = Math.hypot(e.x - t.x, e.y - t.y) / cell;
      if (d <= st.range && (e.prog || 0) > bestProg) { best = e; bestProg = e.prog || 0; }
    }
    if (best) {
      t.angle = Math.atan2(best.y - t.y, best.x - t.x);
      if (t.cool <= 0) {
        t.cool = st.fire;
        fire(t, best, st);
      }
    } else if (t.cool < 0) t.cool = 0;
  }

  function fire(t, target, st) {
    const def = TOWERS[t.type];
    S.shots.push({
      x: t.x, y: t.y, target, color: def.color,
      dmg: st.dmg, splash: st.splash, slow: st.slow, bonus: def.bonus,
      speed: 12 * cell, life: 0,
    });
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
    if (d <= step || s.life > 1.5) {
      hit(s, tx, ty);
      return true;
    }
    s.x += (dx / d) * step; s.y += (dy / d) * step;
    return false;
  }

  function damage(e, base, bonusTags) {
    let dmg = base;
    if (bonusTags && bonusTags.indexOf(e.tag) >= 0) dmg *= 1.7;
    e.hp -= dmg;
    if (e.hp <= 0 && !e.dead) {
      e.dead = true; S.killed++;
      S.funding += e.reward;
      floatText(e.x, e.y, "+" + e.reward, "#2f9e54");
      updateHud();
      if (e.boss) CG.Audio && CG.Audio.sfx.ladder();
      if (S.selectedType) maybeReshop();
    }
  }

  function hit(s, x, y) {
    if (s.splash > 0) {
      const rad = s.splash * cell;
      for (const e of S.enemies) {
        if (e.dead || e.leaked) continue;
        if (Math.hypot(e.x - x, e.y - y) <= rad) {
          damage(e, s.dmg, s.bonus);
          if (s.slow > 0) { e.slowMul = 1 - s.slow; e.slowT = 1.3; }
        }
      }
      spark(x, y, s.color, true);
    } else {
      const e = s.target;
      if (e && !e.dead && !e.leaked) {
        damage(e, s.dmg, s.bonus);
        if (s.slow > 0) { e.slowMul = 1 - s.slow; e.slowT = 1.3; }
      }
      spark(x, y, s.color, false);
    }
  }

  // small visual pings
  function spark(x, y, color, big) { S.floats.push({ x, y, t: 0, spark: true, color, big: !!big }); }
  function floatText(x, y, text, color) { S.floats.push({ x, y, t: 0, text, color }); }

  // =======================================================================
  // DRAW
  // =======================================================================
  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = cv.width / dpr, h = cv.height / dpr;
    // backdrop
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#eef4fd"); g.addColorStop(1, "#dfe9f8");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    drawGround();
    drawPath();
    drawBuildHints();
    drawTowers();
    drawEnemies();
    drawShots();
    drawFloats();
  }

  function drawGround() {
    // buildable field, subtle checker with a grass tint
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (PATH_SET.has(c + "," + r)) continue;
        const x = ox + c * cell, y = oy + r * cell;
        ctx.fillStyle = ((c + r) % 2 === 0) ? "rgba(120,170,120,0.10)" : "rgba(120,170,120,0.05)";
        ctx.fillRect(x, y, cell, cell);
      }
    }
    ctx.strokeStyle = "rgba(40,80,130,0.06)"; ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(ox + c * cell, oy); ctx.lineTo(ox + c * cell, oy + boardH); ctx.stroke(); }
    for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(ox, oy + r * cell); ctx.lineTo(ox + boardW, oy + r * cell); ctx.stroke(); }
  }

  function drawPath() {
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath();
    PATH.forEach(([c, r], i) => { const x = cxOf(c), y = cyOf(r); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.strokeStyle = "#c8a56e"; ctx.lineWidth = cell * 0.82; ctx.stroke();
    ctx.strokeStyle = "#e6cfa0"; ctx.lineWidth = cell * 0.62; ctx.stroke();
    // dashed centre line
    ctx.setLineDash([cell * 0.18, cell * 0.22]);
    ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.setLineDash([]);

    // source (crises) and community (protected)
    drawTile(START[0], START[1], "⚠️", "rgba(229,86,75,0.16)");
    drawTile(END[0], END[1], "🏛️", "rgba(47,107,255,0.16)");
    // community label + heart
    const ex = cxOf(END[0]), ey = cyOf(END[1]);
    ctx.font = `${Math.round(cell * 0.28)}px Inter, sans-serif`;
    ctx.textAlign = "center"; ctx.fillStyle = "#2f6bff";
    ctx.fillText("Community", ex, ey + cell * 0.62);
  }

  function drawTile(c, r, emoji, bg) {
    const x = ox + c * cell, y = oy + r * cell;
    ctx.fillStyle = bg; roundRect(x + 3, y + 3, cell - 6, cell - 6, 8); ctx.fill();
    ctx.font = `${Math.round(cell * 0.5)}px serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(emoji, cxOf(c), cyOf(r));
  }

  function drawBuildHints() {
    // hover cell: green if buildable+empty and a type is selected, red if not
    const hc = S.hoverCell;
    if (hc && S.selectedType) {
      const [c, r] = hc;
      const ok = buildable(c, r) && !towerAt(c, r) && S.funding >= TOWERS[S.selectedType].cost;
      const x = ox + c * cell, y = oy + r * cell;
      ctx.fillStyle = ok ? "rgba(47,158,84,0.28)" : "rgba(229,86,75,0.28)";
      roundRect(x + 2, y + 2, cell - 4, cell - 4, 8); ctx.fill();
      if (ok) {
        const st = { range: TOWERS[S.selectedType].range };
        ctx.beginPath(); ctx.arc(cxOf(c), cyOf(r), st.range * cell, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(47,158,84,0.10)"; ctx.fill();
        ctx.strokeStyle = "rgba(47,158,84,0.5)"; ctx.lineWidth = 2; ctx.stroke();
      }
    }
    // selected tower: show its range
    const t = S.selectedTower;
    if (t) {
      const st = statsOf(t);
      ctx.beginPath(); ctx.arc(t.x, t.y, st.range * cell, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(47,107,255,0.08)"; ctx.fill();
      ctx.strokeStyle = "rgba(47,107,255,0.5)"; ctx.lineWidth = 2; ctx.stroke();
    }
  }

  function drawTowers() {
    for (const t of S.towers) {
      const def = TOWERS[t.type];
      const x = t.x, y = t.y, s = cell * 0.78;
      // base tile
      ctx.fillStyle = "#ffffff";
      roundRect(x - s / 2, y - s / 2, s, s, 9); ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = def.color;
      roundRect(x - s / 2, y - s / 2, s, s, 9); ctx.stroke();
      // support ring for coordination
      if (def.support) {
        ctx.beginPath(); ctx.arc(x, y, s * 0.62, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(47,107,255,0.35)"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
      }
      // icon
      ctx.font = `${Math.round(cell * 0.44)}px serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(def.icon, x, y + 1);
      // level pips
      for (let i = 0; i < t.lvl; i++) {
        ctx.beginPath(); ctx.arc(x - s / 2 + 7 + i * 8, y + s / 2 - 6, 3, 0, Math.PI * 2);
        ctx.fillStyle = def.color; ctx.fill();
      }
    }
  }

  function drawEnemies() {
    for (const e of S.enemies) {
      const rad = (e.boss ? 0.42 : 0.3) * cell;
      // body
      ctx.beginPath(); ctx.arc(e.x, e.y, rad, 0, Math.PI * 2);
      ctx.fillStyle = e.boss ? "#7a1220" : "#b23b34";
      ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = e.slowMul < 1 ? "#11aecb" : "rgba(255,255,255,0.7)"; ctx.stroke();
      // icon
      ctx.font = `${Math.round(rad * 1.3)}px serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(e.card.icon, e.x, e.y + 1);
      // hp bar
      const bw = rad * 2.2, bh = 4, bx = e.x - bw / 2, by = e.y - rad - 8;
      ctx.fillStyle = "rgba(0,0,0,0.25)"; roundRect(bx, by, bw, bh, 2); ctx.fill();
      ctx.fillStyle = e.boss ? "#ef9f25" : "#2f9e54";
      roundRect(bx, by, bw * clamp(e.hp / e.maxHp, 0, 1), bh, 2); ctx.fill();
    }
  }

  function drawShots() {
    for (const s of S.shots) {
      ctx.beginPath(); ctx.arc(s.x, s.y, s.splash > 0 ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = s.color; ctx.fill();
    }
  }

  function drawFloats() {
    for (const f of S.floats) {
      if (f.spark) {
        const a = 1 - f.t / 1.1;
        ctx.beginPath(); ctx.arc(f.x, f.y, (f.big ? 16 : 9) * (0.4 + f.t * 2), 0, Math.PI * 2);
        ctx.strokeStyle = hexA(f.color, a * 0.7); ctx.lineWidth = 2; ctx.stroke();
      } else if (f.text) {
        const a = clamp(1 - f.t / 1.1, 0, 1);
        ctx.font = "700 13px Inter, sans-serif"; ctx.textAlign = "center";
        ctx.fillStyle = hexA(f.color, a);
        ctx.fillText(f.text, f.x, f.y);
      }
    }
  }

  // ---- canvas utils ------------------------------------------------------
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function hexA(hex, a) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(a, 0, 1)})`;
  }

  // =======================================================================
  // CARDS + TOASTS  (reuse overlay-card / event-card look)
  // =======================================================================
  function introCard() {
    const kind = CG.theatreKindMeta ? CG.theatreKindMeta(S.theatre) : null;
    const story = CG.theatreStory ? CG.theatreStory(S.theatre) : S.theatre.blurb;
    const over = el("div", "overlay-card");
    const c = el("div", "event-card note");
    c.innerHTML =
      `<div class="ec-band">YOUR POSTING</div>` +
      `<div class="ec-icon">${S.theatre.icon}</div>` +
      `<div class="ec-title">${esc(S.theatre.name)}</div>` +
      (kind ? `<div class="ec-move">${kind.icon} ${kind.label}</div>` : "") +
      `<div class="ec-why">${esc(story)}</div>` +
      `<div class="ec-fact"><span>How to play</span>Spend Funding to place UN partners along the road. Each partner works the crises that pass. Keep crises from reaching the community. Hold the line through all ${S.diff.waves} waves to deliver the mandate.</div>`;
    const actions = el("div", "ec-actions");
    const speak = el("button", "btn btn-ghost", "🔊 Read aloud");
    speak.onclick = () => CG.Narrate && CG.Narrate.speak(`${S.theatre.name}. ${story}`);
    const go = el("button", "btn btn-primary", "Take the line ▸");
    go.onclick = () => { CG.Narrate && CG.Narrate.stop(); over.classList.remove("show"); setTimeout(() => over.remove(), 250); };
    actions.appendChild(speak); actions.appendChild(go);
    c.appendChild(actions);
    over.appendChild(c);
    app().appendChild(over);
    requestAnimationFrame(() => over.classList.add("show"));
    CG.Narrate && CG.Narrate.auto(`Your posting. ${S.theatre.name}. ${story}`);
  }

  // A real field fact between waves, drawn from the crisis just faced.
  function betweenCard() {
    const wave = S.curWave;
    const tag = wave && wave.mix ? rand(wave.mix) : "any";
    const card = cardFor(tag);
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
    c.appendChild(actions);
    over.appendChild(c);
    app().appendChild(over);
    requestAnimationFrame(() => over.classList.add("show"));
    CG.Narrate && CG.Narrate.auto(`Wave ${S.waveNo} held. ${card.title}. ${card.fact}`);
  }

  function win() {
    S.phase = "over";
    if (S.settings.music && CG.Audio) { CG.Audio.sfx.win(); CG.Audio.sfx.clap(); }
    const line = `The community holds. Across ${S.diff.waves} waves you contained ${S.killed} crises and lost only ${25 - Math.min(25, S.leaked)} of the ground you defended. The mandate is delivered.`;
    endCard("win", "🏛️", "The line holds", `You held ${esc(S.theatre.name)} through every wave. ${S.killed} crises contained, ${S.lives} resilience remaining. Mandate delivered.`,
      "Mandate delivered", true);
    CG.Narrate && CG.Narrate.auto(`The line holds. You held ${S.theatre.name} through every wave. The mandate is delivered.`);
  }

  function lose() {
    S.phase = "over";
    if (S.settings.music && CG.Audio) { CG.Audio.sfx.lose(); CG.Audio.sfx.wah(); }
    endCard("snake", "🌊", "The community is overrun", `${esc(S.theatre.name)} was overwhelmed at wave ${S.waveNo} of ${S.diff.waves}. ${S.killed} crises were held before the line broke. The response regroups to try again.`,
      "The line breaks", false);
    CG.Narrate && CG.Narrate.auto(`The community is overrun. The line broke at wave ${S.waveNo}. The response will regroup and try again.`);
  }

  function endCard(kind, icon, title, body, band, won) {
    // freeze the field
    const over = el("div", "overlay-card show");
    const c = el("div", `event-card ${kind}`);
    c.innerHTML =
      `<div class="ec-band">${band}</div>` +
      `<div class="ec-icon">${icon}</div>` +
      `<div class="ec-title">${title}</div>` +
      `<div class="ec-why">${body}</div>`;
    const actions = el("div", "ec-actions");
    const again = el("button", "btn btn-primary", "Play again ▸");
    again.onclick = () => { over.remove(); CG.Narrate && CG.Narrate.stop(); renderSelect(); };
    const menu = el("button", "btn btn-ghost", "Games ▸");
    menu.onclick = () => { over.remove(); quit(); };
    actions.appendChild(menu); actions.appendChild(again);
    c.appendChild(actions);
    over.appendChild(c);
    app().appendChild(over);
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
    S.running = false;
    if (S.raf) cancelAnimationFrame(S.raf);
    S.raf = 0;
    window.removeEventListener("resize", resize);
    cv = null; ctx = null;
  }
  function quit() {
    CG.Narrate && CG.Narrate.stop();
    stop();
    CG.Platform ? CG.Platform.show() : show();
  }

  CG.TowerDefense = { show };

  // Test/debug harness. The play field is driven by requestAnimationFrame, which
  // is paused in an offscreen/headless tab, so this lets the simulation be
  // stepped by hand for verification. No effect on normal play.
  CG.TowerDefense._t = {
    S,
    step: (dt, n) => { for (let i = 0; i < (n || 1); i++) update(dt || 1 / 60); },
    place: (type, c, r) => { S.selectedType = type; placeTower(c, r); return towerAt(c, r); },
    startWave, statsOf, draw, resize, TOWERS, PATH, START, END,
  };
})();
