import { getAddress, isAddress } from "viem";
import type { RewardWalletItem } from "@/lib/types";

export type ValidateRewardWalletResult =
  | { ok: true; address: string }
  | { ok: false; error: string };

export function validateRewardWalletAddress(
  raw: string,
  options: {
    primaryWallet?: string;
    existingWallets?: RewardWalletItem[];
    excludeId?: number;
  } = {}
): ValidateRewardWalletResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Wallet address is required" };
  }

  if (!isAddress(trimmed)) {
    return { ok: false, error: "Invalid EVM wallet address" };
  }

  let normalized: string;
  try {
    normalized = getAddress(trimmed);
  } catch {
    return { ok: false, error: "Invalid EVM wallet address" };
  }

  const primary = options.primaryWallet?.toLowerCase();
  if (primary && normalized.toLowerCase() === primary) {
    return { ok: false, error: "Cannot use your primary wallet as an additional wallet" };
  }

  const duplicate = options.existingWallets?.some(
    (w) =>
      w.id !== options.excludeId &&
      w.wallet_address.toLowerCase() === normalized.toLowerCase()
  );
  if (duplicate) {
    return { ok: false, error: "This wallet is already saved" };
  }

  return { ok: true, address: normalized };
}
