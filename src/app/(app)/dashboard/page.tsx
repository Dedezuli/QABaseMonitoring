import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { FolderKanban, Clock, RotateCcw, CheckCircle2 } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { currentMonthRange, reportStatusMeta } from "@/lib/report-utils";
import { PeriodPicker } from "@/components/period-picker";
import { StatusBadge } from "@/components/reports/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from: fromParam, to: toParam } = await searchParams;
  const defaults = currentMonthRange();
  const from = fromParam ?? defaults.from;
  const to = toParam ?? defaults.to;

  const session = await auth();
  const userId = session!.user.id;

  const [assignedCount, reportsInPeriod] = await Promise.all([
    prisma.projectAssignment.count({ where: { userId } }),
    prisma.weeklyReport.findMany({
      where: {
        userId,
        weekStart: { gte: new Date(from), lte: new Date(to) },
      },
      include: { project: { select: { name: true } } },
      orderBy: { weekStart: "desc" },
    }),
  ]);

  const pending = reportsInPeriod.filter((r) => r.status === "SUBMITTED").length;
  const needRevision = reportsInPeriod.filter((r) => r.status === "NEED_REVISION").length;
  const approved = reportsInPeriod.filter((r) => r.status === "APPROVED").length;
  const recent = reportsInPeriod.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan report QA kamu.
          </p>
        </div>
        <div className="space-y-1 text-right">
          <div className="text-xs text-muted-foreground">Periode report</div>
          <PeriodPicker from={from} to={to} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={FolderKanban}
          label="Assigned projects"
          value={assignedCount}
          hint="Active"
        />
        <SummaryCard
          icon={Clock}
          label="Pending approval"
          value={pending}
          hint={pending === 0 ? "All clear" : "Menunggu review"}
        />
        <SummaryCard
          icon={RotateCcw}
          label="Need revision"
          value={needRevision}
          hint={needRevision === 0 ? "No issues" : "Perlu direvisi"}
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Approved"
          value={approved}
          hint="Completed"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My recent reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Week</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Belum ada report pada periode ini.
                    </TableCell>
                  </TableRow>
                )}
                {recent.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.project.name}</TableCell>
                    <TableCell>
                      {formatDate(r.weekStart)} &rarr; {formatDate(r.weekEnd)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <StatusBadge status={r.status} />
                        <div className="text-xs text-muted-foreground">
                          {r.status === "NEED_REVISION" && r.reviewNote
                            ? r.reviewNote
                            : reportStatusMeta[r.status].description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/reports/${r.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
            <div className="text-xs text-muted-foreground">{hint}</div>
          </div>
          <div className="flex size-8 items-center justify-center rounded-md bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
