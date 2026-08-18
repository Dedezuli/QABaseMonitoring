"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ProjectStatus, ReportStatus } from "@prisma/client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/reports/status-badge";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL = "__all__";

const projectStatusLabel: Record<ProjectStatus, string> = {
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  DONE: "Done",
};

export type ProjectListRow = {
  id: string;
  name: string;
  code: string;
  status: ProjectStatus;
  currentWeekReportStatus: ReportStatus | null;
};

export function ProjectsList({ projects }: { projects: ProjectListRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q);
      const matchesStatus = statusFilter === ALL || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name or code..."
            className="pl-8"
          />
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Filter status</div>
          <Select
            items={{
              [ALL]: "All status",
              ...Object.fromEntries(
                (Object.keys(projectStatusLabel) as ProjectStatus[]).map((s) => [
                  s,
                  projectStatusLabel[s],
                ])
              ),
            }}
            value={statusFilter}
            onValueChange={(v) => {
              if (!v) return;
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All status</SelectItem>
              {(Object.keys(projectStatusLabel) as ProjectStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {projectStatusLabel[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Weekly report</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Tidak ada project yang cocok.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-muted-foreground">{p.code}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                      p.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {projectStatusLabel[p.status]}
                  </span>
                </TableCell>
                <TableCell>
                  {p.currentWeekReportStatus ? (
                    <StatusBadge status={p.currentWeekReportStatus} />
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                      Report required
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/projects/${p.id}`}
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

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <Select
            value={String(rowsPerPage)}
            onValueChange={(v) => {
              if (!v) return;
              setRowsPerPage(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          {filtered.length} rows &middot; page {currentPage} of {totalPages}
        </div>
      </div>
    </div>
  );
}
