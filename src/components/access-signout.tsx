import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function AccessSignOut() {
  const qc = useQueryClient();
  const nav = useNavigate();
  return <Button variant="ghost" className="mt-6" onClick={async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    await nav({ to: "/login", replace: true });
  }}>Cerrar sesión</Button>;
}