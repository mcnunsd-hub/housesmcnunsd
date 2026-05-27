import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    const [{ data: scores }, { data: settings }, { data: events }] = await Promise.all([
      supabase.from("house_scores").select("house,total_points,delegate_count"),
      supabase.from("app_settings").select("key,value").eq("key", "scores_locked").maybeSingle(),
      supabase
        .from("score_events")
        .select("id,house,source,points,created_at,user_id,profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const locked = settings?.value === "true";

    return {
      locked,
      scores: (scores ?? []).map((s) => ({
        house: s.house as string,
        totalPoints: s.total_points ?? 0,
        delegateCount: s.delegate_count ?? 0,
      })),
      feed: (events ?? []).map((e: any) => ({
        id: e.id,
        house: e.house as string,
        source: e.source,
        points: e.points,
        createdAt: e.created_at,
        delegateName: e.profiles?.full_name ?? "Delegate",
      })),
    };
  });
