import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { SORTING_QUESTIONS, type AnswerLetter } from "@/lib/sorting-questions";
import { HOUSES, type HouseId } from "@/lib/houses";
import { getMyProfile, submitSorting } from "@/lib/sorting.functions";
import { Button } from "@/components/ui/button";
import { HouseCrest } from "@/components/house-crest";
import { toast } from "sonner";
import { pageMeta } from "@/lib/page-meta";
import { getMyAccess } from "@/lib/onboarding.functions";
import { accessDestination } from "@/lib/onboarding";

export const Route = createFileRoute("/_authenticated/sorting")({
  head: () => pageMeta("Ceremonia de Selección — MCNUN Houses", "Ceremonia de asignación de House para participantes registrados de MCNUN 2026."),
  component: SortingPage,
});

type Phase = "questions" | "submitting" | "blackout" | "reveal";

function SortingPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const fetchAccess = useServerFn(getMyAccess);
  const submit = useServerFn(submitSorting);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
  });

  const [phase, setPhase] = useState<Phase>("questions");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(AnswerLetter | null)[]>(() => Array(10).fill(null));
  const [revealedHouse, setRevealedHouse] = useState<HouseId | null>(null);

  useEffect(() => {
    if (profile?.house) {
      setRevealedHouse(profile.house as HouseId);
      setPhase("reveal");
    }
  }, [profile]);

  const q = SORTING_QUESTIONS[index];
  const allAnswered = useMemo(() => answers.every((a) => a !== null), [answers]);

  function pick(letter: AnswerLetter) {
    const next = [...answers];
    next[index] = letter;
    setAnswers(next);
    setTimeout(() => {
      if (index < 9) setIndex(index + 1);
    }, 180);
  }

  async function finalize() {
    if (!allAnswered) return;
    setPhase("submitting");
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([60, 90, 60, 90, 60, 200, 80]);
      }
      const result = await submit({ data: { answers: answers as AnswerLetter[] } });
      setTimeout(() => {
        setPhase("blackout");
        setTimeout(() => {
          setRevealedHouse(result.house as HouseId);
          setPhase("reveal");
          qc.invalidateQueries({ queryKey: ["my-profile"] });
        }, 1200);
      }, 1800);
    } catch (err) {
      toast.error((err as Error).message);
      setPhase("questions");
      try {
        const destination = accessDestination(await fetchAccess());
        if (destination !== "/sorting") await nav({ to: destination, replace: true });
      } catch { toast.error("No fue posible verificar su acceso. Intente nuevamente."); }
    }
  }

  if (isLoading) {
    return <div className="flex min-h-svh items-center justify-center text-muted-foreground text-sm">Inicializando…</div>;
  }

  // ---------- REVELACIÓN ----------
  if (phase === "reveal" && revealedHouse) {
    const h = HOUSES[revealedHouse];
    return (
      <div className="relative min-h-svh overflow-hidden">
        <div className="absolute inset-0 animate-liquid house-radial-bg" />
        <div className="relative z-10 mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 py-12 text-center">
          <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
            <div className="mx-auto h-32 w-32 text-[color:var(--house-accent)]">
              <HouseCrest house={revealedHouse} className="h-full w-full" />
            </div>
          </div>
          <p className="mt-6 text-[10px] uppercase tracking-[0.4em] text-muted-foreground animate-fade-up" style={{ animationDelay: "350ms" }}>
            Has sido seleccionado para
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight animate-fade-up" style={{ animationDelay: "500ms" }}>
            {h.name}
          </h1>
          <p className="mt-2 text-sm italic text-[color:var(--house-accent)] animate-fade-up" style={{ animationDelay: "650ms" }}>
            {h.tagline}
          </p>
          <p className="mt-6 text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: "800ms" }}>
            {h.archetype}
          </p>

          <div className="mt-8 w-full animate-fade-up" style={{ animationDelay: "950ms" }}>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Mentor Histórico</p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {h.mentors.map((m) => (
                <div key={m} className="rounded border border-border bg-card/40 px-3 py-2 text-xs">{m}</div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground animate-fade-up" style={{ animationDelay: "1000ms" }}>
            Tus respuestas orientan tu House, y el Secretariado equilibra las cuatro Houses para que sean justas en tamaño, nivel, comité y colegio.
          </p>

          <Button
            className="mt-8 w-full animate-fade-up tracking-[0.2em] uppercase text-xs"
            style={{ animationDelay: "1100ms" }}
            onClick={() => nav({ to: "/portal" })}
          >
            Entrar al Portal MCNUN
          </Button>
        </div>
      </div>
    );
  }

  // ---------- BLACKOUT ----------
  if (phase === "blackout") {
    return <div className="fixed inset-0 z-50 bg-black" />;
  }

  // ---------- ENVIANDO ----------
  if (phase === "submitting") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[oklch(0.08_0_0)] px-6">
        <div className="text-center">
          <div className="mx-auto h-40 w-40 text-[color:var(--primary)] animate-ambient animate-crest-fly">
            <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
              <path d="M40 150 Q100 170 160 150 L150 110 Q100 130 50 110 Z" />
              <path d="M50 110 Q60 60 100 50 Q140 60 150 110" />
              <path d="M100 50 Q105 30 120 28" />
              <circle cx="120" cy="28" r="3" fill="currentColor" />
            </svg>
          </div>
          <p className="mt-8 text-xs uppercase tracking-[0.35em] text-muted-foreground animate-pulse-glow">
            Procesando la asignación de su House…
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-foreground animate-pulse-glow">
            Tu Casa es…
          </p>
        </div>
      </div>
    );
  }

  // ---------- PREGUNTAS ----------
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col px-6 py-10">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        <span>Pregunta {String(q.id).padStart(2, "0")} / 10</span>
        <span className="font-numeric">{Math.round(((index + 1) / 10) * 100)}%</span>
      </div>
      <div className="mt-2 h-px w-full bg-border overflow-hidden">
        <div className="h-full bg-foreground transition-all" style={{ width: `${((index + 1) / 10) * 100}%` }} />
      </div>

      <div className="mt-8 flex-1">
        <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">{q.category}</p>
        <h2 className="mt-3 text-xl font-semibold leading-snug tracking-tight">{q.prompt}</h2>

        <div className="mt-8 space-y-3">
          {q.options.map((opt) => {
            const selected = answers[index] === opt.letter;
            return (
              <Button
                key={opt.letter}
                variant="outline"
                aria-pressed={selected}
                onClick={() => pick(opt.letter)}
                className={[
                  "h-auto w-full whitespace-normal text-left justify-start rounded-md border p-4 text-sm leading-relaxed transition-all",
                  selected
                    ? "border-foreground bg-card scale-[0.99]"
                    : "border-border bg-card/40 hover:border-foreground/60",
                ].join(" ")}
              >
                {opt.text}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="ghost" disabled={index === 0} onClick={() => setIndex(index - 1)} className="text-xs uppercase tracking-[0.2em]">
          Anterior
        </Button>
        {index < 9 ? (
          <Button disabled={!answers[index]} onClick={() => setIndex(index + 1)} className="text-xs uppercase tracking-[0.2em]">
            Siguiente
          </Button>
        ) : (
          <Button disabled={!allAnswered} onClick={finalize} className="text-xs uppercase tracking-[0.2em]">
            Enviar
          </Button>
        )}
      </div>
    </div>
  );
}
