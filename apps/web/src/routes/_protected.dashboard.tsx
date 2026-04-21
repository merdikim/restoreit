import { Link, createFileRoute } from '@tanstack/react-router';
import { SectionCard } from '@/components/layout/section-card';
import { useCurrentUser } from '@/hooks/use-auth';
import { useJobs } from '@/hooks/use-jobs';
import { formatDate } from '@/lib/utils';
import type { Job } from '@/types';

export const Route = createFileRoute('/_protected/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: user } = useCurrentUser();
  const jobsQuery = useJobs();
  const folders = groupJobsIntoFolders(jobsQuery.data ?? []);

  return (
    <div className="space-y-8">
      <SectionCard className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-(--brand)">Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold">Welcome, {user?.email}</h1>
          <p className="mt-3 max-w-2xl text-(--muted)">
            Browse your restorations as folders, with each folder collecting the pictures uploaded around the same
            time.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Total folders" value={String(folders.length)} />
          <StatCard label="Pictures" value={String(jobsQuery.data?.length ?? 0)} />
        </div>
      </SectionCard>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Picture folders</h2>
          <p className="mt-1 text-sm text-(--muted)">Each folder groups multiple restoration pictures together.</p>
        </div>
        <Link to="/jobs/new" className="rounded-full bg-(--brand) px-5 py-3 text-white">
          Add pictures
        </Link>
      </div>

      {jobsQuery.isLoading ? <p className="text-(--muted)">Loading jobs...</p> : null}
      {jobsQuery.error ? <p className="text-(--danger)">{jobsQuery.error.message}</p> : null}
      {folders.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {folders.map((folder) => (
            <SectionCard key={folder.id} className="overflow-hidden p-0">
              <div className="border-b border-(--line) bg-[linear-gradient(135deg,rgba(219,144,62,0.14),rgba(255,255,255,0.9))] px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-14 items-center justify-center rounded-2xl bg-(--surface) text-3xl shadow-[0_12px_25px_rgba(48,31,18,0.08)]">
                        <span aria-hidden="true">+</span>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-(--muted)">Folder</p>
                        <h3 className="mt-1 text-xl font-semibold">{folder.name}</h3>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-(--muted)">
                      {folder.pictureCount} picture{folder.pictureCount === 1 ? '' : 's'} • Updated{' '}
                      {formatDate(folder.updatedAt)}
                    </p>
                  </div>
                  <div className="rounded-full bg-white/85 px-3 py-2 text-right text-sm shadow-[0_10px_30px_rgba(48,31,18,0.08)]">
                    <p className="font-semibold text-(--brand-dark)">{folder.completedCount} completed</p>
                    <p className="text-(--muted)">{folder.processingCount} in progress</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {folder.previewJobs.map((job) => (
                    <Link
                      key={job.id}
                      to="/jobs/$jobId"
                      params={{ jobId: job.id }}
                      className="group relative block aspect-square overflow-hidden rounded-2xl bg-white"
                    >
                      <img
                        src={job.processedAsset?.processedUrl ?? job.photo.originalUrl}
                        alt={job.photo.originalName}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-3 py-2 text-xs text-white">
                        <p className="truncate font-medium">{job.photo.originalName}</p>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <p className="text-(--muted)">
                    {folder.latestJob.photo.originalName} was the most recent picture added to this folder.
                  </p>
                  <Link
                    to="/jobs/$jobId"
                    params={{ jobId: folder.latestJob.id }}
                    className="font-semibold text-(--brand)"
                  >
                    Open latest
                  </Link>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      ) : null}
      {!jobsQuery.isLoading && !folders.length ? (
        <SectionCard>
          <p className="text-lg font-semibold">No picture folders yet</p>
          <p className="mt-2 text-(--muted)">Upload your first pictures and we’ll group them into folders here.</p>
        </SectionCard>
      ) : null}
    </div>
  );
}

function StatCard(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">{props.label}</p>
      <p className="mt-2 text-3xl font-semibold">{props.value}</p>
    </div>
  );
}

type DashboardFolder = {
  id: string;
  name: string;
  updatedAt: string;
  pictureCount: number;
  completedCount: number;
  processingCount: number;
  previewJobs: Job[];
  latestJob: Job;
};

function groupJobsIntoFolders(jobs: Job[]): DashboardFolder[] {
  const grouped = jobs.reduce<Map<string, Job[]>>((folders, job) => {
    const folderId = getFolderId(job.createdAt);
    const existing = folders.get(folderId) ?? [];
    existing.push(job);
    folders.set(folderId, existing);
    return folders;
  }, new Map());

  return Array.from(grouped.entries())
    .map(([id, folderJobs]) => {
      const sortedJobs = [...folderJobs].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );
      const latestJob = sortedJobs[0];

      return {
        id,
        name: getFolderName(id),
        updatedAt: latestJob.updatedAt,
        pictureCount: sortedJobs.length,
        completedCount: sortedJobs.filter((job) => job.status === 'completed').length,
        processingCount: sortedJobs.filter((job) => job.status === 'pending' || job.status === 'processing').length,
        previewJobs: sortedJobs.slice(0, 4),
        latestJob,
      };
    })
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

function getFolderId(value: string) {
  const date = new Date(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function getFolderName(folderId: string) {
  const [year, month] = folderId.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}
