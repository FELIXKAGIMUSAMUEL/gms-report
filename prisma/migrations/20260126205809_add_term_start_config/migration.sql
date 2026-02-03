-- CreateTable
CREATE TABLE "TermStartConfig" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "term" INTEGER NOT NULL,
    "week1Start" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TermStartConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TermStartConfig_year_term_idx" ON "TermStartConfig"("year", "term");

-- CreateIndex
CREATE UNIQUE INDEX "TermStartConfig_year_term_key" ON "TermStartConfig"("year", "term");
