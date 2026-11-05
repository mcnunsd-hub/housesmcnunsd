import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { catalogKinds, validateCatalogRow, type CatalogKind, type Catalogs } from "./registration-catalog";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

async function authorized(db: SupabaseClient<Database>, userId: string) {
  const { data, error } = await db.rpc("is_admin", { _user_id: userId });
  if (error || !data) throw new Error("Acceso administrativo requerido.");
}
async function catalogsFrom(db: SupabaseClient<Database>): Promise<Catalogs> {
  const results = await Promise.all(catalogKinds.map(kind => db.from(kind).select("*").order("created_at").limit(10000)));
  for (const result of results) if (result.error) throw new Error("No se pudieron cargar los catálogos. Intente nuevamente.");
  return Object.fromEntries(catalogKinds.map((kind, index) => [kind, results[index]?.data ?? []])) as Catalogs;
}
export const getRegistrationCatalogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth]).handler(async ({ context }) => {
    await authorized(context.supabase, context.userId);
    return catalogsFrom(context.supabase);
  });
export const saveRegistrationCatalog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ kind: z.enum(catalogKinds), id: z.string().uuid().optional(), row: z.record(z.unknown()) }).parse(input))
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    await authorized(db, context.userId);
    const catalogs = await catalogsFrom(db);
    const row = validateCatalogRow(data.kind, data.row, catalogs, data.id);
    if (data.id) {
      const existing = catalogs[data.kind].find(r => r.id === data.id);
      if (!existing) throw new Error("El registro ya no existe. Actualice el listado.");
      if (data.kind === "mesa_roster" && existing.claimed_by) throw new Error("Un puesto reclamado no se puede editar.");
      if (data.kind === "committees" && "name" in row && existing.name !== row.name) {
        const { count, error } = await db.from("participants").select("user_id", { count: "exact", head: true }).eq("committee_id", data.id);
        if (error || count) throw new Error("No se puede renombrar un comité con participantes registrados.");
      }
      if (data.kind === "delegations") {
        const { count, error } = await db.from("participants").select("user_id", { count: "exact", head: true }).eq("committee_id", existing.committee_id ?? "").eq("country", existing.country ?? "");
        if (error || count) throw new Error("No se puede editar una delegación con participantes registrados.");
      }
      if (data.kind === "invite_codes" && (existing.uses ?? 0) > 0 && "code" in row && (row.code !== existing.code || row.participant_type !== existing.participant_type)) throw new Error("Un código utilizado conserva su código y tipo de participante.");
      if ("max_uses" in row && row.max_uses !== null && row.max_uses < (existing.uses ?? 0)) throw new Error("El máximo no puede ser inferior a los usos actuales.");
      // Dynamic table dispatch follows the validated kind and schema; never accepts arbitrary columns.
      let query = db.from(data.kind).update(row).eq("id", data.id);
      if (data.kind === "mesa_roster") query = query.is("claimed_by", null);
      const { data: updated, error } = await query.select("id").single();
      if (error || !updated) throw new Error("No se pudo guardar. El registro pudo cambiar; actualice el listado.");
    } else {
      const insert = data.kind === "invite_codes" ? { ...row, created_by: context.userId } : row;
      const { error } = await db.from(data.kind).insert(insert as never);
      if (error) throw new Error("No se pudo crear el registro. Compruebe duplicados y permisos.");
    }
    return { ok: true };
  });
export const importRegistrationCatalog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ kind: z.enum(catalogKinds), rows: z.array(z.record(z.unknown())).min(1).max(500) }).parse(input))
  .handler(async ({ data, context }) => {
    await authorized(context.supabase, context.userId);
    const catalogs = await catalogsFrom(context.supabase);
    const rows = data.rows.map((input, index) => {
      try {
        const row = validateCatalogRow(data.kind, input, catalogs);
        catalogs[data.kind].push({ ...row, id: `import-${index}` });
        return data.kind === "invite_codes" ? { ...row, created_by: context.userId } : row;
      } catch (error) { throw new Error(`Fila ${index + 2}: ${error instanceof Error ? error.message : "Datos inválidos"}`); }
    });
    // A single insert is atomic; no partial imports and no upsert of existing official data.
    const { error } = await context.supabase.from(data.kind as CatalogKind).insert(rows as never);
    if (error) throw new Error("No se importó ninguna fila. Actualice la vista previa y compruebe duplicados o permisos.");
    return { imported: rows.length };
  });