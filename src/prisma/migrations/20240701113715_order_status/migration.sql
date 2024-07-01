/*
  Warnings:

  - The values [ASSEMBLED,NOT_ASSEMBLED,REJECTED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('1', '2', '3');
ALTER TABLE "WbOrder" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "WbOrder" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "WbOrder" ALTER COLUMN "status" SET DEFAULT '1';
COMMIT;

-- AlterTable
ALTER TABLE "WbOrder" ALTER COLUMN "status" SET DEFAULT '1';
