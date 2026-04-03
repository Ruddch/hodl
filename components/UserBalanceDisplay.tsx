"use client";

import type { UserBalanceItem } from "@/lib/types";
import { formatBalanceInteger } from "@/lib/balance";
import { DustIcon } from "@/components/Icons";

interface UserBalanceDisplayProps {
  balances: UserBalanceItem[] | undefined;
  className?: string;
}

function BalanceSegment({ item }: { item: UserBalanceItem }) {
  const formatted = formatBalanceInteger(item.available ?? 0);
  const raw = (item.name || "").trim();
  const key = raw.toLowerCase();

  if (key === "HP") {
    return (
      <span className="inline-flex items-baseline gap-1 tabular-nums">
        <span>{formatted}</span>
        <span>HP</span>
      </span>
    );
  }

  if (key === "dust") {
    return (
      <span className="inline-flex items-center gap-1 tabular-nums" title="Dust">
        <span>{formatted}</span>
        <DustIcon className="h-[1em] w-[1em] shrink-0" />
      </span>
    );
  }

  return <></> //<span className="tabular-nums">{raw ? `${formatted} ${raw}` : formatted}</span>;
}

export function UserBalanceDisplay({ balances, className }: UserBalanceDisplayProps) {
  if (!balances?.length) {
    return <span className={className}>0</span>;
  }

  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 ${className ?? ""}`.trim()}>
      {balances.map((item, i) => (
        <BalanceSegment key={`${item.name}-${i}`} item={item} />
      ))}
    </span>
  );
}
