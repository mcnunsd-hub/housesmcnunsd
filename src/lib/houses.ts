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
    tagline: "Strategy · The Analytical Strategist",
    archetype:
      "Realismo. Ambición geopolítica. Cálculo analítico frío. Liderazgo autocrático.",
    mentors: ["Klemens von Metternich"],
  },
  aurora: {
    id: "aurora",
    name: "Casa Aurora",
    tagline: "Idealism · The Humanitarian Idealist",
    archetype:
      "Idealismo estructural. Creatividad visionaria. Movilización carismática. Defensa irrenunciable de los derechos humanos.",
    mentors: ["Eleanor Roosevelt"],
  },
  summit: {
    id: "summit",
    name: "Casa Summit",
    tagline: "Resilience · The Resilient Mediator",
    archetype:
      "Gestión absoluta de crisis. Compostura estoica. Disciplina de hierro. Mediación bajo fricción.",
    mentors: ["Dag Hammarskjöld"],
  },
  eclipse: {
    id: "eclipse",
    name: "Casa Eclipse",
    tagline: "Disruption · The Disruptive Tactician",
    archetype:
      "Pensamiento hipercrítico. Hiperadaptabilidad. Retórica quirúrgica. Dominio táctico de las reglas estructurales.",
    mentors: ["Charles Maurice de Talleyrand"],
  },
};

export const HOUSE_LETTER: Record<"A" | "B" | "C" | "D", HouseId> = {
  A: "atlas",
  B: "aurora",
  C: "summit",
  D: "eclipse",
};
