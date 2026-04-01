import { useState, useCallback, useRef } from "react";
import { useAccount, useConfig, useSwitchChain } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useAuth } from "@/lib/auth-context";
import { usePrepareCardBurn, useConfirmCardBurn } from "@/lib/api";
import { useBurnForDust } from "@/lib/contracts/card-burner";

export type CardBurnStep =
  | "idle"
  | "preparing"
  | "signing"
  | "waiting_tx"
  | "confirming"
  | "done"
  | "error";

interface UseCardBurnOptions {
  onSuccess?: () => void;
  onError?: (error: Error, step: CardBurnStep) => void;
}

function toHex(value: string): `0x${string}` {
  return value.startsWith("0x")
    ? (value as `0x${string}`)
    : (`0x${value}` as `0x${string}`);
}

function parseUint256(raw: string | number): bigint {
  if (typeof raw === "number") return BigInt(raw);
  const s = raw.trim();
  return BigInt(s);
}

function humanizeError(raw: string, step: CardBurnStep): string {
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
    return "This burn request has expired. Please try again.";

  const stepLabels: Partial<Record<CardBurnStep, string>> = {
    preparing: "Failed to prepare card burn.",
    signing: "Transaction signing failed.",
    waiting_tx: "Transaction failed on-chain.",
    confirming: "Burn succeeded on-chain, but confirmation failed. Your dust will appear shortly.",
  };

  return stepLabels[step] ?? "Something went wrong. Please try again.";
}

export interface BurnCardsInput {
  user_card_ids: number[];
  chain_id: number;
}

export function useCardBurn(options?: UseCardBurnOptions) {
  const { signedWalletAddress } = useAuth();
  const { address, chainId: currentChainId } = useAccount();
  const config = useConfig();
  const switchChain = useSwitchChain();

  const [step, setStep] = useState<CardBurnStep>("idle");
  const [error, setError] = useState<Error | null>(null);
  const stepRef = useRef<CardBurnStep>("idle");

  const prepareMutation = usePrepareCardBurn();
  const confirmMutation = useConfirmCardBurn();
  const { burnForDust } = useBurnForDust();

  const updateStep = useCallback((s: CardBurnStep) => {
    stepRef.current = s;
    setStep(s);
  }, []);

  const reset = useCallback(() => {
    updateStep("idle");
    setError(null);
  }, [updateStep]);

  const burnCards = useCallback(
    async (input: BurnCardsInput): Promise<void> => {
      if (!address) {
        const err = new Error("Please connect your wallet first.");
        setError(err);
        updateStep("error");
        options?.onError?.(err, "preparing");
        return;
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
        return;
      }

      if (!input.user_card_ids.length) {
        const err = new Error("No cards selected to burn.");
        setError(err);
        updateStep("error");
        options?.onError?.(err, "preparing");
        return;
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
            "Unable to detect target network for burn. Please switch network in your wallet and try again."
          );
          setError(err);
          updateStep("error");
          options?.onError?.(err, "signing");
          return;
        }

        if (currentChainId !== targetChainId && switchChain.mutateAsync) {
          await switchChain.mutateAsync({ chainId: targetChainId });
        }

        console.log("prepared signature", prepared.signature);

        const {burner_contract: burnerContract, token_ids: tokenIds, nonce, deadline, signature} = prepared;

        updateStep("signing");
        const txHash = await burnForDust({
          burnerContract: burnerContract as `0x${string}`,
          user: address,
          tokenIds: tokenIds.map((id) => BigInt(id)),
          nonce: BigInt(nonce),
          deadline: BigInt(deadline),
          signature: signature as `0x${string}`,
          chainId: targetChainId,
        });

        updateStep("waiting_tx");
        await waitForTransactionReceipt(config, { hash: txHash });

        updateStep("confirming");
        await confirmMutation.mutateAsync({
          tx_hash: txHash,
          chain_id: targetChainId,
        });

        updateStep("done");
        options?.onSuccess?.();
      } catch (err) {
        const rawMessage = err instanceof Error ? err.message : "Card burn failed";
        const failedStep = stepRef.current === "idle" ? "preparing" : stepRef.current;
        const friendly = new Error(humanizeError(rawMessage, failedStep as CardBurnStep));
        setError(friendly);
        updateStep("error");
        options?.onError?.(friendly, failedStep as CardBurnStep);
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
      burnForDust,
      options,
      updateStep,
    ]
  );

  const isLoading = step !== "idle" && step !== "done" && step !== "error";

  return {
    burnCards,
    step,
    error,
    isLoading,
    reset,
  };
}
