/* =========================================================================
 * COMMON GROUND, main.js
 * Bootstrap, menu screens, mode/role/difficulty selection, country briefing,
 * tutorial, glossary, credits, settings application, and game lifecycle.
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});
  const t = CG.t, loc = CG.loc;
  let menuEl, gameEl;
  const flow = { cfg: {} };

  function h(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }

  // ---- boot --------------------------------------------------------------
  CG.state = {
    lang: "en",
    settings: { hints: true, fieldNotes: false, reducedMotion: false, highContrast: false, muted: false, narrate: false, textSize: 100, apiKey: "" },
  };

  document.addEventListener("DOMContentLoaded", function () {
    const app = document.getElementById("app");
    app.innerHTML = "";
    menuEl = h('<div id="menu"></div>');
    gameEl = h('<div id="game" class="hidden"></div>');
    app.appendChild(menuEl);
    app.appendChild(gameEl);
    CG.applySettings();
    showTitle();
  });

  CG.applySettings = function () {
    const s = CG.state.settings;
    const root = document.documentElement;
    root.style.setProperty("--text-scale", (s.textSize || 100) / 100);
    document.body.classList.toggle("reduced-motion", !!s.reducedMotion);
    document.body.classList.toggle("high-contrast", !!s.highContrast);
    document.documentElement.dir = CG.STRINGS[CG.state.lang].dir;
    document.documentElement.lang = CG.state.lang;
  };

  CG.toggleLang = function () {
    CG.state.lang = CG.state.lang === "en" ? "ar" : "en";
    CG.applySettings();
  };

  // Set to any of the six UN languages.
  CG.setLang = function (code) {
    if (CG.STRINGS[code]) { CG.state.lang = code; CG.applySettings(); }
  };

  // Language picker modal (all six official UN languages).
  CG.langPicker = function (onDone) {
    var body = h('<div class="lang-picker"><h2>🌐 Language · Langue · Idioma · 语言 · Язык · اللغة</h2><div class="lang-grid"></div></div>');
    var grid = body.querySelector(".lang-grid");
    Object.keys(CG.STRINGS).forEach(function (code) {
      var meta = CG.STRINGS[code];
      var active = CG.state.lang === code ? " active" : "";
      var btn = h('<button class="lang-btn' + active + '" lang="' + code + '" dir="' + meta.dir + '">' + meta.langName + '</button>');
      btn.addEventListener("click", function () { CG.setLang(code); CG.UI.closeModal(); if (onDone) onDone(); });
      grid.appendChild(btn);
    });
    CG.UI.modal(body);
  };

  function showMenu() { menuEl.classList.remove("hidden"); gameEl.classList.add("hidden"); }
  function showGame() { menuEl.classList.add("hidden"); gameEl.classList.remove("hidden"); }

  // ---- title -------------------------------------------------------------
  function showTitle() {
    showMenu();
    menuEl.innerHTML = "";
    const s = h(`<div class="title-screen">
      <div class="title-corner">
        <button class="icon-btn" id="t-mute" title="${t("mute")}">${CG.state.settings.muted ? "🔇" : "🔊"}</button>
        <button class="icon-btn" id="t-lang" title="Language / Langue / 语言 / Язык">🌐</button>
      </div>
      <div class="title-hero">
        <div class="title-mark">◆</div>
        <h1 class="title-name">${t("appTitle")}</h1>
        <p class="title-tag">${t("tagline")}</p>
        <p class="title-sub">${t("subtitle")}</p>
        <div class="title-buttons">
          <button class="btn btn-primary big" id="t-play">▶ ${t("newGame")}</button>
          <button class="btn btn-secondary" id="t-tutorial">🎓 ${t("tutorial")}</button>
          <button class="btn btn-secondary" id="t-daily">📅 ${t("dailyChallenge")}</button>
          <div class="title-row">
            <button class="btn btn-ghost" id="t-how">${t("howToPlay")}</button>
            <button class="btn btn-ghost" id="t-gloss">${t("glossary")}</button>
            <button class="btn btn-ghost" id="t-credits">${t("credits")}</button>
            <button class="btn btn-ghost" id="t-set">${t("settings")}</button>
          </div>
        </div>
      </div>
      <div class="title-quintet">
        <span title="Data">📊</span><span title="Digital">📱</span><span title="Innovation">💡</span><span title="Foresight">🔭</span><span title="Behavioural Science">🤝</span>
      </div>
      <div class="title-foot">UN 2.0 · Quintet of Change · A game about coordination</div>
    </div>`);
    menuEl.appendChild(s);
    const b = (id, fn) => s.querySelector(id).addEventListener("click", fn);
    b("#t-mute", () => { CG.state.settings.muted = !CG.state.settings.muted; CG.Audio && CG.Audio.setMuted(CG.state.settings.muted); s.querySelector("#t-mute").textContent = CG.state.settings.muted ? "🔇" : "🔊"; });
    b("#t-lang", () => CG.langPicker(showTitle));
    b("#t-play", () => { if (CG.Audio && !CG.state.settings.muted) CG.Audio.start(); showModeSelect(); });
    b("#t-tutorial", () => startTutorial());
    b("#t-daily", () => startDaily());
    b("#t-how", () => CG.UI.modalHowTo());
    b("#t-gloss", () => CG.showGlossary());
    b("#t-credits", () => showCredits());
    b("#t-set", () => CG.UI.modalSettings());
  }

  // ---- mode select -------------------------------------------------------
  function showModeSelect() {
    menuEl.innerHTML = "";
    const modes = [
      { id: "solo", icon: "🧠", name: t("modeSolo"), desc: t("modeSoloDesc") },
      { id: "hotseat", icon: "👨‍👩‍👧", name: t("modeHotseat"), desc: t("modeHotseatDesc") },
      { id: "coop", icon: "🤝", name: t("modeCoop"), desc: t("modeCoopDesc") },
      { id: "quick", icon: "⚡", name: t("modeQuick"), desc: t("modeQuickDesc") },
      { id: "campaign", icon: "🏔️", name: t("modeCampaign"), desc: t("modeCampaignDesc") },
    ];
    const sc = h(`<div class="select-screen"><div class="select-head"><button class="btn btn-ghost back" id="back">← ${t("back")}</button><h2>${t("chooseMode")}</h2></div><div class="mode-grid"></div></div>`);
    const grid = sc.querySelector(".mode-grid");
    modes.forEach((m) => {
      const c = h(`<button class="mode-card"><div class="mode-ic">${m.icon}</div><h3>${m.name}</h3><p>${m.desc}</p></button>`);
      c.addEventListener("click", () => { flow.cfg = { mode: m.id }; if (m.id === "hotseat" || m.id === "coop") showPlayerSetup(); else showRoleSelect(true); });
      grid.appendChild(c);
    });
    menuEl.appendChild(sc);
    sc.querySelector("#back").addEventListener("click", showTitle);
  }

  // ---- role select (single human; for solo/quick/campaign) --------------
  function showRoleSelect(single) {
    menuEl.innerHTML = "";
    const sc = h(`<div class="select-screen"><div class="select-head"><button class="btn btn-ghost back" id="back">← ${t("back")}</button><h2>${t("chooseRole")}</h2></div><div class="role-grid"></div></div>`);
    const grid = sc.querySelector(".role-grid");
    CG.ROLES.forEach((r) => {
      const c = h(`<button class="role-card" style="--rcol:${r.color}" data-id="${r.id}">
        <div class="role-portrait" style="background:${r.color}">${r.icon}</div>
        <h3>${loc(r, "name")}</h3>
        <p class="role-desc">${loc(r, "desc")}</p>
        <div class="role-ability"><strong>⚡ ${loc(r, "ability")}</strong><span>${loc(r, "abilityDesc")}</span></div>
      </button>`);
      c.addEventListener("click", () => { flow.cfg.players = [{ name: "You", roleId: r.id, isAI: false }]; showDifficulty(); });
      grid.appendChild(c);
    });
    menuEl.appendChild(sc);
    sc.querySelector("#back").addEventListener("click", showModeSelect);
  }

  // ---- player setup (hotseat / coop) ------------------------------------
  function showPlayerSetup() {
    menuEl.innerHTML = "";
    if (!flow.cfg.players) flow.cfg.players = [{ name: "Player 1", roleId: "rc", isAI: false }, { name: "Player 2", roleId: "dmo", isAI: false }];
    const sc = h(`<div class="select-screen"><div class="select-head"><button class="btn btn-ghost back" id="back">← ${t("back")}</button><h2>${t("players")}</h2></div>
      <div class="player-list" id="plist"></div>
      <div class="player-setup-actions">
        <button class="btn btn-secondary" id="add">＋ ${t("addPlayer")}</button>
        <button class="btn btn-primary" id="next">${t("next")} →</button>
      </div></div>`);
    menuEl.appendChild(sc);
    function paint() {
      const list = sc.querySelector("#plist");
      list.innerHTML = "";
      flow.cfg.players.forEach((p, i) => {
        const row = h(`<div class="player-row">
          <input class="pname" type="text" value="${p.name}" aria-label="${t("playerName")}">
          <select class="prole" aria-label="role">${CG.ROLES.map((r) => `<option value="${r.id}" ${r.id === p.roleId ? "selected" : ""}>${r.icon} ${loc(r, "name")}</option>`).join("")}</select>
          ${flow.cfg.players.length > 2 ? `<button class="btn btn-ghost rm" data-i="${i}">${t("removePlayer")}</button>` : ""}
        </div>`);
        row.querySelector(".pname").addEventListener("input", (e) => p.name = e.target.value);
        row.querySelector(".prole").addEventListener("change", (e) => p.roleId = e.target.value);
        const rm = row.querySelector(".rm"); if (rm) rm.addEventListener("click", () => { flow.cfg.players.splice(i, 1); paint(); });
        list.appendChild(row);
      });
      sc.querySelector("#add").disabled = flow.cfg.players.length >= 5;
    }
    paint();
    sc.querySelector("#add").addEventListener("click", () => { if (flow.cfg.players.length < 5) { const used = flow.cfg.players.map((p) => p.roleId); const free = CG.ROLES.find((r) => !used.includes(r.id)) || CG.ROLES[0]; flow.cfg.players.push({ name: "Player " + (flow.cfg.players.length + 1), roleId: free.id, isAI: false }); paint(); } });
    sc.querySelector("#next").addEventListener("click", showDifficulty);
    sc.querySelector("#back").addEventListener("click", showModeSelect);
  }

  // ---- difficulty --------------------------------------------------------
  function showDifficulty() {
    menuEl.innerHTML = "";
    const diffs = [
      { id: "easy", icon: "🌱", name: t("diffEasy"), desc: t("diffEasyDesc") },
      { id: "normal", icon: "⚖️", name: t("diffNormal"), desc: t("diffNormalDesc") },
      { id: "hard", icon: "🔥", name: t("diffHard"), desc: t("diffHardDesc") },
    ];
    const sc = h(`<div class="select-screen"><div class="select-head"><button class="btn btn-ghost back" id="back">← ${t("back")}</button><h2>${t("chooseDifficulty")}</h2></div><div class="mode-grid diff-grid"></div></div>`);
    const grid = sc.querySelector(".mode-grid");
    diffs.forEach((d) => {
      const c = h(`<button class="mode-card"><div class="mode-ic">${d.icon}</div><h3>${d.name}</h3><p>${d.desc}</p></button>`);
      c.addEventListener("click", () => { flow.cfg.difficulty = d.id; showCountryBriefing(); });
      grid.appendChild(c);
    });
    menuEl.appendChild(sc);
    sc.querySelector("#back").addEventListener("click", () => (flow.cfg.mode === "hotseat" || flow.cfg.mode === "coop") ? showPlayerSetup() : showRoleSelect(true));
  }

  // ---- country briefing --------------------------------------------------
  function showCountryBriefing() {
    menuEl.innerHTML = "";
    const cond = CG.START_CONDITIONS[Math.floor(Math.random() * CG.START_CONDITIONS.length)];
    flow.cfg.startCondition = cond;
    const sc = h(`<div class="briefing-screen">
      <div class="briefing-card">
        <div class="select-head"><button class="btn btn-ghost back" id="back">← ${t("back")}</button><h2>${t("chooseCountry")}</h2></div>
        <div class="country-hero">
          <div class="country-map">🗺️</div>
          <div>
            <h1>${loc(CG.COUNTRY, "name")}</h1>
            <p>${loc(CG.COUNTRY, "blurb")}</p>
          </div>
        </div>
        <div class="start-cond">
          <div class="cond-tag">Starting situation</div>
          <h3>${loc(cond, "name")}</h3>
          <p>${loc(cond, "desc")}</p>
          <button class="btn btn-ghost small" id="reroll">🎲 ${t("restart")} situation</button>
        </div>
        <div class="briefing-roster"></div>
        <button class="btn btn-primary big" id="go">${t("play")} ▶</button>
      </div>
    </div>`);
    menuEl.appendChild(sc);
    paintRoster(sc.querySelector(".briefing-roster"));
    sc.querySelector("#reroll").addEventListener("click", () => showCountryBriefing());
    sc.querySelector("#back").addEventListener("click", showDifficulty);
    sc.querySelector("#go").addEventListener("click", () => launchGame());
  }

  function paintRoster(box) {
    // For solo/quick/campaign: add AI partners (2 distinct random roles).
    const cfg = flow.cfg;
    if (cfg.mode === "solo" || cfg.mode === "quick" || cfg.mode === "campaign") {
      const used = cfg.players.map((p) => p.roleId);
      const pool = CG.ROLES.filter((r) => !used.includes(r.id));
      // deterministic-ish pick
      const aiCount = 2;
      cfg.aiPartners = [];
      for (let i = 0; i < aiCount && pool.length; i++) {
        const r = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        cfg.aiPartners.push(r);
      }
    } else cfg.aiPartners = [];
    box.innerHTML = "<div class='roster-title'>Your team</div>";
    const row = h('<div class="roster-row"></div>');
    cfg.players.forEach((p) => { const r = CG.getRole(p.roleId); row.appendChild(h(`<div class="roster-chip"><span style="background:${r.color}">${r.icon}</span>${p.name}</div>`)); });
    (cfg.aiPartners || []).forEach((r) => row.appendChild(h(`<div class="roster-chip ai"><span style="background:${r.color}">${r.icon}</span>${loc(r, "name")} · AI</div>`)));
    box.appendChild(row);
  }

  // ---- launch ------------------------------------------------------------
  function launchGame() {
    const cfg = flow.cfg;
    const players = cfg.players.slice();
    (cfg.aiPartners || []).forEach((r) => players.push({ name: loc(r, "name"), roleId: r.id, isAI: true }));
    CG.Engine.newGame({
      mode: cfg.mode,
      difficulty: cfg.difficulty || "normal",
      players,
      startCondition: cfg.startCondition,
      seed: cfg.seed,
    });
    showGame();
    CG.UI.start(gameEl);
  }

  // ---- daily challenge ---------------------------------------------------
  function startDaily() {
    const d = new Date();
    const key = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    // deterministic role from date
    const idx = (d.getFullYear() + d.getMonth() + d.getDate()) % CG.ROLES.length;
    flow.cfg = { mode: "solo", difficulty: "normal", seed: "daily-" + key, players: [{ name: "You", roleId: CG.ROLES[idx].id, isAI: false }] };
    // fixed start condition by seed
    const condIdx = (d.getDate()) % CG.START_CONDITIONS.length;
    flow.cfg.startCondition = CG.START_CONDITIONS[condIdx];
    flow.cfg.aiPartners = [];
    const used = [CG.ROLES[idx].id];
    const pool = CG.ROLES.filter((r) => !used.includes(r.id));
    flow.cfg.aiPartners.push(pool[(d.getMonth()) % pool.length], pool[(d.getDate()) % pool.length]);
    flow.cfg.aiPartners = flow.cfg.aiPartners.filter((v, i, a) => a.indexOf(v) === i);
    if (CG.Audio && !CG.state.settings.muted) CG.Audio.start();
    CG.UI.toast && setTimeout(() => CG.UI.toast("📅 " + t("dailyChallenge") + ", " + t("seed") + ": " + key), 400);
    launchGame();
  }

  // ---- tutorial ----------------------------------------------------------
  function startTutorial() {
    const steps = [
      { ic: "🧭", title: CG.tc("tut.0.title"), body: CG.tc("tut.0.body") },
      { ic: "🤝", title: CG.tc("tut.1.title"), body: CG.tc("tut.1.body") },
      { ic: "📊", title: CG.tc("tut.2.title"), body: CG.tc("tut.2.body") },
      { ic: "⚡", title: CG.tc("tut.3.title"), body: CG.tc("tut.3.body") },
    ];
    let i = 0;
    function show() {
      const st = steps[i];
      const body = h(`<div class="tutorial-step"><div class="tut-ic">${st.ic}</div><h2>${st.title}</h2><p>${st.body}</p>
        <div class="tut-dots">${steps.map((_, k) => `<span class="${k === i ? "on" : ""}"></span>`).join("")}</div>
        <div class="tut-btns"><button class="btn btn-ghost" id="tut-skip">${t("skip")}</button><button class="btn btn-primary" id="tut-next">${i < steps.length - 1 ? t("next") + " →" : t("play") + " ▶"}</button></div></div>`);
      CG.UI.modal(body);
      body.querySelector("#tut-skip").addEventListener("click", () => { CG.UI.closeModal(); launchTutorialGame(); });
      body.querySelector("#tut-next").addEventListener("click", () => { if (i < steps.length - 1) { i++; show(); } else { CG.UI.closeModal(); launchTutorialGame(); } });
    }
    show();
  }
  function launchTutorialGame() {
    CG.state.settings.hints = true;
    flow.cfg = { mode: "solo", difficulty: "easy", players: [{ name: "You", roleId: "rc", isAI: false }], startCondition: CG.START_CONDITIONS[0] };
    flow.cfg.aiPartners = [CG.getRole("dmo"), CG.getRole("ngo")];
    if (CG.Audio && !CG.state.settings.muted) CG.Audio.start();
    launchGame();
  }

  // ---- glossary ----------------------------------------------------------
  CG.showGlossary = function () {
    const body = h(`<div class="glossary-modal"><h2>📖 ${t("glossaryTitle")}</h2><div class="gloss-list"></div></div>`);
    const list = body.querySelector(".gloss-list");
    CG.GLOSSARY.forEach((g) => list.appendChild(h(`<div class="gloss-item"><strong>${g.term}</strong><span>${g[CG.state.lang] || g.en}</span></div>`)));
    CG.UI.modal(body);
  };

  // ---- credits -----------------------------------------------------------
  function showCredits() {
    const body = h(`<div class="credits-modal">
      <h2>${t("credits")}</h2>
      <p>${CG.tc("credits.intro")}</p>
      <ul>
        <li>${CG.tc("credits.l1")}</li>
        <li>${CG.tc("credits.l2")}</li>
        <li>${CG.tc("credits.l3")}</li>
        <li>${CG.tc("credits.l4")}</li>
        <li>${CG.tc("credits.l5")}</li>
      </ul>
      <p class="credits-foot">${t("tagline")}</p>
    </div>`);
    CG.UI.modal(body);
  }

  // ---- lifecycle ---------------------------------------------------------
  CG.goMenu = function () { CG.UI.closeModal(); showTitle(); };
  CG.replay = function (twist) {
    const cfg = Object.assign({}, flow.cfg);
    if (twist) {
      // a twist: new start condition + harder if was easy
      cfg.startCondition = CG.START_CONDITIONS[Math.floor(Math.random() * CG.START_CONDITIONS.length)];
      cfg.seed = undefined;
    }
    flow.cfg = cfg;
    // rebuild ai partners fresh
    const box = document.createElement("div");
    paintRoster(box);
    launchGame();
  };
})();
