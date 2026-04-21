import type { JobStatus } from '@/types';

const styles: Record<JobStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-rose-100 text-rose-800',
};

export function JobStatusBadge(props: { status: JobStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles[props.status]}`}>
      {props.status}
    </span>
  );
}
