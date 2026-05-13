"use client";

import { Avatar } from "@/components/Avatar";

/** Same contract as leaderboard rows: URL from API + deterministic fallback from wallet / user id */
export function PlayerAvatar({
  walletAddress,
  userId,
  avatarUrl,
  size = 40,
  className = "",
  border = false,
  borderColor = "white",
}: {
  walletAddress: string | null | undefined;
  userId: number;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
  border?: boolean;
  borderColor?: string;
}) {
  return (
    <Avatar
      walletAddress={walletAddress}
      fallbackSeed={userId}
      size={size}
      className={className}
      border={border}
      borderColor={borderColor}
      avatarUrl={avatarUrl}
    />
  );
}
