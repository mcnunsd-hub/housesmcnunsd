import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { SORTING_QUESTIONS, type AnswerLetter } from "@/lib/sorting-questions";
import { HOUSES, type HouseId } from "@/lib/houses";
import { getMyProfile, submitSorting, upsertMyProfile } from "@/lib/sorting.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HouseCrest } from "@/components/house-crest";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sorting")({
  head: () => ({ meta: [{ title: "Ceremonia de Selección — Portal MCNUN" }] }),
  component: SortingPage,
});

type Phase = "intake" | "questions" | "submitting" | "blackout" | "reveal";

function SortingPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const upsert = useServerFn(upsertMyProfile);
  const submit = useServerFn(submitSorting);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
  });

  const [phase, setPhase] = useState<Phase>("intake");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(AnswerLetter | null)[]>(() => Array(10).fill(null));
  const [revealedHouse, setRevealedHouse] = useState<HouseId | null>(null);

  // Formulario de identidad
  const [fullName, setFullName] = useState("");
  const [committee, setCommittee] = useState("");
  const [country, setCountry] = useState("");
  const [tier, setTier] = useState<"advanced" | "first_timer">("first_timer");

  useEffect(() => {
    if (profile?.house) {
      setRevealedHouse(profile.house as HouseId);
      setPhase("reveal");
    } else if (profile?.committee && profile.country) {
      setPhase("questions");
    }
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile]);

  const q = SORTING_QUESTIONS[index];
  const allAnswered = useMemo(() => answers.every((a) => a !== null), [answers]);

  async function saveIntake(e: React.FormEvent) {
    e.preventDefault();
    try {
      await upsert({ data: { full_name: fullName, committee, country, seniority_tier: tier } });
      await qc.invalidateQueries({ queryKey: ["my-profile"] });
      setPhase("questions");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

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
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Mentores Históricos</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {h.mentors.map((m) => (
                <div key={m} className="rounded border border-border bg-card/40 px-3 py-2 text-xs">{m}</div>
              ))}
            </div>
          </div>

          <Button
            className="mt-10 w-full animate-fade-up tracking-[0.2em] uppercase text-xs"
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
            Evaluando vectores psicológicos…
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-foreground animate-pulse-glow">
            Tu Casa es…
          </p>
        </div>
      </div>
    );
  }

  // ---------- IDENTIDAD ----------
  if (phase === "intake") {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-12">
        <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">Fase 01</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Expediente del Delegado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Antes de la Ceremonia de Selección, confirma tu identidad en la conferencia.
        </p>
        <form onSubmit={saveIntake} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fn">Nombre completo</Label>
            <Input id="fn" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="committee">Comité</Label>
            <Input id="committee" required value={committee} onChange={(e) => setCommittee(e.target.value)} placeholder="p. ej. Consejo de Seguridad ONU" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country">País / Delegación</Label>
            <Input id="country" required value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Nivel de experiencia</Label>
            <RadioGroup value={tier} onValueChange={(v) => setTier(v as "advanced" | "first_timer")} className="grid grid-cols-2 gap-2">
              <Label htmlFor="t1" className="flex cursor-pointer items-center gap-2 rounded border border-border p-3 text-xs">
                <RadioGroupItem id="t1" value="first_timer" /> Principiante
              </Label>
              <Label htmlFor="t2" className="flex cursor-pointer items-center gap-2 rounded border border-border p-3 text-xs">
                <RadioGroupItem id="t2" value="advanced" /> Avanzado
              </Label>
            </RadioGroup>
          </div>
          <Button type="submit" className="w-full mt-4 tracking-[0.2em] uppercase text-xs">Comenzar Ceremonia de Selección</Button>
        </form>
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
              <button
                key={opt.letter}
                onClick={() => pick(opt.letter)}
                className={[
                  "w-full text-left rounded-md border p-4 text-sm leading-relaxed transition-all",
                  selected
                    ? "border-foreground bg-card scale-[0.99]"
                    : "border-border bg-card/40 hover:border-foreground/60",
                ].join(" ")}
              >
                {opt.text}
              </button>
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
