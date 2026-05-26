import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getMyProfile } from "@/lib/sorting.functions";
import { HOUSES, type HouseId } from "@/lib/houses";
import { HouseCrest } from "@/components/house-crest";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({ meta: [{ title: "MCNUN Portal" }] }),
  component: PortalPage,
});

function PortalPage() {
  const nav = useNavigate();
  const fetchProfile = useServerFn(getMyProfile);
  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
  });

  useEffect(() => {
    if (!isLoading && profile && !profile.house) nav({ to: "/sorting" });
  }, [profile, isLoading, nav]);

  if (isLoading || !profile) {
    return <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!profile.house) return null;
  const h = HOUSES[profile.house as HouseId];

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <header className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">MCNUN Portal</p>
        <button
          onClick={async () => { await supabase.auth.signOut(); nav({ to: "/login" }); }}
          className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
        >
          Sign out
        </button>
      </header>

      <section className="mt-10 rounded-lg border border-border bg-card/40 p-6 house-radial-bg">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 shrink-0 text-[color:var(--house-accent)]">
            <HouseCrest house={profile.house as HouseId} className="h-full w-full" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Sorted to</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{h.name}</h1>
            <p className="text-xs italic text-[color:var(--house-accent)]">{h.tagline}</p>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded border border-border p-3">
            <dt className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Delegate</dt>
            <dd className="mt-1 font-medium">{profile.full_name}</dd>
          </div>
          <div className="rounded border border-border p-3">
            <dt className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Tier</dt>
            <dd className="mt-1 font-medium capitalize">{profile.seniority_tier?.replace("_", " ")}</dd>
          </div>
          <div className="rounded border border-border p-3 col-span-2">
            <dt className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Committee · Delegation</dt>
            <dd className="mt-1 font-medium">{profile.committee} — {profile.country}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-8 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Forthcoming Modules</p>
        {[
          { title: "Live Global Leaderboard", note: "Phase II" },
          { title: "Lunchtime Geopolitical Trivia", note: "Phase III" },
          { title: "Check-In QR & Secret Missions", note: "Phase IV" },
        ].map((m) => (
          <div key={m.title} className="flex items-center justify-between rounded border border-border bg-card/40 px-4 py-3">
            <span className="text-sm">{m.title}</span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{m.note}</span>
          </div>
        ))}
      </section>

      <Button variant="outline" className="mt-10 w-full text-xs uppercase tracking-[0.2em]" disabled>
        Closing Ceremony · Locked
      </Button>
    </div>
  );
}
