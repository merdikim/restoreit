import { Inject, Injectable } from '@nestjs/common';
import { EnhancementType } from '@prisma/client';
import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';

import { STORAGE_PROVIDER } from '../../storage/storage.tokens.js';
import type { StorageProvider } from '../../storage/storage.types.js';
import type { ProcessingProvider, ProcessingJobInput } from '../processing.types.js';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class MockProcessingProvider implements ProcessingProvider {
  constructor(@Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider) {}

  async process(input: ProcessingJobInput, onProgress: (progress: number) => Promise<void>) {
    const outputName = `${basename(input.originalName, extname(input.originalName))}-${input.jobId}.jpg`;
    const targetPath = this.storage.getAbsolutePath(join('processed', outputName));

    await mkdir(this.storage.getAbsolutePath('processed'), { recursive: true });
    await onProgress(10);
    await delay(1000);
    await onProgress(35);

    let image = sharp(this.storage.getAbsolutePath(input.photoPath)).rotate().jpeg({ quality: 92 });
    const selected = new Set(input.enhancements);
    const applyAll = selected.has(EnhancementType.all_in_one);

    if (applyAll || selected.has(EnhancementType.restore)) {
      image = image.normalize().sharpen(0.8);
    }

    if (applyAll || selected.has(EnhancementType.colorize)) {
      image = image.modulate({
        saturation: 1.25,
        brightness: 1.04,
      });
    }

    if (applyAll || selected.has(EnhancementType.face_enhance)) {
      image = image.sharpen(1.2);
    }

    const metadata = await sharp(this.storage.getAbsolutePath(input.photoPath)).metadata();
    if (applyAll || selected.has(EnhancementType.upscale)) {
      image = image.resize({
        width: metadata.width ? metadata.width * 2 : undefined,
        height: metadata.height ? metadata.height * 2 : undefined,
        fit: 'inside',
        withoutEnlargement: false,
      });
    }

    await delay(1200);
    await onProgress(65);
    await image.toFile(targetPath);
    await delay(1200);
    await onProgress(90);

    const outputMeta = await sharp(targetPath).metadata();
    const outputStats = await stat(targetPath);

    await delay(500);
    await onProgress(100);

    return {
      storagePath: join('processed', outputName),
      mimeType: 'image/jpeg',
      sizeBytes: outputStats.size,
      width: outputMeta.width,
      height: outputMeta.height,
    };
  }
}
