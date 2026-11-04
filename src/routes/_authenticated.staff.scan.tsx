import { pageMeta } from "@/lib/page-meta";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { redeemCheckin } from "@/lib/checkin.functions";
import { listPendingSubmissions, reviewMissionSubmission } from "@/lib/missions.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scan, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/staff/scan")({
  head: () => pageMeta("Escaneo Staff — MCNUN Houses", "Acceso operativo de Staff en MCNUN Houses."),
  validateSearch: (s: Record<string, unknown>) => ({ token: typeof s.token === "string" ? s.token : undefined }),
  component: StaffScanPage,
});

function StaffScanPage() {
  const { token: urlToken } = Route.useSearch();
  const qc = useQueryClient();
  const redeem = useServerFn(redeemCheckin);
  const fetchPending = useServerFn(listPendingSubmissions);
  const review = useServerFn(reviewMissionSubmission);

  const [token, setToken] = useState(urlToken ?? "");
  const [location, setLocation] = useState("");
  const [lastResult, setLastResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const { data: pending } = useQuery({
    queryKey: ["pending-submissions"],
    queryFn: () => fetchPending(),
    refetchInterval: 10000,
  });

  const redeemMut = useMutation({
    mutationFn: redeem,
    onSuccess: (r) => {
      setLastResult({ ok: true, msg: `${r.delegateName} · +${r.points} pts a ${r.house ?? "—"}` });
      setToken("");
      toast.success("Check-in registrado");
    },
    onError: (e: any) => {
      setLastResult({ ok: false, msg: e.message ?? "Error" });
      toast.error(e.message ?? "Error");
    },
  });

  const reviewMut = useMutation({
    mutationFn: review,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-submissions"] });
      toast.success("Revisión guardada");
    },
    onError: (e: any) => toast.error(e.message ?? "Error"),
  });

  useEffect(() => {
    if (urlToken && urlToken.length > 8 && !redeemMut.isPending) {
      redeemMut.mutate({ data: { token: urlToken, location: undefined } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlToken]);

  if (pending && !pending.isStaff) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Acceso restringido</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Esta vista es solo para personal del comité. Si necesitas acceso staff, pide al organizador asignarte el rol.
        </p>
        <Link to="/portal" className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-[color:var(--house-accent)]">
          ← Volver al Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <header className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">Staff · MCNUN</p>
        <Link to="/portal" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">Portal</Link>
      </header>

      <section className="mt-8 text-center">
        <Scan className="mx-auto h-6 w-6 text-[color:var(--house-accent)]" />
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Registrar Check-In</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Escanea el QR del delegado (abre el enlace) o pega el token manualmente.
        </p>
      </section>

      <form
        onSubmit={(e) => { e.preventDefault(); redeemMut.mutate({ data: { token, location: location || undefined } }); }}
        className="mt-6 space-y-3"
      >
        <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Token del QR" required />
        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ubicación (opcional) — p. ej. Plenario, Comité 3" />
        <Button type="submit" disabled={!token || redeemMut.isPending} className="w-full text-xs uppercase tracking-[0.2em]">
          {redeemMut.isPending ? "Validando…" : "Registrar"}
        </Button>
      </form>

      {lastResult && (
        <div className={`mt-4 rounded-lg border px-4 py-3 text-xs ${lastResult.ok ? "border-green-500/30 bg-green-500/5 text-green-400" : "border-red-500/30 bg-red-500/5 text-red-400"}`}>
          {lastResult.msg}
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
          Misiones pendientes ({pending?.submissions.length ?? 0})
        </h2>
        <div className="space-y-3">
          {(pending?.submissions ?? []).map((s) => (
            <div key={s.id} className="rounded-lg border border-border bg-card/40 p-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{s.missionTitle} · <span className="text-[color:var(--house-accent)]">+{s.points}</span></p>
                  <p className="text-muted-foreground">{s.delegateName} · {s.house ?? "—"}</p>
                </div>
              </div>
              <p className="mt-2 text-foreground/80 whitespace-pre-wrap">{s.proofText}</p>
              {s.proofUrl && (
                <a href={s.proofUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[color:var(--house-accent)] underline">
                  Ver evidencia
                </a>
              )}
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => reviewMut.mutate({ data: { submissionId: s.id, approve: true } })} className="text-xs">
                  <Check className="h-3 w-3 mr-1" /> Aprobar
                </Button>
                <Button size="sm" variant="outline" onClick={() => reviewMut.mutate({ data: { submissionId: s.id, approve: false } })} className="text-xs">
                  <X className="h-3 w-3 mr-1" /> Rechazar
                </Button>
              </div>
            </div>
          ))}
          {(pending?.submissions ?? []).length === 0 && (
            <p className="text-center text-xs text-muted-foreground">Sin envíos pendientes.</p>
          )}
        </div>
      </section>
    </div>
  );
}
