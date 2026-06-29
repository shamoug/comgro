/* =========================================================================
 * COMMON GROUND, lobby.js
 * The way in for multiplayer. You "log in" by naming yourself, then see the
 * Crisis Theatres other players have open on other browsers. You can open your
 * own theatre, or join one and take over an AI seat, forcing your own name onto
 * it. Logging in also prunes any game left idle for more than ten minutes.
 *
 * The lobby only ever shows lightweight summaries from the shared index; the
 * full board is loaded the moment you join. Vanilla JS, reuses the title-screen
 * look from styles.css.
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});
  const app = () => document.getElementById("app");
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
  const clean = (s) => String(s || "").replace(/[<>]/g, "").trim().slice(0, 22);

  let pollTimer = null, pollGen = 0;
  function stopList() { pollGen++; if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; } }

  // ---- entry -------------------------------------------------------------
  function show() {
    stopList();
    if (!CG.Net.getName()) return renderLogin();
    renderLobby();
  }

  // ---- login (name yourself) --------------------------------------------
  function renderLogin() {
    stopList();
    const root = app(); root.innerHTML = "";
    const wrap = el("div", "screen title-screen");
    wrap.appendChild(el("div", "title-glow"));
    wrap.appendChild(el("div", "logo-mark", "◆"));
    wrap.appendChild(el("h1", "title", "Common Ground"));
    wrap.appendChild(el("p", "subtitle", "The Long Road"));
    wrap.appendChild(el("p", "tagline",
      "Field coordination, played together. Name yourself to see the Crisis Theatres other coordinators have open, join one, and take a seat."));

    wrap.appendChild(el("p", "pick-label", "Your name"));
    const input = el("input", "seat-input lobby-name");
    input.type = "text"; input.maxLength = 22; input.placeholder = "Enter your name";
    input.value = CG.Net.getName();
    wrap.appendChild(input);

    const go = el("button", "btn btn-primary big", "Enter the lobby ▸");
    go.style.marginTop = "18px";
    const enter = () => {
      const nm = clean(input.value);
      if (!nm) { input.focus(); input.classList.add("shake-err"); setTimeout(() => input.classList.remove("shake-err"), 500); return; }
      CG.Net.setName(nm); if (CG.Audio) CG.Audio.sfx.pick();
      renderLobby();
    };
    go.onclick = enter;
    input.onkeydown = (e) => { if (e.key === "Enter") enter(); };
    wrap.appendChild(go);

    const solo = el("button", "back-link solo-link", "or play solo against the AI →");
    solo.onclick = () => { if (CG.Audio) CG.Audio.sfx.click(); CG.SnakesGame.show(); };
    wrap.appendChild(solo);

    wrap.appendChild(el("p", "byline", "Designed by <b>Digital Solutions Lab</b>"));
    root.appendChild(wrap);
    setTimeout(() => { try { input.focus(); } catch (e) {} }, 50);
  }

  // ---- the list of Crisis Theatres --------------------------------------
  function renderLobby() {
    const root = app(); root.innerHTML = "";
    const wrap = el("div", "screen lobby-screen");
    wrap.appendChild(el("div", "title-glow"));

    const head = el("div", "lobby-head");
    head.innerHTML =
      `<div class="lobby-title"><span class="logo-mark sm">◆</span><div><h1 class="title sm">Crisis Theatres</h1>` +
      `<p class="subtitle sm">Open games on other browsers, right now</p></div></div>`;
    const who = el("div", "lobby-who");
    who.innerHTML = `<span>Playing as <b>${esc(CG.Net.getName())}</b></span>`;
    const rename = el("button", "back-link", "change");
    rename.onclick = () => renderLogin();
    who.appendChild(rename);
    head.appendChild(who);
    wrap.appendChild(head);

    const actions = el("div", "lobby-actions");
    const create = el("button", "btn btn-primary", "✦ Open a new theatre");
    create.onclick = () => renderCreate();
    const refresh = el("button", "btn btn-ghost", "↻ Refresh");
    refresh.onclick = () => loadList(listBox, true);
    const solo = el("button", "btn btn-ghost", "🤖 Solo vs AI");
    solo.onclick = () => { stopList(); CG.SnakesGame.show(); };
    actions.appendChild(create); actions.appendChild(refresh); actions.appendChild(solo);
    wrap.appendChild(actions);

    const listBox = el("div", "theatre-list");
    listBox.innerHTML = `<div class="lobby-empty">Looking for open theatres…</div>`;
    wrap.appendChild(listBox);

    wrap.appendChild(el("p", "board-credit", "Designed by <b>Digital Solutions Lab</b>"));
    root.appendChild(wrap);

    // Live list: prune-and-load now, then keep it fresh on a gentle timer.
    loadList(listBox, true);
    const gen = ++pollGen;
    const tick = () => {
      if (gen !== pollGen) return;
      pollTimer = setTimeout(() => { if (gen === pollGen) { loadList(listBox, false); tick(); } }, 4000);
    };
    tick();
  }

  async function loadList(listBox, prune) {
    try {
      // The first load of a session prunes idle games (the "remove on login"
      // rule); refreshes after that only read, to stay light.
      const games = await CG.Net.listTheatres({ readOnly: !prune });
      if (!listBox.isConnected) return;
      renderTheatres(listBox, games);
    } catch (e) {
      if (listBox.isConnected) listBox.innerHTML = `<div class="lobby-empty">Could not reach the lobby. <b>Refresh</b> to try again.</div>`;
    }
  }

  function seatChips(seats) {
    return (seats || []).map((s) => {
      const kind = s.isAI ? "ai" : (s.owned ? "human" : "open");
      const tag = s.isAI ? "🤖" : (s.owned ? "🙋" : "·");
      return `<span class="seat-chip ${kind}" style="--tok:${s.color || "#2f6bff"}">` +
        `<span class="sc-ic">${s.icon || "◆"}</span><span class="sc-nm">${tag} ${esc(s.name)}</span></span>`;
    }).join("");
  }

  function renderTheatres(listBox, games) {
    if (!games.length) {
      listBox.innerHTML = `<div class="lobby-empty">No open theatres yet. <b>Open a new theatre</b> and invite others to join you.</div>`;
      return;
    }
    listBox.innerHTML = "";
    games.forEach((g) => {
      const seats = g.seats || [];
      const humans = seats.filter((s) => !s.isAI && s.owned).length;
      const takeable = seats.filter((s) => s.isAI || !s.owned).length;
      const card = el("div", "theatre-card");
      card.innerHTML =
        `<div class="tc-top"><span class="tc-icon">${g.icon || "◆"}</span>` +
          `<div class="tc-id"><b>${esc(g.theatre || "Crisis Theatre")}</b>` +
          `<small>${humans} playing · ${takeable} seat${takeable === 1 ? "" : "s"} open · ${ago(g.lastActive)}</small></div></div>` +
        `<div class="tc-seats">${seatChips(seats)}</div>`;
      const join = el("button", "btn btn-primary", takeable ? "Join this theatre ▸" : "Full · spectate");
      join.onclick = () => openJoin(g.id);
      card.appendChild(join);
      listBox.appendChild(card);
    });
  }

  function ago(t) {
    if (!t) return "just now";
    const s = Math.max(0, Math.round((CG.Net.now() - t) / 1000));
    if (s < 60) return "active just now";
    const m = Math.round(s / 60);
    return `active ${m} min ago`;
  }

  // ---- open a new theatre ------------------------------------------------
  function renderCreate() {
    stopList();
    const root = app(); root.innerHTML = "";
    const wrap = el("div", "screen title-screen setup-screen");
    wrap.appendChild(el("div", "title-glow"));
    const back = el("button", "back-link", "← Back");
    back.onclick = () => renderLobby();
    wrap.appendChild(back);
    wrap.appendChild(el("div", "logo-mark", "◆"));
    wrap.appendChild(el("h1", "title", "Open a theatre"));
    wrap.appendChild(el("p", "tagline",
      `You take seat one as <b>${esc(CG.Net.getName())}</b>. The other seats start as AI coordinators, any player can join and take one over.`));

    wrap.appendChild(el("p", "pick-label", "Seats at the table"));
    let size = 4;
    const segRow = el("div", "seg-row");
    [2, 3, 4].forEach((n) => {
      const b = el("button", "seg" + (n === size ? " on" : ""), n + "");
      b.onclick = () => { size = n; segRow.querySelectorAll(".seg").forEach((x) => x.classList.remove("on")); b.classList.add("on"); if (CG.Audio) CG.Audio.sfx.click(); };
      segRow.appendChild(b);
    });
    wrap.appendChild(segRow);

    const go = el("button", "btn btn-primary big", "Open it ▸");
    go.style.marginTop = "20px";
    go.onclick = async () => {
      go.disabled = true; go.textContent = "Opening…";
      try {
        const game = CG.SnakesGame.buildOnlineGame(CG.Net.getName(), size);
        await CG.Net.createGame(game);
        if (CG.Audio) CG.Audio.sfx.pick();
        CG.SnakesGame.showMulti(game);
      } catch (e) {
        go.disabled = false; go.textContent = "Open it ▸";
        flash(wrap, "Could not open the theatre. Please try again.");
      }
    };
    wrap.appendChild(go);
    root.appendChild(wrap);
  }

  // ---- join: pick a seat to take over ------------------------------------
  async function openJoin(id) {
    stopList();
    const root = app(); root.innerHTML = "";
    const wrap = el("div", "screen title-screen setup-screen");
    wrap.appendChild(el("div", "title-glow"));
    const back = el("button", "back-link", "← Back");
    back.onclick = () => renderLobby();
    wrap.appendChild(back);
    wrap.appendChild(el("div", "logo-mark", "◆"));
    wrap.appendChild(el("h1", "title", "Take a seat"));
    const sub = el("p", "tagline", "Loading the theatre…");
    wrap.appendChild(sub);
    const list = el("div", "seat-list join-list");
    wrap.appendChild(list);
    root.appendChild(wrap);

    let game;
    try { game = await CG.Net.getGame(id); } catch (e) { game = null; }
    if (!game) { sub.innerHTML = "This theatre has closed."; return; }
    sub.innerHTML =
      `<b>${esc((game.theatre && game.theatre.name) || "Crisis Theatre")}</b>. Take over an AI seat, or one a player has left. ` +
      `Your name is yours to set.`;

    renderSeatPicker(list, game);
  }

  function renderSeatPicker(list, game) {
    list.innerHTML = "";
    const myId = CG.Net.clientId;
    let any = false;
    (game.players || []).forEach((p, i) => {
      const mine = !p.isAI && p.ownerId === myId;
      const takeable = p.isAI || !p.ownerId;
      const row = el("div", "seat-row");
      row.style.setProperty("--tok", p.color);
      row.appendChild(el("span", "seat-badge", "" + (i + 1)));
      row.appendChild(el("span", "join-avatar", p.icon || "◆"));

      const info = el("div", "join-info");
      const tag = mine ? "🙋 your seat" : (p.isAI ? "🤖 AI" : (takeable ? "· open seat" : "🙋 player"));
      info.innerHTML = `<b>${esc(p.name)}</b><small>${tag}</small>`;
      row.appendChild(info);

      if (mine) {
        any = true;
        const b = el("button", "btn btn-primary sm", "Resume ▸");
        b.onclick = () => enterGame(game, i, p.name);
        row.appendChild(b);
      } else if (takeable) {
        any = true;
        const nameIn = el("input", "seat-input sm");
        nameIn.type = "text"; nameIn.maxLength = 22; nameIn.value = CG.Net.getName(); nameIn.placeholder = "Your name";
        row.appendChild(nameIn);
        const b = el("button", "btn btn-primary sm", "Take ▸");
        b.onclick = () => takeSeat(game.id, i, nameIn.value, b);
        nameIn.onkeydown = (e) => { if (e.key === "Enter") b.click(); };
        row.appendChild(b);
      } else {
        const lbl = el("span", "join-locked", "in play");
        row.appendChild(lbl);
      }
      list.appendChild(row);
    });
    if (!any) list.appendChild(el("div", "lobby-empty", "Every seat is held by an active player. Try another theatre."));
  }

  // Claim a seat: re-read the game so two players cannot grab the same one,
  // stamp it with our id and chosen name, write it back, then drop into play.
  async function takeSeat(id, idx, rawName, btn) {
    const nm = clean(rawName) || CG.Net.getName() || "Player";
    CG.Net.setName(nm);
    if (btn) { btn.disabled = true; btn.textContent = "Taking…"; }
    let game;
    try { game = await CG.Net.getGame(id); } catch (e) { game = null; }
    if (!game) { return bounce("This theatre has closed."); }
    const seat = game.players[idx];
    const free = seat && (seat.isAI || !seat.ownerId || seat.ownerId === CG.Net.clientId);
    if (!free) {
      // Someone beat us to it: re-show the picker with the fresh state.
      const list = document.querySelector(".join-list");
      if (list) renderSeatPicker(list, game);
      if (btn) { btn.disabled = false; btn.textContent = "Take ▸"; }
      return;
    }
    seat.isAI = false; seat.ownerId = CG.Net.clientId; seat.name = nm;
    game.seq = (game.seq || 0) + 1; game.lastWriter = CG.Net.clientId;
    game.lastEvent = `${nm} takes a seat in ${(game.theatre && game.theatre.name) || "the theatre"}`;
    try {
      await CG.Net.putGame(game, { summary: true });
    } catch (e) { return bounce("Could not take the seat. Please try again."); }
    if (CG.Audio) CG.Audio.sfx.pick();
    enterGame(game, idx, nm);
  }

  function enterGame(game, idx, nm) {
    stopList();
    CG.SnakesGame.showMulti(game);
  }

  function bounce(msg) {
    const root = app();
    const t = el("div", "lobby-toast", msg);
    root.appendChild(t);
    setTimeout(() => t.remove(), 2600);
    setTimeout(() => renderLobby(), 1400);
  }
  function flash(wrap, msg) {
    const t = el("div", "lobby-toast", msg);
    wrap.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  CG.Lobby = { show, stop: stopList };
})();
