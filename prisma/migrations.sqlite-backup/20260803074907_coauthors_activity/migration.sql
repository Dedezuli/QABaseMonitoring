-- CreateTable
CREATE TABLE "ReportCoAuthor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" DATETIME,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportCoAuthor_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "WeeklyReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReportCoAuthor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changedFields" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportActivity_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "WeeklyReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReportActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductionBug" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductionBug_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "WeeklyReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductionBug" ("createdAt", "id", "reportId", "title") SELECT "createdAt", "id", "reportId", "title" FROM "ProductionBug";
DROP TABLE "ProductionBug";
ALTER TABLE "new_ProductionBug" RENAME TO "ProductionBug";
CREATE TABLE "new_WeeklyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "weekEnd" DATETIME NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "blocker" TEXT NOT NULL DEFAULT '',
    "nextWeekPlan" TEXT NOT NULL DEFAULT '',
    "notes" TEXT,
    "totalTestCase" INTEGER NOT NULL DEFAULT 0,
    "totalTcBE" INTEGER NOT NULL DEFAULT 0,
    "totalTcBEAutomated" INTEGER NOT NULL DEFAULT 0,
    "totalTcBEPassed" INTEGER NOT NULL DEFAULT 0,
    "totalTcBEFailed" INTEGER NOT NULL DEFAULT 0,
    "totalTcFE" INTEGER NOT NULL DEFAULT 0,
    "totalTcFEAutomated" INTEGER NOT NULL DEFAULT 0,
    "totalTcFEPassed" INTEGER NOT NULL DEFAULT 0,
    "totalTcFEFailed" INTEGER NOT NULL DEFAULT 0,
    "productionIncidentCount" INTEGER NOT NULL DEFAULT 0,
    "bugDocumentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WeeklyReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WeeklyReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WeeklyReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WeeklyReport" ("blocker", "createdAt", "id", "nextWeekPlan", "notes", "projectId", "reviewNote", "reviewedAt", "reviewedById", "status", "summary", "totalTcBE", "totalTcBEAutomated", "totalTcBEFailed", "totalTcBEPassed", "totalTcFE", "totalTcFEAutomated", "totalTcFEFailed", "totalTcFEPassed", "totalTestCase", "updatedAt", "userId", "weekEnd", "weekStart") SELECT "blocker", "createdAt", "id", "nextWeekPlan", "notes", "projectId", "reviewNote", "reviewedAt", "reviewedById", "status", "summary", "totalTcBE", "totalTcBEAutomated", "totalTcBEFailed", "totalTcBEPassed", "totalTcFE", "totalTcFEAutomated", "totalTcFEFailed", "totalTcFEPassed", "totalTestCase", "updatedAt", "userId", "weekEnd", "weekStart" FROM "WeeklyReport";
DROP TABLE "WeeklyReport";
ALTER TABLE "new_WeeklyReport" RENAME TO "WeeklyReport";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ReportCoAuthor_reportId_userId_key" ON "ReportCoAuthor"("reportId", "userId");

