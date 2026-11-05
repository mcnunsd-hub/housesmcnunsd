import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, Upload, Plus, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { catalogKinds, catalogLabels, catalogFields, previewImport, validateCatalogRow, type CatalogKind, type CatalogRow } from "@/lib/registration-catalog";
import { getRegistrationCatalogs, saveRegistrationCatalog, importRegistrationCatalog } from "@/lib/registration-admin.functions";
import { readCatalogFile, downloadText, csvText } from "@/lib/registration-file";

const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const labels: Record<string, string> = { name: "Nombre del comité", active: "Estado", sort_order: "Orden", committee_id: "Comité", country: "País / delegación", full_name: "Nombre oficial", position: "Cargo oficial", code: "Código", participant_type: "Tipo de participante", max_uses: "Máximo de usos (vacío = ilimitado)" };
export function RegistrationCatalogAdmin() {
  const qc = useQueryClient();
  const load = useServerFn(getRegistrationCatalogs);
  const save = useServerFn(saveRegistrationCatalog);
  const bulk = useServerFn(importRegistrationCatalog);
  const query = useQuery({ queryKey: ["registration-catalogs"], queryFn: () => load(), retry: false });
  const [kind, setKind] = useState<CatalogKind>("committees");
  const [editing, setEditing] = useState<{ id?: string; values: Record<string, string> } | null>(null);
  const [preview, setPreview] = useState<ReturnType<typeof previewImport> | null>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const catalogs = query.data;
  const refresh = async () => { await Promise.all([qc.invalidateQueries({ queryKey: ["registration-catalogs"] }), qc.invalidateQueries({ queryKey: ["adm"] })]); };
  const open = (row?: CatalogRow) => {
    const values: Record<string, string> = {};
    catalogFields[kind].map(f => f === "committee" ? "committee_id" : f).forEach(f => { const value = row?.[f as keyof CatalogRow]; values[f] = value === undefined || value === null ? "" : String(value); });
    setEditing({ id: row?.id, values }); setMessage("");
  };
  const submit = async () => {
    if (!editing || !catalogs) return;
    setBusy(true); setMessage("");
    try {
      const row: Record<string, unknown> = { ...editing.values };
      for (const f of ["active", "sort_order", "max_uses"]) {
        if (!(f in row)) continue;
        if (f === "active") { if (row[f] !== "true" && row[f] !== "false") throw new Error("Seleccione el estado."); row[f] = row[f] === "true"; }
        else { if (f === "sort_order" && row[f] === "") throw new Error("Indique el orden."); row[f] = row[f] === "" ? null : Number(row[f]); }
      }
      validateCatalogRow(kind, row, catalogs, editing.id);
      await save({ data: { kind, id: editing.id, row } });
      await refresh(); setEditing(null); toast.success("Registro guardado");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar."); }
    finally { setBusy(false); }
  };
  const chooseFile = async (file?: File) => {
    if (!file || !catalogs) return;
    setBusy(true); setMessage(""); setPreview(null);
    try { const rows = await readCatalogFile(file, kind); setPreview(previewImport(kind, rows, catalogs)); setFileName(file.name); }
    catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo leer el archivo."); }
    finally { setBusy(false); if (fileInput.current) fileInput.current.value = ""; }
  };
  const importRows = async () => {
    if (!preview || preview.some(r => r.error)) return;
    if (!window.confirm(`¿Confirma la creación de ${preview.length} registros nuevos? No se reemplazarán registros existentes.`)) return;
    setBusy(true); setMessage("");
    try {
      const rows = preview.flatMap(r => r.payload ? [r.payload] : []);
      const result = await bulk({ data: { kind, rows } });
      await refresh(); setPreview(null); toast.success(`${result.imported} registros importados`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se importó ninguna fila."); }
    finally { setBusy(false); }
  };
  if (query.isPending) return <p role="status" className="text-sm text-muted-foreground">Cargando registro administrativo…</p>;
  if (!catalogs) return <div role="alert" className="space-y-3"><p className="text-destructive">{query.error?.message ?? "Catálogos no disponibles"}</p><Button variant="outline" onClick={() => query.refetch()}>Reintentar</Button></div>;
  const rows = catalogs[kind];
  const errors = preview?.filter(r => r.error) ?? [];
  const committeeName = (id?: string) => catalogs.committees.find(c => c.id === id)?.name ?? "—";
  return <section className="space-y-5">
    <div className="flex flex-wrap gap-2" aria-label="Catálogos de registro">
      {catalogKinds.map(k => <Button key={k} variant={kind === k ? "default" : "outline"} disabled={busy} onClick={() => { setKind(k); setPreview(null); setMessage(""); }}>{catalogLabels[k]} ({catalogs[k].length})</Button>)}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-semibold">{catalogLabels[kind]}</h2>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="icon" aria-label="Actualizar catálogos" title="Actualizar" disabled={busy} onClick={refresh}><RefreshCw className="size-4" /></Button>
        <Button variant="outline" disabled={busy} onClick={() => downloadText(`MCNUN-${kind}-plantilla.csv`, csvText([catalogFields[kind]]))}><Download className="mr-2 size-4" />Plantilla CSV</Button>
        <Button variant="outline" disabled={busy} onClick={() => fileInput.current?.click()}><Upload className="mr-2 size-4" />Importar CSV / Excel</Button>
        <Button disabled={busy} onClick={() => open()}><Plus className="mr-2 size-4" />Añadir</Button>
      </div>
      <input ref={fileInput} type="file" accept=".csv,.xlsx" className="hidden" aria-label="Archivo de catálogo" onChange={e => chooseFile(e.target.files?.[0])} />
    </div>
    {busy && <p role="status" className="text-sm text-muted-foreground">Procesando…</p>}
    {message && !editing && <p role="alert" className="text-sm text-destructive">{message}</p>}
    {preview && <section className="space-y-3 border-y border-border py-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="break-all text-sm font-semibold">Vista previa: {fileName}</h3><span className="text-xs text-muted-foreground">{preview.length} filas · {errors.length} errores</span></div>
      <div className="max-h-80 overflow-auto"><table className="w-full text-left text-xs"><thead><tr><th className="p-2">Fila</th><th className="p-2">Datos</th><th className="p-2">Validación</th></tr></thead><tbody>{preview.map(r => <tr key={r.line} className="border-t border-border"><td className="p-2">{r.line}</td><td className="max-w-sm break-words p-2">{Object.values(r.source).map(String).join(" · ")}</td><td className={`p-2 ${r.error ? "text-destructive" : "text-muted-foreground"}`}>{r.error || "Válido"}</td></tr>)}</tbody></table></div>
      <div className="flex flex-wrap gap-2"><Button disabled={busy || errors.length > 0} onClick={importRows}>Confirmar importación ({preview.length})</Button><Button variant="outline" disabled={busy} onClick={() => setPreview(null)}>Cancelar</Button>{errors.length > 0 && <Button variant="outline" onClick={() => downloadText("MCNUN-errores.csv", csvText([["fila", "error"], ...errors.map(r => [r.line, r.error])]))}><Download className="mr-2 size-4" />Reporte de errores</Button>}</div>
    </section>}
    <div className="overflow-x-auto border-y border-border">
      <table className="w-full text-left text-sm"><thead className="bg-muted/30 text-xs text-muted-foreground"><tr><th className="p-3">{kind === "invite_codes" ? "Código" : "Nombre"}</th><th className="p-3">Detalles</th><th className="p-3">Estado</th><th className="p-3"><span className="sr-only">Acciones</span></th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.id} className="border-t border-border"><td className="min-w-32 p-3">{row.name ?? row.country ?? row.full_name ?? row.code}</td><td className="min-w-36 p-3 text-muted-foreground">{kind === "committees" ? `Orden: ${row.sort_order}` : kind === "invite_codes" ? `${row.participant_type} · ${row.uses}/${row.max_uses ?? "∞"} usos` : `${committeeName(row.committee_id)}${row.position ? ` · ${row.position}` : ""}`}</td><td className="p-3 text-xs">{kind === "mesa_roster" ? row.claimed_by ? "Reclamado" : "Disponible" : typeof row.active === "boolean" ? row.active ? "Activo" : "Inactivo" : "—"}</td><td className="p-3"><Button size="icon" variant="ghost" aria-label={`Editar ${row.name ?? row.country ?? row.full_name ?? row.code}`} title={row.claimed_by ? "Puesto reclamado: no editable" : "Editar"} disabled={!!row.claimed_by || busy} onClick={() => open(row)}><Pencil className="size-4" /></Button></td></tr>)}
        {!rows.length && <tr><td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">No hay datos oficiales cargados.</td></tr>}</tbody></table>
    </div>
    <Dialog open={!!editing} onOpenChange={open => { if (!open && !busy) setEditing(null); }}><DialogContent className="max-h-[90svh] overflow-y-auto"><DialogHeader><DialogTitle>{editing?.id ? "Editar registro" : "Añadir registro"} · {catalogLabels[kind]}</DialogTitle><DialogDescription>Datos oficiales de MCNUN. No se modifican fichas ni asignaciones de House.</DialogDescription></DialogHeader>
      {editing && <form className="space-y-3" onSubmit={e => { e.preventDefault(); submit(); }}>
        {Object.keys(editing.values).map(field => <div key={field} className="space-y-1"><Label htmlFor={`catalog-${field}`}>{labels[field]}</Label>
          {field === "active" || field === "committee_id" || field === "participant_type" ? <select id={`catalog-${field}`} required className={selectClass} value={editing.values[field]} onChange={e => setEditing({ ...editing, values: { ...editing.values, [field]: e.target.value } })}><option value="">Seleccione…</option>{field === "active" ? <><option value="true">Activo</option><option value="false">Inactivo</option></> : field === "participant_type" ? <><option value="staff">Staff</option><option value="profesor">Profesor</option></> : catalogs.committees.map(c => <option key={c.id} value={c.id}>{c.name}{c.active ? "" : " (inactivo)"}</option>)}</select> : <Input id={`catalog-${field}`} value={editing.values[field]} required={field !== "max_uses"} type={field === "sort_order" || field === "max_uses" ? "number" : "text"} min={field === "max_uses" ? 1 : 0} maxLength={field === "code" ? 40 : field === "position" ? 60 : 120} onChange={e => setEditing({ ...editing, values: { ...editing.values, [field]: e.target.value } })} />}
        </div>)}
        {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
        <div className="flex gap-2 pt-3"><Button type="submit" disabled={busy}>Guardar</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setEditing(null)}>Cancelar</Button></div>
      </form>}
    </DialogContent></Dialog>
  </section>;
}