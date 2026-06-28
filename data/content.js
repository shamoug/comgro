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
    // West Africa
    "Amara", "Kwame", "Kofi", "Ama", "Abena", "Yaw", "Adwoa", "Chidi", "Ngozi",
    "Emeka", "Chinwe", "Femi", "Bola", "Tunde", "Folake", "Mamadou", "Aminata",
    "Fatou", "Ousmane", "Mariama", "Sekou", "Awa", "Boubacar", "Salif", "Kadiatou",
    "Idris", "Esi", "Nuru",
    // East Africa
    "Wanjiru", "Kamau", "Njeri", "Otieno", "Achieng", "Wairimu", "Amani", "Baraka",
    "Zuri", "Neema", "Juma", "Rehema", "Halima", "Yohannes", "Selam", "Abebe",
    "Tigist", "Mekonnen", "Hanan", "Bekele", "Genet", "Tesfaye", "Mwangi",
    // Southern Africa
    "Thabo", "Nomvula", "Sipho", "Lerato", "Mandla", "Naledi", "Themba", "Bongani",
    "Zanele", "Tendai", "Farai", "Tafadzwa", "Rutendo", "Kagiso", "Palesa",
    "Lindiwe", "Nokuthula",
    // North Africa and the Arab world
    "Omar", "Yasmin", "Khaled", "Layla", "Tariq", "Noor", "Samir", "Rania",
    "Hassan", "Mona", "Karim", "Salma", "Bilal", "Dina", "Faisal", "Huda",
    "Amir", "Leila", "Zaid", "Maryam", "Anwar", "Sana", "Walid", "Nadia",
    "Youssef", "Amal", "Hamza", "Farida", "Mustafa", "Ghada", "Mariam", "Sanaa",
    "Rashid", "Sami", "Fatima", "Aisha", "Zara", "Yara",
    // South Asia
    "Arjun", "Priya", "Ravi", "Anjali", "Vikram", "Deepa", "Sanjay", "Meera",
    "Rahul", "Kavita", "Aditya", "Sunita", "Imran", "Ayesha", "Saira", "Farhan",
    "Zainab", "Suresh", "Lakshmi", "Pranav", "Divya", "Nadeem", "Asha", "Manoj",
    "Dipa",
    // East Asia
    "Wei", "Mei", "Jian", "Ling", "Hao", "Xiaoyan", "Yang", "Fang", "Hiroshi",
    "Yuki", "Kenji", "Sakura", "Takeshi", "Akiko", "Minjun", "Jiwoo", "Seojun",
    "Hana", "Jihoon", "Soyeon", "Naoko", "Chen", "Lin", "Liang", "Joon", "Bao",
    // Southeast Asia
    "Linh", "Minh", "Thuy", "Somchai", "Malee", "Arun", "Siti", "Budi", "Dewi",
    "Putri", "Bayu", "Dara", "Aung", "Thiri", "Bopha", "Rizal", "Indah", "Kasem",
    // Central Asia
    "Aibek", "Gulnara", "Timur", "Aigerim", "Bakyt", "Nargiza", "Rustam",
    "Dilnoza", "Azamat", "Saltanat", "Kanat", "Madina", "Erlan", "Zhanar",
    "Feruza", "Daniyar",
    // The Pacific
    "Sione", "Mere", "Tevita", "Litia", "Sela", "Malia", "Viliami", "Manaia",
    "Moana", "Tane", "Aroha", "Wiremu", "Ngaire",
    // Latin America
    "Carlos", "Sofia", "Diego", "Valentina", "Mateo", "Camila", "Andres",
    "Lucia", "Javier", "Isabela", "Gabriel", "Daniela", "Rodrigo", "Paula",
    "Fernando", "Renata", "Pablo", "Catalina", "Emilio", "Beatriz", "Mariana",
    "Rosa", "Carmen", "Ana",
    // The Caribbean
    "Andre", "Shanice", "Marlon", "Keisha", "Damian", "Tamara", "Latoya",
    "Camille", "Rohan", "Indira", "Yolanda",
    // Europe
    "Lucas", "Emma", "Hugo", "Chloe", "Liam", "Sophie", "Lena", "Pierre",
    "Marie", "Lars", "Anna", "Jan", "Eva", "Sven", "Ingrid", "Matteo", "Giulia",
    "Ivan", "Olga", "Dmitri", "Pavel", "Tomasz", "Andrei", "Elena", "Goran",
    "Stefan", "Mihai", "Ioana", "Bogdan", "Daria", "Marek", "Bjorn", "Astrid",
    "Erik", "Freya", "Magnus", "Sigrid", "Henrik", "Mikael", "Anders", "Kari",
    "Eero", "Sergei", "Viktor", "Anja", "Niko", "Oscar", "Marcus", "Grace",
    // Indigenous names
    "Nizhoni", "Tala", "Aiyana", "Dakota", "Mato", "Koda", "Chenoa", "Kai",
    "Nodin", "Sakari", "Aslak", "Nanook", "Jarrah", "Kirra", "Lowanna", "Yindi",
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
    info: "behaviour", community: "behaviour", youth: "behaviour", behaviour: "behaviour",
    foresight: "foresight",
  };

  CG.quintetForTag = function (tag) {
    if (tag && CG.QUINTET_BY_TAG[tag]) return CG.QUINTET_BY_TAG[tag];
    return CG.QUINTET[Math.floor(Math.random() * CG.QUINTET.length)].key;
  };
  CG.quintetMeta = function (key) {
    for (let i = 0; i < CG.QUINTET.length; i++) if (CG.QUINTET[i].key === key) return CG.QUINTET[i];
    return CG.QUINTET[0];
  };

  // Short, professional affiliation label (org / agency acronym) for the
  // identity badge on every in-play card. Most affiliations are already a
  // crisp acronym; only the few long descriptive ones are condensed here.
  CG.AFF_SHORT = {
    "UN Resident Coordinator's Office": "UN RCO",
    "UN Strategic Foresight": "UN Foresight",
    "UN Communications": "UN Comms",
    "UN Innovation": "UN Innovation",
    "National Government": "Government",
    "Independent Monitor": "Independent",
  };
  CG.affShort = function (aff) { return CG.AFF_SHORT[aff] || aff; };

  /* ----------------------------------------------------------------------
   * JOB TITLES,  drawn once per player at setup (your avatar this game).
   * The real roles around a country team: UN, NGO, government, donor, community.
   * -------------------------------------------------------------------- */
  CG.ROLES = [
    { icon: "🧭", name: "Resident Coordinator", aff: "UN Resident Coordinator's Office", tag: "Leads the whole UN team. No orders, only influence." },
    { icon: "🛟", name: "Humanitarian Coordinator", aff: "OCHA", tag: "Holds the response. Chairs the HCT when crisis hits." },
    { icon: "🗂️", name: "Humanitarian Affairs Officer", aff: "OCHA", tag: "OCHA's workhorse. Keeps the coordination running." },
    { icon: "🧩", name: "Cluster Coordinator", aff: "Inter-Agency", tag: "Convenes a whole sector: who does what, where." },
    { icon: "🗺️", name: "Information Management Officer", aff: "OCHA", tag: "Turns chaos into maps, dashboards and the 4W." },
    { icon: "📋", name: "Needs Assessment Officer", aff: "OCHA", tag: "Runs the surveys that tell the response who needs what." },
    { icon: "💧", name: "WASH Specialist", aff: "UNICEF", tag: "Keeps water flowing. The first line against cholera." },
    { icon: "🛡️", name: "Protection Officer", aff: "UNHCR", tag: "Safeguards rights and safety as life-saving work." },
    { icon: "🧒", name: "Child Protection Officer", aff: "UNICEF", tag: "Traces separated children, runs the safe spaces." },
    { icon: "🤲", name: "GBV Specialist", aff: "UNFPA", tag: "Stands up safe spaces and referral pathways from day one." },
    { icon: "💳", name: "Cash and Markets Adviser", aff: "WFP", tag: "Reads the markets, decides when cash beats in-kind." },
    { icon: "🚚", name: "Logistics Cluster Lead", aff: "WFP", tag: "Moves the pipeline to the last kilometre." },
    { icon: "📡", name: "Emergency Telecoms Officer", aff: "WFP", tag: "Restores connectivity where the networks went dark." },
    { icon: "🩺", name: "Public Health Epidemiologist", aff: "WHO", tag: "Tracks the outbreak, triggers the alarm in time." },
    { icon: "🥣", name: "Nutrition Specialist", aff: "UNICEF", tag: "Screens for malnutrition, keeps children alive." },
    { icon: "📊", name: "Data Officer", aff: "OCHA", tag: "Turns numbers into decisions everyone can defend." },
    { icon: "🔬", name: "Innovation Lab Lead", aff: "UN Innovation", tag: "Tests bold ideas before they scale." },
    { icon: "🔭", name: "Foresight Analyst", aff: "UN Strategic Foresight", tag: "Reads the horizon for the next shock." },
    { icon: "📣", name: "Communications Officer", aff: "UN Communications", tag: "Shapes the story before rumour does." },
    { icon: "🏛️", name: "Government NDMA Focal Point", aff: "National Government", tag: "Owns early warning, declarations, and the response." },
    { icon: "🤝", name: "National NGO Director", aff: "National NGO", tag: "First to respond, last to leave, closest to the community." },
    { icon: "🙋", name: "Community Mobiliser", aff: "Community", tag: "The trusted local face. Carries the message both ways." },
    { icon: "💰", name: "Donor Programme Officer", aff: "Donor", tag: "Decides which appeals get funded, and on what terms." },
    { icon: "✊", name: "Youth Leader", aff: "Civil Society", tag: "Energy, reach, and zero patience for delay." },
    // senior leadership and coordination
    { icon: "🤝", name: "Deputy Humanitarian Coordinator", aff: "OCHA", tag: "Carries the operational load and the sub-national coordination." },
    { icon: "🏢", name: "Head of OCHA Office", aff: "OCHA", tag: "Runs coordination, advocacy and the financing in one country." },
    { icon: "🔁", name: "Inter-Cluster Coordinator", aff: "Inter-Agency", tag: "Keeps every sector pulling in the same direction." },
    { icon: "📍", name: "Area Coordinator", aff: "OCHA", tag: "Owns the response for one slice of the map." },
    { icon: "🛰️", name: "Subnational Coordinator", aff: "OCHA", tag: "Runs the hub far from the capital, closest to the field." },
    // access, civil-military, security
    { icon: "🚪", name: "Access Negotiator", aff: "OCHA", tag: "Talks every checkpoint open, with everyone, every day." },
    { icon: "🪖", name: "Civil-Military Coordination Officer", aff: "UN-CMCoord", tag: "Guards the line between the soldiers and the aid." },
    { icon: "🛰️", name: "Security Officer (UNDSS)", aff: "UNDSS", tag: "Reads the threat so the team can keep working safely." },
    { icon: "📞", name: "Liaison Officer", aff: "OCHA", tag: "Keeps the doors to government and partners open." },
    // information, data, assessment
    { icon: "📝", name: "Reporting Officer", aff: "OCHA", tag: "Turns a chaotic week into a situation report that lands." },
    { icon: "🛰️", name: "GIS Officer", aff: "OCHA", tag: "Draws the maps the whole operation steers by." },
    { icon: "🧮", name: "Data Scientist", aff: "UN Data", tag: "Finds the signal in the noise, and forecasts the next one." },
    { icon: "📐", name: "Monitoring and Evaluation Officer", aff: "Inter-Agency", tag: "Checks whether the help actually helped." },
    { icon: "🔍", name: "Third-Party Monitor", aff: "Independent Monitor", tag: "Verifies the aid landed where no staff can safely go." },
    // sector and technical
    { icon: "🩹", name: "Health Cluster Coordinator", aff: "WHO", tag: "Lines up every clinic and partner so no one is missed." },
    { icon: "🛖", name: "Shelter and NFI Specialist", aff: "IOM", tag: "Gets a roof and the basics over families fast." },
    { icon: "🏕️", name: "Camp Management Officer", aff: "IOM", tag: "Holds standards, services and dignity inside the site." },
    { icon: "🌾", name: "Food Security Officer", aff: "FAO / WFP", tag: "Reads the hunger map before it turns into a famine." },
    { icon: "💣", name: "Mine Action Officer", aff: "UNMAS", tag: "Clears the ground so returnees can walk it safely." },
    { icon: "📚", name: "Education in Emergencies Specialist", aff: "UNICEF", tag: "Keeps children learning when everything else stops." },
    { icon: "🧠", name: "MHPSS Officer", aff: "WHO", tag: "Tends the wounds no scan will ever show." },
    // recovery, resilience, risk
    { icon: "🌅", name: "Early Recovery Adviser", aff: "UNDP", tag: "Restarts livelihoods before the cameras leave." },
    { icon: "🕊️", name: "Durable Solutions Adviser", aff: "UNHCR", tag: "Works to end displacement, not just manage it." },
    { icon: "🌐", name: "Resilience Adviser", aff: "UNDP", tag: "Builds the strength to take the next shock standing." },
    { icon: "⚠️", name: "Disaster Risk Reduction Specialist", aff: "UNDRR", tag: "Stops the hazard from ever becoming a disaster." },
    { icon: "🛡️", name: "Anticipatory Action Adviser", aff: "OCHA", tag: "Releases the plan before the forecast becomes a flood." },
    // accountability, community, inclusion
    { icon: "🚨", name: "PSEA Coordinator", aff: "Inter-Agency", tag: "Makes it safe to report, and acts when someone does." },
    { icon: "👂", name: "AAP Adviser", aff: "Inter-Agency", tag: "Puts affected people at the centre of the decision." },
    { icon: "📻", name: "Risk Communication Officer", aff: "WHO", tag: "Gets the trusted message out before the rumour does." },
    { icon: "♿", name: "Disability Inclusion Adviser", aff: "Inter-Agency", tag: "Makes sure no one is left at the edge of the queue." },
    { icon: "⚖️", name: "Gender Adviser", aff: "UN Women", tag: "Reads the different risks women, men, girls and boys carry." },
    // finance, partnerships
    { icon: "🏦", name: "Pooled Fund Manager", aff: "OCHA", tag: "Steers flexible cash to the gap that matters most." },
    { icon: "🤲", name: "Partnerships Officer", aff: "UN", tag: "Builds the alliances that carry the whole response." },
    { icon: "📨", name: "Donor Relations Officer", aff: "Donor", tag: "Keeps the money honest and the reporting clean." },
    // national, local, frontline
    { icon: "🏥", name: "Community Health Worker", aff: "Community", tag: "The first and nearest line of care, on foot." },
    { icon: "📋", name: "Registration Officer", aff: "UNHCR", tag: "Gives people the paper that unlocks their rights." },
    { icon: "🗃️", name: "Protection Case Worker", aff: "National NGO", tag: "Walks one person from danger to safety, file by file." },
    { icon: "🚐", name: "Logistics Officer", aff: "WFP", tag: "Moves the fleet, the fuel and the freight on time." },
    { icon: "🌍", name: "Refugee Coordinator", aff: "UNHCR", tag: "Leads the refugee response under UNHCR's model." },
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
    { icon: "🏖️", name: "The Saltflats Republic", blurb: "A low coastal nation where salt water is poisoning the wells and whole villages are weighing whether to move.", tags: ["climate", "flood", "displacement", "community"] },
    { icon: "🌵", name: "The Ashfork Plateau", blurb: "Highland farms gone to dust, a generation leaving for the cities, and aid that arrives a season too late.", tags: ["drought", "youth", "displacement", "data"] },
    { icon: "🛤️", name: "The Junction States", blurb: "A landlocked crossroads of borders and convoys where every shipment passes three flags before it lands.", tags: ["supply", "access", "governance", "displacement"] },
    { icon: "🏯", name: "Old Harran Port", blurb: "A historic harbour city of a million, cholera in the canals, heat in the alleys, and rumour on every phone.", tags: ["health", "info", "digital", "governance"] },
    { icon: "🌫️", name: "The Maral Marshes", blurb: "Vanishing wetlands and fishing clans, choked by drought upstream and disputes over what water remains.", tags: ["climate", "community", "governance", "access"] },
    { icon: "🏗️", name: "The Concrete Frontier", blurb: "A boomtown thrown up overnight on resource money, with informal camps on the edges nobody planned for.", tags: ["governance", "funding", "youth", "health"] },
    { icon: "🌬️", name: "The Windward Isles", blurb: "A scatter of cyclone-battered islands where one airstrip and one clinic serve a dozen far-flung shores.", tags: ["storm", "access", "climate", "supply"] },
    { icon: "🪦", name: "The Quieted Province", blurb: "A ceasefire that holds by the hour, returnees trickling back to mined fields and ministries that barely function.", tags: ["displacement", "governance", "community", "access"] },
    { icon: "🏜️", name: "The Tamour Wastes", blurb: "An arid borderland of pastoralists and traders, where a failed rain can empty a market in a week.", tags: ["drought", "community", "data", "access"] },
    { icon: "🌧️", name: "The Monsoon Lowlands", blurb: "A delta of rice and rivers that floods on schedule, where the only safe stock is the stock you moved before the rains.", tags: ["flood", "supply", "climate", "health"] },
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
    { icon: "🦗", title: "A Locust Swarm Descends", tag: "climate", why: "A swarm the size of a city eats the harvest in hours, and food prices climb by nightfall.", fact: "A single square kilometre of swarm holds about 40 million locusts and eats in a day what 35,000 people would. You fight it from the air, not the ground." },
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
    // more natural hazards
    { icon: "🌧️", title: "The Monsoon Cuts the Last Road", tag: "flood", why: "The rains arrive on schedule and the only dry-season road dissolves into mud, stranding the stocks you did not move in time.", fact: "A single forty-tonne truck carries nearly seven times the load of a cargo plane, so losing the road is brutally expensive." },
    { icon: "🌪️", title: "A Tornado Outbreak Hits the Plains", tag: "storm", why: "A line of storms levels villages in minutes, scattering damage too wide for any single team to map fast.", fact: "Most of today's recorded disasters are weather, climate or water related, and the count keeps climbing decade on decade." },
    { icon: "🔥", title: "Wildfire Races the Valley", tag: "climate", why: "Fire jumps the ridge and forces a mass evacuation into sites that are not ready for them.", fact: "Secondary displacement strains reception capacity that was already stretched thin." },
    { icon: "🌋", title: "The Volcano Wakes", tag: "climate", why: "An eruption empties a whole district under ash, and the exclusion zone keeps moving the goalposts.", fact: "Ashfall poisons water and collapses roofs, so the hazard outlives the eruption by weeks." },
    { icon: "🏔️", title: "An Avalanche Seals the Pass", tag: "access", why: "Snow closes the only mountain route, and the cut-off valleys must live on whatever was pre-positioned.", fact: "In winter terrain, pre-positioning is not prudence, it is the entire plan." },
    { icon: "🌊", title: "A Tsunami Strikes the Coast", tag: "storm", why: "The wave erases ports, clinics and records all at once, and the responders are themselves among the affected.", fact: "Local first responders pull most survivors from the rubble in the first hours, long before any international team lands." },
    { icon: "🌡️", title: "A Deadly Heat Dome Settles", tag: "climate", why: "Weeks of extreme heat kill quietly in the tents and the tin-roofed settlements, and no classic appeal is ever triggered.", fact: "Heat is a silent killer. Europe alone saw an estimated sixty thousand heat deaths in a single recent year, most never recorded as heat." },
    { icon: "🏚️", title: "Aftershocks Keep Coming", tag: "climate", why: "Each new tremor undoes the morning's clearance and sends rattled families back into the open.", fact: "The first seventy-two hours decide most survival, but slope-loosening aftershocks can trigger landslides for years." },
    { icon: "💨", title: "A Sandstorm Grounds the Airlift", tag: "access", why: "A wall of dust closes the airstrip for days, and the only fast supply line goes dark.", fact: "When the air bridge stops, the cost of every delay lands on the people furthest from the warehouse." },
    { icon: "🌊", title: "A Glacial Lake Bursts", tag: "flood", why: "A mountain lake breaks its natural dam and a wall of water takes out bridges downstream without warning.", fact: "Cascading hazards chain one into the next, so you plan for the whole sequence, not the first event." },
    // more conflict and displacement
    { icon: "🏘️", title: "Sudan-Scale Displacement", tag: "displacement", why: "Fighting uproots millions in months, and the caseload outruns every plan and every appeal.", fact: "Internally displaced people are the largest group of the forcibly displaced, far outnumbering refugees worldwide." },
    { icon: "🧭", title: "A Mixed Movement Overwhelms Transit", tag: "displacement", why: "Refugees, migrants and returnees arrive together on the same route, and no single mandate covers them all.", fact: "Refugee responses run under UNHCR's coordination model, distinct from the cluster system, even when caseloads overlap." },
    { icon: "🏕️", title: "The Settlement Doubles Overnight", tag: "displacement", why: "A new influx packs people in past every standard, and disease and tension rise together.", fact: "Sphere sets a floor of fifteen litres of water per person per day and one toilet per twenty-five people. Cross it and cholera follows." },
    { icon: "🔫", title: "Armed Groups Tax the Aid", tag: "access", why: "Checkpoints demand a cut of every load, and paying it or refusing it both carry a cost.", fact: "Diversion is managed through third-party monitoring, but zero diversion often means zero access." },
    { icon: "🚷", title: "A Siege Tightens", tag: "access", why: "A town is encircled and nothing moves in or out, so your caseload is reachable only on paper.", fact: "Reaching the besieged turns on humanitarian notification and patient deconfliction with every party to the fighting." },
    { icon: "🏚️", title: "Returnees Walk Into Minefields", tag: "displacement", why: "Families head home to fields still seeded with explosives, and going back proves as deadly as fleeing.", fact: "Going home is not the end of displacement. Landmines and weak institutions can stall recovery for a generation." },
    { icon: "🧊", title: "Winter Catches the Displaced", tag: "displacement", why: "Cold arrives before the shelter does, and the very young and very old pay first.", fact: "Women and children are consistently the majority of the displaced, and children are about forty percent of them." },
    // more disease
    { icon: "🦟", title: "Malaria Surges After the Flood", tag: "health", why: "Standing water breeds mosquitoes for weeks, and cases spike just as the clinics are still drying out.", fact: "The flood's second wave is often disease, which is why water and health plan as one." },
    { icon: "💧", title: "Acute Watery Diarrhoea Spreads", tag: "health", why: "Contaminated water in a crowded site sickens hundreds, and the treatment tents fill overnight.", fact: "Cholera is a water disease as much as a health one. Untreated it can kill half of severe cases, treated it kills under one in a hundred." },
    { icon: "🧫", title: "Diphtheria Returns to the Camp", tag: "health", why: "A disease the world half-forgot reappears where vaccination coverage collapsed.", fact: "Outbreaks of the preventable are proof that routine immunisation already failed." },
    { icon: "🩸", title: "Dengue Overwhelms the Wards", tag: "health", why: "An urban outbreak floods the hospitals as the rainy season peaks.", fact: "Climate is widening the map of mosquito-borne disease, so surveillance has to widen with it." },
    { icon: "🐄", title: "A Zoonotic Spillover Is Detected", tag: "health", why: "A new pathogen jumps from animals to people in a remote district, and the clock starts before anyone is ready.", fact: "Early-warning surveillance can verify most outbreak alerts within forty-eight hours, catching a signal in days, not weeks." },
    { icon: "💉", title: "Vaccine Stocks Run Short", tag: "health", why: "A campaign stalls because the global stockpile cannot meet demand, and you must choose who goes without.", fact: "In one recent year the cholera vaccine stockpile held barely thirty million doses against more than seventy million requested, forcing a single-dose strategy." },
    // more funding
    { icon: "📊", title: "The Appeal Stalls Below Half", tag: "funding", why: "Months in, the response plan sits around half funded, and the most neglected sectors get nothing.", fact: "Global appeals were only about half funded in a recent year, and the most forgotten crises ran far below even that." },
    { icon: "✂️", title: "A Global Funding Cut Lands", tag: "funding", why: "A donor capital slashes its aid budget, and ration cuts cascade across whole operations at once.", fact: "A recent year saw the largest drop in humanitarian funding ever recorded, measured in billions, not millions." },
    { icon: "🍚", title: "Rations Are Cut in Half", tag: "funding", why: "With the pipeline short, families that depended on a full ration now receive a fraction of it.", fact: "Cash and vouchers are now roughly a fifth of all humanitarian aid, but when the money shrinks, the ration is first to fall." },
    { icon: "🧾", title: "Reporting Burden Buries the Team", tag: "funding", why: "A dozen donors each demand their own format, and staff spend the week writing instead of delivering.", fact: "Harmonised reporting was a Grand Bargain promise precisely because duplicated paperwork is a hidden tax on delivery." },
    { icon: "🪤", title: "The Pledge Was Double-Counted", tag: "funding", why: "A headline figure turns out to recycle old money, and the new programmes built on it have no floor.", fact: "Veterans track money committed and money paid as two entirely different numbers." },
    // more access and bureaucracy
    { icon: "📵", title: "A Communications Blackout Falls", tag: "info", why: "Authorities cut the networks, and your teams lose contact with the field at the worst moment.", fact: "When connectivity dies, every digital plan reverts to paper and runners." },
    { icon: "🛻", title: "A Movement Ban Locks Down Staff", tag: "access", why: "A blanket order confines staff to compounds, and delivery freezes while needs keep rising.", fact: "Bureaucratic and movement constraints are logged now as deliberate access impediments, not mere inconvenience." },
    { icon: "🧱", title: "A Bank De-Risks the Operation", tag: "funding", why: "A nervous bank closes the account over sanctions fears, and you cannot move cash to partners.", fact: "Financial de-risking can choke a lawful operation as effectively as any checkpoint." },
    { icon: "📑", title: "A Counter-Terror Clause Freezes a Partner", tag: "governance", why: "Strict donor conditions make supporting a frontline partner legally fraught, and the money stops moving.", fact: "Principled humanitarian action reaches by need alone, but the paperwork around it grows heavier every year." },
    // more supply chain
    { icon: "🚢", title: "The Shipping Lane Closes", tag: "supply", why: "Insurance and risk shut a key sea route, and cargo reroutes the long, costly way around.", fact: "The Logistics Cluster runs common services because no single agency can untangle a broken corridor alone." },
    { icon: "🏭", title: "A Warehouse Burns", tag: "supply", why: "Months of pre-positioned stock are gone in a night, and the season is already turning.", fact: "Knowing what you have, and protecting it, is half of being fast." },
    { icon: "🧯", title: "A Fuel Price Shock Hits", tag: "supply", why: "Costs spike overnight, and the same budget now moves far less of everything.", fact: "Fuel is the hidden input under water pumping, the cold chain, and every kilometre driven." },
    // more information and integrity
    { icon: "🤖", title: "Deepfakes Muddy the Response", tag: "info", why: "Fabricated clips spread distrust faster than your team can verify and correct them.", fact: "Risk-communication teams treat rumour-tracking as surveillance, because a lie is a public-health threat." },
    { icon: "🗳️", title: "Aid Is Politicised in an Election", tag: "governance", why: "Both sides claim or block your distributions for advantage, and impartiality is questioned daily.", fact: "Impartiality means aid by need alone. Defending it is a daily act, not a one-time declaration." },
    { icon: "📰", title: "A Scandal Breaks in the Press", tag: "governance", why: "An unverified story dents donor confidence just as you need it most.", fact: "Transparent, audited reporting is the slow, dull work that survives a bad headline." },
    // more staff and security
    { icon: "🎯", title: "A Convoy Is Ambushed", tag: "access", why: "An attack forces a security pause that halts assistance for everyone, not just one agency.", fact: "The deadliest year on record for aid workers saw hundreds killed, and the vast majority were national staff." },
    { icon: "⛓️", title: "National Staff Are Detained", tag: "governance", why: "The arbitrary arrest of local colleagues freezes the operation and terrifies the team.", fact: "States, not only armed groups, are a fast-growing threat to aid workers, and national staff bear it first." },
    { icon: "🕯️", title: "The Team Loses a Colleague", tag: "any", why: "A death in the field empties the room and asks whether any of this is worth it.", fact: "A coordination system is only as resilient as the grieving people still showing up to run it." },
    // more coordination failures
    { icon: "🧩", title: "Clusters Multiply Into Confusion", tag: "governance", why: "Too many overlapping groups blur who is accountable for what, and gaps hide in the seams.", fact: "Clusters are activated to clarify, not to proliferate, and they are meant to be handed back as capacity recovers." },
    { icon: "📦", title: "Everyone Sends the Same Item", tag: "governance", why: "Agencies all ship blankets and no one ships water, because nobody checked the shared picture.", fact: "The 4W matrix is the dull, vital tool that designs duplication out of a response." },
    { icon: "🗣️", title: "A Parallel Coordination Body Springs Up", tag: "governance", why: "A new actor sets up its own structure beside the existing one, and partners get two sets of asks.", fact: "Coordination is a means to delivery, never a trophy. People do not eat coordination." },
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
    // more funding wins
    { icon: "🎯", title: "CERF Underfunded Window Opens", tag: "funding", why: "A neglected, slow-burning crisis finally draws an allocation when no donor headline would.", fact: "CERF has two windows: rapid response for sudden shocks, and underfunded emergencies for the crises the world forgot." },
    { icon: "📈", title: "The Appeal Crosses Eighty Percent", tag: "funding", why: "A late surge of contributions rescues the sectors that were about to be cut.", fact: "Appeals routinely close around half funded, so crossing eighty percent is the difference between triage and a real plan." },
    { icon: "🔓", title: "Earmarks Are Loosened", tag: "funding", why: "A donor softens its conditions and lets you move money to where it now saves the most lives.", fact: "The Grand Bargain set a target of thirty percent of funding unearmarked or only softly earmarked, the kind that flexes with the crisis." },
    { icon: "💶", title: "A New Donor Joins the Table", tag: "funding", why: "A government that never funded here before makes a first, serious pledge.", fact: "Broadening the donor base is how a response survives any single backer walking away." },
    { icon: "🧾", title: "Reporting Is Harmonised at Last", tag: "funding", why: "Donors agree on one shared format, and your staff get their week back for delivery.", fact: "A single common report was a Grand Bargain promise, because duplicated paperwork is a tax on the field." },
    // more anticipatory action
    { icon: "🌀", title: "Cash Releases Before the Cyclone", tag: "storm", why: "Pre-arranged finance triggers on the forecast, and families evacuate and secure assets while the roads are still open.", fact: "One national framework pre-arranges funds that release three to five days before a cyclone makes landfall." },
    { icon: "🐄", title: "Herders Are Paid to Destock Early", tag: "drought", why: "A forecast trigger lets pastoralists sell animals before the drought crashes the price.", fact: "Acting before a drought, instead of after, can save enormous sums and spare families from selling everything they own." },
    { icon: "🌊", title: "Embankments Are Reinforced in Time", tag: "flood", why: "Early-warning money funds the sandbags and pumps before the river crests, not after.", fact: "Anticipatory flood action has reached people at roughly half the cost of the response that would have followed." },
    // more strategic and framework
    { icon: "📜", title: "The Cooperation Framework Is Renewed", tag: "governance", why: "Government and the UN agree the next multi-year plan, and every agency aligns behind it.", fact: "The Cooperation Framework replaced the old development assistance framework, and now agency country programmes flow from it, not the other way around." },
    { icon: "🧪", title: "The Common Country Analysis Is Refreshed", tag: "data", why: "One updated diagnosis replaces five competing versions of reality.", fact: "The Common Country Analysis is the shared evidence base beneath everything the UN plans in a country." },
    { icon: "📋", title: "The Needs Overview and Plan Align", tag: "data", why: "The picture of who needs what and the plan to reach them finally fit together before the funding cycle.", fact: "The needs overview says who and why, the response plan says what will be done, and together they are the programme cycle." },
    { icon: "🤝", title: "A Triple-Nexus Plan Is Agreed", tag: "any", why: "Humanitarian, development and peace actors commit to one set of collective outcomes.", fact: "The humanitarian-development-peace nexus was formalised by donors so the three stop working in silos." },
    // more clusters and ownership
    { icon: "🩺", title: "The Health Cluster Maps Every Clinic", tag: "health", why: "A shared map of who runs which facility ends the double-coverage and finds the blank spots.", fact: "Each cluster is accountable through its lead agency, and the map it keeps is how gaps stop hiding." },
    { icon: "🏛️", title: "National Authorities Lead the Cluster", tag: "governance", why: "The disaster authority chairs the sector itself, with the UN firmly in support.", fact: "Clusters are meant to work in support of national authorities wherever they exist, and to hand back as capacity returns." },
    { icon: "🤲", title: "A Handover Plan Is Signed", tag: "governance", why: "Partners agree a calendar to transfer the response to national hands, milestone by milestone.", fact: "The best coordination structure is the one designed, from day one, to make itself unnecessary." },
    // more localization
    { icon: "🌱", title: "A Local NGO Joins the Pooled Fund", tag: "community", why: "A frontline national organisation is accredited to receive money directly, not through three layers.", fact: "Country-based pooled funds channel close to half of their allocations to local and national actors, the highest direct share in the system." },
    { icon: "🪙", title: "Direct Local Funding Ticks Up", tag: "community", why: "More money reaches national responders as directly as possible, inching toward the promise.", fact: "The Grand Bargain target is a quarter of funding to local actors, and the direct share is still climbing toward it from far below." },
    { icon: "🧑‍🏫", title: "A Capacity-Sharing Partnership Forms", tag: "community", why: "An international agency and a local one swap skills as equals, not as donor and grantee.", fact: "Localization shares power, not just risk, and capacity is the only kind that stays after the mission leaves." },
    // more cash
    { icon: "💳", title: "A Common Cash System Goes Live", tag: "community", why: "Agencies pay through one shared platform, so families get one predictable transfer instead of five overlapping ones.", fact: "Cash is now roughly a fifth of all humanitarian aid, and a shared system makes every dollar of it go further." },
    { icon: "🧺", title: "The Expenditure Basket Is Recalculated", tag: "data", why: "Transfer values are repriced to the real cost of a month of basics, so the cash actually covers needs.", fact: "Cash is tied to a minimum expenditure basket, the local cost of what a household must buy to get by." },
    // more data and IM
    { icon: "🗺️", title: "Common Operational Datasets Are Agreed", tag: "data", why: "Everyone plans from the same boundaries and the same population figures at last.", fact: "Common operational datasets are the quiet, shared foundation beneath every map in the response." },
    { icon: "📲", title: "A Feedback Hotline Goes Live", tag: "digital", why: "People can call, text or message and actually reach someone who can act.", fact: "Accountability means closing the loop, not just logging the complaint." },
    { icon: "🛰️", title: "Satellite Imagery Sharpens Targeting", tag: "digital", why: "Fresh imagery shows where the damage and the need are greatest, and resources follow the evidence.", fact: "Imagery shows where the road ends and the need begins, often before any survey can reach it." },
    // more access
    { icon: "↔️", title: "A Cross-Border Operation Is Authorised", tag: "access", why: "A mandate to deliver from a neighbouring country reaches people cut off from the capital.", fact: "Cross-line and cross-border modalities are negotiated tools to reach areas outside government control." },
    { icon: "🕊️", title: "A Humanitarian Pause Holds", tag: "access", why: "A negotiated lull in the fighting lets convoys and vaccinators reach areas that were sealed for weeks.", fact: "A pause is bought one conversation at a time, by people who never make the headlines." },
    { icon: "🚁", title: "An Air Bridge Opens", tag: "access", why: "A humanitarian air service starts flying staff and light cargo into places the roads cannot reach.", fact: "When the ground closes, common air services keep the whole community of agencies moving." },
    // more durable solutions and health
    { icon: "🏘️", title: "Refugees Gain the Right to Work", tag: "displacement", why: "A host government opens its labour market, and families start to provide for themselves.", fact: "Including refugees in national systems and economies is cheaper, fairer, and the first real step out of permanent encampment." },
    { icon: "🎒", title: "A Voluntary Return Begins in Dignity", tag: "displacement", why: "People choose to go home with information, support and a real plan, not under pressure.", fact: "The three durable solutions are return, local integration and resettlement, and all of them are political." },
    { icon: "💧", title: "A Water System Is Restored", tag: "health", why: "Clean water flows again in a crowded site, and the cholera curve bends back down.", fact: "Cholera is solved at the tap, not the bedside. The vaccine only buys time while you fix the water." },
    { icon: "🩹", title: "A Measles Campaign Beats the Outbreak", tag: "health", why: "Two-dose coverage climbs past the threshold and stops the spread before it explodes.", fact: "Measles is so contagious that about ninety-five percent of people must be immune to halt it, which takes two doses." },
    { icon: "🧊", title: "The Cold Chain Is Made Whole", tag: "supply", why: "New fridges and monitors close the gaps, and a campaign's vaccines arrive viable.", fact: "Vaccines must stay between two and eight degrees the whole way, and up to half are wasted worldwide when that fails." },
    { icon: "📟", title: "Disease Surveillance Catches a Cluster", tag: "health", why: "An alert system flags a handful of cases in time to ring-fence them.", fact: "Early-warning systems verify most alerts within forty-eight hours, turning weeks of blindness into days of warning." },
    // more accountability, community, capability
    { icon: "🧓", title: "Elders Endorse the Campaign", tag: "behaviour", why: "Trusted community leaders vouch for the vaccinators, and the refusals melt away.", fact: "Community trust is the real cold chain. A boycott once reseeded polio across whole regions." },
    { icon: "👩‍👧", title: "Women Lead the Committees", tag: "community", why: "Affected women take the decision-making seats, and the services finally fit the people using them.", fact: "Nothing about them without them. Design with the people most affected, or design wrong." },
    { icon: "🧠", title: "A Behavioural Nudge Lifts Uptake", tag: "behaviour", why: "A reminder at the right moment, in the right voice, fills a clinic that messaging alone could not.", fact: "Designing for how people really decide can outperform a brand-new facility." },
    { icon: "🔭", title: "A Foresight Exercise Spots the Next Shock", tag: "foresight", why: "The team games out a scenario and pre-positions for a crisis that has not happened yet.", fact: "Reading the next shock before it lands is one of the five capabilities of a modern UN." },
    { icon: "📚", title: "Children Return to Learning", tag: "youth", why: "Temporary classrooms reopen, and a generation's education does not vanish with the crisis.", fact: "Education in emergencies is protection: a school day is also a safe, structured, watched-over day." },
    { icon: "🤖", title: "A Shared Data Platform Cuts Duplication", tag: "digital", why: "One system replaces a dozen spreadsheets, and the arguments shrink to the real decisions.", fact: "A modern UN is built on data, digital, innovation, foresight and behavioural science, the Quintet of Change." },
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
    "About 130 Resident Coordinators lead UN country teams across 162 countries and territories.",
    "The IPC five-phase scale is the authority that turns hunger into a number the world cannot ignore.",
    "Women and children are consistently the majority of the forcibly displaced.",
    "A reminder at the right moment, in the right voice, can outperform a brand-new clinic.",
    "Faith leaders can carry a public-health message further than any ministry.",
    // displacement
    "More than 122 million people are forcibly displaced worldwide, nearly double the figure of a decade ago.",
    "Most displaced people never cross a border. The internally displaced far outnumber refugees.",
    "Children are under a third of the world's people but about forty percent of the forcibly displaced.",
    "Most refugees do not live in camps. The majority live in towns, cities and host communities.",
    "Resettlement reaches under one percent of refugees in a typical year. Solutions are not the same as escape.",
    "The average protracted displacement now lasts close to two decades, not a season.",
    "Refugee responses run under UNHCR's coordination model, alongside the clusters, not inside them.",
    "A camp is a symptom. Return, integration and resettlement are political, and they are the goal.",
    // food security and climate
    "Famine is IPC Phase 5, the top of a five-step scale, and it is declared late, after the dying has begun.",
    "Famine needs all three at once: a fifth of households starving, a third of children wasted, two deaths per ten thousand a day.",
    "In one famine, about half of those who died had died before it was ever declared.",
    "A square kilometre of locust swarm holds some forty million insects and eats what thirty-five thousand people would in a day.",
    "A locust swarm can travel a hundred and fifty kilometres in a single day. You fight it from the air.",
    "Drought is slow and undramatic, so it loses the funding race to disasters that arrive all at once.",
    "Heat is the silent killer. Its deaths are inferred from the excess, rarely written on a certificate.",
    "Between 1970 and 2021, weather, climate and water hazards drove nearly twelve thousand recorded disasters.",
    "Over ninety percent of disaster deaths fall in developing countries, with the smallest share of the emissions.",
    "Earthquake survival is mostly decided in the first seventy-two hours, by neighbours, not by foreign teams.",
    "One forty-tonne truck carries nearly seven times what a cargo plane can. Lose the road and the bill explodes.",
    "The cheapest way to be fast is to move the stock before the season, not after the road is gone.",
    // financing
    "CERF can release life-saving funds within seventy-two hours of an agreed request, before any pledge arrives.",
    "CERF's annual target is a billion dollars, and most years it raises well under half of it.",
    "Country-based pooled funds send close to half their money straight to local and national responders.",
    "The Grand Bargain promised a quarter of aid to local actors. Direct funding is still climbing from far below.",
    "A flash appeal sets the strategy for the early months of a sudden-onset crisis.",
    "The funding agencies value most is flexible, multi-year and unearmarked. Most funding is none of those.",
    "Cash and voucher assistance is now roughly a fifth of all international humanitarian aid.",
    "Every dollar invested in anticipatory action can return up to seven in losses avoided.",
    "Less than one percent of humanitarian funding is spent before the shock, on acting early.",
    "A recent year saw the largest fall in humanitarian funding ever recorded, measured in billions.",
    // health
    "Cholera is a water disease as much as a health one. Fix the tap and you fix the outbreak.",
    "Untreated cholera can kill half of severe cases. Treated promptly, it kills fewer than one in a hundred.",
    "Measles is among the most contagious diseases there is, with one case able to infect a dozen unprotected people.",
    "It takes about ninety-five percent immunity, across two doses, to stop measles in its tracks.",
    "In a malnourished, crowded population, measles can kill up to one in three it infects.",
    "Vaccines must stay between two and eight degrees the whole way. One unseen break can void a whole batch.",
    "Up to half of vaccines are wasted worldwide, much of it to cold-chain failures.",
    "An emergency death rate is one per ten thousand people per day. Hold the line below it.",
    "A child's upper arm tells the story: under one hundred and fifteen millimetres signals severe wasting.",
    "Community trust is the real cold chain. A rumour can empty a fully stocked campaign.",
    "Fighting an outbreak means fighting the rumours that drive attacks on the very people treating it.",
    "Safe and dignified burials, designed with the community, stopped more Ebola than any single drug.",
    // coordination architecture
    "About 130 Resident Coordinators lead UN country teams across 162 countries and territories.",
    "Since the 2019 reform, the Resident Coordinator answers to the Secretary-General, not to any one agency.",
    "There are eleven global clusters, each with a lead agency accountable for the whole sector.",
    "Clusters are activated to clarify, and meant to be handed back as national capacity recovers.",
    "The Cooperation Framework is the anchor document. Agency country programmes now flow from it.",
    "The Common Country Analysis is the shared read of reality beneath everything the UN plans.",
    "Humanity, neutrality, impartiality, independence. The four principles, in that order.",
    "Impartiality means aid by need alone, with no test of side, faith or politics.",
    "PSEA runs on zero tolerance: for abuse, for inaction, and for retaliation against those who report.",
    "The Core Humanitarian Standard is nine commitments aid organisations make to people in crisis.",
    "The humanitarian-development-peace nexus exists so the three stop working in silos.",
    "A modern UN carries five capabilities: data, innovation, digital, foresight and behavioural science.",
    // security and people
    "The deadliest years on record for aid workers are the recent ones, and most of the dead are national staff.",
    "States, not only armed groups, are now among the fastest-growing threats to aid workers.",
    "National staff are first in and last out, and they carry the heaviest risk of all.",
    "Protect field time fiercely. The people you serve are not in the inbox.",
    "Coordination is only as resilient as the exhausted people still running its meetings.",
    // wisdom
    "Under-promise and over-deliver. It is the rarest and most trusted habit in the field.",
    "The map is never the territory. Local knowledge is not optional.",
    "Reach people where they already listen, in the language they think in.",
    "Networks are the quiet infrastructure of getting anything done.",
    "Credibility compounds. The quiet work you did last year pays out today.",
    "The best legacy carries no single logo, only a result that everyone helped build.",
    "You operate by consent, so almost everything important is negotiated, not ordered.",
    "Do no harm first. Our presence is never neutral to the people we serve.",
    "Reaching the furthest behind first is not charity. It is the whole point of the 2030 Agenda.",
    "Pre-positioning is unglamorous, and it is the single cheapest way to be fast.",
    "A standby roster puts the specialist you are missing on the ground in days, not months.",
    "The richest legacy completes the mandate, not the fastest finish.",
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
    { icon: "🏵️", title: "A Nansen Refugee Award", why: "Your work as {role} for displaced people in {theatre} earns the field's highest humanitarian honour.", fact: "The honour belongs to the front line who carried the risk, most of them national staff." },
    { icon: "🎗️", title: "A World Humanitarian Day Tribute", why: "On the day the world remembers aid workers, the team in {theatre} is named for its courage.", fact: "The deadliest years on record are the recent ones, and most of the dead are national staff." },
    { icon: "🏆", title: "A UN 2.0 Innovation Prize", why: "A bold idea you tested as {role} in {theatre} is recognised across the system and asked to scale.", fact: "Innovation that scales beats innovation that only dazzles." },
    { icon: "📜", title: "A Cooperation Framework Milestone", why: "The plan you steered through in {theatre} is cited as how government and the UN should align.", fact: "The Cooperation Framework is the anchor document, and aligning behind it is half the victory." },
    { icon: "🤝", title: "A Localization Champion Award", why: "Your push as {role} to fund local responders directly in {theatre} is held up as the standard.", fact: "Localization shares power, not just risk, and the capacity it builds is the kind that stays." },
    { icon: "🛡️", title: "An Anticipatory Action Honour", why: "The early-warning system you built in {theatre} releases help before the shock, and the sector takes note.", fact: "Every dollar of early action can return up to seven in losses avoided." },
    { icon: "👂", title: "An Accountability Commendation", why: "The feedback loop your team closed in {theatre} is named a model of listening to affected people.", fact: "Accountability is closing the loop, not just logging the complaint." },
    { icon: "🌍", title: "A South-South Cooperation Award", why: "A solution born in {theatre} is adopted by a neighbouring country that skips a year of mistakes.", fact: "Peer learning between countries beats importing a distant template every time." },
    { icon: "💧", title: "A WASH Excellence Citation", why: "Your work as {role} kept the water clean and the cholera curve flat in {theatre}.", fact: "Cholera is solved at the tap. Holding the water line saves more lives than any single drug." },
    { icon: "🧒", title: "A Child Protection Honour", why: "The safe spaces and family tracing you ran in {theatre} are recognised across the response.", fact: "A school day and a safe space are also protection: structured, watched-over, and whole." },
    { icon: "📊", title: "A Data for Good Award", why: "The shared dashboard your team built for {theatre} ends the arguments and earns wide praise.", fact: "Shared data turns fights about facts into decisions about action." },
    { icon: "🕊️", title: "A Durable Solutions Recognition", why: "Your work as {role} helped end displacement in {theatre}, not merely manage it.", fact: "A camp is a symptom. The honour is in working yourself out of a job." },
    { icon: "🙌", title: "A Community Heroes Citation", why: "Volunteers and local leaders in {theatre} are honoured, and your team made sure they got the credit.", fact: "The first responders are always local. Pass the recognition down, not up." },
    { icon: "🎓", title: "An Education in Emergencies Award", why: "The temporary classrooms you kept open in {theatre} are praised for protecting a generation's learning.", fact: "Education in emergencies is protection. A lost school year is hard to win back." },
    { icon: "🩺", title: "A Public Health Commendation", why: "The outbreak your team caught early in {theatre} never became the catastrophe it could have been.", fact: "Early warning turns weeks of blindness into days of action." },
    { icon: "📣", title: "A Risk Communication Honour", why: "The trusted messaging you led in {theatre} beat the rumours and brought people back to the clinic.", fact: "Community trust is the real cold chain." },
    { icon: "🌱", title: "A Resilience Building Award", why: "The systems you strengthened in {theatre} took the next shock standing, and the world noticed.", fact: "Resilience is built in the calm, not declared in the crisis." },
    { icon: "⭐", title: "A Team of the Year Citation", why: "The whole country team in {theatre} is recognised, and you make sure every name is read out.", fact: "Recognition is fuel. Shared credit is what makes a team want to do it all again." },
    { icon: "🏅", title: "A Lifetime of Service Medal", why: "A career of postings, ending as {role} in {theatre}, is honoured for steadiness under fire.", fact: "Institutional memory is a resource. Hold on to the people who carry it." },
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
    { icon: "💎", title: "A CERF Allocation Lands", why: "An emergency allocation clears before any donor pledge, and the life-saving work starts at once.", fact: "CERF can release funds within seventy-two hours of an agreed request." },
    { icon: "💎", title: "A Pooled Fund Reserve Opens", why: "The country-based pooled fund frees flexible cash, and you aim it straight at the worst gap.", fact: "Pooled funds are unearmarked and decided closest to the need." },
    { icon: "💎", title: "A Multi-Year Grant Confirmed", why: "A donor commits for several years at once, and your partners can finally plan past the quarter.", fact: "Multi-year, flexible funding is the modality partners value most." },
    { icon: "💎", title: "A Diaspora Fund Arrives", why: "Communities abroad pool remittances and route them to exactly the families who need them.", fact: "Diaspora giving is fast, trusted, and almost always first on the scene." },
    { icon: "💎", title: "A Pro Bono Surge", why: "A private partner lends specialist staff and tools for free, just when you could not afford them.", fact: "Resourcefulness is a coordination superpower. Use what is already there." },
    { icon: "💎", title: "A Cold-Chain Donation", why: "A batch of solar fridges turns up and rescues a vaccination campaign that was about to spoil.", fact: "Up to half of vaccines are wasted worldwide, much of it to cold-chain failures." },
    { icon: "💎", title: "Fuel Reserves Located", why: "A forgotten fuel cache keeps the generators, pumps and cold chain running through the blockade.", fact: "Fuel is the hidden input under water, health and every kilometre driven." },
    { icon: "💎", title: "A Connectivity Gift", why: "A telecoms partner lights up a tower, and an invisible district appears on the map overnight.", fact: "Without connectivity, every other digital plan is a drawing on a wall." },
    { icon: "💎", title: "A Data-Sharing Breakthrough", why: "A reluctant ministry releases its population figures, and everyone finally plans from the same numbers.", fact: "Common operational datasets are the quiet foundation under every map." },
    { icon: "💎", title: "An Unsolicited Resettlement Offer", why: "A third country opens extra places for the most vulnerable, with no strings attached.", fact: "Resettlement reaches under one percent of refugees, so every place opened is precious." },
    { icon: "💎", title: "A Local Hero Steps Up", why: "A community leader mobilises hundreds of volunteers overnight, and the distribution flies.", fact: "The people closest to a problem usually hold the cheapest solution." },
    { icon: "💎", title: "A Forecast Window Confirmed", why: "The model fires a clean early warning, and pre-arranged finance releases before the flood.", fact: "Acting before a disaster costs a fraction of cleaning up after one." },
    { icon: "💎", title: "A Returning Veteran", why: "A seasoned colleague rotates back in, and a stalled file moves in a single afternoon.", fact: "Institutional memory is a resource. The people who carry it are worth keeping." },
    { icon: "💎", title: "A Bridging Loan from a Foundation", why: "A foundation fronts the cash while the official funding clears, so nothing stops.", fact: "Speed of money is often the difference between early action and a funeral." },
    { icon: "💎", title: "A Shared Warehouse Opens", why: "Agencies agree to pool storage, and suddenly there is room and reach for everyone's stock.", fact: "Common logistics services exist because no one agency can do it alone." },
    { icon: "💎", title: "An Open-Source Tool Saves the Week", why: "A free mapping tool does what a costly contract could not, and targeting sharpens at once.", fact: "Innovation that scales beats innovation that only dazzles." },
    { icon: "💎", title: "A Government Co-Funds the Plan", why: "National authorities put their own budget behind the response, and the whole effort steadies.", fact: "Primary responsibility rests with national authorities. Their buy-in is worth more than any grant." },
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
    { icon: "📞", title: "An Old Number Still Works", why: "A contact from a past posting answers on the first ring and opens a door you thought was shut.", fact: "Trust moves at the speed of relationships, not reports.", effect: "advance" },
    { icon: "🚦", title: "A Green Light from the Capital", why: "An approval everyone expected to take weeks comes through in a morning.", fact: "A quiet champion in the right office is worth more than any memo.", effect: "bonus" },
    { icon: "🧭", title: "A Better Route Found", why: "A local driver knows a track the maps forgot, and the convoy arrives a day early.", fact: "Local knowledge is not optional. The map is never the territory.", effect: "advance" },
    { icon: "📨", title: "A Donor Visit Lands Well", why: "A field trip goes perfectly, and a hesitant donor leaves ready to fund.", fact: "Seeing the work in person moves money that a hundred reports could not.", effect: "bonus" },
    { icon: "🛑", title: "A Checkpoint Closes Early", why: "A barrier shuts for the day just as your convoy arrives, and the delivery slips to tomorrow.", fact: "Access is negotiated every day, with everyone, forever.", effect: "skip" },
    { icon: "🌧️", title: "An Unforecast Downpour", why: "Rain no model predicted turns the access road to soup, and the day is lost.", fact: "Plan for the cascade. The secondary hazard often does the real damage.", effect: "skip" },
    { icon: "📋", title: "An Audit Drops In", why: "An unannounced audit pulls your best staff into a back room for two days.", fact: "Clean books are slow to keep and fast to save you. Welcome the auditor.", effect: "skip" },
    { icon: "🤒", title: "A Bout of Field Fever", why: "Half the team goes down with a stomach bug from the same bad water, and tempo stalls.", fact: "Look after your team, or you will have no team to look after anyone.", effect: "skip" },
    { icon: "🛰️", title: "Fresh Imagery Arrives", why: "A new satellite pass reveals exactly where the worst damage is, and you redirect at once.", fact: "Imagery shows where the road ends and the need begins.", effect: "bonus" },
    { icon: "🧰", title: "A Spare Part Turns Up", why: "The one component that grounded the water pump is found in a back-room shelf.", fact: "Knowing what you already have is half the battle.", effect: "advance" },
    { icon: "📻", title: "A Local Station Adopts the Message", why: "A popular radio host repeats your guidance for free, and uptake jumps across the district.", fact: "Reach people where they already listen, in the language they think in.", effect: "advance" },
    { icon: "🧑‍🤝‍🧑", title: "A Rival Agency Offers a Lift", why: "A neighbouring team has spare cargo space and shares it, no questions asked.", fact: "Mandates divide us. The people we serve do not see the lines.", effect: "bonus" },
    { icon: "💡", title: "A Field Idea Scales", why: "A small fix a national colleague invented turns out to work everywhere, and saves a week.", fact: "The people closest to a problem usually hold the cheapest solution.", effect: "gem" },
    { icon: "🪪", title: "Visas Clear Unexpectedly", why: "A stuck batch of permits is approved overnight, and the surge team can finally fly in.", fact: "The right people in the room beat the right people on the roster.", effect: "advance" },
    { icon: "🧥", title: "Winter Kit Arrives Early", why: "Cold-weather supplies land ahead of the freeze for once, instead of a month after it.", fact: "The most expensive aid is the aid that arrives too late.", effect: "bonus" },
    { icon: "🔋", title: "Solar Power Comes Online", why: "A new solar array frees the clinic from the failing grid, and the cold chain steadies.", fact: "Resilience is boring until the day it is everything.", effect: "advance" },
    { icon: "📦", title: "A Customs Officer Waves It Through", why: "A sympathetic official clears the blocked relief items in an afternoon.", fact: "Duty exemptions live in the country agreement. A good relationship makes them real.", effect: "bonus" },
    { icon: "🗣️", title: "A Misunderstanding Clears Up", why: "A tense rumour about your team turns out to be nothing, and trust returns by evening.", fact: "Get ahead of the rumour, or it gets ahead of you.", effect: "advance" },
    { icon: "🐫", title: "The Last Mile Goes by Camel", why: "When the trucks cannot pass, the community moves the load the old way, and it arrives.", fact: "The last kilometre is where coordination meets the real world.", effect: "advance" },
    { icon: "⌛", title: "A Deadline Slips Quietly", why: "A donor extends a reporting deadline, and the pressure eases just enough to breathe.", fact: "Protect field time. A little slack is what keeps people in the job.", effect: "bonus" },
    { icon: "🧊", title: "A Fridge Fails Overnight", why: "A cold-chain break is caught at dawn, but a morning is lost replacing the spoiled stock.", fact: "A single failed fridge can void a whole campaign. Monitor it like a patient.", effect: "skip" },
    { icon: "📑", title: "A Form Was Filed Wrong", why: "A paperwork error sends a shipment back to the start of the queue.", fact: "Bureaucracy is an access constraint too. Read the rules before they read you.", effect: "skip" },
    { icon: "🤝", title: "A Handshake Reopens a Door", why: "A patient conversation with a sceptical official restores access that was quietly lost.", fact: "You coordinate by influence, not authority. Relationships are the infrastructure.", effect: "advance" },
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

  /* =======================================================================
   * THE MANDATE,  a second game on the same platform.
   * A journey along a winding road, in the spirit of the Game of Life. You do
   * not just race: you make choices and build a legacy. Three resources travel
   * with each player, Funding, Trust and Local Capacity, and the shared UN 2.0
   * Quintet of Change tallies for the whole table, exactly as in The Long Road.
   * The richest legacy completes the mandate, so the fastest finish is not
   * always the winning one. Same content rules: English only, no em or en
   * dashes, fictional theatres, real coordination wisdom.
   * ===================================================================== */

  // The three resources you accumulate. Legacy score is built from these plus
  // milestones and a finishing bonus. Icons reused across cards and standings.
  CG.MANDATE_RESOURCES = [
    { key: "funding",  icon: "💰", name: "Funding",   blurb: "Money in the account, not the pledge on the podium." },
    { key: "trust",    icon: "🤝", name: "Trust",     blurb: "The relationships that move faster than any memo." },
    { key: "capacity", icon: "👥", name: "Capacity",  blurb: "Local capability that stays after the mission leaves." },
  ];

  // CROSSROADS,  the heart of the game. Land on a decision square and choose.
  // Each option carries a real trade-off. eff keys: funding / trust / capacity
  // (resource deltas), move (squares forward or back), quintet + quintetDir
  // (nudge a shared capability), bonus (spin again), skip (lose next turn).
  CG.MANDATE_DECISIONS = [
    { icon: "🪙", title: "Fast Money, or Flexible Money?", tag: "funding",
      prompt: "A donor will wire a large cheque tomorrow, but locked to one visible activity.",
      a: { label: "Take the earmarked cash", detail: "Money now, but your hands are tied and partners grumble.", eff: { funding: 3, trust: -1 } },
      b: { label: "Hold out for flexible funds", detail: "Less today, but you can send it where it saves the most lives.", eff: { funding: 1, trust: 2, quintet: "foresight", quintetDir: 1 } } },
    { icon: "📣", title: "Speak Out, or Stay at the Table?", tag: "governance",
      prompt: "A rights violation is unfolding. Going public could cost you access tomorrow.",
      a: { label: "Go public", detail: "The community trusts you more; the authorities, a good deal less.", eff: { trust: 3, funding: -1 } },
      b: { label: "Quiet diplomacy", detail: "You keep the door open and push hard behind it.", eff: { trust: 1, funding: 1, capacity: 1 } } },
    { icon: "🛬", title: "Fly in Experts, or Back the Locals?", tag: "community",
      prompt: "A gap opens. Surge international experts, or fund the national NGO already there.",
      a: { label: "Surge the internationals", detail: "Fast and polished, and gone again in three months.", eff: { capacity: 3, move: 1, trust: -1 } },
      b: { label: "Fund the local team", detail: "Slower to start, but they stay long after you leave.", eff: { capacity: 1, trust: 2, quintet: "behaviour", quintetDir: 1 } } },
    { icon: "💳", title: "Cash, or In-Kind?", tag: "funding",
      prompt: "Markets are working. Donors would rather see branded sacks of grain.",
      a: { label: "Give cash", detail: "Dignity and choice for families; less visibility for donors.", eff: { trust: 2, funding: -1, quintet: "innovation", quintetDir: 1 } },
      b: { label: "Distribute in-kind", detail: "Photogenic and safe, but slower and costlier.", eff: { funding: 1, capacity: 1, trust: -1 } } },
    { icon: "🪑", title: "Another Coordination Meeting?", tag: "governance",
      prompt: "Partners want a new working group. Your field staff want to be in the field.",
      a: { label: "Call the meeting", detail: "Alignment improves; a day of delivery is lost.", eff: { trust: 1, move: -1 } },
      b: { label: "Protect field time", detail: "Delivery continues; some partners feel out of the loop.", eff: { capacity: 2, trust: -1 } } },
    { icon: "🗃️", title: "Share the Sensitive Data?", tag: "data",
      prompt: "A shared dataset would sharpen everyone's targeting, but it names vulnerable people.",
      a: { label: "Share it openly", detail: "Better targeting now; a real protection risk later.", eff: { capacity: 2, trust: -2 } },
      b: { label: "Minimise and protect", detail: "Share only what is safe; some precision is lost.", eff: { trust: 2, quintet: "data", quintetDir: 1 } } },
    { icon: "🛡️", title: "Act on the Forecast?", tag: "climate",
      prompt: "A model says a flood is likely. Acting now spends money on a disaster that might not come.",
      a: { label: "Release funds early", detail: "If it floods, you are a hero; if not, you spent for nothing.", eff: { funding: -1, trust: 2, move: 1, quintet: "foresight", quintetDir: 1 } },
      b: { label: "Wait for certainty", detail: "You save the budget, but you lose the head start.", eff: { funding: 1, move: -1 } } },
    { icon: "🎖️", title: "Whose Logo on the Win?", tag: "any",
      prompt: "A breakthrough is yours to announce. The government wants to own it.",
      a: { label: "Let them take the credit", detail: "Your visibility dips; your influence climbs.", eff: { trust: 3, funding: -1 } },
      b: { label: "Claim it for the UN", detail: "A donor headline today; a colder room tomorrow.", eff: { funding: 2, trust: -2 } } },
    { icon: "😮‍💨", title: "The Team Is Exhausted", tag: "any",
      prompt: "Your best people are running on empty at the very peak of the crisis.",
      a: { label: "Force a rotation", detail: "Lose tempo now to keep the team for the long haul.", eff: { capacity: 2, move: -1 } },
      b: { label: "Push through", detail: "Gain ground, and risk losing your most experienced staff.", eff: { move: 1, capacity: -2 } } },
    { icon: "🌱", title: "Fund the Untested Local Partner?", tag: "community",
      prompt: "A small local organisation is closest to the need, but has never managed a grant this size.",
      a: { label: "Take the risk", detail: "Real localization, with real fiduciary risk.", eff: { trust: 2, capacity: 1, funding: -1 } },
      b: { label: "Use the safe intermediary", detail: "Lower risk, but the money loses a slice at every layer.", eff: { funding: 1, capacity: 1, trust: -1 } } },
    { icon: "🛂", title: "Surge Visas, or Train Nationals?", tag: "community",
      prompt: "A skills gap is hurting the response. You can chase entry permits for experts, or invest in the staff already here.",
      a: { label: "Chase the visas", detail: "Faster expertise, if the permits even come through.", eff: { capacity: 1, move: 1, trust: -1 } },
      b: { label: "Train the nationals", detail: "Slower, but the skills stay when the mission goes.", eff: { capacity: 2, trust: 1, move: -1 } } },
    { icon: "📊", title: "Invest in the Dashboard?", tag: "digital",
      prompt: "Partners are arguing from five different sets of numbers. A shared data system would help, but costs weeks to build.",
      a: { label: "Build the shared system", detail: "Pay now in time, save later in fewer fights.", eff: { capacity: 1, move: -1, quintet: "digital", quintetDir: 1 } },
      b: { label: "Keep muddling through", detail: "Move faster this week, argue about facts the next.", eff: { move: 1, trust: -1 } } },
    { icon: "🤲", title: "Front the Risk for a Partner?", tag: "governance",
      prompt: "A frontline partner is days from running dry while their grant clears. You could bridge them from reserves.",
      a: { label: "Bridge them now", detail: "Keep the front line open, and carry the exposure yourself.", eff: { trust: 2, funding: -1, capacity: 1 } },
      b: { label: "Make them wait", detail: "Protect the books, and risk a gap on the ground.", eff: { funding: 1, trust: -2 } } },
    { icon: "🕊️", title: "Camp Services, or Durable Solutions?", tag: "displacement",
      prompt: "You can pour this year's budget into running the camp well, or into helping people leave it for good.",
      a: { label: "Run the camp well", detail: "Visible comfort now, but the encampment hardens.", eff: { capacity: 2, trust: 1, move: 1 } },
      b: { label: "Invest in solutions", detail: "Slower and political, but it is the way out.", eff: { trust: 2, capacity: 1, quintet: "foresight", quintetDir: 1 } } },
    { icon: "🩺", title: "Vaccinate Now, or Fix the Water?", tag: "health",
      prompt: "Cholera is rising in the site. You can run a vaccine campaign fast, or rebuild the water system properly.",
      a: { label: "Run the campaign", detail: "Buys time fast, but the source is still dirty.", eff: { move: 1, capacity: 1, trust: 1 } },
      b: { label: "Fix the water", detail: "The durable cure, if the curve does not outrun you.", eff: { capacity: 2, trust: 1, move: -1 } } },
    { icon: "🛡️", title: "Build the Early-Warning System?", tag: "climate",
      prompt: "A forecast-based plan could release funds before the next flood, but it takes scarce staff to set up.",
      a: { label: "Build it now", detail: "Be ready before the shock, at a cost in tempo today.", eff: { capacity: 1, move: -1, quintet: "foresight", quintetDir: 1 } },
      b: { label: "Respond as usual", detail: "Keep delivering now, and pay full price when it floods.", eff: { move: 1, funding: -1 } } },
    { icon: "🚪", title: "Cross the Line, or Wait for Clearance?", tag: "access",
      prompt: "People across the front line are cut off. You can push a risky cross-line convoy, or wait for formal approval.",
      a: { label: "Push the convoy", detail: "Reach the unreachable, and accept the danger.", eff: { trust: 2, move: 1, capacity: -1 } },
      b: { label: "Wait for clearance", detail: "Safer, but every day costs lives on the far side.", eff: { capacity: 1, trust: -1 } } },
    { icon: "📣", title: "Counter the Rumour, or Stay Quiet?", tag: "info",
      prompt: "A false story is emptying your clinics. Engaging it risks amplifying it; ignoring it lets it spread.",
      a: { label: "Engage and correct", detail: "Meet it head on with trusted voices.", eff: { trust: 2, move: -1, quintet: "behaviour", quintetDir: 1 } },
      b: { label: "Let it burn out", detail: "Save the effort, and gamble that it fades.", eff: { move: 1, trust: -2 } } },
    { icon: "🧒", title: "Schools, or Supplies?", tag: "youth",
      prompt: "Limited funds: reopen temporary classrooms, or top up the food and shelter pipeline.",
      a: { label: "Reopen the schools", detail: "Protect a generation's learning and routine.", eff: { trust: 2, capacity: 1, move: -1 } },
      b: { label: "Top up supplies", detail: "Meet the loudest need now, defer the quiet one.", eff: { capacity: 1, move: 1, trust: -1 } } },
    { icon: "🏛️", title: "Lead It Yourself, or Hand It to Government?", tag: "governance",
      prompt: "The national authority wants to chair the response. They are willing, but not yet ready.",
      a: { label: "Hand them the chair", detail: "Build ownership, and coach from the second seat.", eff: { trust: 2, capacity: 1, move: -1 } },
      b: { label: "Keep the lead for now", detail: "Faster and cleaner today, dependency tomorrow.", eff: { move: 1, capacity: -1 } } },
    { icon: "🔒", title: "Accept the Strings, or Walk Away?", tag: "funding",
      prompt: "A large grant comes with conditions that would skew your priorities toward the donor's favourite district.",
      a: { label: "Take it, adjust the plan", detail: "Money in hand, at the cost of going where it is needed most.", eff: { funding: 3, trust: -2 } },
      b: { label: "Decline on principle", detail: "Keep your impartiality, and the gap stays open.", eff: { trust: 2, funding: -1, quintet: "data", quintetDir: 1 } } },
    { icon: "🧾", title: "Chase the Pledge, or the Payment?", tag: "funding",
      prompt: "A donor announced a big pledge months ago that never arrived. Chasing it pulls staff off delivery.",
      a: { label: "Chase the cash", detail: "Free up the money you were promised, if you can.", eff: { funding: 2, move: -1 } },
      b: { label: "Stay on delivery", detail: "Keep the work moving, and let the pledge sit.", eff: { capacity: 1, move: 1, funding: -1 } } },
    { icon: "👥", title: "Merge the Duplicated Programmes?", tag: "governance",
      prompt: "Two agencies are running near-identical projects in the same district. Merging them means a turf fight.",
      a: { label: "Force the merger", detail: "End the waste, and bruise some egos doing it.", eff: { capacity: 2, trust: -1, move: 1 } },
      b: { label: "Leave them be", detail: "Keep the peace, and keep the duplication.", eff: { trust: 1, capacity: -1 } } },
    { icon: "♿", title: "Universal Design, or Faster Rollout?", tag: "community",
      prompt: "Making the distribution fully accessible to people with disabilities will slow the rollout.",
      a: { label: "Design for everyone", detail: "Slower start, but no one is left at the edge of the queue.", eff: { trust: 2, capacity: 1, move: -1 } },
      b: { label: "Roll out fast", detail: "Reach the many now, retrofit access later.", eff: { move: 1, trust: -1 } } },
    { icon: "🔌", title: "Cash by Phone, or by Hand?", tag: "digital",
      prompt: "Mobile money is faster and cheaper, but the poorest families have no phones or accounts.",
      a: { label: "Go digital", detail: "Fast and traceable, if no one is excluded by it.", eff: { funding: 1, move: 1, quintet: "digital", quintetDir: 1 } },
      b: { label: "Pay in person", detail: "Slower and costlier, but it reaches the last family.", eff: { trust: 2, capacity: 1, move: -1 } } },
    { icon: "🧰", title: "Spend the Reserve, or Hold It?", tag: "funding",
      prompt: "You have a small contingency reserve. The need is real now, but a worse shock may be coming.",
      a: { label: "Spend it now", detail: "Meet today's need, and bet that the storm holds off.", eff: { capacity: 2, move: 1, funding: -1 } },
      b: { label: "Hold the line", detail: "Keep your powder dry for the shock you can feel coming.", eff: { funding: 1, quintet: "foresight", quintetDir: 1 } } },
    { icon: "🛻", title: "Common Logistics, or Go Your Own Way?", tag: "supply",
      prompt: "A shared logistics service would cut everyone's costs, but you would give up control of your own pipeline.",
      a: { label: "Join the common service", detail: "Cheaper for all, at the price of some autonomy.", eff: { capacity: 2, trust: 1, move: -1 } },
      b: { label: "Run your own", detail: "Full control, full cost, and a crowded road.", eff: { move: 1, funding: -1 } } },
    { icon: "🚨", title: "An Allegation Surfaces", tag: "governance",
      prompt: "A PSEA complaint comes in against a partner. Acting fast is right but will slow and strain the whole operation.",
      a: { label: "Act immediately, survivor first", detail: "Do the right thing, and absorb the disruption.", eff: { trust: 3, move: -1, capacity: -1 } },
      b: { label: "Quietly review later", detail: "Keep tempo now, and gamble with everyone's standing.", eff: { move: 1, trust: -3 } } },
    { icon: "🌍", title: "Import the Template, or Ask the Neighbour?", tag: "any",
      prompt: "A headquarters template is ready to deploy. A neighbouring country solved this last year their own way.",
      a: { label: "Call the neighbour", detail: "Borrow a proven local fix, and skip a year of mistakes.", eff: { capacity: 1, trust: 1, quintet: "innovation", quintetDir: 1 } },
      b: { label: "Use the template", detail: "Fast and familiar, if it fits the ground at all.", eff: { move: 1, capacity: -1 } } },
    { icon: "🧠", title: "Test the Nudge, or Scale the Plan?", tag: "any",
      prompt: "A small behavioural tweak might lift uptake, but proving it means a pilot before you commit.",
      a: { label: "Run the pilot", detail: "Test before you scale, and learn what really works.", eff: { capacity: 1, move: -1, quintet: "behaviour", quintetDir: 1 } },
      b: { label: "Scale the standard plan", detail: "Move now on what you already know.", eff: { move: 1 } } },
    { icon: "📰", title: "Take the Spotlight, or Share It?", tag: "any",
      prompt: "A journalist wants to profile your leadership. The story could feature you, or the local team who did the work.",
      a: { label: "Point to the local team", detail: "Your visibility dips; their standing soars.", eff: { trust: 3, capacity: 1 } },
      b: { label: "Take the profile", detail: "A personal headline today, a colder team tomorrow.", eff: { funding: 1, trust: -2 } } },
    { icon: "⛽", title: "Ration the Fuel, or Run Full Tilt?", tag: "supply",
      prompt: "A blockade has cut fuel. You can run everything now and risk a hard stop, or ration to last the month.",
      a: { label: "Ration carefully", detail: "Less today, but the clinics and pumps survive.", eff: { capacity: 2, move: -1 } },
      b: { label: "Run full tilt", detail: "Maximum reach now, and a cliff edge if it does not lift.", eff: { move: 1, capacity: -2 } } },
    { icon: "🤝", title: "Sign the Joint Programme?", tag: "governance",
      prompt: "Several agencies could pool budgets into one programme. It means real impact, and surrendering some control.",
      a: { label: "Pool the mandates", detail: "Trade a little autonomy for a great deal of impact.", eff: { capacity: 2, trust: 1, move: -1 } },
      b: { label: "Stay independent", detail: "Keep your own lane, and your own ceiling.", eff: { move: 1, trust: -1 } } },
  ];

  // EVENTS,  good and bad turns of fortune drawn on an event square. The engine
  // reads kind to colour the card up or down. eff applies as for decisions.
  CG.MANDATE_EVENTS = [
    { icon: "⚡", title: "CERF Comes Through", kind: "good", tag: "funding", why: "Rapid-response funds land within days of an agreed request.", fact: "The Emergency Relief Coordinator can release CERF funds within 72 hours.", eff: { funding: 2 } },
    { icon: "🤝", title: "A Government Champion", kind: "good", tag: "governance", why: "A well-placed official clears three stuck approvals in an afternoon.", fact: "Trust, once earned, moves faster than any memo ever could.", eff: { trust: 2 } },
    { icon: "🎓", title: "A Mentored Team Stands Alone", kind: "good", tag: "community", why: "A national team you trained now runs the response itself.", fact: "Local capacity is the only kind that stays after the mission leaves.", eff: { capacity: 2 } },
    { icon: "📊", title: "One Dashboard, One Truth", kind: "good", tag: "digital", why: "Everyone finally plans from the same live numbers.", fact: "Shared data turns arguments about facts into decisions about action.", eff: { capacity: 1, quintet: "digital", quintetDir: 1 } },
    { icon: "📹", title: "A Youth Campaign Goes Viral", kind: "good", tag: "youth", why: "A video by young people does what a press release never could.", fact: "Young people are a present stakeholder, with reach agencies lack.", eff: { trust: 2, quintet: "behaviour", quintetDir: 1 } },
    { icon: "💵", title: "The Flash Appeal Is Funded", kind: "good", tag: "funding", why: "The appeal hits a hundred percent and the plan finally has money behind it.", fact: "A flash appeal sets the strategy for the first months of a crisis.", eff: { funding: 2, move: 1 } },
    { icon: "📉", title: "The Appeal Stalls at 40 Percent", kind: "bad", tag: "funding", why: "Chronic underfunding forces brutal cuts across whole sectors.", fact: "Underfunding means reaching millions fewer people than planned.", eff: { funding: -2 } },
    { icon: "📱", title: "Rumours Outrun the Response", kind: "bad", tag: "info", why: "False information empties the clinics faster than you can fill them.", fact: "Risk communication teams treat rumour-tracking as surveillance.", eff: { trust: -2 } },
    { icon: "🛂", title: "Visas Denied at the Last Minute", kind: "bad", tag: "access", why: "Your surge experts simply cannot get into the country.", fact: "Visa delays are logged as deliberate access constraints now, not paperwork.", eff: { capacity: -2, move: -2 } },
    { icon: "🕳️", title: "Aid Is Diverted", kind: "bad", tag: "governance", why: "Goods siphoned off before they land dent donor confidence.", fact: "Diversion is managed through third-party monitoring. Zero diversion can mean zero access.", eff: { funding: -1, trust: -1 } },
    { icon: "😷", title: "A Lockdown Hits the Pipeline", kind: "bad", tag: "health", why: "Movement bans choke your supply chain just as needs surge.", fact: "Response measures can harm the most vulnerable as much as the disease.", eff: { capacity: -1, move: -1 } },
    { icon: "🔌", title: "The Generator Fails", kind: "bad", tag: "any", why: "The office loses power mid-crisis, and a day of work goes with it.", fact: "Resilience is boring until the day it is everything. Plan for the outage.", eff: { move: -1 } },
    // more good fortune
    { icon: "🏦", title: "A Pooled Fund Reserve Opens", kind: "good", tag: "funding", why: "The country-based pooled fund frees flexible cash for the worst gap.", fact: "Pooled funds are unearmarked and decided closest to the need.", eff: { funding: 2 } },
    { icon: "📆", title: "Multi-Year Funding Lands", kind: "good", tag: "funding", why: "A several-year commitment lets partners plan past the next quarter.", fact: "Multi-year flexible funding is the modality partners value most.", eff: { funding: 2, quintet: "foresight", quintetDir: 1 } },
    { icon: "🛡️", title: "A Forecast Trigger Fires", kind: "good", tag: "climate", why: "Pre-arranged finance releases before the flood, and families act early.", fact: "Every dollar of early action can return up to seven in losses avoided.", eff: { trust: 2, move: 1 } },
    { icon: "🚀", title: "A Standby Partner Deploys", kind: "good", tag: "any", why: "A roster surges in exactly the specialist you were missing.", fact: "Standby partnerships put surge capacity on the ground in days, not months.", eff: { capacity: 2 } },
    { icon: "🌍", title: "A South-South Exchange", kind: "good", tag: "any", why: "A neighbour who solved this last year sends over their playbook.", fact: "Peer learning beats importing a distant template every time.", eff: { trust: 1, quintet: "innovation", quintetDir: 1 } },
    { icon: "👂", title: "The Feedback Loop Closes", kind: "good", tag: "community", why: "People report a problem and actually see the response change.", fact: "Accountability is closing the loop, not just logging the complaint.", eff: { trust: 2 } },
    { icon: "🚪", title: "A Border Crossing Reopens", kind: "good", tag: "access", why: "A negotiated crossing lets convoys roll into areas cut off for months.", fact: "A single reopened crossing can reach a famine-risk region.", eff: { capacity: 1, move: 1 } },
    { icon: "💉", title: "A Vaccination Campaign Succeeds", kind: "good", tag: "health", why: "Coverage climbs past the threshold and stops an outbreak before it explodes.", fact: "It takes about ninety-five percent immunity, across two doses, to halt measles.", eff: { capacity: 1, trust: 1 } },
    { icon: "🌱", title: "A Local NGO Joins the Pooled Fund", kind: "good", tag: "community", why: "A frontline organisation is accredited to receive money directly.", fact: "Pooled funds send close to half their allocations to local actors.", eff: { capacity: 1, trust: 1 } },
    { icon: "🛰️", title: "Fresh Imagery Sharpens Targeting", kind: "good", tag: "digital", why: "A satellite pass shows where the need is greatest, and resources follow.", fact: "Imagery shows where the road ends and the need begins.", eff: { capacity: 1, quintet: "data", quintetDir: 1 } },
    { icon: "🧊", title: "The Cold Chain Holds", kind: "good", tag: "supply", why: "New fridges and monitors keep a campaign's vaccines viable to the last child.", fact: "Vaccines must stay between two and eight degrees the whole way.", eff: { capacity: 1, move: 1 } },
    { icon: "🤝", title: "Donor Confidence Returns", kind: "good", tag: "funding", why: "Clean reporting brings the hesitant donors back to the table.", fact: "Transparent reporting is one of the strongest tools for rebuilding trust.", eff: { funding: 1, trust: 1 } },
    // more setbacks
    { icon: "✂️", title: "A Global Funding Cut Lands", kind: "bad", tag: "funding", why: "A donor capital slashes its aid budget, and ration cuts cascade.", fact: "A recent year saw the largest fall in humanitarian funding ever recorded.", eff: { funding: -2, capacity: -1 } },
    { icon: "🍚", title: "Rations Are Cut in Half", kind: "bad", tag: "funding", why: "With the pipeline short, families on a full ration now get a fraction.", fact: "When the money shrinks, the ration is the first thing to fall.", eff: { funding: -1, trust: -1 } },
    { icon: "🎯", title: "A Convoy Is Attacked", kind: "bad", tag: "access", why: "An attack forces a security pause that halts assistance for everyone.", fact: "The deadliest years on record for aid workers are the recent ones.", eff: { capacity: -2, move: -3 } },
    { icon: "⛓️", title: "National Staff Are Detained", kind: "bad", tag: "governance", why: "The arbitrary arrest of local colleagues freezes the operation.", fact: "States, not only armed groups, are a fast-growing threat to aid workers.", eff: { capacity: -1, trust: -1 } },
    { icon: "🦠", title: "Cholera Breaks Out", kind: "bad", tag: "health", why: "Contaminated water in a crowded site sends cases climbing fast.", fact: "Cholera is a water disease. The vaccine only buys time while you fix the tap.", eff: { capacity: -1, move: -1 } },
    { icon: "⚓", title: "The Port Seizes Up", kind: "bad", tag: "supply", why: "Congestion at the single entry port backs up everyone's cargo at once.", fact: "Common logistics services exist because no one agency can untangle a port alone.", eff: { capacity: -1, move: -2 } },
    { icon: "🪙", title: "A Pledge Never Arrives", kind: "bad", tag: "funding", why: "A headline pledge turns out to be announced, not paid.", fact: "Count what arrives, not what is announced.", eff: { funding: -2 } },
    { icon: "🌪️", title: "A Storm Makes Landfall", kind: "bad", tag: "storm", why: "One storm flattens shelter, water and health all at once.", fact: "Anticipatory action releases money on the forecast, before the impact.", eff: { capacity: -1, move: -2 } },
    { icon: "🪧", title: "An NGO Law Bites", kind: "bad", tag: "governance", why: "A restrictive registration law can deregister your partners overnight.", fact: "The only durable insurance against a registration weapon is local capacity that stays.", eff: { capacity: -2 } },
    { icon: "📑", title: "A Counter-Terror Clause Freezes a Partner", kind: "bad", tag: "governance", why: "Strict conditions make supporting a frontline partner legally fraught.", fact: "Principled action reaches by need alone, but the paperwork grows heavier.", eff: { capacity: -1, move: -1 } },
    { icon: "🧱", title: "A Bank De-Risks You", kind: "bad", tag: "funding", why: "A nervous bank closes the account, and cash cannot reach partners.", fact: "Financial de-risking can choke a lawful operation like any checkpoint.", eff: { funding: -1, capacity: -1 } },
    { icon: "📵", title: "A Communications Blackout Falls", kind: "bad", tag: "info", why: "Authorities cut the networks, and teams lose contact with the field.", fact: "When connectivity dies, every digital plan reverts to paper and runners.", eff: { capacity: -1, move: -1 } },
  ];

  // FUNDING squares,  a small win for the wallet.
  CG.MANDATE_FUNDING = [
    { icon: "🏦", title: "A Pooled Fund Top-Up", tag: "funding", why: "A country-based pooled fund reserve gives you flexible cash to plug urgent gaps.", fact: "Pooled funds are unearmarked and decided closest to the need.", eff: { funding: 2 } },
    { icon: "📆", title: "Multi-Year Funding Secured", tag: "funding", why: "Predictable money lets your partners plan past the next quarter.", fact: "Multi-year flexible funding is the modality partners value most.", eff: { funding: 2, quintet: "foresight", quintetDir: 1 } },
    { icon: "💎", title: "An Unearmarked Reserve", tag: "funding", why: "Flexible money turns up with no strings, and you aim it at the worst gap.", fact: "Unearmarked funding buys the freedom to do the right thing.", eff: { funding: 3 } },
    { icon: "🤝", title: "Donor Confidence Returns", tag: "funding", why: "Clean reporting brings the hesitant donors back to the table.", fact: "Transparent reporting is one of the strongest tools for rebuilding trust.", eff: { funding: 1, trust: 1 } },
    { icon: "⚡", title: "A Rapid-Response Window", tag: "funding", why: "Life-saving funds land well before the donor pledges arrive.", fact: "Speed of money is often the difference between early action and a funeral.", eff: { funding: 2, move: 1 } },
    { icon: "🎯", title: "An Underfunded-Emergencies Grant", tag: "funding", why: "A neglected crisis finally draws an allocation no headline would.", fact: "CERF keeps a window for the crises the world forgot.", eff: { funding: 2 } },
    { icon: "💶", title: "A New Donor Joins", tag: "funding", why: "A government that never funded here makes a first serious pledge.", fact: "A broad donor base is how a response survives any one backer leaving.", eff: { funding: 2 } },
    { icon: "🏛️", title: "Government Co-Funds the Plan", tag: "governance", why: "National authorities put their own budget behind the response.", fact: "Their buy-in is worth more than any single grant.", eff: { funding: 2, trust: 1 } },
    { icon: "🌐", title: "Diaspora Remittances Arrive", tag: "funding", why: "Communities abroad pool money and route it to the families who need it.", fact: "Diaspora giving is fast, trusted, and almost always first on the scene.", eff: { funding: 2 } },
    { icon: "🔓", title: "Earmarks Are Loosened", tag: "funding", why: "A donor softens its conditions, and you move money where it saves the most.", fact: "Flexible funding buys the freedom to do the right thing.", eff: { funding: 2, quintet: "data", quintetDir: 1 } },
    { icon: "🧾", title: "Reporting Is Harmonised", tag: "funding", why: "Donors agree one shared format, and staff get their week back.", fact: "Duplicated paperwork is a hidden tax on delivery.", eff: { funding: 1, capacity: 1 } },
    { icon: "🪙", title: "A Pledge Is Finally Paid", tag: "funding", why: "An old promise turns into cash in the account at last.", fact: "Count what arrives, not what is announced.", eff: { funding: 2 } },
    { icon: "🏗️", title: "A Private Partner Steps In", tag: "funding", why: "A company funds a slice of the response and lends its logistics for free.", fact: "Resourcefulness is a coordination superpower.", eff: { funding: 1, capacity: 1 } },
    { icon: "📊", title: "Clean Audit, Restored Trust", tag: "funding", why: "A spotless audit reopens a donor's chequebook.", fact: "Credibility compounds. Last year's clean books pay out today.", eff: { funding: 1, trust: 1 } },
    { icon: "💵", title: "The Flash Appeal Is Funded", tag: "funding", why: "The appeal hits a hundred percent, and the plan finally has money behind it.", fact: "A flash appeal sets the strategy for the early months of a crisis.", eff: { funding: 2, move: 1 } },
  ];

  // TRUST squares,  a win for relationships and standing.
  CG.MANDATE_TRUST = [
    { icon: "👂", title: "The Feedback Loop Closes", tag: "community", why: "People report a problem and actually see the response change.", fact: "Accountability is closing the loop, not just logging the complaint.", eff: { trust: 2 } },
    { icon: "🧭", title: "The Cooperation Framework Holds", tag: "governance", why: "Government and the UN rally behind one shared multi-year plan.", fact: "The Cooperation Framework is the anchor of the UN's work in a country.", eff: { trust: 2, quintet: "data", quintetDir: 1 } },
    { icon: "🙌", title: "A Community Leads", tag: "community", why: "Affected people organise and deliver, and you have the sense to back them.", fact: "Proximity and local knowledge deliver faster and cheaper.", eff: { trust: 2 } },
    { icon: "🕊️", title: "A Durable-Solutions Pact", tag: "displacement", why: "Partners commit to ending displacement, not just managing it forever.", fact: "A camp is a symptom. Solutions are political, and they are the goal.", eff: { trust: 1, capacity: 1 } },
    { icon: "🌍", title: "A South-South Exchange", tag: "any", why: "A neighbour who solved this last year sends over their playbook.", fact: "Peer learning beats importing a distant template every time.", eff: { trust: 1, quintet: "innovation", quintetDir: 1 } },
    { icon: "📻", title: "A Radio Message Lands", tag: "info", why: "Clear guidance on local radio reaches further than a month of meetings.", fact: "Reach people where they already listen, in the language they think in.", eff: { trust: 2, quintet: "behaviour", quintetDir: 1 } },
    { icon: "🧓", title: "Elders Endorse the Work", tag: "community", why: "Trusted leaders vouch for the team, and the doors open wider.", fact: "Community trust is the real cold chain.", eff: { trust: 2 } },
    { icon: "👩‍👧", title: "Women Lead the Committees", tag: "community", why: "Affected women take the decision seats, and services finally fit.", fact: "Nothing about them without them.", eff: { trust: 2 } },
    { icon: "🚨", title: "A Survivor-Centred Response", tag: "governance", why: "A complaint is handled with care and speed, and people see it is safe to report.", fact: "How you handle the first case decides whether anyone reports the next.", eff: { trust: 2 } },
    { icon: "🤲", title: "A Handover Is Welcomed", tag: "governance", why: "Partners celebrate a clean transfer of a programme to national hands.", fact: "The best structure is designed to make itself unnecessary.", eff: { trust: 1, capacity: 1 } },
    { icon: "📣", title: "A Rumour Is Beaten", tag: "info", why: "Trusted voices correct a falsehood, and the queues at the clinic return.", fact: "Get ahead of the rumour, or it gets ahead of you.", eff: { trust: 2, quintet: "behaviour", quintetDir: 1 } },
    { icon: "🕊️", title: "A Humanitarian Pause Holds", tag: "access", why: "A negotiated lull lets aid reach areas sealed for weeks.", fact: "A pause is bought one conversation at a time.", eff: { trust: 1, move: 1 } },
    { icon: "🎖️", title: "Credit Goes to the Team", tag: "any", why: "You name every local colleague at the podium, and the room leans in.", fact: "The best legacy carries no single logo.", eff: { trust: 2 } },
    { icon: "🤝", title: "A Government Champion Emerges", tag: "governance", why: "A well-placed official clears three stuck approvals in an afternoon.", fact: "Trust, once earned, moves faster than any memo.", eff: { trust: 2 } },
    { icon: "📲", title: "A Hotline Goes Live", tag: "digital", why: "People can reach someone who can actually act, and they do.", fact: "Accountability means closing the loop.", eff: { trust: 2, quintet: "digital", quintetDir: 1 } },
  ];

  // CAPACITY squares,  a win for the people and systems that will remain.
  CG.MANDATE_CAPACITY = [
    { icon: "🚀", title: "A Standby Partner Deploys", tag: "any", why: "A roster surges in exactly the specialist you were missing.", fact: "Standby partnerships put surge capacity on the ground in days, not months.", eff: { capacity: 2 } },
    { icon: "📡", title: "Connectivity Reaches the Last District", tag: "digital", why: "A new tower lights up a region that was invisible on the map.", fact: "Without connectivity, every other digital plan is a drawing on a wall.", eff: { capacity: 2, quintet: "digital", quintetDir: 1 } },
    { icon: "🧩", title: "The Clusters Click", tag: "governance", why: "Each sector gets a clear lead, so gaps and overlaps surface fast.", fact: "The 4W matrix is the boring tool that makes duplication die.", eff: { capacity: 2 } },
    { icon: "🏥", title: "Local Capacity Holds", tag: "community", why: "A national team you trained runs the response without you.", fact: "It was the point all along: capacity that stays.", eff: { capacity: 1, trust: 1 } },
    { icon: "📦", title: "Pre-Positioned Stock", tag: "supply", why: "Contingency stock placed before the season is right where the road washed out.", fact: "Pre-positioning is unglamorous and the cheapest way to be fast.", eff: { capacity: 2, move: 1 } },
    { icon: "🧑‍🏫", title: "A Mentored Team Stands Alone", tag: "community", why: "A national team you trained now runs the response itself.", fact: "Local capacity is the only kind that stays after the mission leaves.", eff: { capacity: 2 } },
    { icon: "💧", title: "A Water System Is Restored", tag: "health", why: "Clean water flows again, and the cholera curve bends back down.", fact: "Cholera is solved at the tap, not the bedside.", eff: { capacity: 2 } },
    { icon: "🛖", title: "Durable Shelter Goes Up", tag: "supply", why: "Families move from tarpaulins into shelter that will last the season.", fact: "The most expensive aid is the aid that arrives too late.", eff: { capacity: 2 } },
    { icon: "📚", title: "Classrooms Reopen", tag: "youth", why: "Temporary schools start up, and a generation keeps learning.", fact: "Education in emergencies is protection.", eff: { capacity: 1, trust: 1 } },
    { icon: "🔋", title: "Solar Power Comes Online", tag: "digital", why: "A solar array frees the clinic from the failing grid.", fact: "Resilience is boring until the day it is everything.", eff: { capacity: 2, quintet: "innovation", quintetDir: 1 } },
    { icon: "📟", title: "Disease Surveillance Goes Live", tag: "health", why: "An early-warning system catches a cluster of cases in days, not weeks.", fact: "Most outbreak alerts can be verified within forty-eight hours.", eff: { capacity: 2 } },
    { icon: "🛰️", title: "Common Datasets Are Shared", tag: "data", why: "Everyone plans from the same boundaries and population figures.", fact: "Common operational datasets are the quiet foundation under every map.", eff: { capacity: 1, quintet: "data", quintetDir: 1 } },
    { icon: "🚐", title: "An Air Bridge Opens", tag: "access", why: "A humanitarian air service starts flying staff and cargo where roads cannot.", fact: "When the ground closes, common air services keep everyone moving.", eff: { capacity: 2, move: 1 } },
    { icon: "🏭", title: "A Shared Warehouse Opens", tag: "supply", why: "Agencies pool storage, and there is room and reach for everyone's stock.", fact: "Common services exist because no one agency can do it alone.", eff: { capacity: 2 } },
    { icon: "🌅", title: "Livelihoods Restart", tag: "community", why: "Early-recovery grants get markets and incomes moving again.", fact: "Recovery starts before the cameras leave.", eff: { capacity: 1, trust: 1 } },
  ];

  // MILESTONES,  the big career markers. Worth more to your legacy, and they
  // earn a spin again. {role} and {theatre} are filled for the player.
  CG.MANDATE_MILESTONES = [
    { icon: "🧭", title: "The Cooperation Framework Is Signed", why: "As {role}, you bring government and the UN behind one multi-year plan for {theatre}.", fact: "It is the anchor document for everything that follows." },
    { icon: "🧩", title: "A Joint Programme Launches", why: "Several agencies pool mandates and budgets into a single programme.", fact: "Joint programmes trade a little autonomy for a great deal of impact." },
    { icon: "🏛️", title: "The Government Takes the Lead", why: "National authorities steer the response in {theatre}, with the UN in support.", fact: "Primary responsibility rests with national authorities. The goal is to support them." },
    { icon: "🎓", title: "Refugees Join National Systems", why: "Children enter national schools and clinics, not parallel camp services.", fact: "Inclusion is cheaper, fairer, and the first step out of permanent encampment." },
    { icon: "🛡️", title: "Anticipatory Action Goes Live", why: "Finance now releases on the forecast in {theatre}, before the shock lands.", fact: "Every dollar of early action can return up to seven in losses avoided." },
    { icon: "🏆", title: "A Delivering-as-One Model", why: "Neighbouring teams ask to copy how {theatre} ran as one UN.", fact: "When others borrow your approach, the idea has outgrown you." },
    { icon: "📜", title: "A Common Country Analysis Is Agreed", why: "As {role}, you get every agency planning from one shared read of {theatre}.", fact: "The Common Country Analysis is the evidence base beneath everything that follows." },
    { icon: "🌱", title: "Local Actors Are Funded Directly", why: "Frontline organisations in {theatre} receive money straight, not through three layers.", fact: "Localization shares power, not just risk." },
    { icon: "👂", title: "An Accountability System Takes Root", why: "Affected people in {theatre} can report and see the response change because of it.", fact: "Accountability is closing the loop, not just logging the complaint." },
    { icon: "💧", title: "A Cholera Outbreak Is Beaten", why: "Clean water and a fast campaign hold the line in {theatre}, and the curve bends down.", fact: "Cholera is solved at the tap. Holding the water line saves the most lives." },
    { icon: "🚪", title: "A Sealed Region Is Reached", why: "As {role}, you negotiate access into a part of {theatre} cut off for months.", fact: "Access is won one crossing at a time, by people who never make the headlines." },
    { icon: "🕊️", title: "A Durable-Solutions Pact Is Signed", why: "Governments and partners commit to ending displacement in {theatre}, not just managing it.", fact: "A camp is a symptom. Solutions are political, and they are the goal." },
    { icon: "📊", title: "One Dashboard, One Truth", why: "A shared data system goes live for {theatre}, and the arguments shrink to real decisions.", fact: "Shared data turns fights about facts into decisions about action." },
    { icon: "💳", title: "A Common Cash System Launches", why: "Agencies in {theatre} pay through one platform, so families get one predictable transfer.", fact: "Cash is dignity, and a shared system makes every dollar of it go further." },
    { icon: "📡", title: "Connectivity Reaches the Last District", why: "A new tower lights up a corner of {theatre} that was invisible on the map.", fact: "Without connectivity, every other digital plan is a drawing on a wall." },
    { icon: "🎓", title: "A National Team Stands Alone", why: "The colleagues you mentored in {theatre} now run the response without you.", fact: "Local capacity is the only kind that stays after the mission leaves." },
    { icon: "🏥", title: "Health Services Are Handed Over", why: "National authorities take the lead on health across {theatre}, with the UN in support.", fact: "Primary responsibility rests with national authorities. The goal is to support them." },
  ];

  // NARRATOR LINES for The Mandate, in the same warm voice.
  CG.MANDATE_STORY = {
    opening:
      "Your mandate begins. A coordinator's term is not a sprint to a finish line, it is a long road of choices. Every fork tests what you value: speed or trust, funding or independence, your own logo or the result. Build funding, build trust, build local capacity, and strengthen the UN 2.0 Quintet of Change as you travel. Remember, the richest legacy completes the mandate, not the fastest finish. Spin, and begin.",
    zones: [
      "Arrival. Set the table, win the first yes, and learn whose phone you can call at midnight.",
      "Pressure. The money is tight and the trade-offs are real. What you give up now, you cannot buy back later.",
      "Convergence. The investments mature. The partners you backed early begin to carry the load themselves.",
      "Legacy. The handover nears. The best mandate leaves a country that can carry on without you.",
    ],
    winYou: "You leave the strongest legacy of all: funding that flexes, trust that lasts, and local hands that no longer need yours. Mandate complete.",
    winOther: "leaves the strongest legacy this time. The road will still be here tomorrow. Run it again.",
  };
})();
