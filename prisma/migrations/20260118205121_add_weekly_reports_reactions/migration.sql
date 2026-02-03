-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('THUMBS_UP', 'THUMBS_DOWN', 'COMMENT');

-- CreateTable
CREATE TABLE "WeeklyReport" (
    "id" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "feesCollectionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "schoolsExpenditurePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "infrastructurePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEnrollment" INTEGER NOT NULL DEFAULT 0,
    "theologyEnrollment" INTEGER NOT NULL DEFAULT 0,
    "p7PrepExamsPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "comment" TEXT,
    "sectionId" TEXT NOT NULL,
    "weeklyReportId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeeklyReport_year_weekNumber_idx" ON "WeeklyReport"("year", "weekNumber");

-- CreateIndex
CREATE INDEX "WeeklyReport_publishedAt_idx" ON "WeeklyReport"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReport_weekNumber_year_key" ON "WeeklyReport"("weekNumber", "year");

-- CreateIndex
CREATE INDEX "Reaction_weeklyReportId_idx" ON "Reaction"("weeklyReportId");

-- CreateIndex
CREATE INDEX "Reaction_sectionId_idx" ON "Reaction"("sectionId");

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_weeklyReportId_fkey" FOREIGN KEY ("weeklyReportId") REFERENCES "WeeklyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
