/*
  Warnings:

  - You are about to drop the `TermStartConfig` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "TermStartConfig";

-- CreateTable
CREATE TABLE "TermSetting" (
    "id" TEXT NOT NULL,
    "term" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "weeksCount" INTEGER NOT NULL DEFAULT 13,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TermSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TheologyEnrollment" (
    "id" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "term" INTEGER NOT NULL,
    "kg1" INTEGER NOT NULL DEFAULT 0,
    "kg2" INTEGER NOT NULL DEFAULT 0,
    "kg3" INTEGER NOT NULL DEFAULT 0,
    "p1" INTEGER NOT NULL DEFAULT 0,
    "p2" INTEGER NOT NULL DEFAULT 0,
    "p3" INTEGER NOT NULL DEFAULT 0,
    "p4" INTEGER NOT NULL DEFAULT 0,
    "p5" INTEGER NOT NULL DEFAULT 0,
    "p6" INTEGER NOT NULL DEFAULT 0,
    "p7" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TheologyEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TermSetting_year_term_idx" ON "TermSetting"("year", "term");

-- CreateIndex
CREATE INDEX "TermSetting_startDate_idx" ON "TermSetting"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "TermSetting_term_year_key" ON "TermSetting"("term", "year");

-- CreateIndex
CREATE INDEX "TheologyEnrollment_year_term_idx" ON "TheologyEnrollment"("year", "term");

-- CreateIndex
CREATE INDEX "TheologyEnrollment_school_idx" ON "TheologyEnrollment"("school");

-- CreateIndex
CREATE UNIQUE INDEX "TheologyEnrollment_school_year_term_key" ON "TheologyEnrollment"("school", "year", "term");
