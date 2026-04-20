import { Link, createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { ImageComparison } from '@/components/jobs/image-comparison';
import { JobStatusBadge } from '@/components/jobs/job-status-badge';
import { SectionCard } from '@/components/layout/section-card';
import { useJob } from '@/hooks/use-jobs';
import { api } from '@/lib/api';
import { enhancementLabels, formatBytes, formatDate } from '@/lib/utils';

export const Route = createFileRoute('/_protected/jobs/$jobId')({
  component: JobDetailPage,
});

function JobDetailPage() {
  const { jobId } = Route.useParams();
  const jobQuery = useJob(jobId);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (jobQuery.isLoading) {
    return <p className="text-[var(--muted)]">Loading job...</p>;
  }

  if (jobQuery.error || !jobQuery.data) {
    return <p className="text-[var(--danger)]">{jobQuery.error?.message ?? 'Job not found'}</p>;
  }

  const job = jobQuery.data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--brand)]">Job Details</p>
          <h1 className="mt-2 text-4xl font-semibold">{job.photo.originalName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <JobStatusBadge status={job.status} />
          {job.processedAsset ? (
            <button
              type="button"
              className="rounded-full bg-[var(--brand)] px-5 py-3 font-semibold text-white"
              disabled={isDownloading}
              onClick={async () => {
                try {
                  setDownloadError(null);
                  setIsDownloading(true);
                  await api.downloadJob(job.id, `${job.photo.originalName}-restored.jpg`);
                } catch (error) {
                  setDownloadError(error instanceof Error ? error.message : 'Download failed');
                } finally {
                  setIsDownloading(false);
                }
              }}
            >
              {isDownloading ? 'Downloading...' : 'Download result'}
            </button>
          ) : null}
        </div>
      </div>

      <ImageComparison originalUrl={job.photo.originalUrl} processedUrl={job.processedAsset?.processedUrl} />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <SectionCard>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Processing progress</h2>
            <span className="text-lg font-semibold">{job.progress}%</span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${job.progress}%` }} />
          </div>
          <p className="mt-4 text-sm text-[var(--muted)]">
            Created {formatDate(job.createdAt)}{job.completedAt ? ` • Completed ${formatDate(job.completedAt)}` : ''}
          </p>
          {job.errorMessage ? <p className="mt-3 text-sm text-[var(--danger)]">{job.errorMessage}</p> : null}
          {downloadError ? <p className="mt-3 text-sm text-[var(--danger)]">{downloadError}</p> : null}
        </SectionCard>

        <SectionCard>
          <h2 className="text-2xl font-semibold">Enhancements</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {job.enhancements.map((enhancement) => (
              <span key={enhancement} className="rounded-full bg-white px-3 py-1 text-sm text-[var(--muted)]">
                {enhancementLabels[enhancement]}
              </span>
            ))}
          </div>
          <dl className="mt-6 space-y-3 text-sm">
            <InfoRow label="Original size" value={formatBytes(job.photo.sizeBytes)} />
            <InfoRow label="Processed size" value={job.processedAsset ? formatBytes(job.processedAsset.sizeBytes) : 'Pending'} />
            <InfoRow label="Status endpoint" value={`/api/jobs/${job.id}/status`} />
          </dl>
        </SectionCard>
      </div>

      <Link to="/dashboard" className="text-sm font-semibold text-[var(--brand)]">
        Back to dashboard
      </Link>
    </div>
  );
}

function InfoRow(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[var(--muted)]">{props.label}</dt>
      <dd className="font-medium text-right">{props.value}</dd>
    </div>
  );
}
