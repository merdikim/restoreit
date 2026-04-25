import { Module } from '@nestjs/common';

import { ArweaveService } from './arweave.service.js';

@Module({
  providers: [ArweaveService],
  exports: [ArweaveService],
})
export class ArweaveModule {}
