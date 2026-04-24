import { useAuth } from '@clerk/tanstack-react-start';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { BillingProvider } from '@/types';
import { api } from '@/lib/api';

async function requireToken(getToken: () => Promise<string | null>) {
  const token = await getToken();
  if (!token) {
    throw new Error('You must be signed in to continue.');
  }

  return token;
}

export function useBillingSummary() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['billing'],
    queryFn: async () => api.getBillingSummary(await requireToken(getToken)),
    enabled: isLoaded && isSignedIn,
  });
}

export function useCreateCheckoutSession() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ packageId, provider }: { packageId: string; provider: BillingProvider }) =>
      api.createCheckoutSession(packageId, provider, await requireToken(getToken)),
  });
}

export function useConfirmCheckoutSession() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, transactionHash }: { sessionId: string; transactionHash?: string }) =>
      api.confirmCheckoutSession(sessionId, await requireToken(getToken), transactionHash),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
  });
}
