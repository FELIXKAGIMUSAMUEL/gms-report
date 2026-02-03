-- Transform OtherIncome from fixed columns to dynamic records

-- Step 0: Drop the unique constraint on year first
ALTER TABLE "OtherIncome" DROP CONSTRAINT IF EXISTS "OtherIncome_year_key";

-- Step 1: Add new columns first (nullable)
ALTER TABLE "OtherIncome" ADD COLUMN "source" TEXT;
ALTER TABLE "OtherIncome" ADD COLUMN "amount" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "OtherIncome" ADD COLUMN "month" INTEGER DEFAULT 1;

-- Step 2: Migrate existing data by creating new records for each source
-- For each year, create separate records for each income source
INSERT INTO "OtherIncome" ("id", "source", "amount", "year", "month", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'Swimming',
  "swimming",
  "year",
  1,
  "createdAt",
  "updatedAt"
FROM "OtherIncome"
WHERE "swimming" > 0;

INSERT INTO "OtherIncome" ("id", "source", "amount", "year", "month", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'Uniforms',
  "uniforms",
  "year",
  1,
  "createdAt",
  "updatedAt"
FROM "OtherIncome"
WHERE "uniforms" > 0;

INSERT INTO "OtherIncome" ("id", "source", "amount", "year", "month", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'Canteen',
  "canteen",
  "year",
  1,
  "createdAt",
  "updatedAt"
FROM "OtherIncome"
WHERE "canteen" > 0;

INSERT INTO "OtherIncome" ("id", "source", "amount", "year", "month", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'Saving Scheme',
  "savingScheme",
  "year",
  1,
  "createdAt",
  "updatedAt"
FROM "OtherIncome"
WHERE "savingScheme" > 0;

-- Step 3: Delete old records (rows without source set)
DELETE FROM "OtherIncome" WHERE "source" IS NULL;

-- Step 4: Drop old columns
ALTER TABLE "OtherIncome" DROP COLUMN "swimming";
ALTER TABLE "OtherIncome" DROP COLUMN "uniforms";
ALTER TABLE "OtherIncome" DROP COLUMN "canteen";
ALTER TABLE "OtherIncome" DROP COLUMN "savingScheme";

-- Step 5: Make source required
ALTER TABLE "OtherIncome" ALTER COLUMN "source" SET NOT NULL;
ALTER TABLE "OtherIncome" ALTER COLUMN "amount" SET NOT NULL;
ALTER TABLE "OtherIncome" ALTER COLUMN "month" SET NOT NULL;

-- Step 6: Drop old unique constraint and update indexes
ALTER TABLE "OtherIncome" DROP CONSTRAINT IF EXISTS "OtherIncome_year_key";

-- Create new indexes for the dynamic structure
CREATE INDEX IF NOT EXISTS "OtherIncome_year_month_idx" ON "OtherIncome"("year", "month");
CREATE INDEX IF NOT EXISTS "OtherIncome_source_idx" ON "OtherIncome"("source");
DROP INDEX IF EXISTS "OtherIncome_year_idx";
