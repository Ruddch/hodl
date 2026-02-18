import { useState } from "react";
import { useAccount, useConfig, useSwitchChain } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useAuth } from "@/lib/auth-context";
import { useValidateDeck, useRegisterForTournament, useUnregisterFromTournament } from "@/lib/api";
import { useRegisterDeckOnChain, useUnregisterDeckOnChain } from "@/lib/contracts/tournament-registry";
import { CHAIN_ID_ABSTRACT, isChainSupported } from "@/lib/blockchain";
import type { Tournament } from "@/lib/types";

interface UseTournamentRegistrationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
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

  // Проверка кошелька
  const validateWallet = (): boolean => {
    if (signedWalletAddress && address && address.toLowerCase() !== signedWalletAddress.toLowerCase()) {
      alert("Активный кошелек не совпадает с кошельком, на который вы подписывали. Пожалуйста, переключите кошелек в вашем кошельке (Rabi Wallet) на адрес, который вы использовали для авторизации.");
      return false;
    }
    return true;
  };

  // Регистрация на турнир
  const register = async (tournament: Tournament, selectedCardIds: number[]) => {
    if (!validateWallet()) return;

    setIsRegistering(true);
    try {
      // 1. Валидируем колоду на бэкенде
      const validation = await validateDeckMutation.mutateAsync({
        tournamentId: tournament.id,
        data: { deck_composition: selectedCardIds },
      });

      if (!validation.valid) {
        const error = new Error(validation.message || "Deck validation failed");
        alert(error.message);
        options?.onError?.(error);
        return;
      }

      // 2. Выбираем цепочку: бэкенд возвращает recommended_chain_id при наличии баланса
      const targetChainId =
        validation.recommended_chain_id && isChainSupported(validation.recommended_chain_id)
          ? validation.recommended_chain_id
          : CHAIN_ID_ABSTRACT;

      // 2.1. Переключаем цепочку, если нужно
      if (currentChainId !== targetChainId && switchChain.switchChainAsync) {
        await switchChain.switchChainAsync({ chainId: targetChainId });
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
      console.error("Registration failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      alert(errorMessage);
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsRegistering(false);
    }
  };

  // Отмена регистрации на турнир
  const unregister = async (tournament: Tournament) => {
    if (!validateWallet()) return;

    setIsUnregistering(true);
    try {
      // 1. Отменяем регистрацию в смарт-контракте
      console.log("Unregistering deck on blockchain...", {
        tournamentId: tournament.id,
      });

      const txHash = await unregisterDeckOnChain(tournament.id);
      
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
      console.error("Unregistration failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unregistration failed";
      alert(errorMessage);
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage));
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
