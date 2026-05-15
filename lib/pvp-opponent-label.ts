import type { PvpReplayPlayer } from "@/lib/types";

export function getPvpOpponentDisplayName(player: PvpReplayPlayer): string {
  const n = player.nickname?.trim();
  return n || `Player #${player.id}`;
}

/** Compact header text: who you're facing in Token Duel (full line, e.g. tooltips). */
export function pvpOpponentHeaderLabel(opponent: PvpReplayPlayer | null | undefined): string {
  if (!opponent) return "Waiting for opponent";
  return `vs ${getPvpOpponentDisplayName(opponent)}`;
}
