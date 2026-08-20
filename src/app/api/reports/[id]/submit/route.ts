import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/validation";
import { errorResponse, validationError } from "@/lib/api-error";
import { textToLines } from "@/lib/report-utils";
import { logActivity } from "@/lib/report-activity";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return errorResponse("Sesi kamu sudah berakhir. Silakan login ulang lalu coba lagi.", 401);
  }

  const { id } = await params;
  const report = await prisma.weeklyReport.findUnique({
    where: { id },
    include: { bugs: true, coAuthors: true },
  });
  if (!report) return errorResponse("Data tidak ditemukan. Mungkin sudah dihapus — coba muat ulang halaman.", 404);

  const allowed = session.user.role === "ADMIN" || report.userId === session.user.id;
  if (!allowed) return errorResponse("Kamu tidak punya akses ke report ini.", 403);

  if (report.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Report ini bukan draft" },
      { status: 400 }
    );
  }

  const pendingCoAuthors = report.coAuthors.filter((c) => !c.approved);
  if (pendingCoAuthors.length > 0) {
    return NextResponse.json(
      {
        error: `Masih menunggu ${pendingCoAuthors.length} approval co-author sebelum bisa disubmit.`,
      },
      { status: 400 }
    );
  }

  const parsed = reportSchema.safeParse({
    projectId: report.projectId,
    weekStart: report.weekStart,
    weekEnd: report.weekEnd,
    summary: textToLines(report.summary),
    blocker: textToLines(report.blocker),
    nextWeekPlan: textToLines(report.nextWeekPlan),
    notes: report.notes ?? "",
    totalTestCase: report.totalTestCase,
    totalTcExecuted: report.totalTcExecuted,
    totalTcBE: report.totalTcBE,
    totalTcBEAutomated: report.totalTcBEAutomated,
    totalTcBEPassed: report.totalTcBEPassed,
    totalTcBEFailed: report.totalTcBEFailed,
    totalTcFE: report.totalTcFE,
    totalTcFEAutomated: report.totalTcFEAutomated,
    totalTcFEPassed: report.totalTcFEPassed,
    totalTcFEFailed: report.totalTcFEFailed,
    productionIncidentCount: report.productionIncidentCount,
    bugDocumentUrl: report.bugDocumentUrl ?? "",
    bugs: report.bugs.map((b) => ({
      title: b.title,
      description: b.description ?? "",
      link: b.link ?? "",
    })),
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.weeklyReport.update({
      where: { id },
      data: { status: "SUBMITTED" },
    });
    await logActivity(tx, {
      reportId: id,
      userId: session.user.id,
      action: "SUBMITTED",
    });
    return result;
  });

  return NextResponse.json(updated);
}
