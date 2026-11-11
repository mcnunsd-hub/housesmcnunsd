import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ClipboardCheck, Sparkles, Trophy, FlaskConical } from "lucide-react";
import { pageMeta } from "@/lib/page-meta";
import { Button } from "@/components/ui/button";
import { DemoRetosLab } from "@/components/demo-retos-lab";

export const Route = createFileRoute("/auditoria-dashboard")({
  beforeLoad: () => { if (!import.meta.env.DEV) throw notFound(); },
  head: () => pageMeta("Dashboard simulado — MCNUN Houses", "Vista previa local de desarrollo sin datos ni acciones reales."),
  component: AuditDashboardPage,
});

const modules = [
  { label: "Marcador Global", detail: "Vista de competencia entre Houses", icon: Trophy },
  { label: "Trivia Geopolítica", detail: "Pantalla de participación y cuenta regresiva", icon: Sparkles },
  { label: "Check-in QR", detail: "Vista de acceso a la experiencia", icon: QrCode },
  { label: "Misiones", detail: "Solo presentación; integración independiente", icon: ClipboardCheck },
];

function AuditDashboardPage() {
  return <main className="mx-auto max-w-md px-6 py-10">
    <header className="flex items-center justify-between gap-4">
      <div><p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">MCNUN 2026 · Borrador</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Dashboard simulado</h1></div>
      <FlaskConical className="size-6 text-muted-foreground" aria-hidden />
    </header>
    <div role="status" className="mt-6 rounded-md border border-primary/40 bg-primary/10 p-4 text-sm">
      Vista previa exclusiva de desarrollo. No hay participante, House, puntos ni sesión de prueba asociados; ninguna acción escribe en la base de datos.
    </div>
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-6">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Participante ficticio</p>
      <h2 className="mt-2 text-xl font-semibold">Delegado de Prueba</h2>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded border border-border p-3"><dt className="text-muted-foreground">House</dt><dd className="mt-1 font-medium">Sin asignar</dd></div>
        <div className="rounded border border-border p-3"><dt className="text-muted-foreground">Estado</dt><dd className="mt-1 font-medium">Simulación visual</dd></div>
        <div className="col-span-2 rounded border border-border p-3"><dt className="text-muted-foreground">Comité · Delegación</dt><dd className="mt-1 font-medium">Contenido de muestra · Sin datos reales</dd></div>
      </dl>
    </section>
    <section className="mt-8 space-y-3" aria-label="Módulos simulados">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Módulos · Solo presentación</p>
      {modules.map(({ label, detail, icon: Icon }) => <div key={label} className="flex items-center gap-4 rounded border border-border bg-card/40 p-4">
        <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1"><p className="text-sm font-medium">{label}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>
        <Button type="button" variant="outline" size="sm" disabled>Simulado</Button>
      </div>)}
    </section>
    <DemoQrLab />
    <Link to="/registro" className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Volver al registro</Link>
  </main>;
}
