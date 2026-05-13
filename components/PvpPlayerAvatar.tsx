"use client";

import { PlayerAvatar } from "@/components/PlayerAvatar";
import { usePvpPlayerAvatarFields } from "@/lib/hooks/usePvpPlayerAvatarFields";
import type { PvpReplayPlayer } from "@/lib/types";

/** Minimal player shape for PvP UIs — avatar comes from profile API, not replay */
export type PvpAvatarPlayer = PvpReplayPlayer;

export function PvpPlayerAvatar({
  player,
  size = 26,
  className = "",
}: {
  player: PvpAvatarPlayer | null | undefined;
  size?: number;
  className?: string;
}) {
  const { walletAddress, userId, avatarUrl } = usePvpPlayerAvatarFields(player);

  if (!player) {
    return (
      <div
        className={`rounded-full bg-[var(--surface-elevated)] shrink-0 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    <PlayerAvatar
      walletAddress={walletAddress}
      userId={userId}
      avatarUrl={avatarUrl}
      size={size}
      className={className}
    />
  );
}
