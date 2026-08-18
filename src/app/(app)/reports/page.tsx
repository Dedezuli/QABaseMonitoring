import type { ReportStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { currentMonthRange, currentWorkWeekRange } from "@/lib/report-utils";
import { PeriodPicker } from "@/components/period-picker";
import { ReportsList } from "@/components/reports/reports-list";
import { NewReportDialog } from "@/components/reports/new-report-dialog";
import { PendingApprovalsList } from "@/components/reports/pending-approvals-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ReportsListPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; status?: ReportStatus }>;
}) {
  const { from: fromParam, to: toParam, status } = await searchParams;
  const defaults = currentMonthRange();
  const from = fromParam ?? defaults.from;
  const to = toParam ?? defaults.to;

  const session = await auth();
  const userId = session!.user.id;
  const isAdmin = session!.user.role === "ADMIN";

  const statusFilter = status ?? (isAdmin ? { not: "DRAFT" as const } : undefined);

  const [reports, assignments, pendingApprovals] = await Promise.all([
    prisma.weeklyReport.findMany({
      where: {
        ...(isAdmin ? {} : { userId }),
        weekStart: { gte: new Date(from), lte: new Date(to) },
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: { project: { select: { name: true, code: true } } },
      orderBy: { weekStart: "desc" },
    }),
    isAdmin
      ? Promise.resolve([])
      : prisma.projectAssignment.findMany({
          where: { userId },
          include: { project: { select: { id: true, name: true } } },
          orderBy: { project: { name: "asc" } },
        }),
    isAdmin
      ? Promise.resolve([])
      : prisma.reportCoAuthor.findMany({
          where: { userId, approved: false },
          include: {
            report: {
              include: {
                project: { select: { name: true, code: true } },
                user: { select: { name: true } },
              },
            },
          },
          orderBy: { addedAt: "desc" },
        }),
  ]);

  const defaultWeek = currentWorkWeekRange();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Weekly reports</h1>
          <p className="text-sm text-muted-foreground">
            Draft, submit, dan review weekly report QA.
          </p>
        </div>
        {!isAdmin && (
          <NewReportDialog
            projects={assignments.map((a) => a.project)}
            defaultWeekStart={defaultWeek.weekStart.toISOString().slice(0, 10)}
            defaultWeekEnd={defaultWeek.weekEnd.toISOString().slice(0, 10)}
          />
        )}
      </div>

      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Perlu approval saya</CardTitle>
          </CardHeader>
          <CardContent>
            <PendingApprovalsList
              rows={pendingApprovals.map((c) => ({
                reportId: c.report.id,
                projectName: c.report.project.name,
                projectCode: c.report.project.code,
                weekStart: c.report.weekStart.toISOString(),
                weekEnd: c.report.weekEnd.toISOString(),
                status: c.report.status,
                authorName: c.report.user.name,
              }))}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My reports</CardTitle>
          <div className="space-y-1 text-right">
            <div className="text-xs text-muted-foreground">Periode report</div>
            <PeriodPicker from={from} to={to} />
          </div>
        </CardHeader>
        <CardContent>
          <ReportsList
            status={status}
            reports={reports.map((r) => ({
              id: r.id,
              projectName: r.project.name,
              projectCode: r.project.code,
              weekStart: r.weekStart.toISOString(),
              weekEnd: r.weekEnd.toISOString(),
              status: r.status,
              reviewNote: r.reviewNote,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
