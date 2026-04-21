import { useAuth } from '@clerk/tanstack-react-start';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { ImageComparison } from '@/components/jobs/image-comparison';
import { JobStatusBadge } from '@/components/jobs/job-status-badge';
import { SectionCard } from '@/components/layout/section-card';
import { useJob } from '@/hooks/use-jobs';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export const Route = createFileRoute('/_protected/jobs/$jobId')({
  component: JobDetailPage,
});

function JobDetailPage() {
  const { jobId } = Route.useParams();
  const { getToken } = useAuth();
  const jobQuery = useJob(jobId);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (jobQuery.isLoading) {
    return <p className="text-(--muted)">Loading job...</p>;
  }

  if (jobQuery.error || !jobQuery.data) {
    return <p className="text-(--danger)">{jobQuery.error?.message ?? 'Job not found'}</p>;
  }

  const job = jobQuery.data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-(--brand)">Job Details</p>
          <h1 className="mt-2 text-4xl font-semibold">{job.photo.originalName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <JobStatusBadge status={job.status} />
          {job.processedAsset ? (
            <button
              type="button"
              className="rounded-full bg-(--brand) px-5 py-3 font-semibold text-white"
              disabled={isDownloading}
              onClick={async () => {
                try {
                  setDownloadError(null);
                  setIsDownloading(true);
                  const token = await getToken();
                  if (!token) {
                    throw new Error('You must be signed in to download results.');
                  }

                  await api.downloadJob(job.id, `${job.photo.originalName}-restored.jpg`, token);
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
            <div className="h-full rounded-full bg-(--brand)" style={{ width: `${job.progress}%` }} />
          </div>
          <p className="mt-4 text-sm text-(--muted)">
            Created {formatDate(job.createdAt)}{job.completedAt ? ` • Completed ${formatDate(job.completedAt)}` : ''}
          </p>
          {job.errorMessage ? <p className="mt-3 text-sm text-(--danger)">{job.errorMessage}</p> : null}
          {downloadError ? <p className="mt-3 text-sm text-(--danger)">{downloadError}</p> : null}
        </SectionCard>
      </div>

      <Link to="/dashboard" className="text-sm font-semibold text-(--brand)">
        Back to dashboard
      </Link>
    </div>
  );
}

function InfoRow(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-(--muted)">{props.label}</dt>
      <dd className="font-medium text-right">{props.value}</dd>
    </div>
  );
}
