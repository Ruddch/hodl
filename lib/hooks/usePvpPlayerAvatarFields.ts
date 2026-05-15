"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile } from "@/lib/api";
import type { PvpReplayPlayer } from "@/lib/types";

export interface PvpPlayerAvatarFields {
  walletAddress: string | null | undefined;
  userId: number;
  avatarUrl: string | null | undefined;
}

/**
 * PvP replay does not include avatar_url — load `/api/users/:wallet` like the rest of the app.
 * For the logged-in player, falls back to session wallet when replay omits it so the query can run.
 */
export function usePvpPlayerAvatarFields(
  player: PvpReplayPlayer | null | undefined
): PvpPlayerAvatarFields {
  const { user } = useAuth();
  const isMe = Boolean(user && player && user.user_id === player.id);
  const walletForQuery =
    (player?.wallet_address ?? (isMe ? user?.wallet_address : undefined)) || undefined;

  const { data: profile } = useUserProfile(walletForQuery, false);

  return useMemo(() => {
    if (!player) {
      return { walletAddress: undefined, userId: 0, avatarUrl: undefined };
    }
    const walletAddress =
      player.wallet_address ??
      profile?.wallet_address ??
      (isMe ? user?.wallet_address : null) ??
      undefined;
    const avatarUrl =
      profile?.avatar_url ??
      (isMe ? user?.avatar_url : undefined) ??
      undefined;
    return {
      walletAddress,
      userId: player.id,
      avatarUrl,
    };
  }, [player, profile, isMe, user]);
}
