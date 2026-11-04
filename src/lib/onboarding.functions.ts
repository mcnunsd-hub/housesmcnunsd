import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AccessState } from "./onboarding";

export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccessState> => {
    const [participant, profile, roles] = await Promise.all([
      context.supabase.from("participants").select("participant_type,status,full_name,school,experience,committee_id,country,mesa_roster_id").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("profiles").select("house").eq("id", context.userId).maybeSingle(),
      context.supabase.rpc("my_roles"),
    ]);
    if (participant.error || profile.error || roles.error) throw new Error("No fue posible comprobar su registro. Intente nuevamente.");
    return { participant: participant.data, house: profile.data?.house ?? null, roles: roles.data ?? [] };
  });