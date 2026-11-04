import { describe, expect, it } from "vitest";
import { accessDestination, canAttendSorting, redirectForAccess, type AccessParticipant, type AccessState } from "./onboarding";

const delegate: AccessParticipant = { participant_type: "delegado", status: "active", full_name: "Participante de prueba", school: "Colegio de prueba", experience: "Principiante", committee_id: "test-committee", country: "Delegación de prueba", mesa_roster_id: null };
const state = (participant: AccessParticipant | null = delegate, house: string | null = null, roles = ["delegate"]): AccessState => ({ participant, house, roles });
describe("Fase 1: acceso inicial", () => {
  it("usuario sin ficha va a /registro", () => expect(accessDestination(state(null))).toBe("/registro"));
  it("delegado activo sin House va a /sorting", () => expect(accessDestination(state())).toBe("/sorting"));
  it("delegado con House va a /portal", () => expect(accessDestination(state(delegate, "atlas"))).toBe("/portal"));
  it("conserva acceso de asignaciones anteriores con ficha heredada", () => expect(accessDestination(state({ ...delegate, school: null, committee_id: null }, "atlas"))).toBe("/portal"));
  it("Staff pendiente permanece en /estado aun con rol", () => expect(accessDestination(state({ ...delegate, participant_type: "staff", status: "pending" }, null, ["staff"]))).toBe("/estado"));
  it("Profesor pendiente permanece en /estado", () => expect(accessDestination(state({ ...delegate, participant_type: "profesor", status: "pending" }))).toBe("/estado"));
  it("Staff aprobado no entra a Ceremonia ni portal delegado", () => {
    const s = state({ ...delegate, participant_type: "staff" }, null, ["staff"]);
    expect(accessDestination(s)).toBe("/estado"); expect(canAttendSorting(s)).toBe(false);
  });
  it("Profesor aprobado no entra a Ceremonia", () => expect(canAttendSorting(state({ ...delegate, participant_type: "profesor" }, null, ["profesor"]))).toBe(false));
  it("solicitud rechazada no puede completar Ceremonia", () => expect(canAttendSorting(state({ ...delegate, status: "rejected" }))).toBe(false));
  it("ficha incompleta no puede completar Ceremonia", () => expect(canAttendSorting(state({ ...delegate, school: null }))).toBe(false));
  it("sin rol autorizado no puede completar Ceremonia", () => expect(canAttendSorting(state(delegate, null, []))).toBe(false));
  it.each(["admin", "super_admin"])("%s accede a /admin sin ficha", (role) => expect(accessDestination(state(null, null, [role]))).toBe("/admin"));
  it("acceso directo a /sorting sin ficha vuelve a /registro", () => expect(redirectForAccess(state(null), "/sorting")).toBe("/registro"));
  it("no administrador no accede a /admin", () => expect(redirectForAccess(state(delegate, "atlas"), "/admin")).toBe("/portal"));
  it("Mesa conserva acceso con roster y rol autorizado", () => expect(canAttendSorting(state({ ...delegate, participant_type: "mesa", mesa_roster_id: "test-roster" }, null, ["mesa"]))).toBe(true));
  it.each([state(null), state(), state(delegate, "atlas"), state({ ...delegate, status: "pending" }), state(null, null, ["admin"])])("el destino no se redirige a sí mismo", (s) => expect(redirectForAccess(s, accessDestination(s))).toBeNull());
});