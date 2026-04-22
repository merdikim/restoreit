import { BadRequestException, Controller, Inject, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PhotosService } from './photos.service.js';

@ApiTags('photos')
@Controller('photos')
export class PhotosController {
  constructor(@Inject(PhotosService) private readonly photosService: PhotosService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 15 * 1024 * 1024, // 15 MB
      },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new BadRequestException('Only image uploads are supported'), false);
          return;
        }

        callback(null, true);
      },
    }),
  )
  async uploadPhoto(
    @CurrentUser() user: { id: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Missing upload file');
    }

    return this.photosService.createFromUpload({
      userId: user.id,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      filename: `${randomUUID()}${extname(file.originalname)}`,
      buffer: file.buffer,
    });
  }
}
