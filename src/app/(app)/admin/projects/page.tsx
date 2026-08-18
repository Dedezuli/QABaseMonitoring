import { prisma } from "@/lib/prisma";
import { ProjectsTable } from "@/components/admin/projects-table";

export default async function AdminProjectsPage() {
  const [projects, qaUsers] = await Promise.all([
    prisma.project.findMany({
      include: {
        assignments: { include: { user: { select: { id: true, name: true } } } },
        _count: { select: { reports: true, documents: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "QA" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Manajemen Project</h1>
        <p className="text-sm text-muted-foreground">
          Kelola project dan assignment QA.
        </p>
      </div>
      <ProjectsTable
        qaUsers={qaUsers}
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          description: p.description,
          startDate: p.startDate ? p.startDate.toISOString() : null,
          endDate: p.endDate ? p.endDate.toISOString() : null,
          status: p.status,
          assignedUserIds: p.assignments.map((a) => a.userId),
          assignedNames: p.assignments.map((a) => a.user.name),
          reportCount: p._count.reports,
          documentCount: p._count.documents,
        }))}
      />
    </div>
  );
}
