"use client";

import { BlurCard } from "@/components/BlurCard";
import type { PvpReplayPlayer } from "@/lib/types";

interface ArcadeWaitingProps {
  secondsLeft: number;
  totalSeconds: number;
  player1: PvpReplayPlayer | null;
  player2: PvpReplayPlayer | null;
  onCancel: () => void;
}

function formatAddress(addr: string | null): string {
  if (!addr) return "Unknown";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function PlayerSlot({ player, label }: { player: PvpReplayPlayer | null; label: string }) {
  const name = player?.nickname ?? (player?.wallet_address ? formatAddress(player.wallet_address) : null);

  return (
    <div className="flex flex-col items-center gap-3 w-32">
      <div
        className={[
          "w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold",
          player ? "bg-purple-500/30 text-purple-300" : "bg-[var(--surface-elevated)] animate-pulse",
        ].join(" ")}
      >
        {player && name ? name[0].toUpperCase() : null}
      </div>
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1">{label}</p>
        {!player ? (
          <div className="h-3.5 w-20 rounded bg-[var(--surface-elevated)] animate-pulse mx-auto" />
        ) : (
          <p className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[7rem]">
            {name ?? "—"}
          </p>
        )}
      </div>
    </div>
  );
}

export function ArcadeWaiting({ secondsLeft, totalSeconds, player1, player2, onCancel }: ArcadeWaitingProps) {
  const total = totalSeconds > 0 ? totalSeconds : 1;
  const progress = Math.min(100, ((total - secondsLeft) / total) * 100);
  const bothKnown = player1 !== null && player2 !== null;

  return (
    <div className="w-full max-w-8xl mx-auto flex flex-col min-w-0 h-full">
      <BlurCard
        backgroundColor="rgba(167, 139, 250, 1)"
        className="flex flex-col flex-1 min-h-0"
        bgLayerWidthPercent={50}
        bgLayerHeightPercent={50}
        bgLayerAlignX="center"
        bgLayerAlignY="center"
        blurValue={120}
      >
        <div className="flex flex-col items-center justify-center flex-1 gap-10 px-4 py-12">

          {/* Title */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs uppercase tracking-[0.2em] text-purple-400 font-semibold">
              {bothKnown ? "Match Found" : "Searching…"}
            </p>
            <h2
              className="text-4xl md:text-5xl text-[var(--text-primary)] tracking-wide uppercase leading-none"
              style={{ fontFamily: "var(--font-league-gothic), sans-serif" }}
            >
              Token Duel
            </h2>
          </div>

          {/* Players */}
          <div className="flex items-center gap-6 sm:gap-10">
            <PlayerSlot player={player1} label="Player 1" />
            <span
              className="text-3xl md:text-4xl font-bold text-purple-400/60"
              style={{ fontFamily: "var(--font-league-gothic), sans-serif" }}
            >
              VS
            </span>
            <PlayerSlot player={player2} label="Player 2" />
          </div>

          {/* Countdown */}
          {secondsLeft > 0 && (
            <div className="flex flex-col items-center gap-3 w-full max-w-xs">
              <p className="text-sm text-[var(--text-muted)]">
                Draft starts in{" "}
                <span className="text-[var(--text-primary)] font-semibold tabular-nums">
                  {secondsLeft}s
                </span>
              </p>
              <div className="w-full h-1.5 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={onCancel}
            className="px-7 py-2.5 rounded-[15px] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors text-sm font-medium"
          >
            Cancel
          </button>

        </div>
      </BlurCard>
    </div>
  );
}
