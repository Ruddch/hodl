"use client";

import dynamic from "next/dynamic";

export const Onboarding = dynamic(
  () => import("./Onboarding").then((mod) => ({ default: mod.Onboarding })),
  { ssr: false }
);
