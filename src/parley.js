/* =========================================================================
 * COMMON GROUND, PARLEY,  parley.js
 * The fourth game: chess on a 5 by 5 table, made easier and friendlier.
 *
 * Two delegations face each other across a small table. Each has an Envoy
 * (the king), two Convoys (rooks), an Airlift (knight), a Scout (bishop) and
 * three Volunteers (pawns). The moves are the chess moves you know, with
 * the fiddly rules taken out:
 *   - no check, no checkmate, no castling, no en passant, no double step;
 *   - a Volunteer steps one square forward, straight or diagonal, and wins
 *     over the same way; on the far row it becomes a Coordinator (a queen);
 *   - nobody is knocked out: a captured piece is WON OVER and joins your
 *     reserve, and instead of moving you may bring it back on your two home
 *     rows (the shogi idea, which keeps the table lively);
 *   - two ways to win: win over the rival Envoy, or walk your own Envoy
 *     onto the rival's Summit (the square their Envoy started on).
 * A position seen three times, or 160 moves, shares the round; either side
 * may offer peace. A match is 1 or 3 rounds, the opener alternating.
 *
 * Beginner help is built in: tap a piece to see its moves, a ⚠ marks any
 * piece of yours the rival could win over next move, the banner warns when
 * your Envoy or your Summit is in danger, 💡 Hint suggests a move and says
 * why, and ↩ takes a move back (solo and same device).
 *
 * Modes: solo against an AI envoy (Junior, Field, Veteran; alpha-beta
 * search with a time budget), two people on one device, or online rooms
 * over the shared MQTT broker. Online is people only, like Situation Report:
 * a room opens with one seat empty and waits, the opener can close it, and a
 * seat whose player goes quiet opens again.
 *
 * Content lives in data/parley.js. Reuses CG.Audio, CG.Narrate, CG.Net,
 * CG.THEATRES, CG.ROLES and the shared card and Situation Report HUD styles.
 * Vanilla JS, no build step.
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});
  const app = () => document.getElementById("app");
  const $ = (id) => document.getElementById(id);
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
  const rand = (a) => a[Math.floor(Math.random() * a.length)];
  const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const clean = (s) => String(s || "").replace(/[<>]/g, "").trim().slice(0, 22);
  const now = () => Date.now();
  const sfx = (name, a, b) => { if (CG.Audio && CG.Audio.sfx && CG.Audio.sfx[name]) CG.Audio.sfx[name](a, b); };
  const say = (text, opts) => { if (CG.Narrate) CG.Narrate.auto(text, opts); };
  function ls(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || "null");
      localStorage.setItem(key, JSON.stringify(val)); return val;
    } catch (e) { return val === undefined ? null : val; }
  }

  // =======================================================================
  // THE RULES, IN NUMBERS
  // =======================================================================
  const N = 5;
  const E = 1, C = 2, A = 3, SC = 4, V = 5, L = 6;       // piece types
  const KEYS = ["", "E", "C", "A", "S", "V", "L"];
  const MAX_PLY = 160;
  const REVEAL_MS = 30000;
  const SEAT_COLORS = ["#2f6bff", "#e8439b"];
  const SEAT_DOTS = ["🔵", "🟣"];
  const DROPPABLE = [C, A, SC, V];

  const LEVELS = {
    rookie:  { key: "rookie",  label: "Junior Envoy",  short: "Junior",  depth: 1, ms: 150,  noise: 1.6, blunder: 0.22, blurb: "Friendly and a little distracted. Misses things. Great for a first game." },
    officer: { key: "officer", label: "Field Envoy",   short: "Field",   depth: 3, ms: 450,  noise: 0.35, blunder: 0, blurb: "Reads two moves ahead. Punishes a loose piece." },
    veteran: { key: "veteran", label: "Veteran Envoy", short: "Veteran", depth: 7, ms: 1100, noise: 0.04, blunder: 0, blurb: "Thirty years at the table. Plans deep and rarely slips." },
  };

  const sg = (seat) => (seat === 0 ? 1 : -1);
  const ownerOf = (x) => (x > 0 ? 0 : 1);
  const rowOf = (i) => (i / N) | 0;
  const colOf = (i) => i % N;
  const at = (r, c) => r * N + c;
  const fwd = (seat) => (seat === 0 ? -1 : 1);
  const farRow = (seat) => (seat === 0 ? 0 : N - 1);
  const isHome = (seat, i) => (seat === 0 ? rowOf(i) >= N - 2 : rowOf(i) <= 1);
  // A seat's Summit is the square the RIVAL's Envoy starts on.
  const summitOf = (seat) => (seat === 0 ? at(0, 2) : at(N - 1, 2));

  function startBoard() {
    const b = new Array(N * N).fill(0);
    const back = [C, A, E, SC, C];
    for (let c = 0; c < N; c++) { b[at(4, c)] = back[c]; b[at(0, c)] = -back[c]; }
    [0, 2, 4].forEach((c) => { b[at(3, c)] = V; b[at(1, c)] = -V; });
    return b;
  }

  const KING = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const JUMP = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];

  // Every move a seat may make. A move is { f, t, p?, cap, promo }: f is the
  // square it leaves (-1 for bringing a reserve piece in, with its type in p).
  // opts.noDrops skips the reserve (for threats and quiet searches).
  function genMoves(st, seat, out, opts) {
    const b = st.b, mine = seat === 0;
    const push = (f, j, t) => {
      const y = b[j];
      if (y && (y > 0) === mine) return false;
      out.push({ f, t: j, cap: y ? Math.abs(y) : 0, promo: t === V && rowOf(j) === farRow(seat) });
      return !y;
    };
    for (let i = 0; i < N * N; i++) {
      const x = b[i];
      if (!x || (x > 0) !== mine) continue;
      const t = Math.abs(x), r = rowOf(i), c = colOf(i);
      const steps = (dirs) => dirs.forEach(([dr, dc]) => {
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < N && cc >= 0 && cc < N) push(i, at(rr, cc), t);
      });
      const slides = (dirs) => dirs.forEach(([dr, dc]) => {
        let rr = r + dr, cc = c + dc;
        while (rr >= 0 && rr < N && cc >= 0 && cc < N) {
          if (!push(i, at(rr, cc), t)) break;
          rr += dr; cc += dc;
        }
      });
      if (t === E) steps(KING);
      else if (t === C) slides(ORTH);
      else if (t === SC) slides(DIAG);
      else if (t === A) steps(JUMP);
      else if (t === L) slides(KING);
      else if (t === V) { const d = fwd(seat); steps([[d, -1], [d, 0], [d, 1]]); }
    }
    if (st.rules.winover && !(opts && opts.noDrops)) {
      const h = st.h[seat];
      DROPPABLE.forEach((p) => {
        if (!h[p]) return;
        for (let j = 0; j < N * N; j++) {
          if (b[j] || !isHome(seat, j)) continue;
          // a Volunteer brought in on the far row could never move
          if (p === V && rowOf(j) === farRow(seat)) continue;
          out.push({ f: -1, t: j, p, cap: 0, promo: false });
        }
      });
    }
    return out;
  }

  const isWinMove = (st, m, seat) =>
    m.cap === E || (st.rules.summit && m.f >= 0 && Math.abs(st.b[m.f]) === E && m.t === summitOf(seat));

  // Apply / undo a move in place (the search uses these; the game copies).
  function make(st, m, seat) {
    const b = st.b, s = sg(seat);
    if (m.f < 0) { b[m.t] = s * m.p; st.h[seat][m.p]--; return 0; }
    const x = b[m.f], y = b[m.t];
    b[m.f] = 0;
    b[m.t] = m.promo ? s * L : x;
    if (y && st.rules.winover) { const ct = Math.abs(y); if (ct !== E) st.h[seat][ct === L ? V : ct]++; }
    return y;
  }
  function unmake(st, m, seat, y) {
    const b = st.b, s = sg(seat);
    if (m.f < 0) { b[m.t] = 0; st.h[seat][m.p]++; return; }
    b[m.f] = m.promo ? s * V : b[m.t];
    b[m.t] = y;
    if (y && st.rules.winover) { const ct = Math.abs(y); if (ct !== E) st.h[seat][ct === L ? V : ct]--; }
  }

  // Squares a seat attacks (where it could win over a piece next move).
  function attacked(st, seat) {
    const set = new Set();
    const ms = genMoves({ b: st.b, h: st.h, rules: st.rules }, seat, [], { noDrops: true });
    ms.forEach((m) => set.add(m.t));
    // Volunteers attack all three forward squares even when they are empty
    return set;
  }
  function envoyAt(st, seat) {
    const want = sg(seat) * E;
    for (let i = 0; i < N * N; i++) if (st.b[i] === want) return i;
    return -1;
  }

  // A compact fingerprint of a position (board, reserves, side to move).
  function posKey(st, turn) {
    const s = st.b.join(",") + "|" + st.h[0].join("") + "|" + st.h[1].join("") + "|" + turn;
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  // =======================================================================
  // THE AI ENVOY: alpha-beta search with a time budget
  // =======================================================================
  const VAL = [0, 0, 5, 3.1, 3, 1, 8.5];
  const HAND = [0, 0, 4.4, 2.9, 2.7, 1.15, 0];
  const WIN = 100000;

  // Score from seat's point of view.
  function evaluate(st, seat) {
    let sc = 0;
    const b = st.b;
    for (let i = 0; i < N * N; i++) {
      const x = b[i];
      if (!x) continue;
      const t = Math.abs(x), o = ownerOf(x), s = o === seat ? 1 : -1;
      let v = VAL[t];
      const r = rowOf(i), c = colOf(i);
      if (t === V) v += 0.12 * (o === 0 ? (N - 1 - r) : r);
      if (t !== E && r >= 1 && r <= 3 && c >= 1 && c <= 3) v += 0.08;
      if (t === E && st.rules.summit) {
        const sm = summitOf(o);
        const d = Math.max(Math.abs(rowOf(sm) - r), Math.abs(colOf(sm) - c));
        v += (4 - d) * 0.14;
      }
      sc += s * v;
    }
    for (let p = 2; p <= 5; p++) sc += (st.h[seat][p] - st.h[1 - seat][p]) * HAND[p];
    return sc;
  }

  function orderMoves(st, moves, seat) {
    moves.forEach((m) => {
      let k = 0;
      if (isWinMove(st, m, seat)) k = 1e6;
      else if (m.cap) k = 1000 + VAL[m.cap] * 10 - (m.f >= 0 ? VAL[Math.abs(st.b[m.f])] : 0);
      else if (m.promo) k = 900;
      else if (m.f < 0) k = -5;
      m.k = k;
    });
    moves.sort((a, b) => b.k - a.k);
  }

  function quiesce(st, seat, alpha, beta, ply, ctx, qd) {
    ctx.nodes++;
    const moves = genMoves(st, seat, [], { noDrops: true });
    for (const m of moves) if (isWinMove(st, m, seat)) return WIN - ply;
    const stand = evaluate(st, seat);
    if (qd <= 0 || stand >= beta) return stand;
    if (stand > alpha) alpha = stand;
    const caps = moves.filter((m) => m.cap || m.promo);
    orderMoves(st, caps, seat);
    for (const m of caps) {
      const y = make(st, m, seat);
      const v = -quiesce(st, 1 - seat, -beta, -alpha, ply + 1, ctx, qd - 1);
      unmake(st, m, seat, y);
      if (v >= beta) return v;
      if (v > alpha) alpha = v;
    }
    return alpha;
  }

  function negamax(st, seat, depth, alpha, beta, ply, ctx) {
    if ((ctx.nodes & 255) === 0 && now() > ctx.deadline) ctx.stop = true;
    if (ctx.stop) return 0;
    ctx.nodes++;
    if (depth <= 0) return quiesce(st, seat, alpha, beta, ply, ctx, 4);
    const moves = genMoves(st, seat, []);
    if (!moves.length) return -negamax(st, 1 - seat, depth - 1, -beta, -alpha, ply + 1, ctx);
    for (const m of moves) if (isWinMove(st, m, seat)) return WIN - ply;
    orderMoves(st, moves, seat);
    let best = -Infinity;
    for (const m of moves) {
      const y = make(st, m, seat);
      const v = -negamax(st, 1 - seat, depth - 1, -beta, -alpha, ply + 1, ctx);
      unmake(st, m, seat, y);
      if (ctx.stop) return 0;
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    return best;
  }

  // Score every root move with iterative deepening; returns [{m, v}] best
  // first from the last depth that finished. reps: position counts, so an
  // envoy that is ahead avoids repeating itself into a shared round.
  function analyse(g, seat, level) {
    const L = LEVELS[level] || LEVELS.officer;
    const st = { b: g.b.slice(), h: [g.h[0].slice(), g.h[1].slice()], rules: g.rules };
    const roots = genMoves(st, seat, []);
    if (!roots.length) return [];
    const ctx = { nodes: 0, stop: false, deadline: now() + L.ms };
    let scored = roots.map((m) => ({ m, v: isWinMove(st, m, seat) ? WIN : 0 }));
    const win = scored.find((x) => x.v === WIN);
    if (win) return [win].concat(scored.filter((x) => x !== win));
    orderMoves(st, roots, seat);
    for (let depth = 1; depth <= L.depth; depth++) {
      const cur = [];
      let alpha = -Infinity;
      const margin = Math.max(L.noise, 0.05);
      for (const m of roots) {
        const y = make(st, m, seat);
        let v = -negamax(st, 1 - seat, depth - 1, -Infinity, -(alpha - margin), 1, ctx);
        const rep = (g.reps || {})[posKey(st, 1 - seat)] || 0;
        unmake(st, m, seat, y);
        if (ctx.stop) break;
        if (rep >= 1 && v > 0.5) v -= 0.6 * rep;
        cur.push({ m, v });
        if (v > alpha) alpha = v;
      }
      if (ctx.stop && depth > 1) break;
      if (cur.length === roots.length) {
        scored = cur.sort((a, b) => b.v - a.v);
        // try the best line first next time round
        roots.sort((a, b) => scored.findIndex((x) => x.m === a) - scored.findIndex((x) => x.m === b));
        if (scored[0].v >= WIN - 50) break;
      }
      if (ctx.stop) break;
    }
    return scored.sort((a, b) => b.v - a.v);
  }

  function aiChoose(g, seat) {
    const L = LEVELS[g.level] || LEVELS.officer;
    const scored = analyse(g, seat, L.key);
    if (!scored.length) return null;
    if (scored[0].v >= WIN - 50 && !(L.key === "rookie" && Math.random() < 0.25)) return scored[0].m;
    // a junior envoy sometimes simply plays something that looks nice
    if (L.blunder && Math.random() < L.blunder) {
      const safe = scored.filter((x) => x.v > -WIN + 50);
      if (safe.length) return rand(safe.slice(0, Math.max(3, Math.ceil(safe.length / 2)))).m;
    }
    const top = scored[0].v;
    const close = scored.filter((x) => x.v >= top - L.noise);
    return rand(close).m;
  }

  // =======================================================================
  // THE GAME OBJECT (same shape offline and online)
  // =======================================================================
  const settings = Object.assign({ music: true, voice: true, danger: true }, ls("cg_parley_settings") || {});
  const saveSettings = () => ls("cg_parley_settings", settings);
  function stats() { return Object.assign({ matches: 0, wins: 0, rounds: 0, roundsWon: 0, summits: 0 }, ls("cg_parley_stats") || {}); }

  const S = {
    g: null, mode: "solo",
    sel: null,              // { i } a square, or { drop: type }
    busy: false, overlay: null, mounted: false, aiGen: 0,
    hint: null,             // { f, t, p, text }
    undo: [],               // local snapshots (solo, same device)
    remoteSel: null,        // { seat, i } what the rival is pointing at, online
    shownBrief: -1, shownReveal: -1, shownFinal: false, shownOffer: -1,
    warned: "",             // last danger warning spoken
    pending: null,
    net: { online: false, id: null, seen: {}, tick: null, beat: 0 },
    lastSetup: null,
  };
  const myId = () => (CG.Net ? CG.Net.clientId : "local");
  let ROOM = null;
  function room() {
    if (!ROOM && CG.Net && CG.Net.room) ROOM = CG.Net.room("parley", summaryOf);
    return ROOM;
  }

  const P = (t) => (CG.PARLEY_PIECES || {})[KEYS[t]] || { name: KEYS[t], icon: KEYS[t], moves: "", role: "" };
  const waiting = (g) => !!g && g.players.some((p) => p.vacant);

  function turnSeat(g) {
    if (!g || g.phase !== "play" || waiting(g)) return -1;
    return g.turn;
  }

  function newPlayer(name, isAI, ownerId, seat, taken) {
    const roles = CG.ROLES || [{ icon: "🧭", name: "Field Officer" }];
    let role;
    for (let i = 0; i < 20; i++) { role = rand(roles); if ((taken || []).indexOf(role.icon) < 0) break; }
    return { name, isAI: !!isAI, ownerId: ownerId || null, color: SEAT_COLORS[seat], icon: role.icon, role: role.name, wins: 0, hints: 0, offers: -99 };
  }
  function vacate(p) {
    p.vacant = true; p.isAI = false; p.ownerId = null; p.name = "Open seat"; p.icon = "＋";
    return p;
  }
  function aiName(avoid) {
    const names = (CG.AGENT_NAMES && CG.AGENT_NAMES.length) ? CG.AGENT_NAMES : ["Amara", "Diego", "Mei", "Kofi", "Leila"];
    for (let i = 0; i < 30; i++) { const n = rand(names); if (n !== avoid) return n; }
    return "Kofi";
  }

  function freshRound(g) {
    g.b = startBoard();
    g.h = [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]];
    g.turn = g.first;
    g.ply = 0;
    g.moves = [];
    g.last = null;
    g.reps = {};
    g.reps[posKey(g, g.turn)] = 1;
    g.offer = -1;
    g.phase = "play";
    g.players.forEach((p) => { p.offers = -99; });
  }

  function buildGame(opts) {
    const theatre = opts.theatre || rand(CG.THEATRES || [{ name: "The Field", icon: "🌍", tags: [] }]);
    const p0 = newPlayer(opts.names[0], false, opts.mode === "online" ? myId() : null, 0);
    const p1 = opts.mode === "online"
      ? vacate(newPlayer("Open seat", false, null, 1, [p0.icon]))
      : opts.ai ? newPlayer(aiName(opts.names[0]), true, null, 1, [p0.icon])
      : newPlayer(opts.names[1], false, null, 1, [p0.icon]);
    const g = {
      kind: "parley", v: 1, id: null,
      hostId: myId(), seq: 1, lastWriter: myId(), lastEvent: "",
      mode: opts.mode, level: opts.level || "officer",
      rules: { winover: opts.winover !== false, summit: opts.summit !== false },
      theatre: { name: theatre.name, icon: theatre.icon, blurb: theatre.blurb || "" },
      total: opts.total || 1, round: 0, first: 0,
      results: [], players: [p0, p1], over: false, revealAt: 0,
    };
    freshRound(g);
    return g;
  }

  // Play one move for a seat. Mutates g, returns what happened.
  function applyMove(g, seat, m) {
    const mover = m.f >= 0 ? Math.abs(g.b[m.f]) : m.p;
    const info = { seat, f: m.f, t: m.t, p: mover, cap: m.cap || 0, promo: !!m.promo, drop: m.f < 0, win: false, how: "" };
    if (isWinMove(g, m, seat)) { info.win = true; info.how = m.cap === E ? "capture" : "summit"; }
    make(g, m, seat);
    g.ply++;
    g.last = { f: m.f, t: m.t, s: seat };
    g.moves.push({ s: seat, f: m.f, t: m.t, p: mover, cap: info.cap, promo: info.promo });
    const who = g.players[seat].name;
    g.lastEvent = describeDone(info, who);
    g.offer = -1;
    if (info.win) { endRound(g, seat, info.how); return info; }
    g.turn = 1 - seat;
    const k = posKey(g, g.turn);
    g.reps[k] = (g.reps[k] || 0) + 1;
    if (g.reps[k] >= 3) { endRound(g, -1, "stall"); info.ended = "stall"; }
    else if (g.ply >= MAX_PLY) { endRound(g, -1, "time"); info.ended = "time"; }
    return info;
  }

  function endRound(g, winner, how) {
    if (winner >= 0) g.players[winner].wins = (g.players[winner].wins || 0) + 1;
    g.results[g.round] = { winner, how, plies: g.ply };
    g.phase = "reveal";
    g.revealAt = now() + REVEAL_MS;
    const EN = (CG.PARLEY_ENDINGS || {})[how] || { title: how };
    g.lastEvent = EN.title;
  }

  function nextRound(g) {
    if (g.phase !== "reveal") return;
    if (g.round + 1 >= g.total) { g.phase = "over"; g.over = true; g.lastEvent = "The talks are over"; return; }
    g.round++;
    g.first = g.round % 2;
    freshRound(g);
    g.lastEvent = `Round ${g.round + 1} of ${g.total} begins`;
  }

  function describeDone(info, who) {
    const pc = P(info.p).name;
    if (info.win && info.how === "summit") return `${who}'s Envoy reached the Summit`;
    if (info.drop) return `${who} brought a ${pc} back into play`;
    if (info.cap) return `${who}'s ${pc} won over a ${P(info.cap).name}` + (info.promo ? ", and became a Coordinator" : "");
    if (info.promo) return `${who}'s Volunteer became a Coordinator`;
    return `${who} moved a ${pc}`;
  }

  // Plain-language reason for a suggested move (the hint).
  function explain(g, seat, m) {
    const mover = m.f >= 0 ? Math.abs(g.b[m.f]) : m.p;
    const pc = P(mover).name;
    if (m.cap === E) return `Win over their Envoy with your ${pc}. That wins the round!`;
    if (isWinMove(g, m, seat)) return "Walk your Envoy onto their Summit. That wins the round!";
    const st = { b: g.b.slice(), h: [g.h[0].slice(), g.h[1].slice()], rules: g.rules };
    const beforeThreat = attacked(st, 1 - seat);
    const myEnvoy = envoyAt(st, seat);
    const envoyWasHit = beforeThreat.has(myEnvoy);
    const summitThreat = rivalCanSummit(st, 1 - seat);
    const y = make(st, m, seat);
    const after = attacked(st, 1 - seat);
    const envoyNow = envoyAt(st, seat);
    const summitAfter = rivalCanSummit(st, 1 - seat);
    unmake(st, m, seat, y);
    if (envoyWasHit && !after.has(envoyNow)) return mover === E ? "Step your Envoy out of danger." : `Protect your Envoy with your ${pc}.`;
    if (summitThreat && !summitAfter) return m.f < 0 ? `Bring in a ${pc} to block the road to your Summit.` : `Use your ${pc} to guard your Summit.`;
    if (m.cap) return `Your ${pc} can win over their ${P(m.cap).name}` + (after.has(m.t) ? ", even if they answer back." : ", and it stays safe.");
    if (m.promo) return "Walk your Volunteer to the far row: it becomes a Coordinator 🌟.";
    if (m.f >= 0 && beforeThreat.has(m.f) && !after.has(m.t)) return `Your ${pc} is in danger. Move it somewhere safe.`;
    // what the move newly threatens, and what it now guards
    const st2 = { b: g.b.slice(), h: [g.h[0].slice(), g.h[1].slice()], rules: g.rules };
    const before = new Set(genMoves(st2, seat, [], { noDrops: true }).filter((x) => x.cap).map((x) => x.t));
    make(st2, m, seat);
    const threats = genMoves(st2, seat, [], { noDrops: true }).filter((x) => x.f === m.t && x.cap && !before.has(x.t));
    threats.sort((a, b) => VAL[b.cap] - VAL[a.cap]);
    const safeNow = !attacked(st2, 1 - seat).has(m.t);
    if (threats.length) {
      const top = threats[0].cap === E ? "Envoy" : P(threats[0].cap).name;
      return `${m.f < 0 ? "Bring in" : "Move"} your ${pc} to threaten their ${top}${threats.length > 1 ? ` and ${threats.length - 1} more` : ""}${safeNow ? ", from a safe square." : "."}`;
    }
    if (m.f < 0) return `Bring your ${pc} back from the reserve. More voices at the table.`;
    if (mover === E) return "Edge your Envoy toward their Summit, carefully.";
    const hitMine = (set, b) => [...set].filter((i) => b[i] && ownerOf(b[i]) === seat).length;
    if (hitMine(beforeThreat, g.b) > hitMine(after, st2.b)) return `Move your ${pc}: it leaves the rival fewer pieces to win over.`;
    return `Move your ${pc} to a stronger, safer square.`;
  }
  function rivalCanSummit(st, seat) {
    if (!st.rules.summit) return false;
    const e = envoyAt(st, seat);
    if (e < 0) return false;
    const sm = summitOf(seat);
    return Math.max(Math.abs(rowOf(e) - rowOf(sm)), Math.abs(colOf(e) - colOf(sm))) === 1 &&
      !(st.b[sm] && ownerOf(st.b[sm]) === seat);
  }

  function legalFor(g, seat) { return genMoves(g, seat, []); }

  // =======================================================================
  // CONTROL
  // =======================================================================
  function isLocalHuman(seat) {
    const p = S.g && S.g.players[seat];
    if (!p || p.isAI || p.vacant) return false;
    return S.mode !== "online" || p.ownerId === myId();
  }
  const controlsAI = (seat) => S.mode !== "online" && !!(S.g && S.g.players[seat] && S.g.players[seat].isAI);
  function canAct() {
    const g = S.g;
    if (!g || !S.mounted || S.busy || S.overlay || g.phase !== "play") return false;
    const t = turnSeat(g);
    return t >= 0 && isLocalHuman(t);
  }
  const iOwnASeat = () => S.g && S.g.players.some((p) => !p.vacant && !p.isAI && p.ownerId === myId());
  // Whose point of view the board is drawn from (their pieces at the bottom).
  function viewSeat() {
    const g = S.g;
    if (!g) return 0;
    if (S.mode === "online") { const i = g.players.findIndex((p) => p.ownerId === myId() && !p.vacant); return i < 0 ? 0 : i; }
    if (S.mode === "hotseat") return 0;
    return 0;
  }
  // The seat whose helpers (danger marks, hints, reserve at the bottom) apply.
  function helpSeat() {
    const g = S.g;
    if (!g) return 0;
    if (S.mode === "hotseat") return g.phase === "play" ? g.turn : 0;
    return viewSeat();
  }
  const flipped = () => viewSeat() === 1;
  const toView = (i) => (flipped() ? N * N - 1 - i : i);

  // =======================================================================
  // SCREENS: title, setup, rooms, join
  // =======================================================================
  function teardown() {
    stopList();
    cancelAI();
    closeOverlay(true);
    S.mounted = false; S.busy = false; S.pending = null; S.sel = null; S.hint = null; S.remoteSel = null;
    if (S.net.tick) { clearInterval(S.net.tick); S.net.tick = null; }
    if (S.net.online && room()) { room().unwatch(); room().offLive(); }
    S.net.online = false;
    window.removeEventListener("resize", fit);
  }

  function toggle(label, on, fn) {
    const b = el("button", "chip-toggle" + (on ? " on" : ""), label);
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.onclick = () => { const v = b.classList.toggle("on"); b.setAttribute("aria-pressed", v ? "true" : "false"); fn(v); };
    return b;
  }
  function modeCard(icon, title, body, primary, go) {
    const c = el("button", "sr-mode" + (primary ? " primary" : ""));
    c.innerHTML = `<span class="srm-ic">${icon}</span><span class="srm-t">${title}</span><span class="srm-b">${body}</span>`;
    c.onclick = () => { sfx("pick"); go(); };
    return c;
  }
  function seg(values, cur, onPick, label) {
    const row = el("div", "seg-row");
    values.forEach((v) => {
      const b = el("button", "seg" + (v === cur ? " on" : ""), label ? label(v) : v + "");
      b.onclick = () => { row.querySelectorAll(".seg").forEach((x) => x.classList.remove("on")); b.classList.add("on"); sfx("click"); onPick(v); };
      row.appendChild(b);
    });
    return row;
  }
  function nudge(input) {
    if (!input) return;
    input.focus(); input.classList.add("shake-err");
    setTimeout(() => input.classList.remove("shake-err"), 500);
  }
  function flash(wrap, msg) {
    const t = el("div", "lobby-toast", msg);
    wrap.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }

  // A tiny animated table for the title: two delegations and a handshake.
  function logoBoard() {
    const box = el("div", "pl-logo");
    const b = startBoard();
    for (let i = 0; i < N * N; i++) {
      const sq = el("span", "pl-lsq" + ((rowOf(i) + colOf(i)) % 2 ? " dk" : ""));
      if (i === at(2, 2)) sq.classList.add("mid");
      const x = b[i];
      if (x) {
        const tk = el("span", "pl-ltok s" + ownerOf(x), P(Math.abs(x)).icon);
        tk.style.animationDelay = (0.05 * i) + "s";
        sq.appendChild(tk);
      } else if (i === at(2, 2)) sq.appendChild(el("span", "pl-lmid", "🤝"));
      box.appendChild(sq);
    }
    return box;
  }

  function show() {
    teardown();
    if (CG.Narrate) CG.Narrate.stop();
    const root = app(); root.innerHTML = "";
    const wrap = el("div", "screen title-screen sr-title pl-title");
    wrap.appendChild(el("div", "title-glow"));
    const back = el("button", "back-link", "← Games");
    back.onclick = () => { sfx("click"); CG.Platform.show(); };
    wrap.appendChild(back);
    wrap.appendChild(logoBoard());
    wrap.appendChild(el("h1", "title pl-h", "Parley"));
    wrap.appendChild(el("p", "subtitle", "Chess that wins people over"));
    wrap.appendChild(el("p", "tagline",
      "Two delegations, one small table of five by five. The moves you know from chess, without check, checkmate or castling. " +
      "Nobody is knocked out: win a piece over and it joins your side. Win over the rival Envoy, or walk your own Envoy onto their Summit."));

    const toggles = el("div", "toggle-row");
    toggles.appendChild(toggle("🎵 Music", settings.music, (on) => { settings.music = on; saveSettings(); if (CG.Audio) CG.Audio.setMuted(!on); }));
    toggles.appendChild(toggle("🗣️ Narration", settings.voice, (on) => { settings.voice = on; saveSettings(); if (CG.Narrate) CG.Narrate.setEnabled(on); }));
    toggles.appendChild(toggle("⚠ Danger marks", settings.danger, (on) => { settings.danger = on; saveSettings(); }));
    wrap.appendChild(toggles);

    const modes = el("div", "sr-modes");
    modes.appendChild(modeCard("🤖", "Solo vs AI", "Sit across from an AI envoy: Junior, Field or Veteran. Hints and take-backs welcome.", true, () => renderSetup("solo")));
    modes.appendChild(modeCard("👥", "Two on this device", "Pass and play with a colleague at the same screen.", false, () => renderSetup("hotseat")));
    modes.appendChild(modeCard("🌐", "Play online", "Open a room and wait for another delegate, or take the open seat in someone else's. People only.", false,
      () => (CG.Net && CG.Net.getName && CG.Net.getName()) ? renderRooms() : renderLogin()));
    wrap.appendChild(modes);

    const how = el("button", "back-link sr-how-link", "How to play ?");
    how.onclick = () => showHowTo();
    wrap.appendChild(how);

    const st = stats();
    if (st.matches) {
      wrap.appendChild(el("p", "sr-record",
        `<b>Negotiating record</b> · ${st.matches} match${st.matches === 1 ? "" : "es"} · ${st.wins} won · ` +
        `${st.roundsWon} of ${st.rounds} rounds${st.summits ? ` · ${st.summits} summit${st.summits === 1 ? "" : "s"}` : ""}`));
    }
    wrap.appendChild(el("p", "credit", "Music and narration are generated live in your browser. No downloads, no accounts."));
    root.appendChild(wrap);
  }

  function renderSetup(mode) {
    teardown();
    const prev = S.lastSetup || {};
    let total = prev.total || 1, level = prev.level || "rookie";
    let winover = prev.winover !== false, summit = prev.summit !== false;
    let theatre = rand(CG.THEATRES || [{ name: "The Field", icon: "🌍", blurb: "", tags: [] }]);
    const root = app(); root.innerHTML = "";
    const wrap = el("div", "screen title-screen setup-screen sr-setup");
    wrap.appendChild(el("div", "title-glow"));
    const back = el("button", "back-link", "← Back");
    back.onclick = () => { sfx("click"); mode === "online" ? renderRooms() : show(); };
    wrap.appendChild(back);
    wrap.appendChild(el("div", "logo-mark", "🕊️"));
    wrap.appendChild(el("h1", "title sr-h", mode === "online" ? "Open a room" : "Set the table"));
    wrap.appendChild(el("p", "tagline",
      mode === "online" ? `You take the blue seat as <b>${esc(CG.Net.getName())}</b>. The other seat stays open, and the talks wait, until another delegate takes it.`
      : mode === "hotseat" ? "Two delegates, one screen. Blue opens the first round."
      : "You take the blue delegation against an AI envoy."));

    if (mode === "solo") {
      wrap.appendChild(el("p", "pick-label", "Your rival"));
      const note = el("p", "sr-note", LEVELS[level].blurb);
      wrap.appendChild(seg(Object.keys(LEVELS), level, (v) => { level = v; note.textContent = LEVELS[v].blurb; }, (v) => LEVELS[v].label));
      wrap.appendChild(note);
    }

    wrap.appendChild(el("p", "pick-label", "Rounds"));
    wrap.appendChild(seg([1, 3], total, (v) => { total = v; }, (v) => (v === 1 ? "1 · quick" : "Best of 3")));

    wrap.appendChild(el("p", "pick-label", "House rules"));
    const rules = el("div", "toggle-row pl-rules");
    rules.appendChild(toggle("🤝 Won-over pieces join you", winover, (on) => { winover = on; }));
    rules.appendChild(toggle("🏔️ Summit win", summit, (on) => { summit = on; }));
    wrap.appendChild(rules);
    wrap.appendChild(el("p", "sr-note", "Both on is the full game. Turn “join you” off for a game closer to classic chess."));

    const names = el("div", "sr-names");
    const mkName = (label, val, color) => {
      const row = el("label", "sr-name");
      row.style.setProperty("--tok", color);
      row.innerHTML = `<span class="srn-dot"></span><span class="srn-l">${label}</span>`;
      const i = el("input", "seat-input"); i.type = "text"; i.maxLength = 22; i.value = val; i.placeholder = label;
      row.appendChild(i); names.appendChild(row); return i;
    };
    let n0 = null, n1 = null;
    if (mode === "solo") n0 = mkName("Your name", (CG.Net && CG.Net.getName && CG.Net.getName()) || prev.n0 || "", SEAT_COLORS[0]);
    if (mode === "hotseat") {
      n0 = mkName("Blue delegate", prev.n0 || "", SEAT_COLORS[0]);
      n1 = mkName("Pink delegate", prev.n1 || "", SEAT_COLORS[1]);
    }
    if (n0) { wrap.appendChild(el("p", "pick-label", mode === "hotseat" ? "The delegates" : "You")); wrap.appendChild(names); }

    wrap.appendChild(el("p", "pick-label", "Where the talks are held"));
    const post = el("div", "sr-post");
    const paintPost = () => {
      post.innerHTML = `<span class="srp-ic">${theatre.icon}</span><span class="srp-id"><b>${esc(theatre.name)}</b><small>${esc(theatre.blurb || "")}</small></span>`;
      const rr = el("button", "reroll", "🎲"); rr.title = "Somewhere else";
      rr.onclick = () => { theatre = rand(CG.THEATRES); sfx("click"); paintPost(); };
      post.appendChild(rr);
    };
    paintPost();
    wrap.appendChild(post);

    const go = el("button", "btn btn-primary big", mode === "online" ? "Open the room ▸" : "Take your seats ▸");
    go.style.marginTop = "22px";
    go.onclick = async () => {
      const a = n0 ? clean(n0.value) : "";
      const b = n1 ? clean(n1.value) : "";
      if (mode === "solo" && !a) return nudge(n0);
      if (mode === "hotseat" && (!a || !b)) return nudge(!a ? n0 : n1);
      if (mode === "hotseat" && a.toLowerCase() === b.toLowerCase()) return nudge(n1);
      S.lastSetup = { total, level, winover, summit, n0: a, n1: b };
      if (mode === "solo" && CG.Net && CG.Net.setName) CG.Net.setName(a);
      sfx("pick");
      const opts = { mode, total, level, winover, summit, theatre, names: [a, b], ai: mode === "solo" };
      if (mode === "online") {
        go.disabled = true; go.textContent = "Opening…";
        try {
          opts.names = [CG.Net.getName()];
          const g = buildGame(opts);
          await room().create(g);
          enterOnline(g);
        } catch (e) {
          go.disabled = false; go.textContent = "Open the room ▸";
          flash(wrap, "Could not reach the rooms. Try again, or play solo.");
        }
        return;
      }
      startLocal(buildGame(opts));
    };
    wrap.appendChild(go);
    root.appendChild(wrap);
  }

  // ---- online: name, then the rooms --------------------------------------
  function renderLogin() {
    teardown();
    const root = app(); root.innerHTML = "";
    const wrap = el("div", "screen title-screen sr-setup");
    wrap.appendChild(el("div", "title-glow"));
    const back = el("button", "back-link", "← Back");
    back.onclick = () => show();
    wrap.appendChild(back);
    wrap.appendChild(el("div", "logo-mark", "🕊️"));
    wrap.appendChild(el("h1", "title sr-h", "Parley rooms"));
    wrap.appendChild(el("p", "tagline", "Name yourself to see the tables other delegates have open, and take a seat."));
    wrap.appendChild(el("p", "pick-label", "Your name"));
    const input = el("input", "seat-input lobby-name");
    input.type = "text"; input.maxLength = 22; input.placeholder = "Enter your name";
    input.value = (CG.Net && CG.Net.getName()) || "";
    wrap.appendChild(input);
    const go = el("button", "btn btn-primary big", "See the rooms ▸");
    go.style.marginTop = "18px";
    const enter = () => {
      const nm = clean(input.value);
      if (!nm) return nudge(input);
      CG.Net.setName(nm); sfx("pick");
      renderRooms();
    };
    go.onclick = enter;
    input.onkeydown = (e) => { if (e.key === "Enter") enter(); };
    wrap.appendChild(go);
    root.appendChild(wrap);
    setTimeout(() => { try { input.focus(); } catch (e) {} }, 50);
  }

  let listTimer = null, listGen = 0;
  function stopList() { listGen++; if (listTimer) { clearTimeout(listTimer); listTimer = null; } }

  function renderRooms() {
    teardown(); stopList();
    if (!room()) return renderSetup("solo");
    const root = app(); root.innerHTML = "";
    const wrap = el("div", "screen lobby-screen sr-rooms");
    wrap.appendChild(el("div", "title-glow"));
    const head = el("div", "lobby-head");
    head.innerHTML =
      `<div class="lobby-title"><span class="logo-mark sm">🕊️</span><div><h1 class="title sm">Parley rooms</h1>` +
      `<p class="subtitle sm">Tables open on other browsers, right now</p></div></div>`;
    const who = el("div", "lobby-who");
    who.innerHTML = `<span>Playing as <b>${esc(CG.Net.getName())}</b></span>`;
    const rename = el("button", "back-link", "change");
    rename.onclick = () => { stopList(); renderLogin(); };
    who.appendChild(rename);
    head.appendChild(who);
    wrap.appendChild(head);

    const actions = el("div", "lobby-actions");
    const create = el("button", "btn btn-primary", "✦ Open a room");
    create.onclick = () => { stopList(); renderSetup("online"); };
    const refresh = el("button", "btn btn-ghost", "↻ Refresh");
    refresh.onclick = () => loadRooms(list, true);
    const solo = el("button", "btn btn-ghost", "🤖 Solo vs AI");
    solo.onclick = () => { stopList(); renderSetup("solo"); };
    const home = el("button", "btn btn-ghost", "← Parley");
    home.onclick = () => { stopList(); show(); };
    [create, refresh, solo, home].forEach((b) => actions.appendChild(b));
    wrap.appendChild(actions);

    const list = el("div", "theatre-list");
    list.innerHTML = `<div class="lobby-empty">Looking for open rooms…</div>`;
    wrap.appendChild(list);
    root.appendChild(wrap);

    loadRooms(list, true);
    const gen = ++listGen;
    const tick = () => { listTimer = setTimeout(() => { if (gen !== listGen) return; loadRooms(list, false); tick(); }, 4000); };
    tick();
  }

  async function loadRooms(list, prune) {
    try {
      const rooms = await room().list({ readOnly: !prune });
      if (!list.isConnected) return;
      if (!rooms.length) { list.innerHTML = `<div class="lobby-empty">No open rooms yet. <b>Open a room</b> and wait: it appears here on every other delegate's screen.</div>`; return; }
      list.innerHTML = "";
      rooms.forEach((r) => {
        const seats = r.seats || [];
        const open = seats.filter((s) => s.vacant).length;
        const card = el("div", "theatre-card");
        card.innerHTML =
          `<div class="tc-top"><span class="tc-icon">${r.icon || "🕊️"}</span>` +
            `<div class="tc-id"><b>${esc(r.theatre || "Parley room")}</b>` +
            `<small>🕊️ Parley · round ${(r.round || 0) + 1} of ${r.total || 1}${r.rules ? " · " + esc(r.rules) : ""} · ${ago(r.lastActive)}</small></div></div>` +
          `<div class="tc-seats">${seats.map((s) =>
            `<span class="seat-chip ${s.vacant ? "open" : "human"}" style="--tok:${s.color}"><span class="sc-ic">${s.icon || "◆"}</span>` +
            `<span class="sc-nm">${s.vacant ? "🪑 Open seat" : "🙋 " + esc(s.name) + " · ★" + (s.wins || 0)}</span></span>`).join("")}</div>`;
        const acts = el("div", "tc-actions");
        const join = el("button", "btn btn-primary", open ? "Take the open seat ▸" : "Full · watch ▸");
        join.onclick = () => { stopList(); openJoin(r.id); };
        acts.appendChild(join);
        if (r.hostId === myId()) {
          const close = el("button", "btn btn-ghost", "✕ Close room");
          close.onclick = async () => { close.disabled = true; close.textContent = "Closing…"; sfx("click"); try { await room().drop(r.id); } catch (e) {} if (list.isConnected) loadRooms(list, false); };
          acts.appendChild(close);
        }
        card.appendChild(acts);
        list.appendChild(card);
      });
    } catch (e) {
      if (list.isConnected) list.innerHTML = `<div class="lobby-empty">Could not reach the rooms. <b>Refresh</b> to try again, or play solo.</div>`;
    }
  }
  function ago(t) {
    if (!t) return "just now";
    const s = Math.max(0, Math.round((now() - t) / 1000));
    return s < 60 ? "active just now" : `active ${Math.round(s / 60)} min ago`;
  }
  function rulesLabel(g) {
    const r = g.rules || {};
    if (r.winover && r.summit) return "";
    return [r.winover ? "join you" : "classic captures", r.summit ? "summit" : "no summit"].join(", ");
  }
  function summaryOf(g) {
    return {
      kind: "parley", theatre: g.theatre && g.theatre.name, icon: g.theatre && g.theatre.icon,
      total: g.total, round: g.round, hostId: g.hostId, rules: rulesLabel(g),
      seats: g.players.map((p) => ({ name: p.name, vacant: !!p.vacant, owned: !!p.ownerId, color: p.color, icon: p.icon, wins: p.wins || 0 })),
    };
  }

  async function openJoin(id) {
    const root = app(); root.innerHTML = "";
    const wrap = el("div", "screen title-screen setup-screen sr-setup");
    wrap.appendChild(el("div", "title-glow"));
    const back = el("button", "back-link", "← Back");
    back.onclick = () => renderRooms();
    wrap.appendChild(back);
    wrap.appendChild(el("div", "logo-mark", "🕊️"));
    wrap.appendChild(el("h1", "title sr-h", "Take a seat"));
    const sub = el("p", "tagline", "Loading the room…");
    wrap.appendChild(sub);
    const list = el("div", "seat-list join-list");
    wrap.appendChild(list);
    root.appendChild(wrap);
    let g = null;
    try { g = await room().get(id); } catch (e) { g = null; }
    if (!g) { sub.textContent = "This room has closed."; return; }
    sub.innerHTML = `${esc(g.theatre.icon)} <b>${esc(g.theatre.name)}</b> · round ${g.round + 1} of ${g.total}. Take the open seat, and your name goes on it.`;
    paintSeats(list, g);
  }
  function paintSeats(list, g) {
    list.innerHTML = "";
    let any = false;
    g.players.forEach((p, i) => {
      const mine = !p.vacant && p.ownerId === myId();
      const row = el("div", "seat-row");
      row.style.setProperty("--tok", p.color);
      row.appendChild(el("span", "seat-badge", i ? "P" : "B"));
      row.appendChild(el("span", "join-avatar", p.icon || "◆"));
      const info = el("div", "join-info");
      info.innerHTML = `<b>${esc(p.name)}</b><small>${i ? "pink" : "blue"} · ${mine ? "🙋 your seat" : p.vacant ? "🪑 waiting for a delegate" : "🙋 player"} · ★ ${p.wins || 0}</small>`;
      row.appendChild(info);
      if (mine) {
        any = true;
        const b = el("button", "btn btn-primary sm", "Resume ▸");
        b.onclick = () => enterOnline(g);
        row.appendChild(b);
      } else if (p.vacant) {
        any = true;
        const nm = el("input", "seat-input sm"); nm.type = "text"; nm.maxLength = 22; nm.value = CG.Net.getName();
        row.appendChild(nm);
        const b = el("button", "btn btn-primary sm", "Take ▸");
        b.onclick = () => takeSeat(g.id, i, nm.value, b);
        nm.onkeydown = (e) => { if (e.key === "Enter") b.click(); };
        row.appendChild(b);
      } else row.appendChild(el("span", "join-locked", "in play"));
      list.appendChild(row);
    });
    const watch = el("button", "btn btn-ghost", "👀 Just watch");
    watch.style.marginTop = "6px";
    watch.onclick = () => enterOnline(g);
    list.appendChild(watch);
    if (!any) list.insertBefore(el("div", "lobby-empty", "Both seats are held by players. You can still watch."), watch);
  }
  async function takeSeat(id, idx, rawName, btn) {
    const nm = clean(rawName) || CG.Net.getName() || "Delegate";
    CG.Net.setName(nm);
    if (btn) { btn.disabled = true; btn.textContent = "Taking…"; }
    let g = null;
    try { g = await room().get(id); } catch (e) { g = null; }
    if (!g) return renderRooms();
    const seat = g.players[idx];
    if (!seat || !(seat.vacant || seat.ownerId === myId())) { const list = document.querySelector(".join-list"); if (list) paintSeats(list, g); return; }
    const other = g.players[1 - idx];
    seat.name = other && other.name.toLowerCase() === nm.toLowerCase() ? nm + " II" : nm;
    const roles = CG.ROLES || [];
    if (seat.vacant && roles.length) {
      for (let i = 0; i < 24; i++) { const r = rand(roles); if (!other || r.icon !== other.icon) { seat.icon = r.icon; seat.role = r.name; break; } }
    }
    seat.vacant = false; seat.isAI = false; seat.ownerId = myId();
    g.seq = (g.seq || 0) + 1; g.lastWriter = myId();
    g.lastEvent = `${seat.name} takes a seat. The talks begin.`;
    try { await room().put(g, { summary: true }); } catch (e) { return renderRooms(); }
    sfx("pick");
    enterOnline(g, { joined: true });
  }

  // =======================================================================
  // ENTERING A GAME
  // =======================================================================
  function audioOn() {
    if (CG.Audio) { if (settings.music) { CG.Audio.setMuted(false); CG.Audio.start(); } else CG.Audio.setMuted(true); }
    if (CG.Narrate) CG.Narrate.setEnabled(settings.voice);
  }
  function resetView() {
    S.sel = null; S.hint = null; S.remoteSel = null; S.busy = false; S.pending = null; S.undo = [];
    S.shownBrief = -1; S.shownFinal = false; S.shownOffer = -1; S.warned = "";
    const g = S.g;
    S.shownReveal = g && g.phase !== "play" ? g.round - (g.phase === "reveal" ? 1 : 0) : -1;
    if (g && (g.ply || g.phase !== "play")) S.shownBrief = g.round;
  }
  function startLocal(g) {
    teardown();
    S.g = g; S.mode = g.mode;
    resetView(); audioOn(); mountStage(); afterChange();
  }
  function enterOnline(g, opts) {
    teardown();
    S.g = g; S.mode = "online";
    S.net.online = true; S.net.id = g.id; S.net.seen = {}; S.net.beat = 0;
    resetView(); audioOn(); mountStage();
    room().watch(g.id, applyRemote);
    room().onLive(g.id, onLive);
    S.net.tick = setInterval(netTick, 2000);
    live({ t: "hb" });
    if (opts && opts.joined) toast(`You take your seat. Welcome to ${g.theatre.name}.`, "good");
    else if (waiting(g)) toast("Room open. Waiting for a second delegate.", "muted");
    afterChange();
  }

  // =======================================================================
  // THE STAGE
  // =======================================================================
  function mountStage() {
    const root = app(); root.innerHTML = "";
    const st = el("div", "sr-stage pl-stage");
    st.innerHTML =
      `<div class="sr-bg"></div>` +
      `<header class="sr-hud">` +
        `<div class="sr-hl"><button class="sr-ic" id="pl-quit" title="Leave">✕</button>` +
        `<div class="sr-brand"><b>Parley</b><span class="sr-cable" id="pl-round"></span></div></div>` +
        `<div class="sr-vs" id="pl-vs"></div>` +
        `<div class="sr-tools">` +
          `<button class="sr-ic${settings.music ? " on" : ""}" id="pl-music" title="Music">🎵</button>` +
          `<button class="sr-ic${settings.voice ? " on" : ""}" id="pl-voice" title="Narration">🗣️</button>` +
          `<button class="sr-ic${settings.danger ? " on" : ""}" id="pl-danger" title="Danger marks">⚠</button>` +
          `<button class="sr-ic" id="pl-help" title="How to play">?</button>` +
        `</div>` +
      `</header>` +
      `<main class="sr-main pl-main">` +
        `<aside class="sr-log pl-side" id="pl-side"></aside>` +
        `<section class="pl-col">` +
          `<div class="sr-bar"><div class="sr-banner" id="pl-banner"></div><div class="sr-react" id="pl-react"></div></div>` +
          `<div class="pl-info" id="pl-info"></div>` +
          `<div class="pl-tray top" id="pl-tray-top"></div>` +
          `<div class="pl-boardwrap" id="pl-boardwrap"><div class="pl-board" id="pl-board">` +
            `<div class="pl-squares" id="pl-squares"></div><div class="pl-tokens" id="pl-tokens"></div>` +
          `</div></div>` +
          `<div class="pl-tray bottom" id="pl-tray-bottom"></div>` +
          `<div class="pl-actions" id="pl-actions"></div>` +
        `</section>` +
      `</main>` +
      `<div class="sr-toasts" id="pl-toasts"></div>` +
      `<div class="sr-fx" id="pl-fx"></div>`;
    root.appendChild(st);
    S.mounted = true;
    $("pl-quit").onclick = () => { sfx("click"); confirmLeave(); };
    $("pl-music").onclick = (e) => {
      settings.music = !settings.music; saveSettings(); e.currentTarget.classList.toggle("on", settings.music);
      if (CG.Audio) { CG.Audio.setMuted(!settings.music); if (settings.music) CG.Audio.start(); }
    };
    $("pl-voice").onclick = (e) => {
      settings.voice = !settings.voice; saveSettings(); e.currentTarget.classList.toggle("on", settings.voice);
      if (CG.Narrate) CG.Narrate.setEnabled(settings.voice);
    };
    $("pl-danger").onclick = (e) => {
      settings.danger = !settings.danger; saveSettings(); e.currentTarget.classList.toggle("on", settings.danger);
      paintBoard();
    };
    $("pl-help").onclick = () => showHowTo();
    buildSquares();
    buildReactions();
    window.addEventListener("resize", fit);
    fit();
  }

  function buildSquares() {
    const box = $("pl-squares");
    box.innerHTML = "";
    for (let v = 0; v < N * N; v++) {
      const sq = el("button", "pl-sq" + ((rowOf(v) + colOf(v)) % 2 ? " dk" : ""));
      sq.dataset.v = v;
      sq.tabIndex = -1;
      sq.onclick = () => tapSquare(toView(v));   // view index maps back to board index (the map is its own inverse)
      box.appendChild(sq);
    }
  }

  function fit() {
    const wrap = $("pl-boardwrap"), board = $("pl-board");
    if (!wrap || !board) return;
    // measure the space the column can give, then shrink the wrap to the board
    // so the reserve trays sit right against it on tall phone screens
    wrap.style.flex = ""; wrap.style.height = "";
    // leave room for the board's wooden frame (it is drawn outside the squares)
    const sz = Math.max(180, Math.floor(Math.min(wrap.clientWidth - 24, wrap.clientHeight - 24, 620)));
    board.style.setProperty("--sz", sz + "px");
    wrap.style.flex = "0 0 auto"; wrap.style.height = (sz + 24) + "px";
  }

  const REACTS = ["👏", "😮", "🤔", "😅", "🤝"];
  function buildReactions() {
    const box = $("pl-react");
    box.innerHTML = "";
    REACTS.forEach((e) => {
      const b = el("button", "sr-rb", e);
      b.title = "React";
      b.onclick = () => {
        const seat = mySeatForReact();
        if (seat < 0) return;
        floatReact(seat, e);
        if (S.mode === "online") live({ t: "react", seat, e });
        else if (S.mode === "solo" && Math.random() < 0.5) setTimeout(() => floatReact(1, rand(["😄", "🙌", "🤝", "😏"])), randInt(700, 1500));
      };
      box.appendChild(b);
    });
  }
  function mySeatForReact() {
    const g = S.g;
    if (!g) return -1;
    if (S.mode === "hotseat") return g.turn;
    return g.players.findIndex((p) => !p.isAI && !p.vacant && (S.mode !== "online" || p.ownerId === myId()));
  }

  // ---- painting ----------------------------------------------------------
  function paint() {
    if (!S.mounted || !S.g) return;
    paintHud(); paintBanner(); paintBoard(); paintTrays(); paintInfo(); paintActions(); paintSide();
  }

  function paintHud() {
    const g = S.g;
    $("pl-round").textContent = g.total > 1 ? `Round ${Math.min(g.round + 1, g.total)} of ${g.total}` : g.theatre.name;
    const t = turnSeat(g);
    $("pl-vs").innerHTML = g.players.map((p, i) => {
      const tag = p.vacant ? "🪑 open" : p.isAI ? `🤖 ${LEVELS[g.level] ? LEVELS[g.level].short : "AI"}` : (S.mode === "online" ? (p.ownerId === myId() ? "🙋 you" : "🙋 player") : (S.mode === "solo" ? "🙋 you" : "🙋"));
      const state = p.vacant ? "no delegate yet" : g.phase === "play" ? (i === t ? (p.isAI ? "thinking" : "to move") : "waiting") : `★ ${p.wins || 0}`;
      const hand = handCount(g, i);
      return `<div class="sr-pc${i === t ? " turn" : ""}" id="pl-pc${i}" style="--pc:${p.color}">` +
        `<span class="sr-av">${p.icon}</span>` +
        `<span class="sr-pid"><b>${esc(p.name)}</b><small>${tag} · ${state}</small></span>` +
        `<span class="sr-sc" title="Rounds won"><i>★</i>${p.wins || 0}</span>` +
        (hand ? `<span class="pl-hand" title="Pieces in reserve">🤝${hand}</span>` : "") +
        `</div>` + (i === 0 ? `<span class="sr-vsx">vs</span>` : "");
    }).join("");
    $("pl-react").style.display = mySeatForReact() >= 0 ? "" : "none";
  }
  const handCount = (g, seat) => g.h[seat].reduce((a, b) => a + b, 0);

  // Danger for the seat being helped: its attacked pieces, Envoy, Summit.
  function dangers(g) {
    const seat = helpSeat();
    const hit = attacked(g, 1 - seat);
    const envoy = envoyAt(g, seat);
    return { seat, hit, envoy, envoyHit: envoy >= 0 && hit.has(envoy), summit: rivalCanSummit(g, 1 - seat) };
  }

  function paintBanner() {
    const g = S.g, b = $("pl-banner");
    if (!b) return;
    b.className = "sr-banner";
    b.style.removeProperty("--pc");
    if (g.phase !== "play") {
      const res = g.results[g.phase === "over" ? g.total - 1 : g.round];
      const EN = res ? (CG.PARLEY_ENDINGS || {})[res.how] || {} : {};
      b.innerHTML = g.phase === "over" ? "The talks are over" : `${EN.icon || ""} ${esc(EN.title || "Round over")}`;
      b.classList.add(res && res.winner >= 0 ? "good" : "bad");
      return;
    }
    if (waiting(g)) {
      b.style.setProperty("--pc", g.players[0].color);
      b.classList.add("live", "wait");
      b.innerHTML = `<span class="sr-bdot"></span><span class="sr-bt">Room open · waiting for a second delegate to take the seat</span>`;
      return;
    }
    const t = g.turn, p = g.players[t];
    b.style.setProperty("--pc", p.color);
    b.classList.add("live");
    let line;
    if (isLocalHuman(t)) {
      const d = dangers(g);
      line = S.mode === "hotseat" ? `<b>${esc(p.name)}</b>, your move` : "Your move";
      if (d.envoyHit) { line += ` · <em class="warn">⚠ your Envoy is in danger</em>`; b.classList.add("alert"); }
      else if (d.summit) { line += ` · <em class="warn">⚠ their Envoy is one step from your Summit</em>`; b.classList.add("alert"); }
      else if (S.sel && S.sel.drop) line += ` · <em>tap a glowing home square</em>`;
    } else if (p.isAI) line = `🤖 <b>${esc(p.name)}</b> is thinking`;
    else line = `<b>${esc(p.name)}</b> is thinking`;
    b.innerHTML = `<span class="sr-bdot"></span><span class="sr-bt">${line}</span>`;
  }

  // Targets for the current selection.
  function targets() {
    const g = S.g;
    if (!S.sel || !g || g.phase !== "play") return [];
    if (S.sel.drop) return legalFor(g, g.turn).filter((m) => m.f < 0 && m.p === S.sel.drop);
    const x = g.b[S.sel.i];
    if (!x) return [];
    return genMoves(g, ownerOf(x), [], { noDrops: true }).filter((m) => m.f === S.sel.i);
  }
  // Is the selection something the player to move can actually play?
  function selPlayable() {
    const g = S.g;
    if (!S.sel || !canAct()) return false;
    if (S.sel.drop) return true;
    const x = g.b[S.sel.i];
    return !!x && ownerOf(x) === g.turn;
  }

  function paintBoard() {
    const g = S.g, sqBox = $("pl-squares"), tkBox = $("pl-tokens");
    if (!sqBox || !g) return;
    const moves = targets();
    const tset = new Map(moves.map((m) => [m.t, m]));
    const d = settings.danger && g.phase === "play" && !waiting(g) ? dangers(g) : null;
    const showDanger = d && (S.mode !== "online" || iOwnASeat());
    sqBox.parentNode.classList.toggle("peeking", !!S.sel && !selPlayable() && !(S.sel.drop));
    const sumMine = g.rules.summit ? summitOf(helpSeat()) : -1;       // where the helped seat wants to go
    const sumTheirs = g.rules.summit ? summitOf(1 - helpSeat()) : -1; // the helped seat's own Summit
    const dropping = S.sel && S.sel.drop;
    sqBox.querySelectorAll(".pl-sq").forEach((sq) => {
      const i = toView(+sq.dataset.v);
      const cls = ["pl-sq"];
      if ((rowOf(+sq.dataset.v) + colOf(+sq.dataset.v)) % 2) cls.push("dk");
      if (i === at(2, 2)) cls.push("mid");
      if (i === sumMine) cls.push("summit", "goal");
      else if (i === sumTheirs) cls.push("summit", "own");
      if (g.last && (i === g.last.f || i === g.last.t)) cls.push("last");
      if (S.sel && !S.sel.drop && S.sel.i === i) cls.push("sel");
      if (tset.has(i)) cls.push(tset.get(i).cap ? "cap" : "go");
      if (dropping && tset.has(i)) cls.push("drop");
      if (S.hint && (i === S.hint.t || (S.hint.f >= 0 && i === S.hint.f))) cls.push(i === S.hint.t ? "hint-t" : "hint-f");
      if (S.remoteSel && S.remoteSel.i === i) cls.push("peek");
      sq.className = cls.join(" ");
      sq.innerHTML = i === sumMine || i === sumTheirs ? `<span class="pl-flag">🏔️</span>` : i === at(2, 2) ? `<span class="pl-diamond">◆</span>` : "";
    });
    tkBox.innerHTML = "";
    for (let i = 0; i < N * N; i++) {
      const x = g.b[i];
      if (!x) continue;
      tkBox.appendChild(tokenEl(i, x, showDanger && ownerOf(x) === d.seat && d.hit.has(i)));
    }
  }
  function tokenEl(i, x, danger) {
    const t = Math.abs(x), o = ownerOf(x), v = toView(i);
    const tk = el("div", `pl-tok s${o} t${KEYS[t]}` + (danger ? " danger" : ""));
    tk.dataset.i = i;
    tk.style.left = (colOf(v) * 20) + "%";
    tk.style.top = (rowOf(v) * 20) + "%";
    tk.style.setProperty("--pc", SEAT_COLORS[o]);
    // Volunteers show which way is forward for them
    const arrow = t === V ? `<span class="pl-dir">${(o === 0) !== flipped() ? "▲" : "▼"}</span>` : "";
    tk.innerHTML = `<span class="pl-disc"><span class="pl-emo">${P(t).icon}</span>${arrow}${t === L ? '<span class="pl-star">★</span>' : ""}</span>` +
      (danger ? `<span class="pl-warn">⚠</span>` : "");
    tk.title = `${o === 0 ? "Blue" : "Pink"} ${P(t).name}: ${P(t).moves}`;
    return tk;
  }

  // Reserve trays: the rival's at the top, the helped seat's at the bottom.
  function paintTrays() {
    const g = S.g;
    const bottomSeat = S.mode === "hotseat" ? 0 : viewSeat();
    [["pl-tray-top", 1 - bottomSeat], ["pl-tray-bottom", bottomSeat]].forEach(([id, seat]) => {
      const box = $(id);
      if (!box) return;
      box.style.setProperty("--pc", SEAT_COLORS[seat]);
      if (!g.rules.winover) { box.innerHTML = ""; box.classList.add("off"); return; }
      box.classList.remove("off");
      const mine = canAct() && g.turn === seat;
      const chips = DROPPABLE.filter((p) => g.h[seat][p]).map((p) =>
        `<button class="pl-chip${mine ? " can" : ""}${S.sel && S.sel.drop === p && g.turn === seat ? " on" : ""}" data-p="${p}" data-s="${seat}" title="${P(p).name}: tap, then tap a home square">` +
        `<span class="pl-emo">${P(p).icon}</span>${g.h[seat][p] > 1 ? `<b>×${g.h[seat][p]}</b>` : ""}</button>`).join("");
      box.innerHTML = `<span class="pl-tray-l">${esc(g.players[seat].name)}'s reserve</span>` + (chips || `<span class="pl-tray-e">empty</span>`);
      box.querySelectorAll(".pl-chip").forEach((c) => {
        c.onclick = () => {
          if (!canAct() || +c.dataset.s !== g.turn) return;
          const p = +c.dataset.p;
          // tapping the piece a hint suggested keeps it (and the hint) selected
          if (S.hint && S.hint.f < 0 && S.hint.p === p) S.sel = { drop: p };
          else { S.sel = S.sel && S.sel.drop === p ? null : { drop: p }; S.hint = null; }
          sfx("click");
          sendSel();
          paintBoard(); paintTrays(); paintInfo(); paintBanner();
        };
      });
    });
  }

  // What the selected piece does, in one line (and the hint text).
  function paintInfo() {
    const box = $("pl-info"), g = S.g;
    if (!box) return;
    if (S.hint && S.hint.text) {
      box.className = "pl-info hint";
      box.innerHTML = `<span class="pl-ii">💡</span><span>${esc(S.hint.text)}</span>`;
      return;
    }
    let t = 0;
    if (S.sel && S.sel.drop) t = S.sel.drop;
    else if (S.sel && g.b[S.sel.i]) t = Math.abs(g.b[S.sel.i]);
    if (!t) { box.className = "pl-info"; box.innerHTML = ""; return; }
    const pc = P(t);
    box.className = "pl-info on";
    box.innerHTML = `${moveDiagram(t, "sm")}<span><b>${pc.icon} ${pc.name}</b> ${esc(pc.moves)}${S.sel.drop ? " Bring it in on one of your two home rows." : ""}</span>`;
  }

  // A tiny 5 by 5 picture of how a piece moves (for the legend and the info line).
  function moveDiagram(t, cls) {
    const b = new Array(25).fill("");
    const c0 = 12;
    const mark = (r, c, k) => { if (r >= 0 && r < 5 && c >= 0 && c < 5) b[at(r, c)] = k; };
    const ray = (dirs) => dirs.forEach(([dr, dc]) => { for (let k = 1; k < 5; k++) mark(2 + dr * k, 2 + dc * k, k === 1 ? "d" : "l"); });
    if (t === E) KING.forEach(([dr, dc]) => mark(2 + dr, 2 + dc, "d"));
    if (t === C) ray(ORTH);
    if (t === SC) ray(DIAG);
    if (t === L) ray(KING);
    if (t === A) JUMP.forEach(([dr, dc]) => mark(2 + dr, 2 + dc, "d"));
    if (t === V) [[-1, -1], [-1, 0], [-1, 1]].forEach(([dr, dc]) => mark(2 + dr, 2 + dc, "d"));
    b[c0] = "p";
    return `<span class="pl-md ${cls || ""}">${b.map((k, i) => `<i class="${k}">${k === "p" ? P(t).icon : ""}</i>`).join("")}</span>`;
  }

  function paintActions() {
    const box = $("pl-actions"), g = S.g;
    if (!box) return;
    box.innerHTML = "";
    // after "See the board" on a finished round, the way on again
    if (g.phase !== "play" && !S.overlay && (S.mode !== "online" || iOwnASeat() || g.phase === "over")) {
      const res = g.phase === "over" ? g.total - 1 : g.round;
      const on = el("button", "btn btn-primary pl-act", g.phase === "over" ? "The outcome ▸" : res + 1 >= g.total ? "The outcome ▸" : "Next round ▸");
      on.onclick = () => { sfx("click"); if (g.phase === "over") showFinal(); else showReveal(g.round); };
      box.appendChild(on);
      return;
    }
    const playing = g.phase === "play" && !waiting(g);
    const mine = playing && isLocalHuman(g.turn);
    const hint = el("button", "btn btn-ghost pl-act", "💡 Hint");
    hint.disabled = !mine || S.busy || !!S.overlay;
    hint.onclick = () => giveHint();
    box.appendChild(hint);
    if (S.mode !== "online") {
      const back = el("button", "btn btn-ghost pl-act", "↩ Take back");
      back.disabled = !S.undo.length || S.busy || !playing;
      back.onclick = () => takeBack();
      box.appendChild(back);
    }
    const peace = el("button", "btn btn-ghost pl-act", "🤝 Offer peace");
    const me = mine ? g.turn : -1;
    peace.disabled = !mine || S.busy || g.ply < 6 || (me >= 0 && g.ply - (g.players[me].offers || -99) < 10) || g.offer >= 0;
    peace.onclick = () => offerPeace();
    box.appendChild(peace);
    const legend = el("button", "btn btn-ghost pl-act pl-legend-btn", "📖 Pieces");
    legend.onclick = () => showPieces();
    box.appendChild(legend);
  }

  function paintSide() {
    const box = $("pl-side"), g = S.g;
    if (!box) return;
    const pieces = [E, C, A, SC, V, L].map((t) => {
      const pc = P(t);
      return `<div class="pl-lg">${moveDiagram(t)}<div><b>${pc.icon} ${pc.name}</b> <small>like ${pc.like}</small><p>${esc(pc.moves)}</p></div></div>`;
    }).join("");
    const log = g.moves.slice(-40).map((m, k, arr) => {
      const n = g.moves.length - arr.length + k + 1;
      const pl = g.players[m.s];
      const txt = m.f < 0 ? `brings in a ${P(m.p).name}` : m.cap ? `${P(m.p).name} wins over a ${P(m.cap).name}${m.promo ? ", 🌟" : ""}` : m.promo ? "Volunteer becomes a Coordinator 🌟" : `moves a ${P(m.p).name}`;
      return `<li style="--pc:${pl.color}"><span class="pl-n">${n}</span><span class="pl-dot"></span>${esc(txt)}</li>`;
    }).reverse().join("");
    const past = g.results.filter(Boolean).map((r, i) => {
      const EN = (CG.PARLEY_ENDINGS || {})[r.how] || {};
      const w = r.winner >= 0 ? g.players[r.winner] : null;
      return `<li>Round ${i + 1}: ${EN.icon || ""} ${w ? `<b style="color:${w.color}">${esc(w.name)}</b>` : "shared"}</li>`;
    }).join("");
    box.innerHTML =
      `<div class="sr-lh"><span class="sr-lh-ic">${g.theatre.icon}</span><div><b>${esc(g.theatre.name)}</b>` +
        `<small>Round ${Math.min(g.round + 1, g.total)} of ${g.total} · move ${g.ply + (g.phase === "play" ? 1 : 0)}</small></div></div>` +
      `<div class="pl-goal"><div class="sr-cl-h">How to win</div>` +
        `<p>🤝 Win over the rival <b>Envoy</b>${g.rules.summit ? ", or<br>🏔️ walk your Envoy onto their <b>Summit</b>" : ""}.</p>` +
        `${g.rules.winover ? "<p class='sm'>Pieces you win over join your reserve. Bring one in on your two home rows instead of moving.</p>" : ""}</div>` +
      `<div class="sr-cl-h pl-sh">The pieces</div>${pieces}` +
      (past ? `<div class="sr-cl-h pl-sh">Rounds</div><ul class="pl-past">${past}</ul>` : "") +
      `<div class="sr-cl-h pl-sh">The table so far</div>` +
      (log ? `<ol class="pl-log">${log}</ol>` : `<p class="muted pl-empty">No moves yet.</p>`);
  }

  // =======================================================================
  // INPUT
  // =======================================================================
  function tapSquare(i) {
    const g = S.g;
    if (!g) return;
    if (!canAct()) {
      if (g.phase === "play" && g.b[i]) { S.sel = S.sel && S.sel.i === i ? null : { i }; paintBoard(); paintInfo(); }
      return;
    }
    const seat = g.turn;
    if (selPlayable()) {
      const m = targets().find((x) => x.t === i);
      if (m) return humanMove(seat, m);
    }
    const x = g.b[i];
    if (x && ownerOf(x) === seat) {
      if (S.hint && S.hint.f === i) S.sel = { i };
      else { S.sel = S.sel && S.sel.i === i ? null : { i }; S.hint = null; }
      sfx("click");
    } else if (x) {
      S.sel = { i };   // peek at a rival piece: its moves are not playable
      S.hint = null;
    } else S.sel = null;
    sendSel();
    paintBoard(); paintInfo(); paintBanner(); paintTrays();
  }
  function sendSel() {
    if (S.mode !== "online" || !S.g) return;
    live({ t: "sel", seat: S.g.turn, i: S.sel && !S.sel.drop ? S.sel.i : -1 });
  }

  function humanMove(seat, m) {
    const g = S.g;
    if (m.f >= 0 && ownerOf(g.b[m.f]) !== seat) return;
    if (S.mode !== "online") S.undo.push(JSON.stringify(g));
    if (S.undo.length > 60) S.undo.shift();
    commit(seat, m);
  }

  document.addEventListener("keydown", (e) => {
    if (!S.mounted) return;
    const a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
    if (S.overlay) {
      if (e.key === "Enter" || e.key === "Escape") { const b = S.overlay.querySelector(".btn-primary"); if (b) { e.preventDefault(); b.click(); } }
      return;
    }
    if (e.key === "Escape") { S.sel = null; S.hint = null; paintBoard(); paintInfo(); paintTrays(); }
    else if (e.key.toLowerCase() === "h" && !e.ctrlKey && !e.metaKey) giveHint();
  });

  // =======================================================================
  // THE TURN LOOP
  // =======================================================================
  function commit(seat, m) {
    const g = S.g;
    if (!g || g.turn !== seat || g.phase !== "play") return;
    cancelAI();
    S.sel = null; S.hint = null; S.remoteSel = null;
    const info = applyMove(g, seat, m);
    if (S.mode === "online") pushState(info.win || info.ended ? { summary: true } : null);
    animateMove(info, () => afterMove(info));
  }

  // Slide the token (or drop it in), send a won-over piece flying to the
  // winner's reserve, then redraw from the state.
  function animateMove(info, done) {
    const tk = $("pl-tokens");
    if (!tk || !S.mounted) { done && done(); return; }
    S.busy = true;
    paintHud(); paintBanner(); paintActions();
    const v = toView(info.t);
    const left = (colOf(v) * 20) + "%", top = (rowOf(v) * 20) + "%";
    const victim = tk.querySelector(`.pl-tok[data-i="${info.t}"]`);
    if (info.drop) {
      const x = sg(info.seat) * info.p;
      const n = tokenEl(info.t, x, false);
      n.classList.add("drop-in");
      tk.appendChild(n);
      sfx("pick");
    } else {
      const mover = tk.querySelector(`.pl-tok[data-i="${info.f}"]`);
      if (mover) { mover.classList.add("moving"); mover.style.left = left; mover.style.top = top; }
      sfx(info.p === A ? "ladder" : "step");
    }
    if (victim && !info.drop) {
      setTimeout(() => {
        victim.classList.add(info.cap === E ? "fallen" : "won");
        victim.style.setProperty("--pc", SEAT_COLORS[info.seat]);
        sfx(info.cap === E ? "doubles" : "note");
        burst(victim, SEAT_COLORS[info.seat], info.cap === E ? 40 : 16);
      }, 170);
    }
    setTimeout(() => {
      S.busy = false;
      paint();
      if (info.promo) {
        const n = tk.querySelector(`.pl-tok[data-i="${info.t}"]`);
        if (n) { n.classList.add("promo"); burst(n, "#ef9f25", 24); }
        sfx("ladder");
      }
      done && done();
    }, info.drop ? 380 : 420);
  }

  function afterMove(info) {
    const g = S.g;
    const pl = g.players[info.seat];
    const mineHuman = isLocalHuman(info.seat);
    if (info.win) {
      if (info.how === "summit") { toast(`🏔️ ${pl.name}'s Envoy reached the Summit!`, "good"); say(`${pl.name} reached the Summit.`); }
      else { toast(`🤝 ${pl.name} won over the rival Envoy!`, "good"); say(`${pl.name} won over the rival Envoy.`); }
      sfx("clap");
    } else if (info.cap) {
      const pcName = P(info.cap).name;
      if (mineHuman && S.mode !== "hotseat") toast(`🤝 Won over! Their ${pcName} joins your side.`, "good");
      else if (S.mode !== "hotseat" && isLocalHuman(1 - info.seat)) toast(`${pl.name} won over your ${pcName}`, "bad");
      else toast(`🤝 ${pl.name} wins over a ${pcName}`, "good");
      if (controlsAI(info.seat) && Math.random() < 0.5) aiSay(info.seat, rand(CG.PARLEY_AI_WINOVER || ["Welcome."]));
      if (controlsAI(1 - info.seat) && Math.random() < 0.5) aiSay(1 - info.seat, rand(CG.PARLEY_AI_LOSS || ["Hmm."]));
    } else if (info.promo) {
      toast(`🌟 ${pl.name}'s Volunteer becomes a Coordinator!`, "good");
    }
    if (info.promo && !info.win) say("A Volunteer becomes a Coordinator.");
    if (flushPending()) return;
    afterChange();
  }
  function flushPending() {
    const p = S.pending;
    S.pending = null;
    if (p && S.g && (p.seq || 0) > (S.g.seq || 0)) { applyRemote(p); return true; }
    return false;
  }

  function afterChange() {
    const g = S.g;
    if (!g || !S.mounted) return;
    if (CG.Audio && CG.Audio.setProgress) CG.Audio.setProgress(1 + Math.min(99, Math.round(g.ply * 0.8)));
    paint();
    if (g.phase === "play") {
      if (waiting(g)) return;
      if (S.shownBrief !== g.round) { S.shownBrief = g.round; showBriefing(); return; }
      if (S.mode === "online" && g.offer >= 0 && S.shownOffer !== g.ply && isLocalHuman(1 - g.offer)) { S.shownOffer = g.ply; showOfferCard(g.offer); }
      warnDanger();
      const t = turnSeat(g);
      if (t >= 0 && controlsAI(t)) scheduleAI();
    } else if (g.phase === "reveal") {
      if (S.shownReveal !== g.round) { S.shownReveal = g.round; setTimeout(() => { if (S.g === g && g.phase === "reveal") showReveal(g.round); }, 900); }
    } else if (g.phase === "over") {
      if (S.shownReveal !== g.total - 1 && g.results[g.total - 1]) { S.shownReveal = g.total - 1; setTimeout(() => showReveal(g.total - 1, true), 900); }
      else if (!S.shownFinal) { S.shownFinal = true; setTimeout(showFinal, 400); }
    }
  }

  // Say it aloud once per position when the helped player's Envoy or Summit is in danger.
  function warnDanger() {
    const g = S.g;
    if (!settings.danger || !canAct()) return;
    const d = dangers(g);
    const key = g.ply + ":" + (d.envoyHit ? "e" : "") + (d.summit ? "s" : "");
    if ((!d.envoyHit && !d.summit) || S.warned === key) return;
    S.warned = key;
    sfx("reject");
    const txt = d.envoyHit ? "Careful: your Envoy is in danger." : "Careful: their Envoy is one step from your Summit.";
    toast("⚠ " + txt.replace("Careful: ", ""), "bad");
    say(txt);
  }

  // ---- AI ------------------------------------------------------------------
  function cancelAI() { S.aiGen++; hideBubble(); }
  function aiSay(seat, line) { showBubble(seat, line); setTimeout(hideBubble, 2600); }
  function scheduleAI() {
    const g = S.g, seat = turnSeat(g);
    if (seat < 0 || !controlsAI(seat)) return;
    const gen = ++S.aiGen;
    const alive = () => gen === S.aiGen && S.g === g && g.phase === "play" && g.turn === seat && !S.busy && !S.overlay;
    const begin = () => {
      if (gen !== S.aiGen) return;
      if (S.overlay || S.busy) { setTimeout(begin, 400); return; }
      if (!alive()) return;
      if (Math.random() < 0.35) showBubble(seat, rand(CG.PARLEY_AI_LINES || ["Thinking…"]).replace("{theatre}", g.theatre.name));
      setTimeout(() => {
        if (!alive()) return;
        const m = aiChoose(g, seat);
        if (!m) { g.turn = 1 - seat; afterChange(); return; }
        // point at the piece first, like a person reaching for it
        S.sel = m.f >= 0 ? { i: m.f } : { drop: m.p };
        paintBoard(); paintTrays();
        setTimeout(() => { hideBubble(); if (alive()) commit(seat, m); else { S.sel = null; paintBoard(); } }, 520);
      }, randInt(550, 1100));
    };
    setTimeout(begin, 450);
  }

  // ---- help: hint, take back, peace ---------------------------------------
  function giveHint() {
    const g = S.g;
    if (!canAct()) return;
    const seat = g.turn;
    const lvl = LEVELS.veteran;
    const scored = analyse(g, seat, lvl.key);
    if (!scored.length) return;
    const m = scored[0].m;
    g.players[seat].hints = (g.players[seat].hints || 0) + 1;
    S.sel = m.f >= 0 ? { i: m.f } : { drop: m.p };
    S.hint = { f: m.f, t: m.t, p: m.p, text: explain(g, seat, m) };
    sfx("note");
    paintBoard(); paintInfo(); paintTrays();
    say(S.hint.text);
  }

  function takeBack() {
    if (S.mode === "online" || !S.undo.length || S.busy) return;
    cancelAI();
    closeOverlay(true);
    const snap = S.undo.pop();
    const old = S.g;
    const g = JSON.parse(snap);
    // keep the running hint count
    g.players.forEach((p, i) => { p.hints = old.players[i].hints || 0; });
    S.g = g; S.sel = null; S.hint = null;
    sfx("click");
    toast("↩ Move taken back", "muted");
    afterChange();
  }

  function offerPeace() {
    const g = S.g;
    if (!canAct()) return;
    const seat = g.turn;
    g.players[seat].offers = g.ply;
    sfx("pick");
    if (S.mode === "solo") {
      const other = 1 - seat;
      showBubble(other, "Considering your offer…");
      setTimeout(() => {
        if (S.g !== g || g.phase !== "play") return;
        const scored = analyse(g, other, "officer");
        // the AI answers as if it were its move: it accepts unless it is clearly ahead
        const best = scored.length ? scored[0].v : 0;
        if (best < 0.9) {
          aiSay(other, rand(CG.PARLEY_AI_PEACE_YES || ["Agreed."]));
          endRound(g, -1, "peace");
          afterChange();
        } else {
          aiSay(other, rand(CG.PARLEY_AI_PEACE_NO || ["Not yet."]));
          paintActions();
        }
      }, 1100);
      paintActions();
      return;
    }
    if (S.mode === "hotseat") { showOfferCard(seat); return; }
    g.offer = seat;
    g.lastEvent = `${g.players[seat].name} offers peace`;
    pushState();
    toast("🤝 Peace offered. Waiting for an answer…", "muted");
    paintActions();
  }
  function showOfferCard(from) {
    const g = S.g;
    const a = g.players[from], b = g.players[1 - from];
    const c = el("div", "event-card sr-card");
    c.innerHTML = `<div class="ec-band">A PEACE OFFER</div><div class="ec-icon">🤝</div>` +
      `<div class="ec-title">${esc(a.name)} offers peace</div>` +
      `<div class="ec-why">${esc(b.name)}, accept and the round is shared. Decline and the talks go on.</div>`;
    const act = el("div", "ec-actions");
    act.appendChild(cardBtn("Decline", false, () => {
      closeOverlay(false);
      if (S.mode === "online") { g.offer = -1; g.lastEvent = `${b.name} declines, the talks go on`; pushState(); }
      toast("The talks go on", "muted");
      paintActions();
    }));
    act.appendChild(cardBtn("Accept 🤝", true, () => {
      closeOverlay(true);
      endRound(g, -1, "peace");
      if (S.mode === "online") pushState({ summary: true });
      afterChange();
    }));
    c.appendChild(act);
    openOverlay(c, { stay: true });
  }

  // =======================================================================
  // OVERLAYS
  // =======================================================================
  function openOverlay(card, opts) {
    closeOverlay(true);
    const over = el("div", "overlay-card sr-over");
    over.appendChild(card);
    over.addEventListener("click", (e) => {
      if (e.target !== over) return;
      e.stopPropagation();
      if (opts && opts.stay) return;
      const b = card.querySelector(".btn-primary");
      if (b) b.click();
    });
    app().appendChild(over);
    S.overlay = over;
    setTimeout(() => over.classList.add("show"), 20);
    return over;
  }
  function closeOverlay(instant, then) {
    const o = S.overlay;
    if (!o) { if (then) then(); return; }
    S.overlay = null;
    if (instant) o.remove();
    else { o.classList.remove("show"); setTimeout(() => o.remove(), 240); }
    if (S.mounted && S.g) { paintBanner(); paintActions(); paintTrays(); }
    if (then) then();
  }
  function cardBtn(label, primary, fn) {
    const b = el("button", "btn " + (primary ? "btn-primary" : "btn-ghost"), label);
    b.onclick = () => { sfx("click"); fn(); };
    return b;
  }
  function whoLine(p) { return `<span class="sr-who" style="--pc:${p.color}"><span class="sr-av sm">${p.icon}</span>${esc(p.name)}</span>`; }

  function showBriefing() {
    const g = S.g;
    const first = g.players[g.first];
    const c = el("div", "event-card sr-card brief");
    c.innerHTML =
      `<div class="ec-band">${g.total > 1 ? `ROUND ${g.round + 1} OF ${g.total} · ` : ""}THE TALKS OPEN</div>` +
      `<div class="sr-cable-ic"><span>${g.theatre.icon}</span><span class="sr-wave"></span></div>` +
      `<div class="ec-title">${g.round === 0 ? `Talks in ${esc(g.theatre.name)}` : "Back to the table"}</div>` +
      (g.round === 0 && g.theatre.blurb ? `<div class="sr-posting">${esc(g.theatre.blurb)}</div>` : "") +
      `<div class="pl-brief-vs">${whoLine(g.players[0])}<span class="sr-vsx">vs</span>${whoLine(g.players[1])}</div>` +
      `<div class="ec-fact"><span>To win</span>Win over the rival Envoy 🕊️${g.rules.summit ? ", or walk your Envoy onto their Summit 🏔️" : ""}.</div>` +
      `<div class="sr-brief-q pl-tip">💡 ${esc(rand(CG.PARLEY_TIPS || [""]))}</div>` +
      `<div class="sr-first">Opening move: ${whoLine(first)}</div>`;
    const act = el("div", "ec-actions");
    act.appendChild(cardBtn("Begin the talks ▸", true, () => { CG.Narrate && CG.Narrate.stop(); closeOverlay(false); afterChange(); }));
    c.appendChild(act);
    openOverlay(c);
    sfx("radio");
    say(g.round === 0 ? `Talks in ${g.theatre.name}. ${first.name} opens.` : `Round ${g.round + 1}. ${first.name} opens.`);
  }

  function showReveal(rd, last) {
    const g = S.g;
    const res = g.results[rd];
    if (!res) return;
    const EN = (CG.PARLEY_ENDINGS || {})[res.how] || { icon: "◆", title: res.how, line: "" };
    const W = res.winner >= 0 ? g.players[res.winner] : null;
    const Lz = res.winner >= 0 ? g.players[1 - res.winner] : null;
    const line = (EN.line || "").replace("{winner}", W ? W.name : "").replace("{loser}", Lz ? Lz.name : "");
    const c = el("div", "event-card sr-card reveal " + (W ? "ok" : "miss"));
    c.innerHTML =
      `<div class="ec-band">${g.total > 1 ? `ROUND ${rd + 1} OF ${g.total} · ` : ""}${esc(EN.title.toUpperCase())}</div>` +
      `<div class="ec-icon pl-big">${EN.icon}</div>` +
      (W ? `<div class="sr-winner" style="--pc:${W.color}"><span class="sr-medal">🥇</span>${whoLine(W)} takes the round</div>` : `<div class="sr-winner none">A shared round</div>`) +
      `<div class="ec-why">${esc(line)} ${res.plies} moves.</div>` +
      `<div class="sr-res">${g.players.map((p) =>
        `<div class="sr-res-row" style="--pc:${p.color}">${whoLine(p)}` +
          `<span class="sr-res-t">${p.hints ? `💡 ${p.hints}` : ""}</span><span class="sr-res-s">★ ${p.wins || 0}</span></div>`).join("")}</div>` +
      `<div class="ec-fact"><span>Field note</span>${esc(rand(CG.PARLEY_NOTES || [""]))}</div>`;
    const act = el("div", "ec-actions");
    const isLast = last || rd + 1 >= g.total;
    const canAdvance = S.mode !== "online" || iOwnASeat();
    if (!isLast && S.mode !== "online") act.appendChild(cardBtn("See the board", false, () => closeOverlay(false)));
    if (canAdvance) {
      act.appendChild(cardBtn(isLast ? "The outcome ▸" : "Next round ▸", true, () => {
        CG.Narrate && CG.Narrate.stop();
        closeOverlay(false, () => {
          if (S.g.phase === "reveal") {
            nextRound(S.g);
            if (S.mode === "online") pushState({ summary: true });
            S.undo = [];
          }
          afterChange();
        });
      }));
    } else act.appendChild(cardBtn("Close", true, () => closeOverlay(false)));
    c.appendChild(act);
    if (S.mode === "online" && !isLast) {
      const cd = el("div", "sr-countdown");
      c.appendChild(cd);
      const tickCd = () => {
        if (!cd.isConnected) return;
        const left = Math.max(0, (((S.g && S.g.revealAt) || 0) - now()) / 1000);
        cd.textContent = S.g && S.g.phase === "reveal" ? `Next round in ${Math.ceil(left)}s` : "";
        setTimeout(tickCd, 500);
      };
      tickCd();
    }
    openOverlay(c, { stay: true });
    const iWon = W && isLocalHuman(res.winner) && S.mode !== "hotseat";
    const iLost = W && !isLocalHuman(res.winner) && isLocalHuman(1 - res.winner) && S.mode !== "hotseat";
    if (iLost) sfx("wah"); else { sfx("win"); }
    if (W && !iLost) confettiRain([W.color]);
    say(line);
    if (iWon || iLost) {
      const st = stats();
      st.rounds++;
      if (iWon) { st.roundsWon++; if (res.how === "summit") st.summits++; }
      ls("cg_parley_stats", st);
    }
  }

  function showFinal() {
    const g = S.g;
    if (!g) return;
    if (g.total === 1) { finalCardSimple(g); return; }
    const order = [0, 1].sort((a, b) => (g.players[b].wins || 0) - (g.players[a].wins || 0));
    const tie = (g.players[0].wins || 0) === (g.players[1].wins || 0);
    const top = g.players[order[0]];
    recordMatch(g, tie ? -1 : order[0]);
    const titles = CG.PARLEY_TITLES || ["Chief Negotiator", "Senior Envoy", "Delegate"];
    const epi = rand((tie ? (CG.PARLEY_EPILOGUES || {}).shared : (CG.PARLEY_EPILOGUES || {}).win) || [""]);
    const c = el("div", "event-card sr-card final");
    c.innerHTML =
      `<div class="ec-band">THE OUTCOME · ${esc(g.theatre.name.toUpperCase())}</div>` +
      `<div class="ec-icon">${tie ? "🤝" : "🏅"}</div>` +
      `<div class="ec-title">${tie ? "Common ground, shared" : `${esc(top.name)} wins the talks`}</div>` +
      `<div class="sr-podium">${order.map((i, k) => {
        const p = g.players[i];
        return `<div class="sr-pod ${k === 0 && !tie ? "first" : ""}" style="--pc:${p.color}"><span class="sr-av lg">${p.icon}</span>` +
          `<b>${esc(p.name)}</b><span class="sr-pod-s">★ ${p.wins || 0}</span><span class="sr-pod-p">${p.hints ? `💡 ${p.hints} hint${p.hints === 1 ? "" : "s"}` : "no hints"}</span>` +
          `<small>${tie ? titles[1] : titles[k === 0 ? 0 : 2]}</small></div>`;
      }).join("")}</div>` +
      `<div class="sr-sum">${g.results.map((r, i) => {
        const EN = (CG.PARLEY_ENDINGS || {})[r.how] || {};
        const w = r.winner >= 0 ? g.players[r.winner] : null;
        return `<div class="sr-sum-row"><span class="sr-mini pl-mini">R${i + 1}</span><span>${EN.icon || ""} ${w ? `<b style="color:${w.color}">${esc(w.name)}</b>, ${esc((EN.title || "").toLowerCase())}` : esc(EN.title || "shared")}</span><span class="sr-sum-g">${r.plies} moves</span></div>`;
      }).join("")}</div>` +
      `<div class="ec-fact big"><span>Headquarters</span>${esc(epi)}</div>`;
    finishCard(c, g, tie ? "Common ground, shared." : `${top.name} wins the talks. ${epi}`, order.map((i) => g.players[i].color));
  }
  function finalCardSimple(g) {
    const r = g.results[0] || { winner: -1, how: "peace", plies: 0 };
    recordMatch(g, r.winner);
    const w = r.winner >= 0 ? g.players[r.winner] : null;
    const epi = rand((w ? (CG.PARLEY_EPILOGUES || {}).win : (CG.PARLEY_EPILOGUES || {}).shared) || [""]);
    const c = el("div", "event-card sr-card final");
    c.innerHTML =
      `<div class="ec-band">THE OUTCOME · ${esc(g.theatre.name.toUpperCase())}</div>` +
      `<div class="ec-icon">${w ? "🏅" : "🤝"}</div>` +
      `<div class="ec-title">${w ? `${esc(w.name)} wins the talks` : "Common ground, shared"}</div>` +
      `<div class="ec-fact big"><span>Headquarters</span>${esc(epi)}</div>`;
    finishCard(c, g, "", w ? [w.color] : SEAT_COLORS);
  }
  function finishCard(c, g, spoken, colors) {
    const act = el("div", "ec-actions");
    act.appendChild(cardBtn("📋 Share", false, () => share(g)));
    if (S.mode === "online") act.appendChild(cardBtn("Back to the rooms ▸", true, () => leave(true)));
    else {
      act.appendChild(cardBtn("See the board", false, () => closeOverlay(false)));
      act.appendChild(cardBtn("Play again ▸", true, () => { closeOverlay(true); renderSetup(S.mode); }));
    }
    act.appendChild(cardBtn("Games", false, () => { teardown(); CG.Platform.show(); }));
    c.appendChild(act);
    openOverlay(c, { stay: true });
    sfx("clap");
    if (spoken) say(spoken);
    confettiRain(colors);
  }
  function recordMatch(g, winner) {
    const mine = [0, 1].filter((i) => isLocalHuman(i));
    if (!mine.length || S.mode === "hotseat") return;
    const st = stats();
    st.matches++;
    if (winner === mine[0]) st.wins++;
    ls("cg_parley_stats", st);
  }

  function share(g) {
    const lines = [`Parley · ${g.theatre.icon} ${g.theatre.name}`, g.players.map((p, i) => `${SEAT_DOTS[i]} ${p.name} ★${p.wins || 0}`).join("   ")];
    g.results.forEach((r, i) => {
      const EN = (CG.PARLEY_ENDINGS || {})[r.how] || {};
      lines.push(`Round ${i + 1}: ${EN.icon || ""} ${r.winner >= 0 ? g.players[r.winner].name + ", " + (EN.title || "").toLowerCase() : EN.title || "shared"} in ${r.plies} moves`);
    });
    lines.push("Common Ground · shamoug.github.io/comgro/parley/");
    const text = lines.join("\n");
    const done = () => toast("Copied. Paste it anywhere.", "good");
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    const ta = el("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { toast("Could not copy on this browser", "bad"); }
    ta.remove();
  }

  function piecesHtml() {
    return [E, C, A, SC, V, L].map((t) => {
      const pc = P(t);
      return `<div class="pl-lg">${moveDiagram(t)}<div><b>${pc.icon} ${pc.name}</b> <small>like ${pc.like}</small><p>${esc(pc.moves)}</p><p class="sm">${esc(pc.role)}</p></div></div>`;
    }).join("");
  }
  function showPieces() {
    const c = el("div", "event-card sr-card logcard");
    c.innerHTML = `<div class="ec-band">THE DELEGATION</div><div class="pl-pieces">${piecesHtml()}</div>`;
    const act = el("div", "ec-actions");
    act.appendChild(cardBtn("Back to the table ▸", true, () => closeOverlay(false)));
    c.appendChild(act);
    openOverlay(c);
  }

  function showHowTo() {
    const c = el("div", "event-card sr-card how");
    c.innerHTML =
      `<div class="ec-band">HOW TO PLAY</div>` +
      `<div class="ec-title">Parley in one minute</div>` +
      `<div class="sr-how">` +
        `<p>Chess on a <b>5 by 5</b> table. Each delegation has an <b>Envoy</b> 🕊️, two <b>Convoys</b> 🚚, an <b>Airlift</b> 🚁, a <b>Scout</b> 🧭 and three <b>Volunteers</b> 🙋. They move like the king, rooks, knight, bishop and pawns.</p>` +
        `<p><b>Easier than chess:</b> no check, no checkmate, no castling, no en passant. A Volunteer steps one square forward, straight or diagonal, and wins over the same way. On the far row it becomes a <b>Coordinator</b> 🌟, moving like a queen.</p>` +
        `<p><b>Nobody is knocked out.</b> Land on a rival piece and you win it over: it joins your reserve. On a later turn, instead of moving, tap it and bring it in on your two home rows.</p>` +
        `<p><b>Two ways to win:</b> win over the rival Envoy, or walk your own Envoy onto their <b>Summit</b> 🏔️, the square their Envoy started on.</p>` +
        `<p class="sm">Tap a piece to see its moves. ⚠ marks a piece that could be won over next move. 💡 Hint suggests a move and says why; ↩ takes one back. The same position three times, or 160 moves, shares the round, and either side may offer peace 🤝.</p>` +
        `<p class="sm">Online is people only: open a room and it waits, one seat empty, until another delegate takes it.</p>` +
      `</div>`;
    const act = el("div", "ec-actions");
    act.appendChild(cardBtn("Got it ▸", true, () => closeOverlay(false)));
    c.appendChild(act);
    if (S.mounted) { openOverlay(c); return; }
    const over = el("div", "overlay-card sr-over");
    over.appendChild(c);
    app().appendChild(over);
    S.overlay = over;
    setTimeout(() => over.classList.add("show"), 20);
    act.firstChild.onclick = () => { S.overlay = null; over.classList.remove("show"); setTimeout(() => over.remove(), 240); };
  }

  function confirmLeave() {
    const g = S.g;
    if (!g || g.phase === "over") return leave();
    const c = el("div", "event-card sr-card");
    const player = g.phase === "play" && !waiting(g) && (S.mode === "solo" ? 0 : S.mode === "hotseat" ? g.turn : g.players.findIndex((p) => p.ownerId === myId() && !p.vacant));
    c.innerHTML = `<div class="ec-band">LEAVE THE TABLE</div><div class="ec-icon">🕊️</div>` +
      `<div class="ec-title">Step away from ${esc(g.theatre.name)}?</div>` +
      `<div class="ec-why">${S.mode === "online" ? (iOwnASeat() ? "Your seat opens again and another delegate can take it. Close the room instead and it leaves everyone's list." : "You stop watching this room.") : "This match ends here."}</div>`;
    const act = el("div", "ec-actions");
    act.appendChild(cardBtn("Leave ▸", false, () => { closeOverlay(true); leave(); }));
    if (player !== false && player >= 0) {
      act.appendChild(cardBtn("🏳️ Concede the round", false, () => {
        closeOverlay(true);
        cancelAI();
        endRound(g, 1 - player, "concede");
        if (S.mode === "online") pushState({ summary: true });
        afterChange();
      }));
    }
    if (S.mode === "online" && g.hostId === myId())
      act.appendChild(cardBtn("Close the room ▸", false, () => { closeOverlay(true); leave(false, true); }));
    act.appendChild(cardBtn("Stay", true, () => closeOverlay(false)));
    c.appendChild(act);
    openOverlay(c, { stay: true });
  }

  function leave(toRooms, close) {
    const g = S.g;
    if (S.mode === "online" && g && room()) {
      const r = room();
      if (close) r.drop(g.id);
      else if (iOwnASeat() && g.phase !== "over") {
        g.players.forEach((p) => { if (p.ownerId === myId()) vacate(p); });
        const heir = g.players.find((p) => !p.vacant && p.ownerId && p.ownerId !== myId());
        if (!heir) r.drop(g.id);
        else {
          if (g.hostId === myId()) g.hostId = heir.ownerId;
          g.seq++; g.lastWriter = myId(); g.lastEvent = "A delegate stepped away. The seat is open again.";
          r.put(g, { summary: true }).catch(() => {});
        }
      }
      teardown();
      return renderRooms();
    }
    teardown();
    if (toRooms) return renderRooms();
    show();
  }

  // =======================================================================
  // FEEDBACK
  // =======================================================================
  function toast(msg, kind) {
    const area = $("pl-toasts") || app();
    const t = el("div", "sr-toast " + (kind || ""), esc(msg));
    area.appendChild(t);
    setTimeout(() => t.classList.add("show"), 20);
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 2600);
  }
  function showBubble(seat, text) {
    hideBubble();
    const chip = $("pl-pc" + seat);
    if (!chip) return;
    const b = el("div", "sr-bubble", esc(text));
    b.id = "pl-bubble";
    chip.appendChild(b);
  }
  function hideBubble() { const b = $("pl-bubble"); if (b) b.remove(); }
  function floatReact(seat, emoji) {
    const chip = $("pl-pc" + seat), fx = $("pl-fx");
    if (!chip || !fx) return;
    const r = chip.getBoundingClientRect();
    const e = el("span", "sr-float", emoji);
    e.style.left = (r.left + r.width / 2 + randInt(-18, 18)) + "px";
    e.style.top = (r.bottom - 6) + "px";
    fx.appendChild(e);
    setTimeout(() => e.remove(), 2200);
  }
  function burst(node, color, n) {
    const fx = $("pl-fx");
    if (!fx || !node || !node.getBoundingClientRect) return;
    const r = node.getBoundingClientRect();
    const cols = [color, "#2f9e54", "#ef9f25", "#ffffff"];
    for (let i = 0; i < (n || 20); i++) {
      const p = el("span", "sr-conf");
      p.style.background = cols[i % cols.length];
      p.style.left = (r.left + r.width / 2) + "px";
      p.style.top = (r.top + r.height / 2) + "px";
      fx.appendChild(p);
      const a = Math.random() * Math.PI * 2, d = randInt(40, 140);
      if (p.animate) {
        p.animate([
          { transform: "translate(-50%,-50%) rotate(0deg)", opacity: 1 },
          { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 40}px) rotate(${randInt(-300, 300)}deg)`, opacity: 0 },
        ], { duration: randInt(600, 1100), easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" });
      }
      setTimeout(() => p.remove(), 1200);
    }
  }
  function confettiRain(colors) {
    const fx = $("pl-fx") || document.body;
    const cols = colors.concat(["#2f9e54", "#ef9f25", "#11aecb"]);
    for (let i = 0; i < 60; i++) {
      const p = el("span", "sr-conf");
      p.style.background = cols[i % cols.length];
      p.style.left = randInt(0, window.innerWidth) + "px";
      p.style.top = "-12px";
      fx.appendChild(p);
      if (p.animate) {
        p.animate([
          { transform: "translateY(0) rotate(0deg)", opacity: 1 },
          { transform: `translate(${randInt(-80, 80)}px, ${window.innerHeight + 40}px) rotate(${randInt(-720, 720)}deg)`, opacity: 0.9 },
        ], { duration: randInt(1800, 3400), delay: randInt(0, 900), easing: "cubic-bezier(.3,.1,.6,1)", fill: "forwards" });
      }
      setTimeout(() => p.remove(), 4600);
    }
  }

  // =======================================================================
  // ONLINE
  // =======================================================================
  function pushState(opts) {
    const g = S.g;
    if (S.mode !== "online" || !g || !room()) return Promise.resolve();
    g.seq = (g.seq || 0) + 1;
    g.lastWriter = myId();
    return room().put(g, opts || null).catch(() => {});
  }
  function live(msg) {
    if (S.mode !== "online" || !S.g || !room()) return;
    msg.by = myId();
    room().sendLive(S.g.id, msg);
  }

  function applyRemote(ng) {
    if (S.mode !== "online" || !S.mounted) return;
    if (!ng) { toast("This room has closed", "muted"); setTimeout(() => { teardown(); renderRooms(); }, 1300); return; }
    const g = S.g;
    if (!g || ng.id !== g.id) return;
    if ((ng.seq || 0) <= (g.seq || 0)) return;
    if (S.busy) { S.pending = ng; return; }
    cancelAI();
    const sameRound = ng.round === g.round;
    const oneMove = sameRound && (ng.moves || []).length === g.moves.length + 1;
    if (ng.lastWriter !== myId() && ng.lastEvent && !oneMove) toast(ng.lastEvent, "muted");
    if (!sameRound) { closeOverlay(true); S.sel = null; S.hint = null; }
    if (ng.round === g.round && ng.phase === "play" && g.phase === "reveal") closeOverlay(true);
    if (oneMove) {
      const m = ng.moves[ng.moves.length - 1];
      const info = { seat: m.s, f: m.f, t: m.t, p: m.p, cap: m.cap, promo: m.promo, drop: m.f < 0, win: ng.phase !== "play" && ng.results[ng.round] && ng.results[ng.round].winner === m.s && ["capture", "summit"].indexOf(ng.results[ng.round].how) >= 0 };
      if (info.win) info.how = ng.results[ng.round].how;
      S.sel = null; S.hint = null; S.remoteSel = null;
      S.g = ng;
      animateMove(info, () => afterMove(info));
      return;
    }
    S.g = ng;
    if (g.offer !== ng.offer && ng.offer < 0 && S.overlay && g.offer >= 0) closeOverlay(true);
    afterChange();
  }

  function onLive(m) {
    if (!m || !S.g || S.mode !== "online") return;
    if (m.by) S.net.seen[m.by] = now();
    if (m.by === myId()) return;
    if (m.t === "sel") {
      S.remoteSel = m.i >= 0 ? { seat: m.seat, i: m.i } : null;
      if (!S.busy) paintBoard();
    } else if (m.t === "react") floatReact(m.seat, m.e);
  }

  function netTick() {
    const g = S.g;
    if (!g || S.mode !== "online") return;
    S.net.beat++;
    if (S.net.beat % 2 === 0) live({ t: "hb" });
    const t = now();
    g.players.forEach((p) => { if (p.ownerId && !S.net.seen[p.ownerId]) S.net.seen[p.ownerId] = t; });
    if (g.hostId && !S.net.seen[g.hostId]) S.net.seen[g.hostId] = t;
    const quietFor = (id) => t - (S.net.seen[id] || t);
    if (g.hostId === myId()) {
      let changed = false;
      g.players.forEach((p) => {
        if (!p.vacant && p.ownerId && p.ownerId !== myId() && quietFor(p.ownerId) > 35000) {
          const gone = p.name;
          vacate(p); changed = true;
          toast(`${gone} went quiet. The seat is open again.`, "muted");
        }
      });
      if (changed) { g.lastEvent = "A seat is open again"; S.sel = null; pushState({ summary: true }); afterChange(); return; }
      if (g.phase === "reveal" && t > (g.revealAt || 0) && !S.busy) {
        closeOverlay(true);
        nextRound(g);
        pushState({ summary: true });
        afterChange();
      }
    } else if (iOwnASeat() && quietFor(g.hostId) > 30000) {
      g.hostId = myId();
      g.lastEvent = "A new host keeps the room running";
      pushState({ summary: true });
      afterChange();
    }
  }

  // ---- public API ----------------------------------------------------------
  CG.Parley = {
    title: "Parley",
    show,
    // for tests: the pure rules
    _t: { startBoard, genMoves, applyMove, buildGame, analyse, aiChoose, explain, attacked, posKey, isWinMove, summitOf, S, LEVELS },
  };
})();
