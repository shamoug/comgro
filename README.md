# Common Ground: The Long Road

A small game for a UN Country Team. Each seat at the table can be a human
(you name them) or an AI rival (named for you). Open it and play. Everything runs
in the browser, with spoken narration and an original cinematic score generated
live.

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

## Situation Report, the word game for two officers

Named after the daily update every humanitarian response lives by.
Headquarters sends a coded cable: **one five-letter word** from the
humanitarian, development or peacebuilding glossary (110 of them, from WATER and
TRUCE to OZONE and GAVEL). Two field officers share **one board of five columns
and ten rows** and take turns, row by row: row 1 is the first officer's, row 2
the second's, and so on. Each report turns green (right letter, right place),
gold (in the word, another place) or slate (not in the cable).

- **Nothing is hidden.** You watch your rival type, letter by letter, and every
  report on the board is yours to use.
- **The first officer to decode the cable wins it**, with speed points (10 plus
  one per unused row) that break a tie. A mission is 1, 3 or 5 cables.
- **Every cable is a story.** A scene opens it, a radio clue comes over the net
  after report 4 and a sat-phone clue after report 7; the reveal gives the
  glossary definition and a real fact from the field.
- **Play solo** against an AI officer (Junior, Field or Veteran), **two on one
  device**, or **online**, which is people only: open a room and it waits, one
  seat empty, until another officer takes it. Whoever opened the room can close
  it again, from the room list or from the board.

## Parley, chess that wins people over

A parley is a meeting between opposing sides to talk terms. Here it is chess on
a **five by five table**, made easier and friendlier. Each delegation has an
**Envoy** 🕊️ (the king), two **Convoys** 🚚 (rooks), an **Airlift** 🚁 (knight),
a **Scout** 🧭 (bishop) and three **Volunteers** 🙋 (pawns).

- **Easier than chess.** No check, no checkmate, no castling, no en passant, no
  double step. A Volunteer steps one square forward, straight or diagonal, and
  wins over the same way; on the far row it becomes a **Coordinator** 🌟 (a queen).
- **Nobody is knocked out.** Land on a rival piece and you win it over: it joins
  your reserve, and on a later turn you can bring it in on your two home rows.
- **Two ways to win:** win over the rival Envoy, or walk your own Envoy onto
  their **Summit** 🏔️, the square their Envoy started on.
- **Help at the table.** Tap a piece to see its moves, ⚠ marks a piece that could
  be won over next move, the banner warns when your Envoy or Summit is in danger,
  💡 **Hint** suggests a move and says why, ↩ takes a move back, and either side
  can offer peace 🤝.
- **Play solo** against an AI envoy (Junior, Field or Veteran), **two on one
  device**, or **online** (people only, like Situation Report). A match is one
  round or best of three, and both house rules can be switched off for a game
  closer to classic chess.

## Agenda 2030, the Global Goals quiz show

A quiz show on the Sustainable Development Goals, in the spirit of *Who Wants to
Be a Millionaire?*. **Ten questions a show**, each harder than the last (four
warm-up, three harder, three for the brave), drawn from a bank of almost 700
questions across all 17 Goals and the 2030 Agenda itself. Every question has four
answers, A to D, with exactly one right, and **every one was checked against the
official source it cites** (sdgs.un.org target texts, unstats.un.org, UN
resolutions and agency sites). The answers are shuffled every show.

- **Host a show on the big screen.** Pick how many contestants (1 to 5) and
  the screen opens a show with a **random five-letter code, a link and a QR
  code**. Players scan it with their phones, type a name, pick an avatar, and pop
  onto the stage. **When the last seat is taken, the show starts by itself**
  (or the host starts early). Seats can be added or removed while people join.
- **Phones are private answer pads.** Each question shows on the big screen and on
  every phone. You always get the full **30 seconds**, under a countdown score that
  builds to the buzzer (once everyone is in, the host can reveal early): tap an answer, then lock it in. Nobody sees anybody's pick.
- **Five seconds of suspense**, lights down, then the right answer lights up, the
  avatars show who picked what, and a fact appears with its official source.
- **Most right answers wins**; a tie goes to whoever was quicker on their right
  answers. Everyone has one **50:50** per show.
- **Come in late.** A small QR code stays in the corner of the stage during the
  show: scan it to watch on your phone, or take a seat if one is open.
- **Pause** (⏸ or the space bar) freezes the show on every screen; resume picks up
  with exactly the time that was left.
- Phones can fire emoji reactions that float up on the big screen.
- **Play solo** against one to four AI contestants (Casual, Sharp or Expert).

It is a static website. No build step, no accounts, no external media. The only
backend is optional: online play (The Long Road theatres and the Situation Report, Parley
and Agenda 2030 rooms) rides free public MQTT brokers, and everything else works offline.
Several brokers are used **at once** (shiftr.io on port 443, plus EMQX, HiveMQ and
Mosquitto): each browser connects to every one it can reach and sends each message
to all of them, so play carries on if a broker goes down, and it still works on
networks that block every port but 443. The list is `BROKERS` at the top of
`src/net.js`.

**Live:** https://shamoug.github.io/comgro/

Each game has its own address, so you can link straight to one:

| Game | Address |
| --- | --- |
| The chooser | https://shamoug.github.io/comgro/ |
| The Long Road | https://shamoug.github.io/comgro/longroad/ |
| Hold the Line | https://shamoug.github.io/comgro/holdtheline/ |
| Situation Report | https://shamoug.github.io/comgro/sitrep/ |
| Parley | https://shamoug.github.io/comgro/parley/ |
| Agenda 2030 | https://shamoug.github.io/comgro/agenda/ |

---

## How to play

1. Build your table: choose **2 to 4 players**, and for each seat pick **Human or
   AI**. Human seats type a name; AI seats are given a random one (with a die to
   reroll). Mix freely: solo against AI, hotseat with friends, or all AI. Also
   choose **one die or two dice** for the pace you want.
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
index.html          The chooser. Loads src/boot.js, nothing else.
longroad/index.html     The Long Road's own address (a four-line stub).
holdtheline/index.html  Hold the Line's own address.
sitrep/index.html       Situation Report's own address.
parley/index.html       Parley's own address.
agenda/index.html       Agenda 2030's own address (phones join at ?room=CODE).
src/boot.js         The one list of files the app loads, with their versions.
data/content.js     ALL game content: decks, cards, theatres, names, story.
src/audio.js        Procedural cinematic music + sound effects (Web Audio API).
src/narrate.js      Warm English narration (Web Speech API).
src/setup.js        The "build your table" roster screen (Human / AI seats).
src/game.js         The Long Road: dynamic board, dice, movement, render.
src/td.js           Hold the Line: the tower defence.
src/sitrep.js       Situation Report: the two-officer word game, its AI and rooms.
data/sitrep.js      Situation Report content: the words, scenes, clues and facts.
data/words5.js      The five-letter dictionary Situation Report accepts.
src/parley.js       Parley: the 5 by 5 rules, the AI envoy, hints and rooms.
data/parley.js      Parley content: pieces, table talk, endings and field notes.
src/agenda.js       Agenda 2030: the quiz show, its host engine, phone pads, QR rooms, score.
data/agenda.js      Agenda 2030 content: the 17 Goals and the sourced question bank.
src/net.js          Online play over a public MQTT broker (lobbies and rooms).
src/platform.js     The launcher, the game chooser and the router.
styles/styles.css   The shared stylesheet (board, dice, cards are CSS/SVG).
styles/sitrep.css   Situation Report's board, keyboard and cards.
styles/parley.css   Parley's table, tokens, reserve trays and move diagrams.
styles/agenda.css   Agenda 2030's studio, answer plates, ladder, QR wall and phone pad.
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

## License

See `LICENSE`.
