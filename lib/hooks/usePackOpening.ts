import { useState, useCallback, useRef } from "react";
import { useAccount, useConfig, useSwitchChain } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useAuth } from "@/lib/auth-context";
import { usePrepareOpenPack, useConfirmOpenPack } from "@/lib/api";
import { useMintWithSignature } from "@/lib/contracts/pack-opener";
import { CHAIN_ID_AVALANCHE_FUJI } from "@/lib/blockchain";
import type { ConfirmOpenPackResponse } from "@/lib/types";

export type PackOpeningStep =
  | "idle"
  | "preparing"
  | "signing"
  | "waiting_tx"
  | "confirming"
  | "done"
  | "error";

interface UsePackOpeningOptions {
  onSuccess?: (result: ConfirmOpenPackResponse) => void;
  onError?: (error: Error, step: PackOpeningStep) => void;
}

function generateClientSeed(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function toHex(value: string): `0x${string}` {
  return value.startsWith("0x")
    ? (value as `0x${string}`)
    : (`0x${value}` as `0x${string}`);
}

function humanizeError(raw: string, step: PackOpeningStep): string {
  const lower = raw.toLowerCase();

  if (lower.includes("user rejected") || lower.includes("user denied"))
    return "Transaction was rejected in the wallet.";
  if (lower.includes("insufficient funds"))
    return "Not enough funds to cover gas fees.";
  if (lower.includes("already used") || lower.includes("already minted"))
    return "This pack has already been opened.";
  if (lower.includes("invalid signature") || lower.includes("signer mismatch"))
    return "Signature verification failed. Please try again.";
  if (lower.includes("chain mismatch") || lower.includes("wrong network"))
    return "Please switch to the correct network and try again.";
  if (lower.includes("timeout") || lower.includes("timed out"))
    return "Transaction timed out. Check your wallet for pending transactions.";

  const stepLabels: Partial<Record<PackOpeningStep, string>> = {
    preparing: "Failed to prepare pack opening.",
    signing: "Transaction signing failed.",
    waiting_tx: "Transaction failed on-chain.",
    confirming: "Pack opened on-chain, but confirmation failed. Your cards will appear shortly.",
  };

  return stepLabels[step] ?? "Something went wrong. Please try again.";
}

export function usePackOpening(options?: UsePackOpeningOptions) {
  const { signedWalletAddress } = useAuth();
  const { address, chainId: currentChainId } = useAccount();
  const config = useConfig();
  const switchChain = useSwitchChain();

  const [step, setStep] = useState<PackOpeningStep>("idle");
  const [error, setError] = useState<Error | null>(null);
  const stepRef = useRef<PackOpeningStep>("idle");

  const prepareOpenPackMutation = usePrepareOpenPack();
  const confirmOpenPackMutation = useConfirmOpenPack();
  const { mintWithSignature } = useMintWithSignature();

  const updateStep = useCallback((s: PackOpeningStep) => {
    stepRef.current = s;
    setStep(s);
  }, []);

  const reset = useCallback(() => {
    updateStep("idle");
    setError(null);
  }, [updateStep]);

  const openPack = useCallback(
    async (userPackId: number): Promise<ConfirmOpenPackResponse | undefined> => {
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

      setError(null);

      try {
        // 1. prepare-open: get server_seed, card_ids, signature
        updateStep("preparing");
        const clientSeed = generateClientSeed();
        const prepared = await prepareOpenPackMutation.mutateAsync({
          user_pack_id: userPackId,
          client_seed: clientSeed,
        });

        // 2. Switch to Fuji if needed
        const targetChainId = CHAIN_ID_AVALANCHE_FUJI;
        if (currentChainId !== targetChainId && switchChain.mutateAsync) {
          await switchChain.mutateAsync({ chainId: targetChainId });
        }

        // 3. mintWithSignature on-chain
        updateStep("signing");
        const txHash = await mintWithSignature({
          user: address,
          openingId: BigInt(prepared.pack_opening_id),
          cardIds: prepared.card_ids.map((id) => BigInt(id)),
          serverSeed: toHex(prepared.server_seed),
          signature: toHex(prepared.signature),
          chainId: targetChainId,
        });

        // 4. Wait for receipt
        updateStep("waiting_tx");
        await waitForTransactionReceipt(config, { hash: txHash });

        // 5. Confirm on backend
        updateStep("confirming");
        const result = await confirmOpenPackMutation.mutateAsync({
          packOpeningId: prepared.pack_opening_id,
          data: { tx_hash: txHash },
        });

        updateStep("done");
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const rawMessage = err instanceof Error ? err.message : "Pack opening failed";
        const failedStep = stepRef.current === "idle" ? "preparing" : stepRef.current;
        const friendly = new Error(humanizeError(rawMessage, failedStep as PackOpeningStep));
        setError(friendly);
        updateStep("error");
        options?.onError?.(friendly, failedStep as PackOpeningStep);
        return;
      }
    },
    [
      signedWalletAddress,
      address,
      currentChainId,
      config,
      switchChain,
      prepareOpenPackMutation,
      confirmOpenPackMutation,
      mintWithSignature,
      options,
      updateStep,
    ]
  );

  const isLoading = step !== "idle" && step !== "done" && step !== "error";

  return {
    openPack,
    step,
    error,
    isLoading,
    reset,
  };
}
