import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'node:path';
import { appRoot } from './common/app-paths.js';
import { HealthModule } from './health/health.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { PhotosModule } from './photos/photos.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProcessingModule } from './processing/processing.module.js';
import { StorageModule } from './storage/storage.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(appRoot, '.env'),
    }),
    PrismaModule,
    StorageModule,
    PhotosModule,
    JobsModule,
    //ProcessingModule,
    //HealthModule,
  ],
})
export class AppModule {}
