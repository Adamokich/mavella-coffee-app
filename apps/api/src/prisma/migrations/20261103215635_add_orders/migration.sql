/*
  Warnings:

  - You are about to drop the column `priceDelta` on the `ModifierOption` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[idompotencyKey]` on the table `OrderItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idompotencyKey` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ModifierOption" DROP COLUMN "priceDelta",
ADD COLUMN     "priceDeltaRub" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "idompotencyKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_idompotencyKey_key" ON "OrderItem"("idompotencyKey");
