import type { PrizeInfo } from "@/lib/types";

export type PrizeLike = Pick<PrizeInfo, "reward_name" | "amount">;

const DISPLAY_ORDER = ["hp", "pack", "dust"] as const;
const ORDER_SET = new Set<string>(DISPLAY_ORDER);

/** Суммирует amount по нормализованному reward_name (нижний регистр). */
export function aggregatePrizesByRewardName(
  prizes: PrizeLike[] | null | undefined
): Map<string, { total: number; displayName: string }> {
  const map = new Map<string, { total: number; displayName: string }>();
  if (!prizes?.length) return map;
  for (const p of prizes) {
    const key = p.reward_name.trim().toLowerCase();
    if (!key) continue;
    const n = Number(p.amount);
    if (Number.isNaN(n)) continue;
    const prev = map.get(key);
    if (prev) {
      prev.total += n;
    } else {
      map.set(key, { total: n, displayName: p.reward_name.trim() });
    }
  }
  return map;
}

export function orderedPrizeKeys(keys: string[]): string[] {
  const ordered: string[] = [];
  for (const k of DISPLAY_ORDER) {
    if (keys.includes(k)) ordered.push(k);
  }
  const rest = keys.filter((k) => !ORDER_SET.has(k)).sort();
  return [...ordered, ...rest];
}

export function formatPrizeAmount(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

/** Объединяет призы нескольких колод (турнирный аккордеон). */
export function flattenDeckPrizes(
  decks: Array<{ prizes?: PrizeLike[] | null }>
): PrizeLike[] {
  const out: PrizeLike[] = [];
  for (const d of decks) {
    for (const p of d.prizes ?? []) {
      out.push(p);
    }
  }
  return out;
}
