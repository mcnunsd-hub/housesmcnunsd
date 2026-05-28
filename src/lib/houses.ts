export type HouseId = "atlas" | "aurora" | "summit" | "eclipse";

export interface HouseDef {
  id: HouseId;
  name: string;
  tagline: string;
  archetype: string;
  mentors: string[];
}

export const HOUSES: Record<HouseId, HouseDef> = {
  atlas: {
    id: "atlas",
    name: "Casa Atlas",
    tagline: "El Imperio de la Estrategia y el Poder",
    archetype:
      "Realismo. Ambición geopolítica. Cálculo analítico frío. Liderazgo autocrático.",
    mentors: ["Otto von Bismarck", "Winston Churchill", "Margaret Thatcher", "Alejandro Magno"],
  },
  aurora: {
    id: "aurora",
    name: "Casa Aurora",
    tagline: "La Vanguardia de la Transformación Global",
    archetype:
      "Idealismo estructural. Creatividad visionaria. Movilización carismática. Defensa irrenunciable de los derechos humanos.",
    mentors: ["Mahatma Gandhi", "Eleanor Roosevelt", "John F. Kennedy", "Martin Luther King Jr."],
  },
  summit: {
    id: "summit",
    name: "Casa Summit",
    tagline: "El Bastión de la Resiliencia Ejecutiva",
    archetype:
      "Gestión absoluta de crisis. Compostura estoica. Disciplina de hierro. Mediación bajo fricción.",
    mentors: ["Abraham Lincoln", "Franklin D. Roosevelt", "Dag Hammarskjöld", "George Washington"],
  },
  eclipse: {
    id: "eclipse",
    name: "Casa Eclipse",
    tagline: "Los Maestros del Tablero Oculto",
    archetype:
      "Pensamiento hipercrítico. Hiperadaptabilidad. Retórica quirúrgica. Dominio táctico de las reglas estructurales.",
    mentors: ["Niccolò Machiavelli", "Sun Tzu", "Charles Maurice de Talleyrand", "Napoleón Bonaparte"],
  },
};

export const HOUSE_LETTER: Record<"A" | "B" | "C" | "D", HouseId> = {
  A: "atlas",
  B: "aurora",
  C: "summit",
  D: "eclipse",
};
