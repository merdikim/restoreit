import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { getToken } from '@/lib/auth-storage';
import { useCurrentUser } from '@/hooks/use-auth';

export function ProtectedRoute(props: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const token = getToken();
  const userQuery = useCurrentUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (!token) {
      void navigate({ to: '/login', search: { redirect: undefined } });
      return;
    }

    if (userQuery.isError) {
      void navigate({ to: '/login', search: { redirect: undefined } });
    }
  }, [mounted, navigate, token, userQuery.isError]);

  if (!mounted || !token || userQuery.isLoading) {
    return <div className="py-20 text-center text-[var(--muted)]">Loading your workspace...</div>;
  }

  if (!userQuery.data) {
    return null;
  }

  return <>{props.children}</>;
}
