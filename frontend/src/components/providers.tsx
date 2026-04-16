'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { walletConnect, injected } from 'wagmi/connectors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 30000,
    },
  },
});

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'your_project_id';

const config = createConfig({
  chains: [bsc],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [bsc.id]: http(),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
