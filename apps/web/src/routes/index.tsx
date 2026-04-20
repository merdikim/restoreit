import { Link, createFileRoute } from '@tanstack/react-router';

import { AppShell } from '@/components/layout/app-shell';
import { SectionCard } from '@/components/layout/section-card';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  return (
    <AppShell>
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--brand)]">Photo Restoration MVP</p>
          <h1 className="max-w-3xl text-5xl leading-tight font-semibold">
            Bring faded family photos back with an AI-ready restoration workflow.
          </h1>
          <p className="max-w-2xl text-lg text-[var(--muted)]">
            Upload an old image, choose restoration options, and track progress from upload to download. The mock
            pipeline is ready to be swapped for real AI inference later.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/signup"
              search={{ redirect: undefined }}
              className="rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-white"
            >
              Start restoring
            </Link>
            <Link
              to="/login"
              search={{ redirect: undefined }}
              className="rounded-full border border-[var(--line)] px-6 py-3 font-semibold"
            >
              Sign in
            </Link>
          </div>
        </div>
        <SectionCard className="space-y-5">
          <div className="relative h-80 overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#6e3513_0%,#b36b3d_45%,#ead7bb_100%)]">
            <div className="absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(180deg,rgba(34,24,18,0.75),rgba(92,66,43,0.9))]" />
            <div className="absolute left-[8%] top-[12%] h-56 w-40 rounded-[999px] border border-white/25 bg-white/10 blur-[1px]" />
            <div className="absolute right-[10%] top-[14%] h-52 w-44 rounded-[32px] bg-white/25 shadow-[0_22px_70px_rgba(0,0,0,0.18)]" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">Before / After</p>
                <p className="mt-2 text-2xl font-semibold">Mock restoration previews with a real job pipeline</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Metric label="Delivery mode" value="Still images only" />
            <Metric label="Enhancement presets" value="5 focused modes" />
            <Metric label="Status tracking" value="Live polling" />
            <Metric label="AI provider swap" value="Pluggable backend" />
          </div>
        </SectionCard>
      </section>
    </AppShell>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{props.label}</p>
      <p className="mt-2 text-lg font-semibold">{props.value}</p>
    </div>
  );
}
