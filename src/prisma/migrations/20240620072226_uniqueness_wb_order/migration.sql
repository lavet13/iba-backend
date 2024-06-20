/*
  Warnings:

  - A unique constraint covering the columns `[updatedAt]` on the table `WbOrder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[createdAt,id]` on the table `WbOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "WbOrder_orderCode_key";

-- DropIndex
DROP INDEX "WbOrder_qrCode_orderCode_wbPhone_idx";

-- CreateIndex
CREATE UNIQUE INDEX "WbOrder_updatedAt_key" ON "WbOrder"("updatedAt");

-- CreateIndex
CREATE INDEX "WbOrder_qrCode_wbPhone_idx" ON "WbOrder"("qrCode", "wbPhone");

-- CreateIndex
CREATE UNIQUE INDEX "WbOrder_createdAt_id_key" ON "WbOrder"("createdAt", "id");
