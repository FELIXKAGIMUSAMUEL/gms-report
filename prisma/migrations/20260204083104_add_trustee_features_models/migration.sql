-- CreateTable
CREATE TABLE "OrganizationalGoal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "term" INTEGER,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'in-progress',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationalGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "operator" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "recipients" TEXT NOT NULL DEFAULT 'all',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertHistory" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "school" TEXT,
    "metric" TEXT NOT NULL,
    "expectedValue" DOUBLE PRECISION NOT NULL,
    "actualValue" DOUBLE PRECISION NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "message" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganizationalGoal_year_term_idx" ON "OrganizationalGoal"("year", "term");

-- CreateIndex
CREATE INDEX "OrganizationalGoal_category_idx" ON "OrganizationalGoal"("category");

-- CreateIndex
CREATE INDEX "OrganizationalGoal_status_idx" ON "OrganizationalGoal"("status");

-- CreateIndex
CREATE INDEX "AlertConfig_type_idx" ON "AlertConfig"("type");

-- CreateIndex
CREATE INDEX "AlertConfig_isActive_idx" ON "AlertConfig"("isActive");

-- CreateIndex
CREATE INDEX "AlertHistory_configId_idx" ON "AlertHistory"("configId");

-- CreateIndex
CREATE INDEX "AlertHistory_school_idx" ON "AlertHistory"("school");

-- CreateIndex
CREATE INDEX "AlertHistory_severity_idx" ON "AlertHistory"("severity");

-- CreateIndex
CREATE INDEX "AlertHistory_isResolved_idx" ON "AlertHistory"("isResolved");

-- CreateIndex
CREATE INDEX "AlertHistory_createdAt_idx" ON "AlertHistory"("createdAt");
