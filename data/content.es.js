(function(){var CG=(window.CG=window.CG||{});CG.CONTENT=CG.CONTENT||{};
CG.CONTENT.es={
 "rc": {
  "name": "Coordinador Residente",
  "desc": "El nexo del equipo. Sin órdenes, solo influencia.",
  "ab": "Alinear",
  "abd": "Una vez por ronda: otorga +2 Coordinación y una bonificación de sinergia a la siguiente acción jugada."
 },
 "dmo": {
  "name": "Responsable de Gestión de Datos",
  "desc": "Convierte cifras en decisiones.",
  "ab": "Perspicacia",
  "abd": "Una vez por ronda: gana +3 Datos y revela la carta de Evento superior antes de que golpee."
 },
 "hro": {
  "name": "Responsable de Derechos Humanos",
  "desc": "No deja a nadie atrás.",
  "ab": "Escudo",
  "abd": "Una vez por ronda: reduce a la mitad el daño a la Confianza del siguiente Evento dañino y protege a los grupos vulnerables."
 },
 "ngo": {
  "name": "Socio de ONG",
  "desc": "Ágil, cerca de las comunidades.",
  "ab": "Alcance",
  "abd": "Una vez por ronda: juega una carta de Acción con su coste de Financiación exonerado."
 },
 "gov": {
  "name": "Contraparte Gubernamental",
  "desc": "Posee el mandato.",
  "ab": "Mandato",
  "abd": "Una vez por ronda: desbloquea una política nacional, +5 Confianza para todo el país."
 },
 "donor": {
  "name": "Representante de Donante",
  "desc": "Aporta el dinero, con condiciones.",
  "ab": "Inyectar",
  "abd": "Una vez por ronda: inyecta +5 Financiación, pero fija un pilar prioritario que rinde el doble esta ronda."
 },
 "youth": {
  "name": "Líder Juvenil",
  "desc": "Energía y alcance.",
  "ab": "Amplificar",
  "abd": "Una vez por ronda: duplica el efecto de la siguiente acción de Ciencia del Comportamiento."
 },
 "innolab": {
  "name": "Responsable de Laboratorio de Innovación",
  "desc": "Pone a prueba ideas audaces.",
  "ab": "Experimentar",
  "abd": "Una vez por ronda: realiza un experimento de alto riesgo, gran ganancia de Innovación, o un pequeño contratiempo."
 },
 "foresight": {
  "name": "Analista de Prospectiva",
  "desc": "Lee el horizonte.",
  "ab": "Horizonte",
  "abd": "Una vez por ronda: echa un vistazo a las dos cartas de Evento superiores y reordénalas."
 },
 "comms": {
  "name": "Responsable de Comunicación",
  "desc": "Da forma al relato.",
  "ab": "Contrarrelato",
  "abd": "Una vez por ronda: neutraliza un Evento de desinformación y gana +3 Confianza."
 },
 "logops": {
  "name": "Responsable de Logística y Operaciones",
  "desc": "Hace real la entrega.",
  "ab": "Optimizar",
  "abd": "Una vez por ronda: reduce el coste de tus siguientes dos acciones en 1 de Financiación cada una."
 },
 "chw": {
  "name": "Agente de Salud Comunitaria",
  "desc": "Confianza sobre el terreno.",
  "ab": "Cuidar",
  "abd": "Una vez por ronda: convierte hasta 3 Datos en Confianza (1:1), duplicado durante una crisis sanitaria."
 },
 "jna": {
  "name": "Evaluación Conjunta de Necesidades",
  "fl": "Cuenta a quién se deja fuera antes de decidir a quién llegar.",
  "fn": "Una evaluación compartida evita que seis agencias encuesten la misma aldea seis veces."
 },
 "datamission": {
  "name": "Misión de Datos",
  "fl": "Envía al equipo donde los mapas se quedan en blanco.",
  "fn": "Los datos de campo superan a una conjetura hecha en la capital, siempre."
 },
 "dashboard": {
  "name": "Panel de Datos Abiertos",
  "fl": "Cuando todos ven las mismas cifras, las disputas se reducen.",
  "fn": "Los paneles abiertos convierten el acaparamiento de datos en una conciencia situacional compartida."
 },
 "survey": {
  "name": "Encuesta de Hogares",
  "fl": "Llama a las puertas que las estadísticas olvidaron.",
  "fn": "Los datos desglosados son la forma en que 'no dejar a nadie atrás' deja de ser un eslogan."
 },
 "census": {
  "name": "Fortalecimiento de Capacidad Estadística",
  "fl": "Enseña al sistema a contarse a sí mismo.",
  "fn": "Fortalecer una oficina nacional de estadística perdura más que cualquier proyecto aislado."
 },
 "geodata": {
  "name": "Cartografía Geoespacial de Riesgos",
  "fl": "Las capas de mapas revelan a las personas en los vacíos.",
  "fn": "Los satélites muestran dónde acaba el camino y empieza la necesidad."
 },
 "datagov": {
  "name": "Pacto de Gobernanza de Datos",
  "fl": "Las reglas para los datos hacen que la gente esté dispuesta a compartirlos.",
  "fn": "La privacidad y la protección no son burocracia, son la razón por la que la gente te confía su información."
 },
 "digiservice": {
  "name": "Lanzar Servicio Digital",
  "fl": "Una cita en la clínica reservada desde un teléfono en una aldea.",
  "fn": "Los servicios públicos digitales llegan a personas que la oficina más cercana nunca pudo."
 },
 "connectivity": {
  "name": "Proyecto de Conectividad",
  "fl": "Señal donde había silencio.",
  "fn": "Sin conectividad, cualquier otro plan digital es un dibujo."
 },
 "interop": {
  "name": "Plataforma Interoperable",
  "fl": "Sistemas que por fin se hablan entre sí.",
  "fn": "La interoperabilidad significa que el registro de un refugiado lo acompaña, y no al revés."
 },
 "digiid": {
  "name": "Identidad Digital para Servicios",
  "fl": "Prueba de que existes, para que el sistema pueda incluirte.",
  "fn": "Bien hecha, la identidad digital desbloquea servicios; mal hecha, excluye: el diseño importa."
 },
 "egov": {
  "name": "Portal de Gobierno Electrónico",
  "fl": "Una ventanilla para un ciudadano, en lugar de diez colas.",
  "fn": "Eliminar la cola también elimina la oportunidad de un soborno."
 },
 "cyberhygiene": {
  "name": "Simulacro de Ciberresiliencia",
  "fl": "Practica el mal día antes de que llegue.",
  "fn": "Una plataforma de la que la gente depende es infraestructura crítica: protégela como tal."
 },
 "pilotlab": {
  "name": "Laboratorio Piloto",
  "fl": "Pruébalo en pequeño, aprende rápido, falla barato.",
  "fn": "El trabajo de un piloto es producir evidencia, no solo esperanza."
 },
 "scaleup": {
  "name": "Ampliación a Escala",
  "fl": "El piloto funcionó. Ahora llega a un millón.",
  "fn": "La mayoría de los buenos pilotos mueren en la brecha entre la prueba y la escala: cuida esa brecha."
 },
 "challengefund": {
  "name": "Fondo de Desafíos",
  "fl": "Plantea el problema; deja que gane la mejor idea.",
  "fn": "Los desafíos abiertos hacen aflorar a solucionadores que nunca habrías contratado."
 },
 "socialent": {
  "name": "Respaldar una Empresa Social",
  "fl": "Un negocio local que resuelve un problema local.",
  "fn": "El impacto sostenible suele vestirse con la ropa de una pequeña empresa."
 },
 "frontier": {
  "name": "Ensayo de Tecnología de Frontera",
  "fl": "Cuidadoso, curioso, con los ojos abiertos.",
  "fn": "Las herramientas nuevas se prueban frente al problema, no se adoptan por el folleto."
 },
 "youthhack": {
  "name": "Maratón de Innovación Juvenil",
  "fl": "Cuarenta y ocho horas, cien mentes jóvenes.",
  "fn": "Quienes están más cerca de un problema suelen tener la solución más barata."
 },
 "scenario": {
  "name": "Taller de Escenarios",
  "fl": "Ensaya tres futuros para que ninguno te sorprenda.",
  "fn": "La prospectiva es más barata que la crisis que ayuda a evitar."
 },
 "ews": {
  "name": "Sistema de Alerta Temprana",
  "fl": "Unos pocos días de aviso pueden salvar una temporada.",
  "fn": "La alerta temprana solo funciona si llega a la última aldea, no solo a la capital."
 },
 "riskmap": {
  "name": "Mapa Nacional de Riesgos",
  "fl": "Nombra las amenazas antes de que se presenten solas.",
  "fn": "Un mapa de riesgos compartido convierte el 'alguien debería haberlo sabido' en 'lo teníamos previsto'."
 },
 "anticipatory": {
  "name": "Plan de Acción Anticipatoria",
  "fl": "Dinero pactado de antemano, disparadores pactados de antemano, sin debate cuando llega la tormenta.",
  "fn": "Actuar antes de un desastre cuesta una fracción de limpiar después de uno."
 },
 "horizonscan": {
  "name": "Escaneo del Horizonte",
  "fl": "Vigila los bordes, no solo los titulares.",
  "fn": "Las señales débiles de hoy son las portadas de mañana."
 },
 "stresstest": {
  "name": "Prueba de Estrés del Plan",
  "fl": "Rompe el plan sobre el papel antes de que lo haga la realidad.",
  "fn": "Los planes resilientes son los que ya sobrevivieron a un peor día imaginado."
 },
 "nudge": {
  "name": "Campaña de Incentivos Sutiles",
  "fl": "Haz que la opción saludable sea la opción fácil.",
  "fn": "Un mensaje de recordatorio en el momento justo puede superar a una clínica nueva."
 },
 "dialogue": {
  "name": "Diálogo Comunitario",
  "fl": "Escucha primero. Las decisiones aterrizan mejor cuando se escucha a la gente.",
  "fn": "Las comunidades apoyan lo que ayudan a diseñar."
 },
 "trustvisit": {
  "name": "Visita para Generar Confianza",
  "fl": "Preséntate donde no llegan las cámaras.",
  "fn": "La confianza se construye en persona y se pierde en comunicados de prensa."
 },
 "rumour": {
  "name": "Seguimiento de Rumores",
  "fl": "Oye el susurro antes de que se vuelva un grito.",
  "fn": "En un brote, el rumor se propaga más rápido que el virus: rastrea ambos."
 },
 "incentives": {
  "name": "Incentivos de Comportamiento",
  "fl": "Una recompensa pequeña y bien sincronizada cambia un hábito.",
  "fn": "El apoyo condicionado puede elevar tanto la asistencia como la dignidad cuando se diseña con la gente."
 },
 "inclusioncircle": {
  "name": "Círculo de Inclusión",
  "fl": "Lleva a los pocas veces consultados al frente de la sala.",
  "fn": "Nada sobre nosotros sin nosotros: diseña con las personas más afectadas."
 },
 "convene": {
  "name": "Convocar a Socios",
  "fl": "Reúne a todos en una sala y deja que la agenda haga el trabajo.",
  "fn": "El superpoder del CR es la mesa misma: quién se sienta a ella, y por qué."
 },
 "jointprog": {
  "name": "Programa Conjunto",
  "fl": "Varias agencias, un plan, una sola partida presupuestaria.",
  "fn": "Los programas conjuntos cambian un poco de autonomía por mucho impacto."
 },
 "pooledfund": {
  "name": "Fondo Común",
  "fl": "Dinero compartido, prioridades acordadas, menos duplicación.",
  "fn": "Un fondo común permite que el país dirija, no solo el donante más ruidoso."
 },
 "clusterlead": {
  "name": "Activar Grupos de Coordinación",
  "fl": "En una crisis, la estructura es un acto de misericordia.",
  "fn": "Roles de coordinación claros en una emergencia salvan los días que salvan vidas."
 },
 "advocacy": {
  "name": "Incidencia Conjunta",
  "fl": "Una sola voz de la ONU llega más lejos que diez.",
  "fn": "Hablar juntos protege a cada agencia de hablar sola."
 },
 "localgov": {
  "name": "Fortalecer el Gobierno Local",
  "fl": "La entrega es local o es teórica.",
  "fn": "Las autoridades locales capaces perduran más que cualquier misión de visita."
 },
 "resmob": {
  "name": "Campaña de Movilización de Recursos",
  "fl": "Un buen argumento, bien fundamentado, abre carteras.",
  "fn": "Los donantes financian credibilidad: muestra resultados, no solo necesidad."
 },
 "volunteers": {
  "name": "Movilizar Voluntarios de la ONU",
  "fl": "Manos dispuestas, conocimiento local, alcance real.",
  "fn": "Los voluntarios no son mano de obra gratuita, son la confianza comunitaria hecha visible."
 },
 "south": {
  "name": "Intercambio Sur-Sur",
  "fl": "Un vecino que resolvió esto el año pasado es el mejor consultor.",
  "fn": "El aprendizaje entre pares de distintos países supera a importar una plantilla lejana."
 },
 "monitoring": {
  "name": "Visita de Monitoreo Conjunto",
  "fl": "Ve y observa. Luego ve y arregla.",
  "fn": "Lo que se monitorea juntos se mejora juntos."
 },
 "humdev": {
  "name": "Puente Humanitario y de Desarrollo",
  "fl": "Socorro hoy, resiliencia mañana: planifica para ambos a la vez.",
  "fn": "El nexo significa no reconstruir el mismo muro cada temporada de inundaciones."
 },
 "children": {
  "name": "Agencia para la Infancia",
  "arch": "Entidad de la ONU",
  "fl": "Cada plan, visto a través de los ojos de un niño.",
  "fn": "Los niños son el 100% del futuro y los primeros en sentir una crisis."
 },
 "food": {
  "name": "Agencia de Alimentación",
  "arch": "Entidad de la ONU",
  "fl": "Logística que llega al último kilómetro.",
  "fn": "Cuando golpea el hambre, las cadenas de suministro son la estrategia."
 },
 "health": {
  "name": "Agencia de Salud",
  "arch": "Entidad de la ONU",
  "fl": "Brotes respondidos con evidencia.",
  "fn": "La vigilancia epidemiológica son datos con vidas en juego."
 },
 "refugee": {
  "name": "Agencia para los Refugiados",
  "arch": "Entidad de la ONU",
  "fl": "Protección que viaja con las personas.",
  "fn": "Una identidad registrada es el primer paso de regreso a la inclusión."
 },
 "devagency": {
  "name": "Agencia de Desarrollo",
  "arch": "Entidad de la ONU",
  "fl": "Del piloto a la política nacional.",
  "fn": "El desarrollo es el juego largo jugado en ciclos cortos de financiación."
 },
 "labour": {
  "name": "Agencia del Trabajo",
  "arch": "Entidad de la ONU",
  "fl": "El trabajo decente como la salida de la pobreza.",
  "fn": "El desempleo juvenil resuelto es una generación recuperada."
 },
 "women": {
  "name": "Agencia de Igualdad de Género",
  "arch": "Entidad de la ONU",
  "fl": "La mitad de la población, plenamente contada.",
  "fn": "Los programas ciegos al género no son neutrales, pierden de vista la mitad del panorama."
 },
 "envagency": {
  "name": "Agencia de Medio Ambiente",
  "arch": "Entidad de la ONU",
  "fl": "El clima es el contexto de todo.",
  "fn": "La adaptación ahora es el seguro más barato que puede comprar un país frágil."
 },
 "civsociety": {
  "name": "Coalición de la Sociedad Civil",
  "arch": "Socio",
  "fl": "La conciencia y el alcance de la comunidad.",
  "fn": "La sociedad civil llega donde el Estado no puede y hace las preguntas que él no hará."
 },
 "privatesector": {
  "name": "Alianza del Sector Privado",
  "arch": "Socio",
  "fl": "Capital y capacidad, alineados con los objetivos.",
  "fn": "El sector privado es donde realmente viven la mayoría de los empleos y de la innovación."
 },
 "academia": {
  "name": "Academia y Centros de Estudio",
  "arch": "Socio",
  "fl": "Rigor a demanda.",
  "fn": "La investigación independiente mantiene honesta a la política."
 },
 "ifi": {
  "name": "Institución Financiera Internacional",
  "arch": "Socio",
  "fl": "El gran balance contable en la mesa.",
  "fn": "Alinear los objetivos de la ONU con los préstamos de las IFI multiplica a ambos."
 },
 "media": {
  "name": "Medios Independientes",
  "arch": "Socio",
  "fl": "Hechos, bien contados, a tiempo.",
  "fn": "Una prensa libre es el sistema de alerta temprana de la gobernanza."
 },
 "diaspora": {
  "name": "Red de la Diáspora",
  "arch": "Socio",
  "fl": "Talento y remesas que nunca olvidaron su hogar.",
  "fn": "La inversión de la diáspora a menudo eclipsa la ayuda oficial: canalízala bien."
 },
 "faith": {
  "name": "Redes Religiosas",
  "arch": "Socio",
  "fl": "Voces de confianza en cada aldea.",
  "fn": "Los líderes religiosos pueden llevar un mensaje de salud pública más lejos que cualquier ministerio."
 },
 "youthnet": {
  "name": "Redes Juveniles",
  "arch": "Socio",
  "fl": "Nativos digitales con algo en juego.",
  "fn": "Los jóvenes no son un grupo de interés futuro, son uno presente."
 },
 "m_data": {
  "name": "Sahelia Cuenta a Todos",
  "rw": "Un sistema nacional de datos en vivo guía a cada ministerio."
 },
 "m_digital": {
  "name": "Servicios en Cada Mano",
  "rw": "Los servicios públicos digitales llegan a los distritos más remotos."
 },
 "m_innovation": {
  "name": "Ideas que Escalaron",
  "rw": "Una innovación local se convirtió en política nacional."
 },
 "m_foresight": {
  "name": "Listos para el Próximo Choque",
  "rw": "Los sistemas anticipatorios dan a Sahelia ventaja ante cada amenaza."
 },
 "m_behavioural": {
  "name": "Comunidades al Mando",
  "rw": "Las personas dan forma a los servicios que usan, y confían en ellos."
 },
 "flood": {
  "name": "Inundaciones Repentinas en el Delta",
  "fl": "El río se llevó el camino, la clínica y tres semanas del plan."
 },
 "drought": {
  "name": "Una Temporada de Lluvias Fallida",
  "fl": "El pronóstico acertó. La cosecha será escasa."
 },
 "displacement": {
  "name": "Ola de Desplazamiento",
  "fl": "Doce mil personas llegan a un pueblo construido para tres mil."
 },
 "outbreak": {
  "name": "Brote de Enfermedad",
  "fl": "Los casos se duplican de la noche a la mañana en los distritos del este."
 },
 "fundingcut": {
  "name": "Recorte Repentino de Financiación",
  "fl": "Un donante importante reordena sus prioridades. El déficit recae sobre ti."
 },
 "politension": {
  "name": "Aumenta la Tensión Política",
  "fl": "Una decisión disputada congela la cooperación entre ministerios."
 },
 "supplybreak": {
  "name": "Ruptura de la Cadena de Suministro",
  "fl": "Las medicinas están en la frontera. La frontera está cerrada."
 },
 "cyber": {
  "name": "Incidente Cibernético en una Plataforma Clave",
  "fl": "El portal de prestaciones está caído. La confianza baja con cada mensaje de error."
 },
 "misinfo": {
  "name": "Se Propaga la Desinformación",
  "fl": "Un rumor en una aplicación de mensajería aleja a las familias de la clínica."
 },
 "heatwave": {
  "name": "Ola de Calor Récord",
  "fl": "Las escuelas cierran. La red eléctrica se tensa. Los vulnerables sufren primero."
 },
 "locust": {
  "name": "Plaga de Langostas",
  "fl": "Una nube verde cruza la frontera y los campos quedan pelados."
 },
 "border": {
  "name": "Restricciones Fronterizas",
  "fl": "Nuevos trámites ralentizan cada convoy hasta dejarlo casi parado."
 },
 "staffgap": {
  "name": "Agotamiento en la Oficina de Campo",
  "fl": "Demasiado, durante demasiado tiempo, con muy poca gente."
 },
 "corruption": {
  "name": "Escándalo de Adquisiciones",
  "fl": "Una auditoría encuentra fondos que fueron donde no debían."
 },
 "earthquake": {
  "name": "Terremoto",
  "fl": "Noventa segundos lo cambian todo."
 },
 "currency": {
  "name": "Colapso de la Moneda",
  "fl": "Los precios se duplican; los presupuestos se reducen a la mitad en términos reales."
 },
 "schoolstrike": {
  "name": "Huelga de Docentes",
  "fl": "Las aulas se vacían mientras una disputa salarial se prolonga."
 },
 "dataleak": {
  "name": "Filtración de Datos",
  "fl": "Una hoja de cálculo de beneficiarios acaba en la bandeja de entrada equivocada."
 },
 "donorfatigue": {
  "name": "Fatiga de los Donantes",
  "fl": "La crisis ya no es tendencia. Las promesas de financiación se adelgazan."
 },
 "infrastructure": {
  "name": "Colapso de un Puente",
  "fl": "El único camino al norte desaparece hasta nuevo aviso."
 },
 "protest": {
  "name": "Protestas en la Capital",
  "fl": "La frustración se desborda en las calles; las oficinas cierran por seguridad."
 },
 "famine": {
  "name": "Declarado un Punto Crítico de Hambre",
  "fl": "Las alertas tempranas eran reales. Ahora tienen un nombre."
 },
 "techfail": {
  "name": "Caída de la Plataforma",
  "fl": "El panel del que todos dependían muestra el mundo de ayer."
 },
 "trustdip": {
  "name": "Una Promesa se Resbala",
  "fl": "Un hito incumple su fecha y la gente lo nota."
 },
 "newdonor": {
  "name": "Interés de un Nuevo Donante",
  "fl": "A una fundación le gusta tu evidencia y quiere participar."
 },
 "databreak": {
  "name": "Avance en los Datos",
  "fl": "Un conjunto de datos fusionado revela exactamente a quién se está dejando fuera."
 },
 "pilotwin": {
  "name": "Un Piloto Tiene Éxito",
  "fl": "El pequeño experimento superó sus metas."
 },
 "peace": {
  "name": "Dividendo de Paz",
  "fl": "Un acuerdo local abre caminos y alivia los presupuestos."
 },
 "viral": {
  "name": "Una Campaña se Vuelve Viral",
  "fl": "Un video hecho por jóvenes logra lo que un comunicado de prensa nunca pudo."
 },
 "techgift": {
  "name": "Alianza Tecnológica",
  "fl": "Una empresa dona créditos en la nube y un equipo de ingenieros."
 },
 "champion": {
  "name": "Surge un Defensor en el Gobierno",
  "fl": "Una ministra decide que este es el legado que quiere."
 },
 "volunteerwave": {
  "name": "Los Voluntarios dan un Paso al Frente",
  "fl": "Las comunidades se organizan más rápido de lo que podría cualquier agencia."
 },
 "research": {
  "name": "Aterriza un Estudio Universitario",
  "fl": "Una investigación independiente confirma que el enfoque funciona."
 },
 "remittance": {
  "name": "Inversión de la Diáspora",
  "fl": "Dinero y habilidades fluyen de regreso a casa con un propósito."
 },
 "goodrains": {
  "name": "Las Lluvias Llegan a Tiempo",
  "fl": "Una buena temporada compra un poco de respiro."
 },
 "mediaspot": {
  "name": "Cobertura Mediática Positiva",
  "fl": "Una historia justa y esperanzadora llega a todo el país."
 },
 "pooledwin": {
  "name": "Fondo Común Reabastecido",
  "fl": "Varios donantes acuerdan engrosar el bote compartido."
 },
 "youthcoop": {
  "name": "Una Cooperativa Juvenil Sorprende a Todos",
  "fl": "Cuarenta jóvenes convierten una subvención en doscientos empleos."
 },
 "earlysuccess": {
  "name": "La Alerta Temprana Rinde Frutos",
  "fl": "Como actuaste temprano, la tormenta costó mucho menos."
 },
 "interagency": {
  "name": "Las Agencias se Alinean",
  "fl": "Un plan largamente estancado por fin pasa por todos los escritorios a la vez."
 },
 "d_speedfair": {
  "name": "¿Rápido o Justo?",
  "fl": "La ayuda puede salir mañana hacia los de fácil acceso, o la próxima semana hacia todos.",
  "o": [
   {
    "l": "Avanzar rápido",
    "d": "Victorias rápidas ahora; algunos quedan atrás."
   },
   {
    "l": "Llegar a todos",
    "d": "Más lento, pero no se omite a nadie."
   }
  ]
 },
 "d_donorcondition": {
  "name": "La Condición del Donante",
  "fl": "Se ofrece financiación, si la marcas a su manera y omites el plan conjunto.",
  "o": [
   {
    "l": "Tomar el dinero",
    "d": "+5 Financiación, menos Coordinación y un poco de Confianza."
   },
   {
    "l": "Mantener la postura",
    "d": "Protege el plan conjunto; renuncia a los fondos."
   }
  ]
 },
 "d_dataprivacy": {
  "name": "Datos Útiles, Datos Riesgosos",
  "fl": "Un conjunto de datos rico afinaría la focalización, pero es sensible.",
  "o": [
   {
    "l": "Usarlo con cuidado",
    "d": "Gran ganancia de datos; algo de riesgo de protección."
   },
   {
    "l": "Proteger primero",
    "d": "Conocimiento más lento, confianza más fuerte."
   }
  ]
 },
 "d_localintl": {
  "name": "¿Manos Locales o Velocidad Internacional?",
  "fl": "Un contratista internacional es más rápido; una ONG local construye capacidad duradera.",
  "o": [
   {
    "l": "Contratista internacional",
    "d": "Entrega rápida ahora."
   },
   {
    "l": "ONG local",
    "d": "Más lento, construye confianza y capacidad locales."
   }
  ]
 },
 "d_priority": {
  "name": "Dos Crisis, un Equipo",
  "fl": "El brote sanitario y el campamento de desplazados te necesitan ahora.",
  "o": [
   {
    "l": "La salud primero",
    "d": "Estabilizar el brote."
   },
   {
    "l": "El campamento primero",
    "d": "Dar refugio a los recién desplazados."
   }
  ]
 },
 "d_transparency": {
  "name": "Verdad Incómoda",
  "fl": "Un informe muestra que un programa rindió por debajo de lo esperado. ¿Publicar, o arreglarlo en silencio?",
  "o": [
   {
    "l": "Publicar abiertamente",
    "d": "Escozor a corto plazo, confianza a largo plazo."
   },
   {
    "l": "Arreglarlo en silencio",
    "d": "Evita el titular; arriesga ser descubierto."
   }
  ]
 },
 "d_innovation": {
  "name": "¿Apostar por la Idea Audaz?",
  "fl": "Un enfoque no probado podría adelantar años, o malgastar un trimestre.",
  "o": [
   {
    "l": "Hacer la apuesta",
    "d": "Alto riesgo, alta recompensa."
   },
   {
    "l": "Ir a lo seguro",
    "d": "Progreso modesto y fiable."
   }
  ]
 },
 "d_shortlong": {
  "name": "¿Socorro o Resiliencia?",
  "fl": "Gasta en la necesidad de este mes, o en el sistema que evita la del año que viene.",
  "o": [
   {
    "l": "Cubrir la necesidad ahora",
    "d": "Confianza ahora; riesgo de que se repita."
   },
   {
    "l": "Invertir en resiliencia",
    "d": "Ganancias de prospectiva; requiere paciencia."
   }
  ]
 },
 "d_voice": {
  "name": "¿Quién se Sienta a la Mesa?",
  "fl": "La agenda está llena. ¿Sumas a los representantes de la juventud y la discapacidad, o lo mantienes eficiente?",
  "o": [
   {
    "l": "Ampliar el círculo",
    "d": "Más lento, mucho más legítimo."
   },
   {
    "l": "Mantenerlo reducido",
    "d": "Eficiente, pero más estrecho."
   }
  ]
 },
 "d_attribution": {
  "name": "¿De Quién es la Victoria?",
  "fl": "Un éxito podría ser el titular de una agencia, o el mérito callado de todo el equipo.",
  "o": [
   {
    "l": "Compartir el mérito",
    "d": "Construye coordinación y confianza."
   },
   {
    "l": "Reclamar el protagonismo",
    "d": "Visibilidad ahora, fricción después."
   }
  ]
 },
 "d_security": {
  "name": "Acceso frente a Seguridad",
  "fl": "Un distrito necesitado es también un distrito de riesgo para el personal.",
  "o": [
   {
    "l": "Enviar la misión",
    "d": "Llegar a la gente; aceptar el riesgo."
   },
   {
    "l": "Contenerse",
    "d": "Proteger al personal; la gente espera."
   }
  ]
 },
 "d_pace": {
  "name": "¿Empujar o Dosificar?",
  "fl": "El equipo puede esprintar para alcanzar una meta, o proteger su propia energía.",
  "o": [
   {
    "l": "Esprintar ahora",
    "d": "Progreso ahora, cansancio después."
   },
   {
    "l": "Dosificar al equipo",
    "d": "Recupera capacidad para lo que viene."
   }
  ]
 },
 "stable": {
  "name": "Una Llegada en Calma",
  "desc": "Sahelia está estable. Una rara oportunidad para construir."
 },
 "fragile": {
  "name": "Al Borde",
  "desc": "La confianza es escasa y una crisis ya hierve a fuego lento."
 },
 "flush": {
  "name": "Bien Provisto de Fondos",
  "desc": "Un gran llamamiento tuvo éxito, pero las expectativas son altas."
 },
 "datapoor": {
  "name": "Volando a Ciegas",
  "desc": "La última encuesta tiene años. Los datos son escasos."
 },
 "fractured": {
  "name": "Un Equipo Fracturado",
  "desc": "Los socios desconfían entre sí. La coordinación cuesta mucho lograrla."
 },
 "hopeful": {
  "name": "Un Nuevo Gobierno",
  "desc": "Liderazgo fresco, buena voluntad real, sistemas no probados."
 },
 "country": {
  "name": "Sahelia",
  "blurb": "Una nación compuesta del Sahel y la costa: luminosa, joven y puesta a prueba por choques climáticos, desplazamientos e instituciones frágiles, con un Plan Nacional de Desarrollo y un Marco de Cooperación de la ONU a la altura."
 },
 "v0": "En el aeropuerto, una agente de aduanas reconoce el logo de la ONU y pregunta, en voz baja, si el nuevo programa también llegará a su aldea. Anotas el nombre de la aldea.",
 "v1": "Tu primera reunión de coordinación se alarga. Once agencias, tres siglas que aún no conoces y un único mapa compartido clavado torcido en la pared.",
 "v2": "Una enfermera de distrito te muestra su registro de nacimientos en papel. 'El sistema de la capital dice que tenemos la mitad de estos bebés', dice. Ambas saben cuál es el número verdadero.",
 "v3": "La Ministra de Planificación es cálida pero cauta. 'Hemos tenido muchos marcos', dice. 'Muéstrame uno que sobreviva a la primera temporada seca.'",
 "v4": "Una joven gestiona un quiosco de carga de teléfonos alimentado por un único panel solar. Tiene datos más fiables sobre los precios locales que el ministerio.",
 "v5": "Tres agencias llegan a encuestar el mismo pueblo pesquero en la misma semana. Los pescadores, pacientes, responden las mismas preguntas tres veces.",
 "v6": "En la OCR, la pizarra dice solo: '¿A quién se está dejando fuera?'. Nadie la ha borrado en meses. Es la pregunta correcta.",
 "v7": "Un donante llega en avión por un día, quiere una foto en una escuela y se marcha. La bomba de agua de la escuela lleva un año averiada. Lo anotas.",
 "v8": "Un programador adolescente te muestra una aplicación que creó para reportar farolas rotas. Dos mil personas ya la usan. La ciudad no sabe que existe.",
 "v9": "Un anciano te señala las viejas marcas de inundación en la ribera, pintadas hace décadas. Están más altas que cualquier modelo que predice tu oficina.",
 "v10": "La agencia de alimentación y la agencia para la infancia descubren que han estado comprando los mismos suplementos a distintos proveedores a distintos precios. Todos se ríen, y luego lo arreglan.",
 "v11": "Un líder de la sociedad civil desconfía de ti, y lo dice sin rodeos. Al final de la reunión han acordado una cosa pequeña. Es un comienzo.",
 "v12": "Los comerciantes del mercado te explican cómo un rumor sobre un cambio de moneda vació las tiendas en una mañana. La información, te das cuenta, es infraestructura aquí.",
 "v13": "Un estadístico del gobierno te muestra un hermoso conjunto de datos, con dos años de antigüedad, porque nadie financió la siguiente encuesta.",
 "v14": "En una reunión comunitaria, las mujeres se sientan al fondo hasta que un joven voluntario coloca en silencio las sillas en círculo. La conversación cambia de inmediato.",
 "v15": "Tu conductor, que ha trabajado aquí veinte años, te da la información más útil de la semana, en algún punto entre dos puestos de control.",
 "v16": "La primera crisis real llega a las 4 de la mañana por teléfono. A las 6, la pregunta no es qué pasó, sino quién está hablando con quién.",
 "v17": "Una clínica se inunda hasta las rodillas. Las vacunas se trasladaron a tiempo, porque alguien había ensayado exactamente esta mañana en un taller al que nadie quería asistir.",
 "v18": "Un rumor se propaga en una aplicación de mensajería: el nuevo programa es un engaño. En cuestión de horas, tres comunidades rechazan el servicio. Los hechos van perdiendo la carrera.",
 "v19": "Dos agencias se atribuyen el liderazgo de la respuesta. A la gente que espera ayuda no le importa quién lidera; le importa que alguien lo haga.",
 "v20": "Un donante llama: la financiación está 'bajo revisión'. Se lo traduces al equipo con delicadeza. Luego empiezas a construir el argumento para recuperarla.",
 "v21": "Una joven voluntaria cartografía cada hogar inundado en motocicleta en un solo día. Su hoja de cálculo se convierte en la única fuente de verdad de la operación.",
 "v22": "La contraparte gubernamental asume un riesgo político para mantener abierto un paso fronterizo a la ayuda. Le cuesta caro. Te aseguras de que su ministerio reciba el mérito.",
 "v23": "En el punto álgido de la crisis, un responsable de logística encuentra un almacén que todos habían olvidado que existía. Está lleno de exactamente lo que hace falta.",
 "v24": "Un video de desinformación tiene un millón de visualizaciones. Una enfermera graba una respuesta de sesenta segundos con su teléfono. No es tan pulida. Pero genera mucha más confianza.",
 "v25": "Los suministros están atascados en el puerto por un sello. Una sola llamada entre dos personas que confían una en la otra los mueve antes de que anochezca.",
 "v26": "Un equipo agotado quiere seguir trabajando durante el fin de semana. Mandas a la mitad a casa. El agotamiento es una crisis que puedes prevenir.",
 "v27": "El dibujo de la inundación hecho por un niño está clavado en la sala de operaciones. Nadie lo descuelga. Mantiene honestas las cifras.",
 "v28": "El sistema de alerta temprana que financiaste en el acto anterior envía un aviso tres días antes del siguiente choque. Tres días lo son todo.",
 "v29": "Un líder religioso anuncia desde el púlpito que la clínica es segura. Las colas vuelven a la mañana siguiente. Ninguna campaña podría haberlo logrado más rápido.",
 "v30": "Una agencia quiere lanzar una herramienta nueva y llamativa en plena crisis. Haces la única pregunta que la detiene: '¿Funciona sin conexión, aquí, hoy?'",
 "v31": "La prensa quiere un villano. Le das en cambio un sistema, y un plan para arreglarlo. Es una historia menos satisfactoria y más veraz.",
 "v32": "El piloto del Acto I se ha extendido a doce distritos. Una ministra ahora lo llama 'nuestro programa', no 'el de la ONU'. Esa frase es la meta.",
 "v33": "Un fondo común por el que luchaste por fin permite que el gobierno, y no el donante más ruidoso, fije las prioridades. La sala se siente distinta.",
 "v34": "Dos ONG rivales acuerdan compartir sus datos por primera vez. Costó dieciocho meses y un almuerzo muy largo.",
 "v35": "La idea de una joven emprendedora, antes desdeñada, está ahora en el presupuesto nacional. Ella está en la sala cuando se aprueba. Tiene veinticuatro años.",
 "v36": "Una alianza que construiste resiste firme bajo una presión política que la habría destrozado hace un año. La confianza, resulta, se acumula.",
 "v37": "Llega un nuevo choque, pero esta vez el plan ya existe, firmado, con el dinero pactado de antemano. Ejecutas en vez de discutir.",
 "v38": "Un donante ofrece una gran subvención con condiciones que dividirían al equipo. Toda la mesa, junta, dice un cortés no. No tuviste que decirlo a solas.",
 "v39": "El panel de datos que lanzaste ahora se proyecta en la pared de la sala del gabinete. Los ministros discuten sobre la realidad, no sobre de quién son las cifras correctas.",
 "v40": "Una comunidad que una vez rechazó el programa ahora lo gestiona ella misma. Tu papel se ha reducido en silencio al de dar ánimo. Esto es el éxito.",
 "v41": "Un sistema interoperable hace que los registros de una familia desplazada la sigan a través de tres distritos. Se registran una vez, no tres.",
 "v42": "El consejo juvenil presenta ante el gabinete. Están nerviosos, preparados e irrebatibles. Dos políticas cambian esa tarde.",
 "v43": "Un taller de prospectiva que dirigiste el año pasado nombró exactamente este escenario. Leer las viejas notas se siente como una carta de un yo pasado más sabio.",
 "v44": "Una empresa privada y una agencia para los refugiados codiseñan un sistema de pagos. Ninguna podría haberlo construido sola; juntas llega a todos.",
 "v45": "Una evaluación aterriza con hallazgos duros. La publicas íntegra. Un rival la usa contra ti durante una semana; los socios confían en ti durante años.",
 "v46": "El estadístico del gobierno del Acto I lidera ahora un equipo de treinta. Los datos están al día. La próxima encuesta ya está financiada.",
 "v47": "El coordinador de un país vecino llama para pedir consejo sobre un problema que resolviste. Le envías las notas, y los errores, sin reservas.",
 "v48": "Tu mandato se cuenta ya en semanas. La pregunta pasa de 'qué podemos hacer' a 'qué se sostendrá cuando ya no estemos'.",
 "v49": "Un hito del que dudabas llega a la meta. El equipo está demasiado cansado para celebrarlo bien, así que solo se sientan juntos, calladamente orgullosos.",
 "v50": "La Ministra que dijo 'muéstrame uno que sobreviva a la temporada seca' te estrecha la mano. No dice que sobrevivió. No hace falta.",
 "v51": "Le entregas a tu sucesor la pregunta de la pizarra: '¿A quién se está dejando fuera?'. La lista es más corta que cuando llegaste. No vacía. Más corta.",
 "v52": "Una clínica que se inundó en el Acto II reabre, reconstruida en terreno más alto, donde las viejas marcas de inundación del anciano decían que debía estar.",
 "v53": "El programador adolescente del Acto I ahora asesora al ministerio que antes no podía alcanzar. Su aplicación de farolas es política nacional.",
 "v54": "Una última reunión de coordinación. Once agencias, ninguna sigla sin explicar, un único mapa compartido clavado recto en la pared.",
 "v55": "El fondo común sobrevive a tu mandato, a tu partida presupuestaria y probablemente a tu recuerdo en la capital. Es exactamente como debe ser.",
 "v56": "Una donante que una vez puso condiciones ahora financia el plan conjunto, sin condiciones. 'Te lo ganaste', dice. Se lo ganaron juntos.",
 "v57": "Una aldea que anotaste el primer día, en el aeropuerto, por fin tiene una bomba de agua que funciona y una clínica que abre a tiempo.",
 "v58": "Llega tu sucesor: equipo a medio formar, cien socios observando. Le dices lo que alguien debió decirte a ti: construye primero la mesa.",
 "v59": "En la despedida está la enfermera de distrito del Acto I. Su registro en papel ya no está. El sistema de la capital por fin cuenta a cada bebé.",
 "v60": "La sirena de alerta temprana se prueba según lo previsto. Ya nadie se sobresalta. Solo consultan sus teléfonos, asienten y siguen. La preparación se volvió rutina.",
 "v61": "Un reportero te pregunta de qué estás más orgulloso. Nombras un programa que ya no lleva tu logo en ninguna parte. Ese es el que vale.",
 "v62": "La última viñeta de tu mandato se escribe sola en el trabajo de otros: los voluntarios, los ministros, los programadores, las enfermeras, siguiendo adelante.",
 "v63": "Dejas Sahelia como deberías dejar cualquier lugar al que serviste: un poco más fuerte, un poco más justo y muy capaz de arreglárselas sin ti.",
 "rf0": "Coordinar no es controlar. El CR lidera convocando, no dando órdenes.",
 "rf1": "Datos antes que acción: no puedes servir a quienes no puedes ver.",
 "rf2": "La confianza se gasta despacio y se pierde rápido. Cuídala.",
 "rf3": "El camino más rápido a menudo deja a alguien atrás. Comprueba a quién.",
 "rf4": "Un plan compartido supera a cinco planes brillantes por separado.",
 "rf5": "La prospectiva es la respuesta a crisis más barata que existe.",
 "rf6": "La capacidad local es la única que permanece cuando la misión se va.",
 "rf7": "El cambio de comportamiento supera a los edificios nuevos cuando la confianza es el cuello de botella.",
 "rf8": "El fondo común permite que el país dirija en lugar del donante más ruidoso.",
 "rf9": "La transparencia escuece una semana y compensa durante años.",
 "rf10": "Quienes están más cerca de un problema suelen tener la solución más barata.",
 "rf11": "La incidencia conjunta protege a cada agencia de quedarse sola.",
 "rf12": "El trabajo de un piloto es la evidencia, no la esperanza, y la escala es una batalla aparte.",
 "rf13": "La inclusión no es una cortesía; es cómo los planes sobreviven al contacto con la realidad.",
 "rf14": "Mérito compartido es coordinación ganada.",
 "rf15": "La resiliencia es socorro que solo tienes que pagar una vez.",
 "rf16": "La desinformación viaja más rápido que los hechos, así que siembra los hechos temprano.",
 "rf17": "Protege la energía de tu equipo; el agotamiento es una crisis prevenible.",
 "rf18": "El mejor legado no lleva logo.",
 "rf19": "No dejar a nadie atrás es una partida presupuestaria, no un eslogan.",
 "ai1": "Bajas del avión al calor seco de Sahelia. El Marco de Cooperación está firmado, el equipo a medio formar, y cien socios observan para ver quién eres. Cartografía las necesidades. Gánate el primer sí.",
 "ai2": "La luna de miel termina. Un choque pone a prueba si todos aquellos apretones de manos eran coordinación real o solo buenos modales. El país observa cómo cargas con la presión.",
 "ai3": "Las semillas que plantaste están listas para florecer, o marchitarse. Las grandes apuestas, las alianzas frágiles y las decisiones más difíciles de tu mandato llegan juntas.",
 "ai4": "Tu mandato está terminando. Todo ahora gira en torno al legado: qué hitos terminas, qué confianza conservas y qué puede llevar Sahelia hacia adelante sin ti.",
 "ai.crisis": "Las crisis se acumulaban, así que actué para estabilizar la respuesta.",
 "ai.trustLow": "La confianza llegaba a niveles peligrosamente bajos, así que reconstruirla es lo primero.",
 "ai.funding": "La brecha de financiación se ampliaba, así que movilicé recursos.",
 "ai.coordination": "Necesitábamos coordinación para desbloquear el trabajo conjunto, así que convoqué a los socios.",
 "ai.weakest": "Nuestra prioridad más débil era {pillar}, así que invertí ahí.",
 "ai.milestone": "Este empujón podría completar el hito de {pillar}.",
 "ai.default": "Este era el movimiento de mayor impacto a mi alcance.",
 "ai.partner": "Llevé a {partner} a la mesa para impulsar nuestra prioridad más débil.",
 "ai.done": "{name} está listo.",
 "ai.ab.gov": "La confianza necesitaba un impulso, así que desbloqueé una política nacional.",
 "ai.ab.comms": "Contrarresté el relato para proteger la confianza pública.",
 "ai.ab.hro": "Protegí a los vulnerables del siguiente choque.",
 "ai.ab.donor": "Los fondos escaseaban, así que inyecté dinero nuevo.",
 "ai.ab.logops": "Optimicé los costes para estirar nuestro presupuesto.",
 "ai.ab.chw": "Convertí datos sobrantes en confianza comunitaria.",
 "ai.ab.foresight": "Escaneé el horizonte para reordenar lo que viene.",
 "ai.ab.dmo": "Me apoyé en los datos para ver con claridad el próximo evento.",
 "ai.ab.rc": "Alineé al equipo para amplificar el siguiente movimiento.",
 "ai.ab.generic": "Usé mi fortaleza distintiva cuando importaba.",
 "sugg.crisis": "Las crisis se acumulan. {card} aliviaría la presión.",
 "sugg.trust": "La confianza está baja. {card} la reconstruye.",
 "sugg.weakest": "Tu prioridad más débil es {pillar}. {card} la hace avanzar.",
 "sugg.build": "Acumula recursos o convoca a socios para preparar un movimiento mayor el próximo mes.",
 "summ.trustStrong": "La confianza es fuerte.",
 "summ.trustHold": "La confianza aguanta, pero vigílala.",
 "summ.trustFragile": "La confianza es frágil.",
 "summ.crisesNone": "Sin crisis activas.",
 "summ.crisesOne": "1 crisis activa.",
 "summ.crisesMany": "{n} crisis activas.",
 "summ.milestones": "{n}/5 hitos alcanzados.",
 "abmsg.rc": "Alinear: +2 Coordinación, y tu siguiente acción gana una bonificación de sinergia.",
 "abmsg.dmo": "Perspicacia: +3 Datos, y se revela el próximo evento.",
 "abmsg.hro": "Escudo: el golpe a la Confianza del próximo evento dañino se reduce a la mitad.",
 "abmsg.ngo": "Alcance: se exonera el coste de Financiación de tu siguiente acción.",
 "abmsg.gov": "Mandato: +5 de Confianza nacional.",
 "abmsg.donor": "Inyectar: +5 Financiación; {pillar} rinde el doble este turno.",
 "abmsg.youth": "Amplificar: tu siguiente acción de Comportamiento se duplica.",
 "abmsg.innolabWin": "Éxito del experimento: ¡+16 Innovación!",
 "abmsg.innolabLose": "Contratiempo del experimento: -3 Confianza. Pasa.",
 "abmsg.foresight": "Horizonte: echa un vistazo a los próximos dos eventos y reordénalos.",
 "abmsg.comms": "Contrarrelato: desinformación neutralizada, +3 Confianza.",
 "abmsg.logops": "Optimizar: tus siguientes dos acciones cuestan 1 menos de Financiación.",
 "abmsg.chw": "Cuidar: convertidos {n} Datos en {m} Confianza{bonus}.",
 "abmsg.chwBonus": " (¡bonificación por crisis sanitaria!)",
 "log.alignSynergy": "Sinergia de Alinear aplicada (+5 de progreso, +1 Confianza).",
 "log.amplify": "Amplificar: efecto de comportamiento duplicado.",
 "log.synergy": "Sinergia de {partner} aplicada a {card}.",
 "log.crisesCost": "Las crisis activas cuestan {n} de Confianza.",
 "log.milestone": "Hito alcanzado: {name}",
 "log.termEnded": "Mandato terminado: {tier}",
 "style.led": "Lideraste con {pillars}. ",
 "style.under": "Subutilizaste {pillar}, una palanca que aún estaba sobre la mesa.",
 "style.balanced": "Equilibraste los cinco pilares del Quinteto, la marca de un verdadero coordinador.",
 "style.and": "y",
 "howto.goal": "Objetivo: Ayudar a Sahelia a alcanzar sus cinco hitos nacionales (uno por cada estrategia de UN 2.0) manteniendo la Confianza por encima de la línea de colapso, antes de que termine tu mandato a lo largo de cuatro Actos.",
 "howto.s1": "Informe y Evento: una historia de campo pone el escenario, luego el mundo actúa, con un choque, una oportunidad o una decisión difícil.",
 "howto.s2": "Tu turno: gasta Capacidad para jugar cartas de Acción. Cada una hace avanzar un pilar, mueve la Confianza o acumula recursos. Las cartas de Alianza potencian tu siguiente acción coincidente. Usa la habilidad de tu rol una vez al mes.",
 "howto.s3": "Resolución: las crisis cuestan Confianza hasta que se resuelven. Llena un pilar al 100% para completar un Hito.",
 "howto.res": "Recursos: Confianza (la metamoneda), Financiación, Coordinación, Datos y Capacidad.",
 "howto.strat": "Las cinco estrategias (Quinteto del Cambio): Datos, Digital, Innovación, Prospectiva, Ciencia del Comportamiento. Equilíbralas; acaparar una nunca es óptimo.",
 "howto.tiers": "Niveles de victoria: el bronce evita el colapso; la plata alcanza tres hitos; el oro alcanza los cinco con alta confianza.",
 "credits.intro": "Common Ground: un juego de cartas estratégico sobre la coordinación de la ONU sobre el terreno, creado para el Quinteto del Cambio de UN 2.0.",
 "credits.l1": "Diseño y código: proyecto Common Ground.",
 "credits.l2": "Música y sonido: original, sintetizado proceduralmente en el navegador (Web Audio API), libre de regalías.",
 "credits.l3": "Arte: CSS, SVG y emojis del sistema. Sin recursos externos.",
 "credits.l4": "Ambientación: Sahelia es ficticia y compuesta. Cualquier parecido con una nación real es pura coincidencia.",
 "credits.l5": "Narración por IA opcional: Anthropic Messages API (claude-sonnet-4-6), solo si aportas tu propia clave.",
 "tut.0.title": "Bienvenido, Coordinador",
 "tut.0.body": "Eres el Coordinador Residente en Sahelia. No tienes autoridad de mando; tu poder es alinear personas, datos y recursos. Aprendamos haciendo.",
 "tut.1.title": "La confianza lo es todo",
 "tut.1.body": "Observa el medidor de Confianza en la parte superior. Condiciona tus mayores movimientos. Si llega a cero, tu mandato termina. Constrúyela con visitas comunitarias, diálogo y honestidad.",
 "tut.2.title": "Las cinco estrategias",
 "tut.2.body": "Cada hito nacional se corresponde con una estrategia de UN 2.0: Datos, Digital, Innovación, Prospectiva, Ciencia del Comportamiento. Llena un pilar al 100% para completar su hito. Equilibra las cinco.",
 "tut.3.title": "Juega, luego reacciona",
 "tut.3.body": "Gasta Capacidad para jugar cartas de Acción. Usa la habilidad de tu rol una vez al mes. El mundo lanza choques y oportunidades; coordina bajo presión. ¿Listo?",
 "ui.aiTag": "IA",
 "ui.milestoneReached": "¡Hito alcanzado!",
 "ui.narration": "Narración (en voz alta)",
 "ui.speak": "Leer en voz alta",
 "ui.stop": "Detener",
 "ui.shock": "Choque",
 "ui.opening": "Oportunidad",
 "ui.dilemma": "Dilema"
};
})();
