"use client";

import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const WEEK_OPTS = { weekStartsOn: 1 } as const; // Monday
const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/**
 * Dates travel as plain "YYYY-MM-DD" strings. Parsing and formatting stay in
 * local time so a date never shifts a day across the UTC boundary.
 */
function parseLocal(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toLocalISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatShort(date: Date) {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDayMonth(date: Date) {
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function formatMonthTitle(date: Date) {
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

/** Monday–Friday, matching how the team reports its weeks. */
function workWeek(reference: Date) {
  const start = startOfWeek(reference, WEEK_OPTS);
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  return { from: start, to: end };
}

/** Calendar weeks that touch the current month, clipped to the month itself. */
function weeksOfMonth(reference: Date) {
  const monthStart = startOfMonth(reference);
  const monthEnd = endOfMonth(reference);
  const weeks: { label: string; from: Date; to: Date }[] = [];

  let cursor = startOfWeek(monthStart, WEEK_OPTS);
  let index = 1;
  while (cursor <= monthEnd) {
    const weekEnd = endOfWeek(cursor, WEEK_OPTS);
    const from = cursor < monthStart ? monthStart : cursor;
    const to = weekEnd > monthEnd ? monthEnd : weekEnd;
    weeks.push({ label: `Minggu ${index}`, from, to });
    cursor = addDays(weekEnd, 1);
    index += 1;
  }
  return weeks;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function MonthGrid({
  month,
  from,
  to,
  hovered,
  onPick,
  onHover,
}: {
  month: Date;
  from: Date | null;
  to: Date | null;
  hovered: Date | null;
  onPick: (day: Date) => void;
  onHover: (day: Date | null) => void;
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), WEEK_OPTS),
    end: endOfWeek(endOfMonth(month), WEEK_OPTS),
  });

  // While picking the second date, preview the range under the cursor.
  const previewEnd = to ?? (from && hovered && isAfter(hovered, from) ? hovered : null);
  const today = new Date();

  return (
    <div className="w-64">
      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="pb-1 text-center text-xs font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}

        {days.map((day) => {
          const outside = !isSameMonth(day, month);
          const isStart = from && isSameDay(day, from);
          const isEnd = previewEnd && isSameDay(day, previewEnd);
          const inRange =
            from &&
            previewEnd &&
            isAfter(day, from) &&
            isBefore(day, previewEnd);
          const isEdge = isStart || isEnd;
          // A one-day range needs no connecting band behind it.
          const spansDays = !!from && !!previewEnd && !isSameDay(from, previewEnd);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex justify-center",
                inRange && "bg-accent",
                spansDays && isStart && "rounded-l-md bg-accent",
                spansDays && isEnd && "rounded-r-md bg-accent"
              )}
            >
              <button
                type="button"
                onClick={() => onPick(day)}
                onMouseEnter={() => onHover(day)}
                onMouseLeave={() => onHover(null)}
                className={cn(
                  "size-8 rounded-md text-sm tabular-nums transition-colors",
                  outside && !isEdge && "text-muted-foreground/50",
                  !isEdge && "hover:bg-accent",
                  isSameDay(day, today) && !isEdge && "font-semibold underline",
                  isEdge &&
                    "bg-primary font-medium text-primary-foreground hover:bg-primary"
                )}
              >
                {day.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PresetRow({
  label,
  hint,
  active,
  onClick,
}: {
  label: string;
  hint: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-baseline justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
        active
          ? "bg-background font-medium ring-1 ring-border"
          : "hover:bg-background/70"
      )}
    >
      <span className="shrink-0">{label}</span>
      <span className="truncate text-xs text-muted-foreground">{hint}</span>
    </button>
  );
}

export function DateRangePicker({
  from,
  to,
  onChange,
  align = "end",
  className,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  align?: "start" | "end" | "center";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState<Date | null>(null);
  const [hovered, setHovered] = useState<Date | null>(null);
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(parseLocal(from) ?? new Date())
  );

  const selectedFrom = parseLocal(from);
  const selectedTo = parseLocal(to);

  // While the second click is pending, the draft start is the live selection.
  const shownFrom = draftFrom ?? selectedFrom;
  const shownTo = draftFrom ? null : selectedTo;

  const today = new Date();
  const thisWeek = workWeek(today);
  const lastWeek = workWeek(subWeeks(today, 1));
  const monthToDate = { from: startOfMonth(today), to: today };
  const monthWeeks = weeksOfMonth(today);

  function commit(nextFrom: Date, nextTo: Date) {
    onChange(toLocalISO(nextFrom), toLocalISO(nextTo));
    setDraftFrom(null);
    setHovered(null);
    setOpen(false);
  }

  function handlePick(day: Date) {
    if (!draftFrom) {
      setDraftFrom(day);
      return;
    }
    if (isBefore(day, draftFrom)) {
      commit(day, draftFrom);
      return;
    }
    commit(draftFrom, day);
  }

  function isPreset(range: { from: Date; to: Date }) {
    return (
      !!selectedFrom &&
      !!selectedTo &&
      isSameDay(selectedFrom, range.from) &&
      isSameDay(selectedTo, range.to)
    );
  }

  const label =
    selectedFrom && selectedTo
      ? `${formatShort(selectedFrom)} – ${formatShort(selectedTo)}`
      : "Pilih periode";

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraftFrom(null);
          setHovered(null);
          setViewMonth(startOfMonth(selectedFrom ?? new Date()));
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn("justify-between gap-2 font-normal", className)}
          >
            <span className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              {label}
            </span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent align={align} className="w-auto max-w-[min(46rem,95vw)] p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="max-h-[22rem] w-full shrink-0 space-y-1 overflow-y-auto border-b bg-muted/40 p-2.5 sm:w-52 sm:border-b-0 sm:border-r">
            <div className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Pilihan cepat
            </div>
            <PresetRow
              label="Minggu ini"
              hint={`${formatDayMonth(thisWeek.from)} – ${formatDayMonth(thisWeek.to)}`}
              active={isPreset(thisWeek)}
              onClick={() => commit(thisWeek.from, thisWeek.to)}
            />
            <PresetRow
              label="1 minggu lalu"
              hint={`${formatDayMonth(lastWeek.from)} – ${formatDayMonth(lastWeek.to)}`}
              active={isPreset(lastWeek)}
              onClick={() => commit(lastWeek.from, lastWeek.to)}
            />
            <PresetRow
              label="Bulan ini"
              hint={`${formatDayMonth(monthToDate.from)} – ${formatDayMonth(monthToDate.to)}`}
              active={isPreset(monthToDate)}
              onClick={() => commit(monthToDate.from, monthToDate.to)}
            />

            <div className="flex items-center justify-between px-2.5 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Minggu bulan ini</span>
              <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] tabular-nums ring-1 ring-border">
                {monthWeeks.length}
              </span>
            </div>
            {monthWeeks.map((week) => (
              <PresetRow
                key={week.label}
                label={week.label}
                hint={`${formatDayMonth(week.from)} – ${formatDayMonth(week.to)}`}
                active={isPreset(week)}
                onClick={() => commit(week.from, week.to)}
              />
            ))}
          </div>

          <div className="p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                type="button"
                aria-label="Bulan sebelumnya"
                onClick={() => setViewMonth((m) => addMonths(m, -1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <div className="flex flex-1 justify-around text-sm font-medium">
                <span>{formatMonthTitle(viewMonth)}</span>
                <span className="hidden sm:inline">
                  {formatMonthTitle(addMonths(viewMonth, 1))}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                type="button"
                aria-label="Bulan berikutnya"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <div className="flex gap-4">
              <MonthGrid
                month={viewMonth}
                from={shownFrom}
                to={shownTo}
                hovered={hovered}
                onPick={handlePick}
                onHover={setHovered}
              />
              <div className="hidden sm:block">
                <MonthGrid
                  month={addMonths(viewMonth, 1)}
                  from={shownFrom}
                  to={shownTo}
                  hovered={hovered}
                  onPick={handlePick}
                  onHover={setHovered}
                />
              </div>
            </div>

            {draftFrom && (
              <p className="mt-2 text-xs text-muted-foreground">
                Mulai {formatShort(draftFrom)} — pilih tanggal akhir.
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
