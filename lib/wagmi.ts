import { createConfig, http } from "wagmi";
import { abstract, avalanche, avalancheFuji, base } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { createClient } from "viem";
import { eip712WalletActions } from "viem/zksync";
import { abstractWalletConnector } from "@abstract-foundation/agw-react/connectors";
import { IS_AVAX } from "./constants";

const chains = IS_AVAX
  ? ([avalanche, avalancheFuji] as const)
  : ([abstract, avalanche, avalancheFuji, base] as const);

const connectors = IS_AVAX
  ? [injected()]
  : [abstractWalletConnector(), injected()];

export const wagmiConfig = createConfig({
  chains,
  connectors,
  client({ chain }) {
    const c = createClient({ chain, transport: http() });
    return IS_AVAX ? c : c.extend(eip712WalletActions());
  },
  ssr: true,
});

