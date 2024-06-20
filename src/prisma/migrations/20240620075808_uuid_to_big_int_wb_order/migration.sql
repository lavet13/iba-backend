/*
  Warnings:

  - The primary key for the `WbOrder` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `WbOrder` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropIndex
DROP INDEX "WbOrder_createdAt_id_key";

-- DropIndex
DROP INDEX "WbOrder_updatedAt_key";

-- AlterTable
ALTER TABLE "WbOrder" DROP CONSTRAINT "WbOrder_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" BIGSERIAL NOT NULL,
ADD CONSTRAINT "WbOrder_pkey" PRIMARY KEY ("id");
