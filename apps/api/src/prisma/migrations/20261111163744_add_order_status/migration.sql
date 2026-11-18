-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PREPARING';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "completedAt" TIMESTAMP(3);
