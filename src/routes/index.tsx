import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { finishAuthReturn } from "@/lib/auth-return";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/")({
  head: () => pageMeta("MCNUN Houses — Acceso inicial", "Acceso al registro y a la comunidad de Houses de MCNUN 2026."),
  component: InitialAccess,
});

function InitialAccess() {
  const nav = useNavigate();
  useEffect(() => {
    let active = true;
    finishAuthReturn().then(() => { if (active) void nav({ to: "/portal", replace: true }); })
      .catch(() => { if (active) void nav({ to: "/login", replace: true }); });
    return () => { active = false; };
  }, [nav]);
  return <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Verificando acceso a MCNUN…</div>;
}
