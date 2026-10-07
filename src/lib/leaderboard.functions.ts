import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    const [{ data: scores }, { data: settings }, { data: events }] = await Promise.all([
      supabase.rpc("house_totals"),
      supabase.from("app_settings").select("key,value").eq("key", "scores_locked").maybeSingle(),
      supabase.rpc("leaderboard_feed", { _limit: 20 }),
    ]);

    const locked = settings?.value === "true";

    return {
      locked,
      scores: (scores ?? []).map((s) => ({
        house: s.house as string,
        totalPoints: Number(s.total_points ?? 0),
        delegateCount: Number(s.delegate_count ?? 0),
      })),
      feed: (events ?? []).map((e: any) => ({
        id: e.id,
        house: e.house as string,
        source: e.source,
        points: e.points,
        createdAt: e.created_at,
        delegateName: e.delegate_name ?? "Delegate",
      })),
    };
  });
