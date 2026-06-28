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
