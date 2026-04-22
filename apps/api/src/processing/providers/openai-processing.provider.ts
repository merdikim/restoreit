import OpenAI, { toFile } from 'openai';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';

import { STORAGE_PROVIDER } from '../../storage/storage.tokens.js';
import type { StorageProvider } from '../../storage/storage.types.js';
import type { ProcessingJobInput, ProcessingJobOutput, ProcessingProvider } from '../processing.types.js';

@Injectable()
export class OpenAIProcessingProvider implements ProcessingProvider {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async process(input: ProcessingJobInput, onProgress: (progress: number) => Promise<void>): Promise<ProcessingJobOutput> {
    await onProgress(10);

    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for OpenAI image processing.');
    }

    const model = this.configService.get<string>('OPENAI_IMAGE_MODEL', 'gpt-image-1.5');
    const sourcePath = this.storage.getAbsolutePath(input.photoPath);
    const normalizedBuffer = await sharp(sourcePath).rotate().png().toBuffer();
    const client = new OpenAI({ apiKey });

    await onProgress(30);

    const imageFile = await toFile(normalizedBuffer, `${input.jobId}.png`, { type: 'image/png' });
    const response = await client.images.edit({
      model: "gpt-image-1.5",
      image: imageFile,
      prompt: [
        'Restore and enhance this old photograph.',
        'Preserve the original composition, identity, and overall scene.',
        'Repair damage, improve clarity, clean up scratches or fading, and produce a natural-looking restored image.',
        'Return one final restored image.',
      ].join(' '),
      input_fidelity: 'high',
      quality: 'high',
      size: 'auto',
      output_format: 'png',
    });

    await onProgress(70);

    const generatedImage = response.data?.[0]?.b64_json;
    if (!generatedImage) {
      throw new Error('OpenAI image generation returned no image data.');
    }

    const outputName = `${basename(input.originalName, extname(input.originalName))}-${input.jobId}.png`;
    const storagePath = join('processed', outputName);
    const targetPath = this.storage.getAbsolutePath(storagePath);

    await mkdir(this.storage.getAbsolutePath('processed'), { recursive: true });
    await writeFile(targetPath, Buffer.from(generatedImage, 'base64'));
    await onProgress(90);

    const outputMeta = await sharp(targetPath).metadata();
    const outputStats = await stat(targetPath);

    await onProgress(100);

    return {
      storagePath,
      mimeType: 'image/png',
      sizeBytes: outputStats.size,
      width: outputMeta.width,
      height: outputMeta.height,
    };
  }
}
