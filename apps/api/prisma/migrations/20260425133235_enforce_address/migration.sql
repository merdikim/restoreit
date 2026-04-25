/*
  Warnings:

  - Made the column `ownerAddress` on table `ArweaveUpload` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ArweaveUpload" ALTER COLUMN "ownerAddress" SET NOT NULL;
