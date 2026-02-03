-- AlterTable
ALTER TABLE "WeeklyReport" ADD COLUMN     "admissions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "syllabusCoveragePercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
