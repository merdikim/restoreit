import { useUser } from '@clerk/tanstack-react-start';
import type { User } from '@/types';

export function useCurrentUser() {
  const { isLoaded, isSignedIn, user } = useUser();

  const clerkUser: User | null =
    isSignedIn && user
      ? {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? '',
          createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
          updatedAt: user.updatedAt?.toISOString() ?? new Date().toISOString(),
        }
      : null;

  return {
    data: clerkUser,
    isLoading: !isLoaded,
    isError: false,
  };
}
