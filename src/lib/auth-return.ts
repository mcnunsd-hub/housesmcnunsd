import { supabase } from "@/integrations/supabase/client";

// getUser waits for the client's initialization (including URL token/code processing)
// and validates the resulting session with Auth. Never consume a PKCE code twice.
export async function finishAuthReturn() {
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));
  if (params.has("error") || hash.has("error")) throw new Error("No fue posible completar el acceso. Intente iniciar sesión nuevamente.");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("No se recibió una sesión válida. Inicie sesión nuevamente.");
  window.history.replaceState(null, "", window.location.pathname);
  return data.user;
}