/*
  Warnings:

  - A unique constraint covering the columns `[providerRefundId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUND_PENDING';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "providerRefundId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payments_providerRefundId_key" ON "payments"("providerRefundId");
