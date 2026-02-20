import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  getTournamentRegistryAddress,
  CHAIN_ID_ABSTRACT,
  isChainSupported,
} from "@/lib/blockchain";

// Contract ABI (only the functions we need)
export const TOURNAMENT_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "tournamentId", type: "uint256" },
      { internalType: "bytes32", name: "deckHash", type: "bytes32" },
    ],
    name: "registerDeck",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tournamentId", type: "uint256" }],
    name: "unregisterDeck",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "address", name: "", type: "address" },
    ],
    name: "registrations",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Hook for registering deck on blockchain
export function useRegisterDeckOnChain() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const registerDeck = async (
    tournamentId: number,
    deckHash: `0x${string}`,
    chainId: number = CHAIN_ID_ABSTRACT
  ) => {
    const address = getTournamentRegistryAddress(chainId);
    if (!address || !isChainSupported(chainId)) {
      throw new Error(`Chain ${chainId} is not supported or contract address not set`);
    }

    const txHash = await writeContractAsync({
      address,
      abi: TOURNAMENT_REGISTRY_ABI,
      functionName: "registerDeck",
      args: [BigInt(tournamentId), deckHash],
      chainId,
    });

    return txHash;
  };

  return {
    registerDeck,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// Hook for unregistering deck from blockchain
export function useUnregisterDeckOnChain() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const unregisterDeck = async (
    tournamentId: number,
    chainId: number = CHAIN_ID_ABSTRACT
  ) => {
    const address = getTournamentRegistryAddress(chainId);
    if (!address || !isChainSupported(chainId)) {
      throw new Error(`Chain ${chainId} is not supported or contract address not set`);
    }

    const txHash = await writeContractAsync({
      address,
      abi: TOURNAMENT_REGISTRY_ABI,
      functionName: "unregisterDeck",
      args: [BigInt(tournamentId)],
      chainId,
    });

    return txHash;
  };

  return {
    unregisterDeck,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}
