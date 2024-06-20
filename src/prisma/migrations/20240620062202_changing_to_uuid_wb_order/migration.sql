/*
  Warnings:

  - The primary key for the `WbOrder` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "WbOrder" DROP CONSTRAINT "WbOrder_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "WbOrder_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "WbOrder_id_seq";
