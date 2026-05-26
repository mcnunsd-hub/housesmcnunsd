import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — MCNUN Portal" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    nav({ to: "/portal" });
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("error" in r && r.error ? String((r.error as Error).message ?? r.error) : "Google sign-in failed");
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-6 py-12 house-radial-bg">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">MCNUN</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Portal Access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Authenticated entry for sorted and unsorted delegates.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Authenticating…" : "Enter Portal"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em]"><span className="bg-background px-3 text-muted-foreground">or</span></div>
        </div>

        <Button variant="outline" className="w-full" onClick={google}>Continue with Google</Button>

        <p className="text-center text-xs text-muted-foreground">
          New delegate?{" "}
          <Link to="/signup" className="text-foreground underline-offset-4 hover:underline">Create credentials</Link>
        </p>
      </div>
    </div>
  );
}
