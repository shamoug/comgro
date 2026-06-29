/* =========================================================================
 * COMMON GROUND, setup.js
 * The "build your table" roster screen. For every seat
 * you choose Human or AI. Pick Human and you type the name; pick AI and a random
 * name is assigned (with a die to reroll). Returns a clean roster array
 *   [{ isAI: boolean, name: string }, ...]
 * to the game, which decides everything else (roles, colours, board).
 * Vanilla JS, no framework. Reuses the title-screen look from styles.css.
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

  const NAMES = () => (CG.AGENT_NAMES && CG.AGENT_NAMES.length ? CG.AGENT_NAMES : ["Amara", "Diego", "Mei", "Kofi"]);

  /* ----------------------------------------------------------------------
   * PLAYER HOVER CARD. Hover (or tap, on touch
   * screens) a player token or standings row to see their name, job title,
   * affiliation, current score, and their Quintet of Change contribution.
   * A single floating card is reused, positioned in viewport coordinates.
   * -------------------------------------------------------------------- */
  CG.Hover = (function () {
    let tip = null, hideTimer = null;

    function ensure() {
      if (!tip) {
        tip = el("div", "phover");
        document.body.appendChild(tip);
      }
      return tip;
    }

    function build(info) {
      const quint = (info.quintet || [])
        .map((q) =>
          `<span class="pq ${q.lvl > 0 ? "pos" : q.lvl < 0 ? "neg" : ""}">` +
            `<span class="pq-ic">${q.icon}</span>` +
            `<span class="pq-lv">${q.lvl > 0 ? "+" : ""}${q.lvl}</span>` +
          `</span>`).join("");
      return (
        `<div class="ph-head">` +
          `<span class="ph-ic" style="--c:${info.color || "#2f6bff"}">${info.icon || "◆"}</span>` +
          `<div class="ph-id">` +
            `<div class="ph-name">${esc(info.name)}</div>` +
            `<div class="ph-role">${esc(info.role || "")}</div>` +
          `</div>` +
        `</div>` +
        `<div class="ph-aff"><span>🏛️</span>${esc(info.aff || "UN Country Team")}</div>` +
        `<div class="ph-score"><span>${esc(info.scoreLabel || "Score")}</span><b>${info.score}</b></div>` +
        (quint
          ? `<div class="ph-qlabel">UN 2.0 Quintet of Change</div><div class="ph-quint">${quint}</div>`
          : "")
      );
    }

    function place(anchor) {
      const t = ensure();
      const r = anchor.getBoundingClientRect();
      const tw = t.offsetWidth, th = t.offsetHeight;
      let x = r.left + r.width / 2 - tw / 2;
      let y = r.top - th - 10;                 // prefer above the anchor
      if (y < 8) y = r.bottom + 10;            // flip below if no room
      x = Math.max(8, Math.min(x, window.innerWidth - tw - 8));
      y = Math.max(8, Math.min(y, window.innerHeight - th - 8));
      t.style.left = x + "px";
      t.style.top = y + "px";
    }

    function show(anchor, info) {
      const t = ensure();
      clearTimeout(hideTimer);
      t.innerHTML = build(info);
      t.classList.add("show");
      place(anchor);
    }
    function hide() { if (tip) tip.classList.remove("show"); }

    return {
      hide,
      // bind(element, () => infoObject). Re-call on every render; cheap.
      bind(anchor, getInfo) {
        if (!anchor) return;
        anchor.style.pointerEvents = "auto";
        anchor.addEventListener("mouseenter", () => show(anchor, getInfo()));
        anchor.addEventListener("mouseleave", hide);
        anchor.addEventListener("click", (e) => {
          e.stopPropagation();
          show(anchor, getInfo());
          clearTimeout(hideTimer);
          hideTimer = setTimeout(hide, 3200);   // auto-dismiss the tap card
        });
      },
    };
  })();

  // A random name not already taken by another AI seat.
  function pickName(taken) {
    const pool = NAMES().filter((n) => taken.indexOf(n) < 0);
    const src = pool.length ? pool : NAMES();
    return src[Math.floor(Math.random() * src.length)];
  }

  CG.Setup = {
    /* opts: { icon, title, subtitle, intro, seatColors, minSeats, maxSeats,
     *         defaultSeats, startLabel, onBack, onStart } */
    open(opts) {
      const o = opts || {};
      const minSeats = o.minSeats || 2;
      const maxSeats = o.maxSeats || 4;
      const colors = o.seatColors || ["#2f6bff", "#e8439b", "#7c4dff", "#ff7a1a"];
      let count = Math.max(minSeats, Math.min(maxSeats, o.defaultSeats || 2));

      // Seat state persists as the count changes. Seat 1 is Human by default
      // (an obvious "you"), the rest are AI rivals you can flip to Human.
      const seats = [];
      for (let i = 0; i < maxSeats; i++) {
        seats.push({ isAI: i !== 0, name: "", aiName: "" });
      }
      reseed();

      // Give every currently-AI seat a unique random name.
      function reseed() {
        const taken = [];
        for (let i = 0; i < count; i++) {
          if (seats[i].isAI) {
            if (!seats[i].aiName || taken.indexOf(seats[i].aiName) >= 0)
              seats[i].aiName = pickName(taken);
            taken.push(seats[i].aiName);
          }
        }
      }

      const root = app();
      root.innerHTML = "";
      const wrap = el("div", "screen title-screen setup-screen");
      wrap.appendChild(el("div", "title-glow"));

      const back = el("button", "back-link", "← Back");
      back.onclick = () => { if (CG.Narrate) CG.Narrate.stop(); o.onBack && o.onBack(); };
      wrap.appendChild(back);

      wrap.appendChild(el("div", "logo-mark", o.icon || "◆"));
      wrap.appendChild(el("h1", "title", o.title || "Common Ground"));
      if (o.subtitle) wrap.appendChild(el("p", "subtitle", o.subtitle));
      if (o.intro) wrap.appendChild(el("p", "tagline", o.intro));

      // seat-count selector
      wrap.appendChild(el("p", "pick-label", "Players at the table"));
      const segRow = el("div", "seg-row");
      const counts = [];
      for (let n = minSeats; n <= maxSeats; n++) counts.push(n);
      counts.forEach((n) => {
        const b = el("button", "seg" + (n === count ? " on" : ""), n + "");
        b.onclick = () => {
          count = n;
          segRow.querySelectorAll(".seg").forEach((x) => x.classList.remove("on"));
          b.classList.add("on");
          if (CG.Audio) CG.Audio.sfx.click();
          reseed(); renderSeats();
        };
        segRow.appendChild(b);
      });
      wrap.appendChild(segRow);

      // seat list
      const list = el("div", "seat-list");
      wrap.appendChild(list);

      const startBtn = el("button", "btn btn-primary big", o.startLabel || "Begin ▸");
      startBtn.onclick = () => {
        if (CG.Audio) CG.Audio.sfx.pick();
        const roster = [];
        for (let i = 0; i < count; i++) {
          const s = seats[i];
          // Strip angle brackets so a typed name can never inject markup.
          const name = s.isAI
            ? (s.aiName || pickName([]))
            : (s.name.replace(/[<>]/g, "").trim() || "Player " + (i + 1));
          roster.push({ isAI: s.isAI, name });
        }
        o.onStart && o.onStart(roster);
      };
      wrap.appendChild(startBtn);

      root.appendChild(wrap);

      function renderSeats() {
        list.innerHTML = "";
        for (let i = 0; i < count; i++) {
          const s = seats[i];
          const row = el("div", "seat-row");
          row.style.setProperty("--tok", colors[i % colors.length]);

          row.appendChild(el("span", "seat-badge", "" + (i + 1)));

          // Human / AI toggle
          const seg = el("div", "seg-row seat-type");
          const human = el("button", "seg" + (!s.isAI ? " on" : ""), "🙋 Human");
          const ai = el("button", "seg" + (s.isAI ? " on" : ""), "🤖 AI");
          human.onclick = () => { if (!s.isAI) return; s.isAI = false; if (CG.Audio) CG.Audio.sfx.click(); renderSeats(); focusInput(i); };
          ai.onclick = () => { if (s.isAI) return; s.isAI = true; reseed(); if (CG.Audio) CG.Audio.sfx.click(); renderSeats(); };
          seg.appendChild(human); seg.appendChild(ai);
          row.appendChild(seg);

          // name area
          const nameWrap = el("div", "seat-name");
          if (s.isAI) {
            nameWrap.appendChild(el("span", "ai-name", "🤖 " + esc(s.aiName)));
            const reroll = el("button", "reroll", "🎲");
            reroll.title = "New name";
            reroll.onclick = () => {
              const taken = [];
              for (let k = 0; k < count; k++) if (k !== i && seats[k].isAI) taken.push(seats[k].aiName);
              s.aiName = pickName(taken);
              if (CG.Audio) CG.Audio.sfx.click();
              renderSeats();
            };
            nameWrap.appendChild(reroll);
          } else {
            const input = el("input", "seat-input");
            input.type = "text";
            input.maxLength = 22;
            input.placeholder = "Enter name";
            input.value = s.name;
            input.dataset.seat = i;
            input.oninput = () => { s.name = input.value; };
            input.onkeydown = (e) => { if (e.key === "Enter") startBtn.click(); };
            nameWrap.appendChild(input);
          }
          row.appendChild(nameWrap);

          list.appendChild(row);
        }
      }

      function focusInput(i) {
        const input = list.querySelector('.seat-input[data-seat="' + i + '"]');
        if (input) { try { input.focus(); } catch (e) {} }
      }

      renderSeats();
    },
  };
})();
