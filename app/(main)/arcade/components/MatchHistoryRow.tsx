"use client";

import type { ReactNode } from "react";
import type { PvpUserMatchItem } from "@/lib/types";

interface MatchHistoryRowProps {
  match: PvpUserMatchItem;
  onClick: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortenId(id: number): string {
  return `#${id}`;
}

function getOpponentLabel(match: PvpUserMatchItem): string {
  if (!match.opponent) return "Waiting for opponent";
  return match.opponent.nickname?.trim() || `Player ${shortenId(match.opponent.id)}`;
}

function isTerminalStatus(status: string): boolean {
  return status === "completed" || status === "cancelled";
}

function hasBothScores(match: PvpUserMatchItem): boolean {
  return match.scores.mine !== null && match.scores.opponent !== null;
}

function formatScore(value: number | null): string {
  if (value === null || value === undefined) return "–";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

interface Headline {
  label: string;
  className: string;
}

function getHeadline(match: PvpUserMatchItem): Headline {
  if (isTerminalStatus(match.status)) {
    if (match.outcome === "win") {
      return { label: "Won", className: "text-emerald-400" };
    }
    if (match.outcome === "loss") {
      return { label: "Lost", className: "text-red-400" };
    }
    if (match.outcome === "draw") {
      return { label: "Draw", className: "text-amber-400" };
    }
    if (match.outcome === "cancelled") {
      return { label: "Cancelled", className: "text-slate-400" };
    }
    return {
      label: "Completed",
      className: "text-[var(--badge-opened-text)]",
    };
  }
  if (match.opponent) {
    return {
      label: "In progress",
      className: "text-[var(--badge-purple-text)]",
    };
  }
  return { label: "Waiting", className: "text-[var(--text-muted)]" };
}

/** Subtle wash over elevated surface (does not replace base bg). */
function cardTintOverlayClass(match: PvpUserMatchItem): string {
  if (!isTerminalStatus(match.status) || !match.outcome) return "";
  switch (match.outcome) {
    case "win":
      return "bg-[rgba(34,197,94,0.09)]";
    case "loss":
      return "bg-[rgba(239,68,68,0.09)]";
    case "draw":
      return "bg-[rgba(234,179,8,0.1)]";
    case "cancelled":
      return "bg-[rgba(148,163,184,0.1)]";
    default:
      return "";
  }
}

function scoreTextClass(match: PvpUserMatchItem): string {
  if (!isTerminalStatus(match.status) || !match.outcome || !hasBothScores(match)) {
    return "text-[var(--text-primary)]";
  }
  switch (match.outcome) {
    case "win":
      return "text-emerald-400";
    case "loss":
      return "text-red-400";
    case "draw":
      return "text-amber-400";
    case "cancelled":
      return "text-slate-400";
    default:
      return "text-[var(--text-primary)]";
  }
}

function SecondaryPill({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
      {children}
    </span>
  );
}

function HeroScoreBlock({ match }: { match: PvpUserMatchItem }) {
  const terminal = isTerminalStatus(match.status);
  const both = hasBothScores(match);

  if (both) {
    return (
      <p
        className={`text-center text-xl font-semibold tabular-nums tracking-tight sm:text-2xl ${scoreTextClass(match)}`}
        aria-label="Score"
      >
        {formatScore(match.scores.mine)} – {formatScore(match.scores.opponent)}
      </p>
    );
  }

  if (!terminal && match.opponent) {
    return (
      <p className="text-center text-xl font-semibold tabular-nums text-[var(--text-muted)] sm:text-2xl" aria-label="Score">
        —
      </p>
    );
  }

  return (
    <p className="text-center text-xl font-semibold tabular-nums text-[var(--text-muted)] sm:text-2xl" aria-hidden>
      –
    </p>
  );
}

function bottomSubtitle(match: PvpUserMatchItem): string {
  if (!match.opponent) return getOpponentLabel(match);
  return `vs ${getOpponentLabel(match)}`;
}

export function MatchHistoryRow({ match, onClick }: MatchHistoryRowProps) {
  const headline = getHeadline(match);
  const terminal = isTerminalStatus(match.status);
  const showSecondaryPill = !terminal;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 text-left transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] sm:px-5"
    >
      {cardTintOverlayClass(match) ? (
        <span
          className={`pointer-events-none absolute inset-0 rounded-[inherit] ${cardTintOverlayClass(match)}`}
          aria-hidden
        />
      ) : null}
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 py-0.5 sm:gap-x-3">
        {/* Col 1: outcome + vs — левая половина сетки (1fr), контент слева */}
        <div className="min-w-0 justify-self-start">
          <div className="flex flex-col gap-0.5">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
              <span
                className={`text-sm font-bold uppercase tracking-[0.12em] ${headline.className}`}
              >
                {headline.label}
              </span>
              {showSecondaryPill && false ? (
                <SecondaryPill>{match.opponent ? "Live" : "Queue"}</SecondaryPill>
              ) : null}
            </div>
            <p className="truncate text-xs leading-snug text-[var(--text-secondary)]">{bottomSubtitle(match)}</p>
          </div>
        </div>

        {/* Col 2: счёт строго по центру карточки (между двумя равными 1fr) */}
        <div className="flex shrink-0 justify-center justify-self-center px-0.5 sm:px-1">
          <HeroScoreBlock match={match} />
        </div>

        {/* Col 3: meta — правая половина (1fr), блок прижат вправо */}
        <div className="flex min-w-0 justify-end justify-self-stretch">
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <time
              className="max-w-[7.5rem] text-right text-xs leading-snug text-[var(--text-muted)] tabular-nums"
              dateTime={match.created_at}
            >
              {formatDate(match.created_at)}
            </time>
            <svg
              className="h-4 w-4 text-[var(--text-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </button>
  );
}
