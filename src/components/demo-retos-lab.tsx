import { useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  RotateCcw,
  Send,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  acceptDemoReto,
  createInitialDemoReto,
  DEMO_PARTICIPANT_ID,
  DEMO_VALIDATOR_ID,
  reviewDemoReto,
  submitDemoReto,
  type DemoRetoStatus,
} from "@/lib/retos-demo";

const statusLabels: Record<DemoRetoStatus, string> = {
  available: "Disponible",
  in_progress: "En curso",
  pending: "Pendiente de validación",
  approved: "Aprobado",
  rejected: "Requiere corrección",
};

const steps = ["Recibir", "Evidencia", "Validación", "Resultado"];

function currentStep(status: DemoRetoStatus) {
  if (status === "available") return 0;
  if (status === "in_progress") return 1;
  if (status === "pending") return 2;
  return 3;
}

export function DemoRetosLab() {
  const [reto, setReto] = useState(createInitialDemoReto);
  const [evidence, setEvidence] = useState("");
  const [message, setMessage] = useState("Acepta el reto ficticio para comenzar el recorrido.");
  const step = currentStep(reto.status);

  function run(action: () => void, success: string) {
    try {
      action();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo completar la acción de prueba.");
    }
  }

  function reset() {
    setReto(createInitialDemoReto());
    setEvidence("");
    setMessage("Demostración reiniciada. No se conservó ninguna entrega.");
  }

  return (
    <section className="mt-8 space-y-5" aria-labelledby="retos-demo-title">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">MCNUN Retos · Simulación</p>
        <h2 id="retos-demo-title" className="mt-2 text-xl font-semibold">Así funciona un reto</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Recorre la entrega y validación con identidades ficticias. Esta muestra no usa el banco oficial, no otorga puntos y no se conecta con MCNUN Retos.
        </p>
      </div>

      <ol className="grid grid-cols-4 gap-2" aria-label="Etapas del reto">
        {steps.map((label, index) => (
          <li key={label} className="min-w-0 text-center">
            <span
              className={`mx-auto flex size-7 items-center justify-center rounded-full border font-numeric text-[10px] ${
                index <= step ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
              }`}
              aria-current={index === step ? "step" : undefined}
            >
              {index + 1}
            </span>
            <span className={`mt-2 block text-[9px] uppercase tracking-[0.12em] ${index <= step ? "text-foreground" : "text-muted-foreground"}`}>
              {label}
            </span>
          </li>
        ))}
      </ol>

      <article className="rounded-lg border border-border bg-card/40 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <ClipboardList className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div>
              <h3 className="text-sm font-medium">Reto de demostración</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Contenido de muestra. Aquí aparecería la consigna oficial configurada en MCNUN Retos.
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[9px] uppercase tracking-[0.14em]">
            {statusLabels[reto.status]}
          </span>
        </div>
        <p className="mt-4 rounded border border-border bg-background/40 p-3 text-xs text-muted-foreground">
          Puntos: los definiría MCNUN Retos. En esta demostración no se calculan ni se guardan.
        </p>

        {reto.status === "available" && (
          <Button
            className="mt-4 w-full"
            onClick={() => run(() => setReto(acceptDemoReto(reto)), "Reto aceptado. Ahora puedes describir la evidencia ficticia.")}
          >
            <ClipboardList />Aceptar reto de prueba
          </Button>
        )}

        {(reto.status === "in_progress" || reto.status === "rejected") && (
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              run(() => {
                const submitted = submitDemoReto(reto, evidence);
                setReto(submitted);
                setEvidence(submitted.evidence);
              }, "Evidencia ficticia enviada. La entrega está pendiente de validación.");
            }}
          >
            <label htmlFor="demo-reto-evidence" className="text-xs font-medium">Evidencia ficticia</label>
            <Textarea
              id="demo-reto-evidence"
              value={evidence}
              onChange={(event) => setEvidence(event.target.value)}
              placeholder="Describe una evidencia inventada para recorrer la demostración…"
              maxLength={500}
              className="min-h-24 text-sm"
            />
            <p className="text-[11px] text-muted-foreground">No uses datos personales ni evidencias reales.</p>
            <Button type="submit" className="w-full" disabled={evidence.trim().length < 10}>
              <Send />{reto.status === "rejected" ? "Enviar corrección de prueba" : "Enviar evidencia de prueba"}
            </Button>
          </form>
        )}

        {reto.status === "pending" && (
          <div className="mt-4 rounded border border-border p-3">
            <p className="flex items-center gap-2 text-xs font-medium"><Clock3 className="size-4" />Entrega lista para revisar</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{reto.evidence}</p>
          </div>
        )}

        {reto.status === "approved" && (
          <div className="mt-4 flex gap-3 rounded border border-primary/40 bg-primary/10 p-3 text-sm">
            <CheckCircle2 className="size-5 shrink-0 text-primary" />
            <p>Reto aprobado en la simulación. No se otorgaron puntos ni se modificó el Marcador.</p>
          </div>
        )}
      </article>

      <section className="rounded-lg border border-border bg-card/20 p-5" aria-labelledby="validator-demo-title">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-muted-foreground" aria-hidden />
          <div>
            <h3 id="validator-demo-title" className="text-sm font-medium">Vista del validador</h3>
            <p className="mt-1 text-xs text-muted-foreground">Identidad ficticia independiente del participante.</p>
          </div>
        </div>

        {reto.status === "pending" ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => run(() => setReto(reviewDemoReto(reto, "rejected", DEMO_VALIDATOR_ID)), "Entrega devuelta para corrección. Puedes enviar otra evidencia ficticia.")}
            >
              <XCircle />Solicitar corrección
            </Button>
            <Button onClick={() => run(() => setReto(reviewDemoReto(reto, "approved", DEMO_VALIDATOR_ID)), "Validación ficticia aprobada. No se registraron puntos.")}>
              <CheckCircle2 />Aprobar entrega
            </Button>
            <Button
              variant="ghost"
              className="col-span-2 text-xs"
              onClick={() => run(() => reviewDemoReto(reto, "approved", DEMO_PARTICIPANT_ID), "")}
            >
              <UserRound />Comprobar bloqueo de autovalidación
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Los controles se activan cuando el participante envía una evidencia ficticia.
          </p>
        )}
      </section>

      <p role="status" className="rounded border border-border bg-background/40 p-3 text-xs leading-relaxed">{message}</p>
      <Button type="button" variant="ghost" size="sm" onClick={reset}>
        <RotateCcw />Reiniciar demostración
      </Button>
    </section>
  );
}
