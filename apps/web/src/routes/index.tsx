import { Link, createFileRoute } from '@tanstack/react-router';

import { AppShell } from '@/components/layout/app-shell';
import { SectionCard } from '@/components/layout/section-card';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  return (
    <AppShell>
      <section className="grid items-center mt-32 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <h1 className="max-w-3xl text-5xl leading-tight font-semibold">
            Bring faded family photos back with an AI-ready restoration workflow.
          </h1>
          <p className="max-w-2xl text-lg text-(--muted)">
            Upload an old image and track progress from upload to download. The mock
            pipeline is ready to be swapped for real AI inference later.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/login"
              search={{ redirect: undefined }}
              className="rounded-full bg-(--brand) flex items-center justify-center h-12 w-80 font-semibold text-white transition-colors hover:bg-(--brand-dark) focus:outline-none focus:ring-2 focus:ring-(--brand) focus:ring-offset-2"
            >
              Start restoring
            </Link>
          </div>
        </div>
        <SectionCard className="space-y-5">
          <div className="relative h-80 overflow-hidden rounded-3xl">
           <img src="https://webneel.com/daily/sites/default/files/images/daily/05-2014/4-photo-restoration.jpg" alt="image restoration" className="w-full h-full object-cover" />
          </div>
        </SectionCard>
      </section>
    </AppShell>
  );
}
