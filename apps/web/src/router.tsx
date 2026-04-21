import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';

import type { User } from './types';
import { routeTree } from './routeTree.gen';

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    context: {
      queryClient,
      currentUser: null as User | null,
    },
  });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
