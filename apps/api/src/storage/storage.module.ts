import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { STORAGE_PROVIDER } from './storage.tokens.js';
import { R2StorageService } from './r2-storage.service.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    R2StorageService,
    {
      provide: STORAGE_PROVIDER,
      useExisting: R2StorageService,
    },
  ],
  exports: [STORAGE_PROVIDER, R2StorageService],
})
export class StorageModule {}
