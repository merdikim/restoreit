import { IsOptional, IsString, Matches } from 'class-validator';

export class ConfirmCheckoutSessionDto {
  @IsOptional()
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{64}$/, {
    message: 'transactionHash must be a valid 0x-prefixed 32-byte hash.',
  })
  transactionHash?: string;
}
