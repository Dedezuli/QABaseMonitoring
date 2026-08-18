-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductionBug" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductionBug_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "WeeklyReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductionBug" ("createdAt", "id", "link", "reportId", "title") SELECT "createdAt", "id", "link", "reportId", "title" FROM "ProductionBug";
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
INSERT INTO "new_WeeklyReport" ("createdAt", "id", "projectId", "reviewNote", "reviewedAt", "reviewedById", "status", "totalTcBE", "totalTcBEAutomated", "totalTcFE", "totalTcFEAutomated", "totalTestCase", "updatedAt", "userId", "weekEnd", "weekStart") SELECT "createdAt", "id", "projectId", "reviewNote", "reviewedAt", "reviewedById", "status", "totalTcBE", "totalTcBEAutomated", "totalTcFE", "totalTcFEAutomated", "totalTestCase", "updatedAt", "userId", "weekEnd", "weekStart" FROM "WeeklyReport";
DROP TABLE "WeeklyReport";
ALTER TABLE "new_WeeklyReport" RENAME TO "WeeklyReport";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

