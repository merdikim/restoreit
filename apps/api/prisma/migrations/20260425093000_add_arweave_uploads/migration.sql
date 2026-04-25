-- CreateTable
CREATE TABLE "ArweaveUpload" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "dataItemId" TEXT,
    "ownerAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArweaveUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArweaveUpload_jobId_key" ON "ArweaveUpload"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "ArweaveUpload_transactionId_key" ON "ArweaveUpload"("transactionId");

-- AddForeignKey
ALTER TABLE "ArweaveUpload" ADD CONSTRAINT "ArweaveUpload_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
