import { Link, getRouteApi, useNavigate } from '@tanstack/react-router';

import { useCurrentUser, useLogout } from '@/hooks/use-auth';

const rootRouteApi = getRouteApi('__root__');

export function AppShell(props: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const logout = useLogout();
  const { currentUser } = rootRouteApi.useRouteContext();
  const { data: queriedUser } = useCurrentUser();
  const user = queriedUser ?? currentUser;

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[rgba(255,250,244,0.88)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-2xl font-bold tracking-tight text-[var(--brand-dark)]">
            RestoreIt
          </Link>
          <nav className="flex items-center gap-5 text-sm text-[var(--muted)]">
            {user ? (
              <>
                <Link to="/dashboard" activeProps={{ className: 'text-[var(--brand-dark)]' }}>
                  Dashboard
                </Link>
                <Link to="/jobs/new" activeProps={{ className: 'text-[var(--brand-dark)]' }}>
                  New Job
                </Link>
                <Link to="/settings" activeProps={{ className: 'text-[var(--brand-dark)]' }}>
                  Settings
                </Link>
              </>
            ) : null}
            {user ? (
              <button
                className="rounded-full border border-[var(--line)] px-4 py-2 text-[var(--ink)]"
                onClick={() => {
                  logout();
                  void navigate({ to: '/login', search: { redirect: undefined } });
                }}
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                search={{ redirect: undefined }}
                className="rounded-full bg-[var(--brand)] px-4 py-2 text-white"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{props.children}</main>
    </div>
  );
}
