import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: missions }, { data: subs }] = await Promise.all([
      supabase.from("missions").select("id,title,description,points,requires_proof").eq("active", true).order("points", { ascending: false }),
      supabase.from("mission_submissions").select("id,mission_id,status,proof_text,created_at,reviewed_at").eq("user_id", userId),
    ]);

    const byMission = new Map<string, any>();
    for (const s of subs ?? []) byMission.set(s.mission_id, s);

    return {
      missions: (missions ?? []).map((m) => ({
        ...m,
        submission: byMission.get(m.id) ?? null,
      })),
    };
  });

const SubmitSchema = z.object({
  missionId: z.string().uuid(),
  proofText: z.string().min(1).max(2000),
  proofUrl: z.string().url().max(500).optional().nullable(),
});

export const submitMissionProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SubmitSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: mission } = await supabase
      .from("missions")
      .select("id,active")
      .eq("id", data.missionId)
      .maybeSingle();
    if (!mission?.active) throw new Error("Misión no disponible.");

    const { data: existing } = await supabase
      .from("mission_submissions")
      .select("id,status")
      .eq("user_id", userId)
      .eq("mission_id", data.missionId)
      .maybeSingle();

    if (existing && existing.status !== "rejected") {
      throw new Error("Ya enviaste esta misión.");
    }

    if (existing) {
      const { error } = await supabase
        .from("mission_submissions")
        .update({
          proof_text: data.proofText,
          proof_url: data.proofUrl ?? null,
          status: "pending",
          reviewed_at: null,
          reviewed_by: null,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("mission_submissions").insert({
        user_id: userId,
        mission_id: data.missionId,
        proof_text: data.proofText,
        proof_url: data.proofUrl ?? null,
      });
      if (error) throw new Error(error.message);
    }

    return { ok: true };
  });

const ReviewSchema = z.object({
  submissionId: z.string().uuid(),
  approve: z.boolean(),
});

export const reviewMissionSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ReviewSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId: staffId } = context;

    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", staffId)
      .in("role", ["staff", "admin"])
      .maybeSingle();
    if (!role) throw new Error("Solo staff puede revisar misiones.");

    const { data: sub } = await supabase
      .from("mission_submissions")
      .select("id,user_id,mission_id,status,missions(points,title)")
      .eq("id", data.submissionId)
      .maybeSingle<any>();
    if (!sub) throw new Error("Envío no encontrado.");
    if (sub.status === "approved") throw new Error("Ya aprobado.");

    const newStatus = data.approve ? "approved" : "rejected";

    await supabase
      .from("mission_submissions")
      .update({
        status: newStatus,
        reviewed_by: staffId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", sub.id);

    if (data.approve) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("house")
        .eq("id", sub.user_id)
        .maybeSingle();
      if (prof?.house) {
        await supabase.from("score_events").insert({
          user_id: sub.user_id,
          house: prof.house,
          source: "mission",
          points: sub.missions?.points ?? 25,
        });
      }
    }

    return { ok: true, status: newStatus };
  });

export const listPendingSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId: staffId } = context;
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", staffId)
      .in("role", ["staff", "admin"])
      .maybeSingle();
    if (!role) return { submissions: [], isStaff: false };

    const { data } = await supabase
      .from("mission_submissions")
      .select("id,proof_text,proof_url,created_at,status,user_id,mission_id,profiles(full_name,house),missions(title,points)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    return {
      isStaff: true,
      submissions: (data ?? []).map((s: any) => ({
        id: s.id,
        proofText: s.proof_text,
        proofUrl: s.proof_url,
        createdAt: s.created_at,
        delegateName: s.profiles?.full_name ?? "Delegado",
        house: s.profiles?.house ?? null,
        missionTitle: s.missions?.title ?? "Misión",
        points: s.missions?.points ?? 25,
      })),
    };
  });
