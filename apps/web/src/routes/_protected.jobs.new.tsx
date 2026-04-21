import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { SectionCard } from '@/components/layout/section-card';
import { UploadForm } from '@/components/upload/upload-form';
import { useCreateJob, useUploadPhoto } from '@/hooks/use-jobs';

export const Route = createFileRoute('/_protected/jobs/new')({
  component: NewJobPage,
});

function NewJobPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const uploadPhoto = useUploadPhoto();
  const createJob = useCreateJob();

  const error = uploadPhoto.error?.message ?? createJob.error?.message ?? null;

  return (
    <div className="space-y-6 flex flex-col items-center pt-10">
      <SectionCard className="p-4 sm:p-6 max-w-3xl w-full">
        <UploadForm
          isSubmitting={uploadPhoto.isPending || createJob.isPending}
          error={error}
          onSubmit={async ({ file }) => {
            const photo = await uploadPhoto.mutateAsync(file);
            const job = await createJob.mutateAsync({
              photoId: photo.id,
            });

            await queryClient.invalidateQueries({ queryKey: ['jobs', job.id] });
            void navigate({
              to: '/jobs/$jobId',
              params: { jobId: job.id },
            });
          }}
        />
      </SectionCard>
    </div>
  );
}
