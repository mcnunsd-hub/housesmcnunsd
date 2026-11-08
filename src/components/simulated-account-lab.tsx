import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { FlaskConical, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSimulatedAuditAccount, validateSimulatedAuditPermission } from "@/lib/audit-lab.functions";
import { auditActions, auditActionLabels, auditRoleLabels, auditRoles, type AuditAction, type AuditRole } from "@/lib/audit-lab";

const STORAGE_KEY = "mcnun.audit-lab.simulation.v1";
const accountSchema = z.object({ id: z.string().uuid(), full_name: z.string().max(80), email: z.string().max(120), role: z.enum(auditRoles), createdAt: z.string() });
const eventSchema = z.object({ id: z.string(), at: z.string(), summary: z.string().max(400), allowed: z.boolean().nullable() });
const storageSchema = z.object({ accounts: z.array(accountSchema).max(20), events: z.array(eventSchema).max(100) });
type Account = z.infer<typeof accountSchema>;
type AuditEvent = z.infer<typeof eventSchema>;

export function SimulatedAccountLab() {
  const create = useServerFn(createSimulatedAuditAccount);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [fullName, setFullName] = useState("Delegado de Prueba");
  const [email, setEmail] = useState("delegado.prueba@example.com");
  const [role, setRole] = useState<AuditRole>("delegate");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { const parsed = storageSchema.safeParse(JSON.parse(raw)); if (parsed.success) { setAccounts(parsed.data.accounts); setEvents(parsed.data.events); } }
    } catch { /* Invalid local simulation data is ignored, never sent to the backend. */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify({ accounts, events })); }, [loaded, accounts, events]);

  const record = (summary: string, allowed: boolean | null = null) => setEvents(current => [{ id: crypto.randomUUID(), at: new Date().toISOString(), summary, allowed }, ...current].slice(0, 100));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const result = await create({ data: { full_name: fullName, email, role } });
      if (accounts.some(item => item.email === email)) throw new Error("Ya existe una persona simulada con ese correo local.");
      setAccounts(current => [result.account, ...current].slice(0, 20));
      record(`Persona ficticia creada localmente: ${result.account.full_name} · ${auditRoleLabels[result.account.role]}`);
      setMessage(result.notice);
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "No se pudo crear la persona simulada."); }
    finally { setBusy(false); }
  };

  return <section className="rounded-lg border border-border bg-card/40 p-5">
    <div className="flex items-start gap-3"><FlaskConical className="mt-1 size-5 text-muted-foreground" aria-hidden /><div>
      <h2 className="font-semibold">Cuentas ficticias simuladas</h2>
      <p className="mt-1 text-xs text-muted-foreground">Exclusivo para Super Admin. Se guardan solo en este navegador; no existen en Auth, no tienen contraseña y no permiten iniciar sesión.</p>
    </div></div>
    <div role="note" className="mt-4 rounded border border-primary/40 bg-primary/10 p-3 text-xs">La validación comprueba la regla del rol en servidor. No ejecuta la acción real ni escribe en producción. El historial es local y puede borrarse.</div>
    <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2">
      <div className="space-y-1"><Label htmlFor="simulated-name">Nombre ficticio</Label><Input id="simulated-name" value={fullName} maxLength={80} onChange={event => setFullName(event.target.value)} required /></div>
      <div className="space-y-1"><Label htmlFor="simulated-email">Correo ficticio @example.com</Label><Input id="simulated-email" type="email" value={email} onChange={event => setEmail(event.target.value)} required /></div>
      <div className="space-y-1"><Label htmlFor="simulated-role">Rol a simular</Label><select id="simulated-role" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={role} onChange={event => setRole(event.target.value as AuditRole)}>{auditRoles.map(item => <option key={item} value={item}>{auditRoleLabels[item]}</option>)}</select></div>
      <div className="flex items-end"><Button type="submit" disabled={busy || accounts.length >= 20}>{busy ? "Validando…" : "Crear persona simulada"}</Button></div>
    </form>
    {message && <p role="status" className="mt-3 text-xs text-muted-foreground">{message}</p>}
    <div className="mt-6 space-y-3">{accounts.map(account => <AccountRow key={account.id} account={account} onDecision={(action, allowed, reason) => record(`${account.full_name} · ${auditActionLabels[action]} · ${reason}`, allowed)} />)}
      {!accounts.length && <p className="rounded border border-dashed border-border p-5 text-center text-xs text-muted-foreground">No hay personas ficticias en este navegador.</p>}</div>
    <div className="mt-6 border-t border-border pt-5"><div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="size-4" />Historial local</h3>
      <Button type="button" size="sm" variant="ghost" disabled={!accounts.length && !events.length} onClick={() => { if (window.confirm("¿Borrar las personas simuladas y el historial local?")) { setAccounts([]); setEvents([]); } }}><Trash2 className="mr-2 size-4" />Borrar</Button></div>
      <div className="mt-3 max-h-72 space-y-2 overflow-auto">{events.map(event => <div key={event.id} className="rounded border border-border p-3 text-xs"><div className="flex justify-between gap-3"><span className={event.allowed === null ? "text-muted-foreground" : event.allowed ? "text-foreground" : "text-destructive"}>{event.allowed === null ? "Registro local" : event.allowed ? "Permitido por la regla" : "Denegado por la regla"}</span><time className="shrink-0 text-muted-foreground">{new Date(event.at).toLocaleString("es-DO")}</time></div><p className="mt-1 text-muted-foreground">{event.summary}</p></div>)}
        {!events.length && <p className="text-xs text-muted-foreground">Aún no hay acciones registradas localmente.</p>}</div></div>
  </section>;
}

function AccountRow({ account, onDecision }: { account: Account; onDecision: (action: AuditAction, allowed: boolean, reason: string) => void }) {
  const validate = useServerFn(validateSimulatedAuditPermission);
  const [action, setAction] = useState<AuditAction>("admin_panel");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const check = async () => {
    setBusy(true); setResult("");
    try { const decision = await validate({ data: { accountId: account.id, role: account.role, action } }); setResult(decision.reason); onDecision(action, decision.allowed, decision.reason); }
    catch (cause) { setResult(cause instanceof Error ? cause.message : "No se pudo validar."); }
    finally { setBusy(false); }
  };
  return <article className="rounded border border-border p-4"><div className="flex flex-wrap justify-between gap-2"><div><p className="text-sm font-medium">{account.full_name}</p><p className="text-xs text-muted-foreground">{account.email}</p></div><span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{auditRoleLabels[account.role]}</span></div>
    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]"><select aria-label={`Acción para ${account.full_name}`} className="h-10 rounded-md border border-input bg-background px-3 text-xs" value={action} onChange={event => setAction(event.target.value as AuditAction)}>{auditActions.map(item => <option key={item} value={item}>{auditActionLabels[item]}</option>)}</select><Button type="button" variant="outline" onClick={check} disabled={busy}>{busy ? "Validando…" : "Validar en servidor"}</Button></div>
    {result && <p role="status" className="mt-2 text-xs text-muted-foreground">{result}</p>}</article>;
}
