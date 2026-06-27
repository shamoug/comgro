/* =========================================================================
 * COMMON GROUND, ludo.js
 * Field Ludo: a clean, classic four-colour Ludo. You always play against AI
 * rivals. Roll a six to deploy a team from base, race all four teams around the
 * cross and home to the centre, and send rivals back to base on the way.
 *
 * Vanilla JS, no framework. Shares CG.Audio and CG.Narrate. The board, dice and
 * tokens are all CSS/SVG, no external images. Pixel-free: tokens are positioned
 * by percentage on a 15x15 grid, sized in px so they stay round.
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});
  const $ = (sel, root) => (root || document).querySelector(sel);
  const app = () => document.getElementById("app");
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rnd = (n) => Math.floor(Math.random() * n);
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ---- the 56-cell main loop (x = col, y = row, 0..14) ------------------
  const LOOP = [
    [1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[6,5],[6,4],[6,3],[6,2],[6,1],[6,0],
    [7,0],[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,6],[9,6],[10,6],[11,6],[12,6],
    [13,6],[14,6],[14,7],[14,8],[13,8],[12,8],[11,8],[10,8],[9,8],[8,8],[8,9],
    [8,10],[8,11],[8,12],[8,13],[8,14],[7,14],[6,14],[6,13],[6,12],[6,11],[6,10],
    [6,9],[6,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8],[0,7],[0,6],
  ];
  const CENTER = [7, 7];
  // each token needs progress 61 to finish: 0..54 loop, 55..60 home, 61 centre
  const SAFE = new Set([0, 14, 28, 42, 8, 22, 36, 50]); // loop indices that protect

  const LCOLORS = [
    { key: "red",    name: "Red",    color: "#e5564b", start: 0,  home: [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]], base: [[1,1],[4,1],[1,4],[4,4]],     yard: [0,0] },
    { key: "green",  name: "Green",  color: "#2f9e54", start: 14, home: [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]], base: [[10,1],[13,1],[10,4],[13,4]], yard: [9,0] },
    { key: "yellow", name: "Yellow", color: "#f0b429", start: 28, home: [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]], base: [[10,10],[13,10],[10,13],[13,13]], yard: [9,9] },
    { key: "blue",   name: "Blue",   color: "#2f6bff", start: 42, home: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]], base: [[1,10],[4,10],[1,13],[4,13]], yard: [0,9] },
  ];

  // lookup maps for rendering the board
  const loopAt = {}; LOOP.forEach(([x, y], i) => (loopAt[x + "," + y] = i));
  const homeAt = {}; LCOLORS.forEach((c) => c.home.forEach(([x, y]) => (homeAt[x + "," + y] = c.key)));

  function cellPos(x, y) { return { x: ((x + 0.5) / 15) * 100, y: ((y + 0.5) / 15) * 100 }; }
  // absolute board cell for a token at progress p of a colour
  function progCell(c, p) {
    if (p <= 54) return LOOP[(c.start + p) % 56];
    if (p <= 60) return c.home[p - 55];
    return CENTER;
  }

  // ---- state -------------------------------------------------------------
  const S = { players: [], current: 0, busy: false, over: false, pending: null, settings: { music: true, voice: true } };
  let boardBox = null, resizeObs = null;

  // =======================================================================
  // SCREENS
  // =======================================================================
  function show() { teardown(); renderTitle(); }

  function renderTitle() {
    const root = app();
    root.innerHTML = "";
    const wrap = el("div", "screen title-screen");
    wrap.appendChild(el("div", "title-glow"));
    if (CG.Platform) {
      const back = el("button", "back-link", "← Games");
      back.onclick = () => { if (CG.Narrate) CG.Narrate.stop(); CG.Platform.show(); };
      wrap.appendChild(back);
    }
    wrap.appendChild(el("div", "logo-mark", "🎲"));
    wrap.appendChild(el("h1", "title", "Field Ludo"));
    wrap.appendChild(el("p", "subtitle", "Four teams, one race"));
    wrap.appendChild(el("p", "tagline",
      "Roll a six to deploy a team from base. Race all four teams around the board and home to the centre, and bump rivals back to base along the way. First to bring everyone home wins."));

    wrap.appendChild(el("p", "pick-label", "Choose your table"));
    const modes = el("div", "mode-row");
    [1, 2, 3].forEach((n) => {
      const b = el("button", "btn btn-primary", `<span class="mode-n">You + ${n}</span><span class="mode-sub">${n === 1 ? "rival" : "rivals"}</span>`);
      b.onclick = () => newGame(n + 1);
      modes.appendChild(b);
    });
    wrap.appendChild(modes);

    const toggles = el("div", "toggle-row");
    toggles.appendChild(toggle("🎵 Music", S.settings.music, (on) => { S.settings.music = on; CG.Audio.setMuted(!on); }));
    toggles.appendChild(toggle("🗣️ Narration", S.settings.voice, (on) => { S.settings.voice = on; CG.Narrate.setEnabled(on); }));
    wrap.appendChild(toggles);
    wrap.appendChild(el("p", "byline", "Designed by <b>Digital Solutions Lab</b>"));
    root.appendChild(wrap);
  }

  function toggle(label, on, fn) {
    const b = el("button", "chip-toggle" + (on ? " on" : ""), label);
    b.onclick = () => { fn(b.classList.toggle("on")); };
    return b;
  }

  function newGame(num) {
    if (S.settings.music) CG.Audio.start();
    CG.Narrate.setEnabled(S.settings.voice);
    const names = shuffle(CG.AGENT_NAMES || ["Amara", "Diego", "Mei", "Kofi"]);
    S.players = [];
    for (let i = 0; i < num; i++) {
      const c = LCOLORS[i];
      S.players.push({
        name: i === 0 ? "You" : (names[i - 1] || c.name) + " (" + c.name + ")",
        isAI: i !== 0, c,
        tokens: [{ p: -1 }, { p: -1 }, { p: -1 }, { p: -1 }],
      });
    }
    S.current = 0; S.over = false; S.busy = false; S.pending = null;
    renderBoard();
    CG.Narrate.auto("Field Ludo. Roll a six to send your first team out. Bring all four home to win.");
    setTurn();
    if (S.players[0].isAI) scheduleAI();
  }

  // =======================================================================
  // BOARD
  // =======================================================================
  function teardown() { if (resizeObs) { try { resizeObs.disconnect(); } catch (e) {} resizeObs = null; } boardBox = null; }

  function renderBoard() {
    teardown();
    const root = app();
    root.innerHTML = "";
    const wrap = el("div", "screen board-screen ludo-screen");
    wrap.appendChild(el("div", "bg-layer"));

    const bar = el("header", "hud-top");
    bar.innerHTML = `<div class="brand">🎲 <b>Field Ludo</b></div>`;
    const ctrls = el("div", "hud-ctrls");
    ctrls.appendChild(toggle("🎵", S.settings.music, (on) => { S.settings.music = on; CG.Audio.setMuted(!on); }));
    ctrls.appendChild(toggle("🗣️", S.settings.voice, (on) => { S.settings.voice = on; CG.Narrate.setEnabled(on); }));
    const home = el("button", "chip-toggle", "⌂");
    home.title = "Games";
    home.onclick = () => { if (CG.Narrate) CG.Narrate.stop(); CG.Platform.show(); };
    ctrls.appendChild(home);
    bar.appendChild(ctrls);
    wrap.appendChild(bar);

    const standings = el("aside", "standings"); standings.id = "lstandings";
    wrap.appendChild(standings);

    const stage = el("div", "board-stage");
    boardBox = el("div", "board-box ludo"); boardBox.id = "lboard";
    const grid = el("div", "ludo-grid");
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        const sq = el("div", "lc");
        const key = x + "," + y;
        if (x === 7 && y === 7) sq.classList.add("lc-center");
        else if (homeAt[key]) sq.classList.add("lc-home", "lc-" + homeAt[key]);
        else if (loopAt[key] !== undefined) { sq.classList.add("lc-path"); if (SAFE.has(loopAt[key])) sq.classList.add("lc-safe"); }
        else {
          const yard = yardColorAt(x, y);
          if (yard) sq.classList.add("lc-yard", "lc-" + yard);
        }
        grid.appendChild(sq);
      }
    }
    boardBox.appendChild(grid);
    // base rings for tokens
    S.players.forEach((p) => p.c.base.forEach(([bx, by]) => {
      const ring = el("div", "lc-ring lc-" + p.c.key);
      const pos = cellPos(bx, by);
      ring.style.left = pos.x + "%"; ring.style.top = pos.y + "%";
      boardBox.appendChild(ring);
    }));
    const tokens = el("div", "token-layer"); tokens.id = "ltokens"; boardBox.appendChild(tokens);
    const fx = el("div", "fx"); fx.id = "lfx"; boardBox.appendChild(fx);
    stage.appendChild(boardBox);
    wrap.appendChild(stage);

    const dock = el("div", "dice-dock"); dock.id = "ldock";
    dock.innerHTML = `<div class="turn-tag" id="lturn">Your move</div><div class="dice"><div class="die" id="ldie">${pips(1)}</div></div>`;
    const btn = el("button", "btn btn-roll", "🎲 Roll"); btn.id = "lroll"; btn.onclick = onRoll;
    dock.appendChild(btn);
    wrap.appendChild(dock);

    wrap.appendChild(el("div", "toast-area", "")); $("div.toast-area", wrap).id = "ltoasts";
    wrap.appendChild(el("div", "board-credit", "Designed by <b>Digital Solutions Lab</b>"));
    root.appendChild(wrap);

    renderTokens();
    renderStandings();
    try { resizeObs = new ResizeObserver(() => renderTokens()); resizeObs.observe(boardBox); } catch (e) {}
  }

  // which colour's 6x6 yard a cell falls in (corners), else null
  function yardColorAt(x, y) {
    for (const c of LCOLORS) {
      const [ox, oy] = c.yard;
      if (x >= ox && x <= ox + 5 && y >= oy && y <= oy + 5) return c.key;
    }
    return null;
  }

  function tokenSize() { if (!boardBox) return 22; return (Math.min(boardBox.clientWidth, boardBox.clientHeight) / 15) * 0.78; }

  function cellKeyOf(pi, ti) {
    const p = S.players[pi]; const t = p.tokens[ti];
    if (t.p < 0) return "base-" + pi + "-" + ti;
    const cl = progCell(p.c, t.p);
    return "c-" + cl[0] + "," + cl[1];
  }
  function posOf(p, t, ti) {
    if (t.p < 0) { const b = p.c.base[ti]; return cellPos(b[0], b[1]); }
    const cl = progCell(p.c, t.p); return cellPos(cl[0], cl[1]);
  }

  function renderTokens() {
    const layer = $("#ltokens"); if (!layer) return;
    layer.innerHTML = "";
    const size = tokenSize();
    const groups = {};
    S.players.forEach((p, pi) => p.tokens.forEach((t, ti) => { const k = cellKeyOf(pi, ti); (groups[k] = groups[k] || []).push(pi + "-" + ti); }));
    const movable = S.pending && !S.players[S.current].isAI ? S.pending.moves : [];
    S.players.forEach((p, pi) => p.tokens.forEach((t, ti) => {
      const pos = posOf(p, t, ti);
      const k = cellKeyOf(pi, ti); const grp = groups[k]; const idx = grp.indexOf(pi + "-" + ti);
      const off = grp.length > 1 ? (idx - (grp.length - 1) / 2) * (size * 0.42) : 0;
      const canMove = pi === S.current && movable.indexOf(ti) >= 0;
      const e = el("div", "ltoken lc-" + p.c.key + (t.p === 61 ? " done" : "") + (canMove ? " movable" : ""));
      e.style.width = size + "px"; e.style.height = size + "px";
      e.style.left = `calc(${pos.x}% + ${off}px)`; e.style.top = pos.y + "%";
      e.style.background = p.c.color;
      if (canMove) e.onclick = () => playMove(ti);
      layer.appendChild(e);
    }));
  }

  function renderStandings() {
    const box = $("#lstandings"); if (!box) return;
    box.innerHTML = "";
    S.players.forEach((p, i) => {
      const home = p.tokens.filter((t) => t.p === 61).length;
      const out = p.tokens.filter((t) => t.p >= 0 && t.p < 61).length;
      const card = el("div", "scard" + (i === S.current && !S.over ? " active" : ""));
      card.style.setProperty("--tok", p.c.color);
      card.innerHTML =
        `<span class="savatar" style="--tok:${p.c.color};background:${p.c.color}"></span>` +
        `<span class="sinfo"><b>${p.name}</b><small>${out} out · ${home}/4 home</small></span>` +
        `<span class="spos">${home}</span>`;
      box.appendChild(card);
    });
  }

  function pips(v) {
    const map = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
    const on = new Set(map[v] || []); let h = "";
    for (let i = 0; i < 9; i++) h += `<i class="pip${on.has(i) ? " on" : ""}"></i>`;
    return h;
  }

  function toast(msg, kind) {
    const area = $("#ltoasts"); if (!area) return;
    const t = el("div", "toast " + (kind || ""), msg); area.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 350); }, 2400);
    while (area.children.length > 4) area.removeChild(area.firstChild);
  }

  function burst(cell, kind) {
    const fx = $("#lfx"); if (!fx) return;
    const pos = cellPos(cell[0], cell[1]);
    for (let i = 0; i < 14; i++) {
      const p = el("div", "particle " + (kind || "up"));
      p.style.left = pos.x + "%"; p.style.top = pos.y + "%";
      const a = Math.random() * Math.PI * 2, d = 14 + Math.random() * 24;
      p.style.setProperty("--dx", Math.cos(a) * d + "px"); p.style.setProperty("--dy", Math.sin(a) * d + "px");
      fx.appendChild(p); setTimeout(() => p.remove(), 1000);
    }
  }

  // =======================================================================
  // TURN FLOW
  // =======================================================================
  function setTurn(txt) {
    const tt = $("#lturn"); const p = S.players[S.current];
    if (tt) tt.innerHTML = S.over ? "Game over" : `<span class="dot" style="background:${p.c.color}"></span>${txt || (p.isAI ? p.name + " is rolling…" : "Your move")}`;
    const btn = $("#lroll"); if (btn) { btn.disabled = S.busy || S.over || p.isAI || !!S.pending; btn.classList.toggle("ai", p.isAI && !S.over); }
  }

  function scheduleAI() { if (S.over) return; setTurn(); setTimeout(() => { if (!S.over && S.players[S.current].isAI && !S.busy) onRoll(); }, 800); }

  function legalMoves(p, die) {
    const out = [];
    p.tokens.forEach((t, i) => {
      if (t.p < 0) { if (die === 6) out.push(i); }
      else if (t.p < 61 && t.p + die <= 61) out.push(i);
    });
    return out;
  }

  async function onRoll() {
    if (S.busy || S.over || S.pending) return;
    S.busy = true; const btn = $("#lroll"); if (btn) btn.disabled = true;
    const p = S.players[S.current];
    const die = 1 + rnd(6);
    if (S.settings.music) CG.Audio.sfx.dice();
    await animateDie(die);
    toast(`${p.name} rolls ${die}`, "roll");
    const moves = legalMoves(p, die);
    if (moves.length === 0) {
      await sleep(450);
      S.busy = false;
      endTurn(false);
      return;
    }
    if (p.isAI) {
      const ti = aiPick(p, die, moves);
      await resolveMove(p, ti, die);
    } else if (moves.length === 1) {
      await resolveMove(p, moves[0], die);
    } else {
      // let the human choose which team to move
      S.pending = { die, moves };
      setTurn("Tap a team to move");
      renderTokens();
    }
  }

  async function playMove(ti) {
    if (!S.pending) return;
    const die = S.pending.die; const p = S.players[S.current];
    if (S.pending.moves.indexOf(ti) < 0) return;
    S.pending = null;
    await resolveMove(p, ti, die);
  }

  async function resolveMove(p, ti, die) {
    const captured = await doMove(p, ti, die);
    renderStandings();
    if (allHome(p)) return finish(p);
    S.busy = false;
    endTurn(die === 6 || captured);
  }

  async function doMove(p, ti, die) {
    const t = p.tokens[ti];
    let captured = false;
    if (t.p < 0) {
      t.p = 0;
      renderTokens();
      if (S.settings.music) CG.Audio.sfx.doubles();
      await sleep(220);
      captured = checkCapture(p, t);
    } else {
      const target = t.p + die;
      for (let q = t.p + 1; q <= target; q++) {
        t.p = q;
        renderTokens();
        if (S.settings.music) CG.Audio.sfx.step();
        await sleep(165);
      }
      captured = checkCapture(p, t);
      if (t.p === 61) { if (S.settings.music) CG.Audio.sfx.note(); burst(CENTER, "up"); toast(`${p.name} brings a team home`, "good"); }
    }
    return captured;
  }

  function checkCapture(p, t) {
    if (t.p < 0 || t.p > 54) return false;
    const li = (p.c.start + t.p) % 56;
    if (SAFE.has(li)) return false;
    let did = false;
    S.players.forEach((o) => {
      if (o === p) return;
      o.tokens.forEach((ot) => {
        if (ot.p >= 0 && ot.p <= 54 && (o.c.start + ot.p) % 56 === li) {
          ot.p = -1; did = true;
        }
      });
    });
    if (did) {
      const cl = LOOP[li];
      burst(cl, "down");
      if (S.settings.music) CG.Audio.sfx.snake();
      toast(`${p.name} sends a rival back to base!`, "bad");
      renderTokens();
    }
    return did;
  }

  function aiPick(p, die, moves) {
    let best = moves[0], bestScore = -1e9;
    moves.forEach((ti) => {
      const t = p.tokens[ti];
      let score = 0;
      if (t.p < 0) { score = 5; }                 // deploy
      else {
        const np = t.p + die;
        score = 2 + np * 0.1;                       // progress
        if (np === 61) score += 30;                 // bring a team home
        // would this land capture an unsafe rival?
        if (np <= 54) {
          const li = (p.c.start + np) % 56;
          if (!SAFE.has(li)) {
            S.players.forEach((o) => { if (o !== p) o.tokens.forEach((ot) => { if (ot.p >= 0 && ot.p <= 54 && (o.c.start + ot.p) % 56 === li) score += 40; }); });
          }
        }
        if (np <= 54 && SAFE.has((p.c.start + np) % 56)) score += 4; // reach safety
      }
      if (score > bestScore) { bestScore = score; best = ti; }
    });
    return best;
  }

  function endTurn(extra) {
    if (S.over) return;
    if (extra) { setTurn(); if (S.players[S.current].isAI) scheduleAI(); return; }
    S.current = (S.current + 1) % S.players.length;
    renderStandings(); renderTokens(); setTurn();
    if (S.players[S.current].isAI) scheduleAI();
  }

  function allHome(p) { return p.tokens.every((t) => t.p === 61); }

  async function animateDie(v) {
    const e = $("#ldie"); if (!e) return;
    e.classList.add("rolling");
    for (let i = 0; i < 9; i++) { e.innerHTML = pips(1 + rnd(6)); await sleep(60); }
    e.innerHTML = pips(v); e.classList.remove("rolling"); e.classList.add("settle");
    setTimeout(() => e.classList.remove("settle"), 260);
    await sleep(160);
  }

  function finish(winner) {
    S.over = true; S.busy = false; S.pending = null;
    renderStandings(); renderTokens();
    const youWon = !winner.isAI;
    if (S.settings.music) { youWon ? CG.Audio.sfx.win() : CG.Audio.sfx.lose(); }
    if (youWon) confetti();
    const line = youWon
      ? "All four of your teams are home. A clean sweep. Well played."
      : winner.name + " brings every team home first. Close one. Run it again.";
    CG.Narrate.auto(line);
    const over = el("div", "overlay-card show");
    const c = el("div", "event-card win");
    c.innerHTML =
      `<div class="ec-band">${youWon ? "VICTORY" : "DEFEAT"}</div>` +
      `<div class="ec-icon">${youWon ? "🏆" : "🏁"}</div>` +
      `<div class="ec-title">${youWon ? "All Teams Home" : winner.name + " wins"}</div>` +
      `<div class="ec-why">${line}</div>`;
    const actions = el("div", "ec-actions");
    const again = el("button", "btn btn-primary", "Play again ▸"); again.onclick = () => { over.remove(); renderTitle(); };
    const games = el("button", "btn btn-ghost", "← Games"); games.onclick = () => { over.remove(); CG.Platform.show(); };
    actions.appendChild(games); actions.appendChild(again);
    c.appendChild(actions); over.appendChild(c); app().appendChild(over);
  }

  function confetti() {
    const fx = $("#lfx"); if (!fx) return;
    const cols = ["#e5564b", "#2f9e54", "#f0b429", "#2f6bff"];
    for (let i = 0; i < 60; i++) {
      const p = el("div", "confetti");
      p.style.left = (8 + Math.random() * 84) + "%"; p.style.top = "-4%";
      p.style.background = cols[i % cols.length];
      p.style.setProperty("--dx", (Math.random() - 0.5) * 40 + "px");
      p.style.setProperty("--dy", 70 + Math.random() * 40 + "px");
      p.style.setProperty("--rot", Math.random() * 720 - 360 + "deg");
      p.style.animationDelay = Math.random() * 0.6 + "s";
      fx.appendChild(p); setTimeout(() => p.remove(), 2600);
    }
  }

  CG.LudoGame = { title: "Field Ludo", show };
})();
