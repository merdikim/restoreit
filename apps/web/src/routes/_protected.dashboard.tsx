import { Link, createFileRoute } from '@tanstack/react-router';

import { JobCard } from '@/components/dashboard/job-card';
import { SectionCard } from '@/components/layout/section-card';
import { useCurrentUser } from '@/hooks/use-auth';
import { useJobs } from '@/hooks/use-jobs';

export const Route = createFileRoute('/_protected/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: user } = useCurrentUser();
  const jobsQuery = useJobs();

  return (
    <div className="space-y-8">
      <SectionCard className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-(--brand)">Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold">Welcome, {user?.email}</h1>
          <p className="mt-3 max-w-2xl text-(--muted)">
            Track every restoration from upload through processed download in one place.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Total jobs" value={String(jobsQuery.data?.length ?? 0)} />
          <StatCard
            label="Completed"
            value={String(jobsQuery.data?.filter((job) => job.status === 'completed').length ?? 0)}
          />
        </div>
      </SectionCard>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Recent restorations</h2>
          <p className="mt-1 text-sm text-(--muted)">Your uploaded pictures and restoration jobs live here.</p>
        </div>
        <Link to="/jobs/new" className="rounded-full bg-(--brand) px-5 py-3 text-white">
          New restoration
        </Link>
      </div>

      {jobsQuery.isLoading ? <p className="text-(--muted)">Loading jobs...</p> : null}
      {jobsQuery.error ? <p className="text-(--danger)">{jobsQuery.error.message}</p> : null}
      {jobsQuery.data?.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {jobsQuery.data.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : null}
      {!jobsQuery.isLoading && !jobsQuery.data?.length ? (
        <SectionCard>
          <p className="text-lg font-semibold">No restoration jobs yet</p>
          <p className="mt-2 text-(--muted)">Upload your first picture to see progress and results here.</p>
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
