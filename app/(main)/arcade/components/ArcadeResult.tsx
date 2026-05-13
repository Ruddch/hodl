"use client";

import { useEffect, useRef, useState } from "react";
import { BlurCard } from "@/components/BlurCard";
import { getPvpMatchReplay } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { PvpReplayData, PvpOfferedCard, PvpReplayRoundSlot } from "@/lib/types";
import { MatchArena, type ArenaSlot } from "./MatchArena";
import type { CombatOutcome } from "./CombatSlotColumn";
import { ArcadeResultBanner, type ArcadeResultStatus } from "./ArcadeResultBanner";
import {
  COMBAT_ANIMATION,
  getCoinFlipStartMs,
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

/**
 * Derive the banner's narrative state across every match phase.
 * - "loading": initial replay fetch.
 * - "waiting": opponent hasn't finished their draft.
 * - "pending": reveal animation in progress (scores tick up).
 * - "coin_flip": coin spinning — score frozen, label neutral.
 * - terminal: cancelled / draw / victory / defeat.
 */
function getBannerStatus(args: {
  isLoading: boolean;
  isResolved: boolean;
  revealComplete: boolean;
  coinFlipPlay: boolean;
  isCancelled: boolean;
  isDraw: boolean;
  iWon: boolean;
}): ArcadeResultStatus {
  if (args.isLoading) return { kind: "loading" };
  if (!args.isResolved) return { kind: "waiting" };
  if (!args.revealComplete) {
    if (args.coinFlipPlay) return { kind: "coin_flip" };
    return { kind: "pending" };
  }
  if (args.isCancelled) return { kind: "cancelled" };
  if (args.isDraw) return { kind: "draw" };
  return args.iWon ? { kind: "victory" } : { kind: "defeat" };
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
  const [coinFlipPlay, setCoinFlipPlay] = useState(false);
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
    setCoinFlipPlay(false);
    setRevealComplete(false);
  }, [matchId]);

  const isCompleted = replay?.status === "completed";
  const isCancelled =
    replay?.status === "cancelled" || replay?.resolution?.tiebreak === "cancelled";
  const isResolved = isCompleted || isCancelled;

  // Derive which player we are: prefer user_id match, fall back to hint
  const isPlayer1 =
    replay !== null
      ? user?.user_id !== undefined
        ? replay.player1?.id === user.user_id
        : (isPlayer1Hint ?? true)
      : (isPlayer1Hint ?? true);

  const myPlayer = isPlayer1 ? replay?.player1 : replay?.player2;
  const oppPlayer = isPlayer1 ? replay?.player2 : replay?.player1;

  const winnerId = replay?.winner_user_id;
  const myPlayerId = user?.user_id ?? (isPlayer1 ? replay?.player1?.id : replay?.player2?.id);
  const iWon = isCompleted && !isCancelled && winnerId != null && winnerId === myPlayerId;
  const isDraw = isCompleted && !isCancelled && winnerId === null;
  const isCoinFlip = isCompleted && replay?.resolution?.tiebreak === "coin_flip";
  const needsCoinFlip = !!isCoinFlip && !isCancelled && winnerId != null;
  const resolutionSummary = replay?.resolution?.summary_english ?? null;

  // Sequential reveal animation when match result loads
  const roundSlotsSnap = replay?.round_scores?.slots ?? [];

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
        const myPts = isPlayer1 ? slot.player1_points : slot.player2_points;
        const oppPts = isPlayer1 ? slot.player2_points : slot.player1_points;
        setDisplayScore(prev => ({ my: prev.my + myPts, opp: prev.opp + oppPts }));
      }, badgeAt));
    });

    if (needsCoinFlip) {
      // Banner stays neutral while the coin spins; overlay's onComplete
      // promotes revealComplete itself.
      timers.push(setTimeout(
        () => setCoinFlipPlay(true),
        getCoinFlipStartMs(roundSlotsSnap.length, cfg),
      ));
    } else {
      timers.push(setTimeout(
        () => setRevealComplete(true),
        getRevealTotalMs(roundSlotsSnap.length, cfg),
      ));
    }

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResolved, roundSlotsSnap.length, needsCoinFlip]);

  // Reconstruct picks from draft_steps if not passed as prop
  const myUserId = user?.user_id ?? myPlayer?.id;
  const picksFromReplay: PvpOfferedCard[] = replay
    ? replay.draft_steps
        .filter((s) => s.user_id === myUserId && s.chosen_card !== null)
        .sort((a, b) => a.step - b.step)
        .map((s) => s.chosen_card!)
    : [];
  const effectivePicks = myPicks && myPicks.length > 0 ? myPicks : picksFromReplay;

  const roundSlots: PvpReplayRoundSlot[] = replay?.round_scores?.slots ?? [];

  // Build card_id → card lookup from all draft steps
  const cardMap = new Map<number, PvpOfferedCard>();
  replay?.draft_steps.forEach((step) => {
    if (step.chosen_card && step.chosen_card_id !== null) {
      cardMap.set(step.chosen_card_id!, step.chosen_card);
    }
  });

  const bannerStatus = getBannerStatus({
    isLoading,
    isResolved,
    revealComplete,
    coinFlipPlay,
    isCancelled,
    isDraw,
    iWon,
  });

  // Caption under the score:
  // - resolved match: optional resolution summary (cancellation / coin flip).
  // - waiting: friendly hint that the user can come back later.
  const bannerCaption: string | null = (() => {
    if (bannerStatus.kind === "waiting") {
      return "You can leave and come back later.";
    }
    if (
      (bannerStatus.kind === "cancelled" || bannerStatus.kind === "coin_flip") &&
      resolutionSummary &&
      revealComplete
    ) {
      return resolutionSummary;
    }
    return null;
  })();

  const banner = (
    <ArcadeResultBanner
      myScore={displayScore.my}
      oppScore={displayScore.opp}
      status={bannerStatus}
      caption={bannerCaption}
    />
  );

  return (
    <div className="w-full max-w-8xl mx-auto flex flex-col min-w-0 h-full">
      <BlurCard backgroundColor="rgba(167, 139, 250, 1)" className="flex flex-col flex-1 min-h-0">
        <div className="flex flex-col gap-5 px-4 sm:px-6 pt-4 md:pt-6 pb-6 md:pb-8 h-full">

          {/* Header — title + (on desktop) the banner share one row.
              The title sits at the TOP of the row, aligned with the banner's
              status label. The score (or placeholder) grows downward. The
              banner is rendered absolutely so it stays centered relative to
              the whole card, not to the space after the title. */}
          <div className="relative flex items-start shrink-0 md:min-h-[92px]">
            <h2
              className="text-3xl text-[var(--text-primary)] tracking-wide uppercase leading-none relative z-10"
              style={{ fontFamily: "var(--font-league-gothic), sans-serif" }}
            >
              Token Duel
            </h2>

            <div className="hidden md:flex md:absolute md:inset-x-0 md:top-0 md:justify-center md:pointer-events-none">
              {banner}
            </div>
          </div>

          {/* Mobile-only banner. Desktop banner lives inside the header row
              above so it shares a line with the title. */}
          <div className="md:hidden">{banner}</div>

          {/* Body — arena is always rendered. Its slot count / face-down
              state varies per phase, but the layout footprint stays the same
              so transitions between loading → waiting → result are seamless. */}
          {isLoading || !isResolved ? (
            /* ── Loading / waiting: my cards face-up, opp face-down ──── */
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
          ) : (
            /* ── Match completed ──────────────────────────────────────── */
            <MatchArena
              myPlayer={myPlayer}
              oppPlayer={oppPlayer}
              coinFlip={
                needsCoinFlip
                  ? {
                      play: coinFlipPlay,
                      winnerSide: iWon ? "my" : "opp",
                      onComplete: () => setRevealComplete(true),
                    }
                  : null
              }
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
