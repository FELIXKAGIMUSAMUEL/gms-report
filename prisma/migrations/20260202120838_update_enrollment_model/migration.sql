/*
  Warnings:

  - You are about to drop the `HistoricalEnrollment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SchoolEnrollment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "HistoricalEnrollment";

-- DropTable
DROP TABLE "SchoolEnrollment";

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "term" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Enrollment_school_idx" ON "Enrollment"("school");

-- CreateIndex
CREATE INDEX "Enrollment_year_term_idx" ON "Enrollment"("year", "term");

-- CreateIndex
CREATE INDEX "Enrollment_school_year_term_idx" ON "Enrollment"("school", "year", "term");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_school_class_term_year_key" ON "Enrollment"("school", "class", "term", "year");
