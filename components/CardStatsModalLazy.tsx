"use client";

import dynamic from "next/dynamic";

export const CardStatsModal = dynamic(
  () => import("./CardStatsModal").then((mod) => ({ default: mod.CardStatsModal })),
  { ssr: false }
);
