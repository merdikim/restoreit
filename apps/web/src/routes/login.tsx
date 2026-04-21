import { createFileRoute, redirect } from '@tanstack/react-router';
import Login from '@/components/auth/login';

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
  const search = Route.useSearch();
  const redirectTarget =
    typeof search.redirect === 'string' && search.redirect.startsWith('/') ? search.redirect : '/dashboard';

  return (
    <Login path='/login' fallbackRedirectUrl={redirectTarget}/>
  );
}
