/*
  Warnings:

  - You are about to drop the column `kg1` on the `TheologyEnrollment` table. All the data in the column will be lost.
  - You are about to drop the column `kg2` on the `TheologyEnrollment` table. All the data in the column will be lost.
  - You are about to drop the column `kg3` on the `TheologyEnrollment` table. All the data in the column will be lost.
  - You are about to drop the column `p1` on the `TheologyEnrollment` table. All the data in the column will be lost.
  - You are about to drop the column `p2` on the `TheologyEnrollment` table. All the data in the column will be lost.
  - You are about to drop the column `p3` on the `TheologyEnrollment` table. All the data in the column will be lost.
  - You are about to drop the column `p4` on the `TheologyEnrollment` table. All the data in the column will be lost.
  - You are about to drop the column `p5` on the `TheologyEnrollment` table. All the data in the column will be lost.
  - You are about to drop the column `p6` on the `TheologyEnrollment` table. All the data in the column will be lost.
  - You are about to drop the column `p7` on the `TheologyEnrollment` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `TheologyEnrollment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[school,class,term,year]` on the table `TheologyEnrollment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `class` to the `TheologyEnrollment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "TheologyEnrollment_school_year_term_key";

-- AlterTable
ALTER TABLE "TheologyEnrollment" DROP COLUMN "kg1",
DROP COLUMN "kg2",
DROP COLUMN "kg3",
DROP COLUMN "p1",
DROP COLUMN "p2",
DROP COLUMN "p3",
DROP COLUMN "p4",
DROP COLUMN "p5",
DROP COLUMN "p6",
DROP COLUMN "p7",
DROP COLUMN "total",
ADD COLUMN     "class" TEXT NOT NULL,
ADD COLUMN     "count" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "TheologyEnrollment_school_year_term_idx" ON "TheologyEnrollment"("school", "year", "term");

-- CreateIndex
CREATE UNIQUE INDEX "TheologyEnrollment_school_class_term_year_key" ON "TheologyEnrollment"("school", "class", "term", "year");
