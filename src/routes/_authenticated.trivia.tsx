import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTriviaState, startTriviaSession, submitTriviaAnswer, completeTriviaSession } from "@/lib/trivia.functions";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Lock, ChevronRight, Check, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/trivia")({
  head: () => ({ meta: [{ title: "Trivia — MCNUN Portal" }] }),
  component: TriviaPage,
});

function TriviaPage() {
  const qc = useQueryClient();
  const fetchState = useServerFn(getTriviaState);
  const startSession = useServerFn(startTriviaSession);
  const submitAnswer = useServerFn(submitTriviaAnswer);
  const completeSession = useServerFn(completeTriviaSession);

  const { data, isLoading } = useQuery({
    queryKey: ["trivia-state"],
    queryFn: () => fetchState(),
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean; pointsAwarded: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelected(null);
    setResult(null);
  }, [currentIndex]);

  const startMutation = useMutation({
    mutationFn: startSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trivia-state"] }),
  });

  const submitMutation = useMutation({
    mutationFn: submitAnswer,
    onSuccess: (res) => {
      setResult(res);
      qc.invalidateQueries({ queryKey: ["trivia-state"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trivia-state"] }),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Loading trivia…</div>
    );
  }

  if (!data?.unlocked) {
    return (
      <div className="mx-auto max-w-md px-6 py-10 text-center">
        <header className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">MCNUN Portal</p>
          <Link to="/portal" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">Portal</Link>
        </header>
        <div className="mt-20 flex flex-col items-center gap-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
          <h1 className="text-xl font-semibold tracking-tight">Trivia Locked</h1>
          <p className="text-sm text-muted-foreground max-w-xs">{data?.lockedReason ?? "Check back later for the Lunchtime Geopolitical Trivia challenge."}</p>
        </div>
      </div>
    );
  }

  const questions = data.questions ?? [];
  const answers = data.answers ?? {};
  const answeredIds = new Set(Object.keys(answers));
  const sessionId = data.session?.id;

  if (!sessionId) {
    return (
      <div className="mx-auto max-w-md px-6 py-10 text-center">
        <header className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">MCNUN Portal</p>
          <Link to="/portal" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">Portal</Link>
        </header>
        <div className="mt-20 flex flex-col items-center gap-4">
          <h1 className="text-xl font-semibold tracking-tight">Lunchtime Geopolitical Trivia</h1>
          <p className="text-sm text-muted-foreground max-w-xs">10 questions. 10 points each. Server-graded. No second chances.</p>
          <Button className="mt-4" onClick={() => startMutation.mutate({ data: {} })} disabled={startMutation.isPending}>
            {startMutation.isPending ? "Starting…" : "Begin Challenge"}
          </Button>
        </div>
      </div>
    );
  }

  if (data.session?.isCompleted) {
    const total = data.session.totalScore ?? 0;
    const max = questions.reduce((s, q) => s + (q.points ?? 10), 0);
    return (
      <div className="mx-auto max-w-md px-6 py-10 text-center">
        <header className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">MCNUN Portal</p>
          <Link to="/portal" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">Portal</Link>
        </header>
        <div className="mt-20 flex flex-col items-center gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Challenge Complete</h1>
          <p className="text-sm text-muted-foreground">Your house gains</p>
          <p className="text-4xl font-numeric font-bold text-[color:var(--house-accent)]">{total}</p>
          <p className="text-xs text-muted-foreground">out of {max} possible points</p>
          <Link to="/leaderboard" className="mt-6 inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-xs hover:bg-card/80 transition-colors">
            View Leaderboard <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // Progress
  const allAnswered = questions.every((q) => answeredIds.has(q.id));
  const currentQ = questions[currentIndex];
  const currentAnswer = currentQ ? answers[currentQ.id] : null;

  async function onSelect(letter: string) {
    if (currentAnswer || isSubmitting) return;
    setSelected(letter);
    setIsSubmitting(true);
    try {
      const res = await submitMutation.mutateAsync({
        data: { sessionId, questionId: currentQ.id, selectedAnswer: letter as any },
      });
      setResult(res);
    } catch (e: any) {
      setSelected(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  function nextQuestion() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }

  function prevQuestion() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }

  async function finish() {
    if (!allAnswered) return;
    await completeMutation.mutateAsync({ data: { sessionId } });
  }

  if (!currentQ) {
    return <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Loading question…</div>;
  }

  const qAnswered = !!currentAnswer;

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <header className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">MCNUN Portal</p>
        <Link to="/portal" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">Portal</Link>
      </header>

      <div className="mt-8">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <span>Question {currentIndex + 1} / {questions.length}</span>
          <span>{currentQ.points} pts</span>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted/30">
          <div
            className="h-full rounded-full bg-[color:var(--house-accent)] transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <section className="mt-8 rounded-lg border border-border bg-card/40 p-5">
        <p className="text-sm leading-relaxed">{currentQ.questionText}</p>
      </section>

      <section className="mt-4 space-y-2">
        {currentQ.options.map((opt) => {
          const isSelected = selected === opt.letter;
          const isAnswered = qAnswered;
          const isCorrect = currentAnswer?.isCorrect && currentAnswer?.selectedAnswer === opt.letter;
          const isWrong = !currentAnswer?.isCorrect && currentAnswer?.selectedAnswer === opt.letter;

          let btnClasses = "w-full justify-start rounded-lg border px-4 py-3 text-left text-sm transition-colors ";
          if (isCorrect) btnClasses += "border-green-500/40 bg-green-500/10 text-green-400";
          else if (isWrong) btnClasses += "border-red-500/40 bg-red-500/10 text-red-400";
          else if (isSelected && !isAnswered) btnClasses += "border-[color:var(--house-accent)] bg-[color:var(--house-accent)]/10";
          else btnClasses += "border-border bg-card/40 hover:bg-card/70";

          return (
            <button
              key={opt.letter}
              className={btnClasses}
              onClick={() => onSelect(opt.letter)}
              disabled={isAnswered || isSubmitting}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-medium">
                  {isCorrect ? <Check className="h-3.5 w-3.5" /> : isWrong ? <X className="h-3.5 w-3.5" /> : opt.letter}
                </span>
                <span className="leading-snug">{opt.text}</span>
              </div>
            </button>
          );
        })}
      </section>

      {result && (
        <div className={`mt-4 rounded-lg border px-4 py-3 text-xs ${result.isCorrect ? "border-green-500/30 bg-green-500/5 text-green-400" : "border-red-500/30 bg-red-500/5 text-red-400"}`}>
          {result.isCorrect ? `Correct! +${result.pointsAwarded} points` : "Incorrect. No points awarded."}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={prevQuestion} disabled={currentIndex === 0}>
          Back
        </Button>
        {allAnswered && currentIndex === questions.length - 1 ? (
          <Button size="sm" onClick={finish} disabled={completeMutation.isPending}>
            {completeMutation.isPending ? "Finishing…" : "Finish & Award Points"}
          </Button>
        ) : (
          <Button size="sm" onClick={nextQuestion} disabled={currentIndex === questions.length - 1}>
            Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
