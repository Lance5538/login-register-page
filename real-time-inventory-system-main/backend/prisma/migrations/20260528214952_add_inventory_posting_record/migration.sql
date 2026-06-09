-- CreateTable
CREATE TABLE "InventoryPostingRecord" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "postingType" "InventoryPostingType" NOT NULL,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryPostingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryPostingRecord_eventId_key" ON "InventoryPostingRecord"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryPostingRecord_orderId_postingType_key" ON "InventoryPostingRecord"("orderId", "postingType");
