export type FileMetadata = {
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
};

export interface StorageProvider {
  ensureReady(): Promise<void>;
  getAbsolutePath(storagePath: string): string;
  getPublicUrl(storagePath: string): string;
  copyToProcessed(sourcePath: string, targetFilename: string): Promise<{ storagePath: string }>;
}
