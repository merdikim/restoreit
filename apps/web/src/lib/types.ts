export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type EnhancementType =
  | 'restore'
  | 'colorize'
  | 'upscale'
  | 'face_enhance'
  | 'all_in_one';

export type User = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type Photo = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  originalUrl: string;
  createdAt: string;
};

export type ProcessedAsset = {
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  processedUrl: string;
  downloadUrl: string;
};

export type Job = {
  id: string;
  status: JobStatus;
  progress: number;
  errorMessage: string | null;
  enhancements: EnhancementType[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  photo: Photo;
  processedAsset: ProcessedAsset | null;
};
