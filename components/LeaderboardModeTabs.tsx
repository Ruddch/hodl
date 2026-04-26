"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const shellClass =
  "flex gap-[1px] rounded-[10px] p-[2px] w-fit max-w-full flex-wrap bg-[var(--input-bg)] border border-[var(--border)]";

const tabClass = (active: boolean) =>
  `px-4 py-2.5 rounded-[8px] text-sm font-medium transition-colors whitespace-nowrap ${
    active
      ? "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] shadow-sm"
      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
  }`;

export function LeaderboardModeTabs({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const normalized = pathname?.replace(/\/$/, "") ?? "";
  const isHp = normalized === "/leaderboard/hp";
  const isTournament = !isHp;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className={shellClass} role="tablist" aria-label="Leaderboard type">
        <Link
          href="/leaderboard"
          role="tab"
          aria-selected={isTournament}
          className={tabClass(isTournament)}
          data-ph-capture-attribute-button="leaderboard-tab-tournament"
        >
          By tournament
        </Link>
        <Link
          href="/leaderboard/hp"
          role="tab"
          aria-selected={isHp}
          className={tabClass(isHp)}
          data-ph-capture-attribute-button="leaderboard-tab-hp"
        >
          HP all-time
        </Link>
      </div>
      {isHp && (
        <p className="text-xs text-[var(--text-muted)] max-w-xl">
          Rankings by total HP balance earned across tournaments.
        </p>
      )}
    </div>
  );
}
