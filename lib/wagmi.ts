import { createConfig, http } from "wagmi";
import { abstract, avalanche } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { createClient } from "viem";
import { eip712WalletActions } from "viem/zksync";
import { abstractWalletConnector } from "@abstract-foundation/agw-react/connectors";

const chains = [abstract, avalanche] as const;

export const wagmiConfig = createConfig({
  chains,
  connectors: [
    abstractWalletConnector(),
    injected(), // MetaMask и др. для Avalanche
  ],
  client({ chain }) {
    return createClient({
      chain,
      transport: http(),
    }).extend(eip712WalletActions());
  },
  ssr: true,
});

