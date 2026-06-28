/* =========================================================================
 * COMMON GROUND, THE LONG ROAD,  content.js
 * All game content in one place: the shuffleable decks (job titles, crisis
 * theatres, hole cards, ladder cards), the field-note fun facts, and the
 * trophy / diamond / surprise decks. Designers edit ONLY this file to change
 * the story; the engine (game.js / ludo.js) never hard-codes any flavour text.
 *
 * A "hole" is a setback (a crisis): you drop DOWN, and the card tells you
 * why, with a real coordination fact. A "ladder" is momentum (funding, an
 * agreement, an opening): you climb UP, and the card tells you why.
 *
 * The terms here are the ones Resident Coordinators, UN Country Teams,
 * Humanitarian Coordinators, agencies, NGOs, governments and donors really
 * use in the field: RC, UNCT, HCT, OCHA, clusters, the Cooperation Framework,
 * CERF, pooled funds, anticipatory action, localization, the IPC, the Grand
 * Bargain, durable solutions, AAP, PSEA, and more. Theatres are fictional
 * composites. English only. No external assets. No em or en dashes anywhere.
 * ========================================================================= */
(function () {
  const CG = (window.CG = window.CG || {});

  /* ----------------------------------------------------------------------
   * THE BOARD is generated FRESH every game (see generateBoard in game.js), so
   * the ladders, holes, trophies, diamonds and surprises move every time you
   * play. Nothing about the layout is hard-coded here.
   * ----------------------------------------------------------------------
   * AGENT NAMES,  a diverse international pool for the AI rivals (and offered
   * as quick suggestions for human players). Each game draws unique names.
   * -------------------------------------------------------------------- */
  CG.AGENT_NAMES = [
    "Amara", "Liang", "Sofia", "Kwame", "Noor", "Diego", "Aisha", "Yuki",
    "Mateo", "Fatima", "Omar", "Priya", "Elena", "Tariq", "Mei", "Kofi",
    "Lucia", "Hassan", "Ana", "Sergei", "Zara", "Nuru", "Ravi", "Ingrid",
    "Thabo", "Leila", "Pablo", "Sanaa", "Viktor", "Mariam", "Chen", "Esi",
    "Dipa", "Marcus", "Yara", "Bao", "Halima", "Niko", "Rosa", "Idris",
    "Salma", "Daniyar", "Mariana", "Joon", "Awa", "Rashid", "Lena", "Tendai",
    "Carmen", "Farida", "Oscar", "Nadia", "Sami", "Grace", "Bilal", "Anja",
  ];

  /* ----------------------------------------------------------------------
   * THE UN 2.0 QUINTET OF CHANGE,  five capabilities every team carries.
   * They travel with you all game: ladders (momentum) strengthen one, holes
   * (setbacks) set one back. Shown casually as you go, in both games.
   * -------------------------------------------------------------------- */
  CG.QUINTET = [
    { key: "data",       icon: "📊", name: "Data",                blurb: "Decisions grounded in evidence." },
    { key: "innovation", icon: "💡", name: "Innovation",          blurb: "Bold ideas, tested then scaled." },
    { key: "digital",    icon: "📲", name: "Digital",             blurb: "Services that reach everyone, everywhere." },
    { key: "foresight",  icon: "🔭", name: "Strategic Foresight", blurb: "Reading the next shock before it lands." },
    { key: "behaviour",  icon: "🧠", name: "Behavioural Science", blurb: "Designing for how people really decide." },
  ];

  // Which capability a card touches, inferred from its tag. Anything unmapped
  // (or tagged "any") picks a capability at random, so every event nudges one.
  CG.QUINTET_BY_TAG = {
    data: "data", governance: "data", displacement: "data",
    digital: "digital", supply: "digital",
    health: "innovation", funding: "innovation", access: "innovation",
    climate: "foresight", storm: "foresight", flood: "foresight", drought: "foresight",
    info: "behaviour", community: "behaviour", youth: "behaviour",
  };

  CG.quintetForTag = function (tag) {
    if (tag && CG.QUINTET_BY_TAG[tag]) return CG.QUINTET_BY_TAG[tag];
    return CG.QUINTET[Math.floor(Math.random() * CG.QUINTET.length)].key;
  };
  CG.quintetMeta = function (key) {
    for (let i = 0; i < CG.QUINTET.length; i++) if (CG.QUINTET[i].key === key) return CG.QUINTET[i];
    return CG.QUINTET[0];
  };

  /* ----------------------------------------------------------------------
   * JOB TITLES,  drawn once per player at setup (your avatar this game).
   * The real roles around a country team: UN, NGO, government, donor, community.
   * -------------------------------------------------------------------- */
  CG.ROLES = [
    { icon: "🧭", name: "Resident Coordinator", tag: "Leads the whole UN team. No orders, only influence." },
    { icon: "🛟", name: "Humanitarian Coordinator", tag: "Holds the response. Chairs the HCT when crisis hits." },
    { icon: "🗂️", name: "Humanitarian Affairs Officer", tag: "OCHA's workhorse. Keeps the coordination running." },
    { icon: "🧩", name: "Cluster Coordinator", tag: "Convenes a whole sector: who does what, where." },
    { icon: "🗺️", name: "Information Management Officer", tag: "Turns chaos into maps, dashboards and the 4W." },
    { icon: "📋", name: "Needs Assessment Officer", tag: "Runs the surveys that tell the response who needs what." },
    { icon: "💧", name: "WASH Specialist", tag: "Keeps water flowing. The first line against cholera." },
    { icon: "🛡️", name: "Protection Officer", tag: "Safeguards rights and safety as life-saving work." },
    { icon: "🧒", name: "Child Protection Officer", tag: "Traces separated children, runs the safe spaces." },
    { icon: "🤲", name: "GBV Specialist", tag: "Stands up safe spaces and referral pathways from day one." },
    { icon: "💳", name: "Cash and Markets Adviser", tag: "Reads the markets, decides when cash beats in-kind." },
    { icon: "🚚", name: "Logistics Cluster Lead", tag: "Moves the pipeline to the last kilometre." },
    { icon: "📡", name: "Emergency Telecoms Officer", tag: "Restores connectivity where the networks went dark." },
    { icon: "🩺", name: "Public Health Epidemiologist", tag: "Tracks the outbreak, triggers the alarm in time." },
    { icon: "🥣", name: "Nutrition Specialist", tag: "Screens for malnutrition, keeps children alive." },
    { icon: "📊", name: "Data Officer", tag: "Turns numbers into decisions everyone can defend." },
    { icon: "🔬", name: "Innovation Lab Lead", tag: "Tests bold ideas before they scale." },
    { icon: "🔭", name: "Foresight Analyst", tag: "Reads the horizon for the next shock." },
    { icon: "📣", name: "Communications Officer", tag: "Shapes the story before rumour does." },
    { icon: "🏛️", name: "Government NDMA Focal Point", tag: "Owns early warning, declarations, and the response." },
    { icon: "🤝", name: "National NGO Director", tag: "First to respond, last to leave, closest to the community." },
    { icon: "🙋", name: "Community Mobiliser", tag: "The trusted local face. Carries the message both ways." },
    { icon: "💰", name: "Donor Programme Officer", tag: "Decides which appeals get funded, and on what terms." },
    { icon: "✊", name: "Youth Leader", tag: "Energy, reach, and zero patience for delay." },
  ];

  /* ----------------------------------------------------------------------
   * CRISIS THEATRES,  drawn once at setup (the country you are posted to).
   * Composite, fictional places. Pure flavour for the run. The tags steer
   * which challenges and openings you are likely to draw.
   * -------------------------------------------------------------------- */
  CG.THEATRES = [
    { icon: "🌊", name: "The Sundering Delta", blurb: "Fertile and crowded, one tidal surge from a flood, with salt creeping into the wells.", tags: ["flood", "climate", "supply", "health"] },
    { icon: "🏜️", name: "The Long Sahel", blurb: "Vast horizons, thin rains, locust years, and a young, restless population.", tags: ["drought", "climate", "youth", "displacement"] },
    { icon: "⛵", name: "The Drowning Coast", blurb: "Fishing towns and ports where the sea is rising and rumour travels faster than the tide.", tags: ["storm", "info", "supply", "community"] },
    { icon: "⛰️", name: "The Stone Crown Highlands", blurb: "Earthquakes, landslides, and hard winters that cut the valleys off for months.", tags: ["access", "community", "data", "climate"] },
    { icon: "🚧", name: "The Tovrid Corridor", blurb: "A transit route where convoys, paperwork, mixed movements and displaced families all converge.", tags: ["displacement", "access", "supply", "governance"] },
    { icon: "🏙️", name: "Greater Asmal", blurb: "A megacity of informal settlements, recurrent cholera, killer heatwaves, and a million people watching.", tags: ["governance", "info", "digital", "health"] },
    { icon: "🏝️", name: "The Reef Archipelago", blurb: "Scattered islands, one supply port, first to feel the cyclones and the rising sea.", tags: ["storm", "climate", "access", "supply"] },
    { icon: "🌋", name: "The Rift Highlands", blurb: "Beautiful, volatile ground where the earth itself keeps no schedule.", tags: ["climate", "access", "data", "health"] },
    { icon: "🏞️", name: "The Vanishing Lake Basin", blurb: "A receding lake, collapsing fisheries, insurgency, and displacement all around the shoreline.", tags: ["displacement", "health", "governance", "community"] },
    { icon: "❄️", name: "The Open Steppe", blurb: "Drought that kills the herds, long distances, and pastoralists who know the land best.", tags: ["climate", "access", "data", "community"] },
    { icon: "🌳", name: "The Greenwall Basin", blurb: "Deep forest and great rivers, remote, flood-prone, and shadowed by viral spillover.", tags: ["health", "access", "climate", "supply"] },
    { icon: "🏚️", name: "The Mended Lands", blurb: "Just out of conflict: landmines, returnees, weak institutions, and a long search for durable solutions.", tags: ["displacement", "governance", "community", "funding"] },
    { icon: "🛢️", name: "The Resource Frontier", blurb: "Sudden wealth, sharp inequality, and everyone wants a say in who benefits.", tags: ["governance", "funding", "youth", "info"] },
    { icon: "🏔️", name: "The Karran Belt", blurb: "A dryland frontier where drought, armed groups and food insecurity deepen together.", tags: ["drought", "displacement", "access", "governance"] },
  ];

  /* ----------------------------------------------------------------------
   * HOLE CARDS,  a shuffled deck (CG.SNAKE_CARDS). Drawn when you land on a hole.
   * Real setbacks a UN Country Team and its partners run into in the field.
   * why: spoken reason you slide back.   fact: a real coordination truth.
   * -------------------------------------------------------------------- */
  CG.SNAKE_CARDS = [
    // natural hazards
    { icon: "🌊", title: "Floodwaters Swallow the Roads", tag: "flood", why: "Whole districts go cut off overnight, and the pre-positioned stocks are on the wrong side of the water.", fact: "Once the road is gone you are flying cargo at ten times the cost, so the answer is pre-positioning before the rains." },
    { icon: "🌀", title: "A Cyclone Makes Landfall", tag: "storm", why: "One storm flattens shelter, water and health all at once, and a multi-cluster response starts from zero.", fact: "Anticipatory action releases CERF money on the forecast, not on the impact, while there is still time to act." },
    { icon: "🏜️", title: "Drought Tips Toward Famine", tag: "drought", why: "A slow-onset crisis loses the funding race until an IPC Phase 5 classification finally forces attention.", fact: "Famine is a technical declaration, not a headline, and the data almost always lags behind the deaths." },
    { icon: "🌍", title: "An Earthquake Levels the Capital", tag: "climate", why: "The disaster hits your own offices, staff and government counterparts, so the responders are also the affected.", fact: "International search teams matter little past 72 hours. Local first responders pull most people out alive." },
    { icon: "🦗", title: "A Locust Swarm Descends", tag: "climate", why: "A swarm the size of a city eats the harvest in hours, and food prices climb by nightfall.", fact: "You cannot fight locusts from the ground. The worst Horn of Africa upsurge in 70 years was tracked from the air." },
    { icon: "🌡️", title: "A Record Heatwave", tag: "climate", why: "Extreme heat quietly kills the elderly and the displaced in their tents, but rarely triggers a classic appeal.", fact: "Heat is the silent killer, and the sector is only now writing heat-action plans the way it writes flood plans." },
    { icon: "⛰️", title: "A Landslide Buries the Access Route", tag: "access", why: "One slope failure severs the single road into a valley, and thousands are isolated.", fact: "The secondary hazard often does more damage than the first, so you plan for the whole cascade." },
    // conflict and displacement
    { icon: "💥", title: "A New Frontline Erupts", tag: "displacement", why: "Fighting shifts overnight and pushes fresh displacement into areas where you have no presence.", fact: "Rapid-response mechanisms exist to deliver in the first 72 hours, before the clusters even stand up." },
    { icon: "🚶", title: "Refugees Pour Across the Border", tag: "displacement", why: "A sudden influx overwhelms reception capacity, and every plan needs rewriting by morning.", fact: "Refugee response runs under UNHCR's coordination model, which sits alongside the clusters, not inside them." },
    { icon: "⛺", title: "The Camp Passes Breaking Point", tag: "displacement", why: "Overcrowding collapses water, sanitation and protection standards in a single week.", fact: "Camp managers track density before anything else, because crowding drives outbreaks, violence and eviction." },
    { icon: "🚫", title: "Civilians Trapped by Fighting", tag: "access", why: "People are besieged where no agency can reach, so your caseload is physically unreachable.", fact: "Reaching the besieged turns on humanitarian notification and patient deconfliction with the parties." },
    // disease outbreaks
    { icon: "🦠", title: "Cholera Hits the Settlement", tag: "health", why: "Contaminated water in a crowded site spreads fast, pulling in health, water and logistics together.", fact: "Cholera is a water disease as much as a health one. The vaccine only buys time while you fix the water." },
    { icon: "🤒", title: "Measles Sweeps the Camp", tag: "health", why: "Low coverage and crowding turn one case into hundreds, and malnourished children die first.", fact: "Measles is the canary for a collapsed health system. A campaign is proof routine immunisation already failed." },
    { icon: "☣️", title: "A Haemorrhagic Fever Crosses a District", tag: "health", why: "Ebola demands instant isolation, contact tracing and safe burials that no single agency runs alone.", fact: "Fighting the outbreak means fighting the rumours that drive attacks on the treatment centres." },
    { icon: "😷", title: "A Respiratory Pandemic Locks Down", tag: "health", why: "Border closures and movement bans hit your own supply chains and staff just as needs surge.", fact: "The response measures can do as much harm to the most vulnerable as the disease itself." },
    // funding
    { icon: "📉", title: "The Appeal Is Stuck at 40 Percent", tag: "funding", why: "Chronic underfunding forces brutal prioritisation, and whole sectors get cut.", fact: "Underfunding is not abstract. In a single recent year it meant reaching millions fewer people than the year before." },
    { icon: "🪙", title: "A Donor Pledge Never Arrives", tag: "funding", why: "A headline pledge is not cash in the account, and the programmes built on it stall.", fact: "Veterans track money committed and money paid as two completely different numbers." },
    { icon: "🔒", title: "Earmarking Ties Your Hands", tag: "funding", why: "Money arrives locked to one activity, so you cannot move it to the gap that is actually killing people.", fact: "Only a small share of funding to UN agencies is unearmarked, and it is the most valuable kind there is." },
    { icon: "💱", title: "The Currency Collapses", tag: "funding", why: "Hyperinflation guts the value of the budget, and of the cash you hand to families.", fact: "In a collapsing economy, cash transfer values must be indexed and repriced constantly or they fail." },
    { icon: "🏧", title: "The Top Donor Pulls Out", tag: "funding", why: "One withdrawal erases a third of sector funding, and the cuts cascade for months.", fact: "Predictable, flexible funding is what lets a response survive a shock like this. Most funding is neither." },
    // access and bureaucracy
    { icon: "🛂", title: "Visas Denied at the Last Minute", tag: "access", why: "Surge experts cannot enter, so the response is led by whoever holds a permit, not who is most qualified.", fact: "Visa delays and registration hurdles are logged as deliberate access constraints now, not mere paperwork." },
    { icon: "🚧", title: "The Checkpoint Swallows the Convoy", tag: "access", why: "Hours lost at each barrier wreck the cold chain, the fuel budget and the delivery window.", fact: "Partners log every impeded mission in a formal access-monitoring framework, because the pattern is the point." },
    { icon: "📦", title: "Relief Items Blocked at Customs", tag: "supply", why: "Import restrictions leave the warehouse full and the field sites empty.", fact: "Duty exemptions are negotiated in the country agreement. Revoke them quietly and the pipeline chokes at the port." },
    { icon: "🪧", title: "A New NGO Registration Law Bites", tag: "governance", why: "A restrictive law can deregister your partners overnight, and the front line goes dark.", fact: "A registration rule can be an access weapon. The only durable insurance is local capacity that stays." },
    { icon: "✈️", title: "Agencies Are Expelled", tag: "access", why: "An order to leave removes capacity at the exact moment of greatest need.", fact: "When internationals are forced out, the local responders are the ones who remain. That is why localization matters." },
    // supply chain
    { icon: "⚓", title: "The Port Seizes Up", tag: "supply", why: "Congestion at the single entry port backs up every agency's cargo at once.", fact: "The Logistics Cluster runs common services precisely because no one agency can untangle a blocked port alone." },
    { icon: "⛽", title: "The Fuel Runs Dry", tag: "supply", why: "No fuel means no generators, no cold chain, no water pumping and no vehicles.", fact: "A fuel blockade shuts hospitals and water systems faster than any single programme cut ever could." },
    { icon: "🧊", title: "The Cold Chain Fails", tag: "supply", why: "One break ruins an entire batch of vaccines or insulin, invisible until people fall ill.", fact: "A single failed fridge can void a whole campaign, which is why the cold chain gets its own monitoring." },
    // information
    { icon: "📱", title: "Rumours Outrun the Response", tag: "info", why: "False information spreads faster than your messaging and turns people away from the clinic.", fact: "Risk-communication teams treat rumour-tracking as surveillance, because the rumour is a public-health threat." },
    { icon: "🙅", title: "Vaccine Refusal Takes Hold", tag: "info", why: "Disinformation hardens into refusal, and a fully stocked campaign reaches empty tents.", fact: "Misinformation crippled a major Ebola response. Community trust is the real cold chain." },
    // safeguarding and integrity
    { icon: "🚨", title: "A PSEA Incident Surfaces", tag: "governance", why: "An allegation demands an immediate, survivor-centred response and threatens every agency's standing.", fact: "Survivor first, then the investigation. How you handle the first case decides whether anyone reports the next." },
    { icon: "🕳️", title: "Aid Is Diverted Before It Lands", tag: "governance", why: "Goods siphoned off mean the intended families go without, and donor confidence drops.", fact: "Diversion is managed through third-party monitoring. Zero diversion usually means zero access." },
    // data
    { icon: "🔓", title: "Beneficiary Data Is Breached", tag: "data", why: "A list of names, locations or biometrics leaks, and the people you protect are put at risk.", fact: "The safest record is the one you never collected. Data minimisation is protection, not bureaucracy." },
    // staff and security
    { icon: "😮‍💨", title: "The Team Burns Out", tag: "any", why: "Months of crisis with no rotation hollow out your most experienced staff at the very peak.", fact: "A coordination structure is only as resilient as the exhausted people running its meetings. Protect them." },
    { icon: "⛓️", title: "Staff Are Detained", tag: "governance", why: "The arbitrary detention of national colleagues freezes the whole operation.", fact: "States, not armed groups, are the fastest-growing threat to aid workers, and national staff bear it first." },
    { icon: "🎯", title: "Aid Workers Are Attacked", tag: "access", why: "An attack forces a security pause that halts assistance for everyone, not just one agency.", fact: "Recent years have been the deadliest on record for aid workers, and the vast majority killed are national staff." },
    // coordination failures
    { icon: "👥", title: "Two Agencies, Same Village", tag: "governance", why: "Duplicated distributions mean another village two valleys over gets nothing at all.", fact: "The 4W matrix is the most boring and the most important tool in the cluster. It is how duplication dies." },
    { icon: "🪑", title: "Death by Coordination Meeting", tag: "governance", why: "Endless overlapping meetings pull field staff off delivery for days.", fact: "Coordination is a means to delivery, never a substitute for it. People do not eat coordination." },
    { icon: "📝", title: "Assessment Fatigue Sets In", tag: "data", why: "The same families are surveyed by a dozen agencies, and they stop answering the door.", fact: "Joint multi-sector assessments exist to ask once and share the answer. Asking six times is a failure." },
    // political
    { icon: "🏛️", title: "The Government Falls Overnight", tag: "governance", why: "A sudden collapse erases your counterparts and the legal basis for operating.", fact: "Re-establishing humanitarian space after a rupture takes months you do not have." },
    { icon: "⏸️", title: "Programmes Are Suspended", tag: "governance", why: "A new administration freezes activities pending a review, and the clock keeps running.", fact: "You serve people, not governments, but you operate by consent, so a suspension is negotiated, not overruled." },
  ];

  /* ----------------------------------------------------------------------
   * LADDER CARDS,  a shuffled deck. Drawn when you land on a ladder foot.
   * The lucky breaks a Country Team actually earns: funding, agreements,
   * access, data, trust.   why: reason you climb.   fact: a real truth.
   * -------------------------------------------------------------------- */
  CG.LADDER_CARDS = [
    // funding wins
    { icon: "⚡", title: "CERF Rapid Response Unlocks", tag: "funding", why: "Life-saving funds land within days, long before the donor pledges arrive.", fact: "The Emergency Relief Coordinator can release CERF rapid-response funds within 72 hours of an agreed request." },
    { icon: "💵", title: "The Flash Appeal Is Fully Funded", tag: "funding", why: "The appeal hits a hundred percent, so every prioritised activity finally has money behind it.", fact: "A Flash Appeal sets out the strategy for the first three to six months of a sudden-onset crisis." },
    { icon: "🏦", title: "A Pooled Fund Top-Up Lands", tag: "funding", why: "A country-based pooled fund reserve gives the Humanitarian Coordinator flexible cash to plug urgent gaps.", fact: "Pooled funds are unearmarked and sit with the field, so the people closest to the need decide where it goes." },
    { icon: "📆", title: "Multi-Year Flexible Funding Secured", tag: "funding", why: "Predictable money lets your partners plan beyond the next quarter for once.", fact: "Multi-year, unearmarked funding is the modality partners value most, and a Grand Bargain commitment to deliver it." },
    { icon: "🤝", title: "Donor Confidence Returns", tag: "funding", why: "Clean reporting and visible results bring the hesitant donors back to the table.", fact: "Transparent, audited pooled-fund reporting is one of the strongest tools there is for rebuilding trust." },
    // anticipatory action
    { icon: "🛡️", title: "A Forecast Trigger Releases Cash", tag: "climate", why: "Pre-arranged finance hits accounts before the flood, so families can act early.", fact: "Every dollar invested in anticipatory action can return up to seven in avoided losses. It is still under one percent of aid." },
    { icon: "🌧️", title: "Cash Before the Flood", tag: "flood", why: "People receive money days ahead of the water to move livestock and protect what they have.", fact: "In one pilot, anticipatory cash reached half a million people within days of a warning, at about half the usual cost." },
    { icon: "⏰", title: "The Drought Window Activates", tag: "drought", why: "A slow-onset forecast triggers action while there is still time to protect the harvest and the herds.", fact: "Acting before a disaster costs a fraction of cleaning up after one. Over a generation, early action is roughly a third the cost." },
    // strategic and framework
    { icon: "🧭", title: "The Cooperation Framework Is Signed", tag: "governance", why: "Government and the UN agree a shared multi-year plan, and the whole country team rallies behind it.", fact: "The Cooperation Framework determines the UN's collective contribution at country level. It is the anchor document." },
    { icon: "📈", title: "The Needs Overview Lands On Time", tag: "data", why: "A credible needs picture and a costed plan arrive before the funding cycle, not after it.", fact: "The response plan is built on the needs overview, prepared by the country team for any crisis spanning more than one agency." },
    { icon: "🔎", title: "The Common Country Analysis Holds", tag: "data", why: "One shared diagnosis stops agencies arguing from five different sets of facts.", fact: "When ministers argue about reality instead of whose numbers are right, you have already won half the battle." },
    { icon: "🧩", title: "A Joint Programme Is Launched", tag: "governance", why: "Several agencies pool mandates and budgets into one programme instead of competing in silos.", fact: "Joint programmes trade a little autonomy for a great deal of impact, combining each agency's comparative advantage." },
    // clusters working well
    { icon: "🗂️", title: "The Clusters Activate Cleanly", tag: "governance", why: "Each sector gets a clear lead, so gaps and overlaps surface fast instead of festering.", fact: "Clusters are activated at the Humanitarian Coordinator's request, each accountable through its lead agency." },
    { icon: "🗺️", title: "The 4W Matrix Clicks", tag: "data", why: "A shared who-does-what-where picture reveals the double-coverage and the blank spots at a glance.", fact: "The 4W is the backbone dataset a cluster uses to design duplication out of the response." },
    // national ownership
    { icon: "🏛️", title: "The Government Takes the Lead", tag: "governance", why: "National authorities steer the operation, and the UN coordinates in support.", fact: "Primary responsibility for coordinating assistance rests with national authorities. The goal is to work in support of them." },
    { icon: "🚩", title: "The National Authority Activates", tag: "governance", why: "The disaster management authority owns the response from day one, with early warning and declarations in hand.", fact: "The cluster system is meant to work in support of national disaster authorities wherever they exist." },
    { icon: "🔗", title: "Nexus Programming Connects", tag: "any", why: "Humanitarian and development actors plan together, so relief starts building toward recovery.", fact: "Joint humanitarian-development assessments cut duplication and build the trust a handover will need." },
    // localization
    { icon: "🌱", title: "Local NGOs Are Funded Directly", tag: "community", why: "Front-line national organisations receive money straight, not filtered through three intermediaries.", fact: "Pooled funds channel a large share of allocations to local and national organisations, often more than a third." },
    { icon: "🪜", title: "The Grand Bargain 25 Percent Is Delivered", tag: "community", why: "The long-promised quarter finally reaches local actors as directly as possible.", fact: "The target is at least a quarter of humanitarian funding to local and national responders. Localization shares power, not just risk." },
    { icon: "🙌", title: "Community-Led Response Scales", tag: "community", why: "Affected communities organise and deliver, and the system has the sense to back them.", fact: "Proximity and local knowledge let front-line responders deliver faster and cheaper. They were there first and stay last." },
    // cash
    { icon: "💳", title: "Multipurpose Cash Scales Up", tag: "community", why: "Families receive unrestricted cash and decide their own priorities with dignity.", fact: "Cash is dignity. Its value is tied to a minimum expenditure basket, the local cost of a household's basic monthly needs." },
    // data and IM
    { icon: "📊", title: "One Shared Dashboard Goes Live", tag: "digital", why: "Everyone finally sees the same live numbers, and the arguments shrink to the real decisions.", fact: "Operational dashboards turn static monthly reports into near-real-time tools you can actually steer by." },
    { icon: "🧮", title: "A Joint Needs Assessment Is Done", tag: "data", why: "One coordinated assessment replaces a dozen separate agency surveys.", fact: "A joint assessment gives the whole response one evidence base, and gives families their doorways back." },
    { icon: "🗃️", title: "Common Datasets Are Shared", tag: "data", why: "Everyone plans from the same boundaries and the same population figures.", fact: "Common operational datasets are the best-available shared reference data, the quiet foundation under every map." },
    // access
    { icon: "🚪", title: "A Border Crossing Reopens", tag: "access", why: "A negotiated crossing lets the convoys roll into areas that were cut off for months.", fact: "Access is negotiated one crossing at a time, by people who never make the headlines. A single reopened crossing can reach a famine-risk region." },
    { icon: "↔️", title: "Cross-Line Access Is Agreed", tag: "access", why: "Aid moves across the front line to people who were entirely unreachable yesterday.", fact: "Cross-line and cross-border modalities are negotiated tools to reach areas outside government control." },
    { icon: "📍", title: "The Notification System Holds", tag: "access", why: "Sharing convoy and clinic coordinates keeps aid workers and facilities off the target list.", fact: "Deconfliction is not a courtesy. Sharing locations with the parties is how a convoy survives a contested road." },
    // durable solutions
    { icon: "🕊️", title: "A Durable-Solutions Pact Is Signed", tag: "displacement", why: "Governments and partners commit to ending displacement, not just managing it forever.", fact: "A camp is a symptom. Durable solutions, return, integration or resettlement, are political, and they are the real goal." },
    { icon: "🎓", title: "Refugees Join National Systems", tag: "displacement", why: "Refugee children enter national schools and clinics instead of parallel camp services.", fact: "Including refugees in national systems is cheaper, fairer, and the first real step out of permanent encampment." },
    // public health
    { icon: "💉", title: "A Mass Vaccination Succeeds", tag: "health", why: "A campaign reaches enough children fast enough to stop an outbreak before it explodes.", fact: "In one displacement response, coordinated measles and cholera campaigns held mortality below the emergency threshold." },
    { icon: "📟", title: "Early Warning Catches an Outbreak", tag: "health", why: "Surveillance flags a cluster of cases in time to ring-fence it before it spreads.", fact: "An early-warning alert system among hundreds of thousands of refugees can catch an epidemic signal in days, not weeks." },
    // accountability and community
    { icon: "👂", title: "The AAP Feedback Loop Closes", tag: "community", why: "People report a problem and actually see the response change because of it.", fact: "Accountability means closing the loop, not just logging the complaint. If we are not accountable to them, we are accountable to no one." },
    { icon: "📹", title: "A Youth Campaign Goes Viral", tag: "youth", why: "A video made by young people does what a press release never could, and the queues return.", fact: "Young people are not a future stakeholder group. They are a present one, with reach the agency simply lacks." },
    { icon: "🌍", title: "A South-South Exchange", tag: "any", why: "A neighbour who solved this last year sends their playbook, and you skip a year of mistakes.", fact: "Peer learning between countries beats importing a distant template every time." },
    { icon: "🏥", title: "Local Capacity Holds", tag: "community", why: "A national team you trained runs the response itself, and your job shrinks to encouragement.", fact: "Local capacity is the only kind that stays after the mission leaves. It was the point all along." },
    { icon: "📡", title: "Connectivity Reaches the Last District", tag: "digital", why: "A new tower goes live, and a region that was invisible appears on the map overnight.", fact: "Without connectivity, every other digital plan is just a drawing on a wall." },
  ];

  /* ----------------------------------------------------------------------
   * FIELD NOTES,  fun facts and field wisdom dropped on neutral note squares.
   * No movement. Short, vivid, and true to how the work really goes.
   * -------------------------------------------------------------------- */
  CG.FIELD_NOTES = [
    // coordination wisdom
    "Coordination is a means, never an end. People do not eat coordination.",
    "The first responders are always local. They were there before us and stay long after.",
    "Nothing about us without us. Design with the people most affected.",
    "A meeting is not a decision, and a decision is not delivery.",
    "You coordinate by influence, not authority. The best legacy carries no logo.",
    "No shared data, no shared picture, no shared response.",
    "Trust moves at the speed of relationships, not reports.",
    "Famine is a failure of politics, not a failure of food.",
    "Anticipatory action is cheaper than the funeral it prevents.",
    "Act before the disaster, not after the headline.",
    "Cash is dignity. Where markets work, let people choose.",
    "Protection is not soft. Protection is life-saving.",
    "Humanity, neutrality, impartiality, independence. In that order, always.",
    "Neutrality is not silence in the face of atrocity.",
    "Our presence is never neutral to those we help, so first, do no harm.",
    "Leave no one behind means finding the ones already left behind.",
    "Access is negotiated every day, with everyone, forever.",
    "The pledge is not the payment. Count what arrives, not what is announced.",
    "Affected people are not beneficiaries. They are rights-holders.",
    "Localization is not subcontracting risk. It is sharing power.",
    "Look after your team, or you will have no team to look after anyone.",
    "The most expensive aid is the aid that arrives too late.",
    "A camp is a symptom. Solutions are political.",
    "Mandates divide us. The people we serve do not see the lines.",
    "Listen first. The community already knows what it needs.",
    "Resilience is built in the calm, not declared in the crisis.",
    "A shared assessment stops six agencies from surveying the same village six times.",
    "Disaggregated data is how leave no one behind stops being a slogan.",
    "Interoperability means a refugee's record follows them, not the other way around.",
    // facts and figures
    "Every dollar spent on anticipatory action can return up to seven in losses avoided.",
    "CERF can approve funds in minutes and disburse within 24 to 72 hours of a crisis.",
    "The Grand Bargain promised a quarter of aid to local actors. Direct funding is still a fraction of that.",
    "Famine is declared only when a fifth of households face extreme hunger and two in ten thousand die each day.",
    "Forced displacement worldwide has nearly doubled in a decade, past 120 million people, while resources stayed flat.",
    "Most of today's disasters are weather and climate related, and the trend is one direction.",
    "Cash and voucher assistance is now roughly a fifth of all international humanitarian aid.",
    "Resident Coordinators lead UN country teams in more than 130 countries and territories.",
    "The IPC five-phase scale is the authority that turns hunger into a number the world cannot ignore.",
    "Women and children are consistently the majority of the forcibly displaced.",
    "A reminder at the right moment, in the right voice, can outperform a brand-new clinic.",
    "Faith leaders can carry a public-health message further than any ministry.",
  ];

  /* ----------------------------------------------------------------------
   * TROPHY CARDS,  drawn on a 🏆 square. Recognition: collect it, roll again.
   * {role} and {theatre} are filled in for the player who lands here, so the
   * recognition fits their job title and posting.
   * -------------------------------------------------------------------- */
  CG.TROPHY_CARDS = [
    { icon: "🏆", title: "A UN21 Award", why: "Your work as {role} in {theatre} wins the Secretary-General's own award for excellence in UN service.", fact: "Recognition is fuel. Shared credit is what makes a team want to do it all again." },
    { icon: "🏅", title: "A Standing Ovation", why: "At the General Assembly, the progress in {theatre} earns the team a rare round of applause.", fact: "The best legacy carries no single logo, only a result that everyone helped build." },
    { icon: "🎖️", title: "A Secretary-General Commendation", why: "Your service as {role} is named personally from the thirty-eighth floor, and morale across the team soars.", fact: "Personal recognition costs nothing and travels far. Pass it down, not up." },
    { icon: "⭐", title: "A Delivering as One Model", why: "Neighbouring teams ask to copy how {theatre} ran as one UN, the sincerest compliment in the system.", fact: "When others borrow your approach, the idea has outgrown you. That is exactly the goal." },
    { icon: "🌟", title: "Praised by the Community", why: "The people you serve in {theatre} single out your team's work, the recognition that matters most of all.", fact: "The verdict that counts is not in a report. It is on the doorstep." },
    { icon: "📰", title: "A Good-Practice Case Study", why: "The response in {theatre} is written up across the sector as how coordination should be done.", fact: "Evidence earns the spotlight. Innovation that scales beats innovation that only dazzles." },
    { icon: "🕊️", title: "A Humanitarian Honour", why: "Your work as {role} earns a global award for service to people forced from their homes.", fact: "The honour belongs to the front line, most of them national staff, who carried the risk." },
    { icon: "🎯", title: "An SDG Action Award", why: "Measurable, accelerated progress in {theatre} is recognised on the world stage.", fact: "Reaching the furthest behind first is not charity. It is the whole point of the 2030 Agenda." },
  ];

  /* ----------------------------------------------------------------------
   * DIAMOND CARDS,  drawn on a 💎 square. Treasure: collect it, hop forward.
   * -------------------------------------------------------------------- */
  CG.DIAMOND_CARDS = [
    { icon: "💎", title: "An Unearmarked Reserve", why: "A flexible, unearmarked allocation turns up with no strings, and you put it straight to the worst gap.", fact: "Unearmarked funding is the most valuable kind in a fast-moving crisis. It buys the freedom to do the right thing." },
    { icon: "💎", title: "A Forgotten Warehouse", why: "A logistics officer finds a store everyone forgot existed, full of exactly what is needed.", fact: "In an emergency, knowing what you already have is half the battle." },
    { icon: "💎", title: "A Quiet Champion", why: "A well-placed official clears three stuck approvals in an afternoon, and the team leaps ahead.", fact: "Trust, once earned, moves faster than any memo ever could." },
    { icon: "💎", title: "A Windfall Grant", why: "A foundation you impressed last year sends an unsolicited grant, no conditions attached.", fact: "Credibility compounds. The quiet work you did last year pays out today." },
    { icon: "💎", title: "A Standby Partner Deploys", why: "A roster surges in exactly the specialist you were missing, fully funded, within the week.", fact: "Standby partnerships are pre-arranged so that surge capacity arrives in days, not months." },
    { icon: "💎", title: "Pre-Positioned Stock Found", why: "Contingency stock placed before the season is right where the road washed out.", fact: "Pre-positioning is unglamorous and it is the single cheapest way to be fast." },
  ];

  /* ----------------------------------------------------------------------
   * SURPRISE CARDS,  drawn on a ❓ square. A mystery, with an effect:
   *   bonus   = roll again       advance = hop forward
   *   gem     = collect a diamond  skip   = lose your next turn
   * -------------------------------------------------------------------- */
  CG.SURPRISE_CARDS = [
    { icon: "🎁", title: "A Partner Delivers Early", why: "A partner finishes ahead of schedule, and the team gets an unexpected head start.", fact: "Under-promise and over-deliver: the rarest and most trusted habit in the field.", effect: "bonus" },
    { icon: "🍀", title: "A Lucky Break", why: "The stars align and a stubborn obstacle simply clears itself overnight.", fact: "Luck favours the teams that quietly prepared the ground for it.", effect: "advance" },
    { icon: "💎", title: "A Hidden Gem", why: "You stumble on a resource nobody was counting on.", fact: "Resourcefulness is a coordination superpower. Use what is already there.", effect: "gem" },
    { icon: "☕", title: "A Meeting That Ran Long", why: "A coordination session runs three hours over, and the rest of the day is gone.", fact: "Meetings are not coordination. Decisions are.", effect: "skip" },
    { icon: "📨", title: "An Urgent Request from HQ", why: "Headquarters wants a report by morning, and the field work has to wait.", fact: "Protect field time fiercely. The people you serve are not in the inbox.", effect: "skip" },
    { icon: "🌟", title: "A Star Volunteer", why: "A volunteer's idea saves a week of work in a single afternoon.", fact: "The people closest to a problem usually hold the cheapest solution.", effect: "advance" },
    { icon: "🤝", title: "An Old Ally Calls", why: "A contact from a past posting opens a door you did not know was there.", fact: "Networks are the quiet infrastructure of getting anything done.", effect: "bonus" },
    { icon: "🧭", title: "A Wrong Turn", why: "A convoy takes the wrong road and loses half a day to a washed-out track.", fact: "Local knowledge is not optional. The map is never the territory.", effect: "skip" },
    { icon: "📻", title: "A Radio Address Lands", why: "A clear message on local radio reaches further than a month of meetings, and uptake jumps.", fact: "Reach people where they already listen, in the language they think in.", effect: "advance" },
    { icon: "🛰️", title: "A Satellite Pass Helps", why: "Fresh imagery shows where the need is greatest, and your targeting sharpens at once.", fact: "Satellites show where the road ends and the need begins.", effect: "bonus" },
    { icon: "🔌", title: "The Generator Fails", why: "The office loses power mid-crisis, and a day of work goes with it.", fact: "Resilience is boring until the day it is everything. Plan for the outage.", effect: "skip" },
    { icon: "🎒", title: "A Returning Expert", why: "A seasoned colleague rotates back in, and a stalled file moves in an afternoon.", fact: "Institutional memory is a resource. Hold on to the people who carry it.", effect: "gem" },
  ];

  /* ----------------------------------------------------------------------
   * NARRATOR LINES,  spoken intros/outros that wrap the journey in story.
   * -------------------------------------------------------------------- */
  CG.STORY = {
    opening:
      "You step off the plane into the heat. The Cooperation Framework is signed, the team is half-formed, and a hundred partners are watching to see who you are. Five capabilities travel with you, the UN 2.0 Quintet of Change: Data, Innovation, Digital, Strategic Foresight, and Behavioural Science. Ladders strengthen them, holes set them back. The road to a finished mandate runs a hundred squares long. Roll, and begin.",
    // Spoken when a player crosses into a new zone of the board (every 25).
    zones: [
      "Arrival. Map the needs, stand up the coordination, and earn the first yes.",
      "The honeymoon ends. Now the country watches how you carry pressure, and how you share the credit.",
      "The seeds you planted are ready to bloom, or to wilt. The hardest trade-offs all arrive together.",
      "Your term is ending. Everything now is legacy, and the best legacy carries no logo. Finish the road.",
    ],
    winVsAI: "You reach the end of the road first. You leave the country a little stronger, a little fairer, and quite able to do without you. Mandate complete.",
    loseVsAI: "A rival mission finishes first this time. The road will still be here tomorrow. Run it again.",
  };
})();
