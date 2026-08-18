import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/report-activity";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const coAuthor = await prisma.reportCoAuthor.findUnique({
    where: { reportId_userId: { reportId: id, userId: session.user.id } },
  });
  if (!coAuthor) {
    return NextResponse.json(
      { error: "Anda bukan co-author di report ini" },
      { status: 403 }
    );
  }
  if (coAuthor.approved) {
    return NextResponse.json(coAuthor);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.reportCoAuthor.update({
      where: { id: coAuthor.id },
      data: { approved: true, approvedAt: new Date() },
    });
    await logActivity(tx, {
      reportId: id,
      userId: session.user.id,
      action: "COAUTHOR_APPROVED",
    });
    return result;
  });

  return NextResponse.json(updated);
}
