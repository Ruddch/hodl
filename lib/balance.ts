const intFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Целая часть баланса, разделители тысяч en-US. */
export function formatBalanceInteger(n: number): string {
  return intFmt.format(Math.trunc(n));
}
