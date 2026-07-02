(function(){
  window.CG = window.CG || {};
  const names = ["Amina Diallo","Oscar Reyes","Maya Chen","Nora Haddad","Samir Khan","Elena Petrova","Joseph Okafor","Leila Mensah","Tom Alvarez","Priya Nair","Jonas Berg","Fatima Noor","Mateo Silva","Hana Kim","Luca Moretti","Zara Ahmed","Noah Mensah","Iris Cohen","Tariq Bello","Sofia Ramos","Kai Tanaka","Amara Conte","Mila Kovac","Omar Saleh","Nadia Mirza","Theo Laurent","Grace Wanjiru","Diego Costa","Anika Rao","Ben Carter","Mariam Farah","Kofi Boateng","Lin Wei","Yara Haddad","Ivan Horvat","Asha Singh","Malik Johnson","Sara Dubois","Arun Patel","Nina Novak","Rosa Vargas","Emil Larsen","Dalia Nasser","Luis Ortega","Mei Wong","Aya Hassan","Pavel Sokolov","Tess Morgan","Jamal Ali","Mina Park","Rami Haddad","Eva Schmidt","Nia Brown","Farid Aziz","Ines Martin","Hugo Pinto","Lina Ibrahim","Yusuf Demir","Clara Rossi","Sana Malik"];
  const quintet = [
    {key:'data',icon:'📊',name:'Data',blurb:'Turning evidence into shared decisions.'},
    {key:'innovation',icon:'💡',name:'Innovation',blurb:'Testing better ways to serve communities.'},
    {key:'digital',icon:'🛰️',name:'Digital',blurb:'Using digital tools safely and inclusively.'},
    {key:'foresight',icon:'🔭',name:'Strategic Foresight',blurb:'Looking ahead before risks become shocks.'},
    {key:'behaviour',icon:'🧭',name:'Behavioural Science',blurb:'Designing around how people really act.'}
  ];
  const tagMap = {data:'data',stat:'data',imt:'data',innovation:'innovation',lab:'innovation',digital:'digital',telecom:'digital',foresight:'foresight',risk:'foresight',behaviour:'behaviour',community:'behaviour',aap:'behaviour',wash:'data',health:'data',logistics:'digital',protection:'behaviour',food:'foresight',coordination:'foresight'};
  const roles = [
    ['🕊️','Resident Coordinator','UN RCO','coordination'],['📡','Information Management Officer','OCHA','data'],['🚰','WASH Specialist','UNICEF','wash'],['🚚','Logistics Cluster Lead','WFP','logistics'],['🛡️','Protection Officer','UNHCR','protection'],['🏥','Public Health Coordinator','WHO','health'],['🌾','Food Security Analyst','FAO','food'],['💵','Pooled Fund Manager','OCHA','coordination'],['📣','AAP Advisor','NGO Forum','aap'],['💻','Digital Public Goods Lead','UNDP','digital'],['🔬','Innovation Lab Facilitator','UNICEF','innovation'],['🔭','Foresight and Risk Analyst','UNDP','foresight'],['👥','Community Engagement Lead','IFRC','community'],['⚖️','Rule of Law Advisor','DPKO','protection'],['🏫','Education Cluster Coordinator','UNICEF','coordination'],['📦','Supply Chain Officer','WFP','logistics'],['📈','Data Responsibility Specialist','OCHA','data'],['🧪','Behavioural Insights Advisor','UNDP','behaviour'],['🗺️','GIS Officer','UNOSAT','data'],['🤝','Government Liaison Officer','Ministry Partner','coordination']
  ].map(r=>({icon:r[0],name:r[1],aff:r[2],tag:r[3]}));
  const theatres = [
    ['🌧️','Aster Delta',['wash','health','coordination'],'Seasonal floods have cut arterial roads while displacement sites expand along the river. The UNCT supports national authorities with HCT coordination, pooled funding, WASH surveillance, and accountable communication.'],
    ['🏜️','Koru Basin',['food','foresight','logistics'],'A slow drought has pushed households into crisis coping strategies. The team coordinates anticipatory action, IPC analysis, supply corridors, and durable solutions planning.'],
    ['⛰️','Mira Highlands',['protection','health','digital'],'After landslides and insecurity, communities need safe access to clinics, protection referrals, digital cash delivery, and reliable feedback channels.'],
    ['🌋','Solenne Coast',['logistics','innovation','wash'],'Volcanic ash disrupted ports and water systems. Partners test mobile treatment units, logistics hubs, CERF-backed action, and cluster coordination.'],
    ['🌾','Tamar Plains',['food','community','behaviour'],'Crop failure and rumours are reducing service uptake. The UNCT blends food security response, behavioural insights, AAP, and local leadership.'],
    ['🏙️','Nova Junction',['digital','data','coordination'],'Urban displacement strains services. Teams align common operational datasets, digital registration safeguards, and area-based coordination.']
  ].map(t=>({icon:t[0],name:t[1],tags:t[2],blurb:t[3],type:'fictional crisis theatre'}));
  function card(icon,title,tag,why,fact,effect){return {icon,title,tag,why,fact,effect};}
  const ladder = [
    card('🪜','Common dataset agreed','data','Partners align on one operational picture for {theatre}.','Common operational datasets reduce duplication and improve situational awareness.'),
    card('🤝','HCT compact lands','coordination','The RC and partners agree clear priorities for {theatre}.','Humanitarian Country Teams help align strategy across agencies and NGOs.'),
    card('💡','Local prototype works','innovation','A field-tested idea from {role} scales safely.','Innovation is strongest when tested with communities and measured honestly.'),
    card('🛰️','Connectivity restored','digital','A temporary link reconnects field teams.','Digital infrastructure can speed response when protection and access are considered.'),
    card('🔭','Risk trigger fires early','foresight','Anticipatory action begins before the shock peaks.','Anticipatory action uses forecast triggers to act before predictable hazards escalate.'),
    card('📣','Feedback loop closes','behaviour','Communities see that their complaints changed programming.','AAP means people affected by crisis can influence decisions about aid.')
  ];
  const holes = [
    card('🕳️','Parallel assessments collide','data','Teams ask the same households the same questions.','Coordinated assessments protect time, dignity, and data quality.'),
    card('🚧','Convoy clearance delayed','logistics','A permit problem blocks a planned delivery.','Access constraints require negotiation, acceptance, and realistic operational plans.'),
    card('⚠️','Rumour outruns facts','behaviour','Misinformation spreads before the team responds.','Risk communication works best when trusted local voices are involved.'),
    card('🔒','Sensitive list shared too widely','digital','A spreadsheet travels beyond the need-to-know group.','Data responsibility requires purpose limitation, minimisation, and access controls.'),
    card('🌫️','Scenario planning skipped','foresight','A foreseeable secondary shock catches the team flat-footed.','Strategic foresight helps teams test assumptions and prepare options.'),
    card('💸','Pooled fund window missed','coordination','A promising project fails to meet allocation criteria.','Pooled funds are most useful when priorities and evidence are ready early.')
  ];
  const trophy = [card('🏆','CERF surge approved','coordination','Fast funding brings oxygen to the plan.','CERF provides rapid funding for urgent humanitarian action.'),card('🏆','Cluster dashboard praised','data','The dashboard becomes the daily briefing backbone.','Dashboards are useful when they answer decision questions, not just display numbers.'),card('🏆','Women-led group signs on','community','Local leadership changes the operating plan.','Localisation strengthens relevance, trust, and sustainability.')];
  const diamond = [card('💎','Safe cash transfer','digital','Digital cash reaches households with clear safeguards.','Cash programming can support dignity and choice when markets function.'),card('💎','Joint visit unlocks access','coordination','A joint mission opens a hard-to-reach area.','Joint missions can reduce burden and improve negotiation leverage.'),card('💎','Hotline trend spotted','aap','Feedback shows a hidden barrier.','Complaint and feedback mechanisms are decision systems, not suggestion boxes.')];
  const surprise = [
    card('🎲','Bridge opens','logistics','A temporary bridge cuts travel time.', 'Logistics coordination can turn small access gains into large coverage gains.', {move:6,tilt:'good'}),
    card('🎲','Storm cell shifts','foresight','The hazard track changes overnight.', 'Plans need triggers and fallback options.', {move:-5,tilt:'bad'}),
    card('🎲','Volunteer mapathon','digital','Remote volunteers trace roads for field teams.', 'Crowdsourced mapping can support access analysis.', {move:4,tilt:'good'}),
    card('🎲','Fuel shortage','logistics','Fleet plans are rewritten.', 'Supply chains need contingency reserves and prioritisation.', {move:-7,tilt:'bad'}),
    card('🎲','Diplomatic breakthrough','coordination','A corridor opens just in time.', 'Principled negotiation can expand humanitarian space.', {finish:true,tilt:'rare'}),
    card('🎲','False clearance','protection','The route is not safe after all.', 'Protection analysis must challenge optimistic assumptions.', {start:true,tilt:'bad'})
  ];
  const notes = [
    'The RC leads the UN Country Team and helps align UN support with national priorities.',
    'OCHA supports coordination, information management, policy, advocacy, and pooled funds.',
    'Clusters clarify leadership and accountability in major humanitarian responses.',
    'AAP stands for Accountability to Affected People.',
    'PSEA means Protection from Sexual Exploitation and Abuse.',
    'IPC analysis classifies food insecurity severity using common standards.',
    'Durable solutions require safety, dignity, and choice for displaced people.',
    'The Grand Bargain promotes more efficient and locally-led humanitarian action.',
    'Data minimisation means collecting only what is necessary for a defined purpose.',
    'Anticipatory action links forecasts, thresholds, financing, and pre-agreed activities.',
    'A good coordination meeting ends with owners, deadlines, and fewer duplicative actions.',
    'Community feedback is evidence and should shape programme decisions.'
  ];
  const story = {opening:'Welcome to Common Ground: The Long Road. Your UN Country Team has been posted to {theatre}. Reach square 100 to finish the mandate, together.', zones:['The first days are noisy. Facts are thin, needs are high, and coordination matters.','The response finds rhythm. Shared priorities begin to replace parallel effort.','The crisis becomes complex. Protection, access, and trust decide what works.','The final mile tests patience. Exact decisions, exact landings, and common ground carry the team home.'],win:'The mandate is complete. The long road was won by coordination, evidence, courage, and trust.'};
  window.CG.Content = {AGENT_NAMES:names, QUINTET:quintet, TAG_MAP:tagMap, ROLES:roles, THEATRES:theatres, LADDER_CARDS:ladder, SNAKE_CARDS:holes, TROPHY_CARDS:trophy, DIAMOND_CARDS:diamond, SURPRISE_CARDS:surprise, FIELD_NOTES:notes, STORY:story};
})();