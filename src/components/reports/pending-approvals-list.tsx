import Link from "next/link";
import type { ReportStatus } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/reports/status-badge";
import { ApproveCoauthorButton } from "@/components/reports/approve-coauthor-button";

export type PendingApprovalRow = {
  reportId: string;
  projectName: string;
  projectCode: string;
  weekStart: string;
  weekEnd: string;
  status: ReportStatus;
  authorName: string;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PendingApprovalsList({ rows }: { rows: PendingApprovalRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Tidak ada report yang menunggu approval kamu sebagai co-author.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Week</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.reportId}>
              <TableCell className="font-medium">{r.projectName}</TableCell>
              <TableCell>
                {formatDate(r.weekStart)} &rarr; {formatDate(r.weekEnd)}
              </TableCell>
              <TableCell>{r.authorName}</TableCell>
              <TableCell>
                <StatusBadge status={r.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/reports/${r.reportId}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View
                  </Link>
                  <ApproveCoauthorButton reportId={r.reportId} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
