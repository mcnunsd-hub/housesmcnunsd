import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/sorting.functions";
import { HouseThemeProvider } from "@/components/house-theme-provider";
import type { HouseId } from "@/lib/houses";
import { getMyAccess } from "@/lib/onboarding.functions";
import { redirectForAccess } from "@/lib/onboarding";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    const access = await getMyAccess();
    const destination = redirectForAccess(access, location.pathname);
    if (destination) throw redirect({ to: destination, replace: true });
    return { access };
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
