import type { ActivityAction } from "@prisma/client";
import { activityLabel } from "@/lib/report-activity";
import {
  FilePlus,
  Pencil,
  CheckCircle2,
  Send,
  ThumbsUp,
  RotateCcw,
} from "lucide-react";

const actionIcon: Record<ActivityAction, typeof FilePlus> = {
  CREATED: FilePlus,
  EDITED: Pencil,
  COAUTHOR_APPROVED: CheckCircle2,
  SUBMITTED: Send,
  APPROVED: ThumbsUp,
  NEED_REVISION: RotateCcw,
};

export type ActivityItem = {
  id: string;
  action: ActivityAction;
  changedFields: string | null;
  createdAt: string;
  userName: string;
};

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const Icon = actionIcon[item.action];
        return (
          <div key={item.id} className="rounded-md border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">
                    {activityLabel[item.action]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    oleh {item.userName}
                  </div>
                  {item.changedFields && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {item.changedFields.split(",").map((field) => (
                        <span
                          key={field}
                          className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDateTime(item.createdAt)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
