-- Preserve existing published offerings; new submissions require approval.
ALTER TABLE "services" ADD COLUMN "isApproved" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "services" ALTER COLUMN "isApproved" SET DEFAULT false;
ALTER TABLE "services" ADD COLUMN "isCancelled" BOOLEAN NOT NULL DEFAULT false;
