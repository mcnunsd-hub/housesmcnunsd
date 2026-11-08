import { z } from "zod";

export const auditRoles = ["delegate", "mesa", "profesor", "staff", "admin", "super_admin", "validator", "participant"] as const;
export type AuditRole = typeof auditRoles[number];
export const auditRoleLabels: Record<AuditRole, string> = {
  delegate: "Delegado", mesa: "Mesa Directiva", profesor: "Profesor", staff: "Staff",
  admin: "Admin", super_admin: "Super Admin", validator: "Validador", participant: "Participante",
};

export const auditActions = [
  "admin_panel", "manage_registration", "generate_audit_cases", "create_simulated_account",
  "view_participant_houses", "self_validate_evidence", "bypass_registration",
] as const;
export type AuditAction = typeof auditActions[number];
export const auditActionLabels: Record<AuditAction, string> = {
  admin_panel: "Abrir el panel administrativo",
  manage_registration: "Gestionar catálogos de registro",
  generate_audit_cases: "Generar casos de auditoría con IA",
  create_simulated_account: "Crear una cuenta ficticia simulada",
  view_participant_houses: "Consultar afiliaciones de otros participantes",
  self_validate_evidence: "Autovalidar una evidencia propia",
  bypass_registration: "Omitir el registro oficial con una cuenta real",
};

export type PermissionDecision = { allowed: boolean; reason: string };
export function getPermissionDecision(role: AuditRole, action: AuditAction): PermissionDecision {
  const isAdmin = role === "admin" || role === "super_admin";
  if (action === "self_validate_evidence") return { allowed: false, reason: "La autovalidación está prohibida para todos los roles." };
  if (action === "bypass_registration") return { allowed: false, reason: "El modo borrador nunca sustituye el registro oficial ni crea acceso real." };
  if (action === "create_simulated_account") return role === "super_admin"
    ? { allowed: true, reason: "Super Admin puede crear personas ficticias locales; no se crean cuentas Auth." }
    : { allowed: false, reason: "Solo Super Admin puede crear personas ficticias de auditoría." };
  if (action === "view_participant_houses") return isAdmin
    ? { allowed: true, reason: "La administración autorizada puede auditar afiliaciones; Mesa y Delegado no." }
    : { allowed: false, reason: "El rol simulado no puede consultar afiliaciones de otros participantes." };
  if (isAdmin) return { allowed: true, reason: "La regla administrativa vigente permite esta operación de solo auditoría." };
  return { allowed: false, reason: "La operación requiere Admin o Super Admin validado en servidor." };
}

export function permissionMatrixForRoles(roles: AuditRole[]) {
  return Object.fromEntries(roles.map(role => [role, Object.fromEntries(auditActions.map(action => {
    const decision = getPermissionDecision(role, action);
    return [action, { allowed: decision.allowed, reason: decision.reason }];
  }))]));
}

export const auditGenerationInputSchema = z.object({
  description: z.string().trim().min(10, "Describa el flujo con al menos 10 caracteres").max(1500),
  roles: z.array(z.enum(auditRoles)).min(1).max(4),
}).strict();

const generatedCaseSchema = z.object({
  title: z.string().trim().min(5).max(140),
  role: z.enum(auditRoles),
  objective: z.string().trim().min(10).max(500),
  setup: z.array(z.string().trim().min(3).max(300)).min(1).max(5),
  steps: z.array(z.string().trim().min(3).max(400)).min(2).max(8),
  expected_result: z.string().trim().min(5).max(500),
  verification: z.string().trim().min(10).max(600),
  forbidden_outcome: z.string().trim().min(5).max(400),
  risk: z.enum(["authorization", "privacy", "data_integrity", "workflow"]),
}).strict();
const generatedCasesSchema = z.object({ cases: z.array(generatedCaseSchema).min(3).max(6) }).strict();
export type AuditCase = z.infer<typeof generatedCaseSchema> & { id: string };

export function parseGeneratedAuditCases(text: string, selectedRoles: AuditRole[]): AuditCase[] {
  let json: unknown;
  try { json = JSON.parse(text); } catch { throw new Error("La respuesta de IA no contiene JSON válido."); }
  const parsed = generatedCasesSchema.safeParse(json);
  if (!parsed.success) throw new Error("La respuesta de IA no cumple el formato seguro de casos de prueba.");
  if (parsed.data.cases.some(item => !selectedRoles.includes(item.role))) {
    throw new Error("La respuesta incluye un rol no seleccionado y fue descartada.");
  }
  return parsed.data.cases.map((item, index) => ({ ...item, id: `audit-case-${index + 1}` }));
}

export const simulatedAccountInputSchema = z.object({
  full_name: z.string().trim().min(3).max(80).refine(value => /prueba|fictici/i.test(value), "Incluya «Prueba» en el nombre ficticio"),
  email: z.string().trim().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*@example\.com$/, "Use un correo ficticio @example.com"),
  role: z.enum(auditRoles),
}).strict();
export type SimulatedAccountInput = z.infer<typeof simulatedAccountInputSchema>;

export const simulatedPermissionInputSchema = z.object({
  accountId: z.string().uuid(),
  role: z.enum(auditRoles),
  action: z.enum(auditActions),
}).strict();

export const auditCaseJsonSchema = {
  type: "object", additionalProperties: false, required: ["cases"],
  properties: { cases: { type: "array", minItems: 3, maxItems: 6, items: {
    type: "object", additionalProperties: false,
    required: ["title", "role", "objective", "setup", "steps", "expected_result", "verification", "forbidden_outcome", "risk"],
    properties: {
      title: { type: "string" }, role: { type: "string", enum: [...auditRoles] },
      objective: { type: "string" }, setup: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
      steps: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 8 },
      expected_result: { type: "string" }, verification: { type: "string" },
      forbidden_outcome: { type: "string" },
      risk: { type: "string", enum: ["authorization", "privacy", "data_integrity", "workflow"] },
    },
  } } },
} as const;
