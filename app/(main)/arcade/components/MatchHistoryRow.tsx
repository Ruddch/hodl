"use client";

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

function getStatusBadge(match: PvpUserMatchItem) {
  const isCompleted = match.status === "completed";
  const hasOpponent = match.player2_id !== null;

  if (isCompleted) {
    return (
      <span className="px-2.5 py-1 text-[10px] font-semibold rounded bg-[var(--surface-muted)] text-[var(--text-secondary)] uppercase tracking-wider">
        Completed
      </span>
    );
  }
  if (hasOpponent) {
    return (
      <span className="px-2.5 py-1 text-[10px] font-semibold rounded bg-[var(--badge-opened)] text-[var(--badge-opened-text)] uppercase tracking-wider">
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

export function MatchHistoryRow({ match, onClick }: MatchHistoryRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-sm shrink-0">
          ⚔️
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">Match #{match.match_id}</p>
          <p className="text-xs text-[var(--text-muted)]">{formatDate(match.created_at)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {getStatusBadge(match)}
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
