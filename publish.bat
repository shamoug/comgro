@echo off
REM ============================================================
REM  COMMON GROUND - publish to GitHub
REM  Commits all local changes and pushes them to GitHub, so the
REM  live site at https://shamoug.github.io/comgro/ updates.
REM
REM  Just double-click this file (or run it) whenever you want to
REM  upload a new version. It uses your saved GitHub login.
REM ============================================================
REM  CHANGELOG (newest first):
REM  2026-06-29  IN-GAME TOGGLES ARE ICON-ONLY AND ALWAYS VISIBLE. The top-bar
REM              controls (music, narration, auto cards, quit) are now clean round
REM              icon buttons with no text label; "Auto cards" text is dropped, a
REM              tooltip explains each. The control cluster sits above the theatre
REM              chip (z-index) and can't be squeezed or hidden, and the theatre
REM              chip now ellipsises instead of colliding. game.js v39, styles.css v25.
REM  2026-06-29  BIG SCORE FLASH ON EVERY POINT CHANGE. When a player gains or
REM              loses perseverance points, a large +N / -N flashes over the
REM              board for about a second then fades: green for gains, red for
REM              losses. Driven from award() in game.js (after the zero floor,
REM              so it never flashes a phantom change), styled as .score-pop.
REM              game.js v38, styles.css v24.
REM  2026-06-29  THE MAZE GAME IS REMOVED. Common Ground is now a single game,
REM              The Long Road. The Mandate (the green hedge maze) is gone:
REM              src/mandate.js deleted, its data (the CG.MANDATE_ arrays and
REM              MANDATE_STORY) stripped from content.js, and its CSS removed.
REM              The launcher no longer shows a Game Room; it boots straight into
REM              The Long Road, and the title screen drops the old Games back
REM              link. README updated to a single game. content.js v20,
REM              game.js v37, platform.js v11, setup.js v6, styles.css v23.
REM  2026-06-29  THE MANDATE STOPS DESCRIBING THE MAZE TO PLAYERS. All player-facing
REM              copy (game card, title, narration, junction and finish cards, win
REM              screen, tooltips) now talks about the path to the mission and the
REM              centre, not green hedges, castle gardens, fountains or corridors.
REM              The board still draws as a maze; only the words changed.
REM              mandate.js v24, platform.js v10, content.js v19.
REM  2026-06-29  QUIT GAME BUTTON CLOSES THE GAME (both games). The in-game HUD
REM              control is now a Quit game button (the X) that closes the current
REM              game and returns to the Game Room home screen, instead of the old
REM              New game button that restarted the same game. game.js v36,
REM              mandate.js v23.
REM  2026-06-29  HOME-STRETCH TRAP ON THE ROAD. The board now always plants one
REM              surprise in squares 95-99, and landing on it is always a genuine
REM              setback (back a few steps, into the next hole, or all the way to
REM              square one), so the final approach to the finish always carries
REM              real risk. game.js v35.
REM  2026-06-29  AUTO CARDS TOGGLE READS CLEARLY AS ON. An active toggle is now a
REM              solid blue chip with white text and a soft glow, not a faint blue
REM              tint, so the Auto cards default (on) is unmistakable at a glance.
REM              styles.css v22.
REM  2026-06-29  SURPRISE CARDS SPELL OUT THE MOVE, AUTO CARDS ON BY DEFAULT (both
REM              games). Every surprise card now prints the imposed move in plain
REM              words before the token moves: what happens, how many steps, and
REM              where to next. On the road, "As a result, you are ordered 4 steps
REM              forward to the next hole at square 58, then down you go"; in the
REM              maze, "As a result, you thread 3 corridors ahead toward the
REM              centre". The Auto cards toggle now starts switched on in both
REM              games. game.js v34, mandate.js v22, styles.css v21.
REM  2026-06-29  CARD BUTTONS CUT THE VOICE (both games). Clicking any card button,
REM              Continue, Climb, Down you go, Collect, Carry on, Play on, and the
REM              rest, now stops the ongoing narration immediately and moves on,
REM              instead of letting the voice finish first. game.js v34,
REM              mandate.js v22.
REM  2026-06-29  QUINTET CARDS EXPANDED PAST 50 PERCENT (both games). Players were
REM              finishing whole games without ever touching a UN 2.0 capability,
REM              so 140 new, web-researched ladder and hole cards were added, 14
REM              wins and 14 setbacks for each of the five capabilities: Data,
REM              Innovation, Digital, Strategic Foresight and Behavioural Science.
REM              Every new card carries an explicit "quint" and a real, sourced
REM              field fact (DTM, HDX, anticipatory action triggers, Building
REM              Blocks, U-Report, Early Warnings for All, behavioural nudges, and
REM              more). Ladder and hole decks are now about 55 percent Quintet
REM              relevant, up from a third, and Innovation went from 2 cards to 30.
REM              English only, no em or en dashes (verified). content.js v18.
REM  2026-06-29  CLAP FOR WINS, BUZZER FOR SETBACKS (both games). Successes now get
REM              a warm burst of synthesised applause: climbing a ladder (a shortcut
REM              in the maze) and finishing the game. Setbacks (sliding down a snake,
REM              getting lost in the hedges) get a gentle two-note buzzer. Both are
REM              generated in-browser, no audio files, and only sound when music is
REM              on. audio.js v5, game.js v31, mandate.js v19.
REM  2026-06-29  SURPRISES ALWAYS MOVE YOU (both games). A surprise card no longer
REM              just hands a bonus or a skipped turn: it always sends you
REM              somewhere. Usually a hop forward or back; sometimes to the next
REM              ladder or into the next hole; and once in a blue moon all the way
REM              to the finish (square 100) or right back to square one. The card's
REM              mood (a "skip" card is the bad news) tilts which way, but either
REM              way can happen, and the landing square is then resolved so a
REM              ladder still climbs and a hole still drops. The Mandate maze
REM              mirrors it: threads you toward the centre or loses you in the
REM              hedges, to the next shortcut or the next trap, and rarely to the
REM              centre itself or back to your gate. game.js v30, mandate.js v18.
REM  2026-06-29  QUINTET IMPACT IS NOW RELEVANT, NOT RANDOM (both games). A card
REM              only strengthens or sets back a UN 2.0 capability when its fact
REM              genuinely demonstrates one. The old map forced every theme into a
REM              capability (funding -> Innovation, governance -> Data, access ->
REM              Innovation) and picked at random for the rest, which made no sense.
REM              Now the mapping is principled: data -> Data, digital -> Digital,
REM              foresight/climate/flood/storm/drought -> Strategic Foresight,
REM              info/behaviour -> Behavioural Science, and two clearly-innovation
REM              cards carry an explicit Innovation tag. Operational themes (funding,
REM              access, governance, health, displacement, supply, community, youth,
REM              any) demonstrate no single capability, so they touch none: the
REM              meter only moves for a reason. The random fallback is gone. A card
REM              can still name its own capability with an explicit "quint" field.
REM              Perseverance points are still banked for every climb or setback.
REM              content.js v17, game.js v29, mandate.js v17.
REM  2026-06-29  CARD READING PACE (both games). Auto cards never advances before
REM              the whole card has been read: with narration on it waits for the
REM              narrator to finish the entire line; with narration off it holds
REM              long enough to read the card through, scaled to its text (up to 14
REM              seconds), instead of a flat short pause. Manual proceed is now free:
REM              the Continue button stays live the moment a card appears, so the
REM              user can click on without waiting for the reading. game.js v28,
REM              mandate.js v16.
REM  2026-06-29  AUTO TOGGLE NOW GOVERNS THE CARDS ONLY, NOT THE DIE (both games).
REM              Refined the day's earlier toggle: the board control is now "Auto
REM              cards" and decides only whether the event cards (Continue, Climb,
REM              Down you go, Carry on, Pocket them, Lost again...) advance by
REM              themselves or wait for a click, for Human and AI alike. The die
REM              roll is never affected: the AI always rolls itself and the Human
REM              always clicks Roll, with no toggle on that. game.js v27,
REM              mandate.js v15.
REM  2026-06-29  AUTO-PLAY TOGGLE + SURPRISE JUMPS (both games). A new "Auto"
REM              toggle sits in the board's top controls and can be flipped at any
REM              time. Off (default) every seat, Human and AI, waits for the user
REM              to click Roll, and every card waits for a Continue click; on, the
REM              whole table rolls and turns the cards by itself, hands free.
REM              Surprises now, now and then (about 30 percent), sweep a player to
REM              the next landmark by the mood of the card: good news to the next
REM              ladder, trophy or diamond ahead; bad news to the next hole, or
REM              once in a while right back to square one. The Mandate maze mirrors
REM              this: good news warps to the next shortcut/trophy/diamond toward
REM              the centre, bad news to the next trap or back to the gate. Most
REM              surprises still play out as their plain effect. game.js v21,
REM              mandate.js v14.
REM  2026-06-28  The "Play" button on each launcher game card now sticks to the
REM              lower bottom of the card, at the same vertical location on both
REM              cards. The cards stretch to equal height in the grid, so a
REM              margin-top:auto on the Play pill pins it to the bottom regardless
REM              of how long each game's description runs. (Reverted the earlier
REM              title-screen fixed-button experiment.) styles.css v20, game.js
REM              v20, mandate.js v13.
REM  2026-06-28  KNOWLEDGE BASE GREATLY ENRICHED (web-researched), so the games
REM              teach new UN staff far more about the UN's overseas field work.
REM              Roles 68 -> 257 (real job titles across UNHCR, UNICEF, WFP, WHO,
REM              FAO, OCHA, IOM, UNDP, UNFPA, UN Women, OHCHR, UNEP, UN-Habitat,
REM              UNESCO, ILO, UNODC, UNAIDS, DPPA/DPO, RC system and partners).
REM              Crisis theatres 27 -> 63. Field-note facts 125 -> 1144. Hole
REM              cards 73 -> 149, ladder cards 64 -> 138, diamonds 23 -> 54,
REM              surprises 35 -> 65, trophies 27 -> 57. Every new card carries a
REM              tag, and CG.ROLE_TAG_RULES was extended to cover the wider roster
REM              (development, peace, environment, economy, statistics, etc.) so
REM              each player still draws role-relevant cards. English only, zero em
REM              or en dashes (verified). content.js v16.
REM  2026-06-28  PLAYER-CUSTOMISED JOURNEYS (rule for all games, now and future).
REM              Every card a player draws is now biased to their own job title
REM              and affiliation, on top of the scenario (theatre) they were
REM              posted to. A new CG.roleTags() infers each role's field domains
REM              (health, funding, supply, displacement, access, data, etc.) from
REM              the job title and agency; weightedDraw weights matching cards up
REM              (role x4, scenario x2) so a WASH specialist in a flood delta
REM              draws roughly 3x more water/health cards than a generic player.
REM              The bias now covers ALL decks (holes/ladders, golden coins/traps,
REM              trophies, diamonds, surprises), not just holes and ladders. Cards
REM              can also address the player by {role}, {aff} and {theatre}.
REM              Applied symmetrically to both games. content.js v15, game.js v18,
REM              mandate.js v11.
REM  2026-06-28  Maze polish. (1) The shortcut "ladder" cells are now GOLDEN
REM              COINS (🪙) on the board, in the legend and on the card (band
REM              "GOLDEN COINS"); the mechanic is unchanged (a coin trail that
REM              carries you toward the centre). (2) Every walkable cell now shows
REM              a paving TILE, so each step a player takes reads as one physical
REM              tile along the corridor (121 stepping tiles drawn under the
REM              hedges in the maze SVG). mandate.js v10.
REM  2026-06-28  THE MANDATE IS NOW A MAZE. Replaced the winding-road / spinner
REM              game with a random green castle hedge maze. Each player enters
REM              from a different gate (North/South/East/West) and threads the
REM              corridors to the fountain at the centre, where the mission is
REM              accomplished; it is solved only when the LAST player arrives.
REM              The maze is a fresh perfect maze every game (randomised DFS,
REM              lightly braided), so a path to the centre always exists. Runs on
REM              The Long Road's exact mechanics and decks: roll a die, spend
REM              every step (so the dice push you past turnings and you get lost),
REM              choose at junctions. Shortcuts (secret passages) cut you toward
REM              the centre and strengthen a UN 2.0 capability; traps get you lost
REM              and set one back; trophies, diamonds, surprises and field notes
REM              are the same shared decks. End-game crowns Speed / Perseverance /
REM              Quintet champions. Updated narration, platform card and title
REM              copy. mandate.js v9, styles.css v18, content.js v14,
REM              platform.js v9.
REM  2026-06-28  Mobile polish, three fixes. (1) Header no longer truncated:
REM              the launcher and title/deal screens used vertical centring that
REM              clipped the logo and title off the top on short phones; switched
REM              to "justify-content: safe center" so the top stays reachable.
REM              (2) Cards never spill off-screen: an event card now caps at the
REM              viewport height and scrolls inside itself, so a long card keeps
REM              its Continue button reachable instead of running past the edge.
REM              (3) The pawn no longer moves mid-narration: for a human, the
REM              Continue button is held disabled while the voice is still reading
REM              the card, then released when it finishes (a 20s safety frees a
REM              stuck voice). Applies to both games. styles.css v17, game.js v17,
REM              mandate.js v8.
REM  2026-06-28  Logic parity + enriched knowledge base. (1) Ported The Long
REM              Road's end-game "Champions" celebration to The Mandate: it now
REM              crowns Speed (first home), Legacy (deepest legacy) and a champion
REM              for each UN 2.0 capability, shown on the final card and read
REM              aloud. The Mandate's event/resource cards now also speak the
REM              capability they move, matching the on-card Quintet block.
REM              (2) Enriched data/content.js from current sources (GHO 2025,
REM              UN 2.0, CERF/pooled funds, anticipatory action, displacement,
REM              cash, aid-worker security, IPC famine, Grand Bargain, Pact for
REM              the Future): +6 hole cards, +6 ladder cards, +13 field notes,
REM              +6 Mandate events, +4 crossroads, +3 milestones, +6 resource
REM              cards, +3 theatres, +6 roles. content.js v13, mandate.js v7.
REM  2026-06-28  The Mandate, three refinements. (1) Setbacks can now send a
REM              player back more than one square: the worst crises step back 2
REM              or 3 (Convoy Attacked -3, Visas Denied / Storm / Port -2). (2)
REM              The UN 2.0 Quintet of Change is now visible when a movement
REM              touches it: event and resource cards show a "strengthened / set
REM              back" block, decision options show a capability chip, a toast
REM              names it, and its chip in the standings panel pulses. Bad events
REM              now set a capability back instead of building it. (3) Identity
REM              banner on every card in BOTH games now shows the affiliation as
REM              a clean org/agency badge (short name, e.g. UN RCO) beside the
REM              player name and title. content.js v12 (CG.affShort + bigger
REM              setbacks), mandate.js v6, game.js v16, styles.css v16.
REM  2026-06-28  Every in-play card in BOTH games now carries an identity
REM              banner at the top, showing whose turn it is: the player's
REM              name, job title and affiliation, tinted in their token colour.
REM              Covers event, ladder/snake, resource, milestone, crossroads,
REM              fork and field-note cards. game.js v15, mandate.js v5,
REM              styles.css v15 (new .ec-who styles).
REM  2026-06-28  The Mandate: livelier, longer road. Five rows / 35 stations
REM              (was four / 28), TWO real forks instead of one, and a mix that
REM              leans on crossroads, events and milestones so the journey stays
REM              eventful. Job title now shows under each player's name in the
REM              Mandate standings. NEW: hover (or tap) any player token or
REM              standings row in BOTH games to see a card with their name, job
REM              title, affiliation, score and personal Quintet of Change. Added
REM              an "affiliation" to every role in content.js. mandate.js v5,
REM              game.js v15, setup.js v5, content.js v11, styles.css v15.
REM  2026-06-28  Mercy intervention now counts tries only once a player has
REM              reached square 90 (was: within one roll of 100). game.js v13.
REM  2026-06-28  The Long Road now always ends. Exact-landing on 100 is kept,
REM              but after 8 failed tries from finishing range (overshoot/bounce,
REM              or the impossible square 99 with two dice) the field steps in and
REM              rolls the player home. Fixes the endless climb-bounce-snake loop
REM              on the home stretch. game.js v12.
REM  2026-06-28  Final standings: show only "Champions of the Road"
REM              (removed the per-player ranking list). Tap/click outside
REM              any card to close it. Pull-to-refresh on touch screens
REM              (hard, cache-busted reload). game.js v11, styles.css v13,
REM              platform.js v8.
REM ============================================================
setlocal
cd /d "%~dp0"

echo.
echo   =========================================
echo     COMMON GROUND - Publish to GitHub
echo   =========================================
echo.

REM --- Make sure this folder is a git repo ---
if not exist ".git" (
  echo   This folder is not a git repository yet. Setting it up...
  git init -b main
  git remote add origin https://github.com/shamoug/comgro.git
)

REM --- Make sure the remote exists ---
git remote get-url origin >nul 2>nul
if errorlevel 1 (
  git remote add origin https://github.com/shamoug/comgro.git
)

REM --- Stage everything (the entire game: all files in this folder) ---
git add -A

REM --- Show what is going up so you can see the whole game is included ---
echo   Files in this upload:
git ls-files
echo.
for /f %%C in ('git ls-files ^| find /c /v ""') do set "FILECOUNT=%%C"
echo   Total: %FILECOUNT% files will be on GitHub.
echo.

REM --- Build a commit message: use the first argument if given, else a timestamp ---
set "MSG=%~1"
if "%MSG%"=="" set "MSG=Update Common Ground (%DATE% %TIME%)"

REM --- Commit (skip cleanly if there is nothing to commit) ---
git diff --cached --quiet
if %errorlevel%==0 (
  echo   No changes to commit. Pushing anything unpushed...
) else (
  git commit -m "%MSG%"
  if errorlevel 1 (
    echo   Commit failed. Stopping.
    goto :end
  )
)

REM --- Push to GitHub ---
echo.
echo   Pushing to https://github.com/shamoug/comgro ...
git push -u origin main
if errorlevel 1 (
  echo.
  echo   Push failed. If you were asked to log in, complete the login
  echo   and run this file again. You can also push from GitHub Desktop.
  goto :end
)

echo.
echo   Done. Your changes are uploaded.
echo   The live site will refresh in about a minute:
echo     https://shamoug.github.io/comgro/
echo.

:end
pause
endlocal
