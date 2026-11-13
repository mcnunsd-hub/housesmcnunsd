import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Deja la ficha del participante en revisión para que un Super Admin la
 * apruebe desde la sección Solicitudes.
 *
 * Usa la función SECURITY DEFINER `request_participant_review` descrita en
 * README.md. Si aún no se ha instalado en la base de datos, la llamada falla
 * sin afectar el registro (el flujo original sigue funcionando).
 */
export const requestRegistrationReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { error } = await (supabase as any).rpc("request_participant_review");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
