CREATE TYPE "TokenPurchaseStatus" AS ENUM ('pending', 'completed');
CREATE TYPE "PaymentProvider" AS ENUM ('stripe', 'crypto');

CREATE TABLE "BillingAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenBalance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingPaymentProfile" (
    "id" TEXT NOT NULL,
    "billingAccountId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerCustomerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingPaymentProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TokenPurchase" (
    "id" TEXT NOT NULL,
    "billingAccountId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerSessionId" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "packageId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "tokenAmount" INTEGER NOT NULL,
    "status" "TokenPurchaseStatus" NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TokenPurchase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingAccount_userId_key" ON "BillingAccount"("userId");
CREATE UNIQUE INDEX "BillingPaymentProfile_provider_providerCustomerId_key" ON "BillingPaymentProfile"("provider", "providerCustomerId");
CREATE UNIQUE INDEX "BillingPaymentProfile_billingAccountId_provider_key" ON "BillingPaymentProfile"("billingAccountId", "provider");
CREATE UNIQUE INDEX "TokenPurchase_providerSessionId_key" ON "TokenPurchase"("providerSessionId");

ALTER TABLE "BillingPaymentProfile" ADD CONSTRAINT "BillingPaymentProfile_billingAccountId_fkey" FOREIGN KEY ("billingAccountId") REFERENCES "BillingAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TokenPurchase" ADD CONSTRAINT "TokenPurchase_billingAccountId_fkey" FOREIGN KEY ("billingAccountId") REFERENCES "BillingAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
