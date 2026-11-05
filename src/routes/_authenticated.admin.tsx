import { pageMeta } from "@/lib/page-meta";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  getAdminOverview, setAppSetting,
  upsertMission, deleteMission, listAllMissions,
  upsertTriviaQuestion, deleteTriviaQuestion, listAllTrivia,
  assignRoleByEmail, revokeRole,
} from "@/lib/admin.functions";
import { HOUSES, type HouseId } from "@/lib/houses";
import { HouseCrest } from "@/components/house-crest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RegistrationAdmin } from "@/components/admin-registration";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => pageMeta("Panel de Administración — MCNUN Houses", "Administración autorizada de MCNUN Houses."),
  component: AdminPage,
});

type Tab = "overview" | "registration" | "houses" | "trivia" | "missions" | "roles" | "settings";

function AdminPage() {
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const fetchOverview = useServerFn(getAdminOverview);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fetchOverview(),
    retry: false,
  });

  if (isLoading) return <div className="p-10 text-center text-sm text-muted-foreground">Cargando…</div>;
  if (error) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <p className="text-sm text-destructive">{(error as Error).message}</p>
        <Button variant="outline" className="mt-4" onClick={() => nav({ to: "/portal" })}>Volver</Button>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">MCNUN</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Panel de Administración</h1>
        </div>
        <Link to="/portal" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">← Portal</Link>
      </header>

      <nav className="mt-6 flex flex-wrap gap-2 border-b border-border">
        {([
          ["overview", "Resumen"],
          ["registration", "Registro"],
          ["houses", "Casas"],
          ["trivia", "Trivia"],
          ["missions", "Misiones"],
          ["roles", "Roles"],
          ["settings", "Ajustes"],
        ] as const).map(([k, l]) => (
          <Button variant="ghost"
            key={k}
            onClick={() => setTab(k)}
            className={`px-3 py-2 text-xs uppercase tracking-[0.2em] border-b-2 -mb-px ${
              tab === k ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >{l}</Button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "overview" && <OverviewTab data={data} />}
        {tab === "registration" && <RegistrationAdmin />}
        {tab === "houses" && <HousesTab data={data} />}
        {tab === "trivia" && <TriviaTab />}
        {tab === "missions" && <MissionsTab />}
        {tab === "roles" && <RolesTab data={data} />}
        {tab === "settings" && <SettingsTab data={data} />}
      </div>
    </div>
  );
}

// ---------- Overview ----------
function OverviewTab({ data }: { data: any }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Delegados totales" value={data.totalDelegates} />
      <Stat label="Sin casa" value={data.unsorted} />
      <Stat label="Misiones pendientes" value={data.pendingMissions} />
      <Stat label="Check-ins totales" value={data.totalCheckins} />
      <div className="sm:col-span-2 lg:col-span-4 rounded border border-border bg-card/40 p-4">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Puntuación por casa</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(["atlas","aurora","summit","eclipse"] as HouseId[]).map((h) => (
            <div key={h} data-house={h} className="rounded border border-border p-3 house-radial-bg">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 text-[color:var(--house-accent)]"><HouseCrest house={h} className="h-full w-full" /></div>
                <div>
                  <p className="text-xs font-medium">{HOUSES[h].name}</p>
                  <p className="text-[10px] text-muted-foreground">{data.houseStats[h].delegates} delegados</p>
                </div>
              </div>
              <p className="mt-3 text-2xl font-semibold">{data.houseStats[h].points}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">puntos</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-border bg-card/40 p-4">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

// ---------- Houses ----------
function HousesTab({ data }: { data: any }) {
  const houses: HouseId[] = ["atlas", "aurora", "summit", "eclipse"];
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {houses.map((h) => {
          const s = data.houseStats[h];
          return (
            <div key={h} data-house={h} className="rounded border border-border bg-card/40 p-4 house-radial-bg">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 text-[color:var(--house-accent)]"><HouseCrest house={h} className="h-full w-full" /></div>
                <div>
                  <p className="font-medium">{HOUSES[h].name}</p>
                  <p className="text-[10px] italic text-[color:var(--house-accent)]">{HOUSES[h].tagline}</p>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div><dt className="text-muted-foreground text-[10px] uppercase">Delegados</dt><dd className="font-medium">{s.delegates}</dd></div>
                <div><dt className="text-muted-foreground text-[10px] uppercase">Puntos</dt><dd className="font-medium">{s.points}</dd></div>
                <div><dt className="text-muted-foreground text-[10px] uppercase">Avanzados</dt><dd className="font-medium">{s.advanced}</dd></div>
                <div><dt className="text-muted-foreground text-[10px] uppercase">Novatos</dt><dd className="font-medium">{s.first_timer}</dd></div>
              </dl>
            </div>
          );
        })}
      </div>

      <div className="rounded border border-border bg-card/40 overflow-hidden">
        <p className="border-b border-border px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Delegados ({data.profiles.length})</p>
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground bg-muted/30">
              <tr><th className="p-2">Nombre</th><th className="p-2">Casa</th><th className="p-2">Nivel</th><th className="p-2">Comité</th><th className="p-2">País</th></tr>
            </thead>
            <tbody>
              {data.profiles.map((p: any) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-2 font-medium">{p.full_name ?? "—"}</td>
                  <td className="p-2">{p.house ? HOUSES[p.house as HouseId]?.name : <span className="text-muted-foreground">—</span>}</td>
                  <td className="p-2">{p.seniority_tier === "advanced" ? "Avanzado" : "Novato"}</td>
                  <td className="p-2 text-muted-foreground">{p.committee ?? "—"}</td>
                  <td className="p-2 text-muted-foreground">{p.country ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------- Settings ----------
function SettingsTab({ data }: { data: any }) {
  const qc = useQueryClient();
  const setFn = useServerFn(setAppSetting);
  const m = useMutation({
    mutationFn: (v: { key: "trivia_unlocked" | "scores_locked"; value: "true" | "false" }) => setFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-overview"] }); toast.success("Actualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const triviaOn = data.settings.trivia_unlocked === "true";
  const scoresLocked = data.settings.scores_locked === "true";

  return (
    <div className="space-y-4 max-w-xl">
      <Row label="Trivia abierta" hint="Permite a los delegados jugar la trivia.">
        <Switch checked={triviaOn} onCheckedChange={(v) => m.mutate({ key: "trivia_unlocked", value: v ? "true" : "false" })} />
      </Row>
      <Row label="Marcador bloqueado" hint="Congela los puntajes para la ceremonia de cierre.">
        <Switch checked={scoresLocked} onCheckedChange={(v) => m.mutate({ key: "scores_locked", value: v ? "true" : "false" })} />
      </Row>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded border border-border bg-card/40 p-4">
      <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{hint}</p></div>
      {children}
    </div>
  );
}

// ---------- Missions ----------
function MissionsTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAllMissions);
  const upsertFn = useServerFn(upsertMission);
  const delFn = useServerFn(deleteMission);
  const { data } = useQuery({ queryKey: ["admin-missions"], queryFn: () => listFn() });
  const [editing, setEditing] = useState<any | null>(null);

  const blank = { title: "", description: "", points: 25, requires_proof: true, active: true };

  const save = useMutation({
    mutationFn: (m: any) => upsertFn({ data: m }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-missions"] }); setEditing(null); toast.success("Misión guardada"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-missions"] }); toast.success("Eliminada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="rounded border border-border bg-card/40">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Misiones ({data?.missions.length ?? 0})</p>
          <Button size="sm" onClick={() => setEditing({ ...blank })}>+ Nueva</Button>
        </div>
        <div className="divide-y divide-border max-h-[70vh] overflow-auto">
          {(data?.missions ?? []).map((m: any) => (
            <div key={m.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{m.title} <span className="text-[10px] text-muted-foreground">· {m.points} pts {m.active ? "" : "· inactiva"}</span></p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setEditing(m)}>Editar</Button>
                  <Button size="sm" variant="destructive" onClick={() => { if (confirm("¿Eliminar?")) remove.mutate(m.id); }}>×</Button>
                </div>
              </div>
            </div>
          ))}
          {(!data?.missions || data.missions.length === 0) && (
            <p className="p-6 text-center text-xs text-muted-foreground">Sin misiones aún.</p>
          )}
        </div>
      </div>

      {editing && (
        <div className="rounded border border-border bg-card/40 p-4 space-y-3 self-start">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{editing.id ? "Editar" : "Nueva"} misión</p>
          <div><Label>Título</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
          <div><Label>Descripción</Label><Textarea rows={5} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Puntos</Label><Input type="number" value={editing.points} onChange={(e) => setEditing({ ...editing, points: Number(e.target.value) })} /></div>
            <div className="flex items-end gap-2"><Switch checked={editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} /><span className="text-xs">Activa</span></div>
          </div>
          <div className="flex items-center gap-2"><Switch checked={editing.requires_proof} onCheckedChange={(v) => setEditing({ ...editing, requires_proof: v })} /><span className="text-xs">Requiere prueba</span></div>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => save.mutate(editing)} disabled={save.isPending}>Guardar</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Trivia ----------
function TriviaTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAllTrivia);
  const upsertFn = useServerFn(upsertTriviaQuestion);
  const delFn = useServerFn(deleteTriviaQuestion);
  const { data } = useQuery({ queryKey: ["admin-trivia"], queryFn: () => listFn() });
  const [editing, setEditing] = useState<any | null>(null);

  const blank = {
    question_text: "",
    options: [
      { letter: "A", text: "" }, { letter: "B", text: "" },
      { letter: "C", text: "" }, { letter: "D", text: "" },
    ],
    correct_answer: "A",
    points: 10,
    order_index: (data?.questions.length ?? 0),
  };

  const save = useMutation({
    mutationFn: (q: any) => upsertFn({ data: q }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-trivia"] }); setEditing(null); toast.success("Pregunta guardada"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-trivia"] }); toast.success("Eliminada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
      <div className="rounded border border-border bg-card/40">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Preguntas ({data?.questions.length ?? 0})</p>
          <Button size="sm" onClick={() => setEditing({ ...blank })}>+ Nueva</Button>
        </div>
        <div className="divide-y divide-border max-h-[70vh] overflow-auto">
          {(data?.questions ?? []).map((q: any) => (
            <div key={q.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">#{q.order_index} · {q.points} pts · correcta {q.correct_answer}</p>
                  <p className="font-medium text-sm mt-1">{q.question_text}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setEditing(q)}>Editar</Button>
                  <Button size="sm" variant="destructive" onClick={() => { if (confirm("¿Eliminar?")) remove.mutate(q.id); }}>×</Button>
                </div>
              </div>
            </div>
          ))}
          {(!data?.questions || data.questions.length === 0) && (
            <p className="p-6 text-center text-xs text-muted-foreground">Sin preguntas aún.</p>
          )}
        </div>
      </div>

      {editing && (
        <div className="rounded border border-border bg-card/40 p-4 space-y-3 self-start">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{editing.id ? "Editar" : "Nueva"} pregunta</p>
          <div><Label>Enunciado</Label><Textarea rows={3} value={editing.question_text} onChange={(e) => setEditing({ ...editing, question_text: e.target.value })} /></div>
          {(editing.options as any[]).map((o: any, i: number) => (
            <div key={o.letter} className="flex items-center gap-2">
              <span className="w-6 text-sm font-mono">{o.letter}</span>
              <Input value={o.text} onChange={(e) => {
                const opts = [...editing.options];
                opts[i] = { ...opts[i], text: e.target.value };
                setEditing({ ...editing, options: opts });
              }} />
              <input type="radio" name="correct" checked={editing.correct_answer === o.letter}
                onChange={() => setEditing({ ...editing, correct_answer: o.letter })} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Puntos</Label><Input type="number" value={editing.points} onChange={(e) => setEditing({ ...editing, points: Number(e.target.value) })} /></div>
            <div><Label>Orden</Label><Input type="number" value={editing.order_index} onChange={(e) => setEditing({ ...editing, order_index: Number(e.target.value) })} /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => save.mutate(editing)} disabled={save.isPending}>Guardar</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Roles ----------
function RolesTab({ data }: { data: any }) {
  const qc = useQueryClient();
  const assignFn = useServerFn(assignRoleByEmail);
  const revokeFn = useServerFn(revokeRole);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"delegate" | "mesa" | "profesor" | "staff" | "admin" | "super_admin">("staff");

  const assign = useMutation({
    mutationFn: () => assignFn({ data: { email, role } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-overview"] }); setEmail(""); toast.success("Rol asignado"); },
    onError: (e: Error) => toast.error(e.message.includes("row-level") ? "No tienes permiso para asignar ese rol." : e.message),
  });
  const revoke = useMutation({
    mutationFn: (id: string) => revokeFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-overview"] }); toast.success("Rol revocado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="rounded border border-border bg-card/40 p-4 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Asignar rol</p>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 min-w-[200px]" />
          <select value={role} onChange={(e) => setRole(e.target.value as any)} className="rounded border border-border bg-background px-3 text-sm">
            <option value="delegate">Delegado</option>
            <option value="mesa">Mesa Directiva</option>
            <option value="profesor">Profesor</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <Button onClick={() => assign.mutate()} disabled={!email || assign.isPending}>Asignar</Button>
        </div>
        <p className="text-[10px] text-muted-foreground">El usuario debe haberse registrado antes. Solo un Super Admin puede otorgar Admin o Super Admin. Cada cambio queda en el registro de auditoría.</p>
      </div>

      <div className="rounded border border-border bg-card/40 overflow-hidden">
        <p className="border-b border-border px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Roles activos</p>
        <table className="w-full text-xs">
          <thead className="text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground bg-muted/30">
            <tr><th className="p-2">Nombre</th><th className="p-2">Rol</th><th className="p-2"></th></tr>
          </thead>
          <tbody>
            {data.roles.map((r: any) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-2 font-medium">{r.name}</td>
                <td className="p-2 uppercase tracking-[0.15em]">{r.role}</td>
                <td className="p-2 text-right">
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("¿Revocar rol?")) revoke.mutate(r.id); }}>Revocar</Button>
                </td>
              </tr>
            ))}
            {data.roles.length === 0 && (
              <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">Sin roles asignados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
