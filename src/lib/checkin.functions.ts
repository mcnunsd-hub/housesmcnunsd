import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TOKEN_TTL_SECONDS = 30;

export const getMyCheckinToken = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString();

    // Remove old tokens to keep table small
    await supabase.from("checkin_tokens").delete().eq("user_id", userId).lt("expires_at", new Date().toISOString());

    const { error } = await supabase.from("checkin_tokens").insert({
      user_id: userId,
      token,
      expires_at: expiresAt,
    });
    if (error) throw new Error(error.message);
    return { token, expiresAt, ttl: TOKEN_TTL_SECONDS };
  });

const RedeemSchema = z.object({
  token: z.string().min(8).max(120),
  location: z.string().max(120).optional(),
  points: z.number().int().min(0).max(50).optional(),
});

export const redeemCheckin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => RedeemSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId: staffId } = context;

    // Validar rol
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", staffId)
      .in("role", ["staff", "admin"])
      .maybeSingle();
    if (!role) throw new Error("Solo staff puede registrar check-ins.");

    // Validar token
    const { data: tok } = await supabase
      .from("checkin_tokens")
      .select("user_id,expires_at")
      .eq("token", data.token)
      .maybeSingle();
    if (!tok) throw new Error("Token inválido.");
    if (new Date(tok.expires_at).getTime() < Date.now()) throw new Error("Token expirado.");

    const points = data.points ?? 5;

    // Insertar evento
    const { error: evErr } = await supabase.from("checkin_events").insert({
      user_id: tok.user_id,
      scanned_by: staffId,
      location: data.location ?? null,
      points,
    });
    if (evErr) throw new Error(evErr.message);

    // Casa del delegado para sumar al leaderboard
    const { data: prof } = await supabase
      .from("profiles")
      .select("house,full_name")
      .eq("id", tok.user_id)
      .maybeSingle();

    if (prof?.house) {
      await supabase.from("score_events").insert({
        user_id: tok.user_id,
        house: prof.house,
        source: "checkin",
        points,
      });
    }

    // Quemar el token (single-use)
    await supabase.from("checkin_tokens").delete().eq("token", data.token);

    return {
      delegateName: prof?.full_name ?? "Delegado",
      house: prof?.house ?? null,
      points,
    };
  });
