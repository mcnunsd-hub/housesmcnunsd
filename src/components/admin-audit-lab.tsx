import { AuditCaseGenerator } from "./audit-case-generator";
import { SimulatedAccountLab } from "./simulated-account-lab";

export function AdminAuditLab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  return <div className="space-y-6">
    <div className="max-w-3xl"><h2 className="text-lg font-semibold">Laboratorio de auditoría</h2><p className="mt-1 text-sm text-muted-foreground">Genera casos defensivos y contrasta permisos con personas ficticias. Ningún control de esta sección modifica participantes, Houses, catálogos ni cuentas reales.</p></div>
    <AuditCaseGenerator />
    {isSuperAdmin ? <SimulatedAccountLab /> : <section className="rounded-lg border border-border bg-card/40 p-5"><h2 className="font-semibold">Cuentas ficticias simuladas</h2><p className="mt-2 text-sm text-muted-foreground">Esta herramienta requiere el rol Super Admin validado en servidor. El generador de casos sí está disponible para administradores autorizados.</p></section>}
  </div>;
}
