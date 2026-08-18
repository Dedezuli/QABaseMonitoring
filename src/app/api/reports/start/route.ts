import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { startReportSchema } from "@/lib/validation";
import { findOverlappingReport } from "@/lib/report-overlap";
import { logActivity } from "@/lib/report-activity";

export async function POST(request: NextRequest) {
  const { user, error } = await requireSession();
  if (error) return error;

  const body = await request.json();
  const parsed = startReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  if (user!.role === "QA") {
    const assigned = await prisma.projectAssignment.findUnique({
      where: {
        projectId_userId: { projectId: data.projectId, userId: user!.id },
      },
    });
    if (!assigned) {
      return NextResponse.json(
        { error: "Anda tidak di-assign ke project ini" },
        { status: 403 }
      );
    }
  }

  const overlapping = await findOverlappingReport({
    projectId: data.projectId,
    userId: user!.id,
    weekStart: data.weekStart,
    weekEnd: data.weekEnd,
  });
  if (overlapping) {
    return NextResponse.json(
      { error: "Sudah ada report untuk project dan periode ini" },
      { status: 409 }
    );
  }

  const report = await prisma.$transaction(async (tx) => {
    const created = await tx.weeklyReport.create({
      data: {
        projectId: data.projectId,
        userId: user!.id,
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        summary: "",
        status: "DRAFT",
        coAuthors: {
          create: [{ userId: user!.id }],
        },
      },
    });
    await logActivity(tx, {
      reportId: created.id,
      userId: user!.id,
      action: "CREATED",
    });
    return created;
  });

  return NextResponse.json(report, { status: 201 });
}
