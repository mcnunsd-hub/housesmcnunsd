import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/google-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/signup")({
  head: () => pageMeta("Crear cuenta — MCNUN Houses", "Creación de cuenta para el registro de participantes de MCNUN 2026."),
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (!data.session) { setConfirmation(true); return; }
    nav({ to: "/portal", replace: true });
  }

  async function google() {
    try {
      await signInWithGoogle();
    } catch { toast.error("No fue posible iniciar sesión con Google."); }
  }

  if (confirmation) return <div className="mx-auto flex min-h-svh max-w-sm flex-col justify-center px-6 text-center">
    <h1 className="text-2xl font-semibold">Confirme su correo</h1>
    <p className="mt-4 text-sm text-muted-foreground" role="status">Revise su correo y utilice el enlace de confirmación para continuar con su registro en MCNUN.</p>
    <Button variant="outline" className="mt-6" onClick={() => nav({ to: "/login" })}>Volver al acceso</Button>
  </div>;

  return (
    <div className="flex min-h-svh items-center justify-center px-6 py-12 house-radial-bg">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">MCNUN</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Registro de Delegado</h1>
          <p className="mt-2 text-sm text-muted-foreground">Tu identidad precede a tu Casa.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Registrando…" : "Registrar Delegado"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em]"><span className="bg-background px-3 text-muted-foreground">o</span></div>
        </div>

        <Button variant="outline" className="w-full" onClick={google}>Continuar con Google</Button>

        <p className="text-center text-xs text-muted-foreground">
          ¿Ya estás registrado?{" "}
          <Link to="/login" className="text-foreground underline-offset-4 hover:underline">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
