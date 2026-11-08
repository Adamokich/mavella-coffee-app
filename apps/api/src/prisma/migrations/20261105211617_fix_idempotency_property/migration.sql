/*
  Warnings:

  - You are about to drop the column `idompotencyKey` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idempotencyKey` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Order_idompotencyKey_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "idompotencyKey",
ADD COLUMN     "idempotencyKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
