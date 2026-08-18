import { prisma } from "@/lib/prisma";

export async function findOverlappingReport({
  projectId,
  userId,
  weekStart,
  weekEnd,
  excludeReportId,
}: {
  projectId: string;
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  excludeReportId?: string;
}) {
  return prisma.weeklyReport.findFirst({
    where: {
      projectId,
      userId,
      weekStart: { lte: weekEnd },
      weekEnd: { gte: weekStart },
      ...(excludeReportId ? { id: { not: excludeReportId } } : {}),
    },
  });
}
