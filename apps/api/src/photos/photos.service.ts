import { Inject, Injectable } from '@nestjs/common';
import sharp from 'sharp';

import { PrismaService } from '../prisma/prisma.service.js';
import { STORAGE_PROVIDER } from '../storage/storage.tokens.js';
import type { StorageProvider } from '../storage/storage.types.js';

@Injectable()
export class PhotosService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async createFromUpload(params: {
    userId: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    storagePath: string;
  }) {
    const metadata = await sharp(this.storage.getAbsolutePath(params.storagePath)).metadata();

    const photo = await this.prisma.photo.create({
      data: {
        userId: params.userId,
        originalName: params.originalName,
        mimeType: params.mimeType,
        sizeBytes: params.sizeBytes,
        storagePath: params.storagePath,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
      },
    });

    return this.toResponse(photo);
  }

  async findOwnedPhoto(photoId: string, userId: string) {
    return this.prisma.photo.findFirst({
      where: {
        id: photoId,
        userId,
      },
    });
  }

  toResponse(photo: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    width: number | null;
    height: number | null;
    storagePath: string;
    createdAt: Date;
  }) {
    return {
      id: photo.id,
      originalName: photo.originalName,
      mimeType: photo.mimeType,
      sizeBytes: photo.sizeBytes,
      width: photo.width,
      height: photo.height,
      originalUrl: this.storage.getPublicUrl(photo.storagePath),
      createdAt: photo.createdAt,
    };
  }
}
