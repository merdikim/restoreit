export const BILLING_PROVIDERS = ['stripe', 'crypto'] as const;
export type BillingProvider = (typeof BILLING_PROVIDERS)[number];

export const TOKEN_PACKAGES = [
  {
    id: 'tokens_10',
    name: '10 tokens',
    description: '10 restoration tokens',
    amountUsdCents: 100,
    tokenAmount: 10,
  },
  {
    id: 'tokens_50',
    name: '50 tokens',
    description: '50 restoration tokens',
    amountUsdCents: 500,
    tokenAmount: 50,
  },
  {
    id: 'tokens_100',
    name: '100 tokens',
    description: '100 restoration tokens',
    amountUsdCents: 1000,
    tokenAmount: 100,
  },
] as const;

export const DEFAULT_JOB_TOKEN_COST = 1;

export function getTokenPackage(packageId: string) {
  return TOKEN_PACKAGES.find((entry) => entry.id === packageId);
}
