import { useEffect } from "react";
import type { HouseId } from "@/lib/houses";

export function HouseThemeProvider({
  house,
  children,
}: {
  house: HouseId | null | undefined;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const el = document.documentElement;
    if (house) el.setAttribute("data-house", house);
    else el.removeAttribute("data-house");
    return () => el.removeAttribute("data-house");
  }, [house]);
  return <>{children}</>;
}
