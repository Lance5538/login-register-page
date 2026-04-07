-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InboundStatus" AS ENUM ('DRAFT', 'PENDING_RECEIPT', 'RECEIVED');

-- CreateEnum
CREATE TYPE "OutboundStatus" AS ENUM ('DRAFT', 'PENDING_SHIPMENT', 'SHIPPED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "appointedAt" TIMESTAMP(3),
ADD COLUMN     "appointedBy" TEXT,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "name" TEXT,
ADD COLUMN     "permissionsUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "InboundOrder" (
    "id" TEXT NOT NULL,
    "inboundNo" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "referenceNo" TEXT,
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "status" "InboundStatus" NOT NULL DEFAULT 'DRAFT',
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approvalReason" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "approvalUpdatedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "InboundOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboundLineItem" (
    "id" TEXT NOT NULL,
    "inboundOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "InboundLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboundOrder" (
    "id" TEXT NOT NULL,
    "outboundNo" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "carrier" TEXT,
    "shipmentDate" TIMESTAMP(3) NOT NULL,
    "status" "OutboundStatus" NOT NULL DEFAULT 'DRAFT',
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approvalReason" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "approvalUpdatedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "OutboundOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboundLineItem" (
    "id" TEXT NOT NULL,
    "outboundOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "OutboundLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InboundOrder_inboundNo_key" ON "InboundOrder"("inboundNo");

-- CreateIndex
CREATE INDEX "InboundOrder_warehouseId_idx" ON "InboundOrder"("warehouseId");

-- CreateIndex
CREATE INDEX "InboundOrder_createdById_idx" ON "InboundOrder"("createdById");

-- CreateIndex
CREATE INDEX "InboundOrder_approvalStatus_idx" ON "InboundOrder"("approvalStatus");

-- CreateIndex
CREATE INDEX "InboundOrder_status_idx" ON "InboundOrder"("status");

-- CreateIndex
CREATE INDEX "InboundLineItem_inboundOrderId_idx" ON "InboundLineItem"("inboundOrderId");

-- CreateIndex
CREATE INDEX "InboundLineItem_productId_idx" ON "InboundLineItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "OutboundOrder_outboundNo_key" ON "OutboundOrder"("outboundNo");

-- CreateIndex
CREATE INDEX "OutboundOrder_warehouseId_idx" ON "OutboundOrder"("warehouseId");

-- CreateIndex
CREATE INDEX "OutboundOrder_createdById_idx" ON "OutboundOrder"("createdById");

-- CreateIndex
CREATE INDEX "OutboundOrder_approvalStatus_idx" ON "OutboundOrder"("approvalStatus");

-- CreateIndex
CREATE INDEX "OutboundOrder_status_idx" ON "OutboundOrder"("status");

-- CreateIndex
CREATE INDEX "OutboundLineItem_outboundOrderId_idx" ON "OutboundLineItem"("outboundOrderId");

-- CreateIndex
CREATE INDEX "OutboundLineItem_productId_idx" ON "OutboundLineItem"("productId");

-- AddForeignKey
ALTER TABLE "InboundOrder" ADD CONSTRAINT "InboundOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundOrder" ADD CONSTRAINT "InboundOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundOrder" ADD CONSTRAINT "InboundOrder_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundLineItem" ADD CONSTRAINT "InboundLineItem_inboundOrderId_fkey" FOREIGN KEY ("inboundOrderId") REFERENCES "InboundOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundLineItem" ADD CONSTRAINT "InboundLineItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundOrder" ADD CONSTRAINT "OutboundOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundOrder" ADD CONSTRAINT "OutboundOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundOrder" ADD CONSTRAINT "OutboundOrder_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundLineItem" ADD CONSTRAINT "OutboundLineItem_outboundOrderId_fkey" FOREIGN KEY ("outboundOrderId") REFERENCES "OutboundOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundLineItem" ADD CONSTRAINT "OutboundLineItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
