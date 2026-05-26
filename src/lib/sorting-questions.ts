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
    category: "Resource Sovereign Impasse",
    prompt:
      "A massive subterranean deposit of rare-earth elements vital for quantum computing is discovered in demilitarized international waters. Four superpowers mobilize to annex it. As Chief of State, what is your initial deployment?",
    options: [
      { letter: "A", text: "Deploy a carrier strike group, establish a maritime perimeter, and declare a unilateral economic exclusion zone." },
      { letter: "B", text: "Petition the UN General Assembly to declare the region a Global Heritage Site and freeze unilateral extraction." },
      { letter: "C", text: "Convene a closed-door summit with rival executives to negotiate a strict extraction quota matrix before escalation." },
      { letter: "D", text: "Quietly acquire exclusive patents from the only firms capable of deep-sea extraction in that terrain, rendering rival claims obsolete." },
    ],
  },
  {
    id: 2,
    category: "Rhetorical Polarization Crisis",
    prompt:
      "You are walking to the podium to deliver the Opening Plenary in a committee locked in fierce ideological tribalism. What is the architecture of your speech?",
    options: [
      { letter: "A", text: "Project unyielding authority, draw red lines, and outline the costs of isolating your bloc." },
      { letter: "B", text: "Frame everything around universal humanitarian imperatives that transcend national agendas." },
      { letter: "C", text: "Present a purely technical, non-ideological roadmap that proves moderation is the only viable path." },
      { letter: "D", text: "Systematically deconstruct the hypocrisies of opposing blocs with precise rhetorical irony." },
    ],
  },
  {
    id: 3,
    category: "Counter-Intelligence & Treachery",
    prompt:
      "Your closest allied delegation has been leaking your draft compromises to the opposition to secure a separate sponsorship deal. How do you neutralize the threat?",
    options: [
      { letter: "A", text: "Terminate the alliance publicly and launch a diplomatic offensive to isolate their country in committee." },
      { letter: "B", text: "Confront the head delegate privately, express ethical disappointment, and appeal to their principles." },
      { letter: "C", text: "Maintain composure, absorb the blow, and immediately re-anchor your draft with neutral centrist blocs." },
      { letter: "D", text: "Feign ignorance, feed them plausible but fatally flawed clauses, and expose them at maximum-damage moment." },
    ],
  },
  {
    id: 4,
    category: "Operational Velocity Under Friction",
    prompt:
      "Your working group has 45 minutes to draft a multi-layered amendment package or be excluded from voting. Panic spreads. What is your operational style?",
    options: [
      { letter: "A", text: "Assume absolute command. Suspend consensus, dictate sub-tasks with rigid deadlines, edit every line yourself." },
      { letter: "B", text: "Run a rapid, high-energy circle where every delegate feels validated, unlocking collective output through morale." },
      { letter: "C", text: "Silently draft the densest legal sections yourself, acting as a structural anchor absorbing the group's anxiety." },
      { letter: "D", text: "Adapt pre-vetted frameworks from historically successful UN resolutions to bypass the drafting bottleneck entirely." },
    ],
  },
  {
    id: 5,
    category: "The Paradigm of Power",
    prompt: "Select the philosophical maxim that governs your perspective on global leadership.",
    options: [
      { letter: "A", text: "History is written by those with the structural will to enforce order, project power, and command compliance." },
      { letter: "B", text: "True power is measured by the capacity to inspire, uplift, and transform the ethical fabric of global society." },
      { letter: "C", text: "Amidst chaos and institutional collapse, stoic endurance and iron discipline are the supreme virtues of survival." },
      { letter: "D", text: "Diplomacy is multidimensional chess; victory favors the one who decodes the hidden rules and moves three steps ahead." },
    ],
  },
  {
    id: 6,
    category: "Strategic Post-Mortem",
    prompt:
      "Your resolution paper is defeated by a single vote in final roll-call. What is your immediate response?",
    options: [
      { letter: "A", text: "Cold analysis of which delegations broke voting pacts; catalog their vulnerabilities for a more aggressive coalition." },
      { letter: "B", text: "Accept defeat with poise; congratulate the passing bloc; take solace that your paper shifted the ethical discourse." },
      { letter: "C", text: "Cross the floor immediately; propose fusing your defeated clauses into the bloc's upcoming crisis amendment." },
      { letter: "D", text: "Smile. Anticipating this betrayal, you hid a restrictive fallback clause inside another country's paper hours earlier." },
    ],
  },
  {
    id: 7,
    category: "Innovation & Creative Architecture",
    prompt:
      "You are designing a disruptive global initiative from absolute zero. What is your primary node of focus?",
    options: [
      { letter: "A", text: "Macro-architecture, financial enforcement protocols, and aggressive long-term metrics for market expansion." },
      { letter: "B", text: "Evocative visual narrative, radical artistic innovation, and a message that challenges social paradigms." },
      { letter: "C", text: "Structural utility, durability under system failures, and clinical resolution of acute pain points." },
      { letter: "D", text: "Mapping competitor vulnerabilities, identifying hidden trends, and engineering a model that structurally outperforms incumbents." },
    ],
  },
  {
    id: 8,
    category: "Micro-Conflict Mediation",
    prompt:
      "Two core team members have had an emotional falling out over project credit, stalling your pipeline. How do you intervene?",
    options: [
      { letter: "A", text: "Bypass their grievances, redefine credit metrics yourself, and issue a firm directive to resume operations." },
      { letter: "B", text: "Structure an empathetic mediation circle to repair the interpersonal trust bond and heal the collective." },
      { letter: "C", text: "Stay neutral, hear both accounts separately, and construct a balanced workflow split that isolates friction." },
      { letter: "D", text: "Analyze the psychological triggers from the shadows; guide each person to discover their own error organically." },
    ],
  },
  {
    id: 9,
    category: "The Psychology of Defeat",
    prompt:
      "You have failed to secure a coveted milestone after months of preparation. What is your genuine internal reaction?",
    options: [
      { letter: "A", text: "Frustration converted instantly into fuel; redouble training and obliterate the next selection cycle." },
      { letter: "B", text: "Deep introspection; embrace the setback as cosmic data and a creative redirection in your evolution." },
      { letter: "C", text: "Total stoicism; refuse to let outcomes dictate internal state; return to daily discipline." },
      { letter: "D", text: "Intellectual fascination; deconstruct the strategic flaws, identify unseen variables, overhaul the playbook." },
    ],
  },
  {
    id: 10,
    category: "Intellectual Autonomy & Recreation",
    prompt:
      "Granted a free afternoon to master a complex, non-academic skill purely for personal enrichment, which pursuit do you choose?",
    options: [
      { letter: "A", text: "Grand-strategy mechanics, corporate negotiation simulations, command-level oratory." },
      { letter: "B", text: "Avant-garde oil painting, experimental screenwriting, prototyping grassroots social impact models." },
      { letter: "C", text: "Endurance athletics, tactical puzzle-solving, wilderness survival, emergency trauma response." },
      { letter: "D", text: "Behavioral psychology, encryption mechanics, tactical chess theory, deceptive logic and paradoxes." },
    ],
  },
];
