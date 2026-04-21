import { SignUp } from '@clerk/tanstack-react-start';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { AppShell } from '@/components/layout/app-shell';
import { SectionCard } from '@/components/layout/section-card';

export const Route = createFileRoute('/signup/$')({
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
  component: SignupCatchAllPage,
});

function SignupCatchAllPage() {
  const search = Route.useSearch();
  const redirectTarget =
    typeof search.redirect === 'string' && search.redirect.startsWith('/') ? search.redirect : '/dashboard';

  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <SectionCard>
          <SignUp
            routing="path"
            path="/signup"
            signInUrl="/login"
            fallbackRedirectUrl={redirectTarget}
            signInFallbackRedirectUrl={redirectTarget}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
