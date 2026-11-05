import { describe, it, expect } from "vitest";
import { previewImport, validateCatalogRow, type Catalogs } from "./registration-catalog";
const catalogs: Catalogs = { committees: [{ id: "11111111-1111-4111-8111-111111111111", name: "Comité PRUEBA", active: true }], delegations: [], mesa_roster: [], invite_codes: [] };
describe("Official catalog validation", () => {
  it("rejects duplicated committees without overwriting", () => {
    expect(() => validateCatalogRow("committees", { name: " comité prueba ", active: true, sort_order: 1 }, catalogs)).toThrow("duplicado");
  });
  it("does not fill missing required values", () => {
    expect(previewImport("committees", [{ name: "PRUEBA" }], catalogs)[0]?.payload).toBeNull();
  });
  it("rejects unknown committees", () => {
    expect(previewImport("delegations", [{ committee: "NO EXISTE", country: "PRUEBA" }], catalogs)[0]?.error).toContain("no encontrado");
  });
  it("detects duplicates inside an import", () => {
    const rows = [{ committee: "Comité PRUEBA", country: "PRUEBA" }, { committee: "Comité PRUEBA", country: " prueba " }];
    expect(previewImport("delegations", rows, catalogs)[1]?.payload).toBeNull();
  });
  it("restricts invitations to staff and teachers", () => {
    expect(() => validateCatalogRow("invite_codes", { code: "PRUEBA", participant_type: "admin", active: true, max_uses: null }, catalogs)).toThrow();
  });
  it("keeps an explicitly unlimited code and resolves its committee", () => {
    expect(previewImport("invite_codes", [{ code: "PRUEBA", participant_type: "staff", active: "false", max_uses: "" }], catalogs)[0]?.payload).toEqual({ code: "PRUEBA", participant_type: "staff", active: false, max_uses: null });
    expect(previewImport("mesa_roster", [{ committee: "Comité PRUEBA", full_name: "Cuenta PRUEBA", position: "Puesto PRUEBA" }], catalogs)[0]?.payload).toMatchObject({ committee_id: catalogs.committees[0]?.id });
  });
});