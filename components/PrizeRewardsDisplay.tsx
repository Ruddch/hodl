"use client";

import { Fragment } from "react";
import {
  aggregatePrizesByRewardName,
  formatPrizeAmount,
  orderedPrizeKeys,
  type PrizeLike,
} from "@/lib/prize-rewards";
import { DustIcon } from "@/components/Icons";

const PACK_IMG = "/packs.png";

export interface PrizeRewardsDisplayProps {
  prizes: PrizeLike[] | null | undefined;
  /** Текст, если призов нет */
  empty?: string;
  /** sm — бейджи колод; md — таблица лидерборда / статистика */
  size?: "sm" | "md";
  className?: string;
}

function PrizeSegment({
  prizeKey,
  total,
  displayName,
  size,
}: {
  prizeKey: string;
  total: number;
  displayName: string;
  size: "sm" | "md";
}) {
  const amount = formatPrizeAmount(total);
  const imgClass = size === "sm" ? "h-4 w-auto max-w-[28px] object-contain" : "h-5 w-auto max-w-[36px] object-contain";

  if (prizeKey === "pack") {
    return (
      <span className="inline-flex items-center gap-1">
        <span>{amount}</span>
        <img src={PACK_IMG} alt="" width={36} height={36} className={imgClass} />
      </span>
    );
  }

  if (prizeKey === "dust") {
    const dustIconClass =
      size === "sm" ? "h-4 w-4 shrink-0" : "h-5 w-5 shrink-0";
    return (
      <span className="inline-flex items-center gap-1" title="Dust">
        <span>{amount}</span>
        <DustIcon className={dustIconClass} />
      </span>
    );
  }

  if (prizeKey === "hp") {
    return (
      <span>
        {amount} {displayName}
      </span>
    );
  }

  return (
    <span>
      {amount} {displayName}
    </span>
  );
}

export function PrizeRewardsDisplay({
  prizes,
  empty = "—",
  size = "md",
  className = "",
}: PrizeRewardsDisplayProps) {
  const map = aggregatePrizesByRewardName(prizes);
  const keys = orderedPrizeKeys([...map.keys()]);

  if (keys.length === 0) {
    return <span className={className}>{empty}</span>;
  }

  return (
    <span className={`inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 ${className}`.trim()}>
      {keys.map((key, i) => {
        const entry = map.get(key);
        if (!entry) return null;
        return (
          <Fragment key={key}>
            <PrizeSegment prizeKey={key} total={entry.total} displayName={entry.displayName} size={size} />
          </Fragment>
        );
      })}
    </span>
  );
}
