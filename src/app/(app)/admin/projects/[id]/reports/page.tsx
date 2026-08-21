import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma, ReportStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { pct, pickLatestByUpdate } from "@/lib/report-utils";
import { resolvePage } from "@/lib/pagination";
import { Pagination } from "@/components/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/reports/status-badge";
import { ProjectReportsFilters } from "@/components/admin/project-reports-filters";
import { ArrowLeft, Bug, FileText } from "lucide-react";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(d: Date) {
  return new Date(d).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}

export default async function ProjectReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    userId?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const { id } = await params;
  const { userId, status, from, to, page: pageParam } = await searchParams;

  const where: Prisma.WeeklyReportWhereInput = { projectId: id };
  if (userId) where.userId = userId;
  if (status) where.status = status as ReportStatus;
  if (from || to) {
    where.weekStart = {};
    if (from) where.weekStart.gte = new Date(from);
    if (to) where.weekStart.lte = new Date(to);
  }

  // Header totals describe the whole filtered set, so they are counted
  // separately from the page of rows being rendered.
  const [totalReports, totalBugs, allWeekStarts] = await Promise.all([
    prisma.weeklyReport.count({ where }),
    prisma.productionBug.count({ where: { report: where } }),
    prisma.weeklyReport.findMany({ where, select: { weekStart: true } }),
  ]);
  const totalWeeks = new Set(
    allWeekStarts.map((r) => r.weekStart.toISOString().slice(0, 10))
  ).size;
  const pageInfo = resolvePage(pageParam, totalReports);

  const [project, reports, contributors] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      select: { id: true, name: true, code: true, status: true },
    }),
    prisma.weeklyReport.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        reviewedBy: { select: { name: true } },
        bugs: { select: { id: true } },
        coAuthors: { select: { approved: true } },
      },
      orderBy: [{ weekStart: "desc" }, { updatedAt: "desc" }],
      skip: pageInfo.skip,
      take: pageInfo.pageSize,
    }),
    // Everyone who has ever reported on this project, so the filter list stays
    // stable no matter which filter is currently applied. Deduped here rather
    // than with `distinct`, which Postgres would turn into a DISTINCT ON that
    // conflicts with ordering by a related column.
    prisma.weeklyReport
      .findMany({
        where: { projectId: id },
        select: { user: { select: { id: true, name: true } } },
      })
      .then((rows) => {
        const byId = new Map(rows.map((r) => [r.user.id, r.user]));
        return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
      }),
  ]);

  if (!project) notFound();

  // Reports are already sorted newest week first, so weeks come out in order.
  const weeks = new Map<string, typeof reports>();
  for (const report of reports) {
    const key = report.weekStart.toISOString().slice(0, 10);
    const bucket = weeks.get(key);
    if (bucket) bucket.push(report);
    else weeks.set(key, [report]);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5" /> Kembali ke detail project
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">
          Semua Report &mdash; {project.name}{" "}
          <span className="text-base font-normal text-muted-foreground">
            ({project.code})
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">
          {totalReports} report dari {totalWeeks} minggu &middot; {totalBugs} bug
          production.
        </p>
      </div>

      <ProjectReportsFilters qaUsers={contributors} />

      {reports.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Tidak ada report yang cocok dengan filter ini.
            </p>
          </CardContent>
        </Card>
      ) : (
        [...weeks.entries()].map(([weekKey, weekReports]) => {
          // Several QA can report the same week; the latest edit is the one
          // that represents the project's numbers for that week.
          const representative = pickLatestByUpdate(
            weekReports.filter((r) => r.status !== "DRAFT")
          );
          const weekBugs = weekReports.reduce(
            (sum, r) => sum + r.bugs.length,
            0
          );

          return (
            <Card key={weekKey}>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>
                    Minggu {formatDate(weekReports[0].weekStart)} &rarr;{" "}
                    {formatDate(weekReports[0].weekEnd)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {weekReports.length} report &middot; {weekBugs} bug production
                  </p>
                </div>
                {representative && (
                  <div className="flex flex-wrap gap-4 rounded-md border px-3 py-2">
                    <Stat
                      label="Progress"
                      value={`${pct(
                        representative.totalTcExecuted,
                        representative.totalTestCase
                      )}%`}
                    />
                    <Stat
                      label="TC executed"
                      value={`${representative.totalTcExecuted} / ${representative.totalTestCase}`}
                    />
                    <Stat
                      label="Coverage BE"
                      value={`${pct(
                        representative.totalTcBEAutomated,
                        representative.totalTcBE
                      )}%`}
                    />
                    <Stat
                      label="Coverage FE"
                      value={`${pct(
                        representative.totalTcFEAutomated,
                        representative.totalTcFE
                      )}%`}
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {weekReports.map((r) => {
                  const approvedCoAuthors = r.coAuthors.filter(
                    (c) => c.approved
                  ).length;
                  const isRepresentative = representative?.id === r.id;

                  return (
                    <div key={r.id} className="rounded-md border p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">
                              {r.user.name}
                            </span>
                            <StatusBadge status={r.status} />
                            {isRepresentative && (
                              <Badge variant="secondary">
                                Dipakai untuk metrik
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Terakhir diperbarui {formatDateTime(r.updatedAt)}
                            {r.reviewedBy
                              ? ` · direview oleh ${r.reviewedBy.name}`
                              : ""}
                          </p>
                        </div>
                        <Link
                          href={`/reports/${r.id}`}
                          className="inline-flex shrink-0 items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <FileText className="size-3.5" /> Buka report
                        </Link>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        <Stat label="Total TC" value={r.totalTestCase} />
                        <Stat
                          label="Executed"
                          value={`${r.totalTcExecuted} (${pct(
                            r.totalTcExecuted,
                            r.totalTestCase
                          )}%)`}
                        />
                        <Stat
                          label="BE auto"
                          value={`${r.totalTcBEAutomated}/${r.totalTcBE}`}
                        />
                        <Stat
                          label="FE auto"
                          value={`${r.totalTcFEAutomated}/${r.totalTcFE}`}
                        />
                        <Stat
                          label="Passed / Failed"
                          value={`${
                            r.totalTcBEPassed + r.totalTcFEPassed
                          } / ${r.totalTcBEFailed + r.totalTcFEFailed}`}
                        />
                        <Stat label="Co-author approved" value={approvedCoAuthors} />
                      </div>

                      {r.bugs.length > 0 && (
                        <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Bug className="size-3.5" /> {r.bugs.length} bug
                          production dilaporkan
                        </p>
                      )}

                      {r.status === "NEED_REVISION" && r.reviewNote && (
                        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                          Catatan revisi: {r.reviewNote}
                        </p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })
      )}

      <Pagination info={pageInfo} itemLabel="report" />
    </div>
  );
}
