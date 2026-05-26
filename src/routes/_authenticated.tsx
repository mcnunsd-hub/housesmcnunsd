import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/sorting.functions";
import { HouseThemeProvider } from "@/components/house-theme-provider";
import type { HouseId } from "@/lib/houses";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
  },
  component: AuthLayout,
});

function AuthLayout() {
  const fetchProfile = useServerFn(getMyProfile);
  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
  });

  return (
    <HouseThemeProvider house={(profile?.house ?? null) as HouseId | null}>
      <div className="min-h-svh bg-background text-foreground">
        <Outlet />
      </div>
    </HouseThemeProvider>
  );
}
