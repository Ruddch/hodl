"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { wagmiConfig } from "@/lib/wagmi";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { RefCapture } from "@/components/RefCapture";
import { AcquisitionCapture } from "@/components/AcquisitionCapture";
import { UnviewedCardsProvider } from "@/lib/unviewed-cards-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <ThemeProvider>
            <AcquisitionCapture />
            <RefCapture />
            <AuthProvider>
              <UnviewedCardsProvider>
                {children}
              </UnviewedCardsProvider>
            </AuthProvider>
          </ThemeProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

