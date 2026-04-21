/// <reference types="vite/client" />
import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/tanstack-react-start';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';

import '@/styles.css';
import type { User } from '@/lib/types';
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
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
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
