"use client";

import { usePathname } from "next/navigation";
import { MainLayout } from "@/components/MainLayout";

const PAGE_TITLES: Record<string, string> = {
  "/tournament": "Tournaments",
  "/leaderboard": "Leaderboard",
  "/tokens": "Tokens",
  "/packs": "Packs",
  "/forge": "Forge",
  "/arcade": "Arcade",
  "/profile": "Profile",
  "/prize-preview": "Prize preview",
};

function getTitle(pathname: string | null): string {
  if (!pathname) return "";
  const normalized = pathname.replace(/\/$/, "") || "/";
  const exact = PAGE_TITLES[normalized];
  if (exact) return exact;
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (normalized === path || normalized.startsWith(path + "/")) return title;
  }
  return "";
}

export default function MainLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title = getTitle(pathname);
  return <MainLayout title={title}>{children}</MainLayout>;
}
