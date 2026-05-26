import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AnswerSchema = z.object({
  answers: z.array(z.enum(["A", "B", "C", "D"])).length(10),
});

const HOUSES = ["atlas", "aurora", "summit", "eclipse"] as const;
type House = (typeof HOUSES)[number];
const LETTER_TO_HOUSE: Record<"A" | "B" | "C" | "D", House> = {
  A: "atlas",
  B: "aurora",
  C: "summit",
  D: "eclipse",
};

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, committee, country, house, seniority_tier, sorted_at")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const ProfileInputSchema = z.object({
  full_name: z.string().min(1).max(120),
  committee: z.string().min(1).max(120),
  country: z.string().min(1).max(120),
  seniority_tier: z.enum(["advanced", "first_timer"]),
});

export const upsertMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ProfileInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, ...data, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitSorting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => AnswerSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Don't re-sort
    const { data: existing } = await supabase
      .from("profiles")
      .select("house, seniority_tier")
      .eq("id", userId)
      .maybeSingle();
    if (existing?.house) return { house: existing.house as House, resorted: false };

    // Raw vector
    const raw: Record<House, number> = { atlas: 0, aurora: 0, summit: 0, eclipse: 0 };
    for (const letter of data.answers) raw[LETTER_TO_HOUSE[letter]] += 20;

    // Distribution of sorted users
    const { data: pop } = await supabase
      .from("profiles")
      .select("house, seniority_tier")
      .not("house", "is", null);

    const totals: Record<House, number> = { atlas: 0, aurora: 0, summit: 0, eclipse: 0 };
    const tierTotals: Record<House, number> = { atlas: 0, aurora: 0, summit: 0, eclipse: 0 };
    const userTier = existing?.seniority_tier ?? "first_timer";
    let total = 0;
    let totalTier = 0;
    for (const row of pop ?? []) {
      const h = row.house as House;
      totals[h]++;
      total++;
      if (row.seniority_tier === userTier) {
        tierTotals[h]++;
        totalTier++;
      }
    }

    const cap = 0.27;
    const tierExpected = totalTier > 0 ? totalTier / 4 : 0;

    const adjusted: Record<House, number> = { ...raw };
    for (const h of HOUSES) {
      const share = total > 0 ? totals[h] / total : 0;
      if (share >= cap) adjusted[h] *= 0.55;
      if (totalTier > 0 && tierTotals[h] < tierExpected) adjusted[h] *= 1.25;
    }

    // Argmax with tie-break by lowest current population
    let chosen: House = "atlas";
    let bestScore = -Infinity;
    for (const h of HOUSES) {
      const s = adjusted[h];
      if (s > bestScore || (s === bestScore && totals[h] < totals[chosen])) {
        bestScore = s;
        chosen = h;
      }
    }

    const nowIso = new Date().toISOString();
    const { error: updErr } = await supabase
      .from("profiles")
      .update({ house: chosen, sorted_at: nowIso, updated_at: nowIso })
      .eq("id", userId);
    if (updErr) throw new Error(updErr.message);

    await supabase.from("score_events").insert({
      user_id: userId,
      house: chosen,
      source: "sorting",
      points: 0,
    });

    return { house: chosen, resorted: false };
  });
