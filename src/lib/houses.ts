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
    name: "House Atlas",
    tagline: "The Empire of Strategy and Power",
    archetype:
      "Realism. Geopolitical ambition. Cold analytical calculation. Autocratic leadership.",
    mentors: ["Otto von Bismarck", "Winston Churchill", "Margaret Thatcher", "Alexander the Great"],
  },
  aurora: {
    id: "aurora",
    name: "House Aurora",
    tagline: "The Vanguard of Global Transformation",
    archetype:
      "Structural idealism. Visionary creativity. Charismatic mobilization. Unyielding defense of human rights.",
    mentors: ["Mahatma Gandhi", "Eleanor Roosevelt", "John F. Kennedy", "Martin Luther King Jr."],
  },
  summit: {
    id: "summit",
    name: "House Summit",
    tagline: "The Bastion of Executive Resilience",
    archetype:
      "Absolute crisis management. Stoic composure. Iron discipline. Mediation under friction.",
    mentors: ["Abraham Lincoln", "Franklin D. Roosevelt", "Dag Hammarskjöld", "George Washington"],
  },
  eclipse: {
    id: "eclipse",
    name: "House Eclipse",
    tagline: "The Masters of the Hidden Board",
    archetype:
      "Hyper-critical thinking. Hyper-adaptability. Surgical rhetoric. Tactical mastery of structural rules.",
    mentors: ["Niccolò Machiavelli", "Sun Tzu", "Charles Maurice de Talleyrand", "Napoleon Bonaparte"],
  },
};

export const HOUSE_LETTER: Record<"A" | "B" | "C" | "D", HouseId> = {
  A: "atlas",
  B: "aurora",
  C: "summit",
  D: "eclipse",
};
