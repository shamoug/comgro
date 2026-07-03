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
REM  2026-07-03  HOLD THE LINE v8: GLOWING RED BULLETS + EXPLOSIONS. The shots a sector
REM              fires at a crisis are now glowing red rounds (a white-hot centre, a red
REM              core and a soft red halo) that leave a short fading ember trail as they
REM              streak to the target, instead of the old flat dots. On impact they burst
REM              into a fiery explosion: a bright expanding flash ring plus a scatter of
REM              embers (more for the splashing Logistics hits) that fly out and fade.
REM              Pure canvas, no images. Verified: bullets render glowing red (core
REM              confirmed by pixel), carry a trail, and every hit throws a flash and
REM              embers, with no render errors. td.js v8.
REM  2026-07-03  HOLD THE LINE v7: SECTORS WEAR OUT AND MUST BE MAINTAINED. Every
REM              sector now decays as it works. While a wave is on, a partner loses one
REM              condition mark (the level dots) every 26 seconds, stepping down 3, 2, 1,
REM              silently, shown by the dots emptying and, on the last mark, a pulsing
REM              warning ring. When the last mark is gone the sector VANISHES and you are
REM              told (a toast, the first sound in the whole cycle, "X has worn out and is
REM              gone. Rebuild it."). Reinforcing (the old Upgrade button, now labelled
REM              Reinforce) restores a mark and resets the clock, so you keep partners up
REM              or rebuild when they go. Decay pauses between waves so setup is safe. The
REM              inspector shows a Condition readout and the intro explains the wear.
REM              Verified: no decay in prep; 3->2->1->vanish over ~78s of wave time with
REM              the announcement; reinforce restores and resets; and a maintained run
REM              stays winnable at every tier with zero breaches. td.js v7.
REM  2026-07-03  HOLD THE LINE v6: SECTORS MATCH THE POSTING. The sectors you can
REM              build are now chosen to fit the theatre's crisis types, instead of
REM              always offering all eight. Each sector is mapped to the crises it is
REM              made for (WASH to floods and outbreaks, Logistics to supply and access,
REM              Risk Communication to rumour and governance, Protection to conflict and
REM              displacement, Early Warning to sudden-onset hazards, Health to disease),
REM              and a posting offers the ones its own hazards call for. There are always
REM              at least THREE crisis-fighting sectors (topped up when a theatre's tags
REM              match fewer, so the roster is always viable under the same-type spacing
REM              rule), plus the universal Coordination Hub and Pooled Fund. The intro
REM              lists the sectors this posting fields. Verified across all 84 theatres:
REM              min 3 crisis sectors (5 total) with fund + coord always present, rosters
REM              differ by theatre, the shop shows exactly the offered set, and a run
REM              stays winnable using only the offered sectors. td.js v6.
REM  2026-07-03  HOLD THE LINE v5: ONE BREACH LOSES. The game no longer runs on a
REM              Resilience pool. Now a single crisis reaching ANY community loses the
REM              game outright: the line has to hold perfectly. The loss card names the
REM              crisis and the community it broke through ("Diphtheria Returns to the
REM              Camp reached Lower Faro"), the win card notes every community was left
REM              untouched, the top-bar stat reads the number of communities with a
REM              "no breach" note, and the intro spells out the rule. Verified: the
REM              first crisis through loses immediately, while a fully covered run still
REM              wins with zero breaches. td.js v5.
REM  2026-07-03  HOLD THE LINE v4: OFF-BOARD PLACES ON EVERY EDGE, SECTOR SPACING.
REM              (1) The crisis source and every community now sit OUTSIDE the board,
REM              each on a DIFFERENT edge (top / right / bottom / left): no two
REM              communities share a side, and the source takes its own edge. Roads
REM              enter from the source edge, meet at a central hub and branch out to
REM              each community's edge, so the branches fan away from one another and
REM              use the whole space. (2) The source and communities are drawn as ROUND
REM              icons (a circle with the place icon and an "i" hint), tappable as
REM              before for their story. (3) Roads no longer end in a rounded stub: they
REM              use flat (butt) end caps and tuck under the round icons, with smooth
REM              rounded corners kept. (4) SECTOR SPACING: two sectors of the SAME type
REM              can no longer sit within each other's radius, so the same partner must
REM              be spread out; picking a sector shows the exclusion rings of its own
REM              kind and blocks an overlapping placement. (5) the board reserves a
REM              margin so the off-board icons and their name labels have room, on both
REM              the wide and the tall (phone) layouts. Verified: endpoints land on
REM              distinct edges outside the board every game, branches share a trunk,
REM              same-type placement is blocked while different types and far same-type
REM              are allowed, and a full run stays winnable at every tier. td.js v4.
REM  2026-07-03  HOLD THE LINE v3: RICHER ROADS, MOBILE, NAMED PLACES, MORE SECTORS.
REM              (1) MOBILE: the board now fits the device. On a tall phone the road
REM              network flows top to bottom on a taller grid; on a wide screen it flows
REM              left to right as before. The HUD is compact and the sector shop scrolls
REM              horizontally so all eight fit any width. (2) BETTER BRANCHING: roads
REM              fork off a shared trunk and now fan out evenly across the whole width,
REM              each branch peeling off at its own point so communities sit well apart
REM              and the space is used. (3) NAMED, CLICKABLE PLACES: the crisis source
REM              and every community are drawn as labelled pads with an icon and an info
REM              hint. Tap the source to read the story of the crisis type massing there;
REM              tap a community to see its name, what kind of place it is, its population
REM              and a short history, all generated fresh per game. (4) THREE NEW SECTORS,
REM              eight in all: WASH & Water (UNICEF, splashes a cluster, strong on water
REM              crises), Risk Communication (WHO / UNESCO, long reach, counters rumour),
REM              and Early Warning (WMO / anticipatory action, no attack, slows every
REM              crisis in range). (5) road rendering redrawn with a soft casing, darker
REM              edge, warm body and a dashed centre line, plus rounded named end pads.
REM              Verified: valid branching both orientations, lanes fan out, endpoints
REM              open their cards, new sectors work, and a full run stays winnable at
REM              every tier. td.js v3, styles.css v40, index.html bumps the versions.
REM  2026-07-02  HOLD THE LINE v2: DYNAMIC ROADS, MANY COMMUNITIES, LIVE ECONOMY.
REM              A big pass on the new tower defence. (1) DYNAMIC MAP: the road
REM              network is now drawn fresh for every game (like The Long Road's board),
REM              a source on the left and meandering roads to the right. (2) ONE TO
REM              THREE COMMUNITIES: each game now protects a random 1 to 3 communities,
REM              each at the end of its own road; crises split across the roads and a
REM              leak at any community costs Resilience (Overstretched can face three).
REM              (3) TAP A CRISIS: click any crisis on the road to freeze the field and
REM              read what it is, its real field fact and all. (4) RUNNING COST: every
REM              partner now costs Funding per second from the moment it is placed, not
REM              only to install; the top bar shows a live net rate (green up, red down).
REM              (5) POOLED FUND SECTOR: a new build, the Pooled Fund (OCHA / donors),
REM              generates income and pays the running cost of the partners near it
REM              first, adding any surplus to the treasury; unfunded partners draw from
REM              the treasury and go offline (greyed, no fire, no cost) if it runs dry.
REM              (6) MONEY FLOWS SHOWN: animated green beads run from each Pooled Fund
REM              to the partners it pays, every item shows its own +/- per second, and
REM              kills pop their reward, so money to and from each item is visible.
REM              Scenario, threats and map are all dynamic per game. Balance holds: a
REM              full 12-wave run stays winnable and solvent. td.js v2, styles.css v39,
REM              index.html bumps the versions.
REM  2026-07-02  SECOND GAME: HOLD THE LINE (A TOWER DEFENCE). Common Ground now has
REM              two games, chosen from a new home screen (platform.js): The Long Road
REM              (the existing Snakes and Ladders, solo or multiplayer) and Hold the
REM              Line, a brand new solo tower defence. In Hold the Line, waves of named
REM              crises (the same CG.SNAKE_CARDS as The Long Road, so floods, cholera,
REM              a cyclone, a new frontline, a stuck appeal, and the rest) march down a
REM              road toward the community you protect. You spend Funding to place five
REM              UN partner archetypes along the road: Health Response (WHO/UNICEF,
REM              fast, strong against disease), Logistics Cluster (WFP, slows and hits
REM              a whole cluster), Protection and Peace (UNHCR/DPO, long reach, heavy
REM              hits, strong against conflict), a Coordination Hub (OCHA/RCO, no
REM              attack, Delivering as One, buffs nearby partners) and Recovery and
REM              Resilience (UNDP, light attack and earns Funding). Towers upgrade and
REM              sell; crises have tag-based speed and toughness and take bonus damage
REM              from the partner suited to them; every fourth wave is led by a major
REM              crisis (a boss). The chosen theatre's own hazards bias each wave. Hold
REM              the line through every wave to deliver the mandate; let the community
REM              be overrun and the response regroups. Between waves, a real field fact
REM              is shown and read aloud. Reuses the shell: synth music and narration
REM              (CG.Audio / CG.Narrate), the theatres and crisis decks in content.js,
REM              and the overlay-card / title-screen looks. The field is one canvas;
REM              the HUD, shop and cards are DOM on top. Solo for now (the MQTT lobby
REM              stays Long-Road only). English only, no em or en dashes. NEW src/td.js
REM              v1; platform.js v13 (the game chooser); styles.css v38 (home + tower
REM              defence styles); index.html loads td.js.
REM  2026-07-02  CHAT MOVES TO A TOP-BAR BUTTON + CENTRED CHAT WINDOW; PAWN DOTS GONE.
REM              (1) The chat is no longer a corner dot: a round chat button (a chat
REM              icon) now sits in the top bar, before the music toggle. A small red
REM              notification dot lights on it when a message arrives while the chat
REM              is closed, and clears when you open it. (2) Pressing the button opens
REM              a proper chat window centred on the screen over a dimmed backdrop,
REM              closed by the X, the backdrop, or Escape. The window is larger and
REM              cleaner, with colour-coded avatars and names for others, blue bubbles
REM              for you, and messages that wrap on whole words (no more mid-word
REM              breaks). (3) Removed the little red dots from the player pawns; a
REM              token still shows its name for a couple of seconds after it settles
REM              and on hover, just without the dot. game.js v52, styles.css v36.
REM  2026-07-02  PLAYERS LIST REVERTS TO ALWAYS-ON; CHAT KEEPS ITS DOT AND GETS A
REM              VISUAL GLOW-UP. Undid the red-dot treatment on the players list: it
REM              is simply shown again while no token is moving (and tucks away only
REM              during a move, as before), with no dot and no flash / hover / pin
REM              logic. The chat keeps its blue top-right dot and the same behaviour
REM              (flash open on a new message, hover to peek, click to pin). The chat
REM              box itself was redesigned: a frosted, rounded panel with a soft
REM              header, colour-coded avatars and sender names on other people's
REM              messages, blue gradient bubbles for your own, a pill input and a
REM              circular send button. game.js v51, styles.css v35.
REM  2026-07-02  FLOATING TABLE CHAT, AND BOTH SIDE PANES NOW DOCK TO A CORNER DOT.
REM              (1) Online games gain a floating chat box on the right, opposite the
REM              players list. Messages travel on their own live (non-retained) MQTT
REM              topic, separate from the game state, so a message never collides
REM              with a turn write; every browser in the theatre sees each message in
REM              real time. (2) The players list and the chat now share one
REM              "collapsible pane" behaviour: each lives as a small coloured dot in a
REM              screen corner (red top-left for players, blue top-right for chat) and
REM              only opens when triggered, for two seconds, then tucks away again.
REM              The players list flashes open when a move settles; the chat flashes
REM              open when a message arrives. Either pane also opens while you hover
REM              its dot or body, and a click on the dot pins it open until you click
REM              again. Chat shows only online; the players dot works solo and online.
REM              net.js v6 (onChat / stopChat / sendChat), game.js v50 (createDock,
REM              chat), styles.css v34.
REM  2026-07-02  NAME TAGS THAT TUCK AWAY, HOST CAN HAND ANY SEAT TO THE AI, AND THE
REM              designer byline is removed. (1) A token now flashes its player's
REM              name for two seconds whenever it settles (after every move), then
REM              tucks the name behind a small red dot in its top-left corner so the
REM              board stays clean; hovering the token (the dot is the hint) brings
REM              the name back, and leaving hides it again. (2) The theatre's creator
REM              (the host) now sees a small robot button on every live human seat in
REM              the standings and can hand that seat to the field at any moment: the
REM              player becomes an AI the host drives, and, being an AI seat again,
REM              their character re-opens in the lobby for a newcomer to take over. So
REM              players who have wandered off can be replaced, and latecomers can
REM              assume an existing character. (3) Removed the "Designed by Digital
REM              Solutions Lab" byline from the title, board, lobby login and lobby
REM              list screens and from the README. game.js v49, lobby.js v4,
REM              styles.css v33.
REM  2026-07-01  SCENARIO -> TITLE -> CARD -> QUINTET CHAIN TIGHTENED, plus a batch
REM              of web-verified facts. The draw now reads the theatre's KIND
REM              (humanitarian / development / peacekeeping): cards written for a
REM              specific kind surface only in that posting, while generic (no-kind)
REM              cards remain the fallback in every scenario, so a peace theatre
REM              draws peace cards and a development theatre draws development cards.
REM              Job-title and theatre tags now weight the draw more strongly (role
REM              +3, theatre +2), with a never-empty pool fallback. Fixed the chain
REM              so innovation-tagged cards actually move the Innovation capability
REM              (added the innovation self-map to QUINTET_BY_TAG). Added 12
REM              peacekeeping and 12 development cards (holes + ladders) and ~25 new
REM              generic holes / ladders / field-note facts, each checked against UN,
REM              OCHA, UNHCR, WHO, ILO, World Bank, IPC, CERF, FAO and UN DPO sources
REM              (e.g. CERF's six-minute 2024 Nepal release, 122M+ displaced, 850M
REM              without legal identity, 14.3M zero-dose children, corruption ~5% of
REM              GDP, mine casualties, 25% localization target). English only, no em
REM              or en dashes. content.js v23, game.js v48.
REM  2026-06-29  MORE DEVELOPMENT AND PEACEKEEPING THEATRES (web-researched). The
REM              theatre roster was almost all Humanitarian, so 21 new fictional
REM              composite scenarios were added and tagged with an explicit type:
REM              11 Development (a reform capital with an anti-corruption court, a
REM              first credible election, digital ID rollout, a youth-jobs coast,
REM              public-finance reform, climate-adaptation finance, decentralisation,
REM              a first census, a court backlog, off-grid energy, a social safety
REM              net) and 10 Peacekeeping (a buffer/blue line, DDR of ex-combatants,
REM              a monitored ceasefire, a returnee corridor through mined ground, a
REM              stabilised town, mine clearance, reconciliation, civilian-protection
REM              patrols, a power-sharing transitional capital, herder-farmer
REM              mediation). Grounded in UNDP priorities and UN DPO mandate tasks.
REM              The mix is now 48 Humanitarian / 20 Development / 16 Peacekeeping.
REM              English only, no em or en dashes. content.js v22.
REM  2026-06-29  OPPONENTS WALK, THEY DO NOT TELEPORT. A watched player's token now
REM              steps square by square along the board path (like your own does),
REM              instead of gliding straight to the final square in one hop. A big
REM              jump (a ladder or hole slide) still glides directly rather than
REM              crawling through dozens of squares, and the watch card now waits
REM              for the walk to finish before it covers the board. Fixes maybeAct
REM              rebuilding the tokens mid-animation (which had been snapping them).
REM              game.js v47.
REM  2026-06-29  WATCHERS SEE THE WHOLE TURN (movement + the actual card). Other
REM              players' turns are no longer a silent snap to the final square.
REM              The acting browser now broadcasts each beat of its turn in the
REM              shared state, tagged with a rising beat number: the die roll and
REM              whatever card it drew (ladder, hole, trophy, diamond, surprise,
REM              field note), with the real card content and the Quintet nudge. On
REM              every other browser the player's token GLIDES between squares (so
REM              the move is visible) and a read-only "watch" card of what they drew
REM              pops up ("watching <name>"), clearing itself after a few seconds or
REM              on a click. A late joiner does not replay the beat in progress.
REM              Possible now that the transport is MQTT (no write throttling), so a
REM              turn can write several beats. game.js v46, styles.css v32.
REM  2026-06-29  COMPACT AGAIN. The previous visibility pass overshot: fonts and
REM              dimensions got too big and started forcing scrollbars. Dialed it
REM              all back to compact. The floating cards shrink (icon 90->54, title
REM              37->23, body text down a couple of px, width 640->420) and the
REM              wide-screen card-upscaling block is removed entirely; standings,
REM              the die, the deal cards and the lobby cards/header are all trimmed
REM              to compact sizes. The cards still cap at the viewport height and
REM              scroll inside themselves ONLY when the screen genuinely cannot fit
REM              them, so on any normal screen there is no scrollbar at all (the
REM              longest theatre-story card now fits without scrolling). CSS only,
REM              styles.css v31.
REM  2026-06-29  JOIN RULES, TAP THE THEATRE NAME, AND A CLEAN EXIT. (1) Only AI
REM              seats can be taken over now: a seat a human holds (even one who
REM              stepped away) stays theirs until the host hands it back to the AI,
REM              so newcomers can no longer bump a real player. The lobby and the
REM              join screen both reflect this (human seats show "in play"). (2) The
REM              theatre name in the top bar is now a button: tap it any time to
REM              re-read the theatre's background story (on desktop and mobile, the
REM              name is shown and tappable; the brand collapses to the diamond on
REM              phones to make room). (3) Leaving a game now fully stops it: any
REM              in-flight turn, scheduled AI move, or card is cut off (S.over set,
REM              the board torn down, the card renderers guard on a live board), so
REM              no cards, score flashes or updates from the game you left ever pop
REM              up over the lobby. game.js v45, lobby.js v3, styles.css v30.
REM  2026-06-29  ONE DIE ONLY + BIGGER, CLEARER CARDS AND COMPONENTS. Removed the
REM              two-dice option everywhere: the game is always a single die (the
REM              title-screen dice picker is gone, doubles are gone, onRoll and the
REM              dock simplified to one die). Visibility pass across every surface:
REM              the floating event/note/finish cards are larger with bigger type
REM              and a stronger dimmed backdrop, and on wide screens they grow again
REM              (up to 640px, 90px icon, 37px title) so they command the space
REM              instead of floating small; standings, dice, the deal cards and the
REM              lobby theatre cards are all enlarged for legibility. Code cleanup:
REM              fixed a latent .theatre-card class collision (deal vs lobby) by
REM              scoping both, and removed dead CSS (the old game-room launcher,
REM              the mode-row buttons, and the retired final-standings list). game.js
REM              v44, styles.css v29.
REM  2026-06-29  THEATRE BACKGROUND STORY ON JOIN / SOLO START. Every Crisis Theatre
REM              is now classed as one of three kinds, Humanitarian, Development or
REM              Peacekeeping, shown as a colour-coded badge, and carries a one
REM              paragraph background story (the place, the kind of mandate, and the
REM              challenges its decks will throw at the team). It appears on the
REM              lobby Join screen before you take a seat, on the solo Deal screen,
REM              and as the host's entry card when opening a theatre. Kind is set by
REM              two short name lists (CG.THEATRE_DEV / CG.THEATRE_PEACE), defaulting
REM              to Humanitarian; the story is built by CG.theatreStory(). content.js
REM              v21, game.js v43, lobby.js v2, styles.css v28.
REM  2026-06-29  MULTIPLAYER ACROSS BROWSERS (Crisis Theatres lobby). The game now
REM              opens on a login screen: name yourself, then see the live list of
REM              Crisis Theatres other players have open on other browsers. Open
REM              your own theatre (you take seat one, the rest start as AI), or
REM              join one and take over an AI seat, forcing your own name onto it.
REM              Several humans play the one board together: only the player whose
REM              turn it is rolls, the host drives the AI seats, and everyone sees
REM              each move in real time. A "Solo vs AI" path is kept. Games left
REM              idle for over ten minutes are pruned from the lobby on login, and
REM              a dropped player's seat is handed back to the AI so the road never
REM              stalls. Shared state travels over a free, no-account public MQTT
REM              broker (EMQX) using retained messages, loaded via mqtt.js; the
REM              lobby/game data is public and best-effort (the no-account
REM              tradeoff). NEW src/net.js, src/lobby.js; game.js v42 (online turn
REM              engine), platform.js v12 (boots into the lobby), styles.css v27
REM              (lobby + join styles), index.html adds mqtt.js + the new scripts.
REM  2026-06-29  SURPRISE NEWS NOW MATCHES ITS MOOD. Fixed the surprise-card logic
REM              so good news only ever helps and bad news only ever hurts. Good
REM              news now sends you forward, up to the next ladder, or (rarely) to
REM              the finish, never into a hole or back. Bad news now sends you back,
REM              down into the next hole, or (rarely) to square one, never forward,
REM              up a ladder, or to the finish. Bad news can no longer be a bonus.
REM              game.js v40.
REM  2026-06-29  TOGGLE ON-STATE IS LIGHT BLUE, NOT DARK. An active toggle now
REM              fills with a soft light-blue (#dce8ff) and dark-blue text/border
REM              instead of solid dark blue, while still reading clearly as on.
REM              styles.css v26.
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
