const SUBSCRIPT_DIGITS = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];

function toSubscript(n: number): string {
  return String(n)
    .split("")
    .map((d) => SUBSCRIPT_DIGITS[Number(d)])
    .join("");
}

/**
 * Formats a token price for display.
 *
 * Large / normal values use locale formatting.
 * Very small values (< 0.0001) use compact subscript notation:
 *   0.000003461  →  0.0₅3461
 *   0.00000000987  →  0.0₈987
 *
 * The subscript digit equals the total number of leading zeros after
 * the decimal point before the first significant digit.
 */
export function formatPrice(price: number): string {
  if (!isFinite(price) || price === 0) return "0";

  if (price >= 1)
    return price.toLocaleString("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });

  if (price >= 0.01)
    return price.toLocaleString("en-US", {
      maximumFractionDigits: 4,
      minimumFractionDigits: 2,
    });

  if (price >= 0.0001)
    return price.toLocaleString("en-US", {
      maximumFractionDigits: 6,
      minimumFractionDigits: 4,
    });

  // Compact subscript notation for tiny prices
  const afterDot = price.toFixed(20).split(".")[1] ?? "";
  let zeros = 0;
  for (const ch of afterDot) {
    if (ch === "0") zeros++;
    else break;
  }

  // Take up to 4 significant digits, strip trailing zeros
  const sigDigits = afterDot.slice(zeros, zeros + 4).replace(/0+$/, "") || "0";

  return `0.0${toSubscript(zeros)}${sigDigits}`;
}
