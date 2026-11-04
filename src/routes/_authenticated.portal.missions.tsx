import { pageMeta } from "@/lib/page-meta";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listMissions, submitMissionProof } from "@/lib/missions.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Target, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal/missions")({
  head: () => pageMeta("Misiones — MCNUN Houses", "Participación en misiones de MCNUN Houses."),
  component: MissionsPage,
});

function MissionsPage() {
  const qc = useQueryClient();
  const fetchMissions = useServerFn(listMissions);
  const submit = useServerFn(submitMissionProof);

  const { data, isLoading } = useQuery({
    queryKey: ["my-missions"],
    queryFn: () => fetchMissions(),
  });

  const [openId, setOpenId] = useState<string | null>(null);
  const [proofText, setProofText] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  const mut = useMutation({
    mutationFn: submit,
    onSuccess: () => {
      toast.success("Envío recibido. Espera la revisión del staff.");
      setOpenId(null);
      setProofText("");
      setProofUrl("");
      qc.invalidateQueries({ queryKey: ["my-missions"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Error al enviar"),
  });

  if (isLoading) {
    return <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Cargando misiones…</div>;
  }

  const missions = data?.missions ?? [];

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <header className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">Portal MCNUN</p>
        <Link to="/portal" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">Portal</Link>
      </header>

      <section className="mt-10 text-center">
        <Target className="mx-auto h-6 w-6 text-[color:var(--house-accent)]" />
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Misiones Secretas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Retos cualitativos. Sube evidencia, el staff aprueba, tu Casa gana puntos.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        {missions.map((m) => {
          const status = m.submission?.status as string | undefined;
          const isOpen = openId === m.id;
          return (
            <div key={m.id} className="rounded-lg border border-border bg-card/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-medium">{m.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{m.description}</p>
                </div>
                <span className="shrink-0 font-numeric text-sm font-semibold text-[color:var(--house-accent)]">
                  +{m.points}
                </span>
              </div>

              {status && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em]">
                  {status === "approved" && <><CheckCircle2 className="h-3 w-3 text-green-500" /> Aprobada</>}
                  {status === "pending" && <><Clock className="h-3 w-3 text-amber-400" /> En revisión</>}
                  {status === "rejected" && <><XCircle className="h-3 w-3 text-red-400" /> Rechazada · reintenta</>}
                </div>
              )}

              {(!status || status === "rejected") && (
                <div className="mt-3">
                  {!isOpen ? (
                    <Button size="sm" variant="outline" className="text-xs uppercase tracking-[0.2em]" onClick={() => setOpenId(m.id)}>
                      Aceptar misión
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Describe tu evidencia (qué hiciste, con quién, dónde)…"
                        value={proofText}
                        onChange={(e) => setProofText(e.target.value)}
                        maxLength={2000}
                        className="text-xs"
                      />
                      <Input
                        placeholder="URL de foto/video (opcional)"
                        value={proofUrl}
                        onChange={(e) => setProofUrl(e.target.value)}
                        type="url"
                        className="text-xs"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={mut.isPending || proofText.length < 1}
                          onClick={() =>
                            mut.mutate({
                              data: {
                                missionId: m.id,
                                proofText,
                                proofUrl: proofUrl ? proofUrl : null,
                              },
                            })
                          }
                          className="text-xs uppercase tracking-[0.2em]"
                        >
                          {mut.isPending ? "Enviando…" : "Enviar evidencia"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setOpenId(null); setProofText(""); setProofUrl(""); }}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {missions.length === 0 && (
          <p className="text-center text-xs text-muted-foreground">No hay misiones activas en este momento.</p>
        )}
      </section>
    </div>
  );
}
