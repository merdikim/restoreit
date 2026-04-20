import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { EnhancementType } from '@/lib/types';

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: api.listJobs,
    refetchInterval: (query) => {
      const jobs = query.state.data;
      return jobs?.some((job) => ['pending', 'processing'].includes(job.status)) ? 2000 : false;
    },
  });
}

export function useJob(jobId: string) {
  return useQuery({
    queryKey: ['jobs', jobId],
    queryFn: () => api.getJob(jobId),
    refetchInterval: (query) => {
      const job = query.state.data;
      return job && ['pending', 'processing'].includes(job.status) ? 2000 : false;
    },
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ photoId, enhancements }: { photoId: string; enhancements: EnhancementType[] }) =>
      api.createJob(photoId, enhancements),
    onSuccess: (job) => {
      queryClient.setQueryData(['jobs', job.id], job);
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useUploadPhoto() {
  return useMutation({
    mutationFn: (file: File) => api.uploadPhoto(file),
  });
}
