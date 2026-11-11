export const demoDelegates = ["Delegado de prueba 01", "Delegado de prueba 02", "Delegado de prueba 03"];
export const demoQrPayload = (index: number) => `MCNUN:DEMO:DELEGATE:${String(index + 1).padStart(2, "0")}`;
export function readDemoQr(value: string, used: string[]) {
  const index = demoDelegates.findIndex((_, i) => demoQrPayload(i) === value.trim());
  if (index < 0) return { ok: false, message: "QR ajeno a esta prueba. No se procesó ningún registro." };
  const payload = demoQrPayload(index);
  if (used.includes(payload)) return { ok: false, message: "Este QR ya fue leído en esta sesión de prueba." };
  return { ok: true, payload, message: `${demoDelegates[index]}: lectura de prueba correcta.` };
}