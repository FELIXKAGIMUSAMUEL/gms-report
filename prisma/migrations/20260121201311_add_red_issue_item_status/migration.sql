-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- AlterTable
ALTER TABLE "GMProject" ADD COLUMN     "status" "ItemStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "RedIssue" ADD COLUMN     "itemStatus" "ItemStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "UpcomingEvent" ADD COLUMN     "status" "ItemStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "GMProject_status_idx" ON "GMProject"("status");

-- CreateIndex
CREATE INDEX "RedIssue_itemStatus_idx" ON "RedIssue"("itemStatus");

-- CreateIndex
CREATE INDEX "UpcomingEvent_status_idx" ON "UpcomingEvent"("status");
