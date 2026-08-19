import type { ReportStatus } from "@prisma/client";
import { pct } from "@/lib/report-utils";

export type ReportForAggregate = {
  id: string;
  projectId: string;
  projectName: string;
  userId: string;
  userName: string;
  weekStart: Date;
  totalTestCase: number;
  totalTcExecuted: number;
  totalTcBE: number;
  totalTcBEAutomated: number;
  totalTcFE: number;
  totalTcFEAutomated: number;
  bugCount: number;
  status: ReportStatus;
};

export type GroupStat = {
  key: string;
  label: string;
  reportCount: number;
  totalTestCase: number;
  totalTcBE: number;
  totalTcBEAutomated: number;
  totalTcFE: number;
  totalTcFEAutomated: number;
  bugCount: number;
  bePct: number;
  fePct: number;
  overallPct: number;
};

function emptyGroup(key: string, label: string): GroupStat {
  return {
    key,
    label,
    reportCount: 0,
    totalTestCase: 0,
    totalTcBE: 0,
    totalTcBEAutomated: 0,
    totalTcFE: 0,
    totalTcFEAutomated: 0,
    bugCount: 0,
    bePct: 0,
    fePct: 0,
    overallPct: 0,
  };
}

function accumulate(group: GroupStat, r: ReportForAggregate) {
  group.reportCount += 1;
  group.totalTestCase += r.totalTestCase;
  group.totalTcBE += r.totalTcBE;
  group.totalTcBEAutomated += r.totalTcBEAutomated;
  group.totalTcFE += r.totalTcFE;
  group.totalTcFEAutomated += r.totalTcFEAutomated;
  group.bugCount += r.bugCount;
}

function finalize<T extends GroupStat>(group: T): T {
  group.bePct = pct(group.totalTcBEAutomated, group.totalTcBE);
  group.fePct = pct(group.totalTcFEAutomated, group.totalTcFE);
  group.overallPct = pct(
    group.totalTcBEAutomated + group.totalTcFEAutomated,
    group.totalTestCase
  );
  return group;
}

function groupBy(
  reports: ReportForAggregate[],
  keyOf: (r: ReportForAggregate) => string,
  labelOf: (r: ReportForAggregate) => string
): GroupStat[] {
  const groups = new Map<string, GroupStat>();
  for (const r of reports) {
    const key = keyOf(r);
    if (!groups.has(key)) groups.set(key, emptyGroup(key, labelOf(r)));
    accumulate(groups.get(key)!, r);
  }
  return [...groups.values()]
    .map(finalize)
    .sort((a, b) => b.totalTestCase - a.totalTestCase);
}

export function aggregateByProject(reports: ReportForAggregate[]) {
  return groupBy(
    reports,
    (r) => r.projectId,
    (r) => r.projectName
  );
}

export function aggregateByUser(reports: ReportForAggregate[]) {
  return groupBy(
    reports,
    (r) => r.userId,
    (r) => r.userName
  );
}

export function summarize(reports: ReportForAggregate[]) {
  return finalize(
    reports.reduce((acc, r) => {
      accumulate(acc, r);
      return acc;
    }, emptyGroup("summary", "Semua"))
  );
}

export function weeklyTrend(reports: ReportForAggregate[]) {
  const groups = new Map<string, GroupStat & { weekStart: string }>();
  for (const r of reports) {
    const key = r.weekStart.toISOString().slice(0, 10);
    if (!groups.has(key)) {
      groups.set(key, { ...emptyGroup(key, key), weekStart: key });
    }
    accumulate(groups.get(key)!, r);
  }
  return [...groups.values()]
    .map((g) => finalize(g))
    .sort((a, b) => a.key.localeCompare(b.key));
}
