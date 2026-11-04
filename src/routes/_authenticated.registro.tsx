import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AccessSignOut } from "@/components/access-signout";
import { pageMeta } from "@/lib/page-meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/registro")({
  head: () => pageMeta("Registro de participante — MCNUN Houses", "Registro oficial de participantes de MCNUN 2026."),
  component: RegistroPage,
});

type PType = "delegado" | "mesa" | "staff" | "profesor";
const TYPES: { id: PType; label: string; hint: string }[] = [
  { id: "delegado", label: "Delegado", hint: "Participo representando una delegación" },
  { id: "mesa", label: "Mesa Directiva", hint: "Soy parte de la Mesa de un comité" },
  { id: "profesor", label: "Profesor", hint: "Acompaño a mi colegio (requiere código)" },
  { id: "staff", label: "Staff", hint: "Equipo operativo (requiere código)" },
];
const LEVELS = ["Principiante", "Intermedio", "Avanzado"] as const;

const base = z.object({
  full_name: z.string().trim().min(2, "Escribe tu nombre completo").max(120),
  school: z.string().trim().min(2, "Escribe tu colegio").max(120),
});

const sel = "flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm";

function RegistroPage() {
  const nav = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();

  const [type, setType] = useState<PType | null>(null);
  const [fullName, setFullName] = useState("");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  const [experience, setExperience] = useState<string>("");
  const [committeeId, setCommitteeId] = useState("");
  const [country, setCountry] = useState("");
  const [rosterId, setRosterId] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: committees = [] } = useQuery({
    queryKey: ["committees"],
    queryFn: async () => { const { data, error } = await supabase.from("committees").select("id,name").eq("active", true).order("sort_order"); if (error) throw error; return data ?? []; },
  });
  const { data: delegations = [] } = useQuery({
    queryKey: ["delegations", committeeId],
    enabled: !!committeeId,
    queryFn: async () => (await supabase.from("delegations").select("id,country").eq("committee_id", committeeId).order("country")).data ?? [],
  });
  const { data: roster = [] } = useQuery({
    queryKey: ["mesa-roster-open"],
    enabled: type === "mesa",
    queryFn: async () => ((await (supabase as any).rpc("available_mesa_roster")).data ?? []) as { id: string; full_name: string; committee_id: string; position: string }[],
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!type) return;
    const parsed = base.safeParse({ full_name: type === "mesa" ? "Mesa" : fullName, school });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (type === "delegado" && (!committeeId || !country || !experience)) return toast.error("Completa comité, delegación y experiencia");
    if (type === "mesa" && !rosterId) return toast.error("Elige tu puesto de Mesa");
    if ((type === "staff" || type === "profesor") && code.trim().length < 3) return toast.error("Escribe tu código de invitación");
    setBusy(true);
    try {
    // Generated RPC types mark optional SQL arguments as non-null; pass null
    // UUIDs via the existing RPC interface, never empty strings to PostgreSQL.
    const { error } = await (supabase as any).rpc("register_participant", {
      _type: type, _full_name: type === "mesa" ? "Mesa" : fullName.trim(), _school: school.trim(),
      _grade_level: grade.trim() || null, _experience: experience || null,
      _committee_id: committeeId || null, _country: country,
      _roster_id: rosterId || null, _code: code.trim() || null,
    });
    if (error) throw error;
    await qc.invalidateQueries();
    await router.invalidate();
    await nav({ to: "/portal", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible completar el registro. Intente nuevamente.");
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">MCNUN 2026 · Registro</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">¿Cómo participas?</h1>
      <p className="mt-2 text-sm text-muted-foreground">Registro incompleto. Complete su ficha para continuar.</p>
      <div className="mt-6 grid gap-2">
        {TYPES.map((t) => (
          <Button key={t.id} type="button" variant="outline" onClick={() => setType(t.id)}
            className={`h-auto flex-col items-start whitespace-normal px-4 py-3 text-left ${type === t.id ? "border-primary bg-primary/10" : "border-border bg-card/40 hover:bg-card/60"}`}>
            <span className="block text-sm font-medium">{t.label}</span>
            <span className="block text-xs text-muted-foreground">{t.hint}</span>
          </Button>
        ))}
      </div>

      {type && (
        <form onSubmit={submit} className="mt-8 space-y-4">
          {type !== "mesa" && <Field label="Nombre completo"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} /></Field>}
          <Field label="Colegio"><Input value={school} onChange={(e) => setSchool(e.target.value)} maxLength={120} /></Field>

          {type === "delegado" && (<>
            <Field label="Curso (opcional)"><Input value={grade} onChange={(e) => setGrade(e.target.value)} maxLength={40} /></Field>
            <Field label="Experiencia en modelos ONU">
              <select className={sel} value={experience} onChange={(e) => setExperience(e.target.value)}>
                <option value="">Elige…</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Comité">
              <select className={sel} value={committeeId} onChange={(e) => { setCommitteeId(e.target.value); setCountry(""); }}>
                <option value="">Elige…</option>{committees.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {committees.length === 0 && <p className="text-xs text-muted-foreground">Aún no hay comités publicados.</p>}
            </Field>
            {committeeId && (
              <Field label="Delegación">
                <select className={sel} value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="">Elige…</option>{delegations.map((d: any) => <option key={d.id} value={d.country}>{d.country}</option>)}
                </select>
              </Field>
            )}
          </>)}

          {type === "mesa" && (
            <Field label="Tu puesto en la Mesa">
              <select className={sel} value={rosterId} onChange={(e) => setRosterId(e.target.value)}>
                <option value="">Elige…</option>
                {roster.map((r) => <option key={r.id} value={r.id}>{r.full_name} — {r.position} · {committees.find((c: any) => c.id === r.committee_id)?.name ?? ""}</option>)}
              </select>
              {roster.length === 0 && <p className="text-xs text-muted-foreground">No hay puestos disponibles. Contacta al Secretariado.</p>}
            </Field>
          )}

          {(type === "staff" || type === "profesor") && (
            <Field label="Código de invitación"><Input value={code} onChange={(e) => setCode(e.target.value)} maxLength={40} /></Field>
          )}

          <Button type="submit" disabled={busy} className="w-full text-xs uppercase tracking-[0.2em]">
            {busy ? "Enviando…" : type === "delegado" ? "Continuar a la Ceremonia" : "Completar registro"}
          </Button>
        </form>
      )}
      <AccessSignOut />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
