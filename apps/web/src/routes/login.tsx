import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router';

import { AuthForm } from '@/components/auth/auth-form';
import { AppShell } from '@/components/layout/app-shell';
import { SectionCard } from '@/components/layout/section-card';
import { useLogin } from '@/hooks/use-auth';

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: ({ context, search }) => {
    if (context.currentUser) {
      throw redirect({
        to: typeof search.redirect === 'string' && search.redirect.startsWith('/') ? search.redirect : '/dashboard',
      });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const search = Route.useSearch();

  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <SectionCard>
          <AuthForm
            title="Welcome back"
            subtitle="Pick up where you left off and manage restoration jobs."
            submitLabel="Login"
            error={login.error?.message}
            isSubmitting={login.isPending}
            onSubmit={(values) => {
              login.mutate(values, {
                onSuccess: () => {
                  const redirectTarget =
                    typeof search.redirect === 'string' && search.redirect.startsWith('/')
                      ? search.redirect
                      : '/dashboard';

                  void navigate({ to: redirectTarget });
                },
              });
            }}
          />
          <p className="mt-5 text-sm text-[var(--muted)]">
            Need an account? <Link to="/signup" search={{ redirect: undefined }} className="text-[var(--brand)]">Create one</Link>
          </p>
        </SectionCard>
      </div>
    </AppShell>
  );
}
