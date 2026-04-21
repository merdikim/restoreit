import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { STORAGE_PROVIDER } from './storage.tokens.js';
import { LocalStorageService } from './local-storage.service.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    LocalStorageService,
    {
      provide: STORAGE_PROVIDER,
      useExisting: LocalStorageService,
    },
  ],
  exports: [STORAGE_PROVIDER, LocalStorageService],
})
export class StorageModule {}
