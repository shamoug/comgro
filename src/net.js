/* =========================================================================
 * COMMON GROUND, net.js
 * The multiplayer backbone. GitHub Pages serves only static files, so the
 * shared state that lets browsers see and join each other's games travels over
 * free, no-account public MQTT brokers (several at once, see BROKERS) via
 * secure WebSockets.
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

  // Free, no-account public brokers, all over secure WebSockets. Every one
  // is used at once (see connect()). shiftr.io answers on port 443, which
  // gets through networks that block the others' ports; it asks for the
  // published public/public login. To add or swap a broker, edit this list.
  const BROKERS = [
    { url: "wss://public.cloud.shiftr.io", auth: { username: "public", password: "public" } },
    { url: "wss://broker.emqx.io:8084/mqtt" },
    { url: "wss://broker.hivemq.com:8884/mqtt" },
    { url: "wss://test.mosquitto.org:8081/mqtt" },
  ];
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

  function onMessage(topic, payload) {
    if (topic.indexOf(PREFIX + "/x/") === 0) return onRoomMessage(topic, payload);
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

  // ---- connection: several brokers at once ------------------------------
  // Public brokers come and go, and some networks (UN and corporate ones
  // among them) block every port but 443. So a browser connects to EVERY
  // broker in BROKERS it can reach, publishes each message to all of them,
  // and drops the copies that arrive twice. Two players always meet on any
  // broker they can both reach, and losing one broker changes nothing.
  // connect() resolves as soon as the first broker answers; the rest join
  // in the background and are handed every subscription when they do.
  const DEDUPE_MS = 2000;
  const seenMsg = new Map();            // topic + payload -> time first seen
  function fresh(topic, payload) {
    const t = now(), key = topic + "|" + payload;
    if (seenMsg.size > 400) seenMsg.forEach((at, k) => { if (t - at > DEDUPE_MS) seenMsg.delete(k); });
    const at = seenMsg.get(key);
    if (at && t - at < DEDUPE_MS) return false;
    seenMsg.set(key, t);
    return true;
  }

  const subs = new Set();               // every topic we want, on every broker
  let conns = [];                       // one mqtt.js client per broker
  // The facade the rest of this file talks to, shaped like one mqtt.js client.
  const client = {
    get connected() { return conns.some((c) => c.connected); },
    subscribe(t) { subs.add(t); conns.forEach((c) => { if (c.connected) { try { c.subscribe(t); } catch (e) {} } }); },
    unsubscribe(t) { subs.delete(t); conns.forEach((c) => { try { c.unsubscribe(t); } catch (e) {} }); },
    // Publish everywhere. The callback fires on the first broker's ack, or
    // after a short wait if none is up, so nothing awaits forever.
    publish(t, payload, opts, cb) {
      let done = false;
      const finish = () => { if (!done) { done = true; if (cb) cb(); } };
      const up = conns.filter((c) => c.connected);
      (up.length ? up : conns).forEach((c) => { try { c.publish(t, payload, opts || {}, finish); } catch (e) {} });
      setTimeout(finish, up.length ? 2500 : 600);
    },
  };

  let connectPromise = null;
  function connect() {
    if (connectPromise) return connectPromise;
    connectPromise = new Promise((resolve, reject) => {
      if (typeof mqtt === "undefined" || !mqtt.connect) return reject(new Error("mqtt.js not loaded"));
      let settled = false, failed = 0;
      subs.add(lobbyTopic("+"));          // watch every open theatre
      conns = BROKERS.map((b) => {
        let c;
        try {
          c = mqtt.connect(b.url, Object.assign({
            clientId: "cg_" + clientId + "_" + Math.random().toString(16).slice(2, 8),
            clean: true, reconnectPeriod: 4000, connectTimeout: 8000, keepalive: 30,
          }, b.auth || {}));
        } catch (e) { failed++; return null; }
        c.on("message", (topic, buf) => {
          const payload = buf ? buf.toString() : "";
          if (fresh(topic, payload)) onMessage(topic, payload);
        });
        c.on("connect", () => {
          subs.forEach((t) => { try { c.subscribe(t); } catch (e) {} });
          if (!settled) { settled = true; resolve(client); }
        });
        // An unreachable broker keeps retrying quietly in the background.
        c.on("error", () => {});
        return c;
      }).filter(Boolean);
      if (!conns.length) { settled = true; return reject(new Error("no broker")); }
      setTimeout(() => { if (!settled) { settled = true; reject(new Error("no broker reachable")); } }, 9000);
    });
    // A failed attempt is not remembered: the next call tries again, so a
    // network blip does not leave online play off until the page reloads.
    connectPromise.catch(() => {
      connectPromise = null;
      conns.forEach((c) => { try { c.end(true); } catch (e) {} });
      conns = [];
    });
    return connectPromise;
  }
  // Which brokers this browser is on right now (for the curious, and tests).
  function brokers() { return conns.map((c, i) => ({ url: BROKERS[i] && BROKERS[i].url, up: !!c.connected })); }

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

  // ---- rooms for other games ---------------------------------------------
  // The Long Road keeps the topics above. Any other game asks for its own
  // namespace with room("<game>"), which lives under
  //   commonground/v1/x/<ns>/lobby/<id>   retained summary of one open room
  //   commonground/v1/x/<ns>/game/<id>    retained full state of one room
  //   commonground/v1/x/<ns>/live/<id>    live, NOT retained (typing, pings,
  //                                       reactions): gone the moment it lands
  // so each game's lobby lists only its own rooms, over the same connection.
  const spaces = {};
  function space(ns) {
    if (!spaces[ns]) spaces[ns] = { lobby: {}, games: {}, watch: { id: null, cb: null }, live: { id: null, cb: null }, listed: false };
    return spaces[ns];
  }
  const roomTopic = (ns, kind, id) => PREFIX + "/x/" + ns + "/" + kind + "/" + id;

  function onRoomMessage(topic, payload) {
    const parts = topic.slice((PREFIX + "/x/").length).split("/");
    if (parts.length !== 3) return;
    const sp = spaces[parts[0]];
    if (!sp) return;
    const kind = parts[1], id = parts[2];
    let obj = null;
    if (payload) { try { obj = JSON.parse(payload); } catch (e) { return; } }
    if (kind === "lobby") {
      if (!obj) delete sp.lobby[id]; else sp.lobby[id] = obj;
    } else if (kind === "game") {
      if (!obj) delete sp.games[id]; else sp.games[id] = obj;
      if (sp.watch.id === id && sp.watch.cb) sp.watch.cb(obj);
    } else if (kind === "live") {
      if (obj && sp.live.id === id && sp.live.cb) sp.live.cb(obj);
    }
  }

  // room(ns, summarize) returns the lobby + state API for one game. summarize
  // turns a full game state into the small card the lobby shows.
  function room(ns, summarize) {
    const sp = space(ns);
    const sum = (g) => {
      const s = summarize ? summarize(g) : { id: g.id };
      s.id = g.id; s.createdAt = g.createdAt; s.lastActive = g.lastActive; s.over = !!g.over;
      return s;
    };
    async function ready() {
      await connect();
      if (!sp.listed) { sp.listed = true; client.subscribe(roomTopic(ns, "lobby", "+")); await wait(800); }
    }
    let lastSum = 0;
    return {
      async list(opts) {
        await ready();
        const t = now();
        Object.keys(sp.lobby).forEach((id) => {
          const g = sp.lobby[id];
          if (!g || (t - (g.lastActive || 0)) > IDLE_MS || g.over) {
            delete sp.lobby[id];
            if (!(opts && opts.readOnly)) { clearRetained(roomTopic(ns, "lobby", id)); clearRetained(roomTopic(ns, "game", id)); }
          }
        });
        return Object.keys(sp.lobby).map((id) => sp.lobby[id]).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      },
      // opts.id asks for a chosen id (a short room code, say) instead of a
      // random one; the caller checks has() first so the code is unused.
      async create(game, opts) {
        await connect();
        game.id = (opts && opts.id) || rid("r"); game.createdAt = now(); game.lastActive = now();
        sp.games[game.id] = game;
        await pub(roomTopic(ns, "game", game.id), game);
        const s = sum(game); sp.lobby[game.id] = s;
        await pub(roomTopic(ns, "lobby", game.id), s);
        return game.id;
      },
      // Is this id already an open room? (Only as good as the lobby list,
      // which every browser receives in full a moment after subscribing.)
      async has(id) { await ready(); return !!sp.lobby[id]; },
      async get(id) {
        await connect();
        client.subscribe(roomTopic(ns, "game", id));
        const deadline = now() + 4000;
        while (now() < deadline) { if (sp.games[id]) return sp.games[id]; await wait(150); }
        return sp.games[id] || null;
      },
      async put(game, opts) {
        await connect();
        game.lastActive = now();
        sp.games[game.id] = game;
        await pub(roomTopic(ns, "game", game.id), game);
        if ((opts && opts.summary) || now() - lastSum > 12000) {
          lastSum = now();
          const s = sum(game); sp.lobby[game.id] = s;
          await pub(roomTopic(ns, "lobby", game.id), s);
        }
      },
      async drop(id) {
        await connect();
        delete sp.lobby[id]; delete sp.games[id];
        clearRetained(roomTopic(ns, "lobby", id)); clearRetained(roomTopic(ns, "game", id));
      },
      watch(id, cb) {
        sp.watch = { id, cb };
        connect().then(() => {
          client.subscribe(roomTopic(ns, "game", id));
          if (sp.games[id]) cb(sp.games[id]);
        }).catch(() => {});
      },
      unwatch() {
        const id = sp.watch.id;
        sp.watch = { id: null, cb: null };
        if (client && id) { try { client.unsubscribe(roomTopic(ns, "game", id)); } catch (e) {} }
      },
      onLive(id, cb) {
        sp.live = { id, cb };
        connect().then(() => client.subscribe(roomTopic(ns, "live", id))).catch(() => {});
      },
      offLive() {
        const id = sp.live.id;
        sp.live = { id: null, cb: null };
        if (client && id) { try { client.unsubscribe(roomTopic(ns, "live", id)); } catch (e) {} }
      },
      sendLive(id, msg) {
        if (!client || !client.connected) return;
        try { client.publish(roomTopic(ns, "live", id), JSON.stringify(msg), { retain: false, qos: 0 }); } catch (e) {}
      },
    };
  }

  CG.Net = {
    room,
    clientId,
    IDLE_MS, POLL_MS,
    now,
    getName: () => ls("cg_player_name") || "",
    setName: (n) => ls("cg_player_name", String(n || "").slice(0, 22)),
    listTheatres, createGame, getGame, putGame,
    upsertSummary, dropSummary, summaryOf,
    poll, stopPoll,
    onChat, stopChat, sendChat,
    connect, brokers,
  };
})();
