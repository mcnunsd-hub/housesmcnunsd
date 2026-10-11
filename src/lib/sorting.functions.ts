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

    // 2) Asignación incremental balanceada (cohortes: nivel, comité, colegio, rol)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error: cErr } = await (supabaseAdmin as any).rpc("house_cohort_counts", { _user_id: userId });
    if (cErr) throw new Error(cErr.message);
    type Row = { house: House; total: number; same_level: number; same_committee: number; same_school: number; same_type: number };
    const coh = new Map<House, Row>();
    for (const r of (rows ?? []) as Row[]) coh.set(r.house, {
      house: r.house, total: Number(r.total), same_level: Number(r.same_level),
      same_committee: Number(r.same_committee), same_school: Number(r.same_school), same_type: Number(r.same_type),
    });
    const get = (h: House) => coh.get(h) ?? { house: h, total: 0, same_level: 0, same_committee: 0, same_school: 0, same_type: 0 };
    const minTotal = Math.min(...HOUSES.map((h) => get(h).total));
    // Cuota global: nadie puede quedar más de 1 por encima de la House más pequeña
    const candidates = HOUSES.filter((h) => get(h).total - minTotal < 1 + 0) .length
      ? HOUSES.filter((h) => get(h).total === minTotal || get(h).total - minTotal < 1)
      : [...HOUSES];
    const seed = crypto.randomUUID();
    const rand = (h: House) => {
      let x = 0;
      for (const ch of seed + h) x = (x * 31 + ch.charCodeAt(0)) >>> 0;
      return x;
    };
    const cohortLoad = (h: House) => { const r = get(h); return r.same_level + r.same_committee + r.same_school + r.same_type; };
    const ranked = [...candidates].sort((a, b) =>
      cohortLoad(a) - cohortLoad(b) ||
      get(a).total - get(b).total ||
      raw[b] - raw[a] ||
      rand(a) - rand(b),
    );
    const chosen: House = ranked[0];
    const cohortSnapshot = Object.fromEntries(HOUSES.map((h) => [h, get(h)]));

    const nowIso = new Date().toISOString();
    const { error: updErr } = await supabaseAdmin
      .from("profiles")
      .update({ house: chosen, sorted_at: nowIso, updated_at: nowIso })
      .eq("id", userId)
      .is("house", null);
    if (updErr) throw new Error(updErr.message);

    await (supabaseAdmin as any).from("house_assignments").insert({
      user_id: userId, house: chosen, method: "algorithm",
      reason: "Asignación balanceada por cohortes", fit_scores: raw,
      answers: data.answers, cohort_snapshot: cohortSnapshot, seed,
    });

    await supabaseAdmin.from("score_events").insert({
      user_id: userId,
      house: chosen,
      source: "sorting",
      points: 0,
    });

    return { house: chosen, resorted: false };
  });

export const getMyParticipant = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("participants")
      .select("participant_type, status, full_name")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as { participant_type: string; status: string; full_name: string } | null;
  });
