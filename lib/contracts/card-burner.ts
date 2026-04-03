import { useWriteContract } from "wagmi";

export const CARD_BURNER_ABI = [
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256[]", name: "tokenIds", type: "uint256[]" },
      { internalType: "uint256", name: "nonce", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "bytes", name: "signature", type: "bytes" },
    ],
    name: "burnForDust",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function useBurnForDust() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();

  const burnForDust = async (params: {
    burnerContract: `0x${string}`;
    user: `0x${string}`;
    tokenIds: bigint[];
    nonce: bigint;
    deadline: bigint;
    signature: `0x${string}`;
    chainId: number;
  }) => {
    const txHash = await writeContractAsync({
      address: params.burnerContract,
      abi: CARD_BURNER_ABI,
      functionName: "burnForDust",
      args: [params.user, params.tokenIds, params.nonce, params.deadline, params.signature],
      chainId: params.chainId,
    });
    return txHash;
  };

  return {
    burnForDust,
    hash,
    isPending,
    error,
  };
}
