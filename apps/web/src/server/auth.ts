import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';

import { TOKEN_KEY } from '@/lib/auth-storage';
import { env } from '@/lib/env';
import type { User } from '@/lib/types';

export const getCurrentUserServerFn = createServerFn({ method: 'GET' }).handler(async () => {
  const token = getCookie(TOKEN_KEY);

  if (!token) {
    return null;
  }

  const response = await fetch(`${env.apiUrl}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as User;
});
