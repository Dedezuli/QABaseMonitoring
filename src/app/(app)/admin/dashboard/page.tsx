import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  aggregateByUser,
  buildProjectScorecards,
  summarize,
  weeklyTrend,
  type ReportForAggregate,
} from "@/lib/dashboard-aggregate";
import { automationSummary, pct } from "@/lib/report-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PercentBar } from "@/components/percent-bar";
import { DashboardFilters } from "@/components/admin/dashboard-filters";
import { AutomationTrendChart } from "@/components/admin/automation-trend-chart";
import { ProjectScorecards } from "@/components/admin/project-scorecards";
import { StatusBadge } from "@/components/reports/status-badge";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    projectId?: string;
    userId?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const { projectId, userId, from, to } = await searchParams;

  const [projects, qaUsers] = await Promise.all([
    prisma.project.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "QA" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const where: Prisma.WeeklyReportWhereInput = { status: { not: "DRAFT" } };
  if (projectId) where.projectId = projectId;
  if (userId) where.userId = userId;
  if (from || to) {
    where.weekStart = {};
    if (from) where.weekStart.gte = new Date(from);
    if (to) where.weekStart.lte = new Date(to);
  }

  const reports = await prisma.weeklyReport.findMany({
    where,
    include: {
      project: {
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          startDate: true,
          endDate: true,
        },
      },
      user: { select: { id: true, name: true } },
      bugs: { select: { id: true } },
    },
    orderBy: { weekStart: "desc" },
  });

  const forAggregate: ReportForAggregate[] = reports.map((r) => ({
    id: r.id,
    projectId: r.project.id,
    projectName: r.project.name,
    userId: r.user.id,
    userName: r.user.name,
    weekStart: r.weekStart,
    totalTestCase: r.totalTestCase,
    totalTcExecuted: r.totalTcExecuted,
    totalTcBE: r.totalTcBE,
    totalTcBEAutomated: r.totalTcBEAutomated,
    totalTcFE: r.totalTcFE,
    totalTcFEAutomated: r.totalTcFEAutomated,
    bugCount: r.bugs.length,
    status: r.status,
  }));

  const summary = summarize(forAggregate);
  const byUser = aggregateByUser(forAggregate);
  const trend = weeklyTrend(forAggregate);

  const scorecards = buildProjectScorecards(
    reports.map((r) => ({
      projectId: r.project.id,
      projectName: r.project.name,
      projectCode: r.project.code,
      projectStatus: r.project.status,
      startDate: r.project.startDate,
      endDate: r.project.endDate,
      weekStart: r.weekStart,
      totalTestCase: r.totalTestCase,
      totalTcExecuted: r.totalTcExecuted,
      totalTcBE: r.totalTcBE,
      totalTcBEAutomated: r.totalTcBEAutomated,
      totalTcFE: r.totalTcFE,
      totalTcFEAutomated: r.totalTcFEAutomated,
      passedCount: r.totalTcBEPassed + r.totalTcFEPassed,
      failedCount: r.totalTcBEFailed + r.totalTcFEFailed,
      bugCount: r.bugs.length,
    }))
  );

  // Assigned from the unfiltered project list so a project keeps the same
  // accent colour no matter which filter is active.
  const colorIndexById = Object.fromEntries(
    projects.map((p, i) => [p.id, i])
  );

  const avgProgressPct = scorecards.length
    ? Math.round(
        scorecards.reduce((sum, c) => sum + c.executedPct, 0) / scorecards.length
      )
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard Admin</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan reporting QA weekly per project, per QA, dan per periode.
        </p>
      </div>

      <DashboardFilters projects={projects} qaUsers={qaUsers} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total Report" value={summary.reportCount} />
        <SummaryCard label="Total TC Dibuat" value={summary.totalTestCase} />
        <SummaryCard
          label="Automation Overall"
          value={`${summary.overallPct}%`}
        />
        <SummaryCard label="Total Bug Production" value={summary.bugCount} />
        <SummaryCard
          label="Rata-rata Progress Project"
          value={`${avgProgressPct}%`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tren Automation Overall per Minggu</CardTitle>
        </CardHeader>
        <CardContent>
          <AutomationTrendChart data={trend} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ringkasan per Project</CardTitle>
          <p className="text-sm text-muted-foreground">
            Progress dan coverage diambil dari report terbaru tiap project
            (angkanya kumulatif), sedangkan bug production dijumlah sepanjang
            periode yang difilter.
          </p>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <ProjectScorecards
            cards={scorecards}
            colorIndexById={colorIndexById}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Per QA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {byUser.length === 0 && (
            <p className="text-sm text-muted-foreground">Tidak ada data.</p>
          )}
          {byUser.map((g) => (
            <PercentBar
              key={g.key}
              label={g.label}
              value={g.overallPct}
              detail={`${g.reportCount} report, ${g.totalTestCase} TC`}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detail Report ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>QA</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Total TC</TableHead>
                  <TableHead>TC Executed</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Automation %</TableHead>
                  <TableHead>Bug Production</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
                      Tidak ada report untuk filter ini.
                    </TableCell>
                  </TableRow>
                )}
                {forAggregate.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.projectName}</TableCell>
                    <TableCell>{r.userName}</TableCell>
                    <TableCell>{formatDate(r.weekStart)}</TableCell>
                    <TableCell>{r.totalTestCase}</TableCell>
                    <TableCell>{r.totalTcExecuted}</TableCell>
                    <TableCell>{pct(r.totalTcExecuted, r.totalTestCase)}%</TableCell>
                    <TableCell>{automationSummary(r).overallPct}%</TableCell>
                    <TableCell>{r.bugCount}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/reports/${r.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        Lihat
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-2xl font-semibold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
