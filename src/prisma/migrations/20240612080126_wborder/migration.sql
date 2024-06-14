-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "WbOrder" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "qrCode" TEXT,
    "orderCode" TEXT,
    "wbPhone" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WbOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WbOrder_qrCode_key" ON "WbOrder"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "WbOrder_orderCode_key" ON "WbOrder"("orderCode");

-- CreateIndex
CREATE INDEX "WbOrder_qrCode_orderCode_wbPhone_idx" ON "WbOrder"("qrCode", "orderCode", "wbPhone");
