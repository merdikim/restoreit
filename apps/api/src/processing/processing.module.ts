import { Module } from '@nestjs/common';

import { FutureAiProcessingProvider } from './providers/future-ai-processing.provider.js';
import { MOCK_PROCESSING_PROVIDER, PROCESSING_PROVIDER } from './processing.tokens.js';
import { MockProcessingProvider } from './providers/mock-processing.provider.js';
import { ProcessingService } from './processing.service.js';

@Module({
  providers: [
    MockProcessingProvider,
    FutureAiProcessingProvider,
    {
      provide: MOCK_PROCESSING_PROVIDER,
      useExisting: MockProcessingProvider,
    },
    {
      provide: PROCESSING_PROVIDER,
      useExisting: MockProcessingProvider,
    },
    ProcessingService,
  ],
  exports: [ProcessingService, PROCESSING_PROVIDER, MOCK_PROCESSING_PROVIDER],
})
export class ProcessingModule {}
