import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type { StorageProvider } from './storage.types.js';

@Injectable()
export class R2StorageService implements StorageProvider {
  private readonly bucketName: string;
  private readonly publicBaseUrl: string;
  private readonly signedUrlTtlSeconds: number;
  private readonly client: S3Client;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    const bucketName = this.configService.get<string>('R2_BUCKET_NAME');
    const publicBaseUrl = this.configService.get<string>('R2_PUBLIC_URL');

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicBaseUrl) {
      throw new Error(
        'Cloudflare R2 storage requires R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL.',
      );
    }

    this.bucketName = bucketName;
    this.publicBaseUrl = publicBaseUrl.replace(/\/+$/, '');
    this.signedUrlTtlSeconds = Number(this.configService.get<string>('R2_SIGNED_URL_TTL_SECONDS', '900'));
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async ensureReady(): Promise<void> {
    return;
  }

  getPublicUrl(storagePath: string): string {
    return `${this.publicBaseUrl}/${this.normalizePath(storagePath)}`;
  }

  async getDownloadUrl(storagePath: string, downloadName?: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: this.normalizePath(storagePath),
      ResponseContentDisposition: downloadName
        ? `attachment; filename="${this.sanitizeFilename(downloadName)}"`
        : undefined,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: this.signedUrlTtlSeconds,
    });
  }

  async getObjectBuffer(storagePath: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: this.normalizePath(storagePath),
      }),
    );

    if (!response.Body) {
      throw new Error(`R2 object "${storagePath}" returned no body.`);
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  async putObject(
    storagePath: string,
    contents: Buffer,
    options?: {
      contentType?: string;
    },
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: this.normalizePath(storagePath),
        Body: contents,
        ContentType: options?.contentType,
      }),
    );
  }

  private normalizePath(storagePath: string) {
    return storagePath.replace(/^\/+/, '').replace(/\\/g, '/');
  }

  private sanitizeFilename(filename: string) {
    return filename.replace(/["\r\n]/g, '_');
  }
}
