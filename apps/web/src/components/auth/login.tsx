import { AppShell } from '@/components/layout/app-shell';
import { SignIn } from '@clerk/tanstack-react-start';

function Login({path, fallbackRedirectUrl}: {path: string; fallbackRedirectUrl: string}) {

  return (
    <AppShell>
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-6">
          <SignIn
            routing="path"
            path={path}
            fallbackRedirectUrl={fallbackRedirectUrl}
          />
        
      </div>
    </AppShell>
  );
}

export default Login;