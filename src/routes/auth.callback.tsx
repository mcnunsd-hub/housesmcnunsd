import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { finishAuthReturn } from "@/lib/auth-return";
import { pageMeta } from "@/lib/page-meta";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth/callback")({
  head: () => pageMeta("Confirmación de acceso — MCNUN Houses", "Confirmación segura del acceso a MCNUN Houses."),
  component: AuthCallback,
});

function AuthCallback() {
  const nav = useNavigate();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    finishAuthReturn().then(() => { if (active) void nav({ to: "/portal", replace: true }); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "No fue posible completar el acceso."); });
    return () => { active = false; };
  }, [nav]);
  return <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 text-center">
    <h1 className="text-2xl font-semibold">MCNUN Houses</h1>
    <p role={error ? "alert" : "status"} className="mt-4 text-sm text-muted-foreground">{error || "Confirmando su sesión…"}</p>
    {error && <Button className="mt-6" onClick={() => nav({ to: "/login", replace: true })}>Volver al acceso</Button>}
  </div>;
}