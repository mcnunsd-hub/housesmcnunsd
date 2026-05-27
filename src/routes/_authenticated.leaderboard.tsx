import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLeaderboard } from "@/lib/leaderboard.functions";
import { HouseCrest } from "@/components/house-crest";
import { HOUSES, type HouseId } from "@/lib/houses";

import { Lock, Trophy, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — MCNUN Portal" }] }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const fetchLeaderboard = useServerFn(getLeaderboard);
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fetchLeaderboard(),
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Summoning scores…
      </div>
    );
  }

  const scores = data?.scores ?? [];
  const maxPoints = Math.max(...scores.map((s) => s.totalPoints), 1);
  const sorted = [...scores].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <header className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">MCNUN Portal</p>
        <Link to="/portal" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">
          Portal
        </Link>
      </header>

      <section className="mt-10 text-center">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center justify-center gap-2">
          <Trophy className="h-5 w-5 text-[color:var(--house-accent)]" />
          Global Leaderboard
        </h1>
        {data?.locked && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Scores locked pending Closing Ceremony
          </div>
        )}
      </section>

      <section className="mt-8 space-y-4">
        {sorted.map((s, idx) => {
          const h = HOUSES[s.house as HouseId];
          const pct = maxPoints > 0 ? (s.totalPoints / maxPoints) * 100 : 0;
          const isFirst = idx === 0;
          return (
            <div key={s.house} className="relative overflow-hidden rounded-lg border border-border bg-card/40 p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 shrink-0 ${isFirst ? "text-[color:var(--house-accent)]" : "text-muted-foreground/60"}`}>
                  <HouseCrest house={s.house as HouseId} className="h-full w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{h?.name ?? s.house}</span>
                    <span className="font-numeric text-sm font-semibold tabular-nums">{s.totalPoints.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted/40">
                    <div
                      className="h-full rounded-full bg-[color:var(--house-accent)] transition-all duration-1000"
                      style={{ width: `${pct}%`, opacity: 0.85 }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{s.delegateCount} delegate{s.delegateCount === 1 ? "" : "s"}</span>
                    <span className="font-numeric tabular-nums">{pct.toFixed(1)}% of max</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Recent Feed</h2>
        <div className="space-y-2">
          {(data?.feed ?? []).map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded border border-border bg-card/30 px-3 py-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Zap className="h-3 w-3 shrink-0 text-[color:var(--house-accent)]" />
                <span className="truncate">{e.delegateName}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{e.source}</span>
                <span className="font-numeric font-medium tabular-nums">+{e.points}</span>
              </div>
            </div>
          ))}
          {(data?.feed ?? []).length === 0 && (
            <p className="text-center text-xs text-muted-foreground">No score events yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
