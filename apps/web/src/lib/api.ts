import { env } from './env';
import { getToken } from './auth-storage';
import type { AuthResponse, Job, Photo, User } from './types';

type RequestOptions = RequestInit & {
  auth?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth !== false) {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${env.apiUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const data = (await response.json()) as { message?: string | string[] };
      message = Array.isArray(data.message) ? data.message.join(', ') : data.message ?? message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  register(email: string, password: string) {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      auth: false,
    });
  },
  login(email: string, password: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      auth: false,
    });
  },
  me() {
    return request<User>('/auth/me');
  },
  uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return request<Photo>('/photos/upload', {
      method: 'POST',
      body: formData,
    });
  },
  createJob(photoId: string, enhancements: string[]) {
    return request<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify({ photoId, enhancements }),
    });
  },
  listJobs() {
    return request<Job[]>('/jobs');
  },
  getJob(jobId: string) {
    return request<Job>(`/jobs/${jobId}`);
  },
  getJobStatus(jobId: string) {
    return request<Job>(`/jobs/${jobId}/status`);
  },
  getDownloadUrl(jobId: string) {
    return `${env.apiUrl}/jobs/${jobId}/download`;
  },
  async downloadJob(jobId: string, filename: string) {
    const token = getToken();
    const response = await fetch(`${env.apiUrl}/jobs/${jobId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  },
};
