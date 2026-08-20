import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reportSchema, reportDraftSchema } from "@/lib/validation";
import { errorResponse, validationError } from "@/lib/api-error";
import { linesToText } from "@/lib/report-utils";
import { logActivity, diffFields } from "@/lib/report-activity";

async function loadReportForUser(
  id: string,
  user: { id: string; role: string }
) {
  const report = await prisma.weeklyReport.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
      bugs: true,
    },
  });

  if (!report) return { report: null, allowed: false };
  const allowed = user.role === "ADMIN" || report.userId === user.id;
  return { report, allowed };
}

// Relations are fetched as separate round trips, so writes load only the scalar
// columns they need for authorization and change tracking.
async function loadReportScalars(
  id: string,
  user: { id: string; role: string }
) {
  const report = await prisma.weeklyReport.findUnique({ where: { id } });
  if (!report) return { report: null, allowed: false };
  const allowed = user.role === "ADMIN" || report.userId === user.id;
  return { report, allowed };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return errorResponse("Sesi kamu sudah berakhir. Silakan login ulang lalu coba lagi.", 401);
  }

  const { id } = await params;
  const { report, allowed } = await loadReportForUser(id, session.user);

  if (!report) return errorResponse("Data tidak ditemukan. Mungkin sudah dihapus — coba muat ulang halaman.", 404);
  if (!allowed) return errorResponse("Kamu tidak punya akses ke report ini.", 403);

  return NextResponse.json(report);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return errorResponse("Sesi kamu sudah berakhir. Silakan login ulang lalu coba lagi.", 401);
  }

  const { id } = await params;
  const { report, allowed } = await loadReportScalars(id, session.user);
  if (!report) return errorResponse("Data tidak ditemukan. Mungkin sudah dihapus — coba muat ulang halaman.", 404);
  if (!allowed) return errorResponse("Kamu tidak punya akses ke report ini.", 403);
  if (report.status === "APPROVED" && session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Report yang sudah di-approve tidak bisa diedit" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const isDraft = report.status === "DRAFT";
  const parsed = isDraft
    ? reportDraftSchema.safeParse(body)
    : reportSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error);
  }
  const data = parsed.data;

  const [assigned, currentCoAuthors] = await Promise.all([
    session.user.role === "QA"
      ? prisma.projectAssignment.findUnique({
          where: {
            projectId_userId: {
              projectId: data.projectId,
              userId: session.user.id,
            },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
    isDraft
      ? prisma.reportCoAuthor.findMany({
          where: { reportId: id },
          select: { userId: true },
        })
      : Promise.resolve([]),
  ]);

  if (session.user.role === "QA" && !assigned) {
    return NextResponse.json(
      { error: "Anda tidak di-assign ke project ini" },
      { status: 403 }
    );
  }

  const changedFields = diffFields(report, data);

  const updated = await prisma.$transaction(async (tx) => {
    if (isDraft) {
      const currentIds = new Set(currentCoAuthors.map((c) => c.userId));
      const nextIds = new Set([report.userId, ...data.coAuthorUserIds]);

      const toAdd = [...nextIds].filter((uid) => !currentIds.has(uid));
      const toRemove = [...currentIds].filter(
        (uid) => !nextIds.has(uid) && uid !== report.userId
      );

      if (toRemove.length) {
        await tx.reportCoAuthor.deleteMany({
          where: { reportId: id, userId: { in: toRemove } },
        });
      }
      if (toAdd.length) {
        await tx.reportCoAuthor.createMany({
          data: toAdd.map((userId) => ({ reportId: id, userId })),
        });
      }
      if (changedFields.length) {
        await tx.reportCoAuthor.updateMany({
          where: { reportId: id },
          data: { approved: false, approvedAt: null },
        });
      }
    }

    const result = await tx.weeklyReport.update({
      where: { id },
      data: {
        projectId: data.projectId,
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        summary: linesToText(data.summary),
        blocker: linesToText(data.blocker),
        nextWeekPlan: linesToText(data.nextWeekPlan),
        notes: data.notes || null,
        totalTestCase: data.totalTestCase,
        totalTcExecuted: data.totalTcExecuted,
        totalTcBE: data.totalTcBE,
        totalTcBEAutomated: data.totalTcBEAutomated,
        totalTcBEPassed: data.totalTcBEPassed,
        totalTcBEFailed: data.totalTcBEFailed,
        totalTcFE: data.totalTcFE,
        totalTcFEAutomated: data.totalTcFEAutomated,
        totalTcFEPassed: data.totalTcFEPassed,
        totalTcFEFailed: data.totalTcFEFailed,
        productionIncidentCount: data.productionIncidentCount,
        bugDocumentUrl: data.bugDocumentUrl || null,
        bugs: {
          deleteMany: {},
          create: data.bugs
            .filter((bug) => bug.title || bug.description || bug.link)
            .map((bug) => ({
              title: bug.title,
              description: bug.description || null,
              link: bug.link || null,
            })),
        },
        ...(isDraft
          ? { status: "DRAFT" as const }
          : session.user.role === "QA"
            ? {
                status: "SUBMITTED" as const,
                reviewNote: null,
                reviewedById: null,
                reviewedAt: null,
              }
            : {}),
      },
      include: { bugs: true },
    });

    if (changedFields.length) {
      await logActivity(tx, {
        reportId: id,
        userId: session.user.id,
        action: "EDITED",
        changedFields,
      });
    }

    return result;
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return errorResponse("Sesi kamu sudah berakhir. Silakan login ulang lalu coba lagi.", 401);
  }

  const { id } = await params;
  const { report, allowed } = await loadReportScalars(id, session.user);
  if (!report) return errorResponse("Data tidak ditemukan. Mungkin sudah dihapus — coba muat ulang halaman.", 404);
  if (!allowed) return errorResponse("Kamu tidak punya akses ke report ini.", 403);
  if (report.status === "APPROVED" && session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Report yang sudah di-approve tidak bisa dihapus" },
      { status: 403 }
    );
  }

  await prisma.weeklyReport.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
