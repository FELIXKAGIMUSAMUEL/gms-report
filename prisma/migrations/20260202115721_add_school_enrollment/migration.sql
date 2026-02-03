/*
  Warnings:

  - You are about to drop the `Enrollment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Enrollment";

-- CreateTable
CREATE TABLE "HistoricalEnrollment" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL DEFAULT 1,
    "count" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HistoricalEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolEnrollment" (
    "id" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "term" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HistoricalEnrollment_year_idx" ON "HistoricalEnrollment"("year");

-- CreateIndex
CREATE UNIQUE INDEX "HistoricalEnrollment_year_month_key" ON "HistoricalEnrollment"("year", "month");

-- CreateIndex
CREATE INDEX "SchoolEnrollment_year_term_idx" ON "SchoolEnrollment"("year", "term");

-- CreateIndex
CREATE INDEX "SchoolEnrollment_school_idx" ON "SchoolEnrollment"("school");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolEnrollment_school_class_term_year_key" ON "SchoolEnrollment"("school", "class", "term", "year");
