import { Show, UserButton } from '@clerk/tanstack-react-start';
import { Link, getRouteApi } from '@tanstack/react-router';

import { useCurrentUser } from '@/hooks/use-auth';

const rootRouteApi = getRouteApi('__root__');

export function AppShell(props: { children: React.ReactNode }) {
  const { currentUser } = rootRouteApi.useRouteContext();
  const { data: queriedUser } = useCurrentUser();
  const user = queriedUser ?? currentUser;

  return (
    <div className="min-h-screen">
      <header className="border-b border-(--line) ">
        <div className="mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="text-2xl font-bold tracking-tight text-(--brand-dark)">
            RestoreIt
          </Link>
          <nav className="flex items-center gap-5 text-sm text-(--muted)">
            {user ? (
              <>
                <Link to="/dashboard" activeProps={{ className: 'text-[var(--brand-dark)]' }}>
                  Dashboard
                </Link>
                <Link to="/jobs/new" activeProps={{ className: 'text-[var(--brand-dark)]' }}>
                  New Job
                </Link>
                <Link
                  to="/settings"
                  search={{ checkout: undefined, provider: undefined, session_id: undefined }}
                  activeProps={{ className: 'text-[var(--brand-dark)]' }}
                >
                  Settings
                </Link>
              </>
            ) : null}
            <Show when="signed-in">
              <UserButton />
            </Show>
            <Show when="signed-out">
              <Link
                to="/login"
                search={{ redirect: undefined }}
                className="rounded-full bg-(--brand) px-4 py-2 text-white"
              >
                Login
              </Link>
            </Show>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{props.children}</main>
    </div>
  );
}
