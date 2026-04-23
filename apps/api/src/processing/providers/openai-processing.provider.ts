import OpenAI, { toFile } from 'openai';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { basename, extname } from 'node:path';
import { join } from 'node:path/posix';
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
    const sourceBuffer = await this.storage.getObjectBuffer(input.photoPath);
    const normalizedBuffer = await sharp(sourceBuffer).rotate().png().toBuffer();
    const client = new OpenAI({ apiKey });

    await onProgress(30);

    const imageFile = await toFile(normalizedBuffer, `${input.jobId}.png`, { type: 'image/png' });
    const response = await client.images.edit({
      model: "gpt-image-1.5",
      image: imageFile,
      prompt: [
  "Restore and enhance this image with high fidelity while preserving authenticity.",

  "Step 1: Analyze the image and determine its condition:",
  "- Whether it is a scanned photo or a photo of a printed image",
  "- Presence of tilt, perspective distortion, or misalignment",
  "- Presence of background outside the actual photo (e.g., table, fabric, edges)",
  "- Level of blur, noise, fading, or color cast",
  "- Any obstructions or missing/damaged areas",

  "Step 2: Normalize the image if needed:",
  "- If the image is a photo of a printed photo, isolate and extract only the original photograph",
  "- Remove surrounding background elements (table, cloth, borders, edges)",
  "- Correct perspective distortion and straighten the image",
  "- Crop and align the image to a natural, properly framed composition",

  "Step 3: Restore while preserving identity:",
  "- Preserve all faces, facial features, expressions, body proportions, and pose exactly",
  "- Do not alter identity, do not reinterpret subjects, do not generate new features",

  "Step 4: Repair and enhance:",
  "- Fix scratches, dust, stains, tears, blur, and noise",
  "- Improve clarity and sharpness, especially on key subjects",
  "- Maintain natural skin texture and realistic detail",
  "- Avoid over-sharpening or artificial detail generation",

  "Step 5: Color and lighting correction:",
  "- Remove color casts (yellow, green, blue) and restore natural tones",
  "- Correct exposure, contrast, and white balance evenly",
  "- If the image is black and white, keep it black and white unless colorization is explicitly required",

  "Step 6: Handle difficult cases:",
  "- If parts are obstructed or missing, reconstruct them realistically based on surrounding context",
  "- Keep reconstruction subtle and historically plausible",

  "Step 7: Preserve realism:",
  "- Avoid stylization, filters, or modern AI-generated look",
  "- Avoid plastic skin, over-smoothing, or unrealistic lighting",
  "- Ensure the result looks like a clean, naturally preserved version of the original image",

  "Return one final restored image only."
].join(' '),
      input_fidelity: 'high',
      quality: 'medium',
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
    const outputBuffer = Buffer.from(generatedImage, 'base64');

    await this.storage.putObject(storagePath, outputBuffer, {
      contentType: 'image/png',
    });
    await onProgress(90);

    const outputMeta = await sharp(outputBuffer).metadata();

    await onProgress(100);

    return {
      storagePath,
      mimeType: 'image/png',
      sizeBytes: outputBuffer.byteLength,
      width: outputMeta.width,
      height: outputMeta.height,
    };
  }
}
