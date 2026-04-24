export const BILLING_PROVIDERS = ['stripe', 'crypto'] as const;
export type BillingProvider = (typeof BILLING_PROVIDERS)[number];

export const TOKEN_PACKAGES = [
  {
    id: 'tokens_5',
    name: '20 tokens',
    description: '20 restoration tokens',
    amountUsdCents: 500,
    tokenAmount: 20,
  },
  {
    id: 'tokens_10',
    name: '40 tokens',
    description: '40 restoration tokens',
    amountUsdCents: 1000,
    tokenAmount: 40,
  },
  {
    id: 'tokens_20',
    name: '100 tokens',
    description: '100 restoration tokens',
    amountUsdCents: 2000,
    tokenAmount: 100,
  },
] as const;

export const DEFAULT_JOB_TOKEN_COST = 1;

export function getTokenPackage(packageId: string) {
  return TOKEN_PACKAGES.find((entry) => entry.id === packageId);
}
