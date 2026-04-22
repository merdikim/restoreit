import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { OpenAIProcessingProvider } from './providers/openai-processing.provider.js';
import { ProcessingService } from './processing.service.js';
import { PROCESSING_PROVIDER } from './processing.tokens.js';

@Module({
  imports: [ConfigModule],
  providers: [
    OpenAIProcessingProvider,
    {
      provide: PROCESSING_PROVIDER,
      useExisting: OpenAIProcessingProvider,
    },
    ProcessingService,
  ],
  exports: [ProcessingService, OpenAIProcessingProvider, PROCESSING_PROVIDER],
})
export class ProcessingModule {}
