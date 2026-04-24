import { IsIn, IsString } from 'class-validator';

import { BILLING_PROVIDERS, TOKEN_PACKAGES } from '../billing.constants.js';

const packageIds = TOKEN_PACKAGES.map((entry) => entry.id);

export class CreateCheckoutSessionDto {
  @IsString()
  @IsIn(packageIds)
  packageId!: string;

  @IsString()
  @IsIn(BILLING_PROVIDERS)
  provider!: (typeof BILLING_PROVIDERS)[number];
}
