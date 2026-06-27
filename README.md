# ◆ Common Ground

**A strategic card game about UN field coordination.**
*Lead the team. Earn the trust. Leave no one behind.*

Common Ground puts you in a real UN field role, Resident Coordinator, Data
Officer, NGO partner, donor, youth leader and more, working to help the
fictional country of **Sahelia** advance its national development goals while
navigating crises, scarce funding, fragile trust, and competing priorities.

You don't win by dominating. You win by **aligning people, data, and resources
at the right moment**, the actual craft of a Resident Coordinator Office.

Built around the **UN 2.0 Quintet of Change**: Data · Digital · Innovation ·
Foresight · Behavioural Science, with **Trust & Legitimacy** as the
meta-currency above them all.

---

## 📸 Screenshot

> _Add a screenshot here, e.g. `assets/screenshot.png`._
> The game is pure HTML/CSS/SVG with synthesised audio, nothing to install.

---

## ▶ Play locally (easiest)

### Windows
1. Download or clone this folder.
2. **Double-click `start.bat`.**
3. Your browser opens the game. (If Python is installed it serves on
   `http://localhost:8099`; if not, it opens `index.html` directly, both work.)

### macOS / Linux
```bash
./start.sh        # or:  bash start.sh
```

### Or just open the file
Open **`index.html`** in any modern browser. The full game runs from
`file://`, no server, no build step, no dependencies.

---

## 🚀 Publishing updates (Windows)

After you change anything, double-click **`publish.bat`** to commit and push to
GitHub. The live site at `https://shamoug.github.io/comgro/` refreshes about a
minute later. You can pass a message: `publish.bat "Added a new event card"`.
It uses your saved GitHub login (no token to paste).

## 🌐 Deploy to GitHub Pages

This is a static site with **relative paths**, so it deploys with zero config.

1. Create a repo named `common-ground` and push these files to the **root**.
2. In **Settings → Pages**, set:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` (or `master`) · **Folder:** `/ (root)`
3. Wait ~1 minute. Your game is live at:
   `https://USERNAME.github.io/common-ground/`

No backend is required. All assets are bundled or generated in-browser.

---

## 🎮 How to play (60-second version)

- **Goal:** Reach Sahelia's five **national milestones** (one per Quintet
  strategy) while keeping **Trust** above the collapse line, before your term
  ends across four Acts.
- Each **month** (round): read a field vignette → the world acts (a **shock**,
  an **opening**, or a hard **dilemma**) → spend **🔋 Capacity** to play
  **Action** and **Partnership** cards → resolve, and check milestones.
- **Resources:** 🤝 Trust · 💶 Funding · 🔗 Coordination · 📊 Data · 🔋 Capacity.
- **Win tiers:** 🥉 avoid collapse · 🥈 three milestones · 🥇 all five + high trust
  (with confetti, a finale, and a personalised **Quintet Scorecard**).
- Lose if Trust hits zero or crises stack past the cap, you get a constructive
  **After-Action Review**, not a harsh "Game Over."

Full rules are in-game under **How to Play (?)**, plus a 4-step interactive
tutorial and a plain-language **glossary** of UN terms.

### Modes
- **Solo vs AI**, you lead; a readable, goal-driven AI plays partners.
- **Local Multiplayer (hotseat)**, 2, 5 players share one device.
- **Co-op vs the World**, all humans team up against the country's dynamics.
- **Quick Game**, one Act, under 15 minutes.
- **Campaign**, all four Acts.
- **Daily Challenge**, a fixed seed everyone shares for the day.

---

## 🛠 Adding content (designers: edit data only)

The project cleanly separates **data → logic → rendering**. To add cards,
events, roles, or story, edit **only** the files in `data/`, no code changes
needed.

| Add this…            | Edit this file        | Notes |
|----------------------|-----------------------|-------|
| A role               | `data/roles.js`       | Give it `id`, `start` bonus, and an `ability` resolved in `engine.js`. |
| An action card       | `data/cards.js`       | Set `pillar`, `cost`, and `effect`. |
| A partnership        | `data/cards.js`       | Set `synergyPillar` + `bonus`. |
| A milestone          | `data/cards.js`       | One per Quintet pillar. |
| An event             | `data/events.js`      | `type`: shock / opening / dilemma; `rarity` weights the deck. |
| A story vignette     | `data/story.js`       | Tag it with its `act`. |
| UI text / a language | `data/strings.js`     | Add a language key with a `dir` for RTL. |

Effect and cost schemas are documented at the top of each data file.

---

## ♿ Accessibility

- Full **keyboard navigation** and focus rings; screen-reader labels on
  controls and the country dashboard.
- **Colour-blind safe:** every pillar and state uses an icon, shape, and label
 , never colour alone.
- **Reduced-motion** toggle (and honours `prefers-reduced-motion`).
- **Adjustable text size** and a **high-contrast** theme.
- **All six official UN languages**, fully translated: English, Français,
  Español, 中文, Русский, and العربية, via a one-tap language picker (🌐), with
  full **right-to-left** layout for Arabic. *Everything* is translated, the UI,
  the glossary, all 12 roles, every card, event and dilemma, all 64 field
  vignettes, the reflections, the AI's spoken reasoning, hints, tutorial and
  credits. Choose a language and nothing stays in English. (Translations live in
  `data/content.<lang>.js`, keyed identically to the canonical `content.en.js`.)
- **Spoken narration**: an optional read-aloud mode (Settings → Narration, or
  the 🔊 button beside any story text) voices the game in the chosen language
  using the browser's built-in speech synthesis. No keys, no network, no files.
- Plain, jargon-free language by default, with a one-tap glossary.

---

## 🔊 Audio

All music and sound effects are **original and procedurally synthesised in the
browser** via the Web Audio API, no audio files, fully royalty-free. The mood
shifts by Act (calm → tense → convergent → triumphant), with a musical sting
for each win tier. A **mute toggle** is always available.

---

## 🤖 Optional AI narration (no key required)

The game ships with a strong **rules-based AI** opponent that pursues visible
goals and explains each move in one line. It needs **no API key** and is the
default everywhere.

If you paste an **Anthropic API key** into Settings, the game can route richer
adaptive narration through the Anthropic Messages API (`claude-sonnet-4-6`).
The key lives only in memory for the session, is never hard-coded, and the game
is fully playable and beautiful without it.

---

## 🧭 How it maps to UN 2.0 (for award submissions)

| Quintet strategy        | In-game pillar & sample cards |
|-------------------------|-------------------------------|
| **Data**                | Joint Needs Assessment, Open Data Dashboard, Statistical Capacity |
| **Digital**             | Launch Digital Service, Interoperable Platform, Digital ID |
| **Innovation**          | Pilot Lab → Scale-Up, Challenge Fund, Frontier Tech Trial |
| **Foresight**           | Scenario Workshop, Early Warning System, Anticipatory Action |
| **Behavioural Science** | Nudge Campaign, Community Dialogue, Rumour Tracking |
| **Trust & Legitimacy**  | The meta-currency gating every major move |

Coordination is modelled as the Resident Coordinator's real superpower, 
*convening, not commanding*, through Pooled Funds, Joint Programmes, and the
humanitarian, development nexus. A post-game **Quintet Scorecard** reflects the
player's strategy mix back to them, turning play into a learning moment.

---

## 📦 Project structure

```
common-ground/
  index.html          # entry point (loads everything, relative paths)
  start.bat           # Windows launcher (double-click)
  start.sh            # macOS / Linux launcher
  README.md
  LICENSE
  /styles
    styles.css        # all styling, theming, RTL, accessibility
  /data               # DESIGNERS EDIT HERE
    strings.js        # UI text + glossary (en / ar)
    roles.js          # 12 playable roles
    cards.js          # actions, partnerships, milestones, pillars
    events.js         # 52 events (shocks / openings / dilemmas)
    story.js          # 64 vignettes, act intros, reflections
  /src                # game logic + rendering
    engine.js         # rules engine (state, phases, win/loss)
    ai.js             # readable goal-driven AI + optional API hook
    audio.js          # procedural Web Audio music & SFX
    ui.js             # in-game rendering & flow
    main.js           # bootstrap, menus, tutorial, glossary
  /assets             # (optional) screenshots etc., none required to run
```

---

## 📄 Licence & credits

- **Code & design:** released under the MIT License (see `LICENSE`).
- **Music & sound:** original, procedurally synthesised, royalty-free.
- **Art:** CSS + SVG + system emoji. No external/third-party assets.
- **Setting:** *Sahelia* is fictional and composite. Any resemblance to a real
  nation is coincidental, by design, to remain neutral and respectful.

Made for the UN 2.0 community, in the spirit of the Quintet of Change.
*Lead the team. Earn the trust. Leave no one behind.*
