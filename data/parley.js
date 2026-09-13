/* =========================================================================
 * COMMON GROUND, PARLEY,  data/parley.js
 * Everything Parley says: the pieces and how they move, the AI envoys'
 * table talk, the lines read at big moments, and the field notes on
 * negotiation and small-board chess shown between rounds.
 * The engine (src/parley.js) never hard-codes this text.
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});

  // key: E Envoy (king), C Convoy (rook), A Airlift (knight), S Scout
  // (bishop), V Volunteer (pawn), L Coordinator (a promoted Volunteer, queen).
  CG.PARLEY_PIECES = {
    E: { name: "Envoy", icon: "🕊️", like: "the king",
      moves: "One step in any direction.",
      role: "Your delegation's voice. Lose it and the talks are lost. Walk it onto the rival's Summit and the talks are won." },
    C: { name: "Convoy", icon: "🚚", like: "the rook",
      moves: "Any distance straight: up, down, left or right.",
      role: "Rolls down open roads. Strong on an empty board." },
    A: { name: "Airlift", icon: "🚁", like: "the knight",
      moves: "Jumps in an L: two squares one way, one square to the side. Flies over anything.",
      role: "The only piece that ignores roadblocks." },
    S: { name: "Scout", icon: "🧭", like: "the bishop",
      moves: "Any distance diagonally.",
      role: "Finds the side paths nobody is watching." },
    V: { name: "Volunteer", icon: "🙋", like: "the pawn",
      moves: "One step forward, straight or diagonal. Moves and wins over the same way.",
      role: "Reach the far row and a Volunteer becomes a Coordinator." },
    L: { name: "Coordinator", icon: "🌟", like: "the queen",
      moves: "Any distance in any direction, straight or diagonal.",
      role: "A Volunteer who crossed the whole table. If won over, joins the other side as a Volunteer again." },
  };

  // What an AI envoy says while it thinks. {theatre} is the posting.
  CG.PARLEY_AI_LINES = [
    "Let me consult the delegation…",
    "Interesting proposal.",
    "Hmm. Let me read the room.",
    "One moment, checking with capital.",
    "The coffee here in {theatre} is excellent.",
    "Every square is a conversation.",
    "I see what you are doing there.",
    "Patience is a negotiating position.",
    "Let us find some common ground.",
    "Bold. Very bold.",
    "My convoy has opinions.",
    "A small step, perhaps?",
    "Nobody leaves this table empty-handed.",
    "Give me a second to draft this.",
  ];
  // When the AI wins someone over, or loses someone.
  CG.PARLEY_AI_WINOVER = ["Welcome aboard.", "They saw the merit in our position.", "Another voice for the table.", "Thank you for joining us."];
  CG.PARLEY_AI_LOSS = ["Ah. Persuasive.", "I did not see that coming.", "Fair point, well made.", "Hmm. Noted."];
  CG.PARLEY_AI_PEACE_YES = ["A handshake it is. 🤝", "Agreed. Peace is the better outcome.", "Let us sign before anyone changes their mind."];
  CG.PARLEY_AI_PEACE_NO = ["Not yet. I like my position.", "Tempting, but no.", "Let us keep talking a little longer.", "My delegation says play on."];

  // How a round can end.
  CG.PARLEY_ENDINGS = {
    capture: { icon: "🤝", title: "Envoy won over", line: "{winner} won over the rival Envoy. The talks are won." },
    summit:  { icon: "🏔️", title: "Summit reached", line: "{winner}'s Envoy walked onto the Summit. The talks are won." },
    concede: { icon: "🏳️", title: "Round conceded", line: "{loser} stepped back from the table. {winner} takes the round." },
    peace:   { icon: "🕊️", title: "Peace agreed", line: "Both delegations shook hands. Nobody loses this round." },
    stall:   { icon: "🔁", title: "Talks went round in circles", line: "The same position came up three times. The round is shared." },
    time:    { icon: "⌛", title: "Talks ran out of time", line: "A hundred and sixty moves and no agreement. The round is shared." },
  };

  // Field notes, shown between rounds. Real facts, checked.
  CG.PARLEY_NOTES = [
    "“Parley” comes from the French parler, to speak. A parley is a meeting between opposing sides to talk terms.",
    "Article 33 of the UN Charter lists the peaceful ways to settle a dispute: negotiation, enquiry, mediation, conciliation, arbitration and judicial settlement.",
    "Since 2008 the UN has kept a Standby Team of Senior Mediation Advisers, ready to deploy within 72 hours to support peace talks anywhere.",
    "The UN Guidance for Effective Mediation (2012) names the fundamentals: preparedness, consent, impartiality, inclusivity, national ownership, international law, coherence and quality agreements.",
    "Security Council resolution 1325 (2000) calls for women's full and equal participation in peace processes, at every table, at every level.",
    "The UN General Assembly declared 20 July International Chess Day in 2019, the date FIDE was founded in Paris in 1924.",
    "The International Day of Peace is 21 September. The General Assembly created it in 1981 and made it a day of ceasefire and non-violence in 2001.",
    "Martin Gardner proposed chess on a 5 by 5 board in 1969. In 2013 researchers proved that, with perfect play, his minichess is a draw.",
    "In Japanese shogi, a captured piece is not removed: it changes sides and can be placed back on the board. Parley borrows that idea: nobody is knocked out, they are won over.",
    "Dobutsu shogi, a 3 by 4 board game for children by professional player Madoka Kitao, lets a Lion win by reaching the far side, just as a Parley Envoy wins at the Summit.",
    "In the board game Onitama, a Master who reaches the rival's Temple Arch wins. Small boards love a second way to win.",
    "Good mediators separate the people from the problem: be soft on the relationship, firm on the interests.",
    "The UN Peacebuilding Commission was set up in 2005 to help countries emerging from conflict keep the peace they have made.",
    "Most peace agreements are reached step by step: ceasefire, then access, then the harder questions. Small moves build trust.",
  ];

  // Tips for beginners, shown on the briefing card.
  CG.PARLEY_TIPS = [
    "Tap one of your pieces to see where it can go. Rings mark pieces you can win over.",
    "A red ⚠ means that piece could be won over on the rival's next move.",
    "Won-over pieces wait in your reserve. Tap one to bring it back on your two home rows.",
    "Your Envoy wins by reaching the rival's Summit 🏔️. Keep a guard on your own.",
    "Stuck? Press 💡 Hint and the table's adviser will suggest a move and say why.",
    "Airlifts jump. They are the best way through a crowded table.",
    "A Volunteer that reaches the far row becomes a Coordinator 🌟, the strongest piece.",
  ];

  CG.PARLEY_EPILOGUES = {
    win: [
      "Headquarters is delighted. The agreement holds, and both sides kept their dignity.",
      "A clean result. The communiqué is already being drafted.",
      "You read the table, found the opening and took it. Well negotiated.",
    ],
    shared: [
      "Honours even. Sometimes the best outcome is that everyone goes home.",
      "No winner, no loser, and a date for the next round of talks.",
    ],
  };
  CG.PARLEY_TITLES = ["Chief Negotiator", "Senior Envoy", "Delegate"];
})();
