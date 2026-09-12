/* =========================================================================
 * COMMON GROUND, SITUATION REPORT,  sitrep.js
 * The third game: a two-officer Wordle, named after the Situation Report, the
 * daily update every humanitarian response lives by.
 *
 * Headquarters sends a coded cable. It hides one five-letter word from the
 * humanitarian, development or peacebuilding glossary. Two field officers
 * share one board of five columns and ten rows and file reports (guesses)
 * row by row, taking turns: row 1 is the first officer's, row 2 the second's,
 * row 3 the first's again, and so on. Each report comes back coloured:
 *   green  confirmed, right letter in the right place
 *   gold   reported, the letter is in the word but somewhere else
 *   slate  not in the cable
 * Nothing is hidden: you watch your rival type, letter by letter, and every
 * report on the board is yours to use, so each guess helps both officers.
 *
 * The first officer to decode the cable wins it (plus speed points: 10 and
 * one for every row left unused). If the ten rows run out, the cable goes
 * unread. A mission is 1, 3 or 5 cables, each with its own scene and two
 * radio clues that arrive as the rows fill up; both officers play every
 * cable to the end of the mission, and the one who won more cables leads
 * the response (speed points break a tie).
 *
 * Modes: solo against an AI officer (three levels), two people on one
 * device, or online rooms over the shared MQTT broker. Online is people only,
 * never an AI: you open a room, it sits in the list with one seat open, and
 * the cable waits until another officer takes that seat. Whoever opened the
 * room can close it again, from the list or from the board, and a seat whose
 * officer walks away (or goes quiet) simply opens for the next one.
 *
 * Content lives in data/sitrep.js (words, scenes, clues, facts) and
 * data/words5.js (the dictionary). Reuses CG.Audio, CG.Narrate, CG.Net,
 * CG.THEATRES, CG.ROLES, CG.AGENT_NAMES and the shared card styles.
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
  function shuffle(a) {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
    return b;
  }
  const clean = (s) => String(s || "").replace(/[<>]/g, "").trim().slice(0, 22);
  const now = () => Date.now();
  const sfx = (name, a, b) => { if (CG.Audio && CG.Audio.sfx && CG.Audio.sfx[name]) CG.Audio.sfx[name](a, b); };
  const say = (text, opts) => { if (CG.Narrate) CG.Narrate.auto(text, opts); };

  // ---- the rules, in numbers --------------------------------------------
  const COLS = 5, ROWS = 10;
  const CLUE_AT = [0, 4, 7];                 // reports filed before clue 1, 2, 3 show
  const REVEAL_MS = 26000;                   // online: the host moves on after this
  const SEAT_COLORS = ["#2f6bff", "#e8439b"];
  const SEAT_DOTS = ["🔵", "🟣"];
  // Speed points for the officer who decodes a cable: 10, plus one for every
  // row left unused. They only break a tie in cables won.
  const points = (rowNo) => 10 + (ROWS - rowNo);

  const LEVELS = {
    rookie:  { key: "rookie",  label: "Junior Officer",      short: "Junior",  think: [1500, 2700], blurb: "Keen, a little scattered. Forgets a clue now and then." },
    officer: { key: "officer", label: "Field Officer",       short: "Field",   think: [1200, 2300], blurb: "Solid. Reads every report on the board." },
    veteran: { key: "veteran", label: "Veteran Coordinator", short: "Veteran", think: [1000, 1900], blurb: "Twenty postings. Knows the glossary cold." },
  };

  // ---- dictionary --------------------------------------------------------
  let DICT = null, COMMON = null, ANSWERS = null;
  function unpack(s) { const out = []; for (let i = 0; i + 5 <= (s || "").length; i += 5) out.push(s.slice(i, i + 5).toUpperCase()); return out; }
  function dict() {
    if (DICT) return DICT;
    ANSWERS = (CG.SITREP_WORDS || []).map((e) => e.w);
    DICT = new Set(unpack(CG.SITREP_VALID).concat(ANSWERS));
    COMMON = unpack(CG.SITREP_COMMON);
    return DICT;
  }
  const isWord = (w) => dict().has(w);
  const entryOf = (w) => (CG.SITREP_WORDS || []).find((e) => e.w === w) || { w, d: "h", s: "", r: "", x: "", def: "", f: "" };

  // Light obfuscation for words kept in the shared state, so the answer is not
  // sitting in plain text on the public broker (a casual screen, not a lock).
  const KEY = "UNITY";
  function enc(w) {
    let o = "";
    for (let i = 0; i < w.length; i++) o += String.fromCharCode(65 + ((w.charCodeAt(i) - 65 + KEY.charCodeAt(i % 5) - 60 + i * 7) % 26));
    return btoa(o.split("").reverse().join(""));
  }
  function dec(s) {
    let r = "";
    try { r = atob(s).split("").reverse().join(""); } catch (e) { return ""; }
    let o = "";
    for (let i = 0; i < r.length; i++) o += String.fromCharCode(65 + ((r.charCodeAt(i) - 65 - (KEY.charCodeAt(i % 5) - 60) - i * 7) % 26 + 26 * 4) % 26);
    return o;
  }

  // Wordle feedback with correct handling of repeated letters: greens first,
  // then golds from what is left of the secret. "g" green, "y" gold, "x" slate.
  function score(guess, secret) {
    const out = ["x", "x", "x", "x", "x"];
    const left = {};
    for (let i = 0; i < 5; i++) {
      if (guess[i] === secret[i]) out[i] = "g";
      else left[secret[i]] = (left[secret[i]] || 0) + 1;
    }
    for (let i = 0; i < 5; i++) {
      if (out[i] === "g") continue;
      const c = guess[i];
      if (left[c] > 0) { out[i] = "y"; left[c]--; }
    }
    return out.join("");
  }

  // ---- persistence (per browser) ----------------------------------------
  function ls(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || "null");
      localStorage.setItem(key, JSON.stringify(val)); return val;
    } catch (e) { return val === undefined ? null : val; }
  }
  const settings = Object.assign({ music: true, voice: true, contrast: false }, ls("cg_sitrep_settings") || {});
  const saveSettings = () => ls("cg_sitrep_settings", settings);
  function stats() { return Object.assign({ missions: 0, wins: 0, decoded: 0, cables: 0, best: 0 }, ls("cg_sitrep_stats") || {}); }
  function recent() { return ls("cg_sitrep_recent") || []; }

  // ---- live state ----------------------------------------------------------
  const S = {
    g: null,            // the game (same shape offline and online)
    mode: "solo",       // solo | hotseat | online
    typed: "",
    busy: false,        // a row is animating
    overlay: null,      // the open overlay card, if any
    mounted: false,
    aiGen: 0,
    remote: null,       // { seat, n, d, r } typing seen from another browser
    shownBrief: -1, shownReveal: -1, shownFinal: false, clueShown: 0,
    pending: null,      // a remote state that arrived mid-animation
    net: { online: false, id: null, room: null, seen: {}, joinedAt: 0, tick: null, beat: 0 },
    lastSetup: null,
  };
  const myId = () => (CG.Net ? CG.Net.clientId : "local");
  let ROOM = null;
  function room() {
    if (!ROOM && CG.Net && CG.Net.room) ROOM = CG.Net.room("sitrep", summaryOf);
    return ROOM;
  }

  // =======================================================================
  // RULES ENGINE (pure functions on the game object)
  // =======================================================================
  // Whose report is next? The officers simply alternate, row by row, from
  // whoever opens the cable (the opener alternates from cable to cable).
  // An online room with an empty chair is not a game yet: nobody's turn,
  // nobody types, and nothing fills in for the officer who has not arrived.
  const waiting = (g) => !!g && g.players.some((p) => p.vacant);

  function turnSeat(g) {
    if (!g || g.phase !== "play" || g.rows.length >= ROWS) return -1;
    if (waiting(g)) return -1;
    if (!g.rows.length) return g.first;
    return 1 - g.rows[g.rows.length - 1].p;
  }
  // Who will own each row still to come (drawn faintly in the margin).
  function futureOwners(g) {
    const out = [];
    let t = turnSeat(g);
    if (t < 0) return out;
    for (let r = g.rows.length; r < ROWS; r++) { out[r] = t; t = 1 - t; }
    return out;
  }
  const clueLevel = (g) => 1 + (g.rows.length >= CLUE_AT[1] ? 1 : 0) + (g.rows.length >= CLUE_AT[2] ? 1 : 0);
  const secretOf = (g) => dec(g.words[g.dispatch]);
  // Mission standings: cables won first, speed points to break a tie.
  const standing = (p) => (p.wins || 0) * 1000 + (p.score || 0);

  // File one report for a seat. Mutates g and returns what happened. The
  // first officer to decode the cable wins it, and the cable closes.
  function fileReport(g, seat, word) {
    const fb = score(word, secretOf(g));
    const solved = fb === "ggggg";
    g.rows.push({ p: seat, g: word, fb });
    const P = g.players[seat];
    const info = { seat, row: g.rows.length, fb, solved, pts: 0, ended: false };
    if (solved) {
      info.pts = points(g.rows.length);
      P.wins = (P.wins || 0) + 1;
      P.score = (P.score || 0) + info.pts;
      g.lastEvent = `${P.name} decoded the cable in report ${g.rows.length}`;
      endRound(g, seat, info.pts);
      info.ended = true;
    } else {
      g.lastEvent = `${P.name} filed report ${g.rows.length}`;
      if (g.rows.length >= ROWS) { endRound(g, -1, 0); info.ended = true; }
    }
    return info;
  }

  function endRound(g, winner, pts) {
    g.results[g.dispatch] = {
      w: secretOf(g),
      rows: g.rows.length,
      grid: g.rows.map((r) => ({ p: r.p, fb: r.fb })),
      winner, row: winner >= 0 ? g.rows.length : 0, pts: pts || 0,
    };
    g.phase = "reveal";
    g.revealAt = now() + REVEAL_MS;
  }

  function nextDispatch(g) {
    if (g.phase !== "reveal") return;
    if (g.dispatch + 1 >= g.total) { g.phase = "over"; g.over = true; g.lastEvent = "Mission complete"; return; }
    g.dispatch++;
    g.first = g.dispatch % 2;
    g.rows = [];
    g.phase = "play";
    g.lastEvent = `Cable ${g.dispatch + 1} of ${g.total} arrives`;
  }

  // Pick the cables for a match: from the chosen desk, favouring words whose
  // tag fits the posting's crises, avoiding words this browser saw recently.
  function pickWords(desk, theatre, n) {
    const all = (CG.SITREP_WORDS || []).filter((e) => desk === "all" || e.d === desk);
    const seen = new Set(recent());
    let pool = all.filter((e) => !seen.has(e.w));
    if (pool.length < n * 3) pool = all.slice();
    const tags = new Set((theatre && theatre.tags) || []);
    const out = [];
    const bag = pool.slice();
    while (out.length < n && bag.length) {
      const weights = bag.map((e) => (tags.has(e.t) ? 3 : 1));
      let sum = weights.reduce((a, b) => a + b, 0), pick = Math.random() * sum, k = 0;
      for (; k < bag.length - 1; k++) { pick -= weights[k]; if (pick <= 0) break; }
      out.push(bag[k].w);
      bag.splice(k, 1);
    }
    const r = recent().concat(out).slice(-45); ls("cg_sitrep_recent", r);
    return out;
  }

  function newPlayer(name, isAI, ownerId, seat, taken) {
    const roles = CG.ROLES || [{ icon: "🧭", name: "Field Officer" }];
    let role;
    for (let i = 0; i < 20; i++) { role = rand(roles); if ((taken || []).indexOf(role.icon) < 0) break; }
    return {
      name, isAI: !!isAI, ownerId: ownerId || null,
      color: SEAT_COLORS[seat], icon: role.icon, roleIdx: roles.indexOf(role),
      wins: 0, score: 0,
    };
  }
  // Empty a seat: the name and the face go, the score stays with the room, so
  // an officer who takes it over inherits the seat exactly as it stood.
  function vacate(p) {
    p.vacant = true; p.isAI = false; p.ownerId = null;
    p.name = "Open seat"; p.icon = "＋";
    return p;
  }
  // The empty chair in a freshly opened room: listed and coloured, owned by
  // nobody until a player takes it.
  function vacantPlayer(seat, taken) { return vacate(newPlayer("Open seat", false, null, seat, taken)); }

  function aiName(avoid) {
    const names = (CG.AGENT_NAMES && CG.AGENT_NAMES.length) ? CG.AGENT_NAMES : ["Amara", "Diego", "Mei", "Kofi", "Leila"];
    for (let i = 0; i < 30; i++) { const n = rand(names); if (n !== avoid) return n; }
    return "Kofi";
  }

  // Build a fresh match. opts: { mode, desk, total, level, theatre, names[], ai }
  function buildGame(opts) {
    const theatre = opts.theatre || rand(CG.THEATRES || [{ name: "The Field", icon: "🌍", tags: [] }]);
    const words = pickWords(opts.desk, theatre, opts.total);
    const p0 = newPlayer(opts.names[0], false, opts.mode === "online" ? myId() : null, 0);
    // Online rooms open with the second chair empty: no AI stands in for the
    // officer who has not arrived yet.
    const p1 = opts.mode === "online"
      ? vacantPlayer(1, [p0.icon])
      : opts.ai
        ? newPlayer(aiName(opts.names[0]), true, null, 1, [p0.icon])
        : newPlayer(opts.names[1], false, null, 1, [p0.icon]);
    const t0 = randInt(0, (CG.SITREP_TIMES || ["06:00"]).length - 1);
    return {
      kind: "sitrep", v: 1, id: null,
      hostId: myId(), seq: 1, lastWriter: myId(), lastEvent: "",
      mode: opts.mode,
      theatreIdx: (CG.THEATRES || []).indexOf(theatre),
      theatre: { name: theatre.name, icon: theatre.icon },
      desk: opts.desk, level: opts.level || "officer", total: words.length,
      words: words.map(enc),
      times: words.map((_, i) => (CG.SITREP_TIMES || ["06:00"])[(t0 + i * 3) % (CG.SITREP_TIMES || ["06:00"]).length]),
      dispatch: 0, first: 0, rows: [], phase: "play", revealAt: 0,
      results: [], players: [p0, p1], over: false,
    };
  }

  // =======================================================================
  // THE AI OFFICER
  // Reads what any officer at the table can see: every report on the board.
  // It leans on the glossary the way a person does, more and more as the
  // radio and sat-phone clues come in: a junior officer barely at all, a
  // veteran a great deal.
  // =======================================================================
  const GLOSSARY_LEAN = { rookie: [0, 0.1, 0.25], officer: [0.08, 0.35, 0.6], veteran: [0.25, 0.6, 0.85] };
  function aiChoose(g, seat) {
    dict();
    const L = g.level || "officer";
    const rows = g.rows.filter((r) => r.g);
    const lean = (GLOSSARY_LEAN[L] || GLOSSARY_LEAN.officer)[clueLevel(g) - 1];
    const guessed = new Set(rows.map((r) => r.g));
    const deskAnswers = (CG.SITREP_WORDS || []).filter((e) => g.desk === "all" || e.d === g.desk).map((e) => e.w);
    if (!rows.length) {
      if (L === "rookie") return rand(COMMON);
      return rand((CG.SITREP_OPENERS || ["STARE"]).filter(isWord));
    }
    const fits = (w, list) => list.every((r) => score(r.g, w) === r.fb);
    if (L === "rookie") {
      if (Math.random() < 0.25) return rand(COMMON.filter((w) => !guessed.has(w)));
      const some = rows.filter(() => Math.random() < 0.6);
      const inGloss = deskAnswers.filter((w) => !guessed.has(w) && fits(w, rows));
      if (inGloss.length && Math.random() < lean) return rand(inGloss);
      let c = COMMON.filter((w) => !guessed.has(w) && fits(w, some));
      if (!c.length) c = ANSWERS.filter((w) => !guessed.has(w) && fits(w, rows));
      return c.length ? rand(c) : rand(COMMON);
    }
    const pool = Array.from(new Set(COMMON.concat(L === "veteran" ? ANSWERS : deskAnswers)));
    let cands = pool.filter((w) => !guessed.has(w) && fits(w, rows));
    if (!cands.length) cands = Array.from(dict()).filter((w) => !guessed.has(w) && fits(w, rows));
    if (!cands.length) return rand(COMMON);
    const inDesk = cands.filter((w) => deskAnswers.indexOf(w) >= 0);
    if (inDesk.length && Math.random() < lean) return rand(inDesk);
    const plain = cands.filter((w) => deskAnswers.indexOf(w) < 0);
    if (plain.length) cands = plain;
    if (L === "officer") return rand(cands);
    // Veteran: pick the report that splits the remaining candidates into the
    // most distinct colour patterns (the most informative guess).
    if (cands.length <= 2) return rand(cands);
    const sample = shuffle(cands).slice(0, 180);
    let best = sample[0], bestN = -1;
    shuffle(cands).slice(0, 50).forEach((guess) => {
      const seen = new Set();
      sample.forEach((sec) => seen.add(score(guess, sec)));
      if (seen.size > bestN) { bestN = seen.size; best = guess; }
    });
    return best;
  }

  function cancelAI() { S.aiGen++; hideBubble(); }

  // Take the AI's turn: think (with a line of chatter), type letter by letter,
  // then file. Any state change in the meantime cancels it.
  function scheduleAI() {
    const g = S.g, seat = turnSeat(g);
    if (seat < 0 || !controlsAI(seat)) return;
    const gen = ++S.aiGen;
    const L = LEVELS[g.level] || LEVELS.officer;
    const alive = () => gen === S.aiGen && S.g === g && turnSeat(g) === seat && g.players[seat].isAI && !S.busy;
    const deadline = now() + (S.mode === "online" ? 6000 : 1e9);
    const waitForOverlay = () => {
      if (gen !== S.aiGen) return;
      if (S.overlay && now() < deadline) { setTimeout(waitForOverlay, 400); return; }
      begin();
    };
    const begin = () => {
      if (!alive()) return;
      const line = rand(CG.SITREP_AI_LINES || ["Thinking..."]).replace("{theatre}", g.theatre.name);
      showBubble(seat, line);
      if (S.mode === "online") live({ t: "say", seat, text: line });
      setTimeout(() => {
        if (!alive()) return;
        const word = aiChoose(g, seat);
        let typed = "";
        // a junior officer sometimes fumbles a key and takes it back
        const fumble = g.level === "rookie" && Math.random() < 0.3 ? randInt(1, 3) : -1;
        const steps = [];
        for (let i = 0; i < 5; i++) {
          if (i === fumble) { steps.push(rand("QWERTYUIOPASDFGHJKLZXCVBNM".split("")), "BACK"); }
          steps.push(word[i]);
        }
        let k = 0;
        const typeOne = () => {
          if (!alive()) { S.remote = null; paintGrid(); return; }
          if (k >= steps.length) {
            hideBubble();
            setTimeout(() => { if (alive()) { S.remote = null; commit(seat, word); } }, 380);
            return;
          }
          const s = steps[k++];
          typed = s === "BACK" ? typed.slice(0, -1) : typed + s;
          S.remote = { seat, n: typed.length, w: typed, d: g.dispatch, r: g.rows.length };
          sfx("key");
          paintGrid();
          if (S.mode === "online") live({ t: "typing", seat, n: typed.length, w: typed, d: g.dispatch, r: g.rows.length });
          setTimeout(typeOne, randInt(150, 260));
        };
        typeOne();
      }, randInt(L.think[0], L.think[1]));
    };
    setTimeout(waitForOverlay, S.mode === "online" ? 900 : 500);
  }

  // =======================================================================
  // CONTROL: who may act for a seat on this browser
  // =======================================================================
  function isLocalHuman(seat) {
    const p = S.g && S.g.players[seat];
    if (!p || p.isAI) return false;
    return S.mode !== "online" || p.ownerId === myId();
  }
  // AI officers only ever sit at a solo board. Online is people only.
  function controlsAI(seat) {
    if (S.mode === "online") return false;
    const p = S.g && S.g.players[seat];
    return !!p && !!p.isAI;
  }
  function canType() {
    const g = S.g;
    if (!g || !S.mounted || S.busy || S.overlay || g.phase !== "play") return false;
    const seat = turnSeat(g);
    return seat >= 0 && isLocalHuman(seat);
  }
  const iOwnASeat = () => S.g && S.g.players.some((p) => !p.isAI && p.ownerId === myId());

  // Every report is on the open board (older saves may carry an encoded row).
  function lettersOf(row) {
    if (row.g) return row.g;
    return row.gx ? dec(row.gx) : "";
  }


  // =======================================================================
  // SCREENS: title, setup, rooms, join
  // =======================================================================
  function teardown() {
    stopList();
    cancelAI();
    closeOverlay(true);
    S.mounted = false; S.busy = false; S.pending = null; S.remote = null;
    if (S.net.tick) { clearInterval(S.net.tick); S.net.tick = null; }
    if (S.net.online && room()) { room().unwatch(); room().offLive(); }
    S.net.online = false;
    window.removeEventListener("resize", fit);
  }

  function show() {
    teardown();
    if (CG.Narrate) CG.Narrate.stop();
    const root = app(); root.innerHTML = "";
    document.body.classList.toggle("sr-hc", !!settings.contrast);
    const wrap = el("div", "screen title-screen sr-title");
    wrap.appendChild(el("div", "title-glow"));
    const back = el("button", "back-link", "← Games");
    back.onclick = () => { sfx("click"); CG.Platform.show(); };
    wrap.appendChild(back);
    const logo = el("div", "sr-logo-tiles");
    logo.setAttribute("aria-label", "Situation Report");
    [["SITUATION", "gxygxgygx"], ["REPORT", "ygxgyg"]].forEach(([word, cols], line) => {
      const row = el("div", "sr-lt-row");
      word.split("").forEach((c, i) => {
        const t = el("span", "sr-lt", c);
        t.dataset.s = cols[i];
        t.style.animationDelay = (0.1 + (line * 9 + i) * 0.07) + "s";
        row.appendChild(t);
      });
      logo.appendChild(row);
    });
    wrap.appendChild(logo);
    wrap.appendChild(el("p", "subtitle", "Decode the cable"));
    wrap.appendChild(el("p", "tagline",
      "Headquarters sends a coded cable: one five-letter word from the humanitarian, development and peacebuilding glossary. " +
      "You and another field officer take turns filing reports, row by row, on one shared board of ten rows. You see every letter your rival types, and every report is yours to use. The first to decode the cable wins it."));

    const toggles = el("div", "toggle-row");
    toggles.appendChild(toggle("🎵 Music", settings.music, (on) => { settings.music = on; saveSettings(); if (CG.Audio) CG.Audio.setMuted(!on); }));
    toggles.appendChild(toggle("🗣️ Narration", settings.voice, (on) => { settings.voice = on; saveSettings(); if (CG.Narrate) CG.Narrate.setEnabled(on); }));
    toggles.appendChild(toggle("◐ High contrast", settings.contrast, (on) => { settings.contrast = on; saveSettings(); document.body.classList.toggle("sr-hc", on); }));
    wrap.appendChild(toggles);

    const modes = el("div", "sr-modes");
    modes.appendChild(modeCard("🌐", "Play online", "Open a room and wait for another officer to arrive, or take the open seat in someone else's. People only, no AI.", true,
      () => (CG.Net && CG.Net.getName && CG.Net.getName()) ? renderRooms() : renderLogin()));
    modes.appendChild(modeCard("🤖", "Solo vs AI", "Face an AI field officer. Pick how seasoned they are.", false, () => renderSetup("solo")));
    modes.appendChild(modeCard("👥", "Two on this device", "Pass and play with a colleague at the same screen.", false, () => renderSetup("hotseat")));
    wrap.appendChild(modes);

    const how = el("button", "back-link sr-how-link", "How to play ?");
    how.onclick = () => showHowTo();
    wrap.appendChild(how);

    const st = stats();
    if (st.missions) {
      wrap.appendChild(el("p", "sr-record",
        `<b>Service record</b> · ${st.missions} mission${st.missions === 1 ? "" : "s"} · ${st.wins} won · ` +
        `${st.decoded} of ${st.cables} cables decoded${st.best ? ` · best: report ${st.best}` : ""}`));
    }
    wrap.appendChild(el("p", "credit", "Music and narration are generated live in your browser. No downloads, no accounts."));
    root.appendChild(wrap);
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

  // ---- mission setup (solo / two on a device / open a room) -------------
  function renderSetup(mode) {
    teardown();
    const prev = S.lastSetup || {};
    let desk = prev.desk || "all", total = prev.total || 3, level = prev.level || "officer";
    let theatre = rand(CG.THEATRES || [{ name: "The Field", icon: "🌍", blurb: "", tags: [] }]);
    const root = app(); root.innerHTML = "";
    const wrap = el("div", "screen title-screen setup-screen sr-setup");
    wrap.appendChild(el("div", "title-glow"));
    const back = el("button", "back-link", "← Back");
    back.onclick = () => { sfx("click"); mode === "online" ? renderRooms() : show(); };
    wrap.appendChild(back);
    wrap.appendChild(el("div", "logo-mark", "📡"));
    wrap.appendChild(el("h1", "title sr-h", mode === "online" ? "Open a room" : "Brief the mission"));
    wrap.appendChild(el("p", "tagline",
      mode === "online" ? `You take the first seat as <b>${esc(CG.Net.getName())}</b>. The second stays open, and the cable waits, until another officer takes it.`
      : mode === "hotseat" ? "Two officers, one screen. Take turns at the keyboard, row by row."
      : "You against an AI field officer, one shared board, turn by turn."));

    // the desk
    wrap.appendChild(el("p", "pick-label", "Which desk sends the cables"));
    const desks = el("div", "sr-desks");
    const paintDesks = () => desks.querySelectorAll(".sr-desk").forEach((c) => c.classList.toggle("on", c.dataset.k === desk));
    Object.keys(CG.SITREP_DESKS || {}).forEach((k) => {
      const D = CG.SITREP_DESKS[k];
      const n = k === "all" ? (CG.SITREP_WORDS || []).length : (CG.SITREP_WORDS || []).filter((e) => e.d === k).length;
      const c = el("button", "sr-desk", `<span class="srd-ic">${D.icon}</span><span class="srd-t">${D.label}</span><span class="srd-b">${D.blurb}</span><span class="srd-n">${n} cables</span>`);
      c.dataset.k = k;
      c.onclick = () => { desk = k; sfx("click"); paintDesks(); };
      desks.appendChild(c);
    });
    wrap.appendChild(desks); paintDesks();

    // cables in the mission
    wrap.appendChild(el("p", "pick-label", "Cables in the mission"));
    wrap.appendChild(seg([1, 3, 5], total, (v) => { total = v; }, (v) => v === 1 ? "1 · quick" : v + ""));

    // The AI officer, in solo only: an online room never has one.
    if (mode === "solo") {
      wrap.appendChild(el("p", "pick-label", "Your rival"));
      const lvlNote = el("p", "sr-note", LEVELS[level].blurb);
      wrap.appendChild(seg(Object.keys(LEVELS), level, (v) => { level = v; lvlNote.textContent = LEVELS[v].blurb; }, (v) => LEVELS[v].label));
      wrap.appendChild(lvlNote);
    }

    // names
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
      n0 = mkName("First officer", prev.n0 || "", SEAT_COLORS[0]);
      n1 = mkName("Second officer", prev.n1 || "", SEAT_COLORS[1]);
    }
    if (n0) { wrap.appendChild(el("p", "pick-label", mode === "hotseat" ? "The officers" : "You")); wrap.appendChild(names); }

    // the posting
    wrap.appendChild(el("p", "pick-label", "Your posting"));
    const post = el("div", "sr-post");
    const paintPost = () => {
      post.innerHTML = `<span class="srp-ic">${theatre.icon}</span><span class="srp-id"><b>${esc(theatre.name)}</b><small>${esc(theatre.blurb || "")}</small></span>`;
      const rr = el("button", "reroll", "🎲"); rr.title = "A different posting";
      rr.onclick = () => { theatre = rand(CG.THEATRES); sfx("click"); paintPost(); };
      post.appendChild(rr);
    };
    paintPost();
    wrap.appendChild(post);

    const go = el("button", "btn btn-primary big", mode === "online" ? "Open the room ▸" : "Deploy ▸");
    go.style.marginTop = "22px";
    go.onclick = async () => {
      const a = n0 ? clean(n0.value) : "";
      const b = n1 ? clean(n1.value) : "";
      if (mode === "solo" && !a) return nudge(n0);
      if (mode === "hotseat" && (!a || !b)) return nudge(!a ? n0 : n1);
      if (mode === "hotseat" && a.toLowerCase() === b.toLowerCase()) return nudge(n1);
      S.lastSetup = { desk, total, level, n0: a, n1: b };
      if (mode === "solo" && CG.Net && CG.Net.setName) CG.Net.setName(a);
      sfx("pick");
      if (mode === "online") {
        go.disabled = true; go.textContent = "Opening…";
        try {
          const g = buildGame({ mode: "online", desk, total, level, theatre, names: [CG.Net.getName()] });
          await room().create(g);
          enterOnline(g);
        } catch (e) {
          go.disabled = false; go.textContent = "Open the room ▸";
          flash(wrap, "Could not reach the rooms. Try again, or play solo.");
        }
        return;
      }
      startLocal(buildGame({ mode, desk, total, level, theatre, names: [a, b], ai: mode === "solo" }));
    };
    wrap.appendChild(go);
    root.appendChild(wrap);
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

  // ---- online: name, then the list of rooms ------------------------------
  function renderLogin() {
    teardown();
    const root = app(); root.innerHTML = "";
    const wrap = el("div", "screen title-screen sr-setup");
    wrap.appendChild(el("div", "title-glow"));
    const back = el("button", "back-link", "← Back");
    back.onclick = () => show();
    wrap.appendChild(back);
    wrap.appendChild(el("div", "logo-mark", "📡"));
    wrap.appendChild(el("h1", "title sr-h", "Decoding rooms"));
    wrap.appendChild(el("p", "tagline", "Name yourself to see the rooms other officers have open, join one, and take a seat."));
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
      `<div class="lobby-title"><span class="logo-mark sm">📡</span><div><h1 class="title sm">Decoding rooms</h1>` +
      `<p class="subtitle sm">Situation Report games open on other browsers, right now</p></div></div>`;
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
    const home = el("button", "btn btn-ghost", "← Situation Report");
    home.onclick = () => { stopList(); show(); };
    actions.appendChild(create); actions.appendChild(refresh); actions.appendChild(solo); actions.appendChild(home);
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
      if (!rooms.length) { list.innerHTML = `<div class="lobby-empty">No open rooms yet. <b>Open a room</b> and wait: it appears here on every other officer's screen.</div>`; return; }
      list.innerHTML = "";
      rooms.forEach((r) => {
        const seats = r.seats || [];
        const open = seats.filter((s) => s.vacant).length;
        const D = (CG.SITREP_DESKS || {})[r.desk] || { icon: "🌐", label: "All desks" };
        const card = el("div", "theatre-card");
        card.innerHTML =
          `<div class="tc-top"><span class="tc-icon">${r.icon || "📡"}</span>` +
            `<div class="tc-id"><b>${esc(r.theatre || "Situation Report room")}</b>` +
            `<small>${D.icon} ${D.label} · cable ${(r.dispatch || 0) + 1} of ${r.total || 1} · ${ago(r.lastActive)}</small></div></div>` +
          `<div class="tc-seats">${seats.map((s) =>
            `<span class="seat-chip ${s.vacant ? "open" : "human"}" style="--tok:${s.color}"><span class="sc-ic">${s.icon || "◆"}</span>` +
            `<span class="sc-nm">${s.vacant ? "🪑 Open seat" : "🙋 " + esc(s.name) + " · " + (s.score || 0)}</span></span>`).join("")}</div>`;
        const acts = el("div", "tc-actions");
        const join = el("button", "btn btn-primary", open ? "Take the open seat ▸" : "Full · watch ▸");
        join.onclick = () => { stopList(); openJoin(r.id); };
        acts.appendChild(join);
        // Your own room: close it and it leaves every officer's list at once.
        if (r.hostId === myId()) {
          const close = el("button", "btn btn-ghost", "✕ Close room");
          close.onclick = () => closeRoom(r.id, close, list);
          acts.appendChild(close);
        }
        card.appendChild(acts);
        list.appendChild(card);
      });
    } catch (e) {
      if (list.isConnected) list.innerHTML = `<div class="lobby-empty">Could not reach the rooms. <b>Refresh</b> to try again, or play solo.</div>`;
    }
  }
  // Closing a room clears it from the broker, so it disappears from every
  // officer's list. Only the officer who opened it is offered the button.
  async function closeRoom(id, btn, list) {
    if (btn) { btn.disabled = true; btn.textContent = "Closing…"; }
    sfx("click");
    try { await room().drop(id); } catch (e) {}
    if (list && list.isConnected) loadRooms(list, false);
  }

  function ago(t) {
    if (!t) return "just now";
    const s = Math.max(0, Math.round((now() - t) / 1000));
    return s < 60 ? "active just now" : `active ${Math.round(s / 60)} min ago`;
  }

  function summaryOf(g) {
    return {
      kind: "sitrep", theatre: g.theatre && g.theatre.name, icon: g.theatre && g.theatre.icon,
      desk: g.desk, total: g.total, dispatch: g.dispatch, hostId: g.hostId,
      seats: g.players.map((p) => ({ name: p.name, isAI: p.isAI, vacant: !!p.vacant, owned: !!p.ownerId, color: p.color, icon: p.icon, score: p.score || 0 })),
    };
  }

  async function openJoin(id) {
    const root = app(); root.innerHTML = "";
    const wrap = el("div", "screen title-screen setup-screen sr-setup");
    wrap.appendChild(el("div", "title-glow"));
    const back = el("button", "back-link", "← Back");
    back.onclick = () => renderRooms();
    wrap.appendChild(back);
    wrap.appendChild(el("div", "logo-mark", "📡"));
    wrap.appendChild(el("h1", "title sr-h", "Take a seat"));
    const sub = el("p", "tagline", "Loading the room…");
    wrap.appendChild(sub);
    const list = el("div", "seat-list join-list");
    wrap.appendChild(list);
    root.appendChild(wrap);
    let g = null;
    try { g = await room().get(id); } catch (e) { g = null; }
    if (!g) { sub.textContent = "This room has closed."; return; }
    const D = (CG.SITREP_DESKS || {})[g.desk] || { icon: "🌐", label: "All desks" };
    sub.innerHTML = `${esc(g.theatre.icon)} <b>${esc(g.theatre.name)}</b> · ${D.icon} ${D.label} · cable ${g.dispatch + 1} of ${g.total}. Take the open seat, and your name goes on it.`;
    paintSeats(list, g);
  }
  function paintSeats(list, g) {
    list.innerHTML = "";
    let any = false;
    g.players.forEach((p, i) => {
      const mine = !p.vacant && p.ownerId === myId();
      const row = el("div", "seat-row");
      row.style.setProperty("--tok", p.color);
      row.appendChild(el("span", "seat-badge", "" + (i + 1)));
      row.appendChild(el("span", "join-avatar", p.icon || "◆"));
      const info = el("div", "join-info");
      info.innerHTML = `<b>${esc(p.name)}</b><small>${mine ? "🙋 your seat" : p.vacant ? "🪑 waiting for an officer" : "🙋 player"} · ${p.score || 0} pts</small>`;
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
      } else {
        row.appendChild(el("span", "join-locked", "in play"));
      }
      list.appendChild(row);
    });
    const watch = el("button", "btn btn-ghost", "👀 Just watch");
    watch.style.marginTop = "6px";
    watch.onclick = () => enterOnline(g);
    list.appendChild(watch);
    if (!any) list.insertBefore(el("div", "lobby-empty", "Both seats are held by players. You can still watch."), watch);
  }
  async function takeSeat(id, idx, rawName, btn) {
    const nm = clean(rawName) || CG.Net.getName() || "Officer";
    CG.Net.setName(nm);
    if (btn) { btn.disabled = true; btn.textContent = "Taking…"; }
    let g = null;
    try { g = await room().get(id); } catch (e) { g = null; }
    if (!g) return renderRooms();
    const seat = g.players[idx];
    if (!seat || !(seat.vacant || seat.ownerId === myId())) {
      const list = document.querySelector(".join-list");
      if (list) paintSeats(list, g);
      return;
    }
    const other = g.players[1 - idx];
    if (other && other.name.toLowerCase() === nm.toLowerCase()) seat.name = nm + " II"; else seat.name = nm;
    // an empty chair has no face yet: give it one the other officer is not using
    const roles = CG.ROLES || [];
    if (seat.vacant && roles.length) {
      for (let i = 0; i < 24; i++) {
        const r = rand(roles);
        if (!other || r.icon !== other.icon) { seat.icon = r.icon; seat.roleIdx = roles.indexOf(r); break; }
      }
    }
    seat.vacant = false; seat.isAI = false; seat.ownerId = myId();
    g.seq = (g.seq || 0) + 1; g.lastWriter = myId();
    g.lastEvent = `${seat.name} takes the second seat. The cable is live.`;
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
  function startLocal(g) {
    teardown();
    S.g = g; S.mode = g.mode;
    resetRound();
    audioOn();
    mountStage();
    afterChange();
  }
  function enterOnline(g, opts) {
    teardown();
    S.g = g; S.mode = "online";
    S.net.online = true; S.net.id = g.id; S.net.seen = {}; S.net.joinedAt = now(); S.net.beat = 0;
    resetRound();
    audioOn();
    mountStage();
    room().watch(g.id, applyRemote);
    room().onLive(g.id, onLive);
    S.net.tick = setInterval(netTick, 2000);
    live({ t: "hb", by: myId() });
    if (opts && opts.joined) toast(`You take the seat. Welcome to ${g.theatre.name}.`, "good");
    else if (waiting(g)) toast("Room open. Waiting for a second officer to take the seat.", "muted");
    afterChange();
  }
  function resetRound() {
    S.typed = ""; S.remote = null; S.busy = false; S.pending = null;
    S.shownBrief = -1; S.shownReveal = S.g && S.g.phase !== "play" ? S.g.dispatch - (S.g.phase === "reveal" ? 1 : 0) : -1;
    S.shownFinal = false;
    S.clueShown = S.g ? clueLevel(S.g) : 1;
    // arriving mid-cable (a join, or a resume) does not replay the briefing
    if (S.g && (S.g.rows.length || S.g.phase !== "play")) S.shownBrief = S.g.dispatch;
  }

  // =======================================================================
  // THE STAGE
  // =======================================================================
  function mountStage() {
    document.body.classList.toggle("sr-hc", !!settings.contrast);
    const root = app(); root.innerHTML = "";
    const st = el("div", "sr-stage");
    st.innerHTML =
      `<div class="sr-bg"></div>` +
      `<header class="sr-hud">` +
        `<div class="sr-hl"><button class="sr-ic" id="sr-quit" title="Leave">✕</button>` +
        `<div class="sr-brand"><b>Situation Report</b><span class="sr-cable" id="sr-cable"></span></div></div>` +
        `<div class="sr-vs" id="sr-vs"></div>` +
        `<div class="sr-tools">` +
          `<button class="sr-ic${settings.music ? " on" : ""}" id="sr-music" title="Music">🎵</button>` +
          `<button class="sr-ic${settings.voice ? " on" : ""}" id="sr-voice" title="Narration">🗣️</button>` +
          `<button class="sr-ic" id="sr-help" title="How to play">?</button>` +
        `</div>` +
      `</header>` +
      `<main class="sr-main">` +
        `<aside class="sr-log" id="sr-log"></aside>` +
        `<section class="sr-board">` +
          `<button class="sr-ticker" id="sr-ticker"></button>` +
          `<div class="sr-bar"><div class="sr-banner" id="sr-banner"></div><div class="sr-react" id="sr-react"></div></div>` +
          `<div class="sr-gridwrap" id="sr-gridwrap"><div class="sr-grid" id="sr-grid"></div></div>` +
          `<div class="sr-kb" id="sr-kb"></div>` +
        `</section>` +
      `</main>` +
      `<div class="sr-toasts" id="sr-toasts"></div>` +
      `<div class="sr-fx" id="sr-fx"></div>`;
    root.appendChild(st);
    S.mounted = true;
    $("sr-quit").onclick = () => { sfx("click"); confirmLeave(); };
    $("sr-music").onclick = (e) => {
      settings.music = !settings.music; saveSettings(); e.currentTarget.classList.toggle("on", settings.music);
      if (CG.Audio) { CG.Audio.setMuted(!settings.music); if (settings.music) CG.Audio.start(); }
    };
    $("sr-voice").onclick = (e) => {
      settings.voice = !settings.voice; saveSettings(); e.currentTarget.classList.toggle("on", settings.voice);
      if (CG.Narrate) CG.Narrate.setEnabled(settings.voice);
    };
    $("sr-help").onclick = () => showHowTo();
    $("sr-ticker").onclick = () => showLogOverlay();
    buildKeyboard();
    buildReactions();
    buildGrid();
    window.addEventListener("resize", fit);
    fit();
  }

  function buildGrid() {
    const grid = $("sr-grid");
    if (!grid) return;
    grid.innerHTML = "";
    for (let r = 0; r < ROWS; r++) {
      const row = el("div", "sr-row");
      row.dataset.r = r;
      row.appendChild(el("span", "sr-mk"));
      for (let c = 0; c < COLS; c++) row.appendChild(el("div", "sr-tile"));
      row.appendChild(el("span", "sr-rn", "" + (r + 1)));
      grid.appendChild(row);
    }
  }

  // Size the tiles to fit the space between the banner and the keyboard,
  // so all ten rows are always on screen, on a phone or a wide monitor.
  function fit() {
    const wrap = $("sr-gridwrap"), grid = $("sr-grid");
    if (!wrap || !grid) return;
    const W = wrap.clientWidth, H = wrap.clientHeight;
    const gap = H < 520 ? 4 : 6;
    const tw = (W - 6 * gap) / 6.5;
    const th = (H - 9 * gap) / 10;
    const t = Math.max(22, Math.floor(Math.min(tw, th, 62)));
    grid.style.setProperty("--t", t + "px");
    grid.style.setProperty("--gap", gap + "px");
  }

  const KB = ["QWERTYUIOP", "ASDFGHJKL", "+ZXCVBNM-"];
  function buildKeyboard() {
    const kb = $("sr-kb");
    kb.innerHTML = "";
    KB.forEach((line) => {
      const r = el("div", "sr-kr");
      line.split("").forEach((ch) => {
        const k = ch === "+" ? "ENTER" : ch === "-" ? "BACK" : ch;
        const b = el("button", "sr-key" + (k.length > 1 ? " wide" : ""), k === "ENTER" ? "File ⏎" : k === "BACK" ? "⌫" : k);
        b.dataset.k = k;
        b.tabIndex = -1;
        b.addEventListener("mousedown", (e) => e.preventDefault());
        b.onclick = (e) => { e.preventDefault(); press(k); };
        r.appendChild(b);
      });
      kb.appendChild(r);
    });
  }

  const REACTS = ["👏", "😮", "🤔", "😅", "🙌"];
  function buildReactions() {
    const box = $("sr-react");
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
    if (S.mode === "hotseat") { const t = turnSeat(g); return t >= 0 ? t : 0; }
    return g.players.findIndex((p) => !p.isAI && (S.mode !== "online" || p.ownerId === myId()));
  }

  // ---- painting ----------------------------------------------------------
  function paint() {
    if (!S.mounted || !S.g) return;
    paintHud(); paintLog(); paintGrid(); paintKeys(); paintBanner();
  }

  function paintHud() {
    const g = S.g;
    $("sr-cable").textContent = `Cable ${Math.min(g.dispatch + 1, g.total)} of ${g.total}`;
    const vs = $("sr-vs");
    const t = turnSeat(g);
    vs.innerHTML = g.players.map((p, i) => {
      const tag = p.vacant ? "🪑 open" : p.isAI ? `🤖 ${LEVELS[g.level] ? LEVELS[g.level].short : "AI"}` : (S.mode === "online" ? (p.ownerId === myId() ? "🙋 you" : "🙋 player") : (S.mode === "solo" ? "🙋 you" : "🙋"));
      const state = p.vacant ? "no officer yet" : g.phase === "play" ? (i === t ? (p.isAI ? "drafting" : "on report") : "waiting") : `${p.score || 0} pts`;
      return `<div class="sr-pc${i === t ? " turn" : ""}" id="sr-pc${i}" style="--pc:${p.color}" title="Cables decoded">` +
        `<span class="sr-av">${p.icon}</span>` +
        `<span class="sr-pid"><b>${esc(p.name)}</b><small>${tag} · ${state}</small></span>` +
        `<span class="sr-sc"><i>★</i>${p.wins || 0}</span></div>` + (i === 0 ? `<span class="sr-vsx">vs</span>` : "");
    }).join("");
    $("sr-react").style.display = mySeatForReact() >= 0 ? "" : "none";
  }

  function paintBanner() {
    const g = S.g, b = $("sr-banner");
    if (!b) return;
    const t = turnSeat(g);
    b.className = "sr-banner";
    if (g.phase !== "play") {
      const res = g.results[g.phase === "over" ? g.total - 1 : g.dispatch];
      const any = res && res.winner >= 0;
      b.innerHTML = g.phase === "over" ? "Mission complete" : (any ? "Cable decoded" : "The cable went unread");
      b.classList.add(any || g.phase === "over" ? "good" : "bad");
      return;
    }
    if (waiting(g)) {
      b.style.setProperty("--pc", g.players[0].color);
      b.classList.add("live", "wait");
      b.innerHTML = `<span class="sr-bdot"></span><span class="sr-bt">Room open · waiting for a second officer to take the seat</span>`;
      return;
    }
    if (t < 0) { b.innerHTML = ""; return; }
    const p = g.players[t];
    b.style.setProperty("--pc", p.color);
    b.classList.add("live");
    const rowTxt = `report ${g.rows.length + 1} of ${ROWS}`;
    let line;
    if (canType()) line = S.mode === "hotseat" ? `<b>${esc(p.name)}</b>, your ${rowTxt}` : `Your ${rowTxt}`;
    else if (p.isAI) line = `🤖 <b>${esc(p.name)}</b> is drafting ${rowTxt}`;
    else line = `<b>${esc(p.name)}</b> is on ${rowTxt}`;
    b.innerHTML = `<span class="sr-bdot"></span><span class="sr-bt">${line}</span>`;
  }

  function paintGrid() {
    const g = S.g, grid = $("sr-grid");
    if (!grid || !g) return;
    const cur = g.phase === "play" ? g.rows.length : -1;
    const owners = futureOwners(g);
    const t = turnSeat(g);
    for (let r = 0; r < ROWS; r++) {
      const rowEl = grid.children[r];
      if (!rowEl || rowEl.classList.contains("anim")) continue;
      const tiles = rowEl.querySelectorAll(".sr-tile");
      const mk = rowEl.querySelector(".sr-mk");
      rowEl.classList.remove("cur", "sealed", "future", "win");
      const old = rowEl.querySelector(".sr-stamp"); if (old) old.remove();
      if (r < g.rows.length) {
        const row = g.rows[r], P = g.players[row.p];
        const letters = lettersOf(row);
        mk.textContent = P.icon; mk.style.setProperty("--pc", P.color); mk.className = "sr-mk on";
        tiles.forEach((tile, i) => {
          tile.textContent = letters ? letters[i] : "";
          tile.dataset.s = row.fb[i];
          tile.classList.remove("pop", "dot");
          tile.classList.toggle("lock", !letters);
        });
        if (row.fb === "ggggg") { rowEl.classList.add("sealed"); addStamp(rowEl, P); }
      } else if (r === cur && t >= 0) {
        const P = g.players[t];
        rowEl.classList.add("cur");
        rowEl.style.setProperty("--pc", P.color);
        mk.textContent = P.icon; mk.style.setProperty("--pc", P.color); mk.className = "sr-mk on pulse";
        // your own typing, or your rival's, letter by letter as it happens
        let letters = "", dots = 0;
        if (canType()) letters = S.typed;
        else if (S.remote && S.remote.seat === t && S.remote.d === g.dispatch && S.remote.r === g.rows.length) {
          letters = S.remote.w || "";
          dots = S.remote.n;
        }
        rowEl.classList.toggle("rival", !canType() && !!letters);
        tiles.forEach((tile, i) => {
          tile.dataset.s = "";
          tile.classList.remove("lock");
          if (letters[i]) { tile.textContent = letters[i]; tile.classList.add("full"); tile.classList.remove("dot"); }
          else if (i < dots) { tile.textContent = ""; tile.classList.add("full", "dot"); }
          else { tile.textContent = ""; tile.classList.remove("full", "dot", "pop"); }
        });
      } else {
        const o = owners[r];
        mk.textContent = o != null ? g.players[o].icon : "";
        mk.style.setProperty("--pc", o != null ? g.players[o].color : "#9fb0c4");
        mk.className = "sr-mk" + (o != null ? " faint" : "");
        rowEl.classList.add("future");
        tiles.forEach((tile) => { tile.textContent = ""; tile.dataset.s = ""; tile.classList.remove("full", "dot", "pop", "lock"); });
      }
    }
  }
  function addStamp(rowEl, P) {
    const s = el("span", "sr-stamp", `DECODED · ${esc(P.name)}`);
    s.style.setProperty("--pc", P.color);
    rowEl.appendChild(s);
  }

  // The keyboard shows what this viewer can legitimately see.
  function paintKeys() {
    const g = S.g, kb = $("sr-kb");
    if (!kb || !g) return;
    const best = {};
    const rank = { g: 3, y: 2, x: 1 };
    g.rows.forEach((row) => {
      const L = lettersOf(row);
      if (!L) return;
      for (let i = 0; i < 5; i++) { const c = L[i], s = row.fb[i]; if (!best[c] || rank[s] > rank[best[c]]) best[c] = s; }
    });
    kb.querySelectorAll(".sr-key").forEach((k) => { k.dataset.s = best[k.dataset.k] || ""; });
    kb.classList.toggle("off", !canType());
  }

  // The dispatch log: the scene, then the radio and sat-phone clues as they
  // unlock, then the legend and the mission so far.
  function paintLog() {
    const g = S.g, box = $("sr-log");
    if (!box || !g) return;
    box.innerHTML = logHtml(g);
    const tk = $("sr-ticker");
    if (tk) {
      const lvl = g.phase === "play" ? clueLevel(g) : 3;
      const E = entryOf(secretOf(g));
      const txt = lvl >= 3 ? `🛰️ <b>Sat phone</b> ${esc(E.x)}` : lvl === 2 ? `📻 <b>Radio</b> ${esc(E.r)}` : `📜 <b>The situation</b> ${esc(E.s)}`;
      tk.innerHTML = `<span class="sr-tk-t">${txt}</span><span class="sr-tk-more">log ▸</span>`;
    }
  }
  function logHtml(g) {
    const E = entryOf(secretOf(g));
    const D = (CG.SITREP_DESKS || {})[E.d] || { icon: "🌐", label: "Field" };
    const lvl = g.phase === "play" ? clueLevel(g) : 3;
    const time = (g.times && g.times[g.dispatch]) || "06:00";
    const clue = (n, icon, label, text, at) => lvl >= n
      ? `<div class="sr-clue c${n} open"><div class="sr-cl-h">${icon} ${label}</div><div class="sr-cl-b">${esc(text)}</div></div>`
      : `<div class="sr-clue c${n}"><div class="sr-cl-h">🔒 ${label}</div><div class="sr-cl-b muted">Comes over the net after report ${at}.</div></div>`;
    const past = g.results.filter(Boolean).map((r, i) => {
      const who = r.winner >= 0 ? g.players[r.winner] : null;
      return `<li><span class="sr-mini">${r.w}</span>${who ? `<span style="color:${who.color}">★ ${esc(who.name)}, report ${r.row}</span>` : "<span class='muted'>unread</span>"}</li>`;
    }).join("");
    return `<div class="sr-lh"><span class="sr-lh-ic">${g.theatre.icon}</span><div><b>${esc(g.theatre.name)}</b>` +
        `<small>Cable ${Math.min(g.dispatch + 1, g.total)} of ${g.total} · Day ${Math.min(g.dispatch + 1, g.total)} · ${time}</small></div></div>` +
      `<span class="kind-badge sr-desk-badge">${g.phase === "play" && g.desk === "all" ? "🌐 All three desks" : D.icon + " " + D.label}</span>` +
      clue(1, "📜", "The situation", E.s, 0) +
      clue(2, "📻", "Radio traffic", E.r, CLUE_AT[1]) +
      clue(3, "🛰️", "Sat phone", E.x, CLUE_AT[2]) +
      `<div class="sr-legend"><div><span class="sr-lg" data-s="g">A</span>Confirmed: right letter, right place</div>` +
        `<div><span class="sr-lg" data-s="y">B</span>Reported: in the word, another place</div>` +
        `<div><span class="sr-lg" data-s="x">C</span>Not in the cable</div></div>` +
      (past ? `<div class="sr-past"><div class="sr-cl-h">🗂️ Mission so far</div><ul>${past}</ul></div>` : "");
  }

  // =======================================================================
  // INPUT
  // =======================================================================
  function press(k) {
    if (!canType()) return;
    if (k === "ENTER") return fileTyped();
    if (k === "BACK") { if (S.typed.length) { S.typed = S.typed.slice(0, -1); paintGrid(); sendTyping(); } return; }
    if (!/^[A-Z]$/.test(k) || S.typed.length >= COLS) return;
    S.typed += k;
    sfx("key");
    paintGrid();
    const rowEl = $("sr-grid").children[S.g.rows.length];
    if (rowEl) { const t = rowEl.querySelectorAll(".sr-tile")[S.typed.length - 1]; if (t) { t.classList.remove("pop"); void t.offsetWidth; t.classList.add("pop"); } }
    sendTyping();
  }
  function sendTyping() {
    if (S.mode !== "online") return;
    live({ t: "typing", seat: turnSeat(S.g), n: S.typed.length, w: S.typed, d: S.g.dispatch, r: S.g.rows.length });
  }
  function fileTyped() {
    const w = S.typed;
    if (w.length < COLS) return reject("Five letters, officer");
    if (!isWord(w)) return reject("Not in the field glossary");
    commit(turnSeat(S.g), w);
  }
  function reject(msg) {
    sfx("reject");
    toast(msg, "bad");
    const rowEl = $("sr-grid").children[S.g.rows.length];
    if (rowEl) { rowEl.classList.remove("shake"); void rowEl.offsetWidth; rowEl.classList.add("shake"); }
  }

  document.addEventListener("keydown", (e) => {
    if (!S.mounted) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
    if (S.overlay) {
      if (e.key === "Enter" || e.key === "Escape") {
        const b = S.overlay.querySelector(".btn-primary");
        if (b) { e.preventDefault(); b.click(); }
      }
      return;
    }
    let k = null;
    if (e.key === "Enter") k = "ENTER";
    else if (e.key === "Backspace") k = "BACK";
    else if (/^[a-zA-Z]$/.test(e.key)) k = e.key.toUpperCase();
    if (!k) return;
    e.preventDefault();
    const btn = document.querySelector(`.sr-key[data-k="${k}"]`);
    if (btn && canType()) { btn.classList.add("hit"); setTimeout(() => btn.classList.remove("hit"), 120); }
    press(k);
  });

  // =======================================================================
  // THE TURN LOOP
  // =======================================================================
  // File a report for a seat on this browser (a local human, or an AI we
  // drive): apply it, tell the table, then play the reveal.
  function commit(seat, word) {
    const g = S.g;
    if (!g || turnSeat(g) !== seat) return;
    cancelAI();
    S.typed = "";
    S.remote = null;
    const info = fileReport(g, seat, word);
    if (S.mode === "online") pushState(info.solved ? { summary: true } : null);
    revealRows(g.rows.length - 1, () => afterRow(info));
  }

  // Animate rows [from .. end] one after the other, then run done().
  function revealRows(from, done) {
    const g = S.g;
    if (from >= g.rows.length) { done && done(); return; }
    animateRow(from, () => revealRows(from + 1, done));
  }

  function animateRow(r, done) {
    const g = S.g, grid = $("sr-grid");
    const rowEl = grid && grid.children[r];
    if (!rowEl) { done && done(); return; }
    S.busy = true;
    paintGrid();
    const row = g.rows[r], P = g.players[row.p];
    const letters = lettersOf(row);
    const tiles = rowEl.querySelectorAll(".sr-tile");
    rowEl.classList.add("anim");
    rowEl.classList.remove("cur", "future", "sealed", "win");
    const stamp = rowEl.querySelector(".sr-stamp"); if (stamp) stamp.remove();
    const mk = rowEl.querySelector(".sr-mk");
    mk.textContent = P.icon; mk.style.setProperty("--pc", P.color); mk.className = "sr-mk on";
    tiles.forEach((t, i) => { t.textContent = letters ? letters[i] : ""; t.dataset.s = ""; t.classList.add("full"); t.classList.remove("dot", "pop", "lock"); });
    rowEl.classList.remove("rival");
    const STEP = 230, FLIP = 480;
    tiles.forEach((t, i) => {
      setTimeout(() => { t.classList.remove("flip"); void t.offsetWidth; t.classList.add("flip"); }, i * STEP);
      setTimeout(() => {
        t.dataset.s = row.fb[i];
        t.classList.remove("full");
        sfx("tile", row.fb[i], i);
      }, i * STEP + FLIP / 2);
    });
    setTimeout(() => {
      tiles.forEach((t) => t.classList.remove("flip"));
      if (row.fb === "ggggg") {
        rowEl.classList.add("sealed", "win");
        addStamp(rowEl, P);
        burst(rowEl, P.color);
      }
      rowEl.classList.remove("anim");
      S.busy = false;
      paintKeys();
      done && done();
    }, 4 * STEP + FLIP + 120);
  }

  // After a report lands: celebrate, react, unlock clues, then carry on.
  function afterRow(info) {
    const g = S.g;
    const P = g.players[info.seat];
    if (info.solved) {
      celebrate(info);
      const other = 1 - info.seat;
      if (g.players[other].isAI && controlsAI(other)) setTimeout(() => floatReact(other, rand(["👏", "😮", "🫡"])), 900);
      if (P.isAI && controlsAI(info.seat)) setTimeout(() => floatReact(info.seat, "🙌"), 600);
    } else {
      const greens = info.fb.split("").filter((c) => c === "g").length;
      const other = 1 - info.seat;
      if (greens >= 3 && g.players[other].isAI && controlsAI(other) && Math.random() < 0.6) {
        setTimeout(() => floatReact(other, rand(["😮", "🤔", "😬"])), 500);
      }
    }
    if (flushPending()) return;
    afterChange();
  }
  // A remote state that arrived mid-animation: apply it now if it is still new.
  function flushPending() {
    const p = S.pending;
    S.pending = null;
    if (p && S.g && (p.seq || 0) > (S.g.seq || 0)) { applyRemote(p); return true; }
    return false;
  }

  function checkClues() {
    const g = S.g;
    if (g.phase !== "play") return;
    const lvl = clueLevel(g);
    if (lvl > S.clueShown) {
      S.clueShown = lvl;
      const E = entryOf(secretOf(g));
      const text = lvl === 3 ? E.x : E.r;
      sfx("radio");
      toast(lvl === 3 ? "🛰️ Sat phone: a new clue" : "📻 Radio traffic: a new clue", "clue");
      say(text);
      const tk = $("sr-ticker");
      if (tk) { tk.classList.remove("ping"); void tk.offsetWidth; tk.classList.add("ping"); }
      setTimeout(() => {
        const c = document.querySelector(`.sr-log .sr-clue.c${lvl}`);
        if (c) { c.classList.remove("ping"); void c.offsetWidth; c.classList.add("ping"); }
      }, 30);
    }
  }

  // Look at the state and do whatever comes next on this browser.
  function afterChange() {
    const g = S.g;
    if (!g || !S.mounted) return;
    if (CG.Audio && CG.Audio.setProgress) CG.Audio.setProgress(1 + Math.min(99, g.rows.length * 11));
    paint();
    if (g.phase === "play") {
      if (waiting(g)) return;        // one chair still empty: no briefing, no turn
      checkClues();
      if (S.shownBrief !== g.dispatch) { S.shownBrief = g.dispatch; showBriefing(); }
      const t = turnSeat(g);
      if (t >= 0 && controlsAI(t)) scheduleAI();
    } else if (g.phase === "reveal") {
      if (S.shownReveal !== g.dispatch) { S.shownReveal = g.dispatch; setTimeout(() => { if (S.g === g && g.phase === "reveal") showReveal(g.dispatch); }, 650); }
    } else if (g.phase === "over") {
      if (S.shownReveal !== g.total - 1 && g.results[g.total - 1]) {
        S.shownReveal = g.total - 1;
        setTimeout(() => showReveal(g.total - 1, true), 650);
      } else if (!S.shownFinal) { S.shownFinal = true; setTimeout(showFinal, 400); }
    }
  }

  function advance() {
    const g = S.g;
    if (!g || g.phase !== "reveal") return;
    nextDispatch(g);
    S.typed = ""; S.remote = null; S.clueShown = 1;
    if (S.mode === "online") pushState({ summary: true });
    buildGrid(); fit();
    afterChange();
  }

  // =======================================================================
  // OVERLAYS: briefing, reveal, debrief, how to play, log
  // =======================================================================
  function openOverlay(card, opts) {
    closeOverlay(true);
    const over = el("div", "overlay-card sr-over" + ((opts && opts.cls) || ""));
    over.appendChild(card);
    // Tapping the dim backdrop runs the card's main action, except on cards
    // where that would be a big step (leaving, the debrief): those stay put.
    over.addEventListener("click", (e) => {
      if (e.target !== over) return;
      e.stopPropagation();
      if (opts && opts.stay) return;
      const b = card.querySelector(".btn-primary");
      if (b) b.click();
    });
    app().appendChild(over);
    S.overlay = over;
    requestAnimationFrame(() => over.classList.add("show"));
    setTimeout(() => over.classList.add("show"), 30);
    return over;
  }
  function closeOverlay(instant, then) {
    const o = S.overlay;
    if (!o) { if (then) then(); return; }
    S.overlay = null;
    if (instant) o.remove();
    else { o.classList.remove("show"); setTimeout(() => o.remove(), 240); }
    if (S.mounted && S.g) { paintBanner(); paintKeys(); paintGrid(); }
    if (then) then();
  }
  function cardBtn(label, primary, fn) {
    const b = el("button", "btn " + (primary ? "btn-primary" : "btn-ghost"), label);
    b.onclick = () => { sfx("click"); fn(); };
    return b;
  }
  function whoLine(p) {
    return `<span class="sr-who" style="--pc:${p.color}"><span class="sr-av sm">${p.icon}</span>${esc(p.name)}</span>`;
  }

  function showBriefing() {
    const g = S.g;
    const E = entryOf(secretOf(g));
    const time = (g.times && g.times[g.dispatch]) || "06:00";
    const first = g.players[g.first];
    const T = (CG.THEATRES || [])[g.theatreIdx];
    const c = el("div", "event-card sr-card brief");
    c.innerHTML =
      `<div class="ec-band">CABLE ${g.dispatch + 1} OF ${g.total} · DAY ${g.dispatch + 1} · ${time}</div>` +
      `<div class="sr-cable-ic"><span>${g.theatre.icon}</span><span class="sr-wave"></span></div>` +
      `<div class="ec-title">${g.dispatch === 0 ? esc(g.theatre.name) : "An incoming cable"}</div>` +
      (g.dispatch === 0 && T && T.blurb ? `<div class="sr-posting">${esc(T.blurb)}</div>` : "") +
      `<div class="ec-fact big"><span>The situation</span>${esc(E.s)}</div>` +
      `<div class="sr-brief-q">Headquarters has sent one word, five letters. <b>Decode it.</b></div>` +
      `<div class="sr-first">First report: ${whoLine(first)}</div>`;
    const act = el("div", "ec-actions");
    act.appendChild(cardBtn("Start decoding ▸", true, () => { CG.Narrate && CG.Narrate.stop(); closeOverlay(false); }));
    c.appendChild(act);
    openOverlay(c);
    sfx("radio");
    say(E.s);
  }

  function tilesHtml(word, cls) {
    return `<div class="sr-word ${cls || ""}">${word.split("").map((ch, i) => `<span class="sr-wt" style="animation-delay:${0.1 + i * 0.12}s">${ch}</span>`).join("")}</div>`;
  }

  function showReveal(d, last) {
    const g = S.g;
    const res = g.results[d];
    if (!res) return;
    const E = entryOf(res.w);
    const D = (CG.SITREP_DESKS || {})[E.d] || { icon: "🌐", label: "Field" };
    const any = res.winner >= 0;
    const c = el("div", "event-card sr-card reveal " + (any ? "ok" : "miss"));
    const W = any ? g.players[res.winner] : null;
    c.innerHTML =
      `<div class="ec-band">${any ? "CABLE DECODED" : "THE CABLE WENT UNREAD"} · ${d + 1} OF ${g.total}</div>` +
      tilesHtml(res.w, any ? "" : "miss") +
      (W ? `<div class="sr-winner" style="--pc:${W.color}"><span class="sr-medal">🥇</span>${whoLine(W)} decoded it first, in report ${res.row} <b>+${res.pts} pts</b></div>`
         : `<div class="sr-winner none">Ten reports and no decode. Nobody takes this cable.</div>`) +
      `<div class="sr-rv-desk"><span class="kind-badge">${D.icon} ${D.label}</span></div>` +
      `<div class="ec-why">${esc(E.def)}</div>` +
      `<div class="ec-fact"><span>From the field</span>${esc(E.f)}</div>` +
      `<div class="sr-res">${g.players.map((p) =>
        `<div class="sr-res-row" style="--pc:${p.color}">${whoLine(p)}` +
          `<span class="sr-res-t">${p.score || 0} pts</span><span class="sr-res-s">★ ${p.wins || 0}</span></div>`).join("")}</div>`;
    const act = el("div", "ec-actions");
    const isLast = last || d + 1 >= g.total;
    const canAdvance = S.mode !== "online" || iOwnASeat();
    if (canAdvance) {
      act.appendChild(cardBtn(isLast ? "Final debrief ▸" : "Next cable ▸", true, () => {
        CG.Narrate && CG.Narrate.stop();
        closeOverlay(false, () => {
          if (isLast) { if (S.g.phase === "reveal") { nextDispatch(S.g); if (S.mode === "online") pushState({ summary: true }); } S.shownFinal = true; showFinal(); }
          else advance();
        });
      }));
    } else {
      act.appendChild(cardBtn("Close", true, () => closeOverlay(false)));
    }
    c.appendChild(act);
    if (S.mode === "online" && !isLast) {
      const cd = el("div", "sr-countdown");
      c.appendChild(cd);
      const tickCd = () => {
        if (!cd.isConnected) return;
        const left = Math.max(0, (((S.g && S.g.revealAt) || 0) - now()) / 1000);
        cd.textContent = S.g && S.g.phase === "reveal" ? `Next cable in ${Math.ceil(left)}s` : "";
        setTimeout(tickCd, 500);
      };
      tickCd();
    }
    openOverlay(c);
    if (any) sfx("note"); else sfx("wah");
    say(`The word was ${res.w}. ${E.def}`);
  }

  function showFinal() {
    const g = S.g;
    if (!g) return;
    recordStats(g);
    const order = [0, 1].sort((a, b) => standing(g.players[b]) - standing(g.players[a]));
    const tie = standing(g.players[0]) === standing(g.players[1]);
    const decoded = g.results.filter((r) => r && r.winner >= 0).length;
    const ep = CG.SITREP_EPILOGUES || {};
    const epi = rand((decoded === g.total ? ep.sweep : decoded >= g.total / 2 ? ep.good : ep.rough) || [""]);
    const top = g.players[order[0]];
    const titles = CG.SITREP_TITLES || ["Chief Decoder", "Field Officer"];
    const c = el("div", "event-card sr-card final");
    c.innerHTML =
      `<div class="ec-band">MISSION DEBRIEF · ${esc(g.theatre.name.toUpperCase())}</div>` +
      `<div class="ec-icon">${tie ? "🤝" : "🏅"}</div>` +
      `<div class="ec-title">${tie ? "Shared common ground" : `${esc(top.name)} leads the response`}</div>` +
      `<div class="sr-podium">${order.map((i, k) => {
        const p = g.players[i];
        return `<div class="sr-pod ${k === 0 && !tie ? "first" : ""}" style="--pc:${p.color}"><span class="sr-av lg">${p.icon}</span>` +
          `<b>${esc(p.name)}</b><span class="sr-pod-s">★ ${p.wins || 0}</span><span class="sr-pod-p">${p.score || 0} speed pts</span>` +
          `<small>${tie ? titles[1] : titles[Math.min(k * 2, titles.length - 1)]}</small></div>`;
      }).join("")}</div>` +
      `<div class="sr-sum">${g.results.map((r, i) => {
        const who = r.winner >= 0 ? g.players[r.winner] : null;
        return `<div class="sr-sum-row"><span class="sr-mini">${r.w}</span>` +
          `<span>${who ? `<b style="color:${who.color}">${esc(who.name)}</b>, report ${r.row}` : "unread"}</span>` +
          `<span class="sr-sum-g" title="Each report, by officer; green where the cable was decoded">${r.grid.map((x) => x.fb === "ggggg" ? "🟩" : SEAT_DOTS[x.p]).join("")}</span></div>`;
      }).join("")}</div>` +
      `<div class="ec-fact big"><span>Headquarters</span>${esc(epi)}</div>`;
    const act = el("div", "ec-actions");
    act.appendChild(cardBtn("📋 Share", false, () => share(g)));
    if (S.mode === "online") act.appendChild(cardBtn("Back to the rooms ▸", true, () => leave(true)));
    else act.appendChild(cardBtn("Another mission ▸", true, () => { closeOverlay(true); renderSetup(S.mode); }));
    act.appendChild(cardBtn("Games", false, () => { teardown(); CG.Platform.show(); }));
    c.appendChild(act);
    openOverlay(c, { cls: " final", stay: true });
    sfx("win"); setTimeout(() => sfx("clap"), 500);
    say(tie ? "A shared common ground. The scores are level." : `${top.name} leads the response. ${epi}`);
    confettiRain(order.map((i) => g.players[i].color));
  }

  function recordStats(g) {
    const mine = g.players.map((p, i) => i).filter((i) => isLocalHuman(i));
    if (!mine.length) return;
    const st = stats();
    st.missions++;
    const i = mine[0], p = g.players[i], o = g.players[1 - i];
    if (S.mode !== "hotseat" && standing(p) > standing(o)) st.wins++;
    g.results.forEach((r) => {
      st.cables++;
      if (r.winner === i) { st.decoded++; if (!st.best || r.row < st.best) st.best = r.row; }
    });
    ls("cg_sitrep_stats", st);
  }

  function share(g) {
    const lines = [`Situation Report · ${g.theatre.icon} ${g.theatre.name}`];
    g.results.forEach((r, i) => {
      lines.push("", `Cable ${i + 1}: ${r.winner >= 0 ? `${g.players[r.winner].name} decoded it in report ${r.row}` : "unread"}`);
      r.grid.forEach((x) => lines.push(SEAT_DOTS[x.p] + " " + x.fb.split("").map((c) => (c === "g" ? "🟩" : c === "y" ? "🟨" : "⬜")).join("")));
    });
    lines.push("", g.players.map((p, i) => `${SEAT_DOTS[i]} ${p.name} ★${p.wins || 0}`).join("   "), "Common Ground · shamoug.github.io/comgro");
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

  function showHowTo() {
    const ex = (w, fb) => `<div class="sr-ex">${w.split("").map((ch, i) => `<span class="sr-lg" data-s="${fb[i]}">${ch}</span>`).join("")}</div>`;
    const c = el("div", "event-card sr-card how");
    c.innerHTML =
      `<div class="ec-band">HOW TO PLAY</div>` +
      `<div class="ec-title">Decode the cable</div>` +
      `<div class="sr-how">` +
        `<p>Headquarters hides <b>one five-letter word</b> from the humanitarian, development and peacebuilding glossary. Two officers share <b>one board of ten rows</b> and take turns: row 1 is the first officer's, row 2 the second's, row 3 the first's again.</p>` +
        `<p>Type a real word and press <b>File</b>. The tiles turn:</p>` +
        ex("TRUCE", "gxyxx") +
        `<p class="sm"><b>T</b> is confirmed, right place. <b>U</b> is in the word, somewhere else. The rest are not in the cable.</p>` +
        `<p><b>Nothing is hidden.</b> You watch your rival type, letter by letter, and every report on the board is yours to use, so each guess helps you both. Read the scene: it hints at the word, and <b>radio</b> and <b>sat phone</b> clues come over the net after reports 4 and 7.</p>` +
        `<p><b>The first officer to decode the cable wins it</b> ★, with speed points (10, plus one per unused row). A mission is 1, 3 or 5 cables; whoever wins more cables leads the response, and speed points break a tie.</p>` +
        `<p class="sm">Online is people only: open a room and it waits, one seat empty, until another officer takes it. Whoever opened the room can close it again.</p>` +
      `</div>`;
    const act = el("div", "ec-actions");
    act.appendChild(cardBtn("Got it ▸", true, () => closeOverlay(false)));
    c.appendChild(act);
    if (S.mounted) openOverlay(c);
    else {
      const over = el("div", "overlay-card sr-over");
      over.appendChild(c);
      app().appendChild(over);
      S.overlay = over;
      setTimeout(() => over.classList.add("show"), 20);
      act.firstChild.onclick = () => { S.overlay = null; over.classList.remove("show"); setTimeout(() => over.remove(), 240); };
    }
  }

  function showLogOverlay() {
    if (!S.g) return;
    const c = el("div", "event-card sr-card logcard");
    c.innerHTML = `<div class="sr-log inline">${logHtml(S.g)}</div>`;
    const act = el("div", "ec-actions");
    act.appendChild(cardBtn("Back to the board ▸", true, () => closeOverlay(false)));
    c.appendChild(act);
    openOverlay(c);
  }

  function confirmLeave() {
    const g = S.g;
    if (!g || g.phase === "over") return leave();
    const c = el("div", "event-card sr-card");
    c.innerHTML = `<div class="ec-band">LEAVE THE MISSION</div><div class="ec-icon">📡</div>` +
      `<div class="ec-title">Step away from ${esc(g.theatre.name)}?</div>` +
      `<div class="ec-why">${S.mode === "online" ? (iOwnASeat() ? "Your seat opens again and another officer can take it. Close the room instead and it leaves everyone's list." : "You stop watching this room.") : "This mission ends here."}</div>`;
    const act = el("div", "ec-actions");
    act.appendChild(cardBtn("Leave ▸", false, () => { closeOverlay(true); leave(); }));
    if (S.mode === "online" && g.hostId === myId())
      act.appendChild(cardBtn("Close the room ▸", false, () => { closeOverlay(true); leave(false, true); }));
    act.appendChild(cardBtn("Stay", true, () => closeOverlay(false)));
    c.appendChild(act);
    openOverlay(c, { stay: true });
  }

  // close: shut the room down for everyone. Otherwise your own seat simply
  // opens again, and the room closes by itself once nobody is left in it.
  function leave(toRooms, close) {
    const g = S.g;
    if (S.mode === "online" && g && room()) {
      const r = room();
      if (close) {
        r.drop(g.id);
      } else if (iOwnASeat() && g.phase !== "over") {
        g.players.forEach((p) => { if (p.ownerId === myId()) vacate(p); });
        const heir = g.players.find((p) => !p.vacant && p.ownerId && p.ownerId !== myId());
        if (!heir) { r.drop(g.id); }
        else {
          if (g.hostId === myId()) g.hostId = heir.ownerId;
          g.seq++; g.lastWriter = myId(); g.lastEvent = "An officer stepped away. The seat is open again.";
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
  // FEEDBACK: toasts, bubbles, reactions, confetti
  // =======================================================================
  function toast(msg, kind) {
    const area = $("sr-toasts") || app();
    const t = el("div", "sr-toast " + (kind || ""), esc(msg));
    area.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => t.classList.add("show"), 20);
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 2600);
  }
  function showBubble(seat, text) {
    hideBubble();
    const chip = $("sr-pc" + seat);
    if (!chip) return;
    const b = el("div", "sr-bubble", esc(text));
    b.id = "sr-bubble";
    chip.appendChild(b);
  }
  function hideBubble() { const b = $("sr-bubble"); if (b) b.remove(); }
  function floatReact(seat, emoji) {
    const chip = $("sr-pc" + seat), fx = $("sr-fx");
    if (!chip || !fx) return;
    const r = chip.getBoundingClientRect();
    const e = el("span", "sr-float", emoji);
    e.style.left = (r.left + r.width / 2 + randInt(-18, 18)) + "px";
    e.style.top = (r.bottom - 6) + "px";
    fx.appendChild(e);
    setTimeout(() => e.remove(), 2200);
  }
  function burst(node, color) {
    const fx = $("sr-fx");
    if (!fx || !node || !node.getBoundingClientRect) return;
    const r = node.getBoundingClientRect();
    const cols = [color, "#2f9e54", "#ef9f25", "#ffffff"];
    for (let i = 0; i < 26; i++) {
      const p = el("span", "sr-conf");
      p.style.background = cols[i % cols.length];
      p.style.left = (r.left + r.width / 2) + "px";
      p.style.top = (r.top + r.height / 2) + "px";
      fx.appendChild(p);
      const a = Math.random() * Math.PI * 2, d = randInt(60, 170);
      if (p.animate) {
        p.animate([
          { transform: "translate(-50%,-50%) rotate(0deg)", opacity: 1 },
          { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 60}px) rotate(${randInt(-300, 300)}deg)`, opacity: 0 },
        ], { duration: randInt(700, 1200), easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" });
      }
      setTimeout(() => p.remove(), 1300);
    }
  }
  function confettiRain(colors) {
    const fx = $("sr-fx") || document.body;
    const cols = colors.concat(["#2f9e54", "#ef9f25", "#11aecb"]);
    for (let i = 0; i < 70; i++) {
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
  // ONLINE: shared state, live channel, host duties
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

  // A newer state arrived from the table. Apply it and show what changed:
  // new rows flip in, a new cable brings its briefing, a finished one its card.
  function applyRemote(ng) {
    if (S.mode !== "online" || !S.mounted) return;
    if (!ng) { toast("This room has closed", "muted"); setTimeout(() => { teardown(); renderRooms(); }, 1300); return; }
    const g = S.g;
    if (!g || ng.id !== g.id) return;
    if ((ng.seq || 0) <= (g.seq || 0)) return;
    if (S.busy) { S.pending = ng; return; }
    cancelAI();
    const sameCable = ng.dispatch === g.dispatch;
    const oldRows = sameCable ? g.rows.length : 0;
    const missed = !sameCable && g.phase === "play" && ng.results[g.dispatch];
    S.g = ng;
    if (ng.lastWriter !== myId() && ng.lastEvent && !(sameCable && ng.rows.length > oldRows)) toast(ng.lastEvent, "muted");
    if (!sameCable) {
      closeOverlay(true);
      S.typed = ""; S.remote = null; S.clueShown = 1;
      buildGrid(); fit();
      if (missed) S.shownReveal = g.dispatch;   // skipped past it; shown in the log instead
      afterChange();
      return;
    }
    if (ng.rows.length > oldRows) {
      S.remote = null;
      if (S.typed && !canType()) S.typed = "";
      paint();
      const infos = ng.rows.slice(oldRows).map((row, k) => {
        const P = ng.players[row.p];
        const res = ng.results[ng.dispatch];
        const solved = row.fb === "ggggg";
        return { seat: row.p, row: oldRows + k + 1, fb: row.fb, solved, pts: solved && res ? res.pts : 0, ended: ng.phase !== "play" };
      });
      revealRows(oldRows, () => {
        infos.forEach((info, i) => { if (info.solved) setTimeout(() => afterRowFx(info), i * 50); });
        if (flushPending()) return;
        afterChange();
      });
      return;
    }
    afterChange();
  }
  // The moment a cable is cracked, on whichever browser is watching.
  function celebrate(info) {
    const P = S.g.players[info.seat];
    sfx("clap");
    toast(`🎉 ${P.name} decoded the cable in report ${info.row}! ★ +${info.pts} pts`, "good");
    say(`${P.name} decoded the cable.`);
  }
  function afterRowFx(info) { celebrate(info); }

  function onLive(m) {
    if (!m || !S.g || S.mode !== "online") return;
    if (m.by) S.net.seen[m.by] = now();
    if (m.by === myId()) return;
    if (m.t === "typing") {
      S.remote = { seat: m.seat, n: m.n, w: String(m.w || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5), d: m.d, r: m.r };
      if (!S.busy) paintGrid();
    } else if (m.t === "say") {
      showBubble(m.seat, m.text || "");
      setTimeout(hideBubble, 5200);
    } else if (m.t === "react") {
      floatReact(m.seat, m.e);
    }
  }

  // Every two seconds: a heartbeat, and the host's chores. A seat whose browser
  // has gone silent opens again for the next officer; if the host goes silent, a
  // remaining player takes over as host; a finished cable moves on by itself.
  function netTick() {
    const g = S.g;
    if (!g || S.mode !== "online") return;
    S.net.beat++;
    if (S.net.beat % 2 === 0) live({ t: "hb" });
    const t = now();
    // anyone new at the table gets a full grace period before we judge them
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
      if (changed) { g.lastEvent = "A seat is open again"; pushState({ summary: true }); afterChange(); return; }
      if (g.phase === "reveal" && t > (g.revealAt || 0) && !S.busy) {
        const last = g.dispatch + 1 >= g.total;
        closeOverlay(true);
        if (last) { nextDispatch(g); pushState({ summary: true }); afterChange(); }
        else advance();
      }
    } else if (iOwnASeat() && quietFor(g.hostId) > 30000) {
      g.hostId = myId();
      g.lastEvent = "A new host keeps the room running";
      pushState({ summary: true });
      afterChange();
    }
  }

  // ---- public API ----------------------------------------------------------
  CG.SitRep = {
    title: "Situation Report",
    show,
    // for tests: the pure rules
    _t: { score, enc, dec, turnSeat, fileReport, nextDispatch, buildGame, aiChoose, isWord, points, S },
  };
})();
