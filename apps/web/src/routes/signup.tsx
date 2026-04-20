import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router';

import { AuthForm } from '@/components/auth/auth-form';
import { AppShell } from '@/components/layout/app-shell';
import { SectionCard } from '@/components/layout/section-card';
import { useRegister } from '@/hooks/use-auth';

export const Route = createFileRoute('/signup')({
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
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const register = useRegister();
  const search = Route.useSearch();

  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <SectionCard>
          <AuthForm
            title="Create your account"
            subtitle="Start tracking uploads, restorations, and final results in one dashboard."
            submitLabel="Create account"
            error={register.error?.message}
            isSubmitting={register.isPending}
            onSubmit={(values) => {
              register.mutate(values, {
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
            Already signed up? <Link to="/login" search={{ redirect: undefined }} className="text-[var(--brand)]">Login</Link>
          </p>
        </SectionCard>
      </div>
    </AppShell>
  );
}
