/* =========================================================================
 * COMMON GROUND — story.js
 * 64 field vignettes (by Act), Act intros, and Reflection one-liners.
 * Vignettes are short, vivid scenes shown in the Briefing phase.
 * Reflections tie a month to a real coordination principle (subtle).
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});

  CG.COUNTRY = {
    name: "Sahelia",
    name_ar: "ساهيليا",
    blurb: "A composite Sahel-and-coast nation: bright, young, and tested by climate shocks, displacement, and thin institutions — with a National Development Plan and a UN Cooperation Framework to match.",
    blurb_ar: "دولة مركّبة من الساحل والسهل الساحلي: شابة ومشرقة، تختبرها الصدمات المناخية والنزوح وهشاشة المؤسسات — ولها خطة تنمية وطنية وإطار تعاون أممي.",
  };

  CG.ACT_INTROS = [
    { act: 1, title_key: "act1", mood_key: "act1Mood",
      text: "You step off the plane into Sahelia's dry heat. The Cooperation Framework is signed, the team is half-formed, and a hundred partners are watching to see who you are. Map the needs. Earn the first yes." },
    { act: 2, title_key: "act2", mood_key: "act2Mood",
      text: "The honeymoon ends. A shock tests whether all those handshakes were real coordination or just good manners. The country is watching how you carry pressure." },
    { act: 3, title_key: "act3", mood_key: "act3Mood",
      text: "The seeds you planted are ready to bloom — or wilt. Big bets, fragile alliances, and the hardest trade-offs of your term arrive together." },
    { act: 4, title_key: "act4", mood_key: "act4Mood",
      text: "Your term is ending. Everything now is about legacy: which milestones you finish, whose trust you keep, and what Sahelia can carry forward without you." },
  ];

  CG.VIGNETTES = [
    // -------------------- ACT I — ARRIVAL --------------------
    { act: 1, text: "At the airport, a customs officer recognises the UN logo and asks, quietly, whether the new programme will reach her village too. You write down the name of the village." },
    { act: 1, text: "Your first coordination meeting runs long. Eleven agencies, three acronyms you don't know yet, and one shared map pinned crookedly to the wall." },
    { act: 1, text: "A district nurse shows you her paper ledger of births. 'The system in the capital says we have half this many babies,' she says. You both know which number is true." },
    { act: 1, text: "The Minister of Planning is warm but careful. 'We've had many frameworks,' she says. 'Show me one that survives the first dry season.'" },
    { act: 1, text: "A young woman runs a phone-charging kiosk powered by a single solar panel. She has more reliable data on local prices than the ministry does." },
    { act: 1, text: "Three agencies arrive to survey the same fishing town in the same week. The fishermen, patient, answer the same questions three times." },
    { act: 1, text: "In the RCO, the whiteboard reads only: 'Who is being missed?' Nobody has rubbed it out in months. It is the right question." },
    { act: 1, text: "A donor flies in for a day, wants a photo at a school, and leaves. The school's water pump has been broken for a year. You note it." },
    { act: 1, text: "A teenage coder shows you an app he built to report broken streetlights. Two thousand people already use it. The city does not know it exists." },
    { act: 1, text: "An elder tells you the old flood markers on the riverbank, painted decades ago. They are higher than any model in your office predicts." },
    { act: 1, text: "The food agency and the children's agency discover they've been buying the same supplements from different suppliers at different prices. Everyone laughs, then fixes it." },
    { act: 1, text: "A civil-society leader is skeptical of you, and says so plainly. By the end of the meeting you've agreed on one small thing. It's a start." },
    { act: 1, text: "Market traders explain how a rumour about a currency change emptied the shops in a morning. Information, you realise, is infrastructure here." },
    { act: 1, text: "A government statistician shows you a beautiful dataset — two years out of date, because no one funded the next survey." },
    { act: 1, text: "At a community meeting, the women sit at the back until a youth volunteer quietly moves the chairs into a circle. The conversation changes immediately." },
    { act: 1, text: "Your driver, who has worked here twenty years, gives you the most useful briefing of the week, somewhere between two checkpoints." },

    // -------------------- ACT II — PRESSURE --------------------
    { act: 2, text: "The first real crisis arrives at 4 a.m. by phone. By 6, the question is not what happened, but who is talking to whom." },
    { act: 2, text: "A clinic floods to the knees. The vaccines were moved in time — because someone had practised this exact morning in a workshop nobody wanted to attend." },
    { act: 2, text: "A rumour spreads on a messaging app: the new programme is a trick. Within hours, three communities refuse the service. Facts are losing the race." },
    { act: 2, text: "Two agencies both claim the lead on the response. The people waiting for help do not care who leads; they care that someone does." },
    { act: 2, text: "A donor calls: the funding is 'under review.' You translate this for the team gently. Then you start building the case to bring it back." },
    { act: 2, text: "A young volunteer maps every flooded household by motorbike in one day. Her spreadsheet becomes the operation's single source of truth." },
    { act: 2, text: "The government counterpart takes a political risk to keep a border crossing open for aid. It costs him. You make sure his ministry gets the credit." },
    { act: 2, text: "At the height of the crisis, a logistics officer finds a warehouse everyone forgot existed. It is full of exactly what is needed." },
    { act: 2, text: "A misinformation video has a million views. A nurse records a sixty-second reply on her phone. It is not as slick. It is far more trusted." },
    { act: 2, text: "Supplies are stuck at the port over a stamp. A single phone call between two people who trust each other moves them by nightfall." },
    { act: 2, text: "An exhausted team wants to push through the weekend. You send half of them home. Burnout is a crisis you can prevent." },
    { act: 2, text: "A child's drawing of the flood is pinned in the operations room. Nobody takes it down. It keeps the numbers honest." },
    { act: 2, text: "The early-warning system you funded last act sends an alert three days before the next shock. Three days is everything." },
    { act: 2, text: "A faith leader announces from the pulpit that the clinic is safe. The queues return the next morning. No campaign could have done it faster." },
    { act: 2, text: "An agency wants to launch a flashy new tool mid-crisis. You ask the one question that stops it: 'Does it work offline, here, today?'" },
    { act: 2, text: "The press wants a villain. You give them a system instead, and a plan to fix it. It is a less satisfying story and a more truthful one." },

    // -------------------- ACT III — CONVERGENCE --------------------
    { act: 3, text: "The pilot from Act I has scaled to twelve districts. A minister now calls it 'our programme,' not 'the UN's.' That sentence is the goal." },
    { act: 3, text: "A pooled fund you fought for finally lets the government, not the loudest donor, set the priorities. The room feels different." },
    { act: 3, text: "Two rival NGOs agree to share their data for the first time. It took eighteen months and one very long lunch." },
    { act: 3, text: "A young entrepreneur's idea, once dismissed, is now in the national budget. She is in the room when it passes. She is twenty-four." },
    { act: 3, text: "An alliance you built holds firm under political pressure that would have shattered it a year ago. Trust, it turns out, compounds." },
    { act: 3, text: "A new shock hits — but this time the plan already exists, signed, with the money pre-agreed. You execute instead of argue." },
    { act: 3, text: "A donor offers a large grant with strings that would split the team. The whole table, together, says a polite no. You did not have to say it alone." },
    { act: 3, text: "The data dashboard you launched is now projected on the wall of the cabinet room. Ministers argue about reality, not about whose numbers are right." },
    { act: 3, text: "A community that once refused the programme now runs it themselves. Your role has quietly shrunk to encouragement. This is success." },
    { act: 3, text: "An interoperable system means a displaced family's records follow them across three districts. They register once, not three times." },
    { act: 3, text: "The youth council presents to the cabinet. They are nervous, prepared, and unanswerable. Two policies change that afternoon." },
    { act: 3, text: "A foresight workshop you ran last year named this exact scenario. Reading the old notes feels like a letter from a wiser past self." },
    { act: 3, text: "A private company and a refugee agency co-design a payments system. Neither could have built it alone; together it reaches everyone." },
    { act: 3, text: "An evaluation lands with hard findings. You publish it in full. A rival uses it against you for a week; partners trust you for years." },
    { act: 3, text: "The government statistician from Act I now leads a team of thirty. The data is current. The next survey is already funded." },
    { act: 3, text: "A neighbouring country's coordinator calls for advice on a problem you solved. You send the notes, and the mistakes, freely." },

    // -------------------- ACT IV — LEGACY --------------------
    { act: 4, text: "Your term is counted in weeks now. The question shifts from 'what can we do' to 'what will hold after we're gone.'" },
    { act: 4, text: "A milestone you doubted reaches the line. The team is too tired to celebrate properly, so they just sit together, quietly proud." },
    { act: 4, text: "The Minister who said 'show me one that survives the dry season' shakes your hand. She doesn't say it survived. She doesn't have to." },
    { act: 4, text: "You hand the whiteboard question — 'Who is being missed?' — to your successor. The list is shorter than when you arrived. Not empty. Shorter." },
    { act: 4, text: "A clinic that flooded in Act II reopens, rebuilt on higher ground where the elder's old flood markers said it should be." },
    { act: 4, text: "The youth coder from Act I now advises the ministry he once couldn't reach. His streetlight app is national policy." },
    { act: 4, text: "A final coordination meeting. Eleven agencies, no acronyms unexplained, one shared map pinned straight to the wall." },
    { act: 4, text: "The pooled fund outlives your term, your budget line, and probably your memory in the capital. That is exactly as it should be." },
    { act: 4, text: "A donor who once attached strings now funds the joint plan, no conditions. 'You earned it,' she says. You earned it together." },
    { act: 4, text: "A village you wrote down on day one, at the airport, finally has a working water pump and a clinic that opens on time." },
    { act: 4, text: "Your successor arrives, half-formed team, hundred partners watching. You tell them what someone should have told you: build the table first." },
    { act: 4, text: "At the farewell, the district nurse from Act I is there. Her paper ledger is gone. The system in the capital finally counts every baby." },
    { act: 4, text: "The early-warning siren tests on schedule. Nobody flinches anymore. They just check their phones, nod, and carry on. Readiness became routine." },
    { act: 4, text: "A reporter asks what you're proudest of. You name a programme that no longer has your logo on it anywhere. That's the one." },
    { act: 4, text: "The last vignette of your term writes itself in other people's work — the volunteers, the ministers, the coders, the nurses — carrying on." },
    { act: 4, text: "You leave Sahelia the way you should leave any place you served: a little stronger, a little fairer, and quite able to do without you." },
  ];

  // Short reflection takeaways shown after Resolution (one principle each).
  CG.REFLECTIONS = [
    "Coordination is not control. The RC leads by convening, not commanding.",
    "Data before action: you cannot serve people you cannot see.",
    "Trust is spent slowly and lost quickly. Guard it.",
    "The fastest path often leaves someone behind. Check who.",
    "A shared plan beats five brilliant separate ones.",
    "Foresight is the cheapest crisis response there is.",
    "Local capacity is the only kind that stays after the mission leaves.",
    "Behaviour change beats new buildings when trust is the bottleneck.",
    "Pooled funding lets the country steer instead of the loudest donor.",
    "Transparency stings for a week and pays for years.",
    "The people closest to a problem usually hold the cheapest solution.",
    "Joint advocacy protects each agency from standing alone.",
    "A pilot's job is evidence, not hope — and scale is a separate fight.",
    "Inclusion is not a courtesy; it is how plans survive contact with reality.",
    "Credit shared is coordination earned.",
    "Resilience is relief you only have to pay for once.",
    "Misinformation travels faster than facts — so seed the facts early.",
    "Protect your team's energy; burnout is a preventable crisis.",
    "The best legacy carries no logo.",
    "Leave no one behind is a budget line, not a slogan.",
  ];

  // Random starting conditions for replayability.
  CG.START_CONDITIONS = [
    { id: "stable", name: "A Calm Arrival", desc: "Sahelia is steady. A rare window to build.",
      mods: { trust: 6, funding: 2 } },
    { id: "fragile", name: "On the Brink", desc: "Trust is thin and a crisis already simmers.",
      mods: { trust: -6, startCrisis: { name: "Lingering Drought", type: "climate", severity: 2 } } },
    { id: "flush", name: "Flush with Funds", desc: "A big appeal succeeded — but expectations are high.",
      mods: { funding: 5, trust: -2 } },
    { id: "datapoor", name: "Flying Blind", desc: "The last survey is years old. Data is scarce.",
      mods: { data: -2, trust: 2 } },
    { id: "fractured", name: "A Fractured Team", desc: "Partners distrust each other. Coordination is hard-won.",
      mods: { coordination: -2, trust: 2 } },
    { id: "hopeful", name: "A New Government", desc: "Fresh leadership, real goodwill, untested systems.",
      mods: { trust: 4, coordination: 1 } },
  ];

  CG.getVignettes = (act) => CG.VIGNETTES.filter((v) => v.act === act);
})();
