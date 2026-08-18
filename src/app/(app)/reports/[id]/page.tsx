import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { textToLines, pct } from "@/lib/report-utils";
import { roleLabel } from "@/lib/role-labels";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteReportButton } from "@/components/reports/delete-report-button";
import { ReviewActions } from "@/components/reports/review-actions";
import { SubmitReportButton } from "@/components/reports/submit-report-button";
import { ApproveCoauthorButton } from "@/components/reports/approve-coauthor-button";
import { StatusBadge } from "@/components/reports/status-badge";
import { ActivityFeed } from "@/components/reports/activity-feed";
import { Pencil, FileText, CheckCircle2, Clock, ExternalLink } from "lucide-react";

function formatFullDate(d: Date | string) {
  return new Date(d).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function BulletList({ text, emptyText }: { text: string; emptyText: string }) {
  const lines = textToLines(text);
  if (lines.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {lines.map((line, i) => (
        <li key={i}>{line}</li>
      ))}
    </ul>
  );
}

function MetricTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const currentUserId = session!.user.id;

  const report = await prisma.weeklyReport.findUnique({
    where: { id },
    include: {
      project: true,
      user: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { name: true } },
      bugs: true,
      coAuthors: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { addedAt: "asc" },
      },
      activities: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!report) notFound();

  const isOwner = report.userId === currentUserId;
  const myCoAuthorRow = report.coAuthors.find((c) => c.userId === currentUserId);
  const isCoAuthor = !!myCoAuthorRow;
  const canView = session!.user.role === "ADMIN" || isOwner || isCoAuthor;
  if (!canView) redirect("/dashboard");

  const isOwnerOrAdmin = session!.user.role === "ADMIN" || isOwner;

  const bePassRate = pct(report.totalTcBEPassed, report.totalTcBEPassed + report.totalTcBEFailed);
  const fePassRate = pct(report.totalTcFEPassed, report.totalTcFEPassed + report.totalTcFEFailed);
  const beCoverage = pct(report.totalTcBEAutomated, report.totalTcBE);
  const feCoverage = pct(report.totalTcFEAutomated, report.totalTcFE);

  const approvedCount = report.coAuthors.filter((c) => c.approved).length;
  const totalCoAuthors = report.coAuthors.length;

  const firstSubmitted = report.activities.find((a) => a.action === "SUBMITTED");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{report.project.name}</h1>
            <StatusBadge status={report.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {formatFullDate(report.weekStart)} &rarr; {formatFullDate(report.weekEnd)}
          </p>
          <p className="text-xs text-muted-foreground">
            Dibuat oleh {report.user.name}
            {firstSubmitted ? ` · Submitted oleh ${firstSubmitted.user.name}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {session!.user.role === "ADMIN" &&
            (report.status === "SUBMITTED" ||
              report.status === "NEED_REVISION") && (
              <ReviewActions reportId={report.id} />
            )}
          {isOwner && report.status === "DRAFT" && (
            <SubmitReportButton reportId={report.id} />
          )}
          {isOwnerOrAdmin && (
            <>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={`/reports/${report.id}/edit`} />}
              >
                <Pencil className="mr-1 size-4" /> Edit
              </Button>
              <DeleteReportButton reportId={report.id} />
            </>
          )}
        </div>
      </div>

      {report.status === "NEED_REVISION" && report.reviewNote && (
        <Card className="border-amber-300 dark:border-amber-500/40">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-400">
              Catatan Revisi dari {report.reviewedBy?.name ?? "QA Lead"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{report.reviewNote}</p>
          </CardContent>
        </Card>
      )}

      {report.status === "APPROVED" && report.reviewedBy && (
        <p className="text-sm text-muted-foreground">
          Disetujui oleh {report.reviewedBy.name}
          {report.reviewedAt ? ` pada ${formatDate(report.reviewedAt)}` : ""}.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Co-authors & approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            <span className="font-medium">
              {approvedCount}/{totalCoAuthors}
            </span>{" "}
            <span className="text-muted-foreground">approval wajib terpenuhi</span>
          </p>
          <div className="space-y-2">
            {report.coAuthors.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
              >
                <div className="flex items-center gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {initials(c.user.name)}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{c.user.name}</div>
                    <div className="text-xs text-muted-foreground">{c.user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{roleLabel[c.user.role]}</Badge>
                  {c.approved ? (
                    <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-4" /> Approved
                    </span>
                  ) : c.userId === currentUserId ? (
                    <ApproveCoauthorButton reportId={report.id} />
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="size-4" /> Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <BulletList text={report.summary} emptyText="Belum diisi." />
          <p className="mt-4 text-xs text-muted-foreground">
            Mulai project:{" "}
            {report.project.startDate
              ? formatDate(report.project.startDate)
              : "-"}{" "}
            &middot; Berakhir project:{" "}
            {report.project.endDate ? formatDate(report.project.endDate) : "-"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <h4 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground">
              OVERVIEW
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              <MetricTile label="Total test case" value={report.totalTestCase} />
              <MetricTile
                label="Total automated"
                value={report.totalTcBEAutomated + report.totalTcFEAutomated}
              />
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground">
              BACKEND
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricTile label="Test case" value={report.totalTcBE} />
              <MetricTile label="Automated" value={report.totalTcBEAutomated} />
              <MetricTile label="Automation coverage" value={`${beCoverage}%`} />
              <MetricTile label="Pass rate" value={`${bePassRate}%`} />
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground">
              FRONTEND
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricTile label="Test case" value={report.totalTcFE} />
              <MetricTile label="Automated" value={report.totalTcFEAutomated} />
              <MetricTile label="Automation coverage" value={`${feCoverage}%`} />
              <MetricTile label="Pass rate" value={`${fePassRate}%`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Production incidents</CardTitle>
          {report.bugDocumentUrl && (
            <a
              href={report.bugDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <FileText className="size-4" /> Bug document
            </a>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            <span className="font-medium">{report.productionIncidentCount}</span>{" "}
            <span className="text-muted-foreground">incident dilaporkan</span>
          </p>
          {report.bugs.map((bug) => (
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
              {bug.description && (
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {bug.description}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan & notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border p-3">
              <h4 className="mb-1 text-xs font-medium tracking-wide text-muted-foreground">
                BLOCKER
              </h4>
              <BulletList text={report.blocker} emptyText="-" />
            </div>
            <div className="rounded-md border p-3">
              <h4 className="mb-1 text-xs font-medium tracking-wide text-muted-foreground">
                NEXT WEEK PLAN
              </h4>
              <BulletList text={report.nextWeekPlan} emptyText="Belum diisi." />
            </div>
          </div>
          <div className="rounded-md border p-3">
            <h4 className="mb-1 text-xs font-medium tracking-wide text-muted-foreground">
              NOTES
            </h4>
            <p className="whitespace-pre-wrap text-sm">{report.notes || "-"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed
            items={report.activities.map((a) => ({
              id: a.id,
              action: a.action,
              changedFields: a.changedFields,
              createdAt: a.createdAt.toISOString(),
              userName: a.user.name,
            }))}
          />
        </CardContent>
      </Card>

      <Badge variant="secondary">Status project: {report.project.status}</Badge>
    </div>
  );
}
