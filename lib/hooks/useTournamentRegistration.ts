import { useState } from "react";
import { useAccount, useConfig, useSwitchChain } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useAuth } from "@/lib/auth-context";
import { useValidateDeck, useRegisterForTournament, useUnregisterFromTournament } from "@/lib/api";
import { useRegisterDeckOnChain, useUnregisterDeckOnChain } from "@/lib/contracts/tournament-registry";
import {
  CHAIN_ID_ABSTRACT,
  isChainSupported,
  getChainIdFromPreferredNetwork,
} from "@/lib/blockchain";
import type { Tournament } from "@/lib/types";

export type RegistrationErrorContext = "register" | "unregister";

interface UseTournamentRegistrationOptions {
  onSuccess?: () => void;
  onError?: (error: Error, context: RegistrationErrorContext) => void;
}

export function useTournamentRegistration(options?: UseTournamentRegistrationOptions) {
  const { signedWalletAddress } = useAuth();
  const { address, chainId: currentChainId } = useAccount();
  const config = useConfig();
  const switchChain = useSwitchChain();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUnregistering, setIsUnregistering] = useState(false);

  const validateDeckMutation = useValidateDeck();
  const registerMutation = useRegisterForTournament();
  const unregisterMutation = useUnregisterFromTournament();
  const { registerDeck: registerDeckOnChain } = useRegisterDeckOnChain();
  const { unregisterDeck: unregisterDeckOnChain } = useUnregisterDeckOnChain();

  const WALLET_MISMATCH_MESSAGE =
    "The active wallet does not match the wallet you signed with. Please switch to the correct address in your wallet (Rabi Wallet) that you used for authorization.";

  const validateWallet = (): boolean => {
    if (signedWalletAddress && address && address.toLowerCase() !== signedWalletAddress.toLowerCase()) {
      return false;
    }
    return true;
  };

  // Регистрация на турнир
  const register = async (tournament: Tournament, selectedCardIds: number[]) => {
    if (!validateWallet()) {
      options?.onError?.(new Error(WALLET_MISMATCH_MESSAGE), "register");
      return;
    }

    setIsRegistering(true);
    try {
      // 1. Валидируем колоду на бэкенде
      const validation = await validateDeckMutation.mutateAsync({
        tournamentId: tournament.id,
        data: { deck_composition: selectedCardIds },
      });

      if (!validation.valid) {
        const error = new Error(validation.message || "Deck validation failed");
        options?.onError?.(error, "register");
        return;
      }

      // 2. Выбираем цепочку по preferred_network
      const targetChainId = validation.preferred_network
        ? getChainIdFromPreferredNetwork(validation.preferred_network)
        : CHAIN_ID_ABSTRACT;

      // 2.1. Переключаем цепочку, если нужно
      if (currentChainId !== targetChainId && switchChain.mutateAsync) {
        await switchChain.mutateAsync({ chainId: targetChainId });
      }

      // 3. Регистрируем колоду в смарт-контракте
      const deckHash = validation.deck_hash as `0x${string}`;

      console.log("Registering deck on blockchain...", {
        tournamentId: tournament.id,
        deckHash,
        chainId: targetChainId,
      });

      const txHash = await registerDeckOnChain(tournament.id, deckHash, targetChainId);
      
      console.log("Transaction submitted:", txHash);

      // 2.1. Ждем подтверждения транзакции в блокчейне
      console.log("Waiting for transaction confirmation...");
      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
      });
      
      console.log("Transaction confirmed:", {
        blockNumber: receipt.blockNumber,
        status: receipt.status,
      });

      // 4. Отправляем tx_hash на бэкенд для подтверждения регистрации
      await registerMutation.mutateAsync({
        tournamentId: tournament.id,
        data: {
          deck_composition: selectedCardIds,
          tx_hash: txHash,
        },
      });

      options?.onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage), "register");
    } finally {
      setIsRegistering(false);
    }
  };

  // Отмена регистрации на турнир
  const unregister = async (tournament: Tournament) => {
    if (!validateWallet()) {
      options?.onError?.(new Error(WALLET_MISMATCH_MESSAGE), "unregister");
      return;
    }

    setIsUnregistering(true);
    try {
      // 1. Используем текущую сеть (пользователь регистрировался на ней)
      const chainIdForUnregister =
        currentChainId && isChainSupported(currentChainId) ? currentChainId : CHAIN_ID_ABSTRACT;

      // 2. Отменяем регистрацию в смарт-контракте
      console.log("Unregistering deck on blockchain...", {
        tournamentId: tournament.id,
        chainId: chainIdForUnregister,
      });

      const txHash = await unregisterDeckOnChain(tournament.id, chainIdForUnregister);
      
      console.log("Transaction submitted:", txHash);

      // 1.1. Ждем подтверждения транзакции в блокчейне
      console.log("Waiting for transaction confirmation...");
      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
      });
      
      console.log("Transaction confirmed:", {
        blockNumber: receipt.blockNumber,
        status: receipt.status,
      });

      // 2. Отправляем tx_hash на бэкенд для подтверждения отмены регистрации
      await unregisterMutation.mutateAsync({
        tournamentId: tournament.id,
        data: {
          tx_hash: txHash,
        },
      });

      options?.onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unregistration failed";
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage), "unregister");
    } finally {
      setIsUnregistering(false);
    }
  };

  return {
    register,
    unregister,
    isRegistering,
    isUnregistering,
  };
}
