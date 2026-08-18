import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectFormDialog } from "@/components/admin/project-form-dialog";
import { DocumentsSection } from "@/components/admin/documents-section";

function formatDate(d: Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, qaUsers] = await Promise.all([
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
  ]);

  if (!project) notFound();

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
