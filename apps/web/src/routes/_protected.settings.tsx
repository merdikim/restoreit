import { createFileRoute } from '@tanstack/react-router';

import { SectionCard } from '@/components/layout/section-card';

export const Route = createFileRoute('/_protected/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <SectionCard>
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--brand)]">Profile & Settings</p>
      <h1 className="mt-3 text-3xl font-semibold">Settings placeholder</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        This MVP keeps account settings intentionally light. Add password reset, profile editing, billing, or AI model
        preferences here later.
      </p>
    </SectionCard>
  );
}
