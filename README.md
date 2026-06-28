# Common Ground: The Game Room

A small game platform for a UN Country Team. Each seat at the table can be a human
(you name them) or an AI rival (named for you). Open it and pick how you want to
play. Everything runs in the browser, with spoken narration and an original
cinematic score generated live.

The Game Room is built to grow. It currently ships two games, **The Long Road**
and **The Mandate**, and more can be added as cards on the launcher.

## The Long Road, Ladders &amp; Holes

Roll one or two dice, race a hundred squares to a finished mandate, and learn a
little about how real crisis response works along the way. **The board is
generated fresh every game**, so the ladders, holes, trophies and diamonds move
each time, and the **job titles, rival names and crisis theatre are different
every run**. The challenges and openings you draw are weighted to fit the theatre
you are posted to.

- **Ladders** are the lucky breaks: agreements, partnerships, community trust.
- **Holes** are crises a Country Team really meets: floods, outbreaks, a closed
  border, misinformation. A card explains every climb and slide, with a fun fact.
- **Trophies 🏆** are recognition (tailored to your job title): collect and roll again.
- **Diamonds 💎** are a lucky find: collect one and hop forward.
- **Surprise cards ❓** are a mystery: a bonus, a jump ahead, a found gem, or a lost turn.
- **Field notes ★** drop a fun fact as you pass.

## The Mandate, a journey of choices

A game in the spirit of the Game of Life. You do not only race: you **make
choices** and **build a legacy**. **Spin the wheel** and travel a winding road,
generated fresh every game with one real **fork** where you pick your route.

- **Crossroads ⚖️** are real dilemmas: speed or trust, fast money or flexible
  money, your logo or the result. Each option carries a trade-off.
- **Funding 💰, Trust 🤝 and Capacity 👥** are the three resources you collect.
- **Milestones ⭐** are the big career markers: worth more, and you spin again.
- **Events ⚡** are the breaks and setbacks the field really deals.
- The whole table shares the **UN 2.0 Quintet of Change**, as in The Long Road.

The twist: play runs until the **last** player reaches the handover, and the
**richest legacy wins, not the fastest finish**. Finishing early earns a bonus,
but the coordinator who built the deepest legacy completes the mandate.

It is a single static website. No backend, no build step, no accounts, no
external media. Drop it on GitHub Pages and it just runs.

**Live:** https://shamoug.github.io/comgro/

---

## How to play

1. Build your table: choose **2 to 4 players**, and for each seat pick **Human or
   AI**. Human seats type a name; AI seats are given a random one (with a die to
   reroll). Mix freely: solo against AI, hotseat with friends, or all AI. For the
   Long Road, also choose **one die or two dice** for the pace you want.
2. The deal hands you a **Job Title** (your avatar this game) and posts you to a
   **Crisis Theatre** (the country).
3. Press **Roll**. You move the sum of your dice.
   - With two dice, **doubles** earn you another roll.
   - Overshoot square 100 and you **bounce back**, exact landing wins.
4. Land on a ladder foot to climb, a hole to drop, or a star to read a
   field note. The narrator reads each card aloud in a warm voice.
5. First to **square 100** completes the mandate.

Everything is generated live in your browser:

- **Music** is an original, royalty-free score synthesised with the Web Audio
  API. It deepens and resolves as you move through the board's four zones.
- **Narration** uses the browser's built-in speech synthesis (Web Speech API),
  no keys, no network. A "Read aloud" button sits on every card.

Toggle music and narration from the title screen or the top bar.

---

## Run it locally

You do not need to install anything beyond a web browser.

- **Windows:** double-click `start.bat`.
- **macOS / Linux:** run `./start.sh` (or `bash start.sh`).
- **Any system with Python:** `python3 -m http.server 8099`, then open
  http://localhost:8099.

You can also just open `index.html` directly, though a tiny local server is the
smoothest way to play.

---

## Publish your own copy

`publish.bat` commits everything and pushes to GitHub, which refreshes the live
GitHub Pages site. Double-click it whenever you want to upload a new version.

To host anywhere else, upload the whole folder to any static host (GitHub Pages,
Netlify, an S3 bucket, a USB stick). Relative paths keep it working everywhere.

---

## Project layout

```
index.html          Loads the data, the games, then the launcher.
data/content.js     ALL content for both games: decks, cards, theatres, names, story.
src/audio.js        Procedural cinematic music + sound effects (Web Audio API).
src/narrate.js      Warm English narration (Web Speech API).
src/setup.js        Shared "build your table" roster screen (Human / AI seats).
src/game.js         The Long Road: dynamic board, dice, movement, render.
src/mandate.js      The Mandate: winding road, spinner, resources, decisions.
src/platform.js     The launcher that lets you choose a game.
styles/styles.css   One self-contained stylesheet (boards, dice, cards are CSS/SVG).
```

**To change the story, edit only `data/content.js`.** Add or rewrite hole cards,
ladder cards, job titles, theatres, and field notes; move the ladders and holes
on the board; adjust the spoken story beats. The engine never hard-codes flavour
text.

---

## Design notes

- **No external assets.** Board, tokens, dice, ladders and holes are all CSS and
  inline SVG. Audio is synthesised. The only network request is the optional web
  font, which degrades gracefully to system fonts offline.
- **Accessible-friendly.** Honours `prefers-reduced-motion`, narration is
  optional, and the game is clickable throughout.
- **Fictional settings.** The crisis theatres are composite and invented. Any
  resemblance to a real nation is coincidental. The coordination wisdom in the
  fun facts, however, is very real.

---

## Credits

Designed by **Digital Solutions Lab**.

## License

See `LICENSE`.
