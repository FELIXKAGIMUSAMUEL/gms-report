-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('GM', 'TRUSTEE');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'GM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KPIData" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "feesCollectionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "schoolsExpenditurePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "infrastructurePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEnrollment" INTEGER NOT NULL DEFAULT 0,
    "theologyEnrollment" INTEGER NOT NULL DEFAULT 0,
    "p7PrepExamsPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KPIData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL DEFAULT 1,
    "count" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtherIncome" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "uniforms" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "swimming" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "canteen" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "savingScheme" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtherIncome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "P7PrepPerformance" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "prep1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prep2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prep3" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prep4" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prep5" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prep6" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prep7" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prep8" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prep9" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "P7PrepPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpcomingEvent" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "activity" TEXT NOT NULL,
    "inCharge" TEXT NOT NULL,
    "rate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpcomingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GMProject" (
    "id" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "projectManager" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GMProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyScorecard" (
    "id" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "school" TEXT NOT NULL,
    "academicPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "financePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualityPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tdpPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "theologyPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyScorecard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedIssue" (
    "id" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "inCharge" TEXT NOT NULL,
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RedIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "KPIData_year_month_idx" ON "KPIData"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "KPIData_month_year_key" ON "KPIData"("month", "year");

-- CreateIndex
CREATE INDEX "Enrollment_year_idx" ON "Enrollment"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_year_month_key" ON "Enrollment"("year", "month");

-- CreateIndex
CREATE INDEX "OtherIncome_year_idx" ON "OtherIncome"("year");

-- CreateIndex
CREATE UNIQUE INDEX "OtherIncome_year_key" ON "OtherIncome"("year");

-- CreateIndex
CREATE INDEX "P7PrepPerformance_year_idx" ON "P7PrepPerformance"("year");

-- CreateIndex
CREATE UNIQUE INDEX "P7PrepPerformance_year_key" ON "P7PrepPerformance"("year");

-- CreateIndex
CREATE INDEX "UpcomingEvent_date_idx" ON "UpcomingEvent"("date");

-- CreateIndex
CREATE INDEX "WeeklyScorecard_week_year_idx" ON "WeeklyScorecard"("week", "year");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyScorecard_week_year_school_key" ON "WeeklyScorecard"("week", "year", "school");

-- CreateIndex
CREATE INDEX "RedIssue_status_idx" ON "RedIssue"("status");
