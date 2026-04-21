import { SignIn } from '@clerk/tanstack-react-start';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { AppShell } from '@/components/layout/app-shell';
import { SectionCard } from '@/components/layout/section-card';

export const Route = createFileRoute('/login/$')({
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
  component: LoginCatchAllPage,
});

function LoginCatchAllPage() {
  const search = Route.useSearch();
  const redirectTarget =
    typeof search.redirect === 'string' && search.redirect.startsWith('/') ? search.redirect : '/dashboard';

  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <SectionCard>
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/signup"
            fallbackRedirectUrl={redirectTarget}
            signUpFallbackRedirectUrl={redirectTarget}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
