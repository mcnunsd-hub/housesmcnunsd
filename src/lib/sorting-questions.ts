export type AnswerLetter = "A" | "B" | "C" | "D";

export interface SortingQuestion {
  id: number;
  category: string;
  prompt: string;
  options: { letter: AnswerLetter; text: string }[];
}

export const SORTING_QUESTIONS: SortingQuestion[] = [
  {
    id: 1,
    category: "Impasse Soberano por Recursos",
    prompt:
      "Se descubre un depósito subterráneo masivo de tierras raras vitales para computación cuántica en aguas internacionales desmilitarizadas. Cuatro superpotencias se movilizan para anexarlo. Como Jefe de Estado, ¿cuál es tu despliegue inicial?",
    options: [
      { letter: "A", text: "Desplegar un grupo de combate naval, establecer un perímetro marítimo y declarar una zona económica exclusiva unilateral." },
      { letter: "B", text: "Solicitar a la Asamblea General de la ONU declarar la región Patrimonio Global y congelar la extracción unilateral." },
      { letter: "C", text: "Convocar una cumbre a puertas cerradas con los ejecutivos rivales para negociar una matriz estricta de cuotas antes de la escalada." },
      { letter: "D", text: "Adquirir silenciosamente patentes exclusivas de las únicas firmas capaces de extracción profunda, dejando obsoletos los reclamos rivales." },
    ],
  },
  {
    id: 2,
    category: "Crisis de Polarización Retórica",
    prompt:
      "Te diriges al podio para pronunciar el Plenario de Apertura en un comité atrapado en feroz tribalismo ideológico. ¿Cuál es la arquitectura de tu discurso?",
    options: [
      { letter: "A", text: "Proyectar autoridad inquebrantable, trazar líneas rojas y exponer el costo de aislar a tu bloque." },
      { letter: "B", text: "Enmarcar todo en imperativos humanitarios universales que trascienden las agendas nacionales." },
      { letter: "C", text: "Presentar una hoja de ruta puramente técnica y no ideológica que demuestre que la moderación es el único camino viable." },
      { letter: "D", text: "Deconstruir sistemáticamente las hipocresías de los bloques opositores con ironía retórica precisa." },
    ],
  },
  {
    id: 3,
    category: "Contrainteligencia y Traición",
    prompt:
      "Tu delegación aliada más cercana ha estado filtrando tus borradores de compromiso a la oposición para asegurarse un patrocinio separado. ¿Cómo neutralizas la amenaza?",
    options: [
      { letter: "A", text: "Terminar la alianza públicamente y lanzar una ofensiva diplomática para aislar a su país en el comité." },
      { letter: "B", text: "Confrontar a la jefa de delegación en privado, expresar decepción ética y apelar a sus principios." },
      { letter: "C", text: "Mantener la compostura, absorber el golpe y re-anclar tu borrador con bloques centristas neutrales." },
      { letter: "D", text: "Fingir ignorancia, alimentarlos con cláusulas plausibles pero fatalmente defectuosas y exponerlos en el momento de máximo daño." },
    ],
  },
  {
    id: 4,
    category: "Velocidad Operativa Bajo Fricción",
    prompt:
      "Tu grupo de trabajo tiene 45 minutos para redactar un paquete de enmiendas o quedar excluidos de la votación. Cunde el pánico. ¿Cuál es tu estilo operativo?",
    options: [
      { letter: "A", text: "Asumir el mando absoluto. Suspender el consenso, dictar subtareas con plazos rígidos, editar cada línea tú mismo." },
      { letter: "B", text: "Coordinar un círculo rápido y de alta energía donde cada delegado se sienta validado, liberando producción colectiva por moral." },
      { letter: "C", text: "Redactar en silencio las secciones legales más densas, actuando como ancla estructural que absorbe la ansiedad del grupo." },
      { letter: "D", text: "Adaptar marcos pre-validados de resoluciones ONU exitosas para saltarte por completo el cuello de botella de redacción." },
    ],
  },
  {
    id: 5,
    category: "El Paradigma del Poder",
    prompt: "Selecciona la máxima filosófica que gobierna tu perspectiva sobre el liderazgo global.",
    options: [
      { letter: "A", text: "La historia la escriben quienes tienen la voluntad estructural de imponer orden, proyectar poder y exigir cumplimiento." },
      { letter: "B", text: "El verdadero poder se mide por la capacidad de inspirar, elevar y transformar la fibra ética de la sociedad global." },
      { letter: "C", text: "En medio del caos y el colapso institucional, la resistencia estoica y la disciplina férrea son las virtudes supremas de supervivencia." },
      { letter: "D", text: "La diplomacia es ajedrez multidimensional; la victoria favorece a quien decodifica las reglas ocultas y se adelanta tres movimientos." },
    ],
  },
  {
    id: 6,
    category: "Autopsia Estratégica",
    prompt:
      "Tu resolución es derrotada por un solo voto en la votación final. ¿Cuál es tu respuesta inmediata?",
    options: [
      { letter: "A", text: "Análisis frío de qué delegaciones rompieron pactos de voto; catalogar sus vulnerabilidades para una coalición más agresiva." },
      { letter: "B", text: "Aceptar la derrota con aplomo; felicitar al bloque vencedor; consolarte con que tu paper cambió el discurso ético." },
      { letter: "C", text: "Cruzar el pasillo de inmediato; proponer fusionar tus cláusulas derrotadas en la próxima enmienda de crisis del bloque." },
      { letter: "D", text: "Sonreír. Anticipando la traición, escondiste horas antes una cláusula restrictiva de respaldo dentro del paper de otro país." },
    ],
  },
  {
    id: 7,
    category: "Innovación y Arquitectura Creativa",
    prompt:
      "Estás diseñando desde cero absoluto una iniciativa global disruptiva. ¿Cuál es tu nodo primario de enfoque?",
    options: [
      { letter: "A", text: "Macroarquitectura, protocolos de cumplimiento financiero y métricas agresivas de expansión de mercado a largo plazo." },
      { letter: "B", text: "Narrativa visual evocadora, innovación artística radical y un mensaje que desafíe los paradigmas sociales." },
      { letter: "C", text: "Utilidad estructural, durabilidad bajo fallos del sistema y resolución clínica de puntos de dolor agudos." },
      { letter: "D", text: "Mapeo de vulnerabilidades del competidor, identificación de tendencias ocultas y diseño de un modelo que supere estructuralmente a los incumbentes." },
    ],
  },
  {
    id: 8,
    category: "Mediación de Microconflicto",
    prompt:
      "Dos miembros centrales de tu equipo tuvieron un desencuentro emocional por crédito del proyecto, paralizando tu pipeline. ¿Cómo intervienes?",
    options: [
      { letter: "A", text: "Saltarte sus quejas, redefinir las métricas de crédito tú mismo y emitir una directiva firme para reanudar operaciones." },
      { letter: "B", text: "Estructurar un círculo de mediación empático para reparar el lazo interpersonal de confianza y sanar el colectivo." },
      { letter: "C", text: "Mantenerte neutral, escuchar ambos relatos por separado y construir un flujo de trabajo balanceado que aísle la fricción." },
      { letter: "D", text: "Analizar los disparadores psicológicos desde las sombras; guiar a cada persona a descubrir su propio error orgánicamente." },
    ],
  },
  {
    id: 9,
    category: "La Psicología de la Derrota",
    prompt:
      "No conseguiste un hito codiciado tras meses de preparación. ¿Cuál es tu reacción interna genuina?",
    options: [
      { letter: "A", text: "Frustración convertida al instante en combustible; redoblar el entrenamiento y arrasar el próximo ciclo de selección." },
      { letter: "B", text: "Introspección profunda; abrazar el revés como dato cósmico y redirección creativa en tu evolución." },
      { letter: "C", text: "Estoicismo total; rehusarse a que los resultados dicten el estado interno; volver a la disciplina diaria." },
      { letter: "D", text: "Fascinación intelectual; deconstruir las fallas estratégicas, identificar variables ocultas, rehacer el playbook." },
    ],
  },
  {
    id: 10,
    category: "Autonomía Intelectual y Recreación",
    prompt:
      "Una tarde libre para dominar una habilidad compleja no académica puramente por enriquecimiento personal: ¿qué eliges?",
    options: [
      { letter: "A", text: "Mecánica de gran estrategia, simulaciones de negociación corporativa, oratoria de nivel comando." },
      { letter: "B", text: "Pintura al óleo de vanguardia, guion experimental, prototipado de modelos de impacto social desde la base." },
      { letter: "C", text: "Atletismo de resistencia, resolución táctica de puzzles, supervivencia silvestre, respuesta a trauma de emergencia." },
      { letter: "D", text: "Psicología conductual, mecánica de cifrado, teoría táctica de ajedrez, lógica engañosa y paradojas." },
    ],
  },
];
