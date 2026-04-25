import { HexSolanaSigner, TurboFactory, type TurboAuthenticatedClient } from '@ardrive/turbo-sdk';
import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';

@Injectable()
export class ArweaveService {
  private turboClient: TurboAuthenticatedClient | null = null;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}

  async uploadFile(params: {
    buffer: Buffer;
    contentType: string;
    jobId: string;
  }) {
    const turbo = await this.getClient();
    const response = await turbo.uploadFile({
      fileStreamFactory: () => Readable.from(params.buffer),
      fileSizeFactory: () => params.buffer.byteLength,
      dataItemOpts: {
        tags: [
          { name: 'Content-Type', value: params.contentType },
          { name: 'App-Name', value: 'RestoreIt' },
          { name: 'App-Version', value: '0.1.0' },
          { name: 'RestoreIt-Job-Id', value: params.jobId },
        ],
      },
    });

    return {
      transactionId: response.id,
      ownerAddress: response.owner
    };
  }

  private async getClient() {
    if (!this.turboClient) {
      const privateKey = this.configService.get<string>('ARWEAVE_DEPLOY_WALLET');

      if (!privateKey) {
        throw new ServiceUnavailableException(
          'Arweave publishing is not configured. Set ARWEAVE_DEPLOY_WALLET on the API.',
        );
      }

      this.turboClient = TurboFactory.authenticated({
        privateKey,
        token: 'solana'
      });
    }

    return this.turboClient;
  }
}
