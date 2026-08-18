import { cn } from "@/lib/utils";

export function PercentBar({
  label,
  value,
  detail,
  className,
}: {
  label: string;
  value: number;
  detail?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {value}% {detail ? `(${detail})` : ""}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
