-- CreateTable
CREATE TABLE "P7PrepResult" (
    "id" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "prepNumber" INTEGER NOT NULL,
    "term" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "enrollment" INTEGER NOT NULL DEFAULT 0,
    "divisionI" INTEGER NOT NULL DEFAULT 0,
    "divisionII" INTEGER NOT NULL DEFAULT 0,
    "divisionIII" INTEGER NOT NULL DEFAULT 0,
    "divisionIV" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "P7PrepResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "P7PrepResult_school_idx" ON "P7PrepResult"("school");

-- CreateIndex
CREATE INDEX "P7PrepResult_year_term_idx" ON "P7PrepResult"("year", "term");

-- CreateIndex
CREATE INDEX "P7PrepResult_prepNumber_idx" ON "P7PrepResult"("prepNumber");

-- CreateIndex
CREATE INDEX "P7PrepResult_school_year_term_idx" ON "P7PrepResult"("school", "year", "term");

-- CreateIndex
CREATE UNIQUE INDEX "P7PrepResult_school_prepNumber_term_year_key" ON "P7PrepResult"("school", "prepNumber", "term", "year");
