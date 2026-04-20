import { SectionCard } from '@/components/layout/section-card';

export function ImageComparison(props: {
  originalUrl: string;
  processedUrl?: string | null;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard>
        <p className="mb-4 text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Original</p>
        <img src={props.originalUrl} alt="Original upload" className="h-[420px] w-full rounded-2xl object-cover" />
      </SectionCard>
      <SectionCard>
        <p className="mb-4 text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Processed</p>
        {props.processedUrl ? (
          <img src={props.processedUrl} alt="Processed result" className="h-[420px] w-full rounded-2xl object-cover" />
        ) : (
          <div className="flex h-[420px] items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-white/50 text-[var(--muted)]">
            Processing preview will appear here
          </div>
        )}
      </SectionCard>
    </div>
  );
}
