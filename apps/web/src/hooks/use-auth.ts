import { getRouteApi } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clearToken, getToken, setToken } from '@/lib/auth-storage';
import { api } from '@/lib/api';

const rootRouteApi = getRouteApi('__root__');

export function useCurrentUser() {
  const token = getToken();
  const { currentUser } = rootRouteApi.useRouteContext();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: api.me,
    initialData: currentUser ?? undefined,
    enabled: Boolean(token),
    staleTime: 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => api.login(email, password),
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(['auth', 'me'], data.user);
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => api.register(email, password),
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(['auth', 'me'], data.user);
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    clearToken();
    queryClient.clear();
  };
}
