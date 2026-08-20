"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type QaOption = { id: string; name: string };

const STATUS_OPTIONS: Record<string, string> = {
  all: "Semua status",
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  NEED_REVISION: "Need Revision",
  APPROVED: "Approved",
};

export function ProjectReportsFilters({ qaUsers }: { qaUsers: QaOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const userId = searchParams.get("userId") ?? "all";
  const status = searchParams.get("status") ?? "all";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  function apply(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const userItems = {
    all: "Semua QA",
    ...Object.fromEntries(qaUsers.map((u) => [u.id, u.name])),
  };

  const hasFilter = userId !== "all" || status !== "all" || from || to;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-md border p-4">
      <div className="space-y-1.5">
        <Label>QA</Label>
        <Select
          items={userItems}
          value={userId}
          onValueChange={(v) => v && apply("userId", v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(userItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select
          items={STATUS_OPTIONS}
          value={status}
          onValueChange={(v) => v && apply("status", v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_OPTIONS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="from">Dari minggu</Label>
        <Input
          id="from"
          type="date"
          value={from}
          onChange={(e) => apply("from", e.target.value)}
          className="w-40"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="to">Sampai minggu</Label>
        <Input
          id="to"
          type="date"
          value={to}
          onChange={(e) => apply("to", e.target.value)}
          className="w-40"
        />
      </div>

      {hasFilter && (
        <Button variant="outline" onClick={() => router.replace(pathname)}>
          Reset filter
        </Button>
      )}
    </div>
  );
}
