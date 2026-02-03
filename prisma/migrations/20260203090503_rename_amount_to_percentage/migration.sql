/*
  Warnings:

  - Column `amount` on `OtherIncome` renamed to `percentage` (preserving existing data)

*/
-- AlterTable
ALTER TABLE "OtherIncome" RENAME COLUMN "amount" TO "percentage";
