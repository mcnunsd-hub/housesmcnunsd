import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { RotateCcw, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoDelegates, demoQrPayload, readDemoQr } from "@/lib/qr-demo";

export function DemoQrLab() {
  const [value, setValue] = useState("");
  const [used, setUsed] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  function validate(payload: string) {
    const result = readDemoQr(payload, used);
    setMessage(result.message);
    if (result.ok && result.payload) setUsed(previous => [...previous, result.payload]);
  }
  return <section className="mt-8 space-y-4" aria-label="QR de prueba">
    <h2 className="text-xl font-semibold">QR de prueba</h2>
    <p className="text-sm text-muted-foreground">Identidades ficticias · Sin asistencia oficial</p>
    {demoDelegates.map((name, index) => <div key={name} className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-card p-4">
      <div className="shrink-0 bg-background p-2" data-testid={`demo-qr-${index}`}>
        <QRCodeSVG value={demoQrPayload(index)} size={160} level="H" bgColor="var(--qr-paper)" fgColor="var(--qr-ink)" marginSize={4} />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <h3 className="text-sm font-medium">{name}</h3>
        <p className="break-all font-mono text-xs text-muted-foreground">{demoQrPayload(index)}</p>
        <Button variant="outline" size="sm" onClick={() => validate(demoQrPayload(index))}><ScanLine />Probar lectura {index + 1}</Button>
      </div>
    </div>)}
    <form className="flex flex-wrap gap-2" onSubmit={event => { event.preventDefault(); validate(value); }}>
      <Input aria-label="Contenido del QR de prueba" placeholder="Contenido del QR" value={value} onChange={event => setValue(event.target.value)} className="min-w-0 flex-1" />
      <Button type="submit">Validar</Button>
      <Button type="button" variant="outline" aria-label="Reiniciar prueba" title="Reiniciar prueba" onClick={() => { setUsed([]); setMessage(""); setValue(""); }}><RotateCcw /></Button>
    </form>
    <p role="status" className="text-sm">{message || "Sin lecturas en esta sesión."}</p>
  </section>;
}