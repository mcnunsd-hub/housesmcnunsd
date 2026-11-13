import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const db = supabase as any;

const TYPE_LABELS: Record<string, string> = {
  delegado: "Delegado",
  mesa: "Mesa Directiva",
  profesor: "Profesor",
  staff: "Staff",
};

type PendingRequest = {
  user_id: string;
  full_name: string;
  participant_type: string;
  status: string;
  approval_status: string | null;
  school: string | null;
  grade_level: string | null;
  experience: string | null;
  committee_id: string | null;
  country: string | null;
  mesa_roster_id: string | null;
  email: string | null;
  created_at: string;
};

export function SolicitudesTab() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>("todos");

  const { data: requests = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-solicitudes"],
    queryFn: async () => {
      const { data, error } = await db
        .from("participants")
        .select("user_id,full_name,participant_type,status,approval_status,school,grade_level,experience,committee_id,country,mesa_roster_id,email,created_at")
        .eq("status", "pending")
        .in("participant_type", ["delegado", "mesa", "profesor", "staff"])
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PendingRequest[];
    },
  });

  const { data: committees = [] } = useQuery({
    queryKey: ["admin-solicitudes-committees"],
    queryFn: async () => {
      const { data, error } = await db.from("committees").select("id,name").order("sort_order");
      if (error) throw error;
      return (data ?? []) as { id: string; name: string }[];
    },
  });

  const { data: roster = [] } = useQuery({
    queryKey: ["admin-solicitudes-roster"],
    queryFn: async () => {
      const { data, error } = await db.from("mesa_roster").select("id,full_name,position");
      if (error) throw error;
      return (data ?? []) as { id: string; full_name: string; position: string }[];
    },
  });

  const refresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["admin-solicitudes"] }),
      qc.invalidateQueries({ queryKey: ["admin-overview"] }),
      qc.invalidateQueries({ queryKey: ["my-profile"] }),
    ]);
  };

  const review = useMutation({
    mutationFn: async ({ userId, approve, reason }: { userId: string; approve: boolean; reason: string | null }) => {
      const { error } = await db.rpc("review_participant", {
        _user_id: userId,
        _approve: approve,
        _reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: async (_result, variables) => {
      toast.success(variables.approve ? "Solicitud aprobada" : "Solicitud rechazada");
      await refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const committeeName = (id: string | null) => committees.find((c) => c.id === id)?.name ?? "—";
  const rosterName = (id: string | null) => {
    const r = roster.find((item) => item.id === id);
    return r ? `${r.full_name} — ${r.position}` : "—";
  };

  const filtered = typeFilter === "todos" ? requests : requests.filter((r) => r.participant_type === typeFilter);
  const counts = requests.reduce<Record<string, number>>((acc, r) => {
    acc[r.participant_type] = (acc[r.participant_type] ?? 0) + 1;
    return acc;
  }, {});

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando solicitudes…</p>;
  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive" role="alert">{(error as Error).message}</p>
        <Button variant="outline" onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Solicitudes de acceso</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Aprueba o rechaza los registros de Delegado, Mesa Directiva, Profesor y Staff. Solo un Super Admin puede revisar estas solicitudes.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Actualizando…" : "Actualizar"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Filtrar por tipo">
        <Button variant={typeFilter === "todos" ? "default" : "outline"} size="sm" onClick={() => setTypeFilter("todos")}>
          Todos ({requests.length})
        </Button>
        {(["delegado", "mesa", "profesor", "staff"] as const).map((type) => (
          <Button key={type} variant={typeFilter === type ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(type)}>
            {TYPE_LABELS[type]} ({counts[type] ?? 0})
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded border border-border bg-card/40 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {requests.length === 0 ? "No hay solicitudes pendientes." : "No hay solicitudes de este tipo."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <article key={r.user_id} className="rounded border border-border bg-card/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{r.full_name || "Sin nombre"}</p>
                    <span className="rounded border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {TYPE_LABELS[r.participant_type] ?? r.participant_type}
                    </span>
                  </div>
                  <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
                    <div className="flex gap-2"><dt className="text-muted-foreground">Colegio:</dt><dd>{r.school || "—"}</dd></div>
                    <div className="flex gap-2"><dt className="text-muted-foreground">Correo:</dt><dd className="break-all">{r.email || "—"}</dd></div>
                    {r.participant_type === "delegado" && (
                      <>
                        <div className="flex gap-2"><dt className="text-muted-foreground">Comité:</dt><dd>{committeeName(r.committee_id)}</dd></div>
                        <div className="flex gap-2"><dt className="text-muted-foreground">Delegación:</dt><dd>{r.country || "—"}</dd></div>
                        <div className="flex gap-2"><dt className="text-muted-foreground">Experiencia:</dt><dd>{r.experience || "—"}</dd></div>
                        <div className="flex gap-2"><dt className="text-muted-foreground">Curso:</dt><dd>{r.grade_level || "—"}</dd></div>
                      </>
                    )}
                    {r.participant_type === "mesa" && (
                      <>
                        <div className="flex gap-2"><dt className="text-muted-foreground">Comité:</dt><dd>{committeeName(r.committee_id)}</dd></div>
                        <div className="flex gap-2"><dt className="text-muted-foreground">Puesto:</dt><dd>{rosterName(r.mesa_roster_id)}</dd></div>
                      </>
                    )}
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Solicitada:</dt>
                      <dd>{r.created_at ? new Date(r.created_at).toLocaleString("es") : "—"}</dd>
                    </div>
                  </dl>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    disabled={review.isPending}
                    onClick={() => {
                      if (confirm(`¿Aprobar la solicitud de ${r.full_name || "este participante"}?`)) {
                        review.mutate({ userId: r.user_id, approve: true, reason: null });
                      }
                    }}
                  >
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={review.isPending}
                    onClick={() => {
                      const reason = prompt("Motivo del rechazo (visible para el participante):");
                      if (reason && reason.trim().length >= 3) {
                        review.mutate({ userId: r.user_id, approve: false, reason: reason.trim().slice(0, 300) });
                      } else if (reason !== null) {
                        toast.error("Escribe un motivo de al menos 3 caracteres.");
                      }
                    }}
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
