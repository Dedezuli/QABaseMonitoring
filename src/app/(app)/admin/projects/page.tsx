import { prisma } from "@/lib/prisma";
import { ProjectsTable } from "@/components/admin/projects-table";
import { Pagination } from "@/components/pagination";
import { resolvePage } from "@/lib/pagination";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;

  const totalProjects = await prisma.project.count();
  const pageInfo = resolvePage(pageParam, totalProjects);

  const [projects, qaUsers] = await Promise.all([
    prisma.project.findMany({
      include: {
        assignments: { include: { user: { select: { id: true, name: true } } } },
        _count: { select: { reports: true, documents: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: pageInfo.skip,
      take: pageInfo.pageSize,
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
      <Pagination info={pageInfo} itemLabel="project" />
    </div>
  );
}
