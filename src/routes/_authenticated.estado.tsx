import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AccessSignOut } from "@/components/access-signout";
import { pageMeta } from "@/lib/page-meta";
import { hasValidRegistration } from "@/lib/onboarding";

export const Route = createFileRoute("/_authenticated/estado")({
  head: () => pageMeta("Estado del registro — MCNUN Houses", "Estado de aprobación y acceso de los participantes de MCNUN 2026."),
  component: RegistrationStatus,
});

function RegistrationStatus() {
  const { access } = Route.useRouteContext();
  const router = useRouter();
  const part = access.participant;
  const pending = part?.status === "pending";
  const rejected = part?.status === "rejected";
  const approved = hasValidRegistration(part) && ["staff", "profesor"].includes(part?.participant_type ?? "") && access.roles.includes(part?.participant_type ?? "");
  const title = pending ? "Solicitud pendiente de aprobación" : rejected ? "Registro rechazado" : approved ? "Registro aprobado" : "Registro incompleto";
  const message = pending ? "El Secretariado de MCNUN revisará su solicitud. El acceso permanecerá pendiente hasta su aprobación." :
    rejected ? "Su solicitud no ha sido aprobada. Comuníquese con el Secretariado de MCNUN para revisar su registro." :
    approved ? `Su registro como ${part?.participant_type === "staff" ? "Staff" : "Profesor"} está aprobado. El portal correspondiente a su rol aún no está disponible.` :
    "Su ficha o autorización requiere revisión. Comuníquese con el Secretariado de MCNUN antes de continuar.";
  return <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 text-center">
    <p className="text-xs text-muted-foreground">MCNUN 2026</p>
    <h1 className="mt-3 text-2xl font-semibold">{title}</h1>
    <p className="mt-4 text-sm text-muted-foreground" role="status">{message}</p>
    <Button variant="outline" className="mt-6" onClick={() => router.invalidate()}>Actualizar estado</Button>
    <AccessSignOut />
  </div>;
}