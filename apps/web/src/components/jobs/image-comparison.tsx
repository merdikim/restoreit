import { SectionCard } from '@/components/layout/section-card';

export function ImageComparison(props: {
  originalUrl: string;
  processedUrl?: string | null;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard>
        <p className="mb-4 text-sm uppercase tracking-[0.2em] text-(--muted)"> Original </p>
        <img src={props.originalUrl} alt="Original upload" className="min-h-105 w-full rounded-2xl object-cover" />
      </SectionCard>
      <SectionCard>
        <p className="mb-4 text-sm uppercase tracking-[0.2em] text-(--muted)">Processed</p>
        {props.processedUrl ? (
          <img src={props.processedUrl} alt="Processed result" className="min-h-105 w-full rounded-2xl object-cover" />
        ) : (
          <div className="flex h-105 items-center justify-center rounded-2xl border border-dashed border-(--line) bg-white/50 text-(--muted)">
            Processing preview will appear here
          </div>
        )}
      </SectionCard>
    </div>
  );
}
