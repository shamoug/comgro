/* =========================================================================
 * COMMON GROUND, content.fr.js  (contenu français, miroir de content.en.js)
 * Tout le texte d'ambiance + modèles dynamiques UI/IA, indexés par id / clé.
 * Mêmes clés exactes que la version anglaise.
 * ========================================================================= */
(function(){var CG=(window.CG=window.CG||{});CG.CONTENT=CG.CONTENT||{};
CG.CONTENT.fr={
 "rc": {
  "name": "Coordonnatrice résidente",
  "desc": "Le trait d'union de l'équipe. Pas d'ordres, seulement de l'influence.",
  "ab": "Aligner",
  "abd": "Une fois par tour : accorde +2 Coordination et un bonus de synergie à la prochaine action jouée."
 },
 "dmo": {
  "name": "Responsable de la gestion des données",
  "desc": "Transforme les chiffres en décisions.",
  "ab": "Lucidité",
  "abd": "Une fois par tour : gagne +3 Données et révèle la prochaine carte Événement avant qu'elle ne frappe."
 },
 "hro": {
  "name": "Spécialiste des droits humains",
  "desc": "Ne laisse personne de côté.",
  "ab": "Bouclier",
  "abd": "Une fois par tour : réduit de moitié les dégâts de Confiance du prochain Événement néfaste et protège les groupes vulnérables."
 },
 "ngo": {
  "name": "Partenaire ONG",
  "desc": "Rapide, proche des communautés.",
  "ab": "Portée",
  "abd": "Une fois par tour : joue une carte Action sans payer son coût de Financement."
 },
 "gov": {
  "name": "Homologue gouvernemental",
  "desc": "Détient le mandat.",
  "ab": "Mandat",
  "abd": "Une fois par tour : débloque une politique nationale, +5 Confiance pour tout le pays."
 },
 "donor": {
  "name": "Représentant des bailleurs",
  "desc": "Apporte l'argent, avec des conditions.",
  "ab": "Injecter",
  "abd": "Une fois par tour : injecte +5 Financement, mais désigne un pilier prioritaire qui rapporte double ce tour-ci."
 },
 "youth": {
  "name": "Leader de la jeunesse",
  "desc": "De l'énergie et de la portée.",
  "ab": "Amplifier",
  "abd": "Une fois par tour : double l'effet de la prochaine action de Sciences comportementales."
 },
 "innolab": {
  "name": "Responsable du laboratoire d'innovation",
  "desc": "Met à l'épreuve des idées audacieuses.",
  "ab": "Expérimenter",
  "abd": "Une fois par tour : mène une expérience à haut risque, gros gain d'Innovation, ou un léger revers."
 },
 "foresight": {
  "name": "Analyste prospective",
  "desc": "Lit l'horizon.",
  "ab": "Horizon",
  "abd": "Une fois par tour : observe les deux prochaines cartes Événement et change leur ordre."
 },
 "comms": {
  "name": "Chargé de communication",
  "desc": "Façonne le récit.",
  "ab": "Contre-récit",
  "abd": "Une fois par tour : neutralise un Événement de désinformation et gagne +3 Confiance."
 },
 "logops": {
  "name": "Responsable logistique et opérations",
  "desc": "Rend la livraison concrète.",
  "ab": "Fluidifier",
  "abd": "Une fois par tour : réduit le coût de tes deux prochaines actions de 1 Financement chacune."
 },
 "chw": {
  "name": "Agente de santé communautaire",
  "desc": "La confiance sur le terrain.",
  "ab": "Soin",
  "abd": "Une fois par tour : convertit jusqu'à 3 Données en Confiance (1:1), doublé pendant une crise sanitaire."
 },
 "jna": {
  "name": "Évaluation conjointe des besoins",
  "fl": "Compter ceux qu'on oublie avant de décider qui atteindre.",
  "fn": "Une évaluation partagée empêche six agences d'enquêter six fois dans le même village."
 },
 "datamission": {
  "name": "Mission de collecte de données",
  "fl": "Envoyer l'équipe là où les cartes deviennent blanches.",
  "fn": "Les données de terrain battent une supposition faite dans la capitale, à chaque fois."
 },
 "dashboard": {
  "name": "Tableau de bord en données ouvertes",
  "fl": "Quand tout le monde voit les mêmes chiffres, les disputes rétrécissent.",
  "fn": "Les tableaux de bord ouverts transforment la rétention des données en conscience partagée de la situation."
 },
 "survey": {
  "name": "Enquête auprès des ménages",
  "fl": "Frapper aux portes que les statistiques ont oubliées.",
  "fn": "Les données désagrégées, c'est ainsi que « ne laisser personne de côté » cesse d'être un slogan."
 },
 "census": {
  "name": "Renforcement des capacités statistiques",
  "fl": "Apprendre au système à se compter lui-même.",
  "fn": "Renforcer un office national des statistiques dure plus longtemps que n'importe quel projet isolé."
 },
 "geodata": {
  "name": "Cartographie géospatiale des risques",
  "fl": "Des couches de cartes révèlent les gens dans les angles morts.",
  "fn": "Les satellites montrent où la route s'arrête et où le besoin commence."
 },
 "datagov": {
  "name": "Pacte de gouvernance des données",
  "fl": "Des règles pour les données donnent aux gens l'envie de les partager.",
  "fn": "La vie privée et la protection ne sont pas de la paperasse : ce sont les raisons pour lesquelles les gens vous confient leurs informations."
 },
 "digiservice": {
  "name": "Lancer un service numérique",
  "fl": "Un rendez-vous médical pris depuis un téléphone dans un village.",
  "fn": "Les services publics numériques atteignent des gens que le bureau le plus proche n'aurait jamais pu atteindre."
 },
 "connectivity": {
  "name": "Projet de connectivité",
  "fl": "Du signal là où il n'y avait que du silence.",
  "fn": "Sans connectivité, tout autre plan numérique n'est qu'un dessin."
 },
 "interop": {
  "name": "Plateforme interopérable",
  "fl": "Des systèmes qui se parlent enfin.",
  "fn": "L'interopérabilité, c'est que le dossier d'un réfugié le suit, et non l'inverse."
 },
 "digiid": {
  "name": "Identité numérique pour les services",
  "fl": "La preuve que vous existez, pour que le système puisse vous inclure.",
  "fn": "Bien conçue, l'identité numérique ouvre des services ; mal conçue, elle exclut : la conception compte."
 },
 "egov": {
  "name": "Portail d'administration en ligne",
  "fl": "Un seul guichet pour le citoyen, au lieu de dix files d'attente.",
  "fn": "Supprimer la file d'attente, c'est aussi supprimer l'occasion d'un pot-de-vin."
 },
 "cyberhygiene": {
  "name": "Exercice de cyber-résilience",
  "fl": "Répéter le mauvais jour avant qu'il n'arrive.",
  "fn": "Une plateforme dont les gens dépendent est une infrastructure critique : protégez-la comme telle."
 },
 "pilotlab": {
  "name": "Laboratoire pilote",
  "fl": "Essayer petit, apprendre vite, échouer à bas coût.",
  "fn": "Le rôle d'un pilote est de produire des preuves, pas seulement de l'espoir."
 },
 "scaleup": {
  "name": "Passage à l'échelle",
  "fl": "Le pilote a marché. Maintenant, atteignez un million de personnes.",
  "fn": "La plupart des bons pilotes meurent dans l'écart entre la preuve et l'échelle : attention à cet écart."
 },
 "challengefund": {
  "name": "Fonds de défi",
  "fl": "Posez le problème ; laissez gagner la meilleure idée.",
  "fn": "Les défis ouverts font émerger des solutionneurs que vous n'auriez jamais recrutés."
 },
 "socialent": {
  "name": "Soutenir une entreprise sociale",
  "fl": "Une entreprise locale qui règle un problème local.",
  "fn": "L'impact durable revêt souvent les habits d'une petite entreprise."
 },
 "frontier": {
  "name": "Essai de technologies de pointe",
  "fl": "Prudent, curieux, les yeux ouverts.",
  "fn": "Les nouveaux outils sont testés face au problème, pas adoptés pour la brochure."
 },
 "youthhack": {
  "name": "Sprint d'innovation jeunesse",
  "fl": "Quarante-huit heures, cent jeunes esprits.",
  "fn": "Les gens les plus proches d'un problème détiennent souvent la solution la moins chère."
 },
 "scenario": {
  "name": "Atelier de scénarios",
  "fl": "Répéter trois futurs pour qu'aucun ne vous surprenne.",
  "fn": "La prospective coûte moins cher que la crise qu'elle aide à éviter."
 },
 "ews": {
  "name": "Système d'alerte précoce",
  "fl": "Quelques jours d'avance peuvent sauver une saison.",
  "fn": "L'alerte précoce ne fonctionne que si elle atteint le dernier village, pas seulement la capitale."
 },
 "riskmap": {
  "name": "Carte nationale des risques",
  "fl": "Nommer les dangers avant qu'ils ne se présentent.",
  "fn": "Une carte des risques partagée transforme « quelqu'un aurait dû savoir » en « nous l'avions prévu »."
 },
 "anticipatory": {
  "name": "Plan d'action anticipée",
  "fl": "Argent convenu d'avance, déclencheurs convenus d'avance, aucun débat quand la tempête frappe.",
  "fn": "Agir avant une catastrophe coûte une fraction du nettoyage après."
 },
 "horizonscan": {
  "name": "Veille de l'horizon",
  "fl": "Surveiller les marges, pas seulement les gros titres.",
  "fn": "Les signaux faibles d'aujourd'hui sont les unes de demain."
 },
 "stresstest": {
  "name": "Test de résistance du plan",
  "fl": "Casser le plan sur le papier avant que la réalité ne le fasse.",
  "fn": "Les plans résilients sont ceux qui ont déjà survécu à un pire jour imaginé."
 },
 "nudge": {
  "name": "Campagne d'incitation douce",
  "fl": "Faire du choix sain le choix facile.",
  "fn": "Un message de rappel au bon moment peut surpasser une nouvelle clinique."
 },
 "dialogue": {
  "name": "Dialogue communautaire",
  "fl": "Écouter d'abord. Les décisions passent mieux quand les gens sont entendus.",
  "fn": "Les communautés soutiennent ce qu'elles aident à concevoir."
 },
 "trustvisit": {
  "name": "Visite de renforcement de la confiance",
  "fl": "Être présent là où il n'y a pas de caméras.",
  "fn": "La confiance se construit en personne et se perd dans les communiqués de presse."
 },
 "rumour": {
  "name": "Suivi des rumeurs",
  "fl": "Entendre le murmure avant qu'il ne devienne un cri.",
  "fn": "Dans une épidémie, la rumeur se propage plus vite que le virus : suivez les deux."
 },
 "incentives": {
  "name": "Incitations comportementales",
  "fl": "Une petite récompense bien placée change une habitude.",
  "fn": "Un soutien conditionnel peut accroître à la fois la fréquentation et la dignité quand il est conçu avec les gens."
 },
 "inclusioncircle": {
  "name": "Cercle d'inclusion",
  "fl": "Amener au premier rang ceux qu'on interroge rarement.",
  "fn": "Rien sur nous sans nous : concevoir avec les personnes les plus concernées."
 },
 "convene": {
  "name": "Réunir les partenaires",
  "fl": "Rassembler tout le monde dans une pièce et laisser l'ordre du jour faire le travail.",
  "fn": "Le superpouvoir du CR, c'est la table elle-même : qui s'y assoit, et pourquoi."
 },
 "jointprog": {
  "name": "Programme conjoint",
  "fl": "Plusieurs agences, un plan, une ligne budgétaire.",
  "fn": "Les programmes conjoints échangent un peu d'autonomie contre beaucoup d'impact."
 },
 "pooledfund": {
  "name": "Fonds commun",
  "fl": "Argent mis en commun, priorités convenues, moins de doublons.",
  "fn": "Un fonds commun laisse le pays tenir la barre, pas seulement le bailleur le plus bruyant."
 },
 "clusterlead": {
  "name": "Activer les groupes de coordination",
  "fl": "Dans une crise, la structure est une forme de bonté.",
  "fn": "Des rôles de coordination clairs en situation d'urgence sauvent les jours qui sauvent des vies."
 },
 "advocacy": {
  "name": "Plaidoyer conjoint",
  "fl": "Une seule voix de l'ONU porte plus loin que dix.",
  "fn": "Parler ensemble protège chaque agence de devoir parler seule."
 },
 "localgov": {
  "name": "Renforcer les collectivités locales",
  "fl": "La livraison est locale ou elle est théorique.",
  "fn": "Des autorités locales compétentes durent plus longtemps que toute mission de passage."
 },
 "resmob": {
  "name": "Campagne de mobilisation des ressources",
  "fl": "Un bon dossier, bien étayé, ouvre les portefeuilles.",
  "fn": "Les bailleurs financent la crédibilité : montrez des résultats, pas seulement un besoin."
 },
 "volunteers": {
  "name": "Mobiliser les Volontaires des Nations Unies",
  "fl": "Des mains volontaires, un savoir local, une portée réelle.",
  "fn": "Les volontaires ne sont pas de la main-d'œuvre gratuite : ils sont la confiance communautaire rendue visible."
 },
 "south": {
  "name": "Échange Sud-Sud",
  "fl": "Un voisin qui a résolu ça l'an dernier est le meilleur consultant.",
  "fn": "L'apprentissage entre pairs entre pays vaut mieux qu'importer un modèle lointain."
 },
 "monitoring": {
  "name": "Visite de suivi conjointe",
  "fl": "Aller voir. Puis aller réparer.",
  "fn": "Ce qu'on suit ensemble s'améliore ensemble."
 },
 "humdev": {
  "name": "Passerelle humanitaire-développement",
  "fl": "Le secours aujourd'hui, la résilience demain : planifier les deux à la fois.",
  "fn": "Le nexus, c'est ne pas reconstruire le même mur à chaque saison des crues."
 },
 "children": {
  "name": "Agence pour l'enfance",
  "arch": "Entité de l'ONU",
  "fl": "Chaque plan, vu à travers les yeux d'un enfant.",
  "fn": "Les enfants sont 100 % de l'avenir et les premiers à ressentir une crise."
 },
 "food": {
  "name": "Agence alimentaire",
  "arch": "Entité de l'ONU",
  "fl": "Une logistique qui atteint le dernier kilomètre.",
  "fn": "Quand la faim frappe, les chaînes d'approvisionnement sont la stratégie."
 },
 "health": {
  "name": "Agence de santé",
  "arch": "Entité de l'ONU",
  "fl": "Des épidémies auxquelles on répond par des preuves.",
  "fn": "La surveillance des maladies, ce sont des données auxquelles des vies sont attachées."
 },
 "refugee": {
  "name": "Agence pour les réfugiés",
  "arch": "Entité de l'ONU",
  "fl": "Une protection qui voyage avec les gens.",
  "fn": "Une identité enregistrée est le premier pas vers le retour à l'inclusion."
 },
 "devagency": {
  "name": "Agence de développement",
  "arch": "Entité de l'ONU",
  "fl": "Du pilote à la politique nationale.",
  "fn": "Le développement est le jeu de longue haleine joué dans de courts cycles de financement."
 },
 "labour": {
  "name": "Agence du travail",
  "arch": "Entité de l'ONU",
  "fl": "Le travail décent comme voie de sortie de la pauvreté.",
  "fn": "Le chômage des jeunes résolu, c'est une génération récupérée."
 },
 "women": {
  "name": "Agence pour l'égalité des genres",
  "arch": "Entité de l'ONU",
  "fl": "La moitié de la population, pleinement comptée.",
  "fn": "Les programmes aveugles au genre ne sont pas neutres : ils manquent la moitié du tableau."
 },
 "envagency": {
  "name": "Agence pour l'environnement",
  "arch": "Entité de l'ONU",
  "fl": "Le climat est le contexte de tout.",
  "fn": "S'adapter maintenant est l'assurance la moins chère qu'un pays fragile puisse s'offrir."
 },
 "civsociety": {
  "name": "Coalition de la société civile",
  "arch": "Partenaire",
  "fl": "La conscience et la portée de la communauté.",
  "fn": "La société civile atteint là où l'État ne peut pas et pose les questions qu'il ne veut pas poser."
 },
 "privatesector": {
  "name": "Alliance du secteur privé",
  "arch": "Partenaire",
  "fl": "Du capital et des capacités, alignés sur les objectifs.",
  "fn": "C'est dans le secteur privé que vivent réellement la plupart des emplois et de l'innovation."
 },
 "academia": {
  "name": "Universités et groupes de réflexion",
  "arch": "Partenaire",
  "fl": "De la rigueur à la demande.",
  "fn": "La recherche indépendante garde la politique honnête."
 },
 "ifi": {
  "name": "Institution financière internationale",
  "arch": "Partenaire",
  "fl": "Le grand bilan comptable à la table.",
  "fn": "Aligner les objectifs de l'ONU avec les prêts des IFI multiplie les deux."
 },
 "media": {
  "name": "Médias indépendants",
  "arch": "Partenaire",
  "fl": "Des faits, bien racontés, à temps.",
  "fn": "Une presse libre est le système d'alerte précoce de la gouvernance."
 },
 "diaspora": {
  "name": "Réseau de la diaspora",
  "arch": "Partenaire",
  "fl": "Du talent et des transferts d'argent qui n'ont jamais oublié le pays.",
  "fn": "L'investissement de la diaspora dépasse souvent l'aide officielle : canalisez-le bien."
 },
 "faith": {
  "name": "Réseaux confessionnels",
  "arch": "Partenaire",
  "fl": "Des voix de confiance dans chaque village.",
  "fn": "Les chefs religieux peuvent porter un message de santé publique plus loin que tout ministère."
 },
 "youthnet": {
  "name": "Réseaux de jeunesse",
  "arch": "Partenaire",
  "fl": "Des natifs du numérique qui ont leur peau dans le jeu.",
  "fn": "Les jeunes ne sont pas une partie prenante du futur : ils en sont une du présent."
 },
 "m_data": {
  "name": "Sahélia compte tout le monde",
  "rw": "Un système national de données en temps réel guide chaque ministère."
 },
 "m_digital": {
  "name": "Des services dans chaque main",
  "rw": "Les services publics numériques atteignent les districts les plus reculés."
 },
 "m_innovation": {
  "name": "Des idées passées à l'échelle",
  "rw": "Une innovation locale est devenue politique nationale."
 },
 "m_foresight": {
  "name": "Prêts pour le prochain choc",
  "rw": "Les systèmes anticipatifs donnent à Sahélia une longueur d'avance sur chaque danger."
 },
 "m_behavioural": {
  "name": "Les communautés aux commandes",
  "rw": "Les gens façonnent les services qu'ils utilisent, et leur font confiance."
 },
 "flood": {
  "name": "Crues soudaines dans le delta",
  "fl": "La rivière a emporté la route, la clinique et trois semaines du plan."
 },
 "drought": {
  "name": "Une saison des pluies manquée",
  "fl": "La prévision était juste. La récolte sera maigre."
 },
 "displacement": {
  "name": "Vague de déplacement",
  "fl": "Douze mille personnes arrivent dans une ville bâtie pour trois mille."
 },
 "outbreak": {
  "name": "Flambée épidémique",
  "fl": "Les cas doublent du jour au lendemain dans les districts de l'est."
 },
 "fundingcut": {
  "name": "Coupe budgétaire soudaine",
  "fl": "Un grand bailleur réoriente ses priorités. Le manque retombe sur vous."
 },
 "politension": {
  "name": "Montée des tensions politiques",
  "fl": "Une décision contestée gèle la coopération entre les ministères."
 },
 "supplybreak": {
  "name": "Rupture de la chaîne d'approvisionnement",
  "fl": "Les médicaments sont à la frontière. La frontière est fermée."
 },
 "cyber": {
  "name": "Incident cyber sur une plateforme clé",
  "fl": "Le portail des prestations est en panne. La confiance chute à chaque message d'erreur."
 },
 "misinfo": {
  "name": "La désinformation se propage",
  "fl": "Une rumeur sur une application de messagerie éloigne les familles de la clinique."
 },
 "heatwave": {
  "name": "Canicule record",
  "fl": "Les écoles ferment. Le réseau électrique souffre. Les plus vulnérables souffrent en premier."
 },
 "locust": {
  "name": "Invasion de criquets",
  "fl": "Un nuage vert traverse la frontière et les champs se vident."
 },
 "border": {
  "name": "Restrictions frontalières",
  "fl": "De nouvelles formalités ralentissent chaque convoi à pas de tortue."
 },
 "staffgap": {
  "name": "Épuisement au bureau de terrain",
  "fl": "Trop de travail, trop longtemps, trop peu de monde."
 },
 "corruption": {
  "name": "Scandale de passation de marchés",
  "fl": "Un audit découvre des fonds qui sont allés là où ils n'auraient pas dû."
 },
 "earthquake": {
  "name": "Tremblement de terre",
  "fl": "Quatre-vingt-dix secondes changent tout."
 },
 "currency": {
  "name": "Effondrement de la monnaie",
  "fl": "Les prix doublent ; les budgets sont divisés par deux en valeur réelle."
 },
 "schoolstrike": {
  "name": "Grève des enseignants",
  "fl": "Les salles de classe se vident tandis qu'un conflit salarial s'éternise."
 },
 "dataleak": {
  "name": "Fuite de données",
  "fl": "Un tableur des bénéficiaires atterrit dans la mauvaise boîte de réception."
 },
 "donorfatigue": {
  "name": "Lassitude des bailleurs",
  "fl": "La crise n'est plus à la mode. Les promesses de dons s'amincissent."
 },
 "infrastructure": {
  "name": "Effondrement d'un pont",
  "fl": "La seule route vers le nord a disparu jusqu'à nouvel ordre."
 },
 "protest": {
  "name": "Manifestations dans la capitale",
  "fl": "La frustration déborde dans les rues ; les bureaux ferment par sécurité."
 },
 "famine": {
  "name": "Point chaud de la faim déclaré",
  "fl": "Les alertes précoces étaient réelles. Désormais, elles ont un nom."
 },
 "techfail": {
  "name": "Panne de plateforme",
  "fl": "Le tableau de bord dont tout le monde dépendait montre le monde d'hier."
 },
 "trustdip": {
  "name": "Une promesse qui glisse",
  "fl": "Un jalon rate son échéance et les gens le remarquent."
 },
 "newdonor": {
  "name": "Intérêt d'un nouveau bailleur",
  "fl": "Une fondation aime vos données probantes et veut s'engager."
 },
 "databreak": {
  "name": "Percée des données",
  "fl": "Un jeu de données fusionné révèle exactement qui passe entre les mailles."
 },
 "pilotwin": {
  "name": "Un pilote réussit",
  "fl": "La petite expérience a dépassé ses cibles."
 },
 "peace": {
  "name": "Dividende de la paix",
  "fl": "Un accord local ouvre des routes et assouplit les budgets."
 },
 "viral": {
  "name": "Une campagne devient virale",
  "fl": "Une vidéo réalisée par des jeunes fait ce qu'un communiqué de presse n'aurait jamais pu."
 },
 "techgift": {
  "name": "Partenariat technologique",
  "fl": "Une entreprise offre des crédits cloud et une équipe d'ingénieurs."
 },
 "champion": {
  "name": "Un champion émerge au gouvernement",
  "fl": "Une ministre décide que c'est l'héritage qu'elle veut laisser."
 },
 "volunteerwave": {
  "name": "Les volontaires se mobilisent",
  "fl": "Les communautés s'organisent plus vite que toute agence ne le pourrait."
 },
 "research": {
  "name": "Une étude universitaire paraît",
  "fl": "Une recherche indépendante confirme que l'approche fonctionne."
 },
 "remittance": {
  "name": "Investissement de la diaspora",
  "fl": "De l'argent et des compétences rentrent au pays avec un but."
 },
 "goodrains": {
  "name": "Les pluies arrivent à temps",
  "fl": "Une bonne saison offre un peu de répit."
 },
 "mediaspot": {
  "name": "Couverture médiatique positive",
  "fl": "Une histoire juste et pleine d'espoir atteint tout le pays."
 },
 "pooledwin": {
  "name": "Le fonds commun est reconstitué",
  "fl": "Plusieurs bailleurs acceptent de renflouer la cagnotte partagée."
 },
 "youthcoop": {
  "name": "Une coopérative de jeunes surprend tout le monde",
  "fl": "Quarante jeunes transforment une subvention en deux cents emplois."
 },
 "earlysuccess": {
  "name": "L'alerte précoce porte ses fruits",
  "fl": "Parce que vous avez agi tôt, la tempête a coûté bien moins cher."
 },
 "interagency": {
  "name": "Les agences s'alignent",
  "fl": "Un plan longtemps bloqué passe enfin tous les bureaux d'un coup."
 },
 "d_speedfair": {
  "name": "Rapide ou équitable ?",
  "fl": "L'aide peut partir demain vers les plus faciles à atteindre, ou la semaine prochaine vers tout le monde.",
  "o": [
   {
    "l": "Aller vite",
    "d": "Des gains rapides maintenant ; certains sont laissés de côté."
   },
   {
    "l": "Atteindre tout le monde",
    "d": "Plus lent, mais personne n'est oublié."
   }
  ]
 },
 "d_donorcondition": {
  "name": "La condition du bailleur",
  "fl": "Un financement est proposé, à condition de l'estampiller à leur façon et de sauter le plan conjoint.",
  "o": [
   {
    "l": "Prendre l'argent",
    "d": "+5 Financement, −Coordination et un peu de Confiance."
   },
   {
    "l": "Tenir bon",
    "d": "Protéger le plan conjoint ; renoncer aux fonds."
   }
  ]
 },
 "d_dataprivacy": {
  "name": "Données utiles, données risquées",
  "fl": "Un riche jeu de données affinerait le ciblage, mais il est sensible.",
  "o": [
   {
    "l": "L'utiliser avec soin",
    "d": "Gros gain de données ; un risque de protection."
   },
   {
    "l": "Protéger d'abord",
    "d": "Une analyse plus lente, une confiance plus forte."
   }
  ]
 },
 "d_localintl": {
  "name": "Des mains locales ou la vitesse internationale ?",
  "fl": "Un prestataire international est plus rapide ; une ONG locale bâtit des capacités durables.",
  "o": [
   {
    "l": "Prestataire international",
    "d": "Une livraison rapide maintenant."
   },
   {
    "l": "ONG locale",
    "d": "Plus lent, bâtit confiance et capacités locales."
   }
  ]
 },
 "d_priority": {
  "name": "Deux crises, une seule équipe",
  "fl": "La flambée épidémique et le camp de déplacés ont tous deux besoin de vous maintenant.",
  "o": [
   {
    "l": "La santé d'abord",
    "d": "Stabiliser la flambée."
   },
   {
    "l": "Le camp d'abord",
    "d": "Abriter les nouveaux déplacés."
   }
  ]
 },
 "d_transparency": {
  "name": "Vérité gênante",
  "fl": "Un rapport montre qu'un programme a sous-performé. Publier, ou corriger discrètement ?",
  "o": [
   {
    "l": "Publier ouvertement",
    "d": "Une piqûre à court terme, de la confiance à long terme."
   },
   {
    "l": "Corriger discrètement",
    "d": "Éviter la une ; risquer d'être découvert."
   }
  ]
 },
 "d_innovation": {
  "name": "Miser sur l'idée audacieuse ?",
  "fl": "Une approche non éprouvée pourrait gagner des années, ou gâcher un trimestre.",
  "o": [
   {
    "l": "Prendre le pari",
    "d": "Haut risque, forte récompense."
   },
   {
    "l": "Jouer la sécurité",
    "d": "Des progrès modestes et fiables."
   }
  ]
 },
 "d_shortlong": {
  "name": "Secours ou résilience ?",
  "fl": "Dépenser pour le besoin de ce mois-ci, ou pour le système qui prévient celui de l'an prochain.",
  "o": [
   {
    "l": "Répondre au besoin maintenant",
    "d": "De la confiance maintenant ; le risque se répète."
   },
   {
    "l": "Investir dans la résilience",
    "d": "Des gains de prospective ; de la patience requise."
   }
  ]
 },
 "d_voice": {
  "name": "Qui s'assoit à la table ?",
  "fl": "L'ordre du jour est chargé. Ajouter les représentants des jeunes et du handicap, ou rester efficace ?",
  "o": [
   {
    "l": "Élargir le cercle",
    "d": "Plus lent, bien plus légitime."
   },
   {
    "l": "Rester resserré",
    "d": "Efficace, mais plus étroit."
   }
  ]
 },
 "d_attribution": {
  "name": "À qui revient la victoire ?",
  "fl": "Un succès pourrait être la une d'une seule agence, ou le mérite discret de toute l'équipe.",
  "o": [
   {
    "l": "Partager le mérite",
    "d": "Bâtit coordination et confiance."
   },
   {
    "l": "Réclamer les projecteurs",
    "d": "De la visibilité maintenant, des frictions plus tard."
   }
  ]
 },
 "d_security": {
  "name": "Accès contre sécurité",
  "fl": "Un district dans le besoin est aussi un district à risque pour le personnel.",
  "o": [
   {
    "l": "Envoyer la mission",
    "d": "Atteindre les gens ; accepter le risque."
   },
   {
    "l": "Se retenir",
    "d": "Protéger le personnel ; les gens attendent."
   }
  ]
 },
 "d_pace": {
  "name": "Forcer ou doser ?",
  "fl": "L'équipe peut sprinter pour atteindre une cible, ou préserver sa propre énergie.",
  "o": [
   {
    "l": "Sprinter maintenant",
    "d": "Des progrès maintenant, de la fatigue plus tard."
   },
   {
    "l": "Doser l'équipe",
    "d": "Récupérer des forces pour la suite."
   }
  ]
 },
 "stable": {
  "name": "Une arrivée au calme",
  "desc": "Sahélia est stable. Une rare fenêtre pour bâtir."
 },
 "fragile": {
  "name": "Au bord du gouffre",
  "desc": "La confiance est ténue et une crise mijote déjà."
 },
 "flush": {
  "name": "À l'aise financièrement",
  "desc": "Un grand appel de fonds a réussi, mais les attentes sont élevées."
 },
 "datapoor": {
  "name": "Naviguer à l'aveugle",
  "desc": "La dernière enquête a des années. Les données sont rares."
 },
 "fractured": {
  "name": "Une équipe fracturée",
  "desc": "Les partenaires se méfient les uns des autres. La coordination s'arrache de haute lutte."
 },
 "hopeful": {
  "name": "Un nouveau gouvernement",
  "desc": "Un leadership neuf, une réelle bonne volonté, des systèmes non éprouvés."
 },
 "country": {
  "name": "Sahélia",
  "blurb": "Une nation composite entre Sahel et côte : lumineuse, jeune et mise à l'épreuve par les chocs climatiques, les déplacements et des institutions fragiles, dotée d'un Plan national de développement et d'un Cadre de coopération de l'ONU à la hauteur."
 },
 "v0": "À l'aéroport, une agente des douanes reconnaît le logo de l'ONU et demande, à voix basse, si le nouveau programme atteindra aussi son village. Vous notez le nom du village.",
 "v1": "Votre première réunion de coordination s'éternise. Onze agences, trois sigles que vous ne connaissez pas encore, et une seule carte partagée épinglée de travers au mur.",
 "v2": "Une infirmière de district vous montre son registre papier des naissances. « Le système de la capitale dit que nous avons moitié moins de bébés », dit-elle. Vous savez tous les deux quel chiffre est vrai.",
 "v3": "La ministre du Plan est chaleureuse mais prudente. « Nous avons eu beaucoup de cadres, dit-elle. Montrez-m'en un qui survit à la première saison sèche. »",
 "v4": "Une jeune femme tient un kiosque de recharge de téléphones alimenté par un seul panneau solaire. Elle a des données plus fiables sur les prix locaux que le ministère.",
 "v5": "Trois agences viennent enquêter dans la même ville de pêcheurs la même semaine. Les pêcheurs, patients, répondent trois fois aux mêmes questions.",
 "v6": "Au bureau du CR, le tableau blanc ne porte qu'une phrase : « Qui passe à travers les mailles ? » Personne ne l'a effacée depuis des mois. C'est la bonne question.",
 "v7": "Un bailleur arrive en avion pour une journée, veut une photo dans une école, puis repart. La pompe à eau de l'école est en panne depuis un an. Vous le notez.",
 "v8": "Un codeur adolescent vous montre une appli qu'il a conçue pour signaler les lampadaires cassés. Deux mille personnes l'utilisent déjà. La municipalité ignore qu'elle existe.",
 "v9": "Un ancien vous montre les vieux repères de crue sur la berge, peints il y a des décennies. Ils sont plus hauts que tout modèle prévu par votre bureau.",
 "v10": "L'agence alimentaire et l'agence pour l'enfance découvrent qu'elles achètent les mêmes compléments à des fournisseurs différents et à des prix différents. Tout le monde rit, puis on corrige.",
 "v11": "Un leader de la société civile se méfie de vous, et le dit franchement. À la fin de la réunion, vous vous êtes mis d'accord sur une petite chose. C'est un début.",
 "v12": "Des commerçants du marché expliquent comment une rumeur sur un changement de monnaie a vidé les boutiques en une matinée. L'information, comprenez-vous, est une infrastructure ici.",
 "v13": "Un statisticien du gouvernement vous montre un magnifique jeu de données, vieux de deux ans, parce que personne n'a financé l'enquête suivante.",
 "v14": "Lors d'une réunion communautaire, les femmes restent au fond jusqu'à ce qu'un jeune volontaire déplace discrètement les chaises en cercle. La conversation change aussitôt.",
 "v15": "Votre chauffeur, qui travaille ici depuis vingt ans, vous donne le briefing le plus utile de la semaine, quelque part entre deux postes de contrôle.",
 "v16": "La première vraie crise arrive à 4 h du matin par téléphone. À 6 h, la question n'est pas ce qui s'est passé, mais qui parle à qui.",
 "v17": "Une clinique est inondée jusqu'aux genoux. Les vaccins ont été déplacés à temps, parce que quelqu'un avait répété cette matinée exacte dans un atelier auquel personne ne voulait assister.",
 "v18": "Une rumeur se propage sur une appli de messagerie : le nouveau programme serait une ruse. En quelques heures, trois communautés refusent le service. Les faits perdent la course.",
 "v19": "Deux agences revendiquent toutes deux le pilotage de la réponse. Les gens qui attendent de l'aide se moquent de savoir qui pilote ; ce qui leur importe, c'est que quelqu'un le fasse.",
 "v20": "Un bailleur appelle : le financement est « en cours de révision ». Vous le traduisez doucement pour l'équipe. Puis vous commencez à bâtir le dossier pour le ramener.",
 "v21": "Une jeune volontaire cartographie chaque foyer inondé à moto en une journée. Son tableur devient la source de vérité unique de l'opération.",
 "v22": "L'homologue gouvernemental prend un risque politique pour garder un poste-frontière ouvert à l'aide. Cela lui coûte. Vous veillez à ce que son ministère en reçoive le mérite.",
 "v23": "Au plus fort de la crise, un responsable logistique trouve un entrepôt dont tout le monde avait oublié l'existence. Il est rempli d'exactement ce qu'il faut.",
 "v24": "Une vidéo de désinformation a un million de vues. Une infirmière enregistre une réponse de soixante secondes sur son téléphone. C'est moins léché. C'est bien plus digne de confiance.",
 "v25": "Des fournitures sont bloquées au port à cause d'un tampon. Un seul coup de fil entre deux personnes qui se font confiance les fait bouger avant la nuit.",
 "v26": "Une équipe épuisée veut travailler tout le week-end. Vous en renvoyez la moitié chez elle. L'épuisement professionnel est une crise que vous pouvez prévenir.",
 "v27": "Le dessin de la crue par un enfant est épinglé dans la salle des opérations. Personne ne le décroche. Il garde les chiffres honnêtes.",
 "v28": "Le système d'alerte précoce que vous avez financé au dernier acte envoie une alerte trois jours avant le prochain choc. Trois jours, c'est tout.",
 "v29": "Un chef religieux annonce du haut de la chaire que la clinique est sûre. Les files reviennent le lendemain matin. Aucune campagne n'aurait pu le faire plus vite.",
 "v30": "Une agence veut lancer un nouvel outil tape-à-l'œil en pleine crise. Vous posez la seule question qui l'arrête : « Est-ce que ça marche hors ligne, ici, aujourd'hui ? »",
 "v31": "La presse veut un coupable. Vous lui offrez plutôt un système, et un plan pour le réparer. C'est une histoire moins satisfaisante et plus vraie.",
 "v32": "Le pilote de l'Acte I est passé à douze districts. Une ministre l'appelle désormais « notre programme », et non « celui de l'ONU ». Cette phrase est l'objectif.",
 "v33": "Un fonds commun pour lequel vous vous êtes battu laisse enfin le gouvernement, et non le bailleur le plus bruyant, fixer les priorités. La salle a une autre atmosphère.",
 "v34": "Deux ONG rivales acceptent de partager leurs données pour la première fois. Il a fallu dix-huit mois et un déjeuner très, très long.",
 "v35": "L'idée d'une jeune entrepreneuse, jadis rejetée, figure désormais au budget national. Elle est dans la salle quand il est adopté. Elle a vingt-quatre ans.",
 "v36": "Une alliance que vous avez bâtie tient bon sous une pression politique qui l'aurait brisée un an plus tôt. La confiance, il s'avère, fait boule de neige.",
 "v37": "Un nouveau choc frappe, mais cette fois le plan existe déjà, signé, avec l'argent convenu d'avance. Vous exécutez au lieu de débattre.",
 "v38": "Un bailleur propose une grosse subvention assortie de conditions qui diviseraient l'équipe. Toute la table, ensemble, dit un non poli. Vous n'avez pas eu à le dire seul.",
 "v39": "Le tableau de bord que vous avez lancé est désormais projeté sur le mur de la salle du conseil des ministres. Les ministres débattent de la réalité, pas de savoir qui a les bons chiffres.",
 "v40": "Une communauté qui refusait jadis le programme le gère désormais elle-même. Votre rôle s'est discrètement réduit à de l'encouragement. C'est cela, la réussite.",
 "v41": "Un système interopérable fait que les dossiers d'une famille déplacée la suivent à travers trois districts. Elle s'enregistre une fois, pas trois.",
 "v42": "Le conseil de la jeunesse présente devant le conseil des ministres. Ils sont nerveux, préparés et imparables. Deux politiques changent cet après-midi-là.",
 "v43": "Un atelier de prospective que vous avez mené l'an dernier avait nommé ce scénario exact. Relire les vieilles notes ressemble à une lettre d'un soi passé plus sage.",
 "v44": "Une entreprise privée et une agence pour les réfugiés co-conçoivent un système de paiement. Aucune n'aurait pu le bâtir seule ; ensemble, il atteint tout le monde.",
 "v45": "Une évaluation paraît avec des conclusions difficiles. Vous la publiez intégralement. Un rival s'en sert contre vous une semaine ; les partenaires vous font confiance pour des années.",
 "v46": "Le statisticien du gouvernement de l'Acte I dirige désormais une équipe de trente personnes. Les données sont à jour. L'enquête suivante est déjà financée.",
 "v47": "La coordonnatrice d'un pays voisin vous appelle pour un conseil sur un problème que vous avez résolu. Vous envoyez les notes, et les erreurs, sans rien retenir.",
 "v48": "Votre mandat se compte désormais en semaines. La question passe de « que pouvons-nous faire » à « qu'est-ce qui tiendra après notre départ ».",
 "v49": "Un jalon dont vous doutiez franchit la ligne. L'équipe est trop fatiguée pour célébrer comme il faut, alors elle reste simplement assise ensemble, tranquillement fière.",
 "v50": "La ministre qui disait « montrez-m'en un qui survit à la saison sèche » vous serre la main. Elle ne dit pas qu'il a survécu. Elle n'a pas à le dire.",
 "v51": "Vous transmettez à votre successeur la question du tableau blanc : « Qui passe à travers les mailles ? » La liste est plus courte qu'à votre arrivée. Pas vide. Plus courte.",
 "v52": "Une clinique inondée à l'Acte II rouvre, reconstruite sur un terrain plus élevé, là où les vieux repères de crue de l'ancien disaient qu'elle devait être.",
 "v53": "Le jeune codeur de l'Acte I conseille désormais le ministère qu'il ne pouvait jadis pas joindre. Son appli de lampadaires est devenue politique nationale.",
 "v54": "Une dernière réunion de coordination. Onze agences, plus aucun sigle inexpliqué, une seule carte partagée épinglée bien droite au mur.",
 "v55": "Le fonds commun survit à votre mandat, à votre ligne budgétaire et sans doute à votre souvenir dans la capitale. C'est exactement comme il se doit.",
 "v56": "Un bailleur qui posait jadis des conditions finance désormais le plan conjoint, sans conditions. « Vous l'avez mérité », dit-elle. Vous l'avez mérité ensemble.",
 "v57": "Un village que vous aviez noté le premier jour, à l'aéroport, dispose enfin d'une pompe à eau qui fonctionne et d'une clinique qui ouvre à l'heure.",
 "v58": "Votre successeur arrive : équipe à moitié formée, cent partenaires qui observent. Vous lui dites ce que quelqu'un aurait dû vous dire : bâtissez la table d'abord.",
 "v59": "Au pot d'adieu, l'infirmière de district de l'Acte I est là. Son registre papier a disparu. Le système de la capitale compte enfin chaque bébé.",
 "v60": "La sirène d'alerte précoce est testée dans les temps. Plus personne ne sursaute. On vérifie juste son téléphone, on hoche la tête et on continue. La préparation est devenue routine.",
 "v61": "Un journaliste demande ce dont vous êtes le plus fier. Vous citez un programme qui ne porte plus votre logo nulle part. C'est celui-là.",
 "v62": "La dernière vignette de votre mandat s'écrit dans le travail des autres : les volontaires, les ministres, les codeurs, les infirmières, qui continuent.",
 "v63": "Vous quittez Sahélia comme on devrait quitter tout lieu qu'on a servi : un peu plus fort, un peu plus juste, et tout à fait capable de se passer de vous.",
 "rf0": "Coordonner n'est pas contrôler. Le CR dirige en réunissant, pas en commandant.",
 "rf1": "Les données avant l'action : on ne peut pas servir les gens qu'on ne voit pas.",
 "rf2": "La confiance se dépense lentement et se perd vite. Gardez-la.",
 "rf3": "Le chemin le plus rapide laisse souvent quelqu'un de côté. Vérifiez qui.",
 "rf4": "Un plan partagé vaut mieux que cinq plans séparés et brillants.",
 "rf5": "La prospective est la réponse à la crise la moins chère qui soit.",
 "rf6": "La capacité locale est la seule qui reste après le départ de la mission.",
 "rf7": "Le changement de comportement vaut mieux que de nouveaux bâtiments quand la confiance est le goulot d'étranglement.",
 "rf8": "Le financement commun laisse le pays tenir la barre au lieu du bailleur le plus bruyant.",
 "rf9": "La transparence pique pendant une semaine et rapporte pendant des années.",
 "rf10": "Les gens les plus proches d'un problème détiennent d'ordinaire la solution la moins chère.",
 "rf11": "Le plaidoyer conjoint protège chaque agence de se retrouver seule.",
 "rf12": "Le rôle d'un pilote, ce sont des preuves, pas de l'espoir, et l'échelle est un combat à part.",
 "rf13": "L'inclusion n'est pas une politesse ; c'est ainsi que les plans survivent au contact de la réalité.",
 "rf14": "Le mérite partagé est de la coordination gagnée.",
 "rf15": "La résilience, c'est un secours qu'on ne paie qu'une fois.",
 "rf16": "La désinformation voyage plus vite que les faits : semez donc les faits tôt.",
 "rf17": "Protégez l'énergie de votre équipe ; l'épuisement professionnel est une crise évitable.",
 "rf18": "Le meilleur héritage ne porte aucun logo.",
 "rf19": "Ne laisser personne de côté est une ligne budgétaire, pas un slogan.",
 "ai1": "Vous descendez de l'avion dans la chaleur sèche de Sahélia. Le Cadre de coopération est signé, l'équipe à moitié formée, et cent partenaires observent pour voir qui vous êtes. Cartographiez les besoins. Gagnez le premier oui.",
 "ai2": "La lune de miel s'achève. Un choc révèle si toutes ces poignées de main étaient une vraie coordination ou de simples bonnes manières. Le pays observe comment vous portez la pression.",
 "ai3": "Les graines que vous avez plantées sont prêtes à fleurir, ou à faner. Gros paris, alliances fragiles et arbitrages les plus durs de votre mandat arrivent ensemble.",
 "ai4": "Votre mandat touche à sa fin. Tout est désormais affaire d'héritage : quels jalons vous achevez, la confiance de qui vous gardez, et ce que Sahélia pourra porter sans vous.",
 "ai.crisis": "Les crises s'accumulaient, alors j'ai agi pour stabiliser la réponse.",
 "ai.trustLow": "La confiance devenait dangereusement basse, alors la reconstruire passe en premier.",
 "ai.funding": "Le déficit de financement se creusait, alors j'ai mobilisé des ressources.",
 "ai.coordination": "Il nous fallait de la coordination pour débloquer le travail conjoint, alors j'ai réuni les partenaires.",
 "ai.weakest": "Notre priorité la plus faible était {pillar}, alors j'y ai investi.",
 "ai.milestone": "Cette poussée pourrait achever le jalon {pillar}.",
 "ai.default": "C'était le coup le plus efficace dont je disposais.",
 "ai.partner": "J'ai amené {partner} à la table pour renforcer notre priorité la plus faible.",
 "ai.done": "{name} est terminé.",
 "ai.ab.gov": "La confiance avait besoin d'un coup de pouce, alors j'ai débloqué une politique nationale.",
 "ai.ab.comms": "J'ai contré le récit pour protéger la confiance du public.",
 "ai.ab.hro": "J'ai protégé les plus vulnérables du prochain choc.",
 "ai.ab.donor": "Les fonds manquaient, alors j'ai injecté de l'argent frais.",
 "ai.ab.logops": "J'ai fluidifié les coûts pour étirer notre budget.",
 "ai.ab.chw": "J'ai converti des données disponibles en confiance communautaire.",
 "ai.ab.foresight": "J'ai scruté l'horizon pour réordonner ce qui s'annonce.",
 "ai.ab.dmo": "Je me suis appuyé sur les données pour voir clairement le prochain événement.",
 "ai.ab.rc": "J'ai aligné l'équipe pour amplifier le coup suivant.",
 "ai.ab.generic": "J'ai utilisé ma force de prédilection tant qu'elle comptait.",
 "sugg.crisis": "Les crises s'empilent. {card} allégerait la pression.",
 "sugg.trust": "La confiance est basse. {card} la reconstruit.",
 "sugg.weakest": "Votre priorité la plus faible est {pillar}. {card} la fait avancer.",
 "sugg.build": "Constituez des ressources ou réunissez des partenaires pour préparer un coup plus ambitieux le mois prochain.",
 "summ.trustStrong": "La confiance est solide.",
 "summ.trustHold": "La confiance tient, mais surveillez-la.",
 "summ.trustFragile": "La confiance est fragile.",
 "summ.crisesNone": "Aucune crise active.",
 "summ.crisesOne": "1 crise active.",
 "summ.crisesMany": "{n} crises actives.",
 "summ.milestones": "{n}/5 jalons atteints.",
 "abmsg.rc": "Aligner : +2 Coordination, et votre prochaine action gagne un bonus de synergie.",
 "abmsg.dmo": "Lucidité : +3 Données, et le prochain événement est révélé.",
 "abmsg.hro": "Bouclier : le coup de Confiance du prochain événement néfaste est réduit de moitié.",
 "abmsg.ngo": "Portée : le coût de Financement de votre prochaine action est annulé.",
 "abmsg.gov": "Mandat : +5 Confiance nationale.",
 "abmsg.donor": "Injecter : +5 Financement ; {pillar} rapporte double ce tour-ci.",
 "abmsg.youth": "Amplifier : votre prochaine action comportementale est doublée.",
 "abmsg.innolabWin": "Expérience réussie : +16 Innovation !",
 "abmsg.innolabLose": "Revers d'expérience : -3 Confiance. Ça arrive.",
 "abmsg.foresight": "Horizon : observez les deux prochains événements et réordonnez-les.",
 "abmsg.comms": "Contre-récit : désinformation neutralisée, +3 Confiance.",
 "abmsg.logops": "Fluidifier : vos deux prochaines actions coûtent 1 Financement de moins.",
 "abmsg.chw": "Soin : {n} Données converties en {m} Confiance{bonus}.",
 "abmsg.chwBonus": " (bonus crise sanitaire !)",
 "log.alignSynergy": "Synergie Aligner appliquée (+5 de progression, +1 Confiance).",
 "log.amplify": "Amplifier : effet comportemental doublé.",
 "log.synergy": "Synergie de {partner} appliquée à {card}.",
 "log.crisesCost": "Les crises actives coûtent {n} Confiance.",
 "log.milestone": "Jalon atteint : {name}",
 "log.termEnded": "Mandat terminé : {tier}",
 "style.led": "Vous avez mené avec {pillars}. ",
 "style.under": "Vous avez sous-utilisé {pillar}, un levier encore disponible sur la table.",
 "style.balanced": "Vous avez équilibré les cinq piliers du Quintette, la marque d'un véritable coordinateur.",
 "style.and": "et",
 "howto.goal": "Objectif : aider Sahélia à atteindre ses cinq jalons nationaux (un par stratégie UN 2.0) tout en maintenant la Confiance au-dessus de la ligne d'effondrement, avant la fin de votre mandat réparti sur quatre Actes.",
 "howto.s1": "Briefing et Événement : une histoire de terrain plante le décor, puis le monde agit, avec un choc, une ouverture ou un choix difficile.",
 "howto.s2": "Votre tour : dépensez de la Capacité pour jouer des cartes Action. Chacune fait avancer un pilier, modifie la Confiance ou constitue des ressources. Les cartes Partenariat dopent votre prochaine action assortie. Utilisez la capacité de votre rôle une fois par mois.",
 "howto.s3": "Résolution : les crises coûtent de la Confiance jusqu'à leur résolution. Remplissez un pilier à 100 % pour achever un Jalon.",
 "howto.res": "Ressources : la Confiance (la méta-monnaie), le Financement, la Coordination, les Données et la Capacité.",
 "howto.strat": "Les cinq stratégies (le Quintette du changement) : Données, Numérique, Innovation, Prospective, Sciences comportementales. Équilibrez-les ; en accumuler une seule n'est jamais optimal.",
 "howto.tiers": "Niveaux de victoire : le bronze évite l'effondrement ; l'argent atteint trois jalons ; l'or atteint les cinq avec une forte confiance.",
 "credits.intro": "Common Ground : un jeu de cartes stratégique sur la coordination de terrain de l'ONU, conçu pour le Quintette du changement UN 2.0.",
 "credits.l1": "Conception et code : projet Common Ground.",
 "credits.l2": "Musique et son : originaux, synthétisés de façon procédurale dans le navigateur (Web Audio API), libres de droits.",
 "credits.l3": "Graphismes : CSS, SVG et emoji système. Aucune ressource externe.",
 "credits.l4": "Cadre : Sahélia est fictive et composite. Toute ressemblance avec une nation réelle est fortuite.",
 "credits.l5": "Narration IA optionnelle : Anthropic Messages API (claude-sonnet-4-6), uniquement si vous fournissez votre propre clé.",
 "tut.0.title": "Bienvenue, Coordinateur",
 "tut.0.body": "Vous êtes la Coordonnatrice résidente en Sahélia. Vous n'avez aucune autorité de commandement ; votre pouvoir est d'aligner les personnes, les données et les ressources. Apprenons en faisant.",
 "tut.1.title": "La confiance est tout",
 "tut.1.body": "Surveillez la jauge de Confiance en haut. Elle conditionne vos plus grands coups. Si elle tombe à zéro, votre mandat s'achève. Bâtissez-la par des visites communautaires, le dialogue et l'honnêteté.",
 "tut.2.title": "Les cinq stratégies",
 "tut.2.body": "Chaque jalon national correspond à une stratégie UN 2.0 : Données, Numérique, Innovation, Prospective, Sciences comportementales. Remplissez un pilier à 100 % pour achever son jalon. Équilibrez les cinq.",
 "tut.3.title": "Jouer, puis réagir",
 "tut.3.body": "Dépensez de la Capacité pour jouer des cartes Action. Utilisez la capacité de votre rôle une fois par mois. Le monde lance des chocs et des ouvertures ; coordonnez sous pression. Prêt ?",
 "ui.aiTag": "IA",
 "ui.milestoneReached": "Jalon atteint !",
 "ui.narration": "Narration (lue à voix haute)",
 "ui.speak": "Lire à voix haute",
 "ui.stop": "Arrêter",
 "ui.shock": "Choc",
 "ui.opening": "Ouverture",
 "ui.dilemma": "Dilemme",
 "log.reroll": "Vous avez tenté votre chance : 1 Données dépensé pour relancer.",
 "ui.synergyReady": "synergie prête pour votre prochaine action correspondante.",
 "ui.directEffort": "Orientez cet effort conjoint vers...",
 "ui.tip": "Conseil",
 "dice.roll": "Jet de réalisation",
 "dice.crit": "Réalisation critique !",
 "dice.solid": "Réalisation solide",
 "dice.partial": "Réalisation partielle",
 "dice.setback": "Revers",
 "dice.pressLuck": "Tentez votre chance : relancez pour 1 Données",
 "dice.keep": "Conserver le résultat",
 "dice.bonus": "bonus de probabilité",
 "dice.fortuneTitle": "Fortune du mois",
 "fortune.1.name": "Vent contraire",
 "fortune.1.desc": "Mois difficile : les chocs frappent un peu plus fort.",
 "fortune.2.name": "Eaux calmes",
 "fortune.2.desc": "Un mois stable. Faites-en bon usage.",
 "fortune.3.name": "Éclaircie",
 "fortune.3.desc": "Les bonnes nouvelles circulent : +1 Données.",
 "fortune.4.name": "Vent favorable",
 "fortune.4.desc": "Le vent est avec vous : +1 à chaque jet de réalisation.",
 "fortune.5.name": "Aubaine",
 "fortune.5.desc": "Un coup de pouce inattendu : +2 Financement.",
 "fortune.6.name": "Élan",
 "fortune.6.desc": "Sur une bonne lancée : votre première action est un critique garanti.",
 "praise.0": "Brillant. C'était parfaitement exécuté.",
 "praise.1": "Toute l'équipe est en feu aujourd'hui.",
 "praise.2": "Coordination exemplaire. Sahélia l'a remarqué.",
 "praise.3": "Voilà comment on obtient des résultats.",
 "praise.4": "Remarquable. Le terrain s'en souviendra.",
 "tease.0": "Un jour sans. Même les meilleurs en ont.",
 "tease.1": "La réalité a résisté cette fois.",
 "tease.2": "Pas votre meilleur moment, mais vous avez tenu bon.",
 "tease.3": "Le terrain avait d'autres plans. Reprenez-vous.",
 "tease.4": "Réalisation chaotique. Demain est un autre mois.",
 "tip.0": "Conseil : investissez tôt dans les Données. Elles paient les relances et améliorent vos probabilités de réalisation.",
 "tip.1": "Conseil : faites passer la Prospective au-dessus de la moitié et chaque action sera un peu plus chanceuse.",
 "tip.2": "Conseil : jouez un Partenariat juste avant une action correspondante pour la dynamiser.",
 "tip.3": "Conseil : utilisez les actions de renforcement de la Confiance quand les crises menacent. La Confiance est votre bouée de sauvetage.",
 "tip.4": "Conseil : équilibrez les cinq piliers. Accumuler un seul est rarement la voie la plus rapide vers l'or.",
 "tip.5": "Conseil : un Critique (un 6 au lancer) donne 145 % d'effet et un point d'Impact supplémentaire.",
 "tip.6": "Conseil : réunissez les partenaires pour engranger de la Coordination, puis lancez un Programme conjoint.",
 "tip.7": "Conseil : quand un dé tombe sur 1, relancez avec les Données si l'action compte vraiment.",
 "tip.8": "Conseil : utilisez la capacité de votre rôle chaque mois. Elle est gratuite et souvent décisive.",
 "tip.9": "Conseil : réglez les crises rapidement. Chaque crise active draine la Confiance chaque mois."
};
})();
