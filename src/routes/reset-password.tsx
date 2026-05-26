import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — MCNUN Portal" }] }),
  component: ResetPage,
});

function ResetPage() {
  const nav = useNavigate();
  const [recovery, setRecovery] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setRecovery(true);
    }
  }, []);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("Recovery dispatch sent.");
  }

  async function updatePw(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return toast.error(error.message);
    toast.success("Credentials updated.");
    nav({ to: "/portal" });
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-6 py-12 house-radial-bg">
      <div className="w-full max-w-sm space-y-8">
        <h1 className="text-3xl font-semibold tracking-tight text-center">
          {recovery ? "Set new password" : "Recover access"}
        </h1>
        {recovery ? (
          <form onSubmit={updatePw} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pw">New password</Label>
              <Input id="pw" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">Update</Button>
          </form>
        ) : (
          <form onSubmit={sendLink} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">Send recovery link</Button>
          </form>
        )}
      </div>
    </div>
  );
}
