import { useWriteContract } from "wagmi";

// Verified selector: 0x90b9f426
// upgradeWithRoll(address,uint256[],uint256,bytes32,uint256,uint256,bytes)
export const CARD_UPGRADER_ABI = [
  {
    inputs: [
      { internalType: "address",   name: "user",         type: "address"   },
      { internalType: "uint256[]", name: "tokenIds",     type: "uint256[]" },
      { internalType: "uint256",   name: "outcomeCardId",type: "uint256"   },
      { internalType: "bytes32",   name: "salt",         type: "bytes32"   },
      { internalType: "uint256",   name: "nonce",        type: "uint256"   },
      { internalType: "uint256",   name: "deadline",     type: "uint256"   },
      { internalType: "bytes",     name: "signature",    type: "bytes"     },
    ],
    name: "upgradeWithRoll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function useUpgradeCards() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();

  const upgradeCards = async (params: {
    upgraderContract: `0x${string}`;
    user: `0x${string}`;
    tokenIds: bigint[];
    outcomeCardId: bigint;
    salt: `0x${string}`;
    nonce: bigint;
    deadline: bigint;
    signature: `0x${string}`;
    chainId: number;
  }) => {
    const txHash = await writeContractAsync({
      address: params.upgraderContract,
      abi: CARD_UPGRADER_ABI,
      functionName: "upgradeWithRoll",
      args: [
        params.user,
        params.tokenIds,
        params.outcomeCardId,
        params.salt,
        params.nonce,
        params.deadline,
        params.signature,
      ],
      chainId: params.chainId,
    });
    return txHash;
  };

  return {
    upgradeCards,
    hash,
    isPending,
    error,
  };
}
