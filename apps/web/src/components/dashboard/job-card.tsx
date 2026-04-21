import { Link } from '@tanstack/react-router';

import { JobStatusBadge } from '@/components/jobs/job-status-badge';
import { formatDate } from '@/lib/utils';
import type { Job } from '@/types';

export function JobCard(props: { job: Job }) {
  return (
    <Link
      to="/jobs/$jobId"
      params={{ jobId: props.job.id }}
      className="block rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-4 transition hover:-translate-y-1"
    >
      <img
        src={props.job.processedAsset?.processedUrl ?? props.job.photo.originalUrl}
        alt={props.job.photo.originalName}
        className="h-48 w-full rounded-2xl object-cover"
      />
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">{props.job.photo.originalName}</h3>
          <JobStatusBadge status={props.job.status} />
        </div>
        <p className="text-sm text-[var(--muted)]">{formatDate(props.job.createdAt)}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            <span>Progress</span>
            <span>{props.job.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${props.job.progress}%` }} />
          </div>
        </div>
      </div>
    </Link>
  );
}
