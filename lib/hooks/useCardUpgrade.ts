import { useState, useCallback, useRef } from "react";
import { useAccount, useConfig, useSwitchChain } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useAuth } from "@/lib/auth-context";
import { usePrepareCardUpgrade, useConfirmCardUpgrade } from "@/lib/api";
import { useUpgradeCards } from "@/lib/contracts/card-upgrader";
import { getCardUpgraderAddress } from "@/lib/blockchain";
import type { ConfirmCardUpgradeResponse } from "@/lib/types";

export type CardUpgradeStep =
  | "idle"
  | "preparing"
  | "signing"
  | "waiting_tx"
  | "confirming"
  | "done"
  | "error";

interface UseCardUpgradeOptions {
  onPrepared?: (data: import("@/lib/types").PrepareCardUpgradeResponse) => void;
  /** Вызывается сразу после отправки транзакции в сеть (до подтверждения) */
  onTxSubmitted?: (txHash: `0x${string}`) => void;
  onSuccess?: (result: ConfirmCardUpgradeResponse) => void;
  onError?: (error: Error, step: CardUpgradeStep) => void;
}

function toHex(value: string): `0x${string}` {
  return value.startsWith("0x")
    ? (value as `0x${string}`)
    : (`0x${value}` as `0x${string}`);
}

function parseUint256(raw: string | number): bigint {
  if (typeof raw === "number") return BigInt(raw);
  return BigInt(raw.trim());
}

function humanizeError(raw: string, step: CardUpgradeStep): string {
  const lower = raw.toLowerCase();

  if (lower.includes("user rejected") || lower.includes("user denied"))
    return "Transaction was rejected in the wallet.";
  if (lower.includes("insufficient funds"))
    return "Not enough funds to cover gas fees.";
  if (lower.includes("invalid signature") || lower.includes("signer mismatch"))
    return "Signature verification failed. Please try again.";
  if (lower.includes("chain mismatch") || lower.includes("wrong network"))
    return "Please switch to the correct network and try again.";
  if (lower.includes("timeout") || lower.includes("timed out"))
    return "Transaction timed out. Check your wallet for pending transactions.";
  if (lower.includes("expired") || lower.includes("deadline"))
    return "This upgrade request has expired. Please try again.";

  const stepLabels: Partial<Record<CardUpgradeStep, string>> = {
    preparing:   "Failed to prepare card upgrade.",
    signing:     "Transaction signing failed.",
    waiting_tx:  "Transaction failed on-chain.",
    confirming:  "Upgrade succeeded on-chain, but confirmation failed. Your card will appear shortly.",
  };

  return stepLabels[step] ?? "Something went wrong. Please try again.";
}

export interface UpgradeCardsInput {
  user_card_ids: number[];
  chain_id: number;
}

export function useCardUpgrade(options?: UseCardUpgradeOptions) {
  const { signedWalletAddress } = useAuth();
  const { address, chainId: currentChainId } = useAccount();
  const config = useConfig();
  const switchChain = useSwitchChain();

  const [step, setStep] = useState<CardUpgradeStep>("idle");
  const [error, setError] = useState<Error | null>(null);
  const stepRef = useRef<CardUpgradeStep>("idle");

  const prepareMutation = usePrepareCardUpgrade();
  const confirmMutation = useConfirmCardUpgrade();
  const { upgradeCards } = useUpgradeCards();

  const updateStep = useCallback((s: CardUpgradeStep) => {
    stepRef.current = s;
    setStep(s);
  }, []);

  const reset = useCallback(() => {
    updateStep("idle");
    setError(null);
  }, [updateStep]);

  const startUpgrade = useCallback(
    async (input: UpgradeCardsInput): Promise<ConfirmCardUpgradeResponse | null> => {
      if (!address) {
        const err = new Error("Please connect your wallet first.");
        setError(err);
        updateStep("error");
        options?.onError?.(err, "preparing");
        return null;
      }

      if (
        signedWalletAddress &&
        address.toLowerCase() !== signedWalletAddress.toLowerCase()
      ) {
        const err = new Error(
          "Active wallet doesn't match the one you signed in with. Please switch wallets."
        );
        setError(err);
        updateStep("error");
        options?.onError?.(err, "signing");
        return null;
      }

      if (!input.user_card_ids.length) {
        const err = new Error("No cards selected for upgrade.");
        setError(err);
        updateStep("error");
        options?.onError?.(err, "preparing");
        return null;
      }

      setError(null);

      try {
        updateStep("preparing");
        const prepared = await prepareMutation.mutateAsync({
          user_card_ids: input.user_card_ids,
          chain_id: input.chain_id,
        });

        const targetChainId = prepared.chain_id ?? input.chain_id;
        if (!targetChainId) {
          const err = new Error(
            "Unable to detect target network for upgrade. Please switch network in your wallet and try again."
          );
          setError(err);
          updateStep("error");
          options?.onError?.(err, "signing");
          return null;
        }

        if (currentChainId !== targetChainId && switchChain.mutateAsync) {
          await switchChain.mutateAsync({ chainId: targetChainId });
        }

        options?.onPrepared?.(prepared);

        const upgraderContractAddress =
          prepared.upgrader_contract
            ? toHex(prepared.upgrader_contract)
            : getCardUpgraderAddress(targetChainId);

        if (!upgraderContractAddress) {
          const err = new Error(
            "Upgrader contract address not found for this network."
          );
          setError(err);
          updateStep("error");
          options?.onError?.(err, "signing");
          return null;
        }

        updateStep("signing");
        const txHash = await upgradeCards({
          upgraderContract: upgraderContractAddress,
          user:             address,
          tokenIds:         prepared.token_ids.map(parseUint256),
          outcomeCardId:    BigInt(prepared.outcome_card_id),
          salt:             toHex(prepared.salt),
          nonce:            parseUint256(prepared.nonce),
          deadline:         parseUint256(prepared.deadline),
          signature:        toHex(prepared.signature),
          chainId:          targetChainId,
        });

        updateStep("waiting_tx");
        options?.onTxSubmitted?.(txHash);
        await waitForTransactionReceipt(config, { hash: txHash });

        updateStep("confirming");
        const confirmed = await confirmMutation.mutateAsync({
          tx_hash: txHash,
          chain_id: targetChainId,
        });

        updateStep("done");
        options?.onSuccess?.(confirmed);
        return confirmed;
      } catch (err) {
        const rawMessage = err instanceof Error ? err.message : "Card upgrade failed";
        const failedStep = stepRef.current === "idle" ? "preparing" : stepRef.current;
        const friendly = new Error(humanizeError(rawMessage, failedStep as CardUpgradeStep));
        setError(friendly);
        updateStep("error");
        options?.onError?.(friendly, failedStep as CardUpgradeStep);
        return null;
      }
    },
    [
      signedWalletAddress,
      address,
      currentChainId,
      config,
      switchChain,
      prepareMutation,
      confirmMutation,
      upgradeCards,
      options,
      updateStep,
    ]
  );

  const isLoading = step !== "idle" && step !== "done" && step !== "error";

  return {
    startUpgrade,
    step,
    error,
    isLoading,
    reset,
  };
}
