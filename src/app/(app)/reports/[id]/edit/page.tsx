import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { textToLines } from "@/lib/report-utils";
import { ReportForm } from "@/components/reports/report-form";

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;
  const isAdmin = session!.user.role === "ADMIN";

  const report = await prisma.weeklyReport.findUnique({
    where: { id },
    include: { bugs: true, coAuthors: true },
  });

  if (!report) notFound();
  if (!isAdmin && report.userId !== userId) redirect("/dashboard");
  if (!isAdmin && report.status === "APPROVED") redirect(`/reports/${report.id}`);

  const [projects, qaUsers] = await Promise.all([
    isAdmin
      ? prisma.project.findMany({ orderBy: { name: "asc" } })
      : prisma.projectAssignment
          .findMany({
            where: { userId },
            include: { project: true },
            orderBy: { project: { name: "asc" } },
          })
          .then((rows) => rows.map((a) => a.project)),
    prisma.user.findMany({
      where: { role: "QA", id: { not: report.userId } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit weekly report</h1>
        <p className="text-sm text-muted-foreground">
          {report.status === "DRAFT"
            ? "Perbarui draft report kamu."
            : "Perbarui report ini."}
        </p>
      </div>
      <ReportForm
        reportId={report.id}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        qaUsers={qaUsers}
        initialValues={{
          projectId: report.projectId,
          weekStart: toDateInputValue(report.weekStart),
          weekEnd: toDateInputValue(report.weekEnd),
          summary: textToLines(report.summary),
          blocker: textToLines(report.blocker),
          nextWeekPlan: textToLines(report.nextWeekPlan),
          notes: report.notes ?? "",
          totalTestCase: String(report.totalTestCase),
          totalTcExecuted: String(report.totalTcExecuted),
          totalTcBE: String(report.totalTcBE),
          totalTcBEAutomated: String(report.totalTcBEAutomated),
          totalTcBEPassed: String(report.totalTcBEPassed),
          totalTcBEFailed: String(report.totalTcBEFailed),
          totalTcFE: String(report.totalTcFE),
          totalTcFEAutomated: String(report.totalTcFEAutomated),
          totalTcFEPassed: String(report.totalTcFEPassed),
          totalTcFEFailed: String(report.totalTcFEFailed),
          productionIncidentCount: String(report.productionIncidentCount),
          bugDocumentUrl: report.bugDocumentUrl ?? "",
          bugs: report.bugs.map((b) => ({
            title: b.title,
            description: b.description ?? "",
            link: b.link ?? "",
          })),
          coAuthorUserIds: report.coAuthors
            .map((c) => c.userId)
            .filter((uid) => uid !== report.userId),
        }}
      />
    </div>
  );
}
