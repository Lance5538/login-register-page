-- AlterEnum
ALTER TYPE "DomainEventStatus" ADD VALUE 'DEAD';

-- AlterTable
ALTER TABLE "DomainEvent" ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "maxRetries" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "nextRetryAt" TIMESTAMP(3);
