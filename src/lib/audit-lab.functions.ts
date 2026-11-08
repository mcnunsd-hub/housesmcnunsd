import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import {
  auditGenerationInputSchema, simulatedAccountInputSchema, simulatedPermissionInputSchema,
  permissionMatrixForRoles, parseGeneratedAuditCases, getPermissionDecision, auditCaseJsonSchema,
} from "./audit-lab";

async function assertAdmin(db: SupabaseClient<Database>, userId: string) {
  const { data, error } = await db.rpc("is_admin", { _user_id: userId });
  if (error || !data) throw new Error("Acceso administrativo requerido.");
}
async function assertSuperAdmin(db: SupabaseClient<Database>) {
  const { data, error } = await db.rpc("is_super_admin");
  if (error || !data) throw new Error("Se requiere el rol Super Admin.");
}

export const generateAuditCases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => auditGenerationInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const gateway = await import("@lovable.dev/ai-gateway");
    try {
      const response = await gateway.generateResponse({
        model: "openai/gpt-6-astra",
        instructions: "Diseña pruebas de auditoría defensivas para MCNUN Houses. No uses datos personales reales, credenciales, códigos vigentes ni escrituras en producción. No propongas bypass de autenticación, elevación de privilegios, autovalidación de evidencias ni acceso de Mesa o Delegado a afiliaciones ajenas. Todo caso debe usar cuentas ficticias, incluir un resultado observable y una comprobación de autorización en servidor. Devuelve solo el JSON solicitado.",
        input: [{ role: "user", content: `Flujo a auditar: ${data.description}\nRoles seleccionados: ${data.roles.join(", ")}\nReglas vigentes para la simulación: ${JSON.stringify(permissionMatrixForRoles(data.roles))}\nGenera entre 3 y 6 casos seguros, con al menos un caso positivo y uno negativo cuando la regla lo permita.` }],
        max_output_tokens: 7000,
        text: { format: { type: "json_schema", name: "mcnun_audit_cases", strict: true, schema: auditCaseJsonSchema } },
      });
      if (response.status !== "completed") throw new Error("La generación no terminó correctamente; no se reintentó automáticamente.");
      const outputText: string[] = [];
      const refusals: string[] = [];
      for (const item of response.output) {
        if (item.type !== "message") continue;
        for (const content of item.content) {
          if (content.type === "output_text") outputText.push(content.text);
          if (content.type === "refusal") refusals.push(content.refusal);
        }
      }
      if (!outputText.length) throw new Error(refusals[0] ?? "El modelo no devolvió casos utilizables.");
      return { cases: parseGeneratedAuditCases(outputText.join("\n"), data.roles), generatedAt: new Date().toISOString() };
    } catch (error) {
      if (error instanceof gateway.GatewayError) {
        console.error("Audit case generation failed", { code: error.code, logId: error.ids?.logId, outcome: error.outcome });
        if (error.code === "payment_required") throw new Error("No hay créditos de IA disponibles. El texto del flujo se conserva.");
        if (error.code === "rate_limited") throw new Error("El servicio de IA está ocupado. Espere antes de volver a intentarlo.");
        throw new Error("No se pudieron generar los casos. Revise la configuración de IA; no se realizó ninguna escritura.");
      }
      throw error instanceof Error ? error : new Error("No se pudieron generar los casos.");
    }
  });

export const createSimulatedAuditAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => simulatedAccountInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase);
    return {
      account: { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
      environment: "browser_simulation" as const,
      notice: "Persona ficticia validada en servidor. No se creó usuario Auth, contraseña ni registro en la base de datos.",
    };
  });

export const validateSimulatedAuditPermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => simulatedPermissionInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase);
    const decision = getPermissionDecision(data.role, data.action);
    return { ...decision, accountId: data.accountId, checkedAt: new Date().toISOString(), source: "server_rule_simulation" as const };
  });
