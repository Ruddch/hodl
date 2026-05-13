"use client";

import { useEffect, useRef, useState } from "react";
import { BlurCard } from "@/components/BlurCard";
import { getPvpMatchReplay } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { PvpReplayData, PvpOfferedCard, PvpReplayRoundSlot } from "@/lib/types";
import { MatchArena, type ArenaSlot } from "./MatchArena";
import type { CombatOutcome } from "./CombatSlotColumn";
import {
  COMBAT_ANIMATION,
  getCombatTotalMs,
  getRevealTotalMs,
  getSlotCombatEndMs,
  getSlotCombatStartMs,
  getSlotFlipStartMs,
} from "../combat/combatAnimationConfig";

interface ArcadeResultProps {
  matchId: number;
  /** Hint when we know the role from joinPvp; for history matches we derive it from user_id */
  isPlayer1?: boolean;
  /** Picks made during the draft — shown while waiting for opponent */
  myPicks?: PvpOfferedCard[];
  onPlayAgain: () => void;
}


export function ArcadeResult({ matchId, isPlayer1: isPlayer1Hint, myPicks, onPlayAgain }: ArcadeResultProps) {
  const { user } = useAuth();
  const [replay, setReplay] = useState<PvpReplayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const cancelledRef = useRef(false);

  // Reveal animation state
  const [flippedSlots, setFlippedSlots] = useState<Set<number>>(new Set());
  const [combatTriggers, setCombatTriggers] = useState<number[]>([]);
  const [visibleResults, setVisibleResults] = useState<Set<number>>(new Set());
  const [displayScore, setDisplayScore] = useState({ my: 0, opp: 0 });
  const [revealComplete, setRevealComplete] = useState(false);

  useEffect(() => {
    cancelledRef.current = false;
    setIsLoading(true);
    setReplay(null);

    const poll = async () => {
      if (cancelledRef.current) return;
      try {
        const res = await getPvpMatchReplay(matchId);
        if (cancelledRef.current) return;
        setReplay(res.data);
        setIsLoading(false);
        if (res.data.status !== "completed" && res.data.status !== "cancelled") {
          setTimeout(poll, 30_000);
        }
      } catch {
        if (!cancelledRef.current) {
          setTimeout(poll, 30_000);
        }
      }
    };

    poll();

    return () => {
      cancelledRef.current = true;
    };
  }, [matchId]);

  // Reset animation when navigating to a different match
  useEffect(() => {
    setFlippedSlots(new Set());
    setCombatTriggers([]);
    setVisibleResults(new Set());
    setDisplayScore({ my: 0, opp: 0 });
    setRevealComplete(false);
  }, [matchId]);

  const isCompleted = replay?.status === "completed";
  const isCancelled =
    replay?.status === "cancelled" || replay?.resolution?.tiebreak === "cancelled";
  const isResolved = isCompleted || isCancelled;

  // Sequential reveal animation when match result loads
  const roundSlotsSnap = replay?.round_scores?.slots ?? [];
  const isPlayer1Snap =
    replay !== null
      ? user?.user_id !== undefined
        ? replay.player1?.id === user.user_id
        : (isPlayer1Hint ?? true)
      : (isPlayer1Hint ?? true);

  useEffect(() => {
    if (!isResolved) return;
    if (roundSlotsSnap.length === 0) {
      const t = setTimeout(
        () => setRevealComplete(true),
        COMBAT_ANIMATION.timeline.cancelledBannerDelayMs,
      );
      return () => clearTimeout(t);
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    const cfg = COMBAT_ANIMATION;
    const combatTotal = getCombatTotalMs(cfg);

    roundSlotsSnap.forEach((slot, i) => {
      const flipAt = getSlotFlipStartMs(i, cfg);
      const combatAt = getSlotCombatStartMs(i, cfg);
      const settledAt = getSlotCombatEndMs(i, cfg);

      timers.push(setTimeout(() => {
        setFlippedSlots(prev => new Set([...prev, i]));
      }, flipAt));

      timers.push(setTimeout(() => {
        setCombatTriggers(prev => {
          const next = [...prev];
          while (next.length <= i) next.push(0);
          next[i] = (next[i] || 0) + 1;
          return next;
        });
      }, combatAt));

      // Show weight badges + update score slightly before the slot fully
      // settles so the badge "pops in" right as the recoil ends.
      const badgeAt = settledAt - Math.round(combatTotal * 0.15);
      timers.push(setTimeout(() => {
        setVisibleResults(prev => new Set([...prev, i]));
        const myPts = isPlayer1Snap ? slot.player1_points : slot.player2_points;
        const oppPts = isPlayer1Snap ? slot.player2_points : slot.player1_points;
        setDisplayScore(prev => ({ my: prev.my + myPts, opp: prev.opp + oppPts }));
      }, badgeAt));
    });

    timers.push(setTimeout(
      () => setRevealComplete(true),
      getRevealTotalMs(roundSlotsSnap.length, cfg),
    ));

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResolved, roundSlotsSnap.length]);

  // Derive which player we are: prefer user_id match, fall back to hint
  const isPlayer1 =
    replay !== null
      ? user?.user_id !== undefined
        ? replay.player1?.id === user.user_id
        : (isPlayer1Hint ?? true)
      : (isPlayer1Hint ?? true);

  const myPlayer = isPlayer1 ? replay?.player1 : replay?.player2;
  const oppPlayer = isPlayer1 ? replay?.player2 : replay?.player1;

  // Reconstruct picks from draft_steps if not passed as prop
  const myUserId = user?.user_id ?? myPlayer?.id;
  const picksFromReplay: PvpOfferedCard[] = replay
    ? replay.draft_steps
        .filter((s) => s.user_id === myUserId && s.chosen_card !== null)
        .sort((a, b) => a.step - b.step)
        .map((s) => s.chosen_card!)
    : [];
  const effectivePicks = myPicks && myPicks.length > 0 ? myPicks : picksFromReplay;

  const winnerId = replay?.winner_user_id;
  const myPlayerId = user?.user_id ?? (isPlayer1 ? replay?.player1?.id : replay?.player2?.id);
  const iWon = isCompleted && !isCancelled && winnerId !== null && winnerId === myPlayerId;
  const isDraw = isCompleted && !isCancelled && winnerId === null;
  const isCoinFlip = isCompleted && replay?.resolution?.tiebreak === "coin_flip";
  const resolutionSummary = replay?.resolution?.summary_english ?? null;

  const roundSlots: PvpReplayRoundSlot[] = replay?.round_scores?.slots ?? [];

  // Build card_id → card lookup from all draft steps
  const cardMap = new Map<number, PvpOfferedCard>();
  replay?.draft_steps.forEach((step) => {
    if (step.chosen_card && step.chosen_card_id !== null) {
      cardMap.set(step.chosen_card_id!, step.chosen_card);
    }
  });

  return (
    <div className="w-full max-w-8xl mx-auto flex flex-col min-w-0 h-full">
      <BlurCard backgroundColor="rgba(167, 139, 250, 1)" className="flex flex-col flex-1 min-h-0">
        <div className="flex flex-col gap-5 px-4 sm:px-6 pt-4 md:pt-6 pb-6 md:pb-8 h-full">

          {/* Header */}
          <div className="flex items-center shrink-0">
            <h2
              className="text-3xl text-[var(--text-primary)] tracking-wide uppercase leading-none"
              style={{ fontFamily: "var(--font-league-gothic), sans-serif" }}
            >
              Token Duel
            </h2>
          </div>

          {/* Body */}
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="w-10 h-10 rounded-full border-4 border-purple-400 border-t-transparent animate-spin" />
              <p className="text-sm text-[var(--text-muted)]">Loading result…</p>
            </div>

          ) : !isResolved ? (
            /* ── Waiting for opponent ───────────────────────────────────── */
            <>
              {/* Waiting banner */}
              <div className="flex items-center gap-3 px-4 rounded-2xl bg-[var(--surface-elevated)] shrink-0" style={{ height: 60 }}>
                <div className="w-4 h-4 rounded-full border-[3px] border-purple-400 border-t-transparent animate-spin shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
                    Waiting for opponent to finish…
                  </p>
                  <p className="text-xs text-[var(--text-muted)] leading-tight">
                    You can leave and come back later.
                  </p>
                </div>
              </div>

              {/* Arena — my cards face-up, opp cards face-down */}
              <MatchArena
                myPlayer={myPlayer}
                oppPlayer={null}
                oppPlayerLoading
                slotCount={5}
                slots={Array.from({ length: 5 }, (_, i) => {
                  const card = effectivePicks[i];
                  return {
                    myImgUrl: card?.rendered_image_url || card?.template_image_url || null,
                    mySymbol: card?.token_symbol,
                    oppImgUrl: null,
                    isOppFlipped: false,
                  } satisfies ArenaSlot;
                })}
              />
            </>

          ) : (
            /* ── Match completed ────────────────────────────────────────── */
            <>
              {/* Result banner */}
              <div
                className="flex flex-col items-center justify-center gap-1 py-3 px-5 rounded-2xl shrink-0"
                style={{
                  backgroundColor: !revealComplete
                    ? "var(--surface-elevated)"
                    : isCancelled || isDraw
                    ? "var(--surface-elevated)"
                    : iWon
                    ? "rgba(34, 197, 94, 0.12)"
                    : "rgba(239, 68, 68, 0.08)",
                  transition: "background-color 0.5s ease",
                }}
              >
                <div className="flex items-center justify-center gap-4">
                  {revealComplete && (
                    <span
                      className="text-3xl leading-none"
                      style={{ animation: "fadeInUp 0.4s ease both" }}
                    >
                      {isCancelled ? "⚠️" : isDraw ? "🤝" : iWon ? "🏆" : "😔"}
                    </span>
                  )}
                  {revealComplete && (
                    <p
                      className="text-xl font-bold"
                      style={{
                        color: isCancelled
                          ? "var(--text-primary)"
                          : isDraw
                          ? "var(--text-primary)"
                          : iWon
                          ? "#22c55e"
                          : "#ef4444",
                        animation: "fadeInUp 0.4s ease both",
                      }}
                    >
                      {isCancelled ? "Match Cancelled" : isDraw ? "Draw!" : iWon ? "You Win!" : "You Lose"}
                    </p>
                  )}
                  {!isCancelled && (
                    <p
                      className="text-3xl font-bold tabular-nums"
                      style={{
                        color: !revealComplete
                          ? "var(--text-primary)"
                          : isDraw
                          ? "var(--text-primary)"
                          : iWon
                          ? "#22c55e"
                          : "#ef4444",
                        transition: "color 0.5s ease",
                      }}
                    >
                      {displayScore.my} – {displayScore.opp}
                    </p>
                  )}
                </div>
                {revealComplete && resolutionSummary && (isCancelled || isCoinFlip) && (
                  <p
                    className="text-xs text-[var(--text-muted)] text-center"
                    style={{ animation: "fadeInUp 0.4s ease both" }}
                  >
                    {resolutionSummary}
                  </p>
                )}
              </div>

              {/* Arena */}
              <MatchArena
                myPlayer={myPlayer}
                oppPlayer={oppPlayer}
                slots={roundSlots.map((slot, i) => {
                  const myCardId = isPlayer1 ? slot.player1_card_id : slot.player2_card_id;
                  const oppCardId = isPlayer1 ? slot.player2_card_id : slot.player1_card_id;
                  const myCard = cardMap.get(myCardId);
                  const oppCard = cardMap.get(oppCardId);
                  const myPoints = isPlayer1 ? slot.player1_points : slot.player2_points;
                  const oppPoints = isPlayer1 ? slot.player2_points : slot.player1_points;
                  const myWeight = isPlayer1 ? slot.player1_weight : slot.player2_weight;
                  const oppWeight = isPlayer1 ? slot.player2_weight : slot.player1_weight;
                  const won = myPoints > oppPoints;
                  const drew = myPoints === oppPoints;
                  const outcome: CombatOutcome = drew
                    ? "draw"
                    : won
                    ? "my_win"
                    : "opp_win";
                  return {
                    myImgUrl: myCard?.rendered_image_url || myCard?.template_image_url,
                    mySymbol: myCard?.token_symbol,
                    oppImgUrl: oppCard?.rendered_image_url || oppCard?.template_image_url,
                    oppSymbol: oppCard?.token_symbol,
                    isOppFlipped: flippedSlots.has(i),
                    result: {
                      myWeight,
                      oppWeight,
                      won,
                      drew,
                      visible: visibleResults.has(i),
                    },
                    combatTrigger: combatTriggers[i] ?? 0,
                    combatOutcome: outcome,
                  } satisfies ArenaSlot;
                })}
              />
            </>
          )}

          {/* Action button */}
          <div className="mt-auto pt-2 shrink-0 flex justify-center">
            <button
              onClick={onPlayAgain}
              className="w-full sm:w-fit px-10 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold rounded-[15px] transition-colors text-sm"
            >
              {isResolved ? "Play Again" : "Back"}
            </button>
          </div>

        </div>
      </BlurCard>
    </div>
  );
}
