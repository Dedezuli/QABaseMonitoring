import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { findOverlappingReport } from "@/lib/report-overlap";

export async function GET(request: NextRequest) {
  const { user, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const weekStart = searchParams.get("weekStart");
  const weekEnd = searchParams.get("weekEnd");
  const excludeReportId = searchParams.get("excludeReportId") ?? undefined;

  if (!projectId || !weekStart || !weekEnd) {
    return NextResponse.json(
      { error: "projectId, weekStart, dan weekEnd wajib diisi" },
      { status: 400 }
    );
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project tidak ditemukan" }, { status: 404 });
  }

  const overlapping = await findOverlappingReport({
    projectId,
    userId: user!.id,
    weekStart: new Date(weekStart),
    weekEnd: new Date(weekEnd),
    excludeReportId,
  });

  return NextResponse.json({
    available: !overlapping,
    projectName: project.name,
  });
}
