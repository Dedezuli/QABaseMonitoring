-- CreateIndex
CREATE INDEX "ProductionBug_reportId_idx" ON "ProductionBug"("reportId");

-- CreateIndex
CREATE INDEX "ProjectAssignment_userId_idx" ON "ProjectAssignment"("userId");

-- CreateIndex
CREATE INDEX "ProjectDocument_projectId_idx" ON "ProjectDocument"("projectId");

-- CreateIndex
CREATE INDEX "ReportActivity_reportId_idx" ON "ReportActivity"("reportId");

-- CreateIndex
CREATE INDEX "ReportCoAuthor_userId_idx" ON "ReportCoAuthor"("userId");

-- CreateIndex
CREATE INDEX "WeeklyReport_projectId_idx" ON "WeeklyReport"("projectId");

-- CreateIndex
CREATE INDEX "WeeklyReport_userId_idx" ON "WeeklyReport"("userId");

-- CreateIndex
CREATE INDEX "WeeklyReport_status_idx" ON "WeeklyReport"("status");

-- CreateIndex
CREATE INDEX "WeeklyReport_weekStart_idx" ON "WeeklyReport"("weekStart");
