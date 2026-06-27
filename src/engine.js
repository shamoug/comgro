/* =========================================================================
 * COMMON GROUND, engine.js
 * The rules engine. Pure logic: builds and mutates game state, knows nothing
 * about the DOM. The UI (ui.js) reads state and calls these methods.
 *
 * Phase flow per "month" (round):
 *   briefing -> foresight -> event -> action(per player) -> resolution -> reflection
 * Acts: I..IV, each `monthsPerAct` months. Difficulty scales the world.
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});

  // ---- Seedable RNG (mulberry32) for daily challenge reproducibility -----
  function strHash(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const round = Math.round;

  // Localized pillar label (for logs/messages).
  function plabel(id) {
    if (id === "coordination") return CG.t("pillarCoordination");
    const p = CG.getPillar && CG.getPillar(id);
    return p ? CG.t(p.labelKey) : id;
  }

  const DIFFICULTY = {
    easy:   { neg: 0.7, pos: 1.15, crisisCap: 6, startTrust: 58, eventCount: 1, label: "diffEasy" },
    normal: { neg: 1.0, pos: 1.0,  crisisCap: 5, startTrust: 50, eventCount: 1, label: "diffNormal" },
    hard:   { neg: 1.3, pos: 0.9,  crisisCap: 4, startTrust: 44, eventCount: 1, label: "diffHard" },
  };

  const HAND_SIZE = 5;
  const PARTNER_HAND = 2;
  const BASE_CAPACITY = 3;
  const MONTHS_PER_ACT = 3;

  const Engine = (CG.Engine = {});

  // ---- Deck building -----------------------------------------------------
  function shuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildEventDeck(rng) {
    // Weighted by rarity.
    const pool = [];
    CG.EVENTS.forEach((e) => {
      const w = CG.RARITY_WEIGHT[e.rarity] || 1;
      for (let i = 0; i < w; i++) pool.push(e.id);
    });
    return shuffle(pool, rng);
  }

  function refillEventDeck(s) {
    s.decks.event = buildEventDeck(s.rng);
  }

  function drawActions(s, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      if (s.decks.action.length === 0) {
        s.decks.action = shuffle(s.discards.action.length ? s.discards.action : CG.ACTIONS.map((a) => a.id), s.rng);
        s.discards.action = [];
      }
      out.push(s.decks.action.pop());
    }
    return out;
  }
  function drawPartnerships(s, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      if (s.decks.partnership.length === 0) {
        s.decks.partnership = shuffle(CG.PARTNERSHIPS.map((p) => p.id), s.rng);
      }
      out.push(s.decks.partnership.pop());
    }
    return out;
  }

  // ---- New game ----------------------------------------------------------
  Engine.newGame = function (cfg) {
    const seedStr = cfg.seed || "cg-" + Math.floor(performance.now() * 1000);
    const rng = mulberry32(strHash(String(seedStr)));
    const diff = DIFFICULTY[cfg.difficulty] || DIFFICULTY.normal;

    const players = cfg.players.map((p, i) => {
      const role = CG.getRole(p.roleId) || CG.ROLES[i % CG.ROLES.length];
      return {
        id: "p" + i,
        name: p.name || role.name,
        roleId: role.id,
        isAI: !!p.isAI,
        aiGoal: null,
        capacity: BASE_CAPACITY,
        capacityMax: BASE_CAPACITY,
        impact: 0,
        abilityUsed: false,
        hand: [],
        partners: [],
        style: { data: 0, digital: 0, innovation: 0, foresight: 0, behavioural: 0, coordination: 0 },
        startBonus: role.start || {},
      };
    });

    // Starting condition (random unless seeded chooses one).
    const cond = cfg.startCondition || CG.START_CONDITIONS[Math.floor(rng() * CG.START_CONDITIONS.length)];
    const mods = cond.mods || {};

    const s = {
      lang: (CG.state && CG.state.lang) || "en",
      settings: (CG.state && CG.state.settings) || {},
      seed: seedStr,
      rng,
      mode: cfg.mode || "solo",
      difficulty: cfg.difficulty || "normal",
      diff,
      isQuick: cfg.mode === "quick",
      players,
      current: 0,
      country: {
        trust: clamp(diff.startTrust + (mods.trust || 0), 0, 100),
        trustMax: 100,
        pillars: { data: 0, digital: 0, innovation: 0, foresight: 0, behavioural: 0 },
        milestonesDone: [],
        crises: [],
      },
      pool: {
        funding: 4 + (mods.funding || 0),
        data: 3 + (mods.data || 0),
        coordination: 3 + (mods.coordination || 0),
      },
      act: 1,
      monthInAct: 0,
      monthTotal: 0,
      monthsPerAct: MONTHS_PER_ACT,
      totalActs: cfg.mode === "quick" ? 1 : 4,
      phase: "menu",
      decks: { event: [], action: shuffle(CG.ACTIONS.map((a) => a.id), rng), partnership: shuffle(CG.PARTNERSHIPS.map((p) => p.id), rng) },
      discards: { action: [], partnership: [] },
      pending: { event: null, eventResolved: false, options: null },
      peek: null,
      turnBuffs: null,
      log: [],
      reflection: "",
      vignette: "",
      condition: cond,
      ended: false,
      result: null,
      usedVignettes: [],
      usedReflections: [],
    };

    // apply pool floors
    s.pool.funding = Math.max(0, s.pool.funding);
    s.pool.data = Math.max(0, s.pool.data);
    s.pool.coordination = Math.max(0, s.pool.coordination);

    refillEventDeck(s);

    // start bonuses
    players.forEach((p) => {
      const b = p.startBonus;
      if (b.funding) s.pool.funding += b.funding;
      if (b.data) s.pool.data += b.data;
      if (b.coordination) s.pool.coordination += b.coordination;
      if (b.trust) s.country.trust = clamp(s.country.trust + b.trust, 0, 100);
      if (b.capacity) p.capacityMax += b.capacity;
    });

    if (mods.startCrisis) s.country.crises.push(Object.assign({ id: "c0", age: 0 }, mods.startCrisis));

    CG.state = Object.assign(CG.state || {}, s);
    Engine.log(CG.t("act") + " I: " + CG.loc(cond, "name"));
    return CG.state;
  };

  Engine.log = function (msg, kind) {
    const s = CG.state;
    if (!s.log) s.log = [];
    s.log.unshift({ msg, kind: kind || "info", month: s.monthTotal });
    if (s.log.length > 60) s.log.pop();
  };

  // ---- Month / phase orchestration --------------------------------------
  Engine.startMonth = function () {
    const s = CG.state;
    s.monthInAct++;
    s.monthTotal++;
    // pick a vignette for the current act; store its global index as a content key
    const pool = CG.getVignettes(s.act).filter((v) => !s.usedVignettes.includes(v.text));
    const list = pool.length ? pool : CG.getVignettes(s.act);
    const v = list[Math.floor(s.rng() * list.length)];
    s.vignetteKey = v ? "v" + CG.VIGNETTES.indexOf(v) : "";
    s.vignette = v ? v.text : ""; // English fallback
    if (v) s.usedVignettes.push(v.text);

    // refill hands
    s.players.forEach((p) => {
      p.capacity = p.capacityMax;
      p.abilityUsed = false;
      while (p.hand.length < HAND_SIZE) p.hand.push(...drawActions(s, 1));
      while (p.partners.length < PARTNER_HAND) p.partners.push(...drawPartnerships(s, 1));
    });

    s.turnBuffs = null;
    s.pending = { event: null, eventResolved: false, options: null };
    s.phase = "briefing";
    return s;
  };

  Engine.drawEvent = function () {
    const s = CG.state;
    if (s.decks.event.length === 0) refillEventDeck(s);
    const id = s.peek && s.peek.length ? s.peek.shift() : s.decks.event.pop();
    const ev = CG.getEvent(id);
    s.pending.event = ev;
    s.pending.eventResolved = false;
    s.pending.options = ev && ev.type === "dilemma" ? ev.options : null;
    s.phase = "event";
    return ev;
  };

  // Foresight peek: look at top N event ids (returns ids), allow reorder.
  Engine.peekEvents = function (n) {
    const s = CG.state;
    if (s.decks.event.length < n) refillEventDeck(s);
    const top = [];
    for (let i = 0; i < n; i++) top.push(s.decks.event[s.decks.event.length - 1 - i]);
    return top; // order: top[0] is next
  };
  Engine.reorderTop = function (newOrderIds) {
    const s = CG.state;
    // remove these from end and push in reverse so newOrderIds[0] ends on top
    newOrderIds.forEach((id) => {
      const idx = s.decks.event.lastIndexOf(id);
      if (idx >= 0) s.decks.event.splice(idx, 1);
    });
    for (let i = newOrderIds.length - 1; i >= 0; i--) s.decks.event.push(newOrderIds[i]);
  };

  // ---- Event resolution --------------------------------------------------
  Engine.resolveEvent = function (optionIndex) {
    const s = CG.state;
    const ev = s.pending.event;
    if (!ev || s.pending.eventResolved) return;
    let eff;
    if (ev.type === "dilemma") {
      eff = ev.options[optionIndex || 0].effect;
      Engine.log(CG.loc(ev, "name") + " → " + ev.options[optionIndex || 0].label, "event");
    } else {
      eff = ev.effect;
      Engine.log(CG.loc(ev, "name"), ev.type === "shock" ? "shock" : "opening");
    }

    // Foresight shield: if any player just used HRO shield, halve trust dmg.
    applyEventEffect(s, eff, ev);
    s.pending.eventResolved = true;
    s.shieldNext = false;
    s.counterMisinfo = false;
    s.phase = "planning";
    return eff;
  };

  function scaleNeg(s, v) { return round(v * s.diff.neg); }
  function scalePos(s, v) { return round(v * s.diff.pos); }

  function applyEventEffect(s, eff, ev) {
    if (!eff) return;
    const c = s.country;
    // Trust
    if (typeof eff.trust === "number") {
      let t = eff.trust;
      if (t < 0) {
        t = -scaleNeg(s, -t);
        if (s.shieldNext) { t = round(t / 2); }
      } else {
        t = scalePos(s, t);
      }
      c.trust = clamp(c.trust + t, 0, 100);
    }
    // Misinfo handled by comms counter
    if (eff.misinfo && s.counterMisinfo) {
      // neutralised: skip pillar damage from misinfo
    } else {
      if (eff.pillar && eff.damage) {
        if (c.pillars[eff.pillar] !== undefined) {
          c.pillars[eff.pillar] = clamp(c.pillars[eff.pillar] - scaleNeg(s, eff.damage), 0, 100);
        } else if (eff.pillar === "coordination") {
          s.pool.coordination = Math.max(0, s.pool.coordination - scaleNeg(s, eff.damage));
        }
      }
    }
    if (eff.pillar && eff.boost) {
      if (c.pillars[eff.pillar] !== undefined) {
        c.pillars[eff.pillar] = clamp(c.pillars[eff.pillar] + scalePos(s, eff.boost), 0, 100);
      } else if (eff.pillar === "coordination") {
        // 'coordination' is a cross-cutting resource, not a milestone track.
        s.pool.coordination += Math.max(1, Math.round(scalePos(s, eff.boost) / 2));
      }
    }
    if (eff.gain) {
      if (eff.gain.funding) s.pool.funding += scalePos(s, eff.gain.funding);
      if (eff.gain.data) s.pool.data += scalePos(s, eff.gain.data);
      if (eff.gain.coordination) s.pool.coordination += scalePos(s, eff.gain.coordination);
    }
    if (eff.drain) {
      if (eff.drain.funding) s.pool.funding = Math.max(0, s.pool.funding - scaleNeg(s, eff.drain.funding));
      if (eff.drain.data) s.pool.data = Math.max(0, s.pool.data - scaleNeg(s, eff.drain.data));
      if (eff.drain.coordination) s.pool.coordination = Math.max(0, s.pool.coordination - scaleNeg(s, eff.drain.coordination));
    }
    if (eff.capacityAll) {
      s.players.forEach((p) => { p.capacity = Math.max(0, p.capacity + eff.capacityAll); p.capacityMax = Math.max(1, p.capacityMax + (eff.capacityAll > 0 && s.phase !== 'event' ? 0 : 0)); });
    }
    if (eff.crisis) {
      // HRO shield reduces severity by 1 if active
      const sev = Math.max(1, eff.crisis.severity + (s.diff.neg > 1 ? 1 : 0) - (s.shieldNext ? 1 : 0));
      s.country.crises.push({ id: "c" + s.monthTotal + "_" + s.country.crises.length, name: eff.crisis.name, type: eff.crisis.type, severity: sev, age: 0 });
    }
    if (eff.resolveCrisis) Engine.resolveCrises(eff.resolveCrisis);
    checkMilestones(s);
  }

  // ---- Action / partnership play ----------------------------------------
  function effectiveCost(s, p, card) {
    const cost = Object.assign({ funding: 0, data: 0, coordination: 0, capacity: 0 }, card.cost || {});
    const tb = s.turnBuffs || {};
    if (tb.costReduction && tb.costReduction.uses > 0 && cost.funding > 0) {
      cost.funding = Math.max(0, cost.funding - tb.costReduction.amount);
    }
    if (tb.waiveFunding) cost.funding = 0;
    // trust as a cost (rare)
    return cost;
  }

  Engine.canPlay = function (p, card) {
    const s = CG.state;
    const cost = effectiveCost(s, p, card);
    if (p.capacity < (cost.capacity || 1)) return { ok: false, reason: "noCapacity" };
    if ((cost.funding || 0) > s.pool.funding) return { ok: false, reason: "cannotAfford" };
    if ((cost.data || 0) > s.pool.data) return { ok: false, reason: "cannotAfford" };
    if ((cost.coordination || 0) > s.pool.coordination) return { ok: false, reason: "cannotAfford" };
    if ((card.cost && card.cost.trust || 0) > s.country.trust) return { ok: false, reason: "cannotAfford" };
    return { ok: true };
  };

  Engine.playAction = function (actionId, opts) {
    const s = CG.state;
    const p = s.players[s.current];
    const card = CG.getAction(actionId);
    if (!card) return;
    const chk = Engine.canPlay(p, card);
    if (!chk.ok) return chk;

    const cost = effectiveCost(s, p, card);
    p.capacity -= (cost.capacity || 1);
    s.pool.funding -= (cost.funding || 0);
    s.pool.data -= (cost.data || 0);
    s.pool.coordination -= (cost.coordination || 0);
    if (card.cost && card.cost.trust) s.country.trust = clamp(s.country.trust - card.cost.trust, 0, 100);

    // decrement cost-reduction buff use
    const tb = s.turnBuffs || {};
    if (tb.costReduction && tb.costReduction.uses > 0 && (card.cost && card.cost.funding)) tb.costReduction.uses--;
    if (tb.waiveFunding) tb.waiveFunding = false;

    applyActionEffect(s, p, card, opts);

    // remove from hand
    const i = p.hand.indexOf(actionId);
    if (i >= 0) p.hand.splice(i, 1);
    s.discards.action.push(actionId);
    return { ok: true };
  };

  Engine.playPartnership = function (partnerId) {
    const s = CG.state;
    const p = s.players[s.current];
    const card = CG.getPartnership(partnerId);
    if (!card) return;
    const chk = Engine.canPlay(p, card);
    if (!chk.ok) return chk;
    const cost = effectiveCost(s, p, card);
    p.capacity -= (cost.capacity || 1);
    s.pool.funding -= (cost.funding || 0);
    s.pool.data -= (cost.data || 0);
    s.pool.coordination -= (cost.coordination || 0);

    // Set a synergy buff that applies to the next matching action.
    s.turnBuffs = s.turnBuffs || {};
    s.turnBuffs.partnership = { id: card.id, synergyPillar: card.synergyPillar, bonus: card.bonus, name: card.name };
    Engine.log(CG.t("aiPlayed", { name: p.name, card: CG.loc(card, "name") }), "play");

    const i = p.partners.indexOf(partnerId);
    if (i >= 0) p.partners.splice(i, 1);
    s.discards.partnership.push(partnerId);
    checkMilestones(s);
    return { ok: true };
  };

  function applyActionEffect(s, p, card, opts) {
    const eff = Object.assign({}, card.effect || {});
    let pillar = eff.pillar || card.pillar;
    if (eff.pillarChoice && opts && opts.pillar) pillar = opts.pillar;

    let progress = eff.progress || 0;
    let trust = eff.trust || 0;
    let crisisFix = eff.crisisFix || 0;
    const gain = Object.assign({}, eff.gain || {});
    let impact = eff.impact || 0;

    const tb = s.turnBuffs || {};

    // RC Align buff: synergy bonus to next action
    if (tb.alignBonus) { progress += 5; trust += 1; tb.alignBonus = false; Engine.log(CG.tc("log.alignSynergy"), "ability"); }

    // Donor priority pillar: double progress on that pillar
    if (tb.priorityPillar && pillar === tb.priorityPillar && progress > 0) { progress *= 2; }

    // Youth Amplify: double behavioural action effect
    if (tb.amplifyBehavioural && pillar === "behavioural") {
      progress *= 2; trust *= 2; tb.amplifyBehavioural = false;
      Engine.log(CG.tc("log.amplify"), "ability");
    }

    // Partnership synergy
    if (tb.partnership) {
      const ps = tb.partnership;
      if (ps.synergyPillar === "any" || ps.synergyPillar === pillar || (pillar === "coordination")) {
        const b = ps.bonus || {};
        progress += b.progress || 0;
        trust += b.trust || 0;
        crisisFix += b.crisisFix || 0;
        if (b.gain) { if (b.gain.funding) gain.funding = (gain.funding||0)+b.gain.funding; if (b.gain.coordination) gain.coordination=(gain.coordination||0)+b.gain.coordination; if (b.gain.data) gain.data=(gain.data||0)+b.gain.data; }
        Engine.log(CG.tc("log.synergy", { partner: CG.loc(CG.getPartnership(ps.id) || { id: ps.id }, "name"), card: CG.loc(card, "name") }), "synergy");
        s.turnBuffs.partnership = null;
      }
    }

    if (pillar && progress) {
      if (s.country.pillars[pillar] !== undefined) {
        s.country.pillars[pillar] = clamp(s.country.pillars[pillar] + progress, 0, 100);
      } else if (pillar === "coordination") {
        // safety: a coordination-targeted action without a chosen pillar
        s.pool.coordination += Math.max(1, Math.round(progress / 2));
      }
    }
    if (trust) s.country.trust = clamp(s.country.trust + trust, 0, 100);
    if (gain.funding) s.pool.funding += gain.funding;
    if (gain.data) s.pool.data += gain.data;
    if (gain.coordination) s.pool.coordination += gain.coordination;
    if (crisisFix) Engine.resolveCrises(crisisFix);

    // specials
    if (eff.special === "extraCapacity") p.capacity += 1;
    if (eff.special === "peekTwo") s.peek = Engine.peekEvents(2).slice();
    if (eff.special === "peekOne") s.peek = Engine.peekEvents(1).slice();

    // track style + impact
    if (pillar && s.country.pillars[pillar] !== undefined) p.style[pillar] = (p.style[pillar] || 0) + (progress || 1);
    if (card.pillar === "coordination") p.style.coordination = (p.style.coordination || 0) + 1;
    p.impact += impact;

    Engine.log(p.name + ": " + CG.loc(card, "name") + (progress ? " (+" + progress + " " + plabel(pillar) + ")" : ""), "play");
    checkMilestones(s);
  }

  // ---- Crises ------------------------------------------------------------
  Engine.resolveCrises = function (amount) {
    const s = CG.state;
    let a = amount;
    // reduce severity of the worst crises first
    s.country.crises.sort((x, y) => y.severity - x.severity);
    for (const cr of s.country.crises) {
      if (a <= 0) break;
      const cut = Math.min(cr.severity, a);
      cr.severity -= cut;
      a -= cut;
    }
    s.country.crises = s.country.crises.filter((c) => c.severity > 0);
  };

  function crisisUpkeep(s) {
    // each active crisis costs trust = severity; then ages (severity -1 every 2 months mild decay)
    let total = 0;
    s.country.crises.forEach((c) => { total += c.severity; c.age++; });
    if (total > 0) {
      s.country.trust = clamp(s.country.trust - total, 0, 100);
      Engine.log(CG.tc("log.crisesCost", { n: total }), "shock");
    }
    // mild natural decay on hard? keep crises persistent but decay severity by 1 if age>=2
    s.country.crises.forEach((c) => { if (c.age >= 2) c.severity -= 1; });
    s.country.crises = s.country.crises.filter((c) => c.severity > 0);
  }

  // ---- Milestones / win-loss --------------------------------------------
  function checkMilestones(s) {
    CG.MILESTONES.forEach((m) => {
      if (!s.country.milestonesDone.includes(m.id) && s.country.pillars[m.pillar] >= m.target) {
        s.country.milestonesDone.push(m.id);
        s.country.trust = clamp(s.country.trust + 6, 0, 100);
        Engine.log("★ " + CG.tc("log.milestone", { name: CG.loc(m, "name") }), "milestone");
        s._newMilestone = m.id;
      }
    });
  }
  Engine.takeNewMilestone = function () { const s = CG.state; const m = s._newMilestone; s._newMilestone = null; return m; };

  // ---- Turn / phase advance ---------------------------------------------
  Engine.nextPlayer = function () {
    const s = CG.state;
    s.turnBuffs = null; // buffs are per-turn
    if (s.current < s.players.length - 1) {
      s.current++;
      return { done: false };
    }
    s.current = 0;
    return { done: true }; // all players acted
  };

  Engine.endActionPhase = function () {
    const s = CG.state;
    s.phase = "resolution";
    crisisUpkeep(s);
    checkMilestones(s);
    // reflection: store its index as a content key (rf<index>)
    const pool = CG.REFLECTIONS.filter((r) => !s.usedReflections.includes(r));
    const list = pool.length ? pool : CG.REFLECTIONS;
    const r = list[Math.floor(s.rng() * list.length)];
    s.reflectionKey = "rf" + CG.REFLECTIONS.indexOf(r);
    s.reflection = r; // English fallback
    s.usedReflections.push(r);
    Engine.checkEnd();
  };

  Engine.advanceMonth = function () {
    const s = CG.state;
    if (s.ended) return;
    if (s.monthInAct >= s.monthsPerAct) {
      // next act
      if (s.act >= s.totalActs) {
        Engine.finish();
        return { ended: true };
      }
      s.act++;
      s.monthInAct = 0;
      // escalate: replenish event deck (fresh weighting)
      refillEventDeck(s);
      Engine.log(", " + CG.t("act") + " " + ["I", "II", "III", "IV"][s.act - 1] + ", ", "act");
      return { newAct: true };
    }
    return { newAct: false };
  };

  // ---- End conditions ----------------------------------------------------
  Engine.checkEnd = function () {
    const s = CG.state;
    if (s.ended) return;
    if (s.country.trust <= 0) {
      Engine.finish("lossTrust");
    } else if (s.country.crises.length >= s.diff.crisisCap) {
      Engine.finish("lossCrises");
    }
  };

  Engine.finish = function (lossReason) {
    const s = CG.state;
    if (s.ended) return;
    s.ended = true;
    s.phase = "end";
    const done = s.country.milestonesDone.length;
    const trust = s.country.trust;
    let tier, win;
    if (lossReason || trust <= 0) {
      tier = "loss"; win = false;
    } else if (done >= 5 && trust >= 65) {
      tier = "gold"; win = true;
    } else if (done >= 3 && trust >= 45) {
      tier = "silver"; win = true;
    } else if (trust > 0) {
      tier = "bronze"; win = true;
    } else {
      tier = "loss"; win = false;
    }
    // MVP
    let mvp = s.players[0];
    s.players.forEach((p) => { if (p.impact > mvp.impact) mvp = p; });

    // aggregate style for scorecard (human player 0 in solo, else all)
    const human = s.players.find((p) => !p.isAI) || s.players[0];

    s.result = {
      tier, win, lossReason: lossReason || (trust <= 0 ? "lossTrust" : null),
      milestones: done, trust,
      mvp: mvp.name, mvpRole: mvp.roleId,
      style: human.style,
      styleText: styleReflection(human.style),
      seed: s.seed,
    };
    Engine.log(CG.tc("log.termEnded", { tier: CG.t(tier) || tier }), "milestone");
    return s.result;
  };

  function styleReflection(style) {
    const order = ["data", "digital", "innovation", "foresight", "behavioural", "coordination"];
    const sorted = order.slice().sort((a, b) => (style[b] || 0) - (style[a] || 0));
    const top = sorted.slice(0, 2).filter((k) => style[k] > 0);
    let txt = "";
    if (top.length) txt += CG.tc("style.led", { pillars: top.map((k) => plabel(k)).join(" " + CG.tc("style.and") + " ") });
    const under = ["data", "digital", "innovation", "foresight", "behavioural"].find((k) => (style[k] || 0) === 0);
    if (under) txt += CG.tc("style.under", { pillar: plabel(under) });
    else txt += CG.tc("style.balanced");
    return txt;
  }

  // ---- Ability resolution (called by UI) --------------------------------
  Engine.useAbility = function (args) {
    const s = CG.state;
    const p = s.players[s.current];
    if (p.abilityUsed) return { ok: false, reason: "abilityUsed" };
    const role = CG.getRole(p.roleId);
    s.turnBuffs = s.turnBuffs || {};
    args = args || {};
    let msg = "";
    switch (role.id) {
      case "rc":
        s.pool.coordination += 2; s.turnBuffs.alignBonus = true; msg = CG.tc("abmsg.rc");
        break;
      case "dmo":
        s.pool.data += 3; s.dmoPeek = Engine.peekEvents(1)[0]; msg = CG.tc("abmsg.dmo");
        break;
      case "hro":
        s.shieldNext = true; msg = CG.tc("abmsg.hro");
        break;
      case "ngo":
        s.turnBuffs.waiveFunding = true; msg = CG.tc("abmsg.ngo");
        break;
      case "gov":
        s.country.trust = clamp(s.country.trust + 5, 0, 100); msg = CG.tc("abmsg.gov");
        break;
      case "donor":
        s.pool.funding += 5; s.turnBuffs.priorityPillar = args.pillar || "data"; msg = CG.tc("abmsg.donor", { pillar: plabel(s.turnBuffs.priorityPillar) });
        break;
      case "youth":
        s.turnBuffs.amplifyBehavioural = true; msg = CG.tc("abmsg.youth");
        break;
      case "innolab": {
        const win = s.rng() > 0.4;
        if (win) { s.country.pillars.innovation = clamp(s.country.pillars.innovation + 16, 0, 100); msg = CG.tc("abmsg.innolabWin"); }
        else { s.country.trust = clamp(s.country.trust - 3, 0, 100); msg = CG.tc("abmsg.innolabLose"); }
        break;
      }
      case "foresight":
        s.peek = Engine.peekEvents(2); s.foresightReorder = true; msg = CG.tc("abmsg.foresight");
        break;
      case "comms":
        s.counterMisinfo = true; s.country.trust = clamp(s.country.trust + 3, 0, 100); msg = CG.tc("abmsg.comms");
        break;
      case "logops":
        s.turnBuffs.costReduction = { amount: 1, uses: 2 }; msg = CG.tc("abmsg.logops");
        break;
      case "chw": {
        const inHealth = s.country.crises.some((c) => c.type === "health");
        const conv = Math.min(3, s.pool.data);
        const mult = inHealth ? 2 : 1;
        s.pool.data -= conv;
        s.country.trust = clamp(s.country.trust + conv * mult, 0, 100);
        msg = CG.tc("abmsg.chw", { n: conv, m: conv * mult, bonus: inHealth ? CG.tc("abmsg.chwBonus") : "" });
        break;
      }
    }
    p.abilityUsed = true;
    checkMilestones(s);
    Engine.log("⚡ " + p.name + ", " + CG.loc(role, "ability") + ": " + msg, "ability");
    return { ok: true, msg };
  };

  // expose helpers
  Engine.clamp = clamp;
  Engine.shuffle = shuffle;
  Engine.HAND_SIZE = HAND_SIZE;
})();
