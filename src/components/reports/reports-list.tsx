"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { ReportStatus } from "@prisma/client";
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
import { reportStatusMeta } from "@/lib/report-utils";
import { Search } from "lucide-react";

const ALL = "__all__";

export type ReportListRow = {
  id: string;
  projectName: string;
  projectCode: string;
  weekStart: string;
  weekEnd: string;
  status: ReportStatus;
  reviewNote: string | null;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ReportsList({
  reports,
  status,
}: {
  reports: ReportListRow[];
  status?: ReportStatus;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(
      (r) =>
        r.projectName.toLowerCase().includes(q) ||
        r.projectCode.toLowerCase().includes(q)
    );
  }, [reports, search]);

  function handleStatusChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL) params.delete("status");
    else params.set("status", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project..."
            className="pl-8"
          />
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Filter status</div>
          <Select
            items={{
              [ALL]: "All status",
              ...Object.fromEntries(
                (Object.keys(reportStatusMeta) as ReportStatus[]).map((s) => [
                  s,
                  reportStatusMeta[s].label,
                ])
              ),
            }}
            value={status ?? ALL}
            onValueChange={(v) => v && handleStatusChange(v)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All status</SelectItem>
              {(Object.keys(reportStatusMeta) as ReportStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {reportStatusMeta[s].label}
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
              <TableHead>Project</TableHead>
              <TableHead>Week</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Tidak ada report yang cocok.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.projectName}</TableCell>
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
    </div>
  );
}
