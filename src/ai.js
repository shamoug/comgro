/* =========================================================================
 * COMMON GROUND, ai.js
 * A readable, goal-driven AI opponent. It plays partner roles in Solo mode.
 * It is NOT random: it pursues visible goals (fix crises, lift the weakest
 * pillar, build resources) and explains each move in one plain-language line,
 * which quietly teaches systems thinking.
 *
 * Optional: if an Anthropic API key is supplied, narrateWithAI() can fetch a
 * richer one-line rationale. The rules-based AI is always the default and the
 * game is fully playable without any key.
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});
  const AI = (CG.AI = {});

  // Score a candidate action for the current state.
  function scoreAction(s, p, card) {
    const eff = card.effect || {};
    let score = 0;
    const pillar = eff.pillar || card.pillar;

    // weakest non-complete pillar gets priority
    const pillars = s.country.pillars;
    const weakest = Object.keys(pillars).filter((k) => pillars[k] < 100).sort((a, b) => pillars[a] - pillars[b])[0];

    if (eff.progress) {
      score += eff.progress * 0.6;
      if (pillar === weakest) score += 14; // close the gap
      // don't overfill a near-complete pillar
      if (pillar && pillars[pillar] !== undefined && pillars[pillar] > 88 && pillars[pillar] + eff.progress > 100) score -= 6;
      // push a pillar over the line for a milestone
      if (pillar && pillars[pillar] !== undefined && pillars[pillar] < 100 && pillars[pillar] + eff.progress >= 100) score += 20;
    }
    // crisis pressure
    if (s.country.crises.length > 0 && eff.crisisFix) score += eff.crisisFix * 12;
    // trust safety
    if (s.country.trust < 35 && eff.trust) score += eff.trust * 2.2;
    else if (eff.trust) score += eff.trust * 0.8;
    // resource needs
    if (eff.gain) {
      if (eff.gain.funding && s.pool.funding < 3) score += eff.gain.funding * 2;
      if (eff.gain.coordination && s.pool.coordination < 2) score += eff.gain.coordination * 2;
      if (eff.gain.data && s.pool.data < 2) score += eff.gain.data * 2;
      score += ((eff.gain.funding || 0) + (eff.gain.coordination || 0) + (eff.gain.data || 0)) * 0.4;
    }
    score += (eff.impact || 0) * 0.3;
    return score;
  }

  function reasoningFor(s, card, pillar) {
    const eff = card.effect || {};
    const weakest = Object.keys(s.country.pillars).sort((a, b) => s.country.pillars[a] - s.country.pillars[b])[0];
    if (s.country.crises.length && eff.crisisFix) return CG.tc("ai.crisis");
    if (s.country.trust < 35 && (eff.trust || 0) > 0) return CG.tc("ai.trustLow");
    if (eff.gain && eff.gain.funding && s.pool.funding < 3) return CG.tc("ai.funding");
    if (eff.gain && eff.gain.coordination && s.pool.coordination < 2) return CG.tc("ai.coordination");
    if (pillar === weakest) return CG.tc("ai.weakest", { pillar: pillarName(weakest) });
    if (pillar && s.country.pillars[pillar] >= 100 - (eff.progress || 0) && s.country.pillars[pillar] < 100)
      return CG.tc("ai.milestone", { pillar: pillarName(pillar) });
    return CG.tc("ai.default");
  }
  function pillarName(id) {
    if (id === "coordination") return CG.t("pillarCoordination");
    const p = CG.getPillar(id);
    return p ? CG.t(p.labelKey) : id;
  }

  // Decide an ability use (simple heuristics). Returns a tc key for narration.
  function planAbility(s, p) {
    const role = CG.getRole(p.roleId);
    const c = s.country;
    switch (role.id) {
      case "gov": if (c.trust < 45) return { use: true, key: "ai.ab.gov" }; break;
      case "comms": if (c.crises.length || c.trust < 40) return { use: true, key: "ai.ab.comms" }; break;
      case "hro": if (c.trust < 50) return { use: true, key: "ai.ab.hro" }; break;
      case "donor": if (s.pool.funding < 4) return { use: true, pillar: weakestPillar(s), key: "ai.ab.donor" }; break;
      case "logops": if (s.pool.funding < 5) return { use: true, key: "ai.ab.logops" }; break;
      case "chw": if (s.pool.data > 1 && c.trust < 55) return { use: true, key: "ai.ab.chw" }; break;
      case "foresight": return { use: true, key: "ai.ab.foresight" };
      case "dmo": if (s.pool.data < 3) return { use: true, key: "ai.ab.dmo" }; break;
      case "rc": if (s.pool.coordination < 3) return { use: true, key: "ai.ab.rc" }; break;
      default: break;
    }
    // generic: use ability if it helps and is cheap
    if (["youth", "innolab", "ngo"].includes(role.id)) return { use: true, key: "ai.ab.generic" };
    return { use: false };
  }
  function weakestPillar(s) {
    return Object.keys(s.country.pillars).sort((a, b) => s.country.pillars[a] - s.country.pillars[b])[0];
  }

  // Plan a full AI turn -> ordered list of moves the UI executes with delays.
  AI.planTurn = function (player) {
    const s = CG.state;
    const moves = [];

    // 1) maybe use ability first
    const ab = planAbility(s, player);
    if (ab.use && !player.abilityUsed) {
      moves.push({ type: "ability", args: { pillar: ab.pillar || weakestPillar(s) }, reasoning: CG.tc(ab.key) });
    }

    // Local capacity ledger so we never mutate the player's real capacity
    // during planning. The engine spends the real capacity at execution time.
    let capLeft = player.capacity;
    const planned = new Set(); // action ids already queued (one of each per turn)

    // 2) maybe play a partnership if a strong matching action is in hand
    const weakest = weakestPillar(s);
    const partnerMatch = player.partners
      .map((id) => CG.getPartnership(id))
      .find((pp) => pp && (pp.synergyPillar === weakest) && CG.Engine.canPlay(player, pp).ok);
    if (partnerMatch && capLeft >= 2) {
      moves.push({ type: "partnership", id: partnerMatch.id, reasoning: CG.tc("ai.partner", { partner: CG.loc(partnerMatch, "name") }) });
      capLeft -= 1;
    }

    // 3) play actions while capacity remains (greedy by score, re-evaluated)
    let guard = 0;
    while (capLeft > 0 && guard < 8) {
      guard++;
      const candidates = player.hand
        .map((id) => CG.getAction(id))
        .filter((c) => c && !planned.has(c.id) && CG.Engine.canPlay(player, c).ok && ((c.cost && c.cost.capacity) || 1) <= capLeft)
        .map((c) => ({ card: c, score: scoreAction(s, player, c) }))
        .sort((a, b) => b.score - a.score);
      if (!candidates.length) break;
      const best = candidates[0];
      if (best.score <= 0 && capLeft < player.capacityMax) break;
      const pillar = best.card.effect.pillarChoice ? weakest : (best.card.effect.pillar || best.card.pillar);
      moves.push({
        type: "action",
        id: best.card.id,
        opts: { pillar },
        reasoning: reasoningFor(s, best.card, pillar),
      });
      planned.add(best.card.id);
      capLeft -= (best.card.cost && best.card.cost.capacity) || 1;
    }

    return moves;
  };

  // Decide which dilemma option the AI/world prefers (for solo, the human
  // chooses; this is used if a dilemma must auto-resolve).
  AI.chooseDilemma = function (event) {
    const s = CG.state;
    let best = 0, bestScore = -Infinity;
    event.options.forEach((opt, i) => {
      const e = opt.effect;
      let sc = (e.trust || 0) * (s.country.trust < 40 ? 2 : 1);
      sc += (e.boost || 0) * 0.5;
      if (e.resolveCrisis) sc += e.resolveCrisis * 10;
      if (e.gain && e.gain.funding && s.pool.funding < 3) sc += 6;
      if (e.drain) sc -= ((e.drain.funding || 0) + (e.drain.coordination || 0)) * 1.5;
      if (sc > bestScore) { bestScore = sc; best = i; }
    });
    return best;
  };

  // ---- Optional Anthropic narration -------------------------------------
  AI.narrateWithAI = async function (prompt) {
    const key = (CG.state.settings && CG.state.settings.apiKey) || "";
    if (!key) return null;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 120,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return (data.content && data.content[0] && data.content[0].text) || null;
    } catch (e) {
      return null; // fail silently; rules-based default already shown
    }
  };
})();
