import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { reviewActionSchema } from "@/lib/validation";
import { logActivity } from "@/lib/report-activity";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const parsed = reviewActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.action === "NEED_REVISION" && !parsed.data.note.trim()) {
    return NextResponse.json(
      { error: "Catatan revisi wajib diisi" },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.weeklyReport.update({
        where: { id },
        data: {
          status: parsed.data.action,
          reviewNote:
            parsed.data.action === "NEED_REVISION" ? parsed.data.note : null,
          reviewedById: user!.id,
          reviewedAt: new Date(),
        },
      });
      await logActivity(tx, {
        reportId: id,
        userId: user!.id,
        action: parsed.data.action,
      });
      return result;
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json(
        { error: "Report tidak ditemukan" },
        { status: 404 }
      );
    }
    throw e;
  }
}
