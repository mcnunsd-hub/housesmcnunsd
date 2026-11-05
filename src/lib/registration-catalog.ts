import { z } from "zod";

export const catalogKinds = ["committees", "delegations", "mesa_roster", "invite_codes"] as const;
export type CatalogKind = typeof catalogKinds[number];
export type CatalogRow = { id: string; name?: string; active?: boolean; sort_order?: number; committee_id?: string; country?: string; full_name?: string; position?: string; claimed_by?: string | null; code?: string; participant_type?: string; uses?: number; max_uses?: number | null };
export type Catalogs = Record<CatalogKind, CatalogRow[]>;
export const catalogLabels: Record<CatalogKind, string> = { committees: "Comités", delegations: "Delegaciones", mesa_roster: "Mesa Directiva", invite_codes: "Invitaciones" };
export const catalogFields: Record<CatalogKind, string[]> = {
  committees: ["name", "active", "sort_order"], delegations: ["committee", "country"],
  mesa_roster: ["committee", "full_name", "position"], invite_codes: ["code", "participant_type", "active", "max_uses"],
};
const text = (max: number) => z.string().trim().min(1, "Campo obligatorio").max(max, `Máximo ${max} caracteres`);
const schemas = {
  committees: z.object({ name: text(120), active: z.boolean(), sort_order: z.number().int().min(0).max(10000) }).strict(),
  delegations: z.object({ committee_id: z.string().uuid("Seleccione un comité"), country: text(120) }).strict(),
  mesa_roster: z.object({ committee_id: z.string().uuid("Seleccione un comité"), full_name: text(120), position: text(60) }).strict(),
  invite_codes: z.object({ code: text(40).min(4).regex(/^[A-Z0-9_-]+$/, "Use letras, números, guion o guion bajo"), participant_type: z.enum(["staff", "profesor"]), active: z.boolean(), max_uses: z.number().int().min(1).max(1000000).nullable() }).strict(),
};
export const normalize = (s: unknown) => String(s ?? "").trim().normalize("NFKC").toLocaleLowerCase("es");
export function rowKey(kind: CatalogKind, row: Record<string, unknown>) {
  const fields = kind === "committees" ? ["name"] : kind === "delegations" ? ["committee_id", "country"] : kind === "mesa_roster" ? ["committee_id", "full_name", "position"] : ["code"];
  return JSON.stringify(fields.map(f => normalize(row[f])));
}
export function validateCatalogRow(kind: CatalogKind, input: Record<string, unknown>, catalogs: Catalogs, editingId?: string) {
  const parsed = schemas[kind].safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; "));
  const row = parsed.data;
  if ("committee_id" in row && !catalogs.committees.some(c => c.id === row.committee_id)) throw new Error("Comité inexistente");
  if (catalogs[kind].some(r => r.id !== editingId && rowKey(kind, r) === rowKey(kind, row))) throw new Error("Registro duplicado");
  return row;
}
function booleanValue(value: unknown) {
  if (["true", "sí", "si", "1"].includes(normalize(value))) return true;
  if (["false", "no", "0"].includes(normalize(value))) return false;
  throw new Error("active: indique true o false");
}
export function previewImport(kind: CatalogKind, rows: Record<string, unknown>[], catalogs: Catalogs) {
  const seen = new Set<string>();
  return rows.map((source, index) => {
    try {
      const row: Record<string, unknown> = {};
      for (const field of catalogFields[kind]) {
        const raw = source[field];
        if (field === "committee") {
          const matches = catalogs.committees.filter(c => normalize(c.name) === normalize(raw));
          if (matches.length !== 1) throw new Error("committee: comité no encontrado o ambiguo");
          row.committee_id = matches[0]?.id;
        } else if (field === "active") row[field] = booleanValue(raw);
        else if (field === "sort_order") {
          if (String(raw ?? "").trim() === "") throw new Error("sort_order: campo obligatorio");
          row[field] = Number(raw);
        } else if (field === "max_uses") row[field] = String(raw ?? "").trim() === "" ? null : Number(raw);
        else row[field] = String(raw ?? "").trim();
      }
      const payload = validateCatalogRow(kind, row, catalogs);
      const key = rowKey(kind, payload);
      if (seen.has(key)) throw new Error("Registro duplicado dentro del archivo");
      seen.add(key);
      return { line: index + 2, source, payload, error: "" };
    } catch (error) { return { line: index + 2, source, payload: null, error: error instanceof Error ? error.message : "Fila inválida" }; }
  });
}