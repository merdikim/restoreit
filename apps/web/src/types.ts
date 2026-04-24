export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type User = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type TokenPackage = {
  id: string;
  name: string;
  description: string;
  amountUsdCents: number;
  tokenAmount: number;
};

export type BillingProvider = 'stripe' | 'crypto';

export type BillingSummary = {
  tokenBalance: number;
  jobTokenCost: number;
  packages: TokenPackage[];
  supportedProviders: BillingProvider[];
};

export type CheckoutSession = {
  sessionId: string;
  provider: BillingProvider;
  checkoutUrl: string | null;
  paymentAddress?: string;
  network?: string;
  chainId?: number;
  tokenAddress?: string | null;
  currencyCode?: string;
  amountDisplay?: string;
  packageName?: string;
};

export type CheckoutConfirmation = {
  status: string;
  tokenBalance: number;
  tokensAdded: number;
  provider: BillingProvider;
};

export type Photo = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  originalUrl: string;
  createdAt: string;
};

export type ProcessedAsset = {
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  processedUrl: string;
  downloadUrl: string;
};

export type Job = {
  id: string;
  status: JobStatus;
  progress: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  photo: Photo;
  processedAsset: ProcessedAsset | null;
};
