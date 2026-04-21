import { Module } from '@nestjs/common';

import { PhotosModule } from '../photos/photos.module.js';
import { ProcessingModule } from '../processing/processing.module.js';
import { JobsController } from './jobs.controller.js';
import { JobsService } from './jobs.service.js';

@Module({
  imports: [PhotosModule, /*ProcessingModule*/],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
