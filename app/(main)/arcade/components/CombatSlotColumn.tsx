"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { animate, useReducedMotion } from "motion/react";
import {
  COMBAT_ANIMATION,
  type CombatAnimationConfig,
} from "../combat/combatAnimationConfig";

export type CombatOutcome = "my_win" | "opp_win" | "draw" | null;

export interface CombatSlotData {
  oppImgUrl?: string | null;
  oppSymbol?: string;
  myImgUrl?: string | null;
  mySymbol?: string;
}

export interface CombatSlotResult {
  myWeight: number;
  oppWeight: number;
  won: boolean;
  drew: boolean;
  /** Show weight badges (parent flag, toggled at end of combat). */
  visible: boolean;
}

interface CombatSlotColumnProps {
  cardW: number;
  cardH: number;
  slot: CombatSlotData;
  isOppFlipped: boolean;
  result?: CombatSlotResult;
  /** Increments to start a new combat sequence; reset to 0 to cancel. */
  combatTrigger: number;
  combatOutcome: CombatOutcome;
  /** Called once per slot at the impact moment (for screen shake). */
  onImpact?: () => void;
  config?: CombatAnimationConfig;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function weightResultColor(won: boolean, drew: boolean, isMe: boolean) {
  if (drew) return "#6b7280";
  if (won) return isMe ? "#22c55e" : "#ef4444";
  return isMe ? "#ef4444" : "#22c55e";
}

const FLASH_GRADIENT =
  "radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(167,139,250,0.7) 35%, rgba(167,139,250,0) 70%)";

export function CombatSlotColumn({
  cardW,
  cardH,
  slot,
  isOppFlipped,
  result,
  combatTrigger,
  combatOutcome,
  onImpact,
  config = COMBAT_ANIMATION,
}: CombatSlotColumnProps) {
  const oppWrapRef = useRef<HTMLDivElement>(null);
  const myWrapRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const cardHRef = useRef(cardH);
  const onImpactRef = useRef(onImpact);
  const configRef = useRef(config);

  useEffect(() => {
    cardHRef.current = cardH;
  }, [cardH]);
  useEffect(() => {
    onImpactRef.current = onImpact;
  }, [onImpact]);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const resetTransforms = () => {
      [oppWrapRef.current, myWrapRef.current].forEach((el) => {
        if (!el) return;
        el.style.transform = "";
        el.style.filter = "";
        el.style.boxShadow = "";
        el.style.zIndex = "1";
      });
      if (flashRef.current) flashRef.current.style.opacity = "0";
    };

    resetTransforms();
    if (!combatTrigger) return;
    if (!combatOutcome) return;

    let cancelled = false;
    const C = configRef.current;
    const hCard = cardHRef.current;

    // Lift the attacking card(s) above the sibling so a dash never paints
    // underneath the opposing card. For draws both cards collide in the
    // middle, so both get bumped equally.
    if (combatOutcome === "my_win") {
      if (myWrapRef.current) myWrapRef.current.style.zIndex = "3";
      if (oppWrapRef.current) oppWrapRef.current.style.zIndex = "1";
    } else if (combatOutcome === "opp_win") {
      if (oppWrapRef.current) oppWrapRef.current.style.zIndex = "3";
      if (myWrapRef.current) myWrapRef.current.style.zIndex = "1";
    } else if (combatOutcome === "draw") {
      if (oppWrapRef.current) oppWrapRef.current.style.zIndex = "2";
      if (myWrapRef.current) myWrapRef.current.style.zIndex = "2";
    }

    const triggerImpact = () => {
      onImpactRef.current?.();
      if (flashRef.current) {
        animate(
          flashRef.current,
          { opacity: [0, 1, 0] },
          { duration: 0.22, times: [0, 0.25, 1], ease: "easeOut" },
        );
      }
    };

    const reduced = C.respectReducedMotion && !!prefersReducedMotion;

    const playReduced = async () => {
      if (combatOutcome === "draw") return;
      const loseRef = combatOutcome === "my_win" ? oppWrapRef : myWrapRef;
      if (!loseRef.current) return;
      await animate(
        loseRef.current,
        { filter: "grayscale(1) brightness(0.7)" },
        { duration: 0.2 },
      );
    };

    const playStrike = async () => {
      if (combatOutcome !== "my_win" && combatOutcome !== "opp_win") return;
      const winnerIsMy = combatOutcome === "my_win";
      const winRef = winnerIsMy ? myWrapRef : oppWrapRef;
      const loseRef = winnerIsMy ? oppWrapRef : myWrapRef;
      const winEl = winRef.current;
      const loseEl = loseRef.current;
      if (!winEl || !loseEl) return;

      // my is at bottom of column → wins by moving UP (-1)
      // opp is at top of column → wins by moving DOWN (+1)
      const winDir = winnerIsMy ? -1 : 1;
      const pullPx = C.strike.anticipationPullPct * hCard;
      const dashPx = C.strike.dashTravelPct * hCard;
      const winRecoilPx = C.strike.winnerRecoilPct * hCard;
      const loseRecoilPx = C.strike.loserRecoilPct * hCard;

      await animate(
        winEl,
        { y: -winDir * pullPx },
        { duration: C.strike.anticipationMs / 1000, ease: C.easings.anticipate },
      );
      if (cancelled) return;

      animate(
        winEl,
        {
          y: winDir * dashPx,
          scale: C.strike.winnerImpactScale,
          boxShadow: "0 0 28px 6px rgba(167,139,250,0.7)",
        },
        { duration: C.strike.dashMs / 1000, ease: C.easings.strike },
      );
      await sleep(C.strike.dashMs);
      if (cancelled) return;

      triggerImpact();

      // Loser reacts (knock back + shake) over hitStop+recoil so the
      // movement clearly starts at impact.
      animate(
        loseEl,
        {
          y: winDir * loseRecoilPx,
          scale: C.strike.loserImpactScale,
          rotate: [0, -C.strike.loserShakeDeg, C.strike.loserShakeDeg, 0],
        },
        {
          duration: (C.strike.hitStopMs + C.strike.recoilMs) / 1000,
          ease: C.easings.recoil,
        },
      );

      await sleep(C.strike.hitStopMs);
      if (cancelled) return;

      await animate(
        winEl,
        {
          y: -winDir * winRecoilPx,
          scale: 1,
          boxShadow: "0 0 0 0 rgba(167,139,250,0)",
        },
        { duration: C.strike.recoilMs / 1000, ease: C.easings.recoil },
      );
      if (cancelled) return;

      await Promise.all([
        animate(
          winEl,
          { y: 0, scale: 1, rotate: 0 },
          { duration: C.strike.settleMs / 1000, ease: C.easings.settle },
        ),
        animate(
          loseEl,
          {
            y: 0,
            scale: 1,
            rotate: 0,
            filter: "grayscale(1) brightness(0.7)",
          },
          { duration: C.strike.settleMs / 1000, ease: C.easings.settle },
        ),
      ]);
    };

    const playDraw = async () => {
      const oppEl = oppWrapRef.current;
      const myEl = myWrapRef.current;
      if (!oppEl || !myEl) return;

      const travel = C.draw.approachTravelPct * hCard;
      const recoil = C.draw.recoilPct * hCard;

      await Promise.all([
        animate(
          oppEl,
          { y: travel, scale: C.draw.impactScale },
          { duration: C.draw.approachMs / 1000, ease: C.easings.strike },
        ),
        animate(
          myEl,
          { y: -travel, scale: C.draw.impactScale },
          { duration: C.draw.approachMs / 1000, ease: C.easings.strike },
        ),
      ]);
      if (cancelled) return;

      triggerImpact();
      await sleep(C.draw.hitStopMs);
      if (cancelled) return;

      await Promise.all([
        animate(
          oppEl,
          { y: -recoil, scale: 1 },
          { duration: C.draw.recoilMs / 1000, ease: C.easings.recoil },
        ),
        animate(
          myEl,
          { y: recoil, scale: 1 },
          { duration: C.draw.recoilMs / 1000, ease: C.easings.recoil },
        ),
      ]);
      if (cancelled) return;

      await Promise.all([
        animate(
          oppEl,
          { y: 0 },
          { duration: C.draw.settleMs / 1000, ease: C.easings.settle },
        ),
        animate(
          myEl,
          { y: 0 },
          { duration: C.draw.settleMs / 1000, ease: C.easings.settle },
        ),
      ]);
    };

    if (reduced) {
      void playReduced();
    } else if (combatOutcome === "draw") {
      void playDraw();
    } else {
      void playStrike();
    }

    return () => {
      cancelled = true;
    };
  }, [combatTrigger, combatOutcome, prefersReducedMotion]);

  const oppCard = (
    <div
      className="shrink-0"
      style={{ width: cardW, height: cardH, perspective: 1000 }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transition: "transform 460ms cubic-bezier(0.34, 1.1, 0.64, 1)",
          transform: isOppFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 8,
            overflow: "hidden",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <Image src="/card1.png" alt="card back" fill className="object-cover" sizes="20vw" />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 8,
            overflow: "hidden",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {slot.oppImgUrl ? (
            <Image
              src={slot.oppImgUrl}
              alt={slot.oppSymbol ?? ""}
              fill
              className="object-cover"
              sizes="20vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-elevated)]">
              <span className="text-[9px] font-bold text-[var(--text-muted)]">
                {slot.oppSymbol ?? "?"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const myCard = (
    <div
      className="relative rounded-[8px] overflow-hidden border border-[var(--border-subtle)] shrink-0"
      style={{ width: cardW, height: cardH }}
    >
      {slot.myImgUrl ? (
        <Image
          src={slot.myImgUrl}
          alt={slot.mySymbol ?? ""}
          fill
          className="object-cover"
          sizes="20vw"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-elevated)]">
          <span className="text-[9px] font-bold text-[var(--text-muted)]">
            {slot.mySymbol ?? "?"}
          </span>
        </div>
      )}
    </div>
  );

  const revealed = result?.visible ?? false;
  const badgeBg = !revealed || !result
    ? "var(--surface-elevated)"
    : result.won
    ? "rgba(34, 197, 94, 0.10)"
    : result.drew
    ? "var(--surface-elevated)"
    : "rgba(239, 68, 68, 0.08)";

  return (
    <div
      className="relative flex flex-col gap-2 items-center"
      style={{ width: cardW }}
    >
      <div
        ref={oppWrapRef}
        style={{
          width: cardW,
          height: cardH,
          willChange: "transform, filter, box-shadow",
          borderRadius: 8,
          position: "relative",
          zIndex: 1,
        }}
      >
        {oppCard}
      </div>

      <div
        className="flex items-center h-6 justify-center gap-1.5 py-1.5 rounded-lg shrink-0"
        style={{
          width: cardW,
          backgroundColor: badgeBg,
          opacity: revealed ? 1 : 0.3,
          transform: revealed ? "scale(1)" : "scale(0.92)",
          transition:
            "opacity 0.25s ease, background-color 0.35s ease, transform 0.25s cubic-bezier(0.34, 1.6, 0.64, 1)",
        }}
      >
        {result && (
          <>
            <span
              className="font-bold tabular-nums rounded leading-none"
              style={{
                color: "white",
                backgroundColor: weightResultColor(result.won, result.drew, false),
                fontSize: "10px",
                padding: "2px 5px",
                borderRadius: 3,
              }}
            >
              {result.oppWeight}
            </span>
            <span
              className="text-xs font-bold leading-none"
              style={{
                color: result.won
                  ? "#22c55e"
                  : result.drew
                  ? "var(--text-muted)"
                  : "#ef4444",
              }}
            >
              {result.won ? "✓" : result.drew ? "=" : "✗"}
            </span>
            <span
              className="font-bold tabular-nums rounded leading-none"
              style={{
                color: "white",
                backgroundColor: weightResultColor(result.won, result.drew, true),
                fontSize: "10px",
                padding: "2px 5px",
                borderRadius: 3,
              }}
            >
              {result.myWeight}
            </span>
          </>
        )}
      </div>

      <div
        ref={myWrapRef}
        style={{
          width: cardW,
          height: cardH,
          willChange: "transform, filter, box-shadow",
          borderRadius: 8,
          position: "relative",
          zIndex: 1,
        }}
      >
        {myCard}
      </div>

      {/* Impact flash — sits behind the badge between the two cards */}
      <div
        ref={flashRef}
        aria-hidden
        style={{
          position: "absolute",
          left: -cardW * 0.2,
          right: -cardW * 0.2,
          top: cardH,
          height: cardH * 0.5,
          transform: "translateY(-25%)",
          pointerEvents: "none",
          opacity: 0,
          background: FLASH_GRADIENT,
          filter: "blur(2px)",
          zIndex: 0,
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
