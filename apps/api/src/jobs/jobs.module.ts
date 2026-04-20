import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PhotosModule } from '../photos/photos.module.js';
import { ProcessingModule } from '../processing/processing.module.js';
import { JobsController } from './jobs.controller.js';
import { JobsService } from './jobs.service.js';

@Module({
  imports: [AuthModule, PhotosModule, ProcessingModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
