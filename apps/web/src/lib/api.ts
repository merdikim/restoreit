import { env } from './env';
import type { BillingProvider, BillingSummary, CheckoutConfirmation, CheckoutSession, Job, Photo } from '../types';

type RequestOptions = RequestInit & {
  auth?: boolean;
  authToken?: string | null;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth !== false && options.authToken) {
    headers.set('Authorization', `Bearer ${options.authToken}`);
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
  getBillingSummary(authToken: string) {
    return request<BillingSummary>('/billing/summary', { authToken });
  },
  createCheckoutSession(packageId: string, provider: BillingProvider, authToken: string) {
    return request<CheckoutSession>('/billing/checkout-session', {
      method: 'POST',
      body: JSON.stringify({ packageId, provider }),
      authToken,
    });
  },
  confirmCheckoutSession(sessionId: string, authToken: string, transactionHash?: string) {
    return request<CheckoutConfirmation>(
      `/billing/checkout-session/${sessionId}/confirm`,
      {
        method: 'POST',
        body: JSON.stringify(transactionHash ? { transactionHash } : {}),
        authToken,
      },
    );
  },
  uploadPhoto(file: File, authToken: string) {
    const formData = new FormData();
    formData.append('file', file);

    return request<Photo>('/photos/upload', {
      method: 'POST',
      body: formData,
      authToken,
    });
  },
  createJob(photoId: string, authToken: string) {
    return request<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify({ photoId }),
      authToken,
    });
  },
  listJobs(authToken: string) {
    return request<Job[]>('/jobs', { authToken });
  },
  getJob(jobId: string, authToken: string) {
    return request<Job>(`/jobs/${jobId}`, { authToken });
  },
  publishJobToArweave(jobId: string, authToken: string) {
    return request<Job['arweaveUpload']>(`/jobs/${jobId}/publish-arweave`, {
      method: 'POST',
      authToken,
    });
  },
  getJobStatus(jobId: string) {
    return request<Job>(`/jobs/${jobId}/status`);
  },
  getDownloadUrl(jobId: string) {
    return `${env.apiUrl}/jobs/${jobId}/download`;
  },
  async downloadJob(jobId: string, filename: string, authToken: string) {
    const response = await fetch(`${env.apiUrl}/jobs/${jobId}/download`, {
      headers: { Authorization: `Bearer ${authToken}` },
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
