/// <reference types="vite/client" />
import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/tanstack-react-start';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import { WagmiProvider } from 'wagmi';

import '@rainbow-me/rainbowkit/styles.css';
import '@/styles.css';
import type { User } from '@/types';
import { walletConfig } from '@/lib/wallet';
import { getCurrentUserServerFn } from '@/server/auth';

type RouterContext = {
  queryClient: import('@tanstack/react-query').QueryClient;
  currentUser: User | null;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const currentUser = await getCurrentUserServerFn();

    return {
      currentUser,
    };
  },
  notFoundComponent: () => (
    <div className="flex min-h-100 flex-col items-center justify-center p-8 text-center">
      <h1 className="mb-2 text-4xl font-bold text-gray-900">404</h1>
      <p className="mb-4 text-lg text-gray-600">Page not found</p>
      <a
        href="/"
        className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
      >
        Go Home
      </a>
    </div>
  ),
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'RestoreIt | AI Photo Restoration' },
      { name: 'description', content: 'Restore and enhance old photos with a pluggable AI-ready workflow.' },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <RootDocument>
      <WagmiProvider config={walletConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <Outlet />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </RootDocument>
  );
}

function RootDocument(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ClerkProvider>
          {props.children}
          <Scripts />
        </ClerkProvider>
      </body>
    </html>
  );
}
