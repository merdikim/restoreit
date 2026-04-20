import { Injectable } from '@nestjs/common';

import type { ProcessingJobInput, ProcessingJobOutput, ProcessingProvider } from '../processing.types.js';

@Injectable()
export class FutureAiProcessingProvider implements ProcessingProvider {
  async process(
    _input: ProcessingJobInput,
    _onProgress: (progress: number) => Promise<void>,
  ): Promise<ProcessingJobOutput> {
    throw new Error('Future AI processing provider is not implemented yet');
  }
}
