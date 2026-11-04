import { pageMeta } from "@/lib/page-meta";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getMyCheckinToken } from "@/lib/checkin.functions";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal/checkin")({
  head: () => pageMeta("Check-in — MCNUN Houses", "Registro de presencia en MCNUN 2026."),
  component: CheckinPage,
});

function CheckinPage() {
  const fetchToken = useServerFn(getMyCheckinToken);
  const { data, refetch, isFetching } = useQuery({
    queryKey: ["checkin-token"],
    queryFn: () => fetchToken(),
    refetchInterval: 28000,
  });

  const [remaining, setRemaining] = useState(30);
  useEffect(() => {
    if (!data?.expiresAt) return;
    const tick = () => {
      const sec = Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(sec);
    };
    tick();
    const i = setInterval(tick, 250);
    return () => clearInterval(i);
  }, [data?.expiresAt]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const qrPayload = data ? `${origin}/staff/scan?token=${data.token}` : "";

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <header className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">Portal MCNUN</p>
        <Link to="/portal" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">Portal</Link>
      </header>

      <section className="mt-10 text-center">
        <ShieldCheck className="mx-auto h-6 w-6 text-[color:var(--house-accent)]" />
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Tu Credencial QR</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Muestra este código al staff para registrar tu asistencia. Rota cada 30 segundos.
        </p>
      </section>

      <section className="mt-8 flex flex-col items-center">
        <div className="rounded-2xl border border-border bg-white p-5">
          {data ? (
            <QRCodeSVG value={qrPayload} size={220} level="H" includeMargin={false} />
          ) : (
            <div className="h-[220px] w-[220px] animate-pulse rounded bg-muted/40" />
          )}
        </div>
        <div className="mt-5 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Expira en</p>
          <p className="font-numeric text-3xl font-semibold tabular-nums text-[color:var(--house-accent)]">{remaining}s</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="mt-4 text-xs uppercase tracking-[0.2em]">
          {isFetching ? "Generando…" : "Forzar rotación"}
        </Button>
      </section>

      <section className="mt-10 rounded-lg border border-border bg-card/40 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Cómo funciona</p>
        <ol className="mt-2 list-decimal pl-4 space-y-1">
          <li>El staff escanea tu QR con su dispositivo.</li>
          <li>Tu Casa recibe los puntos automáticamente.</li>
          <li>El código es de un solo uso y caduca rápido por seguridad.</li>
        </ol>
      </section>
    </div>
  );
}
