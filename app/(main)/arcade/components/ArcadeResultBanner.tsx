"use client";

import { useEffect, useRef, useState } from "react";

export type ArcadeResultStatus =
  | { kind: "loading" } // replay data not loaded yet
  | { kind: "waiting" } // opponent hasn't finished their draft
  | { kind: "pending" } // reveal still running — show only score
  | { kind: "victory" }
  | { kind: "defeat" }
  | { kind: "draw" }
  | { kind: "cancelled" }
  | { kind: "coin_flip" }; // coin spinning — show neutral "DECIDING"

interface ArcadeResultBannerProps {
  /** Score from the local player's perspective. */
  myScore: number;
  oppScore: number;
  status: ArcadeResultStatus;
  /** Caption shown below the score (e.g. coin-flip rationale). Optional. */
  caption?: string | null;
}

const GREEN = "#22c55e";
const RED = "#ef4444";
const AMBER = "#f59e0b";

/** League-Gothic style — consistent with the "Token Duel" heading. */
const CONDENSED_FONT = "var(--font-league-gothic), sans-serif";

interface StatusVisual {
  label: string;
  color: string;
  /** Color of the side gradient lines. */
  lineColor: string;
  /** Whether the status row should be visible at all. */
  show: boolean;
  /** Show small spinner next to the label (waiting / loading states). */
  withSpinner?: boolean;
}

function getVisual(status: ArcadeResultStatus): StatusVisual {
  switch (status.kind) {
    case "victory":
      return {
        label: "Victory",
        color: GREEN,
        lineColor: "rgba(34, 197, 94, 0.55)",
        show: true,
      };
    case "defeat":
      return {
        label: "Defeat",
        color: RED,
        lineColor: "rgba(239, 68, 68, 0.55)",
        show: true,
      };
    case "draw":
      return {
        label: "Draw",
        color: "var(--text-primary)",
        lineColor: "rgba(167, 139, 250, 0.55)",
        show: true,
      };
    case "cancelled":
      return {
        label: "Cancelled",
        color: AMBER,
        lineColor: "rgba(245, 158, 11, 0.55)",
        show: true,
      };
    case "coin_flip":
      return {
        label: "Coin Flip",
        color: "var(--text-muted)",
        lineColor: "rgba(167, 139, 250, 0.55)",
        show: true,
      };
    case "waiting":
      return {
        label: "Waiting for opponent",
        color: "var(--text-muted)",
        lineColor: "rgba(167, 139, 250, 0.45)",
        show: true,
        withSpinner: true,
      };
    case "loading":
      return {
        label: "Loading match",
        color: "var(--text-muted)",
        lineColor: "rgba(167, 139, 250, 0.35)",
        show: true,
        withSpinner: true,
      };
    default:
      return {
        label: "",
        color: "var(--text-muted)",
        lineColor: "rgba(167, 139, 250, 0.45)",
        show: false,
      };
  }
}

/**
 * Animated digit that scale-pulses each time its value increments.
 * Colour changes are smooth (CSS transition); value changes are punchy.
 */
function ScoreDigit({
  value,
  color,
  highlight,
}: {
  value: number;
  color: string;
  /** Subtle text-glow when this digit is the highlighted (outcome) side. */
  highlight: boolean;
}) {
  const [animKey, setAnimKey] = useState(0);
  const firstRef = useRef(true);

  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    const id = requestAnimationFrame(() => {
      setAnimKey((k) => k + 1);
    });
    return () => cancelAnimationFrame(id);
  }, [value]);

  return (
    <span
      className="inline-block leading-none tabular-nums text-5xl md:text-6xl"
      style={{
        fontFamily: CONDENSED_FONT,
        color,
        transition: "color 0.5s ease, text-shadow 0.5s ease",
        textShadow: highlight ? `0 0 24px ${color}55` : "none",
        // re-key the inner span so the keyframe replays cleanly
      }}
    >
      <span
        key={animKey}
        style={{
          display: "inline-block",
          animation: animKey > 0 ? "arcadeScorePulse 0.5s ease both" : undefined,
          willChange: "transform",
        }}
      >
        {value}
      </span>
    </span>
  );
}

export function ArcadeResultBanner({
  myScore,
  oppScore,
  status,
  caption,
}: ArcadeResultBannerProps) {
  const visual = getVisual(status);

  const isVictory = status.kind === "victory";
  const isDefeat = status.kind === "defeat";
  const isCancelled = status.kind === "cancelled";

  // Score colours: only the local player's number takes outcome colour
  // (green win / red loss). Opponent stays neutral. Pending / coin-flip /
  // draw: both neutral.
  const myColor = isVictory
    ? GREEN
    : isDefeat
      ? RED
      : "var(--text-primary)";
  const oppColor = "var(--text-primary)";

  const myHighlight = isVictory || isDefeat;
  const oppHighlight = false;

  // Cancelled matches don't have meaningful points → keep the slot but
  // hide the score with a fixed-height placeholder so layout stays stable.
  // Loading / waiting render a real "0 – 0" so the eventual tick-up of the
  // first slot reads as a natural change rather than a new element popping in.
  const showScore = !isCancelled;

  return (
    <div className="flex flex-col items-center gap-1 md:gap-1.5 shrink-0 select-none w-full">
      {/* ── Status row ─────────────────────────────────────────────────
          Even when label is hidden we render the row to keep vertical
          rhythm stable across reveal phases (avoids arena jitter). */}
      <div className="flex items-center justify-center gap-2 md:gap-4 w-full">
        <div
          className="h-px flex-1 max-w-[140px] md:max-w-[260px]"
          style={{
            background: `linear-gradient(to right, transparent 0%, ${visual.lineColor} 100%)`,
            opacity: visual.show ? 1 : 0,
            transform: visual.show ? "scaleX(1)" : "scaleX(0)",
            transformOrigin: "right center",
            transition:
              "opacity 0.45s ease 80ms, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) 80ms, background 0.4s ease",
          }}
        />

        <div
          className="flex items-center gap-2 shrink-0"
          style={{
            opacity: visual.show ? 1 : 0,
            transform: visual.show ? "translateY(0)" : "translateY(4px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
          }}
        >
          {visual.withSpinner && (
            <div
              className="rounded-full border-[2px] border-t-transparent animate-spin shrink-0"
              style={{
                width: 12,
                height: 12,
                borderColor: "rgba(167, 139, 250, 0.85)",
                borderTopColor: "transparent",
              }}
              aria-hidden
            />
          )}
          <p
            className="text-[11px] md:text-sm uppercase leading-none whitespace-nowrap"
            style={{
              fontFamily: CONDENSED_FONT,
              letterSpacing: "0.4em",
              // Pad-right so optical centre matches once tracking adds whitespace.
              paddingLeft: "0.4em",
              color: visual.color,
              transition: "color 0.4s ease",
              minHeight: "1em",
            }}
          >
            {visual.label || "\u00A0"}
          </p>
        </div>

        <div
          className="h-px flex-1 max-w-[140px] md:max-w-[260px]"
          style={{
            background: `linear-gradient(to left, transparent 0%, ${visual.lineColor} 100%)`,
            opacity: visual.show ? 1 : 0,
            transform: visual.show ? "scaleX(1)" : "scaleX(0)",
            transformOrigin: "left center",
            transition:
              "opacity 0.45s ease 80ms, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) 80ms, background 0.4s ease",
          }}
        />
      </div>

      {/* ── Score row ──────────────────────────────────────────────── */}
      {showScore ? (
        <div className="flex items-baseline justify-center gap-3 md:gap-4">
          <ScoreDigit value={myScore} color={myColor} highlight={myHighlight} />
          <span
            className="inline-block leading-none text-3xl md:text-4xl"
            style={{
              fontFamily: CONDENSED_FONT,
              color: "var(--text-muted)",
              transform: "translateY(-0.15em)",
            }}
          >
            –
          </span>
          <ScoreDigit
            value={oppScore}
            color={oppColor}
            highlight={oppHighlight}
          />
        </div>
      ) : (
        // Keep height roughly stable so cancelled matches don't reflow the arena.
        <div aria-hidden className="h-12 md:h-[72px]" />
      )}

      {/* ── Caption (resolution summary for coin flip / cancellation) ── */}
      {caption ? (
        <p
          className="text-[10px] md:text-xs text-[var(--text-muted)] text-center mt-0.5 px-3 max-w-[36ch] md:max-w-none"
          style={{ animation: "fadeInUp 0.4s ease both" }}
        >
          {caption}
        </p>
      ) : null}
    </div>
  );
}
