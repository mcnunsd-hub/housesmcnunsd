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

    // No re-sortear
    const { data: existing } = await supabase
      .from("profiles")
      .select("house, seniority_tier")
      .eq("id", userId)
      .maybeSingle();
    if (existing?.house) return { house: existing.house as House, resorted: false };

    // 1) Vector psicológico crudo
    const raw: Record<House, number> = { atlas: 0, aurora: 0, summit: 0, eclipse: 0 };
    for (const letter of data.answers) raw[LETTER_TO_HOUSE[letter]] += 20;

    // 2) Población actual (global y por nivel)
    const { data: pop } = await (supabase as any).rpc("house_population");

    const counts: Record<House, number> = { atlas: 0, aurora: 0, summit: 0, eclipse: 0 };
    const tierCounts: Record<House, number> = { atlas: 0, aurora: 0, summit: 0, eclipse: 0 };
    const userTier = existing?.seniority_tier ?? "first_timer";
    let total = 0;
    let totalTier = 0;
    for (const row of (pop ?? []) as { house: House; seniority_tier: string; n: number }[]) {
      const n = Number(row.n) || 0;
      counts[row.house] += n;
      total += n;
      if (row.seniority_tier === userTier) {
        tierCounts[row.house] += n;
        totalTier += n;
      }
    }

    const avgCount = total / 4;
    const avgTier = totalTier / 4;

    // 3) Multiplicadores: BALANCE DE DELEGADOS (prioridad alta) + BALANCE POR NIVEL
    const adjusted: Record<House, number> = { ...raw };
    for (const h of HOUSES) {
      // Balance global de delegados (-0.22 por delegado sobre el promedio, +0.22 por debajo)
      const diff = counts[h] - avgCount;
      let countMult = Math.max(0.2, Math.min(1.8, 1 - diff * 0.22));
      // Penalización dura si una Casa ya supera el promedio en 3+
      if (diff >= 3) countMult *= 0.35;
      // Bonus duro si está 3+ por debajo
      if (diff <= -3) countMult *= 1.6;

      // Balance por nivel académico
      const tierDiff = tierCounts[h] - avgTier;
      let tierMult = Math.max(0.5, Math.min(1.5, 1 - tierDiff * 0.18));

      adjusted[h] = adjusted[h] * countMult * tierMult;
    }

    // 4) Argmax con desempate por menor población
    let chosen: House = "atlas";
    let bestScore = -Infinity;
    for (const h of HOUSES) {
      const s = adjusted[h];
      if (s > bestScore || (s === bestScore && counts[h] < counts[chosen])) {
        bestScore = s;
        chosen = h;
      }
    }

    // 5) GUARDIA DURA: si la Casa elegida supera por 2+ a la menos poblada, reasignar
    //    al candidato con score más alto entre las que NO superen ese umbral.
    const minCount = Math.min(...HOUSES.map((h) => counts[h]));
    if (counts[chosen] - minCount >= 2) {
      const eligible = HOUSES.filter((h) => counts[h] - minCount < 2);
      if (eligible.length > 0) {
        let altChoice = eligible[0];
        let altScore = -Infinity;
        for (const h of eligible) {
          const s = adjusted[h];
          if (s > altScore || (s === altScore && counts[h] < counts[altChoice])) {
            altScore = s;
            altChoice = h;
          }
        }
        chosen = altChoice;
      }
    }

    const nowIso = new Date().toISOString();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: updErr } = await supabaseAdmin
      .from("profiles")
      .update({ house: chosen, sorted_at: nowIso, updated_at: nowIso })
      .eq("id", userId)
      .is("house", null);
    if (updErr) throw new Error(updErr.message);

    await supabaseAdmin.from("score_events").insert({
      user_id: userId,
      house: chosen,
      source: "sorting",
      points: 0,
    });

    return { house: chosen, resorted: false };
  });
