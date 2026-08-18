import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { currentWeekRange } from "@/lib/report-utils";
import { ProjectsList } from "@/components/projects-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProjectsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const assignments = await prisma.projectAssignment.findMany({
    where: { userId },
    include: { project: true },
    orderBy: { project: { name: "asc" } },
  });

  const { weekStart, weekEnd } = currentWeekRange();
  const currentWeekReports = await prisma.weeklyReport.findMany({
    where: {
      userId,
      projectId: { in: assignments.map((a) => a.projectId) },
      weekEnd: { gte: weekStart },
      weekStart: { lte: weekEnd },
    },
    orderBy: { weekStart: "desc" },
  });

  const statusByProject = new Map<string, (typeof currentWeekReports)[number]>();
  for (const r of currentWeekReports) {
    if (!statusByProject.has(r.projectId)) statusByProject.set(r.projectId, r);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Kelola project QA yang aktif.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All projects</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectsList
            projects={assignments.map((a) => ({
              id: a.project.id,
              name: a.project.name,
              code: a.project.code,
              status: a.project.status,
              currentWeekReportStatus:
                statusByProject.get(a.project.id)?.status ?? null,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
