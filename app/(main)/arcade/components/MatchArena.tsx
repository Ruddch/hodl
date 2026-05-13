"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { PvpPlayerAvatar } from "@/components/PvpPlayerAvatar";
import type { PvpReplayPlayer } from "@/lib/types";
import { CARD_ASPECT_RATIO } from "@/lib/constants";

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
}

interface MatchArenaProps {
  myPlayer: PvpReplayPlayer | null | undefined;
  oppPlayer: PvpReplayPlayer | null | undefined;
  /** Show skeleton rows instead of real opponent info */
  oppPlayerLoading?: boolean;
  slots: ArenaSlot[];
  /** Fallback slot count while data loads */
  slotCount?: number;
}

function formatNickname(player: PvpReplayPlayer): string {
  if (player.nickname) return player.nickname;
  if (player.wallet_address)
    return `${player.wallet_address.slice(0, 6)}…${player.wallet_address.slice(-4)}`;
  return `User #${player.id}`;
}

function weightResultColor(won: boolean, drew: boolean, isMe: boolean) {
  if (drew) return "#6b7280";
  if (won) return isMe ? "#22c55e" : "#ef4444";
  return isMe ? "#ef4444" : "#22c55e";
}

export function MatchArena({
  myPlayer,
  oppPlayer,
  oppPlayerLoading = false,
  slots,
  slotCount = 5,
}: MatchArenaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(120);

  const n = slots.length || slotCount;
  const GAP = 8;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      // overhead: 2 info rows (28px) + VS row (36px) + 4 gaps
      const overhead = 28 * 2 + 36 + GAP * 4;
      const availH = (H - overhead) / 2;
      const cardWbyW = (W - GAP * (n - 1)) / n;
      const cardHbyW = cardWbyW / CARD_ASPECT_RATIO;
      setCardH(Math.max(60, Math.floor(Math.min(cardHbyW, availH))));
    };
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    compute();
    return () => ro.disconnect();
  }, [n]);

  const CARD_W = Math.round(cardH * CARD_ASPECT_RATIO);

  const myCardEl = (imgUrl?: string | null, symbol?: string) => (
    <div
      className="relative rounded-[8px] overflow-hidden border border-[var(--border-subtle)] shrink-0"
      style={{ width: CARD_W, height: cardH }}
    >
      {imgUrl ? (
        <Image src={imgUrl} alt={symbol ?? ""} fill className="object-cover" sizes="20vw" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-elevated)]">
          <span className="text-[9px] font-bold text-[var(--text-muted)]">{symbol ?? "?"}</span>
        </div>
      )}
    </div>
  );

  const oppCardEl = (imgUrl?: string | null, symbol?: string, isFlipped = false) => (
    <div className="shrink-0" style={{ width: CARD_W, height: cardH, perspective: 1000 }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transition: "transform 520ms cubic-bezier(0.34, 1.1, 0.64, 1)",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          borderRadius: 8,
        }}
      >
        {/* Back — рубашка */}
        <div
          style={{
            position: "absolute", inset: 0, borderRadius: 8, overflow: "hidden",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <Image src="/card1.png" alt="card back" fill className="object-cover" sizes="20vw" />
        </div>
        {/* Front — лицо карты */}
        <div
          style={{
            position: "absolute", inset: 0, borderRadius: 8, overflow: "hidden",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {imgUrl ? (
            <Image src={imgUrl} alt={symbol ?? ""} fill className="object-cover" sizes="20vw" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-elevated)]">
              <span className="text-[9px] font-bold text-[var(--text-muted)]">{symbol ?? "?"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const displaySlots: ArenaSlot[] = slots.length > 0
    ? slots
    : Array.from({ length: slotCount }, () => ({ isOppFlipped: false }));

  return (
    <div ref={containerRef} className="flex flex-col gap-2 flex-1 min-h-0">

      {/* My player info */}
      <div className="flex items-center gap-2 shrink-0" style={{ height: 28 }}>
        <PvpPlayerAvatar player={myPlayer} size={26} />
        <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
          {myPlayer ? formatNickname(myPlayer) : "You"}
        </span>
        <span className="text-[10px] text-[var(--text-muted)]">· You</span>
      </div>

      {/* My cards row */}
      <div className="flex gap-2 shrink-0 justify-center">
        {displaySlots.map((slot, i) => (
          <div key={i}>
            {myCardEl(slot.myImgUrl, slot.mySymbol)}
          </div>
        ))}
      </div>

      {/* VS / results divider */}
      <div className="flex gap-2 shrink-0 justify-center">
        {displaySlots.map((slot, i) => {
          const r = slot.result;
          const revealed = r?.visible ?? false;
          return (
            <div
              key={i}
              className="flex items-center h-6 justify-center gap-1.5 py-1.5 rounded-lg shrink-0"
              style={{
                width: CARD_W,
                backgroundColor: !revealed || !r
                  ? "var(--surface-elevated)"
                  : r.won
                  ? "rgba(34, 197, 94, 0.10)"
                  : r.drew
                  ? "var(--surface-elevated)"
                  : "rgba(239, 68, 68, 0.08)",
                opacity: revealed ? 1 : 0.3,
                transition: "opacity 0.35s ease, background-color 0.35s ease",
              }}
            >
              {r && (
                <>
                  <span
                    className="font-bold tabular-nums rounded leading-none"
                    style={{
                      color: "white",
                      backgroundColor: weightResultColor(r.won, r.drew, true),
                      fontSize: "10px",
                      padding: "2px 5px",
                      borderRadius: 3,
                    }}
                  >
                    {r.myWeight}
                  </span>
                  <span
                    className="text-xs font-bold leading-none"
                    style={{ color: r.won ? "#22c55e" : r.drew ? "var(--text-muted)" : "#ef4444" }}
                  >
                    {r.won ? "✓" : r.drew ? "=" : "✗"}
                  </span>
                  <span
                    className="font-bold tabular-nums rounded leading-none"
                    style={{
                      color: "white",
                      backgroundColor: weightResultColor(r.won, r.drew, false),
                      fontSize: "10px",
                      padding: "2px 5px",
                      borderRadius: 3,
                    }}
                  >
                    {r.oppWeight}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Opp cards row */}
      <div className="flex gap-2 shrink-0 justify-center">
        {displaySlots.map((slot, i) => (
          <div key={i}>
            {oppCardEl(slot.oppImgUrl, slot.oppSymbol, slot.isOppFlipped)}
          </div>
        ))}
      </div>

      {/* Opponent info */}
      <div className="flex items-center gap-2 shrink-0" style={{ height: 28 }}>
        {oppPlayerLoading ? (
          <>
            <div className="w-[26px] h-[26px] rounded-full bg-[var(--surface-elevated)] animate-pulse shrink-0" />
            <div className="h-3 w-28 rounded bg-[var(--surface-elevated)] animate-pulse" />
          </>
        ) : (
          <>
            <PvpPlayerAvatar player={oppPlayer} size={26} />
            <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
              {oppPlayer ? formatNickname(oppPlayer) : "Opponent"}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">· Opponent</span>
          </>
        )}
      </div>

    </div>
  );
}
