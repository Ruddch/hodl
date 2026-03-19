import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { getPackOpenerAddress, DEFAULT_CHAIN_ID } from "@/lib/blockchain";

export const HODLEAGUE_CARDS_ABI = [
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "openingId", type: "uint256" },
      { internalType: "uint256[]", name: "cardIds", type: "uint256[]" },
      { internalType: "bytes32", name: "serverSeed", type: "bytes32" },
      { internalType: "bytes", name: "signature", type: "bytes" },
    ],
    name: "mintWithSignature",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "uint256", name: "openingId", type: "uint256" },
      { indexed: false, internalType: "uint256[]", name: "cardIds", type: "uint256[]" },
    ],
    name: "PackOpened",
    type: "event",
  },
] as const;

export function useMintWithSignature() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const mintWithSignature = async (params: {
    user: `0x${string}`;
    openingId: bigint;
    cardIds: bigint[];
    serverSeed: `0x${string}`;
    signature: `0x${string}`;
    chainId?: number;
  }) => {
    const chainId = params.chainId;
    const address = getPackOpenerAddress(chainId ?? DEFAULT_CHAIN_ID);
    if (!address) {
      throw new Error(`HodleagueCards contract not deployed on chain ${chainId}`);
    }

    const txHash = await writeContractAsync({
      address,
      abi: HODLEAGUE_CARDS_ABI,
      functionName: "mintWithSignature",
      args: [
        params.user,
        params.openingId,
        params.cardIds,
        params.serverSeed,
        params.signature,
      ],
      chainId,
    });

    return txHash;
  };

  return {
    mintWithSignature,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}
