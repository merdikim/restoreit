import { Inject, Injectable, Logger } from '@nestjs/common';
import { JobStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { PROCESSING_PROVIDER } from './processing.tokens.js';
import type { ProcessingProvider } from './processing.types.js';

@Injectable()
export class ProcessingService {
  private readonly logger = new Logger(ProcessingService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PROCESSING_PROVIDER) private readonly provider: ProcessingProvider,
  ) {}

  async processJob(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        photo: true,
      },
    });

    if (!job) {
      return;
    }

    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.processing,
        progress: 5,
        errorMessage: null,
      },
    });

    try {
      const result = await this.provider.process(
        {
          jobId,
          photoPath: job.photo.storagePath,
          originalName: job.photo.originalName,
        },
        async (progress) => {
          await this.prisma.job.update({
            where: { id: jobId },
            data: {
              progress,
            },
          });
        },
      );

      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.completed,
          progress: 100,
          completedAt: new Date(),
          processedAsset: {
            upsert: {
              create: {
                storagePath: result.storagePath,
                mimeType: result.mimeType,
                sizeBytes: result.sizeBytes,
                width: result.width ?? null,
                height: result.height ?? null,
              },
              update: {
                storagePath: result.storagePath,
                mimeType: result.mimeType,
                sizeBytes: result.sizeBytes,
                width: result.width ?? null,
                height: result.height ?? null,
              },
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to process job ${jobId}`, error instanceof Error ? error.stack : undefined);

      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.failed,
          errorMessage: error instanceof Error ? error.message : 'Unknown processing error',
        },
      });
    }
  }
}
