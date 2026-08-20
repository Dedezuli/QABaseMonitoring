import type { ProjectScorecard } from "@/lib/dashboard-aggregate";
import { cn } from "@/lib/utils";
import { CalendarRange, Gauge, Bot, ListChecks, Bug } from "lucide-react";

/**
 * Fixed hue order, validated for colorblind separation and contrast against
 * both the light and dark card surface. A project keeps its slot regardless of
 * the active filter, so filtering never repaints the survivors. Past the eighth
 * project the accent falls back to neutral rather than inventing a ninth hue.
 */
const PROJECT_HUES = [
  { light: "#2a78d6", dark: "#3987e5" },
  { light: "#eb6834", dark: "#d95926" },
  { light: "#1baf7a", dark: "#199e70" },
  { light: "#eda100", dark: "#c98500" },
  { light: "#e87ba4", dark: "#d55181" },
  { light: "#008300", dark: "#008300" },
  { light: "#4a3aa7", dark: "#9085e9" },
  { light: "#e34948", dark: "#e66767" },
] as const;

const NEUTRAL_HUE = { light: "#52514e", dark: "#c3c2b7" } as const;

const STATUS = {
  passed: "#0ca30c",
  failed: "#d03b3b",
  pending: "#898781",
} as const;

function hueFor(index: number | undefined) {
  if (index === undefined || index >= PROJECT_HUES.length) return NEUTRAL_HUE;
  return PROJECT_HUES[index];
}

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

/** Sets both light and dark values so the mode swap happens in CSS, not JS. */
function hueVars(hue: { light: string; dark: string }) {
  return {
    "--hue": hue.light,
    "--hue-dark": hue.dark,
  } as React.CSSProperties;
}

function Donut({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div className="relative size-[72px] shrink-0">
      <svg viewBox="0 0 64 64" className="size-full -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="7"
          className="stroke-muted"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className="stroke-[var(--hue)] dark:stroke-[var(--hue-dark)]"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-semibold">{value}%</span>
      </div>
    </div>
  );
}

/** Paired columns: total is the same hue at reduced weight, automated is solid. */
function ColumnPair({
  groupLabel,
  total,
  automated,
  scaleMax,
}: {
  groupLabel: string;
  total: number;
  automated: number;
  scaleMax: number;
}) {
  const height = (v: number) =>
    scaleMax > 0 ? Math.max(v > 0 ? 3 : 0, (v / scaleMax) * 64) : 0;

  const bars = [
    { label: "Total", value: total, solid: false },
    { label: "Auto", value: automated, solid: true },
  ];

  return (
    <div className="flex-1 space-y-1">
      <div className="flex items-end justify-center gap-2 border-b pb-0">
        {bars.map((b) => (
          <div key={b.label} className="flex w-8 flex-col items-center gap-1">
            <span className="text-[11px] font-medium tabular-nums">
              {b.value}
            </span>
            <div
              className={cn(
                "w-full rounded-t-sm",
                b.solid
                  ? "bg-[var(--hue)] dark:bg-[var(--hue-dark)]"
                  : "bg-[var(--hue)]/35 dark:bg-[var(--hue-dark)]/35"
              )}
              style={{ height: `${height(b.value)}px` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2">
        {bars.map((b) => (
          <span
            key={b.label}
            className="w-8 text-center text-[10px] text-muted-foreground"
          >
            {b.label}
          </span>
        ))}
      </div>
      <div className="text-center text-[11px] font-medium">{groupLabel}</div>
    </div>
  );
}

function HBar({
  label,
  value,
  scaleMax,
  color,
}: {
  label: string;
  value: number;
  scaleMax: number;
  color: string;
}) {
  const width = scaleMax > 0 ? (value / scaleMax) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-[11px] text-muted-foreground">
        {label}
      </span>
      <div className="h-3 flex-1 overflow-hidden rounded-sm bg-muted">
        <div
          className="h-full rounded-sm"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-[11px] font-medium tabular-nums">
        {value}
      </span>
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
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium leading-tight">{title}</div>
        <div className="mt-0.5 text-xs leading-tight text-muted-foreground">
          {hint}
        </div>
      </div>
    </div>
  );
}

function Cell({
  children,
  hue,
  className,
}: {
  children: React.ReactNode;
  hue: { light: string; dark: string };
  className?: string;
}) {
  return (
    <div
      className={cn("border-l border-t p-4", className)}
      style={hueVars(hue)}
    >
      {children}
    </div>
  );
}

export function ProjectScorecards({
  cards,
  colorIndexById,
}: {
  cards: ProjectScorecard[];
  colorIndexById: Record<string, number>;
}) {
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
        {cards.map((c) => {
          const hue = hueFor(colorIndexById[c.projectId]);
          return (
            <div
              key={c.projectId}
              className="border-l border-t-[3px] border-t-[var(--hue)] bg-[var(--hue)]/10 p-4 dark:border-t-[var(--hue-dark)] dark:bg-[var(--hue-dark)]/15"
              style={hueVars(hue)}
            >
              <div
                className="truncate text-sm font-semibold"
                title={c.projectName}
              >
                {c.projectName}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {c.projectCode} &middot; {projectStatusLabel[c.projectStatus]}
              </div>
            </div>
          );
        })}

        {/* Periode */}
        <RowLabel
          icon={CalendarRange}
          title="Periode project"
          hint="Tanggal mulai & selesai"
        />
        {cards.map((c) => (
          <Cell key={c.projectId} hue={hueFor(colorIndexById[c.projectId])}>
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="font-medium">Start</span>
                <span className="text-muted-foreground tabular-nums">
                  {formatDate(c.startDate)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="font-medium">End</span>
                <span className="text-muted-foreground tabular-nums">
                  {formatDate(c.endDate)}
                </span>
              </div>
            </div>
          </Cell>
        ))}

        {/* Overall progress */}
        <RowLabel
          icon={Gauge}
          title="Overall progress"
          hint="TC executed dari total TC"
        />
        {cards.map((c) => (
          <Cell key={c.projectId} hue={hueFor(colorIndexById[c.projectId])}>
            <div className="flex flex-col items-center gap-1">
              <Donut value={c.executedPct} />
              <div className="text-xs text-muted-foreground">Completed</div>
              <div className="text-[11px] text-muted-foreground tabular-nums">
                {c.totalTcExecuted} / {c.totalTestCase} TC
              </div>
            </div>
          </Cell>
        ))}

        {/* Automation coverage */}
        <RowLabel
          icon={Bot}
          title="Coverage automation"
          hint="Total TC vs yang di-automate"
        />
        {cards.map((c) => {
          const scaleMax = Math.max(c.totalTcBE, c.totalTcFE, 1);
          return (
            <Cell key={c.projectId} hue={hueFor(colorIndexById[c.projectId])}>
              <div className="flex gap-3">
                <ColumnPair
                  groupLabel={`BE ${c.beCoveragePct}%`}
                  total={c.totalTcBE}
                  automated={c.totalTcBEAutomated}
                  scaleMax={scaleMax}
                />
                <ColumnPair
                  groupLabel={`FE ${c.feCoveragePct}%`}
                  total={c.totalTcFE}
                  automated={c.totalTcFEAutomated}
                  scaleMax={scaleMax}
                />
              </div>
            </Cell>
          );
        })}

        {/* Hasil test */}
        <RowLabel
          icon={ListChecks}
          title="Hasil test"
          hint="Passed, failed, & belum dieksekusi"
        />
        {cards.map((c) => {
          const scaleMax = Math.max(c.totalTestCase, 1);
          return (
            <Cell key={c.projectId} hue={hueFor(colorIndexById[c.projectId])}>
              <div className="space-y-2">
                <HBar
                  label="Passed"
                  value={c.passedCount}
                  scaleMax={scaleMax}
                  color={STATUS.passed}
                />
                <HBar
                  label="Failed"
                  value={c.failedCount}
                  scaleMax={scaleMax}
                  color={STATUS.failed}
                />
                <HBar
                  label="Belum"
                  value={c.notExecutedCount}
                  scaleMax={scaleMax}
                  color={STATUS.pending}
                />
              </div>
            </Cell>
          );
        })}

        {/* Bug production */}
        <RowLabel
          icon={Bug}
          title="Bug production"
          hint="Total incident pada periode"
        />
        {cards.map((c) => (
          <Cell key={c.projectId} hue={hueFor(colorIndexById[c.projectId])}>
            <div className="space-y-2">
              <div className="text-2xl font-semibold leading-none">
                {c.bugCount}
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(c.bugCount / maxBugs) * 100}%`,
                    backgroundColor: STATUS.failed,
                  }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {c.bugCount === 0
                  ? "Tidak ada incident"
                  : `incident dari ${c.reportCount} report`}
              </div>
            </div>
          </Cell>
        ))}
      </div>
    </div>
  );
}
