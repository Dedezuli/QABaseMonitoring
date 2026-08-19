import type { ActivityAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function logActivity(
  tx: Prisma.TransactionClient | typeof prisma,
  {
    reportId,
    userId,
    action,
    changedFields,
  }: {
    reportId: string;
    userId: string;
    action: ActivityAction;
    changedFields?: string[];
  }
) {
  return tx.reportActivity.create({
    data: {
      reportId,
      userId,
      action,
      changedFields: changedFields?.length ? changedFields.join(",") : null,
    },
  });
}

const TRACKED_FIELDS = [
  "projectId",
  "weekStart",
  "weekEnd",
  "summary",
  "blocker",
  "nextWeekPlan",
  "notes",
  "productionIncidentCount",
  "bugDocumentUrl",
  "totalTestCase",
  "totalTcExecuted",
  "totalTcBE",
  "totalTcFE",
  "totalTcBEAutomated",
  "totalTcBEPassed",
  "totalTcBEFailed",
  "totalTcFEAutomated",
  "totalTcFEPassed",
  "totalTcFEFailed",
] as const;

export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>
) {
  const changed: string[] = [];
  for (const field of TRACKED_FIELDS) {
    const a = before[field];
    const b = after[field];
    const aVal = a instanceof Date ? a.getTime() : a;
    const bVal = b instanceof Date ? b.getTime() : b;
    if (aVal !== bVal) changed.push(field);
  }
  return changed;
}

export const activityLabel: Record<ActivityAction, string> = {
  CREATED: "Membuat draft",
  EDITED: "Mengedit konten",
  COAUTHOR_APPROVED: "Approve sebagai co-author",
  SUBMITTED: "Mengajukan untuk approval QA",
  APPROVED: "Report disetujui",
  NEED_REVISION: "Meminta revisi",
};
