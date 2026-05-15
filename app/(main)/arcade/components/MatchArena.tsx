"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { PvpPlayerAvatar } from "@/components/PvpPlayerAvatar";
import type { PvpReplayPlayer } from "@/lib/types";
import { CARD_ASPECT_RATIO } from "@/lib/constants";
import { COMBAT_ANIMATION } from "../combat/combatAnimationConfig";
import { CombatSlotColumn, type CombatOutcome } from "./CombatSlotColumn";
import { CoinFlipOverlay, type CoinFlipWinnerSide } from "./CoinFlipOverlay";

export interface ArenaSlot {
  myImgUrl?: string | null;
  mySymbol?: string;
  /** null/undefined = show рубашку */
  oppImgUrl?: string | null;
  oppSymbol?: string;
  /** true = flip animation completed, show opp card face */
  isOppFlipped: boolean;
  result?: {
    myWeight: number;
    oppWeight: number;
    won: boolean;
    drew: boolean;
    /** fade-in trigger */
    visible: boolean;
  };
  /** Increment to start combat sequence for this slot. */
  combatTrigger?: number;
  /** Outcome from the slot's perspective of the local player. */
  combatOutcome?: CombatOutcome;
}

export interface CoinFlipProps {
  play: boolean;
  winnerSide: CoinFlipWinnerSide;
  onComplete: () => void;
}

interface MatchArenaProps {
  myPlayer: PvpReplayPlayer | null | undefined;
  oppPlayer: PvpReplayPlayer | null | undefined;
  /** Show skeleton rows instead of real opponent info */
  oppPlayerLoading?: boolean;
  slots: ArenaSlot[];
  /** Fallback slot count while data loads */
  slotCount?: number;
  /** Coin-flip overlay config; `null` when not applicable. */
  coinFlip?: CoinFlipProps | null;
}

function formatNickname(player: PvpReplayPlayer): string {
  if (player.nickname) return player.nickname;
  if (player.wallet_address)
    return `${player.wallet_address.slice(0, 6)}…${player.wallet_address.slice(-4)}`;
  return `User #${player.id}`;
}

export function MatchArena({
  myPlayer,
  oppPlayer,
  oppPlayerLoading = false,
  slots,
  slotCount = 5,
  coinFlip = null,
}: MatchArenaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(120);
  const [isMd, setIsMd] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const n = slots.length || slotCount;
  const GAP = 8;
  const INFO_H = isMd ? 40 : 28;
  const AVATAR_SIZE = isMd ? 36 : 26;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsMd(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      // overhead: 2 info rows + VS row (24px h-6) + 4 gaps (2 outer + 2 inner)
      const overhead = INFO_H * 2 + 24 + GAP * 4;
      const availH = (H - overhead) / 2;
      const cardWbyW = (W - GAP * (n - 1)) / n;
      const cardHbyW = cardWbyW / CARD_ASPECT_RATIO;
      setCardH(Math.max(60, Math.floor(Math.min(cardHbyW, availH))));
    };
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    compute();
    return () => ro.disconnect();
  }, [n, INFO_H]);

  const CARD_W = Math.round(cardH * CARD_ASPECT_RATIO);

  const handleImpact = useCallback(() => {
    if (!arenaRef.current) return;
    if (COMBAT_ANIMATION.respectReducedMotion && prefersReducedMotion) return;
    const px = COMBAT_ANIMATION.strike.screenShakePx;
    const dur = COMBAT_ANIMATION.strike.screenShakeMs / 1000;
    animate(
      arenaRef.current,
      { x: [0, -px, px, -px * 0.5, px * 0.5, 0] },
      { duration: dur, ease: "easeOut" },
    );
  }, [prefersReducedMotion]);

  const displaySlots: ArenaSlot[] = slots.length > 0
    ? slots
    : Array.from({ length: slotCount }, () => ({ isOppFlipped: false }));

  return (
    <div ref={containerRef} className="flex flex-col gap-2 flex-1 min-h-0">

      {/* Opponent info */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0" style={{ height: INFO_H }}>
        {oppPlayerLoading ? (
          <>
            <div
              className="rounded-full bg-[var(--surface-elevated)] animate-pulse shrink-0"
              style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
            />
            <div className="h-3 md:h-4 w-28 md:w-40 rounded bg-[var(--surface-elevated)] animate-pulse" />
          </>
        ) : (
          <>
            <PvpPlayerAvatar player={oppPlayer} size={AVATAR_SIZE} />
            <span className="text-xs md:text-base font-semibold text-[var(--text-primary)] truncate">
              {oppPlayer ? formatNickname(oppPlayer) : "Opponent"}
            </span>
            <span className="text-[10px] md:text-xs text-[var(--text-muted)]">· Opponent</span>
          </>
        )}
      </div>

      {/* Combat columns */}
      <div
        ref={arenaRef}
        className="relative flex gap-2 shrink-0 justify-center"
        style={{ willChange: "transform" }}
      >
        {/* NOTE: deliberately no `filter: blur(...)` here. A blur over the
            full card row creates an expensive composite surface that is
            repainted every frame while the coin spins/shakes alongside it
            (~2 fps in practice). Plain `opacity` is GPU-cheap and reads as
            "dimmed background" well enough. */}
        <div
          className="flex gap-2 shrink-0 justify-center"
          style={{
            opacity: coinFlip?.play ? 0.35 : 1,
            transition: "opacity 0.25s ease",
          }}
        >
          {displaySlots.map((slot, i) => (
            <CombatSlotColumn
              key={i}
              cardW={CARD_W}
              cardH={cardH}
              slot={{
                oppImgUrl: slot.oppImgUrl,
                oppSymbol: slot.oppSymbol,
                myImgUrl: slot.myImgUrl,
                mySymbol: slot.mySymbol,
              }}
              isOppFlipped={slot.isOppFlipped}
              result={slot.result}
              combatTrigger={slot.combatTrigger ?? 0}
              combatOutcome={slot.combatOutcome ?? null}
              onImpact={handleImpact}
            />
          ))}
        </div>

        {coinFlip && (
          <CoinFlipOverlay
            play={coinFlip.play}
            winnerSide={coinFlip.winnerSide}
            myPlayer={myPlayer}
            oppPlayer={oppPlayer}
            onImpact={handleImpact}
            onComplete={coinFlip.onComplete}
            isMd={isMd}
          />
        )}
      </div>

      {/* My player info */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0" style={{ height: INFO_H }}>
        <PvpPlayerAvatar player={myPlayer} size={AVATAR_SIZE} />
        <span className="text-xs md:text-base font-semibold text-[var(--text-primary)] truncate">
          {myPlayer ? formatNickname(myPlayer) : "You"}
        </span>
        <span className="text-[10px] md:text-xs text-[var(--text-muted)]">· You</span>
      </div>

    </div>
  );
}
