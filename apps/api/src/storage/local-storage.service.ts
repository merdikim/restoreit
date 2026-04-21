import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, copyFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { appRoot } from '../common/app-paths.js';
import type { StorageProvider } from './storage.types.js';
import { getUploadDir } from './storage-paths.js';

@Injectable()
export class LocalStorageService implements StorageProvider {
  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}

  async ensureReady(): Promise<void> {
    await mkdir(this.getAbsolutePath('originals'), { recursive: true });
    await mkdir(this.getAbsolutePath('processed'), { recursive: true });
  }

  getAbsolutePath(storagePath: string): string {
    const uploadDir = getUploadDir(this.configService.get<string>('UPLOAD_DIR'));
    return resolve(appRoot, uploadDir, storagePath);
  }

  getPublicUrl(storagePath: string): string {
    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:4000');
    return `${appUrl}/uploads/${storagePath}`;
  }

  async copyToProcessed(sourcePath: string, targetFilename: string) {
    const storagePath = join('processed', targetFilename);
    await copyFile(this.getAbsolutePath(sourcePath), this.getAbsolutePath(storagePath));
    return { storagePath };
  }
}
