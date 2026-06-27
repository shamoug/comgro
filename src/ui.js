/* =========================================================================
 * COMMON GROUND — ui.js
 * In-game rendering + flow controller. Reads CG.state, calls CG.Engine,
 * paints the board. Menus/tutorial/settings live in main.js.
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});
  const UI = (CG.UI = {});
  const t = CG.t;
  const loc = CG.loc;

  UI.root = null;
  const flow = (UI.flow = { snapshot: null, actIntroPending: false, aiBusy: false });

  // ---- tiny helpers ------------------------------------------------------
  function h(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function $(sel, ctx) { return (ctx || UI.root).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || UI.root).querySelectorAll(sel)); }
  function on(sel, ev, fn) { const e = $(sel); if (e) e.addEventListener(ev, fn); }
  function reduced() { return CG.state.settings && CG.state.settings.reducedMotion; }
  function sfx(name) { if (CG.Audio && CG.Audio.sfx[name]) try { CG.Audio.sfx[name](); } catch (e) {} }

  const RES = ["trust", "funding", "coordination", "data"];
  const RES_ICON = { trust: "🤝", funding: "💶", coordination: "🔗", data: "📊", capacity: "🔋", impact: "⭐" };

  // ---- public entry ------------------------------------------------------
  UI.start = function (rootEl) {
    UI.root = rootEl;
    if (CG.Audio) { CG.Audio.setAct(CG.state.act); if (!CG.state.settings.muted) CG.Audio.start(); }
    beginMonth();
  };

  function beginMonth() {
    const s = CG.state;
    flow.actIntroPending = s.monthInAct === 0; // act intro before first month of act
    CG.Engine.startMonth();
    if (CG.Audio) CG.Audio.setAct(s.act);
    flow.snapshot = snapshot();
    if (flow.actIntroPending) renderActIntro();
    else render();
  }

  function snapshot() {
    const s = CG.state;
    return {
      trust: s.country.trust,
      pillars: Object.assign({}, s.country.pillars),
      pool: Object.assign({}, s.pool),
      milestones: s.country.milestonesDone.slice(),
      crises: s.country.crises.length,
    };
  }

  // ===================================================================== //
  //  TOP-LEVEL RENDER
  // ===================================================================== //
  function render() {
    const s = CG.state;
    if (s.ended) { renderEnd(); return; }
    UI.root.innerHTML = "";
    UI.root.appendChild(topBar());
    const wrap = h('<div class="game-wrap"></div>');
    wrap.appendChild(dashboard());
    const stage = h('<div class="stage" id="stage"></div>');
    wrap.appendChild(stage);
    UI.root.appendChild(wrap);
    UI.root.appendChild(logPanel());
    wireChrome();
    renderStage(stage);
  }

  function renderStage(stage) {
    const s = CG.state;
    switch (s.phase) {
      case "briefing": stageBriefing(stage); break;
      case "foresight": stageForesight(stage); break;
      case "event": stageEvent(stage); break;
      case "planning": stageTurn(stage); break;
      case "resolution": stageResolution(stage); break;
      default: stageBriefing(stage);
    }
  }

  // ---- top bar -----------------------------------------------------------
  function topBar() {
    const s = CG.state;
    const acts = ["I", "II", "III", "IV"];
    const bar = h(`<div class="topbar">
      <div class="tb-left">
        <span class="tb-logo">◆</span>
        <span class="tb-title">${t("appTitle")}</span>
      </div>
      <div class="tb-mid">
        <span class="tb-act">${t("act")} ${acts[s.act - 1]}</span>
        <span class="tb-sep">·</span>
        <span class="tb-month">${t("month")} ${s.monthInAct}/${s.monthsPerAct}</span>
        <span class="tb-phase phase-${s.phase}">${phaseLabel(s.phase)}</span>
      </div>
      <div class="tb-right">
        <button class="icon-btn" id="btn-mute" title="${t("mute")}">${CG.state.settings.muted ? "🔇" : "🔊"}</button>
        <button class="icon-btn" id="btn-lang" title="Language">🌐</button>
        <button class="icon-btn" id="btn-help" title="${t("howToPlay")}">?</button>
        <button class="icon-btn" id="btn-settings" title="${t("settings")}">⚙</button>
        <button class="icon-btn" id="btn-menu" title="${t("menu")}">✕</button>
      </div>
    </div>`);
    return bar;
  }
  function phaseLabel(p) {
    const map = { briefing: "phaseBriefing", foresight: "phaseForesight", event: "phaseEvent", planning: "phaseAction", resolution: "phaseResolution" };
    return t(map[p] || "phaseBriefing");
  }

  function wireChrome() {
    on("#btn-mute", "click", () => { const m = !CG.state.settings.muted; CG.state.settings.muted = m; CG.Audio && CG.Audio.setMuted(m); $("#btn-mute").textContent = m ? "🔇" : "🔊"; });
    on("#btn-lang", "click", () => CG.langPicker(render));
    on("#btn-help", "click", () => UI.modalHowTo());
    on("#btn-settings", "click", () => UI.modalSettings());
    on("#btn-menu", "click", () => UI.confirm(t("quit"), t("quit") + "?", () => CG.goMenu()));
  }

  // ---- dashboard ---------------------------------------------------------
  function dashboard() {
    const s = CG.state;
    const c = s.country;
    const d = h('<aside class="dashboard" aria-label="' + t("countryDashboard") + '"></aside>');

    // header
    d.appendChild(h(`<div class="dash-head"><h2>${loc(CG.COUNTRY, "name") || "Sahelia"}</h2><span class="dash-sub">${t("countryDashboard")}</span></div>`));

    // trust meter
    const tr = h(`<div class="trust-block">
      <div class="trust-top"><span>${RES_ICON.trust} ${t("trust")}</span><strong class="${c.trust < 25 ? "danger" : ""}">${c.trust}</strong></div>
      <div class="trust-bar"><div class="trust-fill" style="width:${c.trust}%"></div><div class="trust-line" title="collapse line"></div></div>
    </div>`);
    d.appendChild(tr);

    // resources pool
    const pool = h('<div class="res-row"></div>');
    pool.appendChild(resChip("funding", s.pool.funding));
    pool.appendChild(resChip("coordination", s.pool.coordination));
    pool.appendChild(resChip("data", s.pool.data));
    d.appendChild(pool);

    // pillars / milestones
    const mh = h(`<div class="dash-section-title">${t("milestones")}</div>`);
    d.appendChild(mh);
    const grid = h('<div class="pillar-grid"></div>');
    CG.PILLARS.forEach((p) => grid.appendChild(pillarRing(p)));
    d.appendChild(grid);

    // crises
    const crisesWrap = h(`<div class="crises"><div class="dash-section-title">${t("activeCrises")} (${c.crises.length}/${s.diff.crisisCap})</div></div>`);
    if (c.crises.length === 0) crisesWrap.appendChild(h(`<div class="no-crisis">✅ ${t("noCrises")}</div>`));
    else c.crises.forEach((cr) => crisesWrap.appendChild(h(`<div class="crisis-chip sev-${Math.min(cr.severity,4)}" title="severity ${cr.severity}">⚠️ ${cr.name} <span>${"●".repeat(Math.min(cr.severity,5))}</span></div>`)));
    d.appendChild(crisesWrap);

    return d;
  }

  function resChip(key, val) {
    return h(`<div class="res-chip" tabindex="0" title="${t(key + "Desc")}"><span class="res-ic">${RES_ICON[key]}</span><span class="res-val">${val}</span><span class="res-lbl">${t(key)}</span></div>`);
  }

  function pillarRing(p) {
    const s = CG.state;
    const val = s.country.pillars[p.id];
    const done = s.country.milestonesDone.includes("m_" + p.id);
    const m = CG.MILESTONES.find((x) => x.pillar === p.id);
    const r = 26, circ = 2 * Math.PI * r, off = circ * (1 - val / 100);
    const el = h(`<div class="pillar ${done ? "complete" : ""}" tabindex="0" data-pillar="${p.id}" title="${m ? loc(m,"name") : ""}">
      <svg viewBox="0 0 64 64" class="ring" aria-hidden="true">
        <circle cx="32" cy="32" r="${r}" class="ring-bg"/>
        <circle cx="32" cy="32" r="${r}" class="ring-fg" style="stroke:${p.color};stroke-dasharray:${circ};stroke-dashoffset:${off}"/>
      </svg>
      <span class="pillar-ic" style="color:${p.color}">${p.icon}</span>
      <span class="pillar-val">${done ? "★" : val + "%"}</span>
      <span class="pillar-lbl">${t(p.labelKey)}</span>
    </div>`);
    el.addEventListener("click", () => milestoneInfo(p, m));
    return el;
  }

  function milestoneInfo(p, m) {
    UI.modal(`<div class="m-info"><div class="m-ic" style="color:${p.color};font-size:48px">${p.icon}</div>
      <h3>${m ? loc(m, "name") : t(p.labelKey)}</h3>
      <p class="m-prog">${t(p.labelKey)} — ${CG.state.country.pillars[p.id]}% / 100%</p>
      <p>${m ? loc(m, "reward") : ""}</p></div>`);
  }

  // ===================================================================== //
  //  ACT INTRO
  // ===================================================================== //
  function renderActIntro() {
    const s = CG.state;
    const intro = CG.ACT_INTROS[s.act - 1];
    UI.root.innerHTML = "";
    const sc = h(`<div class="act-intro mood-${s.act}">
      <div class="act-card">
        <div class="act-kicker">${t("act")} ${["I","II","III","IV"][s.act-1]}</div>
        <h1>${t(intro.title_key).split("—")[1] || t(intro.title_key)}</h1>
        <p class="act-mood">${t(intro.mood_key)}</p>
        <p class="act-text">${intro.text}</p>
        <button class="btn btn-primary" id="act-go">${t("continue")} →</button>
      </div>
    </div>`);
    UI.root.appendChild(sc);
    on("#act-go", "click", () => { flow.actIntroPending = false; render(); });
  }

  // ===================================================================== //
  //  BRIEFING
  // ===================================================================== //
  function stageBriefing(stage) {
    const s = CG.state;
    stage.innerHTML = "";
    const card = h(`<div class="vignette-card fade-in">
      <div class="vignette-tag">📻 ${t("phaseBriefing")} — ${t("month")} ${s.monthTotal}</div>
      <p class="vignette-text">${s.vignette}</p>
      <div class="state-line">${stateSummary()}</div>
      <button class="btn btn-primary" id="brief-go">${t("continue")} →</button>
    </div>`);
    stage.appendChild(card);
    on("#brief-go", "click", () => { s.phase = "foresight"; render(); });
  }

  function stateSummary() {
    const s = CG.state, c = s.country;
    const done = c.milestonesDone.length;
    let mood = c.trust >= 60 ? "Trust is strong." : c.trust >= 35 ? "Trust is holding, but watch it." : "Trust is fragile.";
    let cr = c.crises.length ? c.crises.length + " active crisis" + (c.crises.length > 1 ? "es" : "") + "." : "No active crises.";
    return `${mood} ${cr} ${done}/5 milestones reached.`;
  }

  // ===================================================================== //
  //  FORESIGHT
  // ===================================================================== //
  function stageForesight(stage) {
    const s = CG.state;
    const human = s.players[0];
    const canPeek = ["foresight", "dmo"].includes(human.roleId) && !human.abilityUsed;
    stage.innerHTML = "";
    const card = h(`<div class="foresight-card fade-in">
      <div class="vignette-tag">🔭 ${t("phaseForesight")}</div>
      <p>${canPeek ? "Your role can read the horizon before the month's event strikes." : "The horizon is quiet. Foresight roles can peek here when available."}</p>
      <div class="fore-actions"></div>
    </div>`);
    const fa = card.querySelector(".fore-actions");
    if (canPeek) {
      const b = h(`<button class="btn btn-secondary" id="fore-peek">⚡ ${CG.getRole(human.roleId).ability} — ${t("peekEvents")}</button>`);
      fa.appendChild(b);
    }
    fa.appendChild(h(`<button class="btn btn-primary" id="fore-go">${t("continue")} →</button>`));
    stage.appendChild(card);

    on("#fore-peek", "click", () => {
      CG.Engine.useAbility({});
      const ids = s.peek && s.peek.length ? s.peek : CG.Engine.peekEvents(2);
      showPeek(ids, s.foresightReorder);
    });
    on("#fore-go", "click", () => { s.phase = "event"; render(); });
  }

  function showPeek(ids, allowReorder) {
    const s = CG.state;
    let order = ids.slice();
    const body = h('<div class="peek-modal"></div>');
    body.appendChild(h(`<h3>🔭 ${t("peekEvents")}</h3>`));
    const list = h('<div class="peek-list"></div>');
    function paint() {
      list.innerHTML = "";
      order.forEach((id, i) => {
        const ev = CG.getEvent(id);
        const row = h(`<div class="peek-row type-${ev.type}"><span class="peek-ic">${ev.icon}</span><span>${i === 0 ? "▶ " : ""}${loc(ev, "name")}</span>${allowReorder && i > 0 ? '<button class="mini-btn" data-up="' + i + '">↑</button>' : ""}</div>`);
        list.appendChild(row);
      });
      $all("[data-up]", list).forEach((b) => b.addEventListener("click", () => {
        const i = +b.getAttribute("data-up");
        [order[i - 1], order[i]] = [order[i], order[i - 1]];
        paint();
      }));
    }
    paint();
    body.appendChild(list);
    const ok = h(`<button class="btn btn-primary">${allowReorder ? t("confirm") : t("close")}</button>`);
    body.appendChild(ok);
    UI.modal(body, () => {
      if (allowReorder) { CG.Engine.reorderTop(order); s.foresightReorder = false; }
      render();
    });
    ok.addEventListener("click", () => UI.closeModal());
  }

  // ===================================================================== //
  //  EVENT
  // ===================================================================== //
  function stageEvent(stage) {
    const s = CG.state;
    stage.innerHTML = "";
    if (!s.pending.event) {
      const draw = h(`<div class="event-draw fade-in">
        <div class="vignette-tag">📨 ${t("phaseEvent")}</div>
        <div class="event-deck-visual">🂠</div>
        <p>${t("drawEvent")}</p>
        <button class="btn btn-primary" id="ev-draw">${t("drawEvent")}</button>
      </div>`);
      stage.appendChild(draw);
      on("#ev-draw", "click", () => { CG.Engine.drawEvent(); sfx("card"); render(); });
      return;
    }
    const ev = s.pending.event;
    if (ev.type === "shock") sfx("crisis"); else if (ev.type === "opening") sfx("gain");
    const card = h(`<div class="event-card type-${ev.type} flip-in">
      <div class="event-type-badge">${ev.type === "shock" ? "⚠️ Shock" : ev.type === "opening" ? "✨ Opening" : "⚖️ Dilemma"}</div>
      <div class="event-ic">${ev.icon}</div>
      <h2>${loc(ev, "name")}</h2>
      <p class="event-flavor">${loc(ev, "flavor")}</p>
      <div class="event-effect">${describeEffect(ev)}</div>
      <div class="event-actions"></div>
    </div>`);
    const ea = card.querySelector(".event-actions");
    if (ev.type === "dilemma") {
      ev.options.forEach((opt, i) => {
        const b = h(`<button class="btn btn-dilemma" data-opt="${i}"><strong>${opt.label}</strong><span>${opt.desc}</span></button>`);
        b.addEventListener("click", () => { resolveAndContinue(i); });
        ea.appendChild(b);
      });
    } else {
      const b = h(`<button class="btn btn-primary" id="ev-resolve">${t("resolveEvent")} →</button>`);
      b.addEventListener("click", () => resolveAndContinue(0));
      ea.appendChild(b);
    }
    stage.appendChild(card);
  }

  function resolveAndContinue(optIndex) {
    const before = snapshot();
    CG.Engine.resolveEvent(optIndex);
    const m = CG.Engine.takeNewMilestone();
    if (m) celebrateMilestone(m);
    flashDeltas(before);
    render();
  }

  function describeEffect(ev) {
    function line(eff) {
      const parts = [];
      if (eff.trust) parts.push((eff.trust > 0 ? "+" : "") + eff.trust + " " + t("trust"));
      if (eff.pillar && eff.boost) parts.push("+" + eff.boost + " " + pName(eff.pillar));
      if (eff.pillar && eff.damage) parts.push("−" + eff.damage + " " + pName(eff.pillar));
      if (eff.gain) Object.keys(eff.gain).forEach((k) => parts.push("+" + eff.gain[k] + " " + t(k)));
      if (eff.drain) Object.keys(eff.drain).forEach((k) => parts.push("−" + eff.drain[k] + " " + t(k)));
      if (eff.crisis) parts.push("⚠️ new crisis: " + eff.crisis.name);
      if (eff.resolveCrisis) parts.push("resolves a crisis");
      if (eff.capacityAll) parts.push((eff.capacityAll > 0 ? "+" : "") + eff.capacityAll + " " + t("capacity") + " (all)");
      if (eff.misinfo) parts.push("misinformation");
      return parts.join(" · ");
    }
    if (ev.type === "dilemma") return "<em>Choose your approach below.</em>";
    return line(ev.effect);
  }
  function pName(id) { const p = CG.getPillar(id); return p ? t(p.labelKey) : id; }

  // ===================================================================== //
  //  TURN (planning + action merged)
  // ===================================================================== //
  function stageTurn(stage) {
    const s = CG.state;
    const p = s.players[s.current];
    if (p.isAI) { runAITurn(stage); return; }

    stage.innerHTML = "";
    const head = h(`<div class="turn-head">
      <div class="turn-who"><span class="role-ic" style="background:${CG.getRole(p.roleId).color}">${CG.getRole(p.roleId).icon}</span>
        <div><strong>${p.name}</strong><span class="role-name">${loc(CG.getRole(p.roleId), "name")}</span></div></div>
      <div class="turn-cap"><span>🔋 ${t("capacity")}</span><div class="cap-dots">${capDots(p)}</div></div>
    </div>`);
    stage.appendChild(head);
    stage.appendChild(h(`<div class="turn-prompt">${t("whatOutcome")}</div>`));

    // ability button
    const role = CG.getRole(p.roleId);
    const abRow = h('<div class="ability-row"></div>');
    const abBtn = h(`<button class="btn btn-ability ${p.abilityUsed ? "used" : ""}" id="ability-btn" ${p.abilityUsed ? "disabled" : ""}>
      ⚡ ${role.ability}${p.abilityUsed ? " — " + t("abilityUsed") : ""}</button>`);
    abBtn.title = loc(role, "abilityDesc");
    abRow.appendChild(abBtn);
    if (s.settings.hints) abRow.appendChild(h(`<span class="ability-hint">${loc(role, "abilityDesc")}</span>`));
    stage.appendChild(abRow);

    // suggested move
    if (s.settings.hints) {
      const sug = suggestMove(p);
      if (sug) stage.appendChild(h(`<div class="suggest">💡 <strong>${t("suggestedMove")}:</strong> ${sug}</div>`));
    }

    // hand
    stage.appendChild(h(`<div class="hand-label">${t("yourHand")}</div>`));
    const hand = h('<div class="hand"></div>');
    p.hand.forEach((id) => hand.appendChild(actionCard(CG.getAction(id), p)));
    p.partners.forEach((id) => hand.appendChild(partnerCard(CG.getPartnership(id), p)));
    stage.appendChild(hand);

    const end = h(`<button class="btn btn-primary turn-end" id="end-turn">${t("endTurn")} →</button>`);
    stage.appendChild(end);

    abBtn.addEventListener("click", () => useAbilityFlow(p));
    end.addEventListener("click", () => advanceTurn());
  }

  function capDots(p) {
    let out = "";
    for (let i = 0; i < p.capacityMax; i++) out += `<span class="cap-dot ${i < p.capacity ? "on" : ""}"></span>`;
    return out;
  }

  function actionCard(card, p) {
    const pillar = CG.getPillar(card.pillar);
    const can = CG.Engine.canPlay(p, card);
    const el = h(`<div class="card action ${can.ok ? "" : "disabled"}" data-id="${card.id}" tabindex="0"
        style="--pcol:${pillar ? pillar.color : "#888"}">
      <div class="card-top"><span class="card-ic">${card.icon}</span><span class="card-pillar">${pillar ? t(pillar.labelKey) : t("pillarCoordination")}</span></div>
      <div class="card-name">${loc(card, "name")}</div>
      <div class="card-cost">${costLine(card)}</div>
      <div class="card-effect">${actionEffectLine(card)}</div>
      <div class="card-flavor">${loc(card, "flavor")}</div>
      ${CG.state.settings.fieldNotes ? `<div class="card-note">📎 ${loc(card, "fieldNote")}</div>` : ""}
      <button class="btn btn-play" ${can.ok ? "" : "disabled"}>${can.ok ? t("playCard") : t(can.reason)}</button>
    </div>`);
    el.querySelector(".btn-play").addEventListener("click", (e) => { e.stopPropagation(); playActionFlow(card, p); });
    return el;
  }

  function partnerCard(card, p) {
    const can = CG.Engine.canPlay(p, card);
    const pillar = CG.getPillar(card.synergyPillar);
    const el = h(`<div class="card partner ${can.ok ? "" : "disabled"}" data-id="${card.id}" tabindex="0">
      <div class="card-top"><span class="card-ic">${card.icon}</span><span class="card-pillar">${card.archetype}</span></div>
      <div class="card-name">${loc(card, "name")}</div>
      <div class="card-cost">${costLine(card)}</div>
      <div class="card-effect">🤝 Synergy with <strong>${pillar ? t(pillar.labelKey) : "any"}</strong>: ${bonusLine(card.bonus)}</div>
      <div class="card-flavor">${loc(card, "flavor")}</div>
      ${CG.state.settings.fieldNotes ? `<div class="card-note">📎 ${loc(card, "fieldNote")}</div>` : ""}
      <button class="btn btn-play" ${can.ok ? "" : "disabled"}>${can.ok ? t("playCard") : t(can.reason)}</button>
    </div>`);
    el.querySelector(".btn-play").addEventListener("click", (e) => { e.stopPropagation(); playPartnerFlow(card, p); });
    return el;
  }

  function costLine(card) {
    const c = card.cost || {};
    const parts = [];
    if (c.funding) parts.push(RES_ICON.funding + c.funding);
    if (c.data) parts.push(RES_ICON.data + c.data);
    if (c.coordination) parts.push(RES_ICON.coordination + c.coordination);
    if (c.trust) parts.push(RES_ICON.trust + c.trust);
    parts.push(RES_ICON.capacity + (c.capacity || 1));
    return parts.join(" ");
  }
  function actionEffectLine(card) {
    const e = card.effect || {};
    const parts = [];
    if (e.progress) parts.push("+" + e.progress + " " + (e.pillarChoice ? "chosen pillar" : pName(card.pillar)));
    if (e.trust) parts.push("+" + e.trust + " " + t("trust"));
    if (e.gain) Object.keys(e.gain).forEach((k) => parts.push("+" + e.gain[k] + " " + t(k)));
    if (e.crisisFix) parts.push("−crisis ×" + e.crisisFix);
    if (e.special === "peekTwo" || e.special === "peekOne") parts.push("🔭 peek");
    if (e.special === "extraCapacity") parts.push("+1 🔋");
    parts.push("⭐" + (e.impact || 0));
    return parts.join(" · ");
  }
  function bonusLine(b) {
    if (!b) return "";
    const parts = [];
    if (b.progress) parts.push("+" + b.progress);
    if (b.trust) parts.push("+" + b.trust + " " + t("trust"));
    if (b.crisisFix) parts.push("−crisis");
    if (b.gain) Object.keys(b.gain).forEach((k) => parts.push("+" + b.gain[k] + " " + t(k)));
    return parts.join(" · ");
  }

  function playActionFlow(card, p) {
    const s = CG.state;
    const doPlay = (opts) => {
      const before = snapshot();
      const r = CG.Engine.playAction(card.id, opts);
      if (r && !r.ok) { UI.toast(t(r.reason)); return; }
      sfx("play");
      const m = CG.Engine.takeNewMilestone();
      if (m) celebrateMilestone(m);
      flashDeltas(before);
      render();
    };
    if (card.effect && card.effect.pillarChoice) {
      pillarChooser((pillarId) => doPlay({ pillar: pillarId }));
    } else doPlay({});
  }
  function playPartnerFlow(card, p) {
    const r = CG.Engine.playPartnership(card.id);
    if (r && !r.ok) { UI.toast(t(r.reason)); return; }
    sfx("card");
    UI.toast("🤝 " + loc(card, "name") + " — synergy ready for your next matching action.");
    render();
  }

  function pillarChooser(cb) {
    const body = h('<div class="chooser"><h3>Direct this joint effort to…</h3><div class="chooser-grid"></div></div>');
    const grid = body.querySelector(".chooser-grid");
    CG.PILLARS.forEach((p) => {
      const b = h(`<button class="chooser-btn" style="--pcol:${p.color}"><span>${p.icon}</span>${t(p.labelKey)}</button>`);
      b.addEventListener("click", () => { UI.closeModal(); cb(p.id); });
      grid.appendChild(b);
    });
    UI.modal(body);
  }

  function useAbilityFlow(p) {
    const role = CG.getRole(p.roleId);
    if (role.id === "donor") {
      pillarChooser((pillarId) => { applyAbility(p, { pillar: pillarId }); });
      return;
    }
    if (role.id === "foresight") {
      applyAbility(p, {});
      const ids = CG.state.peek || CG.Engine.peekEvents(2);
      showPeek(ids, true);
      return;
    }
    applyAbility(p, {});
  }
  function applyAbility(p, args) {
    const before = snapshot();
    const r = CG.Engine.useAbility(args);
    if (r && !r.ok) { UI.toast(t(r.reason)); return; }
    sfx("trust");
    UI.toast("⚡ " + r.msg);
    const m = CG.Engine.takeNewMilestone();
    if (m) celebrateMilestone(m);
    flashDeltas(before);
    render();
  }

  function suggestMove(p) {
    const s = CG.state;
    const weakest = Object.keys(s.country.pillars).filter((k) => s.country.pillars[k] < 100).sort((a, b) => s.country.pillars[a] - s.country.pillars[b])[0];
    if (s.country.crises.length >= 2) {
      const fix = p.hand.map((id) => CG.getAction(id)).find((c) => c.effect.crisisFix && CG.Engine.canPlay(p, c).ok);
      if (fix) return `Crises are stacking — <strong>${loc(fix, "name")}</strong> would ease the pressure.`;
    }
    if (s.country.trust < 30) {
      const tr = p.hand.map((id) => CG.getAction(id)).find((c) => (c.effect.trust || 0) >= 3 && CG.Engine.canPlay(p, c).ok);
      if (tr) return `Trust is low — <strong>${loc(tr, "name")}</strong> rebuilds it.`;
    }
    const adv = p.hand.map((id) => CG.getAction(id)).find((c) => (c.effect.pillar || c.pillar) === weakest && CG.Engine.canPlay(p, c).ok);
    if (adv) return `Your weakest priority is <strong>${pName(weakest)}</strong> — <strong>${loc(adv, "name")}</strong> advances it.`;
    return `Build resources or convene partners to set up a bigger move next month.`;
  }

  // ---- turn advance / AI -------------------------------------------------
  function advanceTurn() {
    const s = CG.state;
    const res = CG.Engine.nextPlayer();
    if (res.done) { CG.Engine.endActionPhase(); render(); return; }
    const np = s.players[s.current];
    if (np.isAI) { render(); }
    else passOverlay(np);
  }

  function passOverlay(player) {
    const ov = h(`<div class="overlay pass-overlay">
      <div class="pass-card">
        <div class="pass-ic">🤝</div>
        <h2>${t("passDevice", { name: player.name })}</h2>
        <p>${loc(CG.getRole(player.roleId), "name")}</p>
        <button class="btn btn-primary" id="pass-ready">${t("ready")}</button>
      </div></div>`);
    document.body.appendChild(ov);
    ov.querySelector("#pass-ready").addEventListener("click", () => { ov.remove(); render(); });
  }

  function runAITurn(stage) {
    const s = CG.state;
    const p = s.players[s.current];
    flow.aiBusy = true;
    stage.innerHTML = "";
    const panel = h(`<div class="ai-turn fade-in">
      <div class="turn-who"><span class="role-ic" style="background:${CG.getRole(p.roleId).color}">${CG.getRole(p.roleId).icon}</span>
        <div><strong>${p.name}</strong><span class="role-name">${loc(CG.getRole(p.roleId),"name")} · AI</span></div></div>
      <div class="ai-status">${t("aiThinking", { name: p.name })}</div>
      <div class="ai-moves" id="ai-moves"></div>
    </div>`);
    stage.appendChild(panel);

    const moves = CG.AI.planTurn(p);
    const movesBox = panel.querySelector("#ai-moves");
    let i = 0;
    const delay = reduced() ? 350 : 1100;

    function step() {
      if (i >= moves.length) {
        panel.querySelector(".ai-status").textContent = "✓ " + p.name + " " + (s.lang === "ar" ? "أنهى دوره" : "is done.");
        setTimeout(() => { flow.aiBusy = false; advanceTurn(); }, reduced() ? 250 : 700);
        return;
      }
      const mv = moves[i++];
      const before = snapshot();
      let label = "";
      if (mv.type === "ability") { const r = CG.Engine.useAbility(mv.args); label = "⚡ " + CG.getRole(p.roleId).ability; sfx("trust"); }
      else if (mv.type === "partnership") { const r = CG.Engine.playPartnership(mv.id); if (r && !r.ok) { step(); return; } label = "🤝 " + loc(CG.getPartnership(mv.id), "name"); sfx("card"); }
      else { const r = CG.Engine.playAction(mv.id, mv.opts); if (r && !r.ok) { step(); return; } label = CG.getAction(mv.id).icon + " " + loc(CG.getAction(mv.id), "name"); sfx("play"); }
      const m = CG.Engine.takeNewMilestone();
      if (m) celebrateMilestone(m);
      const row = h(`<div class="ai-move slide-in"><div class="ai-move-card">${label}</div><div class="ai-reason">💬 ${mv.reasoning}</div></div>`);
      movesBox.appendChild(row);
      // live-update dashboard
      const dash = $(".dashboard"); if (dash) dash.replaceWith(dashboard());
      flashDeltas(before);
      setTimeout(step, delay);
    }
    setTimeout(step, reduced() ? 200 : 600);
  }

  // ===================================================================== //
  //  RESOLUTION
  // ===================================================================== //
  function stageResolution(stage) {
    const s = CG.state;
    if (s.ended) { renderEnd(); return; }
    const snap = flow.snapshot || snapshot();
    stage.innerHTML = "";
    const dTrust = s.country.trust - snap.trust;
    const card = h(`<div class="resolution-card fade-in">
      <div class="vignette-tag">📋 ${t("monthSummary")}</div>
      <div class="res-summary"></div>
      <div class="reflection-card">
        <div class="refl-tag">💭 ${t("reflection")}</div>
        <p>${s.reflection}</p>
      </div>
      <button class="btn btn-primary" id="res-go">${t("continue")} →</button>
    </div>`);
    const sum = card.querySelector(".res-summary");
    sum.appendChild(deltaChip(t("trust"), dTrust, RES_ICON.trust));
    CG.PILLARS.forEach((p) => {
      const d = s.country.pillars[p.id] - snap.pillars[p.id];
      if (d !== 0) sum.appendChild(deltaChip(t(p.labelKey), d, p.icon));
    });
    const dc = s.country.crises.length - snap.crises;
    if (dc !== 0) sum.appendChild(deltaChip(t("activeCrises"), dc, "⚠️", true));
    if (s.country.milestonesDone.length > snap.milestones.length) {
      const newOnes = s.country.milestonesDone.filter((m) => !snap.milestones.includes(m));
      newOnes.forEach((id) => { const m = CG.MILESTONES.find((x) => x.id === id); sum.appendChild(h(`<div class="delta-chip milestone-chip">★ ${loc(m, "name")}</div>`)); });
    }
    stage.appendChild(card);
    on("#res-go", "click", () => nextMonthOrEnd());
  }

  function deltaChip(label, delta, icon, invert) {
    const good = invert ? delta < 0 : delta > 0;
    const cls = delta === 0 ? "neutral" : good ? "up" : "down";
    return h(`<div class="delta-chip ${cls}"><span>${icon}</span> ${label} <strong>${delta > 0 ? "+" : ""}${delta}</strong></div>`);
  }

  function nextMonthOrEnd() {
    const s = CG.state;
    if (s.ended) { renderEnd(); return; }
    const r = CG.Engine.advanceMonth();
    if (r && r.ended) { renderEnd(); return; }
    beginMonth();
  }

  // ===================================================================== //
  //  MILESTONE CELEBRATION + DELTAS + TOASTS
  // ===================================================================== //
  function celebrateMilestone(mId) {
    const m = CG.MILESTONES.find((x) => x.id === mId);
    if (!m) return;
    sfx("milestone");
    if (!reduced()) confetti(60);
    const ov = h(`<div class="milestone-pop">
      <div class="mp-inner" style="--pcol:${CG.getPillar(m.pillar).color}">
        <div class="mp-ic">${m.icon}</div>
        <div class="mp-star">★</div>
        <h2>${t("milestones").slice(0, 0)}Milestone reached!</h2>
        <h3>${loc(m, "name")}</h3>
        <p>${loc(m, "reward")}</p>
      </div></div>`);
    document.body.appendChild(ov);
    setTimeout(() => ov.classList.add("show"), 10);
    setTimeout(() => { ov.classList.remove("show"); setTimeout(() => ov.remove(), 400); }, reduced() ? 1400 : 2600);
  }

  function flashDeltas(before) {
    // subtle pulse on changed dashboard values (re-render handles values)
    const dash = $(".dashboard");
    if (dash && !reduced()) { dash.classList.remove("pulse"); void dash.offsetWidth; dash.classList.add("pulse"); }
  }

  UI.toast = function (msg) {
    let wrap = document.getElementById("toast-wrap");
    if (!wrap) { wrap = h('<div id="toast-wrap"></div>'); document.body.appendChild(wrap); }
    const tt = h(`<div class="toast">${msg}</div>`);
    wrap.appendChild(tt);
    setTimeout(() => tt.classList.add("show"), 10);
    setTimeout(() => { tt.classList.remove("show"); setTimeout(() => tt.remove(), 300); }, 2600);
  };

  // confetti (canvas-free, DOM particles)
  function confetti(n) {
    const colors = ["#1a8fe3", "#f6a609", "#06d6a0", "#ef476f", "#9b5de5", "#ffd166"];
    const wrap = h('<div class="confetti"></div>');
    document.body.appendChild(wrap);
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 0.5 + "s";
      p.style.animationDuration = 1.8 + Math.random() * 1.5 + "s";
      p.style.transform = "rotate(" + Math.random() * 360 + "deg)";
      wrap.appendChild(p);
    }
    setTimeout(() => wrap.remove(), 3800);
  }
  UI.confetti = confetti;

  // ===================================================================== //
  //  LOG PANEL
  // ===================================================================== //
  function logPanel() {
    const s = CG.state;
    const panel = h(`<div class="log-panel collapsed" id="log-panel">
      <button class="log-toggle" id="log-toggle">📜 ${t("logTitle")}</button>
      <div class="log-body"></div>
    </div>`);
    const body = panel.querySelector(".log-body");
    s.log.slice(0, 30).forEach((l) => body.appendChild(h(`<div class="log-line kind-${l.kind}">${l.msg}</div>`)));
    panel.querySelector("#log-toggle").addEventListener("click", () => panel.classList.toggle("collapsed"));
    return panel;
  }

  // ===================================================================== //
  //  END SCREEN — Scorecard
  // ===================================================================== //
  function renderEnd() {
    const s = CG.state;
    const r = s.result || CG.Engine.finish();
    UI.root.innerHTML = "";
    if (CG.Audio) CG.Audio.sting(r.tier);
    if (r.tier === "gold" && !reduced()) { confetti(160); }

    const win = r.win;
    const tierTitle = r.tier === "loss" ? t("lossTitle") : t(r.tier);
    const tierDesc = r.tier === "loss" ? t(r.lossReason || "lossTrust")
      : r.tier === "gold" ? t("goldDesc") : r.tier === "silver" ? t("silverDesc") : t("bronzeDesc");

    const screen = h(`<div class="end-screen tier-${r.tier}">
      <div class="end-card">
        <div class="end-medal">${r.tier === "gold" ? "🥇" : r.tier === "silver" ? "🥈" : r.tier === "bronze" ? "🥉" : "🕊️"}</div>
        <div class="end-kicker">${win ? t("victory") : t("lossTitle")}</div>
        <h1>${tierTitle}</h1>
        <p class="end-desc">${tierDesc}</p>
        ${win && r.tier === "gold" ? `<p class="thanks">${t("thanksSahelia")}</p>` : ""}

        <div class="end-stats">
          <div class="stat"><span>${RES_ICON.trust}</span><strong>${r.trust}</strong><em>${t("finalTrust")}</em></div>
          <div class="stat"><span>★</span><strong>${r.milestones}/5</strong><em>${t("milestonesReached")}</em></div>
          <div class="stat"><span>👑</span><strong>${r.mvp}</strong><em>${t("mvp")}</em></div>
        </div>

        <div class="scorecard">
          <h3>📐 ${t("scorecard")}</h3>
          <div class="score-bars"></div>
          <p class="style-reflect">💭 ${r.styleText}</p>
        </div>

        <div class="end-actions">
          <button class="btn btn-primary" id="end-again">${t("playAgain")}</button>
          <button class="btn btn-secondary" id="end-twist">${t("retryTwist")}</button>
          <button class="btn btn-ghost" id="end-menu">${t("menu")}</button>
        </div>
      </div>
    </div>`);
    UI.root.appendChild(screen);

    // quintet bars
    const bars = screen.querySelector(".score-bars");
    const style = r.style;
    const max = Math.max(1, ...CG.PILLARS.map((p) => style[p.id] || 0));
    CG.PILLARS.forEach((p) => {
      const v = style[p.id] || 0;
      bars.appendChild(h(`<div class="score-row">
        <span class="score-lbl">${p.icon} ${t(p.labelKey)}</span>
        <div class="score-track"><div class="score-fill" style="width:${Math.round((v / max) * 100)}%;background:${p.color}"></div></div>
        <span class="score-num">${v}</span>
      </div>`));
    });

    if (win) sfx("win"); else sfx("lose");

    screen.querySelector("#end-again").addEventListener("click", () => CG.replay(false));
    screen.querySelector("#end-twist").addEventListener("click", () => CG.replay(true));
    screen.querySelector("#end-menu").addEventListener("click", () => CG.goMenu());
  }

  // ===================================================================== //
  //  GENERIC MODALS  (also used by main.js)
  // ===================================================================== //
  UI.modal = function (content, onClose) {
    UI.closeModal();
    const ov = h('<div class="overlay modal-overlay" id="modal-overlay"></div>');
    const box = h('<div class="modal-box"></div>');
    const close = h('<button class="modal-close" aria-label="close">✕</button>');
    box.appendChild(close);
    if (typeof content === "string") box.appendChild(h('<div>' + content + '</div>'));
    else box.appendChild(content);
    ov.appendChild(box);
    document.body.appendChild(ov);
    const doClose = () => { ov.remove(); if (onClose) onClose(); };
    close.addEventListener("click", doClose);
    ov.addEventListener("click", (e) => { if (e.target === ov) doClose(); });
    UI._modalClose = doClose;
    return ov;
  };
  UI.closeModal = function () { const o = document.getElementById("modal-overlay"); if (o) o.remove(); UI._modalClose = null; };

  UI.confirm = function (title, msg, onYes) {
    const body = h(`<div class="confirm"><h3>${title}</h3><p>${msg}</p>
      <div class="confirm-btns"><button class="btn btn-primary" id="cf-yes">${t("yes")}</button>
      <button class="btn btn-ghost" id="cf-no">${t("no")}</button></div></div>`);
    UI.modal(body);
    body.querySelector("#cf-yes").addEventListener("click", () => { UI.closeModal(); onYes(); });
    body.querySelector("#cf-no").addEventListener("click", () => UI.closeModal());
  };

  UI.modalHowTo = function () {
    const body = h(`<div class="howto">
      <h2>🧭 ${t("howToPlay")}</h2>
      <p><strong>Goal:</strong> Help Sahelia reach its five national milestones (one per UN 2.0 strategy) while keeping <strong>Trust</strong> above the collapse line — before your term ends.</p>
      <ol>
        <li><strong>Briefing & Event:</strong> A field story sets the scene, then the world acts — a shock, an opening, or a hard choice.</li>
        <li><strong>Your turn:</strong> Spend 🔋 Capacity to play Action cards. Each advances a pillar, shifts Trust, or builds resources. Partnership cards super-charge your next matching action. Use your role's ⚡ ability once per month.</li>
        <li><strong>Resolution:</strong> Crises cost Trust until resolved. Fill a pillar to 100% to complete a Milestone.</li>
      </ol>
      <p><strong>Resources:</strong> 🤝 Trust (the meta-currency) · 💶 Funding · 🔗 Coordination · 📊 Data · 🔋 Capacity.</p>
      <p><strong>The five strategies (Quintet of Change):</strong> Data, Digital, Innovation, Foresight, Behavioural Science. Balance them — hoarding one is never optimal.</p>
      <p><strong>Win tiers:</strong> 🥉 avoid collapse · 🥈 three milestones · 🥇 all five + high trust.</p>
    </div>`);
    UI.modal(body);
  };

  UI.modalSettings = function () {
    const s = CG.state;
    const set = s.settings;
    const body = h(`<div class="settings-modal">
      <h2>⚙ ${t("settings")}</h2>
      <label class="set-row"><span>${t("hintsOn").split(":")[0]}</span><input type="checkbox" id="set-hints" ${set.hints ? "checked" : ""}></label>
      <label class="set-row"><span>${t("fieldNotesOn").split(":")[0]}</span><input type="checkbox" id="set-notes" ${set.fieldNotes ? "checked" : ""}></label>
      <label class="set-row"><span>${t("reducedMotion")}</span><input type="checkbox" id="set-motion" ${set.reducedMotion ? "checked" : ""}></label>
      <label class="set-row"><span>${t("highContrast")}</span><input type="checkbox" id="set-contrast" ${set.highContrast ? "checked" : ""}></label>
      <label class="set-row"><span>${t("mute")}</span><input type="checkbox" id="set-mute" ${set.muted ? "checked" : ""}></label>
      <label class="set-row col"><span>${t("textSize")}</span>
        <input type="range" id="set-text" min="90" max="130" value="${set.textSize || 100}"></label>
      <label class="set-row col"><span>${t("apiKey")}</span>
        <input type="password" id="set-api" placeholder="sk-ant-..." value="${set.apiKey || ""}">
        <small>${t("apiKeyHelp")}</small></label>
      <label class="set-row"><span>${t("glossary")}</span><button class="btn btn-secondary" id="set-glossary">${t("glossary")}</button></label>
      <button class="btn btn-primary" id="set-done">${t("done")}</button>
    </div>`);
    UI.modal(body);
    const bind = (id, fn) => body.querySelector(id).addEventListener("change", fn);
    bind("#set-hints", (e) => { set.hints = e.target.checked; });
    bind("#set-notes", (e) => { set.fieldNotes = e.target.checked; });
    bind("#set-motion", (e) => { set.reducedMotion = e.target.checked; CG.applySettings(); });
    bind("#set-contrast", (e) => { set.highContrast = e.target.checked; CG.applySettings(); });
    bind("#set-mute", (e) => { set.muted = e.target.checked; CG.Audio && CG.Audio.setMuted(set.muted); });
    body.querySelector("#set-text").addEventListener("input", (e) => { set.textSize = +e.target.value; CG.applySettings(); });
    body.querySelector("#set-api").addEventListener("change", (e) => { set.apiKey = e.target.value.trim(); });
    body.querySelector("#set-glossary").addEventListener("click", () => CG.showGlossary());
    body.querySelector("#set-done").addEventListener("click", () => { UI.closeModal(); render(); });
  };

  UI.render = render;
})();
