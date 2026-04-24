import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JobStatus } from '@prisma/client';

import { BillingService } from '../billing/billing.service.js';
import { PhotosService } from '../photos/photos.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProcessingService } from '../processing/processing.service.js';
import { STORAGE_PROVIDER } from '../storage/storage.tokens.js';
import type { StorageProvider } from '../storage/storage.types.js';

@Injectable()
export class JobsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(BillingService) private readonly billingService: BillingService,
    @Inject(PhotosService) private readonly photosService: PhotosService,
    @Inject(ProcessingService) private readonly processingService: ProcessingService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async createJob(userId: string, photoId: string) {
    const photo = await this.photosService.findOwnedPhoto(photoId, userId);
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    const job = await this.prisma.$transaction(async (tx) => {
      await this.billingService.consumeTokens(userId, undefined, tx);

      return tx.job.create({
        data: {
          userId,
          photoId,
        },
        include: {
          photo: true,
          processedAsset: true,
        },
      });
    });

    void this.processingService.processJob(job.id);

    return this.toResponse(job);
  }

  async listJobs(userId: string) {
    const jobs = await this.prisma.job.findMany({
      where: { userId },
      include: {
        photo: true,
        processedAsset: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return jobs.map((job) => this.toResponse(job));
  }

  async getJob(userId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        userId,
      },
      include: {
        photo: true,
        processedAsset: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.toResponse(job);
  }

  async getJobDownload(userId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        userId,
      },
      include: {
        processedAsset: true,
      },
    });

    if (!job?.processedAsset) {
      throw new NotFoundException('Processed image not available');
    }

    return {
      url: await this.storage.getDownloadUrl(job.processedAsset.storagePath, `${jobId}.png`),
    };
  }

  toResponse(job: {
    id: string;
    status: JobStatus;
    progress: number;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
    photo: {
      id: string;
      originalName: string;
      storagePath: string;
      mimeType: string;
      sizeBytes: number;
      width: number | null;
      height: number | null;
      createdAt: Date;
    };
    processedAsset: {
      storagePath: string;
      mimeType: string;
      sizeBytes: number;
      width: number | null;
      height: number | null;
      createdAt: Date;
    } | null;
  }) {
    return {
      id: job.id,
      status: job.status,
      progress: job.progress,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      completedAt: job.completedAt,
      photo: this.photosService.toResponse(job.photo),
      processedAsset: job.processedAsset
        ? {
            mimeType: job.processedAsset.mimeType,
            sizeBytes: job.processedAsset.sizeBytes,
            width: job.processedAsset.width,
            height: job.processedAsset.height,
            createdAt: job.processedAsset.createdAt,
            processedUrl: this.storage.getPublicUrl(job.processedAsset.storagePath),
            downloadUrl: `/api/jobs/${job.id}/download`,
          }
        : null,
    };
  }
}
