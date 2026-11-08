import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { generateAuditCases } from "@/lib/audit-lab.functions";
import { auditRoleLabels, type AuditCase, type AuditRole } from "@/lib/audit-lab";

const selectableRoles: AuditRole[] = ["delegate", "mesa", "profesor", "staff", "admin", "super_admin"];
const riskLabels = { authorization: "Autorización", privacy: "Privacidad", data_integrity: "Integridad", workflow: "Flujo" };

export function AuditCaseGenerator() {
  const generate = useServerFn(generateAuditCases);
  const [description, setDescription] = useState("");
  const [roles, setRoles] = useState<AuditRole[]>(["delegate", "mesa"]);
  const [cases, setCases] = useState<AuditCase[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggleRole = (role: AuditRole) => setRoles(current => current.includes(role)
    ? current.filter(item => item !== role)
    : current.length < 4 ? [...current, role] : current);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const result = await generate({ data: { description, roles } });
      setCases(result.cases);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudieron generar los casos."); }
    finally { setBusy(false); }
  };

  return <section className="rounded-lg border border-border bg-card/40 p-5">
    <div className="flex items-start gap-3"><Sparkles className="mt-1 size-5 text-muted-foreground" aria-hidden /><div>
      <h2 className="font-semibold">Generador de casos de prueba</h2>
      <p className="mt-1 text-xs text-muted-foreground">Describe un flujo y obtén propuestas verificables. No incluyas nombres reales, códigos ni credenciales.</p>
    </div></div>
    <form onSubmit={submit} className="mt-5 space-y-4">
      <div className="space-y-2"><Label htmlFor="audit-flow">Flujo de auditoría</Label>
        <Textarea id="audit-flow" rows={4} maxLength={1500} required value={description} onChange={event => setDescription(event.target.value)} placeholder="Ejemplo: un Delegado registrado intenta acceder al panel administrativo y consultar afiliaciones de otros participantes." />
        <p className="text-right text-[10px] text-muted-foreground">{description.length}/1500</p></div>
      <fieldset><legend className="text-xs font-medium">Roles a contrastar (máximo 4)</legend><div className="mt-2 flex flex-wrap gap-2">
        {selectableRoles.map(role => <label key={role} className={`cursor-pointer rounded border px-3 py-2 text-xs ${roles.includes(role) ? "border-primary bg-primary/10" : "border-border"}`}>
          <input type="checkbox" className="sr-only" checked={roles.includes(role)} onChange={() => toggleRole(role)} />{auditRoleLabels[role]}
        </label>)}
      </div></fieldset>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy || description.trim().length < 10 || roles.length === 0}>{busy ? "Generando casos…" : "Generar casos seguros"}</Button>
    </form>
    {cases.length > 0 && <div className="mt-6 space-y-4" aria-live="polite">
      <p className="text-xs text-muted-foreground">Propuestas generadas; no representan pruebas ejecutadas ni resultados aprobados.</p>
      {cases.map((item, index) => <article key={item.id} className="rounded border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Caso {index + 1} · {auditRoleLabels[item.role]} · {riskLabels[item.risk]}</p></div>
        <h3 className="mt-2 font-medium">{item.title}</h3><p className="mt-2 text-sm text-muted-foreground">{item.objective}</p>
        <AuditList title="Preparación" items={item.setup} /><AuditList title="Pasos" items={item.steps} ordered />
        <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2"><div><p className="font-medium">Resultado esperado</p><p className="mt-1 text-muted-foreground">{item.expected_result}</p></div>
          <div><p className="font-medium">Comprobación</p><p className="mt-1 text-muted-foreground">{item.verification}</p></div></div>
        <p className="mt-3 text-xs"><span className="font-medium">Resultado prohibido: </span><span className="text-muted-foreground">{item.forbidden_outcome}</span></p>
      </article>)}
    </div>}
  </section>;
}

function AuditList({ title, items, ordered = false }: { title: string; items: string[]; ordered?: boolean }) {
  const List = ordered ? "ol" : "ul";
  return <div className="mt-4"><p className="text-xs font-medium">{title}</p><List className={`mt-2 space-y-1 pl-5 text-xs text-muted-foreground ${ordered ? "list-decimal" : "list-disc"}`}>{items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</List></div>;
}
