import { Module } from '@nestjs/common';

import { BillingModule } from '../billing/billing.module.js';
import { PhotosModule } from '../photos/photos.module.js';
import { ProcessingModule } from '../processing/processing.module.js';
import { JobsController } from './jobs.controller.js';
import { JobsService } from './jobs.service.js';

@Module({
  imports: [BillingModule, PhotosModule, ProcessingModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
