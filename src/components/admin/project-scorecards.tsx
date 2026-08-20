import type { ProjectScorecard } from "@/lib/dashboard-aggregate";
import { cn } from "@/lib/utils";
import { CalendarRange, Gauge, Bot, Bug } from "lucide-react";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const projectStatusLabel: Record<ProjectScorecard["projectStatus"], string> = {
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  DONE: "Done",
};

/**
 * A meter rather than a donut: the reader's job here is comparing one ratio
 * across projects, and aligned bar lengths compare far better than arc angles.
 */
function Meter({
  value,
  className,
  trackClassName,
}: {
  value: number;
  className: string;
  trackClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-muted",
        trackClassName
      )}
    >
      <div
        className={cn("h-full rounded-full", className)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function RowLabel({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof Gauge;
  title: string;
  hint: string;
}) {
  return (
    <div className="sticky left-0 z-10 flex gap-3 border-t bg-card p-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium leading-tight">{title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
      </div>
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2 border-l border-t p-4">{children}</div>;
}

/** Backend and frontend are distinct categories, so each keeps its own hue. */
function CoverageRow({
  label,
  colorClass,
  pctValue,
  automated,
  total,
}: {
  label: string;
  colorClass: string;
  pctValue: number;
  automated: number;
  total: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {automated}/{total} &middot; {pctValue}%
        </span>
      </div>
      <Meter value={pctValue} className={colorClass} />
    </div>
  );
}

export function ProjectScorecards({ cards }: { cards: ProjectScorecard[] }) {
  if (cards.length === 0) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        Tidak ada data project untuk filter ini.
      </p>
    );
  }

  const maxBugs = Math.max(...cards.map((c) => c.bugCount), 1);

  return (
    <div className="overflow-x-auto">
      <div
        className="grid w-full border-b"
        style={{
          gridTemplateColumns: `13rem repeat(${cards.length}, minmax(15rem, 1fr))`,
        }}
      >
        {/* Header */}
        <div className="sticky left-0 z-10 bg-card p-4" />
        {cards.map((c) => (
          <div key={c.projectId} className="border-l p-4">
            <div className="truncate text-sm font-semibold" title={c.projectName}>
              {c.projectName}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {c.projectCode} &middot; {projectStatusLabel[c.projectStatus]}
            </div>
          </div>
        ))}

        {/* Periode */}
        <RowLabel
          icon={CalendarRange}
          title="Periode project"
          hint="Tanggal mulai & selesai"
        />
        {cards.map((c) => (
          <Cell key={c.projectId}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Start</span>
              <span className="font-medium tabular-nums">
                {formatDate(c.startDate)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="text-muted-foreground">End</span>
              <span className="font-medium tabular-nums">
                {formatDate(c.endDate)}
              </span>
            </div>
          </Cell>
        ))}

        {/* Progress testing */}
        <RowLabel
          icon={Gauge}
          title="Progress testing"
          hint="TC executed dari total TC"
        />
        {cards.map((c) => (
          <Cell key={c.projectId}>
            <div className="text-2xl font-semibold leading-none">
              {c.executedPct}%
            </div>
            <Meter value={c.executedPct} className="bg-[#2a78d6] dark:bg-[#3987e5]" />
            <div className="text-xs text-muted-foreground tabular-nums">
              {c.totalTcExecuted} / {c.totalTestCase} TC executed
            </div>
          </Cell>
        ))}

        {/* Automation coverage */}
        <RowLabel
          icon={Bot}
          title="Coverage automation"
          hint="TC automated dari total TC"
        />
        {cards.map((c) => (
          <Cell key={c.projectId}>
            <CoverageRow
              label="Backend"
              colorClass="bg-[#eb6834] dark:bg-[#d95926]"
              pctValue={c.beCoveragePct}
              automated={c.totalTcBEAutomated}
              total={c.totalTcBE}
            />
            <CoverageRow
              label="Frontend"
              colorClass="bg-[#1baf7a] dark:bg-[#199e70]"
              pctValue={c.feCoveragePct}
              automated={c.totalTcFEAutomated}
              total={c.totalTcFE}
            />
          </Cell>
        ))}

        {/* Bug production */}
        <RowLabel
          icon={Bug}
          title="Bug production"
          hint="Total incident pada periode"
        />
        {cards.map((c) => (
          <Cell key={c.projectId}>
            <div className="text-2xl font-semibold leading-none">
              {c.bugCount}
            </div>
            <Meter
              value={(c.bugCount / maxBugs) * 100}
              className="bg-[#d03b3b]"
            />
            <div className="text-xs text-muted-foreground">
              {c.bugCount === 0
                ? "Tidak ada incident"
                : `incident dari ${c.reportCount} report`}
            </div>
          </Cell>
        ))}
      </div>
    </div>
  );
}
