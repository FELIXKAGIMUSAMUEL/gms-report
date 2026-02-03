/*
  Warnings:

  - A unique constraint covering the columns `[weekNumber,year,term]` on the table `WeeklyReport` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[week,year,term,school]` on the table `WeeklyScorecard` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "OtherIncome_year_key";

-- DropIndex
DROP INDEX "WeeklyReport_weekNumber_year_key";

-- DropIndex
DROP INDEX "WeeklyReport_year_weekNumber_idx";

-- DropIndex
DROP INDEX "WeeklyScorecard_week_year_idx";

-- DropIndex
DROP INDEX "WeeklyScorecard_week_year_school_key";

-- AlterTable
ALTER TABLE "WeeklyReport" ADD COLUMN     "term" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "WeeklyScorecard" ADD COLUMN     "term" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "IncomeSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "isDeferred" BOOLEAN NOT NULL DEFAULT false,
    "deferredUntil" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IncomeSource_name_key" ON "IncomeSource"("name");

-- CreateIndex
CREATE INDEX "IncomeSource_name_idx" ON "IncomeSource"("name");

-- CreateIndex
CREATE INDEX "Todo_userId_idx" ON "Todo"("userId");

-- CreateIndex
CREATE INDEX "Todo_isCompleted_idx" ON "Todo"("isCompleted");

-- CreateIndex
CREATE INDEX "Todo_dueDate_idx" ON "Todo"("dueDate");

-- CreateIndex
CREATE INDEX "Todo_isDeferred_idx" ON "Todo"("isDeferred");

-- CreateIndex
CREATE INDEX "WeeklyReport_year_term_weekNumber_idx" ON "WeeklyReport"("year", "term", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReport_weekNumber_year_term_key" ON "WeeklyReport"("weekNumber", "year", "term");

-- CreateIndex
CREATE INDEX "WeeklyScorecard_year_term_week_idx" ON "WeeklyScorecard"("year", "term", "week");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyScorecard_week_year_term_school_key" ON "WeeklyScorecard"("week", "year", "term", "school");

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
