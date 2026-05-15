"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";
import { PvpPlayerAvatar } from "@/components/PvpPlayerAvatar";
import type { PvpReplayPlayer } from "@/lib/types";
import { COMBAT_ANIMATION } from "../combat/combatAnimationConfig";

export type CoinFlipWinnerSide = "my" | "opp";

interface CoinFlipOverlayProps {
  /** Trigger the animation once. */
  play: boolean;
  winnerSide: CoinFlipWinnerSide;
  myPlayer: PvpReplayPlayer | null | undefined;
  oppPlayer: PvpReplayPlayer | null | undefined;
  /** Called at the landing moment to drive arena screen-shake. */
  onImpact?: () => void;
  /** Fired after the exit transition ends. */
  onComplete?: () => void;
  isMd: boolean;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function CoinFlipOverlay({
  play,
  winnerSide,
  myPlayer,
  oppPlayer,
  onImpact,
  onComplete,
  isMd,
}: CoinFlipOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const spinnerRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const onImpactRef = useRef(onImpact);
  const onCompleteRef = useRef(onComplete);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    onImpactRef.current = onImpact;
  }, [onImpact]);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!play) return;
    const root = rootRef.current;
    const stage = stageRef.current;
    const spinner = spinnerRef.current;
    const flash = flashRef.current;
    if (!root || !stage || !spinner) return;

    let cancelled = false;
    const C = COMBAT_ANIMATION.coinFlip;
    const E = COMBAT_ANIMATION.easings;
    const reduced = COMBAT_ANIMATION.respectReducedMotion && prefersReducedMotion === true;

    const spinTarget = C.fullRotations * 360;
    const landTarget = spinTarget + (winnerSide === "my" ? 180 : 0);

    // Make sure starting state is consistent for every replay.
    spinner.style.transform = "rotateX(0deg)";
    root.style.opacity = "0";
    root.style.transform = "scale(0.4)";

    const playFull = async () => {
      // Entrance
      await animate(
        root,
        { scale: [0.4, 1.08, 1], opacity: [0, 1, 1] },
        { duration: C.entranceMs / 1000, ease: "easeOut" },
      );
      if (cancelled) return;

      // Spin + land are a SINGLE continuous rotation: rotateX 0 → landTarget
      // with one easing so there is no velocity discontinuity at the seam.
      // Impact / flash / shake fire shortly before the visible landing.
      const totalSpinMs = C.spinMs + C.landMs;
      const impactAt = Math.max(0, totalSpinMs - 80);

      const impactTimer = setTimeout(() => {
        if (cancelled) return;
        onImpactRef.current?.();
        if (flash) {
          animate(
            flash,
            { opacity: [0, 1, 0] },
            { duration: 0.32, ease: "easeOut" },
          );
        }
        animate(
          root,
          { scale: [1, 1.14, 1] },
          { duration: (C.landMs + 120) / 1000, ease: E.recoil },
        );
      }, impactAt);

      try {
        // IMPORTANT: do NOT apply a CSS `filter` to the spinner — `filter`
        // collapses `transform-style: preserve-3d`, which would draw both
        // faces flat in DOM order (so my-face would always sit on top of
        // opp-face, making both sides look like the winner).
        await animate(
          spinner,
          { rotateX: [0, landTarget] },
          { duration: totalSpinMs / 1000, ease: E.spin },
        );
      } finally {
        clearTimeout(impactTimer);
      }
      if (cancelled) return;

      await sleep(C.postHoldMs);
      if (cancelled) return;

      await animate(
        root,
        { opacity: 0, scale: 0.92 },
        { duration: C.exitMs / 1000, ease: "easeIn" },
      );
      if (cancelled) return;

      onCompleteRef.current?.();
    };

    const playReduced = async () => {
      // Even when prefers-reduced-motion is on, the coin flip is the central
      // narrative beat of the screen, so we still show a short visible flip —
      // just much shorter and without screen shake / heavy glow.
      await animate(
        root,
        { scale: [0.6, 1], opacity: [0, 1] },
        { duration: 0.18, ease: "easeOut" },
      );
      if (cancelled) return;
      const halfTurn = winnerSide === "my" ? 180 : 360;
      await animate(
        spinner,
        { rotateX: [0, halfTurn] },
        { duration: 0.45, ease: E.recoil },
      );
      if (cancelled) return;
      onImpactRef.current?.();
      await sleep(220);
      if (cancelled) return;
      await animate(
        root,
        { opacity: 0 },
        { duration: 0.18, ease: "easeIn" },
      );
      if (cancelled) return;
      onCompleteRef.current?.();
    };

    if (reduced) {
      void playReduced();
    } else {
      void playFull();
    }

    return () => {
      cancelled = true;
    };
  }, [play, winnerSide, prefersReducedMotion]);

  if (!play) return null;

  const diameter = isMd
    ? COMBAT_ANIMATION.coinFlip.diameterDesktop
    : COMBAT_ANIMATION.coinFlip.diameterMobile;
  const avatarSize = Math.round(diameter * 0.62);
  const ringWidth = Math.max(3, Math.round(diameter * 0.045));

  // Approximated coin thickness for the side "edge" — gives the disc a
  // physical feel during fast rotation (the edge flashes every 90deg).
  const thicknessPx = Math.max(4, Math.round(diameter * 0.045));

  const faceCommon: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  };

  // A subtle radial highlight overlaid on each face, mimicking a polished
  // metal coin. Rendered above the avatar so the metallic gleam reads.
  const faceGleam: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    pointerEvents: "none",
    background:
      "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.10) 22%, rgba(255,255,255,0) 55%), radial-gradient(circle at 70% 80%, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 50%)",
    mixBlendMode: "screen",
  };

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
      style={{ opacity: 0, transform: "scale(0.4)" }}
    >
      {/* Perspective + preserve-3d are kept on the *direct* parent of the
          rotating spinner so the 3D coin flip renders correctly. */}
      <div
        ref={stageRef}
        className="relative"
        style={{
          width: diameter,
          height: diameter,
          perspective: 1000,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          ref={flashRef}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: diameter * 2,
            height: diameter * 2,
            transform: "translate(-50%, -50%)",
            opacity: 0,
            borderRadius: "50%",
            pointerEvents: "none",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(167,139,250,0.55) 30%, rgba(167,139,250,0) 70%)",
            filter: "blur(6px)",
            mixBlendMode: "screen",
            zIndex: 0,
          }}
        />
        <div
          ref={spinnerRef}
          style={{
            width: diameter,
            height: diameter,
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transform: "rotateX(0deg)",
            willChange: "transform",
            zIndex: 1,
          }}
        >
          <div
            style={{
              ...faceCommon,
              // Push faces forward / back by half the desired thickness so
              // the two "edge" strips fit cleanly between them.
              transform: `translateZ(${thicknessPx / 2}px) rotateX(0deg)`,
              background:
                "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.28), rgba(239,68,68,0.20) 55%, rgba(0,0,0,0.55) 100%)",
              border: `${ringWidth}px solid #ef4444`,
              boxShadow:
                "0 10px 28px rgba(239,68,68,0.35), inset 0 0 14px rgba(255,255,255,0.22), inset 0 0 1px rgba(255,255,255,0.4)",
            }}
          >
            <PvpPlayerAvatar player={oppPlayer} size={avatarSize} />
            <div style={faceGleam} aria-hidden />
          </div>
          <div
            style={{
              ...faceCommon,
              transform: `translateZ(-${thicknessPx / 2}px) rotateX(180deg)`,
              background:
                "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.28), rgba(34,197,94,0.20) 55%, rgba(0,0,0,0.55) 100%)",
              border: `${ringWidth}px solid #22c55e`,
              boxShadow:
                "0 10px 28px rgba(34,197,94,0.35), inset 0 0 14px rgba(255,255,255,0.22), inset 0 0 1px rgba(255,255,255,0.4)",
            }}
          >
            <PvpPlayerAvatar player={myPlayer} size={avatarSize} />
            <div style={faceGleam} aria-hidden />
          </div>

          {/* Coin edge — two strips perpendicular to the faces so during
              90deg/270deg of the rotation the user sees a thin metallic rim
              instead of an invisible flat plane. */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: thicknessPx,
              transform: `translateY(-50%) rotateX(90deg)`,
              transformOrigin: "center",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(180,180,180,0.85) 50%, rgba(60,60,60,0.9) 100%)",
              borderRadius: thicknessPx,
              boxShadow: "inset 0 0 6px rgba(0,0,0,0.5)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: thicknessPx,
              transform: `translateY(-50%) rotateX(-90deg)`,
              transformOrigin: "center",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(180,180,180,0.85) 50%, rgba(60,60,60,0.9) 100%)",
              borderRadius: thicknessPx,
              boxShadow: "inset 0 0 6px rgba(0,0,0,0.5)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          />
        </div>
      </div>
    </div>
  );
}
