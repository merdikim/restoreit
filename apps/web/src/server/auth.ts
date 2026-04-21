import { auth, clerkClient } from '@clerk/tanstack-react-start/server';
import { createServerFn } from '@tanstack/react-start';
import type { User } from '@/types';

export const getCurrentUserServerFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return null;
  }

  const user = await clerkClient().users.getUser(userId);
  const primaryEmail =
    user.emailAddresses.find((emailAddress) => emailAddress.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) {
    return null;
  }

  return {
    id: user.id,
    email: primaryEmail,
    createdAt: new Date(user.createdAt).toISOString(),
    updatedAt: new Date(user.updatedAt).toISOString(),
  } satisfies User;
});
