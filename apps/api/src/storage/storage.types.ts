export type FileMetadata = {
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
};

export interface StorageProvider {
  ensureReady(): Promise<void>;
  getPublicUrl(storagePath: string): string;
  getDownloadUrl(storagePath: string, downloadName?: string): Promise<string>;
  getObjectBuffer(storagePath: string): Promise<Buffer>;
  putObject(
    storagePath: string,
    contents: Buffer,
    options?: {
      contentType?: string;
    },
  ): Promise<void>;
}
