import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { AppShell } from '@/components/layout/app-shell';

export const Route = createFileRoute('/_protected')({
  beforeLoad: ({ context, location }) => {
    if (!context.currentUser) {
      const redirectTo = `${location.pathname}${location.searchStr ? `?${location.searchStr}` : ''}${location.hash}`;

      throw redirect({
        to: '/login',
        search: {
          redirect: redirectTo,
        },
      });
    }

    return {
      currentUser: context.currentUser,
    };
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
