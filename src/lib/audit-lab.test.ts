import { describe, expect, it } from "vitest";
import { getPermissionDecision, parseGeneratedAuditCases, simulatedAccountInputSchema } from "./audit-lab";

const baseCase = {
  title: "Delegado no accede a administración", role: "delegate", objective: "Comprobar la denegación administrativa en servidor.",
  setup: ["Usar una persona ficticia sin privilegios"], steps: ["Iniciar el flujo simulado", "Solicitar acceso administrativo"],
  expected_result: "El servidor deniega el acceso.", verification: "Comprobar la respuesta del servidor sin modificar datos.",
  forbidden_outcome: "Se muestra o modifica información administrativa.", risk: "authorization",
};

describe("audit lab permission rules", () => {
  it("allows Admin and Super Admin to generate audit cases", () => {
    expect(getPermissionDecision("admin", "generate_audit_cases").allowed).toBe(true);
    expect(getPermissionDecision("super_admin", "generate_audit_cases").allowed).toBe(true);
    expect(getPermissionDecision("staff", "generate_audit_cases").allowed).toBe(false);
  });
  it("restricts simulated account creation to Super Admin", () => {
    expect(getPermissionDecision("super_admin", "create_simulated_account").allowed).toBe(true);
    expect(getPermissionDecision("admin", "create_simulated_account").allowed).toBe(false);
  });
  it("never permits evidence self-validation", () => {
    for (const role of ["delegate", "mesa", "staff", "admin", "super_admin"] as const) expect(getPermissionDecision(role, "self_validate_evidence").allowed).toBe(false);
  });
  it("blocks Mesa and Delegate from viewing other participants' Houses", () => {
    expect(getPermissionDecision("mesa", "view_participant_houses").allowed).toBe(false);
    expect(getPermissionDecision("delegate", "view_participant_houses").allowed).toBe(false);
  });
  it("never turns draft mode into a real registration bypass", () => {
    expect(getPermissionDecision("super_admin", "bypass_registration").allowed).toBe(false);
  });
});

describe("safe generated cases and fictitious accounts", () => {
  it("accepts structured cases for selected roles", () => {
    const result = parseGeneratedAuditCases(JSON.stringify({ cases: [baseCase, baseCase, baseCase] }), ["delegate"]);
    expect(result).toHaveLength(3);
    expect(result[0]?.id).toBe("audit-case-1");
  });
  it("rejects a role that the administrator did not select", () => {
    expect(() => parseGeneratedAuditCases(JSON.stringify({ cases: [baseCase, baseCase, baseCase] }), ["mesa"])).toThrow("rol no seleccionado");
  });
  it("rejects real-looking email domains and names not marked as test data", () => {
    expect(simulatedAccountInputSchema.safeParse({ full_name: "Delegado de Prueba", email: "persona@gmail.com", role: "delegate" }).success).toBe(false);
    expect(simulatedAccountInputSchema.safeParse({ full_name: "Nombre sin marca", email: "persona@example.com", role: "delegate" }).success).toBe(false);
  });
  it("accepts explicitly fictitious local account data", () => {
    expect(simulatedAccountInputSchema.safeParse({ full_name: "Mesa de Prueba", email: "mesa.prueba@example.com", role: "mesa" }).success).toBe(true);
  });
});
