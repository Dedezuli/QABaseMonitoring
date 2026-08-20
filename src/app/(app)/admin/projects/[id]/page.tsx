import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pct } from "@/lib/report-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectFormDialog } from "@/components/admin/project-form-dialog";
import { DocumentsSection } from "@/components/admin/documents-section";
import { ProjectTrendChart } from "@/components/admin/project-trend-chart";
import { StatusBadge } from "@/components/reports/status-badge";
import { PercentBar } from "@/components/percent-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink } from "lucide-react";

function formatDate(d: Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, qaUsers, reports] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        assignments: { include: { user: { select: { id: true, name: true, email: true } } } },
        documents: {
          include: { uploadedBy: { select: { name: true } } },
          orderBy: { uploadedAt: "desc" },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "QA" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.weeklyReport.findMany({
      where: { projectId: id },
      include: {
        user: { select: { name: true } },
        bugs: true,
      },
      orderBy: { weekStart: "desc" },
    }),
  ]);

  if (!project) notFound();

  // Drafts are still in-progress numbers, so metrics follow the dashboard and
  // count only submitted work. The history table below still lists everything.
  const published = reports.filter((r) => r.status !== "DRAFT");
  const latest = published[0] ?? null;

  const totalTestCase = latest?.totalTestCase ?? 0;
  const totalTcExecuted = latest?.totalTcExecuted ?? 0;
  const executedPct = pct(totalTcExecuted, totalTestCase);
  const beCoveragePct = pct(latest?.totalTcBEAutomated ?? 0, latest?.totalTcBE ?? 0);
  const feCoveragePct = pct(latest?.totalTcFEAutomated ?? 0, latest?.totalTcFE ?? 0);
  const passedCount =
    (latest?.totalTcBEPassed ?? 0) + (latest?.totalTcFEPassed ?? 0);
  const failedCount =
    (latest?.totalTcBEFailed ?? 0) + (latest?.totalTcFEFailed ?? 0);
  const notExecutedCount = Math.max(0, totalTestCase - totalTcExecuted);
  const bugCount = published.reduce((sum, r) => sum + r.bugs.length, 0);

  const trend = [...published]
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
    .map((r) => ({
      weekStart: r.weekStart.toISOString(),
      progressPct: pct(r.totalTcExecuted, r.totalTestCase),
      bePct: pct(r.totalTcBEAutomated, r.totalTcBE),
      fePct: pct(r.totalTcFEAutomated, r.totalTcFE),
    }));

  const incidents = published.flatMap((r) =>
    r.bugs.map((bug) => ({
      ...bug,
      weekStart: r.weekStart,
      reportId: r.id,
      authorName: r.user.name,
    }))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {project.name}{" "}
            <span className="text-base font-normal text-muted-foreground">
              ({project.code})
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {project.description || "Tidak ada deskripsi."}
          </p>
        </div>
        <ProjectFormDialog
          qaUsers={qaUsers}
          project={{
            id: project.id,
            name: project.name,
            code: project.code,
            description: project.description,
            startDate: project.startDate ? project.startDate.toISOString() : null,
            endDate: project.endDate ? project.endDate.toISOString() : null,
            status: project.status,
            assignedUserIds: project.assignments.map((a) => a.userId),
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Project</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <div className="text-muted-foreground">Status</div>
            <Badge variant="secondary" className="mt-1">
              {project.status}
            </Badge>
          </div>
          <div>
            <div className="text-muted-foreground">Mulai project</div>
            <div>{formatDate(project.startDate)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Berakhir project</div>
            <div>{formatDate(project.endDate)}</div>
          </div>
        </CardContent>
      </Card>

      {latest === null ? (
        <Card>
          <CardHeader>
            <CardTitle>Metrik QA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Belum ada report yang disubmit untuk project ini, jadi metriknya
              belum bisa dihitung.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Progress testing"
              value={`${executedPct}%`}
              hint={`${totalTcExecuted} / ${totalTestCase} TC executed`}
            />
            <MetricCard
              label="Coverage BE"
              value={`${beCoveragePct}%`}
              hint={`${latest.totalTcBEAutomated} / ${latest.totalTcBE} TC automated`}
            />
            <MetricCard
              label="Coverage FE"
              value={`${feCoveragePct}%`}
              hint={`${latest.totalTcFEAutomated} / ${latest.totalTcFE} TC automated`}
            />
            <MetricCard
              label="Bug production"
              value={bugCount}
              hint={`dari ${published.length} report`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tren per Minggu</CardTitle>
              <p className="text-sm text-muted-foreground">
                Progress testing dan coverage automation dari minggu ke minggu.
              </p>
            </CardHeader>
            <CardContent>
              <ProjectTrendChart data={trend} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hasil Test</CardTitle>
              <p className="text-sm text-muted-foreground">
                Diambil dari report terbaru ({formatDate(latest.weekStart)}).
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <PercentBar
                label="Passed"
                value={pct(passedCount, totalTestCase)}
                detail={`${passedCount} TC`}
              />
              <PercentBar
                label="Failed"
                value={pct(failedCount, totalTestCase)}
                detail={`${failedCount} TC`}
              />
              <PercentBar
                label="Belum dieksekusi"
                value={pct(notExecutedCount, totalTestCase)}
                detail={`${notExecutedCount} TC`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bug Production ({incidents.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {incidents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Tidak ada incident production yang dilaporkan.
                </p>
              ) : (
                incidents.map((bug) => (
                  <div key={bug.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-medium">{bug.title}</h3>
                      {bug.link && (
                        <a
                          href={bug.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          Lihat incident <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Minggu {formatDate(bug.weekStart)} &middot; dilaporkan oleh{" "}
                      {bug.authorName}
                    </p>
                    {bug.description && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {bug.description}
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Report ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Minggu</TableHead>
                  <TableHead>QA</TableHead>
                  <TableHead>Total TC</TableHead>
                  <TableHead>Executed</TableHead>
                  <TableHead>Bug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      Belum ada report untuk project ini.
                    </TableCell>
                  </TableRow>
                )}
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="tabular-nums">
                      {formatDate(r.weekStart)} &rarr; {formatDate(r.weekEnd)}
                    </TableCell>
                    <TableCell>{r.user.name}</TableCell>
                    <TableCell className="tabular-nums">
                      {r.totalTestCase}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {r.totalTcExecuted} ({pct(r.totalTcExecuted, r.totalTestCase)}%)
                    </TableCell>
                    <TableCell className="tabular-nums">{r.bugs.length}</TableCell>
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

      <Card>
        <CardHeader>
          <CardTitle>QA Assigned</CardTitle>
        </CardHeader>
        <CardContent>
          {project.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada QA yang di-assign ke project ini.
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {project.assignments.map((a) => (
                <li key={a.id}>
                  {a.user.name}{" "}
                  <span className="text-muted-foreground">({a.user.email})</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dokumen Project</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentsSection
            projectId={project.id}
            documents={project.documents.map((d) => ({
              id: d.id,
              originalName: d.originalName,
              uploadedAt: d.uploadedAt.toISOString(),
              uploadedBy: d.uploadedBy,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
