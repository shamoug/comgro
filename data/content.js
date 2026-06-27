/* =========================================================================
 * COMMON GROUND, THE LONG ROAD,  content.js
 * All game content in one place: the board layout (snakes & ladders), the
 * shuffleable decks (job titles, crisis theatres, snake cards, ladder cards),
 * and the field-note fun facts. Designers edit ONLY this file to change the
 * story; the engine (game.js) never hard-codes any flavour text.
 *
 * A "snake" is a setback (a crisis): you slide DOWN, and the card tells you
 * why, with a real-world fun fact. A "ladder" is momentum (funding, an
 * agreement, an opening): you climb UP, and the card tells you why.
 * English only. No external assets.
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});

  /* ----------------------------------------------------------------------
   * THE BOARD,  100 squares, numbered boustrophedon (1 bottom-left).
   * Square 1 = Day One on the tarmac. Square 100 = Mandate Complete.
   * Ladders climb from a lower square to a higher one; snakes slide from a
   * higher square down to a lower one. Keep heads/tails/feet all distinct.
   * -------------------------------------------------------------------- */
  CG.BOARD = {
    size: 100,
    cols: 10,
    // bottom -> top (you CLIMB)
    ladders: {
      2: 23,
      8: 30,
      15: 44,
      21: 42,
      28: 54,
      36: 57,
      51: 73,
      71: 92,
      80: 99,
    },
    // head -> tail (you SLIDE DOWN)
    snakes: {
      16: 4,
      32: 11,
      47: 19,
      56: 38,
      62: 41,
      64: 27,
      87: 69,
      93: 70,
      95: 75,
      98: 79,
    },
    // bonus squares you land ON (no chute), each draws its own kind of card.
    trophies: [13, 49, 67, 84],        // recognition: collect a trophy + roll again
    diamonds: [9, 34, 58, 76, 89],     // treasure: collect a gem + hop forward
    surprises: [6, 26, 45, 63, 82, 91],// a mystery card: could help or cost you
    fieldNotes: [12, 40, 60, 77],      // a fun fact, no movement
  };

  /* ----------------------------------------------------------------------
   * JOB TITLES,  drawn once per player at setup (your avatar this game).
   * -------------------------------------------------------------------- */
  CG.ROLES = [
    { icon: "🧭", name: "Resident Coordinator", tag: "The connector. No orders, only influence." },
    { icon: "📊", name: "Data Officer", tag: "Turns numbers into decisions." },
    { icon: "⚖️", name: "Human Rights Officer", tag: "Makes sure no one is left behind." },
    { icon: "🤝", name: "NGO Partner", tag: "Fast, and close to the community." },
    { icon: "🏛️", name: "Government Counterpart", tag: "Holds the mandate." },
    { icon: "💰", name: "Donor Representative", tag: "Brings the money, and the conditions." },
    { icon: "✊", name: "Youth Leader", tag: "Energy, reach, and zero patience for delay." },
    { icon: "🔬", name: "Innovation Lab Lead", tag: "Tests bold ideas before they scale." },
    { icon: "🔭", name: "Foresight Analyst", tag: "Reads the horizon for the next shock." },
    { icon: "📣", name: "Communications Officer", tag: "Shapes the story before rumour does." },
    { icon: "🚚", name: "Logistics Officer", tag: "Makes delivery real, to the last kilometre." },
    { icon: "🩺", name: "Community Health Worker", tag: "Trust, built one doorstep at a time." },
  ];

  /* ----------------------------------------------------------------------
   * CRISIS THEATRES,  drawn once at setup (the country you are posted to).
   * Composite, fictional places. Pure flavour for the run.
   * -------------------------------------------------------------------- */
  CG.THEATRES = [
    { icon: "🌊", name: "The Delta Lowlands", blurb: "Fertile, crowded, and one bad season from a flood." },
    { icon: "🏜️", name: "The Dry Sahel", blurb: "Vast horizons, thin rains, and a young, restless population." },
    { icon: "⛵", name: "The Coastal Belt", blurb: "Fishing towns and ports, where rumour travels faster than the tide." },
    { icon: "⛰️", name: "The Mountain Districts", blurb: "Hard to reach, easy to forget, fiercely self-reliant." },
    { icon: "🚧", name: "The Borderlands", blurb: "Where convoys, paperwork, and displaced families all converge." },
    { icon: "🏙️", name: "The Crowded Capital", blurb: "Ministries, markets, and a million people watching the response." },
  ];

  /* ----------------------------------------------------------------------
   * SNAKE CARDS,  a shuffled deck. Drawn when you land on a snake head.
   * Real things a UN Country Team and its NGO partners run into in the field.
   * why: spoken reason you slide back.   fact: a real coordination truth.
   * -------------------------------------------------------------------- */
  CG.SNAKE_CARDS = [
    { icon: "🌊", title: "Flash Floods Hit the Delta", why: "The river takes the road, the clinic, and three weeks of your plan in a single night.", fact: "A clinic that practised its flood drill once can move its vaccines in an hour. One that never did loses everything." },
    { icon: "🏜️", title: "The Rains Fail Again", why: "The forecast was right, the rains stayed away, and the harvest, and your timeline, shrink with it.", fact: "Acting before a drought is declared costs a fraction of feeding people after it is." },
    { icon: "🚶", title: "A Displacement Wave Arrives", why: "Twelve thousand people reach a town built for three thousand, and every plan needs rewriting.", fact: "A registered identity is often the first step back to inclusion for a displaced family." },
    { icon: "🦠", title: "Disease Outbreak", why: "Cases double overnight in the eastern districts and the whole team pivots to contain it.", fact: "In an outbreak the rumour spreads faster than the virus, so you have to track both." },
    { icon: "📉", title: "A Major Pledge Falls Through", why: "A partner reprioritises with one email, and the shortfall lands squarely on the response.", fact: "People fund credibility. Showing results, not just need, is what brings the support back." },
    { icon: "⚡", title: "Political Tension Rises", why: "A contested decision freezes cooperation across ministries, and the joint plan stalls.", fact: "Coordination is not control. The work survives on convening, not commanding." },
    { icon: "📦", title: "The Supply Chain Breaks", why: "The medicines reach the border. The border is closed. The shipment goes nowhere.", fact: "When hunger or disease hits, the supply chain is the strategy, not a footnote to it." },
    { icon: "💻", title: "A Key Platform Goes Down", why: "The services portal crashes, and public confidence drops with every error message.", fact: "A platform people depend on is critical infrastructure. It has to be protected like one." },
    { icon: "📱", title: "Misinformation Spreads", why: "A rumour on a messaging app turns three communities away from the clinic in an afternoon.", fact: "Facts lose a race they start late. Seed the truth early, before the rumour does." },
    { icon: "🌡️", title: "A Record Heatwave", why: "Schools close, the grid strains, and the most vulnerable people suffer first.", fact: "Adaptation now is the cheapest insurance a fragile country can buy." },
    { icon: "🦗", title: "A Locust Swarm Crosses Over", why: "A green cloud crosses the border, the fields go bare, and food prices climb overnight.", fact: "A shared early-warning map turns 'someone should have known' into 'we planned for this.'" },
    { icon: "😮‍💨", title: "Burnout in the Field Office", why: "Too much, too long, too few people. The team that delivers everything finally stalls.", fact: "Burnout is a crisis you can prevent. Protecting a team's energy is part of the job, not a luxury." },
    { icon: "🧾", title: "An Audit Raises Red Flags", why: "Resources went somewhere they should not have, and every partnership tightens up overnight.", fact: "Transparency stings for a week and pays for years. Publish the hard finding yourself." },
    { icon: "💱", title: "The Currency Collapses", why: "Prices double, budgets halve in real terms, and last month's plan no longer adds up.", fact: "A pooled mechanism lets the country steer through a shock, instead of the loudest voice in the room." },
    { icon: "🔓", title: "A Data Breach", why: "A list of the people you serve lands in the wrong inbox, and hard-won trust takes the hit.", fact: "Privacy is not red tape. It is the reason people are willing to share their information at all." },
    { icon: "🪑", title: "Coordination Fatigue", why: "Three agencies skip the cluster meeting, and the same village gets surveyed three times again.", fact: "A shared assessment stops six agencies from asking the same family the same questions six times." },
    { icon: "🌉", title: "The Only Bridge Collapses", why: "The road north is gone until further notice, and the convoys reroute for days.", fact: "Capable local authorities outlast every visiting mission. Delivery is local, or it is theoretical." },
    { icon: "🏚️", title: "A Promise Slips", why: "A milestone misses its date, people notice, and the goodwill you banked drains a little.", fact: "Trust is spent slowly and lost quickly. Guard it like the currency it is." },
    { icon: "🚧", title: "Access Is Suspended", why: "New checkpoints and paperwork freeze every movement, and the hardest-to-reach wait longest.", fact: "Negotiated humanitarian access is quiet, constant work, and it saves more lives than any single convoy." },
    { icon: "🪙", title: "The Appeal Is Underfunded", why: "Mid-year, the response is barely a third resourced, and you start choosing between priorities.", fact: "Joint advocacy carries further than ten separate appeals, and protects each agency from standing alone." },
  ];

  /* ----------------------------------------------------------------------
   * LADDER CARDS,  a shuffled deck. Drawn when you land on a ladder foot.
   * The lucky breaks a Country Team actually earns: agreements, trust, data,
   * partnerships, community energy.   why: reason you climb.   fact: a truth.
   * -------------------------------------------------------------------- */
  CG.LADDER_CARDS = [
    { icon: "🤝", title: "Agencies Finally Align", why: "A long-stuck plan clears every desk at once, and the team moves as one.", fact: "A shared plan beats five brilliant separate ones, every single time." },
    { icon: "📈", title: "A Data Breakthrough", why: "A merged dataset reveals exactly who is being missed, and the targeting finally sharpens.", fact: "You cannot serve people you cannot see. Data before action is not bureaucracy, it is mercy." },
    { icon: "🧪", title: "A Pilot Succeeds", why: "The small experiment beats its targets, and suddenly everyone wants to scale it.", fact: "A pilot's job is to produce evidence, not hope. Most good ones die in the gap before scale." },
    { icon: "🕊️", title: "A Peace Dividend", why: "A local agreement opens the roads, calms the districts, and lets the work breathe.", fact: "When access opens, the first move is to reach the districts everyone else forgot." },
    { icon: "📹", title: "A Campaign Goes Viral", why: "A youth-made video does what a press release never could, and the queues return.", fact: "Young people are not a future stakeholder group. They are a present one, with reach you lack." },
    { icon: "☁️", title: "A Technology Partnership", why: "A company brings engineers and cloud credits, and your platform leaps a year ahead.", fact: "New tools are tested against the problem, not adopted for the brochure." },
    { icon: "🏛️", title: "A Government Champion", why: "A minister decides this is the legacy she wants, and doors that were shut swing open.", fact: "The goal is the day a programme is called 'ours,' not 'the UN's.'" },
    { icon: "🙌", title: "Volunteers Step Up", why: "Communities organise faster than any agency could, and the reach multiplies overnight.", fact: "Volunteers are not free labour. They are community trust made visible." },
    { icon: "🏦", title: "A Pooled Mechanism Is Topped Up", why: "Partners agree to share one pot, and the country sets the priorities for once.", fact: "A pooled mechanism lets the country steer, instead of the partner who shouts loudest." },
    { icon: "🧩", title: "A Joint Programme Is Signed", why: "Several agencies commit to one plan and one budget line, and duplication collapses.", fact: "Joint programmes trade a little autonomy for a great deal of impact." },
    { icon: "⏰", title: "Early Warning Pays Off", why: "Because you acted on the alert, the storm costs a fraction of what it would have.", fact: "Three days of warning, reaching the last village, can save an entire season." },
    { icon: "🧭", title: "The Cooperation Framework Clicks", why: "The whole UN team rallies behind the national plan, and momentum becomes visible.", fact: "Reform works when the team delivers as one, not as a corridor of separate logos." },
    { icon: "🌍", title: "A South-South Exchange", why: "A neighbour who solved this last year sends their playbook, and you skip a year of mistakes.", fact: "Peer learning between countries beats importing a distant template." },
    { icon: "💌", title: "The Diaspora Invests Back", why: "Talent and remittances flow home with purpose, and a stalled project finds its footing.", fact: "Diaspora investment often dwarfs official aid. Channel it well and it compounds." },
    { icon: "🌧️", title: "The Rains Come on Time", why: "A good season buys a little breathing room, and the team uses it to get ahead.", fact: "Resilience is relief you only have to pay for once." },
    { icon: "🛡️", title: "Anticipatory Action Triggers", why: "Pre-agreed support releases on a pre-agreed signal, and you execute instead of argue.", fact: "Acting before a disaster costs a fraction of cleaning up after one." },
    { icon: "📊", title: "One Shared Dashboard", why: "Everyone finally sees the same numbers, and the arguments shrink to the real decisions.", fact: "When ministers argue about reality instead of whose numbers are right, you have already won." },
    { icon: "🎓", title: "An Independent Study Lands", why: "Outside research confirms the approach works, and the skeptics quietly come around.", fact: "Independent research is what keeps the policy honest." },
    { icon: "🏥", title: "Local Capacity Holds", why: "A national team you trained runs the response themselves, and your job shrinks to encouragement.", fact: "Local capacity is the only kind that stays after the mission leaves." },
    { icon: "👂", title: "The Community Leads", why: "People who once refused the programme now help design it, and uptake climbs on its own.", fact: "Communities support what they help build. Nothing about them should happen without them." },
  ];

  /* ----------------------------------------------------------------------
   * FIELD NOTES,  fun facts dropped on neutral note squares. No movement.
   * Short, vivid, true-to-life coordination wisdom.
   * -------------------------------------------------------------------- */
  CG.FIELD_NOTES = [
    "A shared assessment stops six agencies from surveying the same village six times.",
    "Field data beats a guess made in a capital city, every time.",
    "Open dashboards turn data hoarding into shared situational awareness.",
    "Disaggregated data is how 'leave no one behind' stops being a slogan.",
    "Strengthening a national statistics office outlasts any single project.",
    "Satellites show where the road ends and the need begins.",
    "Digital public services scale to people the nearest office never could.",
    "Without connectivity, every other digital plan is just a drawing.",
    "Interoperability means a refugee's record follows them, not the other way around.",
    "Cutting the queue is also cutting the chance for a bribe.",
    "Foresight is cheaper than the crisis it helps you avoid.",
    "Weak signals today are the front pages of tomorrow.",
    "A reminder text at the right moment can outperform a brand-new clinic.",
    "Communities support what they help design.",
    "Trust is built in person, and lost in press releases.",
    "Faith leaders can carry a public-health message further than any ministry.",
    "The people closest to a problem often hold the cheapest solution.",
    "Nothing about us without us: design with the people most affected.",
    "Clear coordination roles in an emergency save the days that save lives.",
    "The best legacy carries no logo.",
    "Children are 100% of the future and the first to feel a crisis.",
    "A free press is the early-warning system for governance.",
    "Inclusion is how plans survive contact with reality.",
    "Credit shared is coordination earned.",
  ];

  /* ----------------------------------------------------------------------
   * TROPHY CARDS,  drawn on a 🏆 square. Recognition: collect it, roll again.
   * -------------------------------------------------------------------- */
  CG.TROPHY_CARDS = [
    { icon: "🏆", title: "Country Team of the Year", why: "Your team is held up across the system as how coordination should be done.", fact: "Recognition is fuel. Shared credit is what makes a team want to do it all again." },
    { icon: "🏅", title: "A Standing Ovation", why: "At the General Assembly, the country's progress earns a rare round of applause.", fact: "The best legacy carries no single logo, only a result everyone helped build." },
    { icon: "🎖️", title: "Shortlisted for an Award", why: "Your joint initiative is up for a UN 2.0 award, and morale across the team soars.", fact: "Innovation that scales beats innovation that dazzles. Evidence wins the prize." },
    { icon: "⭐", title: "A Model for the Region", why: "Neighbouring country teams ask to copy your playbook, the sincerest compliment.", fact: "When others borrow your approach, the idea has outgrown you. That is the goal." },
  ];

  /* ----------------------------------------------------------------------
   * DIAMOND CARDS,  drawn on a 💎 square. Treasure: collect it, hop forward.
   * -------------------------------------------------------------------- */
  CG.DIAMOND_CARDS = [
    { icon: "💎", title: "An Unspent Budget Line", why: "An audit turns up resources that were allocated but never used, and you put them straight to work.", fact: "Flexible, unearmarked funding is the most valuable kind in a fast-moving crisis." },
    { icon: "💎", title: "A Forgotten Warehouse", why: "A logistics officer finds a store everyone forgot existed, full of exactly what is needed.", fact: "In an emergency, knowing what you already have is half the battle." },
    { icon: "💎", title: "A Quiet Champion", why: "A well-placed official clears three stuck approvals in an afternoon, and the team leaps ahead.", fact: "Trust, once earned, moves faster than any memo ever could." },
    { icon: "💎", title: "A Windfall Grant", why: "A foundation you impressed last year sends an unsolicited grant, no strings attached.", fact: "Credibility compounds. The work you did quietly last year pays out today." },
  ];

  /* ----------------------------------------------------------------------
   * SURPRISE CARDS,  drawn on a ❓ square. A mystery, with an effect:
   *   bonus   = roll again       advance = hop forward
   *   gem     = collect a diamond  skip  = lose your next turn
   * -------------------------------------------------------------------- */
  CG.SURPRISE_CARDS = [
    { icon: "🎁", title: "A Pleasant Surprise", why: "A partner delivers early, and the team gets an unexpected head start.", fact: "Under-promise and over-deliver: the rarest, most trusted habit in the field.", effect: "bonus" },
    { icon: "🍀", title: "A Lucky Break", why: "The stars align and a stubborn obstacle simply clears itself.", fact: "Luck favours the teams that quietly prepared the ground for it.", effect: "advance" },
    { icon: "💎", title: "A Hidden Gem", why: "You stumble on a resource nobody was counting on.", fact: "Resourcefulness is a coordination superpower. Use what is already there.", effect: "gem" },
    { icon: "☕", title: "A Meeting That Ran Long", why: "A coordination session runs three hours over, and the rest of the day is gone.", fact: "Meetings are not coordination. Decisions are.", effect: "skip" },
    { icon: "📨", title: "An Urgent Request from HQ", why: "Headquarters wants a report by morning, and the field work has to wait.", fact: "Protect field time fiercely. The people you serve are not in the inbox.", effect: "skip" },
    { icon: "🌟", title: "A Star Volunteer", why: "A volunteer's idea saves a week of work in a single afternoon.", fact: "The people closest to a problem usually hold the cheapest solution.", effect: "advance" },
    { icon: "🤝", title: "An Old Ally Calls", why: "A contact from a past posting opens a door you did not know was there.", fact: "Networks are the quiet infrastructure of getting anything done.", effect: "bonus" },
    { icon: "🧭", title: "A Wrong Turn", why: "A convoy takes the wrong road and loses half a day to a washed-out track.", fact: "Local knowledge is not optional. The map is never the territory.", effect: "skip" },
  ];

  /* ----------------------------------------------------------------------
   * NARRATOR LINES,  spoken intros/outros that wrap the journey in story.
   * -------------------------------------------------------------------- */
  CG.STORY = {
    opening:
      "You step off the plane into the heat. The framework is signed, the team is half-formed, and a hundred partners are watching to see who you are. The road to a finished mandate runs a hundred squares long, past every setback and every open door. Roll, and begin.",
    // Spoken when a player crosses into a new zone of the board (every 25).
    zones: [
      "Arrival. Map the needs, and earn the first yes.",
      "The honeymoon ends. Now the country watches how you carry pressure.",
      "The seeds you planted are ready to bloom, or wilt. The hardest trade-offs arrive together.",
      "Your term is ending. Everything now is legacy. Finish the road.",
    ],
    winVsAI: "You reach the end of the road first. You leave the country a little stronger, a little fairer, and quite able to do without you. Mandate complete.",
    loseVsAI: "A rival mission finishes first this time. The road will still be here tomorrow. Run it again.",
  };
})();
