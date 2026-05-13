"use client";

import type { PvpUserMatchItem, PvpOutcome } from "@/lib/types";

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

interface BadgeStyle {
  label: string;
  bg: string;
  text: string;
}

function getOutcomeBadge(outcome: PvpOutcome): BadgeStyle {
  switch (outcome) {
    case "win":
      return {
        label: "Win",
        bg: "rgba(34, 197, 94, 0.15)",
        text: "#22c55e",
      };
    case "loss":
      return {
        label: "Loss",
        bg: "rgba(239, 68, 68, 0.12)",
        text: "#ef4444",
      };
    case "draw":
      return {
        label: "Draw",
        bg: "var(--badge-opened)",
        text: "var(--badge-opened-text)",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        bg: "var(--surface-muted)",
        text: "var(--text-muted)",
      };
  }
}

function StatusBadge({ match }: { match: PvpUserMatchItem }) {
  if (match.status === "completed" || match.status === "cancelled") {
    if (match.outcome) {
      const style = getOutcomeBadge(match.outcome);
      return (
        <span
          className="px-2.5 py-1 text-[10px] font-semibold rounded uppercase tracking-wider"
          style={{ backgroundColor: style.bg, color: style.text }}
        >
          {style.label}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-[10px] font-semibold rounded bg-[var(--badge-opened)] text-[var(--badge-opened-text)] uppercase tracking-wider">
        Completed
      </span>
    );
  }

  if (match.opponent) {
    return (
      <span className="px-2.5 py-1 text-[10px] font-semibold rounded bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)] uppercase tracking-wider">
        In Progress
      </span>
    );
  }

  return (
    <span className="px-2.5 py-1 text-[10px] font-semibold rounded bg-[var(--surface-muted)] text-[var(--text-muted)] uppercase tracking-wider">
      Waiting
    </span>
  );
}

function formatScore(value: number | null): string {
  if (value === null || value === undefined) return "–";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function MatchHistoryRow({ match, onClick }: MatchHistoryRowProps) {
  const showScore =
    (match.status === "completed" || match.status === "cancelled") &&
    match.scores.mine !== null &&
    match.scores.opponent !== null;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] transition-colors text-left"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-sm shrink-0">
          ⚔️
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
            Match #{match.match_id}
            <span className="text-[var(--text-muted)] font-normal"> · vs {getOpponentLabel(match)}</span>
          </p>
          <p className="text-xs text-[var(--text-muted)] truncate">
            {formatDate(match.created_at)}
            {showScore && (
              <span className="ml-2 tabular-nums">
                {formatScore(match.scores.mine)} – {formatScore(match.scores.opponent)}
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge match={match} />
        <svg
          className="w-4 h-4 text-[var(--text-muted)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
