/*
  Warnings:

  - You are about to drop the column `idompotencyKey` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `modifierId` on the `OrderItemOption` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[idompotencyKey]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idompotencyKey` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "OrderItem_idompotencyKey_key";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "idompotencyKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "idompotencyKey";

-- AlterTable
ALTER TABLE "OrderItemOption" DROP COLUMN "modifierId";

-- CreateIndex
CREATE UNIQUE INDEX "Order_idompotencyKey_key" ON "Order"("idompotencyKey");
