import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_admin", { _user_id: userId });
  if (!data) throw new Error("Acceso restringido al panel de administración.");
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const [
      { data: profiles },
      { data: scoreEvents },
      { data: settings },
      { data: roles },
      { data: pendingSubs },
      { data: checkins },
    ] = await Promise.all([
      supabase.from("profiles").select("id,full_name,house,seniority_tier,committee,country,sorted_at"),
      supabase.from("score_events").select("house,points,source,created_at"),
      supabase.from("app_settings").select("key,value"),
      supabase.from("user_roles").select("id,user_id,role"),
      supabase.from("mission_submissions").select("id").eq("status", "pending"),
      supabase.from("checkin_events").select("id"),
    ]);

    const houseStats: Record<string, { delegates: number; advanced: number; first_timer: number; points: number }> = {
      atlas: { delegates: 0, advanced: 0, first_timer: 0, points: 0 },
      aurora: { delegates: 0, advanced: 0, first_timer: 0, points: 0 },
      summit: { delegates: 0, advanced: 0, first_timer: 0, points: 0 },
      eclipse: { delegates: 0, advanced: 0, first_timer: 0, points: 0 },
    };
    let unsorted = 0;
    for (const p of profiles ?? []) {
      if (!p.house) { unsorted++; continue; }
      const h = houseStats[p.house];
      if (!h) continue;
      h.delegates++;
      if (p.seniority_tier === "advanced") h.advanced++;
      else h.first_timer++;
    }
    for (const e of scoreEvents ?? []) {
      if (houseStats[e.house]) houseStats[e.house].points += e.points ?? 0;
    }

    const settingsMap: Record<string, string> = {};
    for (const s of settings ?? []) settingsMap[s.key] = s.value;

    // Enrich roles with profile names
    const userIds = (roles ?? []).map((r: any) => r.user_id);
    const { data: roleProfiles } = userIds.length
      ? await supabase.from("profiles").select("id,full_name").in("id", userIds)
      : { data: [] };
    const nameById = new Map<string, string>();
    for (const rp of roleProfiles ?? []) nameById.set(rp.id, rp.full_name ?? "—");

    return {
      houseStats,
      unsorted,
      totalDelegates: (profiles ?? []).length,
      profiles: (profiles ?? []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        house: p.house,
        seniority_tier: p.seniority_tier,
        committee: p.committee,
        country: p.country,
        sorted_at: p.sorted_at,
      })),
      settings: settingsMap,
      roles: (roles ?? []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        role: r.role,
        name: nameById.get(r.user_id) ?? r.user_id,
      })),
      pendingMissions: (pendingSubs ?? []).length,
      totalCheckins: (checkins ?? []).length,
    };
  });

// ---------- Settings toggle ----------
const SettingSchema = z.object({
  key: z.enum(["trivia_unlocked", "scores_locked"]),
  value: z.enum(["true", "false"]),
});

export const setAppSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SettingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Missions CRUD ----------
const MissionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(2000),
  points: z.number().int().min(1).max(500),
  requires_proof: z.boolean(),
  active: z.boolean(),
});

export const upsertMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => MissionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    if (data.id) {
      const { error } = await supabase.from("missions").update({
        title: data.title, description: data.description, points: data.points,
        requires_proof: data.requires_proof, active: data.active,
      }).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: created, error } = await supabase.from("missions").insert({
        title: data.title, description: data.description, points: data.points,
        requires_proof: data.requires_proof, active: data.active,
      }).select("id").single();
      if (error) throw new Error(error.message);
      return { id: created.id };
    }
  });

export const deleteMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("missions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAllMissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data } = await supabase.from("missions")
      .select("id,title,description,points,requires_proof,active,created_at")
      .order("created_at", { ascending: false });
    return { missions: data ?? [] };
  });

// ---------- Trivia CRUD ----------
const TriviaSchema = z.object({
  id: z.string().uuid().optional(),
  question_text: z.string().min(1).max(500),
  options: z.array(z.object({ letter: z.enum(["A","B","C","D"]), text: z.string().min(1).max(200) })).length(4),
  correct_answer: z.enum(["A","B","C","D"]),
  points: z.number().int().min(1).max(100),
  order_index: z.number().int().min(0).max(999),
});

export const upsertTriviaQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => TriviaSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const payload = {
      question_text: data.question_text,
      options: data.options,
      correct_answer: data.correct_answer,
      points: data.points,
      order_index: data.order_index,
    };
    if (data.id) {
      const { error } = await supabase.from("trivia_questions").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await supabase.from("trivia_questions").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const deleteTriviaQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("trivia_questions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAllTrivia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data } = await supabase.from("trivia_questions")
      .select("id,question_text,options,correct_answer,points,order_index")
      .order("order_index");
    return { questions: data ?? [] };
  });

// ---------- Roles ----------
const RoleAssignSchema = z.object({
  email: z.string().email(),
  role: z.enum(["delegate", "mesa", "profesor", "staff", "admin", "super_admin"]),
});

export const assignRoleByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => RoleAssignSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    // Find user by email from profiles (full_name fallback) — we'll lookup by auth.users via RPC
    // Since we can't read auth.users directly with RLS, use a server-side lookup via service-like approach:
    // We rely on profiles having the same id as auth.users; search by full_name not reliable.
    // Use rpc to fetch user id by email via auth.admin requires service role — fallback: error if not found in profiles by stored email.
    // Simpler: find via profiles table by matching against auth.users using a security definer function.
    const { data: matched, error: rpcErr } = await (supabase as any).rpc("find_user_id_by_email", { _email: data.email });
    if (rpcErr) throw new Error(rpcErr.message);
    const matchedId = matched as string | null;
    if (!matchedId) throw new Error("Usuario no encontrado con ese correo.");
    const { error } = await supabase.from("user_roles").insert({ user_id: matchedId, role: data.role });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Participants ----------
export const deleteParticipant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    if (data.userId === userId) throw new Error("No puedes eliminar tu propia cuenta.");

    const uid = data.userId;

    // Ruta completa: función SECURITY DEFINER incluida en README.md.
    const { error: rpcError } = await (supabase as any).rpc("admin_delete_participant", { _user_id: uid });
    if (!rpcError) return { ok: true, complete: true, warnings: [] as string[] };
    const rpcMissing = rpcError.code === "PGRST202" || /not find|does not exist/i.test(rpcError.message);

    // Respaldo sin función: elimina lo que las políticas actuales permiten.
    // El perfil es lo que muestra la tabla de Casas, así que se elimina primero.
    const warnings: string[] = [];
    const steps: { table: string; column: string }[] = [
      { table: "profiles", column: "id" },
      { table: "user_roles", column: "user_id" },
      { table: "house_assignments", column: "user_id" },
      { table: "score_events", column: "user_id" },
      { table: "mission_submissions", column: "user_id" },
      { table: "checkin_events", column: "user_id" },
      { table: "participants", column: "user_id" },
    ];
    for (const step of steps) {
      const { error } = await supabase.from(step.table as any).delete().eq(step.column as any, uid);
      if (!error) continue;
      if (step.table === "profiles") throw new Error(`No se pudo eliminar el perfil: ${error.message}`);
      warnings.push(step.table);
    }

    return {
      ok: true,
      complete: false,
      warnings,
      message: rpcMissing
        ? "Perfil y accesos eliminados. Aplique la función admin_delete_participant del README para borrar también la ficha del participante."
        : rpcError.message,
    };
  });

export const revokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("user_roles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
