import type { UserBalanceItem } from "@/lib/types";

/**
 * Форматирует баланс из массива balances (available + name/currency_type).
 * Возвращает строку вида "100 Points" или "0" при отсутствии данных.
 */
export function formatBalance(balances: UserBalanceItem[] | undefined): string {
  if (!balances || !Array.isArray(balances) || balances.length === 0) return "0";
  const first = balances[0];
  const amount = first.available ?? 0;
  const label = first.name || first.currency_type || "";
  const formattedAmount = new Intl.NumberFormat("en-US").format(amount);
  return label ? `${formattedAmount} ${label}` : formattedAmount;
}
