import type { ReportStatus } from "@prisma/client";

export const reportStatusMeta: Record<
  ReportStatus,
  { label: string; description: string; badgeClass: string }
> = {
  DRAFT: {
    label: "Draft",
    description: "Belum disubmit ke QA Lead",
    badgeClass: "bg-muted text-muted-foreground",
  },
  SUBMITTED: {
    label: "Submitted",
    description: "Menunggu review & approval dari QA Lead",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  },
  NEED_REVISION: {
    label: "Need Revision",
    description: "Perlu direvisi sesuai catatan QA Lead",
    badgeClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
  APPROVED: {
    label: "Approved",
    description: "Sudah disetujui QA Lead",
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
};

export function currentWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { weekStart: monday, weekEnd: sunday };
}

export function currentWorkWeekRange() {
  const { weekStart } = currentWeekRange();
  const friday = new Date(weekStart);
  friday.setDate(weekStart.getDate() + 4);
  return { weekStart, weekEnd: friday };
}

export function currentMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export function linesToText(lines: string[]) {
  return lines.map((l) => l.trim()).filter(Boolean).join("\n");
}

export function textToLines(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function pct(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export function automationSummary(report: {
  totalTestCase: number;
  totalTcBE: number;
  totalTcBEAutomated: number;
  totalTcFE: number;
  totalTcFEAutomated: number;
}) {
  return {
    bePct: pct(report.totalTcBEAutomated, report.totalTcBE),
    fePct: pct(report.totalTcFEAutomated, report.totalTcFE),
    overallPct: pct(
      report.totalTcBEAutomated + report.totalTcFEAutomated,
      report.totalTestCase
    ),
  };
}
