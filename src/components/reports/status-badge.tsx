import type { ReportStatus } from "@prisma/client";
import { reportStatusMeta } from "@/lib/report-utils";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: ReportStatus;
  className?: string;
}) {
  const meta = reportStatusMeta[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        meta.badgeClass,
        className
      )}
    >
      {meta.label}
    </span>
  );
}
