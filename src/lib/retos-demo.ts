export const DEMO_PARTICIPANT_ID = "demo-participant";
export const DEMO_VALIDATOR_ID = "demo-validator";

export type DemoRetoStatus = "available" | "in_progress" | "pending" | "approved" | "rejected";

export interface DemoRetoState {
  status: DemoRetoStatus;
  evidence: string;
  submittedBy: string;
  reviewedBy: string | null;
}

export function createInitialDemoReto(): DemoRetoState {
  return {
    status: "available",
    evidence: "",
    submittedBy: DEMO_PARTICIPANT_ID,
    reviewedBy: null,
  };
}

export function acceptDemoReto(state: DemoRetoState): DemoRetoState {
  if (state.status !== "available") throw new Error("Este reto ya fue aceptado.");
  return { ...state, status: "in_progress" };
}

export function submitDemoReto(state: DemoRetoState, evidence: string): DemoRetoState {
  if (state.status !== "in_progress" && state.status !== "rejected") {
    throw new Error("Acepta el reto antes de enviar evidencia.");
  }
  const cleanEvidence = evidence.trim();
  if (cleanEvidence.length < 10) throw new Error("Describe la evidencia con al menos 10 caracteres.");
  return { ...state, status: "pending", evidence: cleanEvidence, reviewedBy: null };
}

export function reviewDemoReto(
  state: DemoRetoState,
  decision: "approved" | "rejected",
  validatorId: string,
): DemoRetoState {
  if (state.status !== "pending") throw new Error("No hay una entrega pendiente de validación.");
  if (!validatorId.trim()) throw new Error("La validación requiere una identidad de prueba.");
  if (validatorId === state.submittedBy) throw new Error("Un participante no puede validar su propio reto.");
  return { ...state, status: decision, reviewedBy: validatorId };
}
