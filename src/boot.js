/* =========================================================================
 * COMMON GROUND, boot.js
 * The one list of files the app loads.
 *
 * The site has a page per game, so every game has its own address:
 *   /            the chooser
 *   /longroad/   The Long Road
 *   /holdtheline/Hold the Line
 *   /sitrep/     Situation Report
 * Each of those pages is a four-line stub that sets <base href> and loads
 * this file, so the cache-busting ?v= numbers below are the only copy there
 * is: bump one here and every entry point picks it up.
 *
 * Scripts are inserted with async = false, which keeps them in this order
 * (an inserted script with async=false runs after the ones before it). That
 * means they may finish after DOMContentLoaded, so platform.js waits on
 * document.readyState rather than on the event alone.
 * ========================================================================= */
(function () {
  var CSS = [
    "styles/styles.css?v=43",
    "styles/sitrep.css?v=2",
  ];
  var JS = [
    // DATA: all flavour text, board layout, decks and the dictionary
    "data/content.js?v=23",
    "data/sitrep.js?v=1",
    "data/words5.js?v=1",
    // Multiplayer transport: mqtt.js over secure WebSockets to a public
    // broker. Loads online; if it is unavailable, the lobbies fall back to
    // solo play.
    "https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js",
    // LOGIC + RENDER: audio, narration, networking, the games, the lobby,
    // then the launcher. net.js loads before the games that use it.
    "src/audio.js?v=8",
    "src/narrate.js?v=4",
    "src/setup.js?v=6",
    "src/net.js?v=7",
    "src/game.js?v=53",
    "src/lobby.js?v=4",
    "src/td.js?v=11",
    "src/sitrep.js?v=2",
    "src/platform.js?v=15",
  ];

  var head = document.head || document.getElementsByTagName("head")[0];
  CSS.forEach(function (href) {
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    head.appendChild(l);
  });
  JS.forEach(function (src) {
    var s = document.createElement("script");
    s.src = src;
    s.async = false;
    head.appendChild(s);
  });
})();
