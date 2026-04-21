import { useAuth } from '@clerk/tanstack-react-start';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { EnhancementType } from '@/lib/types';

async function requireToken(getToken: () => Promise<string | null>) {
  const token = await getToken();
  if (!token) {
    throw new Error('You must be signed in to continue.');
  }

  return token;
}

export function useJobs() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => api.listJobs(await requireToken(getToken)),
    enabled: isLoaded && isSignedIn,
    refetchInterval: (query) => {
      const jobs = query.state.data;
      return jobs?.some((job) => ['pending', 'processing'].includes(job.status)) ? 2000 : false;
    },
  });
}

export function useJob(jobId: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['jobs', jobId],
    queryFn: async () => api.getJob(jobId, await requireToken(getToken)),
    enabled: isLoaded && isSignedIn,
    refetchInterval: (query) => {
      const job = query.state.data;
      return job && ['pending', 'processing'].includes(job.status) ? 2000 : false;
    },
  });
}

export function useCreateJob() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, enhancements }: { photoId: string; enhancements: EnhancementType[] }) =>
      api.createJob(photoId, enhancements, await requireToken(getToken)),
    onSuccess: (job) => {
      queryClient.setQueryData(['jobs', job.id], job);
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useUploadPhoto() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => api.uploadPhoto(file, await requireToken(getToken)),
  });
}
