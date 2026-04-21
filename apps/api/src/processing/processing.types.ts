export type ProcessingJobInput = {
  jobId: string;
  photoPath: string;
  originalName: string;
};

export type ProcessingJobOutput = {
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
};

export interface ProcessingProvider {
  process(input: ProcessingJobInput, onProgress: (progress: number) => Promise<void>): Promise<ProcessingJobOutput>;
}
