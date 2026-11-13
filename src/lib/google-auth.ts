import { supabase } from "@/integrations/supabase/client";

/**
 * Inicia sesión con Google usando el proveedor OAuth configurado en Supabase.
 * El navegador es redirigido a Google y, al volver, Supabase procesa la sesión
 * en /auth/callback.
 */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) throw error;
}
