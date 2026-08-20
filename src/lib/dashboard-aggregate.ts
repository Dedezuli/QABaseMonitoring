import type { ProjectStatus, ReportStatus } from "@prisma/client";
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

export type ScorecardInput = {
  projectId: string;
  projectName: string;
  projectCode: string;
  projectStatus: ProjectStatus;
  startDate: Date | null;
  endDate: Date | null;
  weekStart: Date;
  totalTestCase: number;
  totalTcExecuted: number;
  totalTcBE: number;
  totalTcBEAutomated: number;
  totalTcFE: number;
  totalTcFEAutomated: number;
  bugCount: number;
};

export type ProjectScorecard = {
  projectId: string;
  projectName: string;
  projectCode: string;
  projectStatus: ProjectStatus;
  startDate: Date | null;
  endDate: Date | null;
  latestWeek: Date;
  reportCount: number;
  totalTestCase: number;
  totalTcExecuted: number;
  executedPct: number;
  totalTcBE: number;
  totalTcBEAutomated: number;
  beCoveragePct: number;
  totalTcFE: number;
  totalTcFEAutomated: number;
  feCoveragePct: number;
  bugCount: number;
};

/**
 * Test-case counters carry forward week to week, so they describe the project's
 * standing as of its most recent report rather than something to sum. Bugs are
 * per-week events, so those accumulate across the selected range.
 */
export function buildProjectScorecards(
  rows: ScorecardInput[]
): ProjectScorecard[] {
  const cards = new Map<string, ProjectScorecard>();

  for (const r of rows) {
    const existing = cards.get(r.projectId);

    if (!existing) {
      cards.set(r.projectId, {
        projectId: r.projectId,
        projectName: r.projectName,
        projectCode: r.projectCode,
        projectStatus: r.projectStatus,
        startDate: r.startDate,
        endDate: r.endDate,
        latestWeek: r.weekStart,
        reportCount: 1,
        totalTestCase: r.totalTestCase,
        totalTcExecuted: r.totalTcExecuted,
        executedPct: pct(r.totalTcExecuted, r.totalTestCase),
        totalTcBE: r.totalTcBE,
        totalTcBEAutomated: r.totalTcBEAutomated,
        beCoveragePct: pct(r.totalTcBEAutomated, r.totalTcBE),
        totalTcFE: r.totalTcFE,
        totalTcFEAutomated: r.totalTcFEAutomated,
        feCoveragePct: pct(r.totalTcFEAutomated, r.totalTcFE),
        bugCount: r.bugCount,
      });
      continue;
    }

    existing.reportCount += 1;
    existing.bugCount += r.bugCount;

    if (r.weekStart > existing.latestWeek) {
      existing.latestWeek = r.weekStart;
      existing.totalTestCase = r.totalTestCase;
      existing.totalTcExecuted = r.totalTcExecuted;
      existing.executedPct = pct(r.totalTcExecuted, r.totalTestCase);
      existing.totalTcBE = r.totalTcBE;
      existing.totalTcBEAutomated = r.totalTcBEAutomated;
      existing.beCoveragePct = pct(r.totalTcBEAutomated, r.totalTcBE);
      existing.totalTcFE = r.totalTcFE;
      existing.totalTcFEAutomated = r.totalTcFEAutomated;
      existing.feCoveragePct = pct(r.totalTcFEAutomated, r.totalTcFE);
    }
  }

  return [...cards.values()].sort((a, b) => b.executedPct - a.executedPct);
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
