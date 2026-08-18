import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/reports/status-badge";
import { reportStatusMeta } from "@/lib/report-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(d: Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function QaProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const [project, assignment, reports] = await Promise.all([
    prisma.project.findUnique({ where: { id } }),
    prisma.projectAssignment.findUnique({
      where: { projectId_userId: { projectId: id, userId } },
    }),
    prisma.weeklyReport.findMany({
      where: { projectId: id, userId },
      orderBy: { weekStart: "desc" },
    }),
  ]);

  if (!project) notFound();
  if (session!.user.role !== "ADMIN" && !assignment) redirect("/projects");

  return (
    <div className="space-y-6">
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
          <CardTitle>Report Saya di Project Ini ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Belum ada report untuk project ini.
                    </TableCell>
                  </TableRow>
                )}
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {formatDate(r.weekStart)} &rarr; {formatDate(r.weekEnd)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <StatusBadge status={r.status} />
                        <div className="text-xs text-muted-foreground">
                          {r.status === "NEED_REVISION" && r.reviewNote
                            ? r.reviewNote
                            : reportStatusMeta[r.status].description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/reports/${r.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View
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
