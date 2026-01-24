import { createConfig, http } from "wagmi";
import { abstractTestnet, abstract } from "wagmi/chains";
import { createClient } from "viem";
import { eip712WalletActions } from "viem/zksync";
import { abstractWalletConnector } from "@abstract-foundation/agw-react/connectors";

// Используем testnet по умолчанию, можно переключить на abstract для mainnet
const chains = [abstract] as const;

export const wagmiConfig = createConfig({
  chains,
  connectors: [abstractWalletConnector()],
  client({ chain }) {
    return createClient({
      chain,
      transport: http(),
    }).extend(eip712WalletActions());
  },
  ssr: true,
});

