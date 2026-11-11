import { describe, expect, it } from "vitest";
import {
  acceptDemoReto,
  createInitialDemoReto,
  DEMO_PARTICIPANT_ID,
  DEMO_VALIDATOR_ID,
  reviewDemoReto,
  submitDemoReto,
} from "./retos-demo";

describe("recorrido local de Retos", () => {
  it("avanza desde aceptado hasta pendiente con evidencia ficticia", () => {
    const accepted = acceptDemoReto(createInitialDemoReto());
    const submitted = submitDemoReto(accepted, "  Evidencia ficticia para la demostración.  ");
    expect(submitted.status).toBe("pending");
    expect(submitted.evidence).toBe("Evidencia ficticia para la demostración.");
  });

  it("exige aceptar el reto y describir la evidencia", () => {
    const initial = createInitialDemoReto();
    expect(() => submitDemoReto(initial, "Evidencia ficticia suficiente")).toThrow("Acepta el reto");
    expect(() => submitDemoReto(acceptDemoReto(initial), "Corta")).toThrow("al menos 10 caracteres");
  });

  it("no permite validar antes de recibir una entrega", () => {
    expect(() => reviewDemoReto(createInitialDemoReto(), "approved", DEMO_VALIDATOR_ID)).toThrow(
      "No hay una entrega pendiente",
    );
  });

  it("bloquea la autovalidación aunque se invoque directamente", () => {
    const pending = submitDemoReto(acceptDemoReto(createInitialDemoReto()), "Evidencia ficticia suficiente");
    expect(() => reviewDemoReto(pending, "approved", DEMO_PARTICIPANT_ID)).toThrow("no puede validar su propio reto");
  });

  it("registra aprobación y rechazo con un validador ficticio distinto", () => {
    const pending = submitDemoReto(acceptDemoReto(createInitialDemoReto()), "Evidencia ficticia suficiente");
    expect(reviewDemoReto(pending, "approved", DEMO_VALIDATOR_ID)).toMatchObject({
      status: "approved",
      reviewedBy: DEMO_VALIDATOR_ID,
    });
    expect(reviewDemoReto(pending, "rejected", DEMO_VALIDATOR_ID).status).toBe("rejected");
  });
});
