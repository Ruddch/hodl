import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { abstract } from "wagmi/chains";

// Contract address on Abstract Mainnet
export const TOURNAMENT_REGISTRY_ADDRESS = "0x507Db3dfd3695270D7F2b08a25906e171C07B4C4" as const;

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

  const registerDeck = async (tournamentId: number, deckHash: `0x${string}`) => {
    const txHash = await writeContractAsync({
      address: TOURNAMENT_REGISTRY_ADDRESS,
      abi: TOURNAMENT_REGISTRY_ABI,
      functionName: "registerDeck",
      args: [BigInt(tournamentId), deckHash],
      chainId: abstract.id,
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

  const unregisterDeck = async (tournamentId: number) => {
    const txHash = await writeContractAsync({
      address: TOURNAMENT_REGISTRY_ADDRESS,
      abi: TOURNAMENT_REGISTRY_ABI,
      functionName: "unregisterDeck",
      args: [BigInt(tournamentId)],
      chainId: abstract.id,
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
