/* =========================================================================
 * COMMON GROUND, net.js
 * The multiplayer backbone. GitHub Pages serves only static files, so the
 * shared state that lets browsers see and join each other's games travels over
 * a free, no-account public MQTT broker (EMQX) via secure WebSockets.
 *
 *   MQTT is a pub/sub message bus built for constant, high-frequency traffic,
 *   so unlike the small JSON stores it does not throttle our writes. We use
 *   RETAINED messages: the broker keeps the last message on a topic, so a
 *   browser that joins later instantly receives the current state.
 *
 *     commonground/v1/lobby/<id>  retained summary of one open Crisis Theatre
 *     commonground/v1/game/<id>   retained full state of one game
 *
 * Updates arrive in real time (no polling). Games left untouched for more than
 * ten minutes are cleared from the lobby when anyone logs in. The public broker
 * and topics are shared and unauthenticated, so the data is public and
 * best-effort: that is the simple, no-account tradeoff.
 *
 * Keeps the same CG.Net surface the game and lobby already use, so swapping the
 * host touched only this file. Vanilla JS, the one dependency is mqtt.js (loaded
 * from a CDN in index.html); if it is missing, multiplayer simply stays off.
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});

  const BROKER = "wss://broker.emqx.io:8084/mqtt";
  const PREFIX = "commonground/v1";
  const lobbyTopic = (id) => PREFIX + "/lobby/" + id;
  const gameTopic = (id) => PREFIX + "/game/" + id;
  const chatTopic = (id) => PREFIX + "/chat/" + id;   // table chat, live (not retained)
  const IDLE_MS = 10 * 60 * 1000;   // games idle longer than this are removed
  const POLL_MS = 2500;             // retained legacy value (kept for callers)

  function ls(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val); return val;
    } catch (e) { return val === undefined ? null : val; }
  }
  function rid(p) { return (p || "") + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
  let clientId = ls("cg_client_id");
  if (!clientId) { clientId = rid("c"); ls("cg_client_id", clientId); }

  const now = () => Date.now();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---- the live picture, kept up to date by the broker -------------------
  const lobbyMap = {};   // id -> summary (from retained lobby messages)
  const gameCache = {};  // id -> last full game state seen
  let activePoll = { id: null, cb: null };
  let chatSub = { id: null, cb: null };   // live table-chat subscription

  function onMessage(topic, buf) {
    const payload = buf ? buf.toString() : "";
    if (topic.indexOf(PREFIX + "/chat/") === 0) {
      if (!payload) return;
      const id = topic.slice((PREFIX + "/chat/").length);
      let m = null; try { m = JSON.parse(payload); } catch (e) { return; }
      if (chatSub.id === id && chatSub.cb) chatSub.cb(m);
      return;
    }
    if (topic.indexOf(PREFIX + "/lobby/") === 0) {
      const id = topic.slice((PREFIX + "/lobby/").length);
      if (!payload) delete lobbyMap[id];
      else { try { lobbyMap[id] = JSON.parse(payload); } catch (e) {} }
      return;
    }
    if (topic.indexOf(PREFIX + "/game/") === 0) {
      const id = topic.slice((PREFIX + "/game/").length);
      if (!payload) { delete gameCache[id]; if (activePoll.id === id && activePoll.cb) activePoll.cb(null); return; }
      let g = null; try { g = JSON.parse(payload); } catch (e) { return; }
      gameCache[id] = g;
      if (activePoll.id === id && activePoll.cb) activePoll.cb(g);
    }
  }

  // ---- connection (made once, on demand) ---------------------------------
  let client = null, connectPromise = null;
  function connect() {
    if (connectPromise) return connectPromise;
    connectPromise = new Promise((resolve, reject) => {
      if (typeof mqtt === "undefined" || !mqtt.connect) return reject(new Error("mqtt.js not loaded"));
      try {
        client = mqtt.connect(BROKER, {
          clientId: "cg_" + clientId + "_" + Math.random().toString(16).slice(2, 8),
          clean: true, reconnectPeriod: 3000, connectTimeout: 8000, keepalive: 30,
        });
      } catch (e) { return reject(e); }
      let settled = false;
      client.on("message", onMessage);
      client.on("connect", () => {
        client.subscribe(lobbyTopic("+"));      // watch every open theatre
        if (!settled) { settled = true; resolve(client); }
      });
      client.on("error", (e) => { if (!settled) { settled = true; reject(e); } });
      setTimeout(() => { if (!settled) { settled = true; reject(new Error("broker timeout")); } }, 9000);
    });
    return connectPromise;
  }

  function pub(topic, obj) {
    return new Promise((res) => {
      try { client.publish(topic, JSON.stringify(obj), { retain: true, qos: 0 }, () => res()); }
      catch (e) { res(); }
    });
  }
  function clearRetained(topic) { try { client.publish(topic, "", { retain: true, qos: 0 }); } catch (e) {} }

  // ---- lobby -------------------------------------------------------------
  // The summary shown in the list: enough to decide joinability, never the whole
  // board. Seats expose name / AI / taken so the join screen offers the right
  // seats to take over.
  function summaryOf(game) {
    return {
      id: game.id,
      theatre: game.theatre && game.theatre.name,
      icon: (game.theatre && game.theatre.icon) || "◆",
      createdAt: game.createdAt,
      lastActive: game.lastActive,
      over: !!game.over,
      hostId: game.hostId,
      seats: (game.players || []).map((p) => ({
        name: p.name, isAI: p.isAI, owned: !!p.ownerId, color: p.color, icon: p.icon,
      })),
    };
  }

  // Snapshot of the open theatres. Retained messages arrive just after we
  // subscribe, so the very first call settles briefly to let them land. Idle or
  // finished games are cleared from the lobby (and their game state with them).
  let firstList = true;
  async function listTheatres(opts) {
    await connect();
    if (firstList) { firstList = false; await wait(800); }
    const t = now();
    Object.keys(lobbyMap).forEach((id) => {
      const g = lobbyMap[id];
      if (!g || (t - (g.lastActive || 0)) > IDLE_MS || g.over) {
        delete lobbyMap[id];
        if (!(opts && opts.readOnly)) { clearRetained(lobbyTopic(id)); clearRetained(gameTopic(id)); }
      }
    });
    return Object.keys(lobbyMap).map((id) => lobbyMap[id]).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  async function upsertSummary(summary) { await connect(); lobbyMap[summary.id] = summary; await pub(lobbyTopic(summary.id), summary); }
  async function dropSummary(id) { await connect(); delete lobbyMap[id]; clearRetained(lobbyTopic(id)); clearRetained(gameTopic(id)); }

  // ---- per-game state ----------------------------------------------------
  async function createGame(game) {
    await connect();
    const id = rid("g");
    game.id = id; game.createdAt = now(); game.lastActive = now();
    gameCache[id] = game;
    await pub(gameTopic(id), game);
    await upsertSummary(summaryOf(game));
    return id;
  }

  // Read the current state for a join. Subscribe, then wait briefly for the
  // retained message to arrive (or fall back to whatever we last cached).
  async function getGame(id) {
    await connect();
    client.subscribe(gameTopic(id));
    const deadline = now() + 4000;
    while (now() < deadline) { if (gameCache[id]) return gameCache[id]; await wait(150); }
    return gameCache[id] || null;
  }

  // Write the full game state (real time, no throttle on the broker). The lobby
  // summary is refreshed at most every so often, so the list stays current
  // without a write per turn.
  let lastSummaryPush = 0;
  async function putGame(game, opts) {
    await connect();
    game.lastActive = now();
    gameCache[game.id] = game;
    await pub(gameTopic(game.id), game);
    const force = opts && opts.summary;
    if (force || now() - lastSummaryPush > 15000) {
      lastSummaryPush = now();
      try { await upsertSummary(summaryOf(game)); } catch (e) {}
    }
  }

  // ---- "polling": now a live subscription --------------------------------
  // Same shape the game expects, but updates push in real time. The callback
  // fires on every retained-or-live message for this game (including, harmlessly,
  // our own echoes, which the game filters by sequence number).
  function poll(id, cb) {
    activePoll = { id: id, cb: cb };
    connect().then(() => {
      client.subscribe(gameTopic(id));
      if (gameCache[id]) cb(gameCache[id]);
    }).catch(() => {});
  }
  function stopPoll() {
    const id = activePoll.id;
    activePoll = { id: null, cb: null };
    if (client && id) { try { client.unsubscribe(gameTopic(id)); } catch (e) {} }
  }

  // ---- table chat --------------------------------------------------------
  // Messages travel on their own per-game topic, published live (NOT retained),
  // so every browser currently in the theatre receives each message in real time
  // while nothing lingers on the broker for late joiners. Chat is intentionally
  // separate from the game state, so a message never collides with a turn write.
  function onChat(id, cb) {
    chatSub = { id: id, cb: cb };
    connect().then(() => { client.subscribe(chatTopic(id)); }).catch(() => {});
  }
  function stopChat() {
    const id = chatSub.id;
    chatSub = { id: null, cb: null };
    if (client && id) { try { client.unsubscribe(chatTopic(id)); } catch (e) {} }
  }
  function sendChat(id, msg) {
    return connect().then(() => new Promise((res) => {
      try { client.publish(chatTopic(id), JSON.stringify(msg), { retain: false, qos: 0 }, () => res()); }
      catch (e) { res(); }
    })).catch(() => {});
  }

  CG.Net = {
    clientId,
    IDLE_MS, POLL_MS,
    now,
    getName: () => ls("cg_player_name") || "",
    setName: (n) => ls("cg_player_name", String(n || "").slice(0, 22)),
    listTheatres, createGame, getGame, putGame,
    upsertSummary, dropSummary, summaryOf,
    poll, stopPoll,
    onChat, stopChat, sendChat,
    connect,
  };
})();
