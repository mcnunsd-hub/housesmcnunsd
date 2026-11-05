import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RegistrationCatalogAdmin } from "@/components/registration-catalog-admin";

const db = supabase as any;
const sel = "h-9 rounded-md border border-input bg-transparent px-2 text-xs";

function useList(key: string, fn: () => Promise<any[]>) {
  return useQuery({ queryKey: ["adm", key], queryFn: fn });
}

export function RegistrationAdmin() {
  return <RegistrationCatalogAdmin />;
}

// Retained for existing review workflows; catalog setup never changes participants or Houses.
export function LegacyRegistrationAdmin() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["adm"] });
  const run = async (p: PromiseLike<{ error: any }>, ok: string) => {
    const { error } = await p;
    if (error) toast.error(error.message); else { toast.success(ok); refresh(); }
  };

  const { data: committees = [] } = useList("committees", async () => (await db.from("committees").select("*").order("sort_order")).data ?? []);
  const { data: delegations = [] } = useList("delegations", async () => (await db.from("delegations").select("*").order("country")).data ?? []);
  const { data: roster = [] } = useList("roster", async () => (await db.from("mesa_roster").select("*").order("created_at")).data ?? []);
  const { data: codes = [] } = useList("codes", async () => (await db.from("invite_codes").select("*").order("created_at", { ascending: false })).data ?? []);
  const { data: pending = [] } = useList("pending", async () => (await db.from("participants").select("*").eq("status", "pending")).data ?? []);
  const { data: people = [] } = useList("people", async () => (await db.from("participants").select("user_id, full_name, participant_type, status")).data ?? []);

  const [cName, setCName] = useState("");
  const [dCom, setDCom] = useState(""); const [dCountry, setDCountry] = useState("");
  const [rName, setRName] = useState(""); const [rCom, setRCom] = useState(""); const [rPos, setRPos] = useState("");
  const [code, setCode] = useState(""); const [codeType, setCodeType] = useState("staff"); const [codeMax, setCodeMax] = useState("");
  const [oUser, setOUser] = useState(""); const [oHouse, setOHouse] = useState("atlas"); const [oReason, setOReason] = useState("");
  const cname = (id: string) => committees.find((c: any) => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-10">
      <Section title={`Solicitudes pendientes (${pending.length})`}>
        {pending.length === 0 && <Empty>No hay solicitudes pendientes.</Empty>}
        {pending.map((p: any) => (
          <Row key={p.user_id}>
            <span className="flex-1">{p.full_name} · <span className="text-muted-foreground">{p.participant_type} · {p.school ?? ""}</span></span>
            <Button size="sm" onClick={() => run(db.rpc("review_participant", { _user_id: p.user_id, _approve: true, _reason: null }), "Aprobado")}>Aprobar</Button>
            <Button size="sm" variant="outline" onClick={() => {
              const reason = prompt("Motivo del rechazo");
              if (reason) run(db.rpc("review_participant", { _user_id: p.user_id, _approve: false, _reason: reason }), "Rechazado");
            }}>Rechazar</Button>
          </Row>
        ))}
      </Section>

      <Section title="Comités">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (cName.trim()) run(db.from("committees").insert({ name: cName.trim().slice(0, 120), sort_order: committees.length }), "Comité creado").then(() => setCName("")); }}>
          <Input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Nombre del comité" maxLength={120} />
          <Button size="sm" type="submit">Añadir</Button>
        </form>
        {committees.map((c: any) => (
          <Row key={c.id}>
            <span className="flex-1">{c.name}</span>
            <Button size="sm" variant="outline" onClick={() => run(db.from("committees").update({ active: !c.active }).eq("id", c.id), "Actualizado")}>{c.active ? "Activo" : "Inactivo"}</Button>
          </Row>
        ))}
      </Section>

      <Section title="Delegaciones">
        <form className="flex flex-wrap gap-2" onSubmit={(e) => {
          e.preventDefault();
          const list = dCountry.split(",").map((s) => s.trim().slice(0, 120)).filter(Boolean);
          if (dCom && list.length) run(db.from("delegations").insert(list.map((country) => ({ committee_id: dCom, country }))), "Delegaciones añadidas").then(() => setDCountry(""));
        }}>
          <select className={sel} value={dCom} onChange={(e) => setDCom(e.target.value)}>
            <option value="">Comité…</option>{committees.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Input className="flex-1" value={dCountry} onChange={(e) => setDCountry(e.target.value)} placeholder="Países separados por coma" />
          <Button size="sm" type="submit">Añadir</Button>
        </form>
        {committees.map((c: any) => {
          const ds = delegations.filter((d: any) => d.committee_id === c.id);
          return ds.length ? <p key={c.id} className="text-xs"><b>{c.name}:</b> <span className="text-muted-foreground">{ds.map((d: any) => d.country).join(", ")}</span></p> : null;
        })}
      </Section>

      <Section title="Roster de Mesa Directiva">
        <form className="flex flex-wrap gap-2" onSubmit={(e) => {
          e.preventDefault();
          if (rName.trim() && rCom && rPos.trim()) run(db.from("mesa_roster").insert({ full_name: rName.trim().slice(0, 120), committee_id: rCom, position: rPos.trim().slice(0, 60) }), "Añadido").then(() => { setRName(""); setRPos(""); });
        }}>
          <Input className="flex-1" value={rName} onChange={(e) => setRName(e.target.value)} placeholder="Nombre" />
          <select className={sel} value={rCom} onChange={(e) => setRCom(e.target.value)}>
            <option value="">Comité…</option>{committees.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Input className="w-36" value={rPos} onChange={(e) => setRPos(e.target.value)} placeholder="Cargo" />
          <Button size="sm" type="submit">Añadir</Button>
        </form>
        {roster.map((r: any) => (
          <Row key={r.id}><span className="flex-1">{r.full_name} — {r.position} · {cname(r.committee_id)}</span><span className="text-[10px] uppercase tracking-widest text-muted-foreground">{r.claimed_by ? "Reclamado" : "Libre"}</span></Row>
        ))}
      </Section>

      <Section title="Códigos de invitación">
        <form className="flex flex-wrap gap-2" onSubmit={(e) => {
          e.preventDefault();
          const c = code.trim().toUpperCase();
          if (c.length >= 4) run(db.from("invite_codes").insert({ code: c.slice(0, 40), participant_type: codeType, max_uses: codeMax ? Number(codeMax) : null }), "Código creado").then(() => setCode(""));
        }}>
          <Input className="flex-1" value={code} onChange={(e) => setCode(e.target.value)} placeholder="CÓDIGO" />
          <select className={sel} value={codeType} onChange={(e) => setCodeType(e.target.value)}><option value="staff">Staff</option><option value="profesor">Profesor</option></select>
          <Input className="w-24" type="number" min={1} value={codeMax} onChange={(e) => setCodeMax(e.target.value)} placeholder="Máx. usos" />
          <Button size="sm" type="submit">Crear</Button>
        </form>
        {codes.map((c: any) => (
          <Row key={c.id}>
            <span className="flex-1 font-mono">{c.code} <span className="text-muted-foreground">· {c.participant_type} · {c.uses}/{c.max_uses ?? "∞"}</span></span>
            <Button size="sm" variant="outline" onClick={() => run(db.from("invite_codes").update({ active: !c.active }).eq("id", c.id), "Actualizado")}>{c.active ? "Activo" : "Desactivado"}</Button>
          </Row>
        ))}
      </Section>

      <Section title="Cambiar House manualmente">
        <p className="text-xs text-muted-foreground">Solo para corregir casos especiales. Queda registrado con tu motivo. No disponible si las Houses están bloqueadas.</p>
        <form className="flex flex-wrap gap-2" onSubmit={(e) => {
          e.preventDefault();
          if (!oUser || oReason.trim().length < 5) return toast.error("Elige participante y escribe un motivo");
          if (!confirm("¿Confirmas el cambio de House?")) return;
          run(db.rpc("admin_override_house", { _user_id: oUser, _house: oHouse, _reason: oReason.trim().slice(0, 300) }), "House actualizada").then(() => setOReason(""));
        }}>
          <select className={sel} value={oUser} onChange={(e) => setOUser(e.target.value)}>
            <option value="">Participante…</option>{people.map((p: any) => <option key={p.user_id} value={p.user_id}>{p.full_name} ({p.participant_type})</option>)}
          </select>
          <select className={sel} value={oHouse} onChange={(e) => setOHouse(e.target.value)}>
            {["atlas", "aurora", "summit", "eclipse"].map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
          <Input className="flex-1" value={oReason} onChange={(e) => setOReason(e.target.value)} placeholder="Motivo" maxLength={300} />
          <Button size="sm" type="submit">Aplicar</Button>
        </form>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-3"><h2 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{title}</h2>{children}</section>;
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2 rounded border border-border bg-card/40 px-3 py-2 text-sm">{children}</div>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}
