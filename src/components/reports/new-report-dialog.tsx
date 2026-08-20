"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { readApiError, NETWORK_ERROR_MESSAGE } from "@/lib/api-client-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export type ProjectOption = { id: string; name: string };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type Availability =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available"; projectName: string }
  | { status: "conflict" }
  | { status: "error"; message: string };

export function NewReportDialog({
  projects,
  defaultWeekStart,
  defaultWeekEnd,
}: {
  projects: ProjectOption[];
  defaultWeekStart: string;
  defaultWeekEnd: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [weekStart, setWeekStart] = useState(defaultWeekStart);
  const [weekEnd, setWeekEnd] = useState(defaultWeekEnd);
  const [checked, setChecked] = useState<{
    signature: string;
    result: Availability;
  } | null>(null);
  const [creating, setCreating] = useState(false);

  const signature = `${projectId}|${weekStart}|${weekEnd}`;
  const complete = !!projectId && !!weekStart && !!weekEnd;

  // An invalid range is decided from the current inputs, so it renders straight
  // away instead of waiting a round trip the server would reject anyway.
  const rangeInvalid =
    !!weekStart && !!weekEnd && new Date(weekEnd) < new Date(weekStart);

  // Derived rather than stored, so the state can never lag behind the inputs it
  // describes: anything not yet answered for this exact combination is pending.
  const availability: Availability = rangeInvalid
    ? { status: "error", message: "Tanggal akhir harus setelah tanggal mulai" }
    : !open || !complete
      ? { status: "idle" }
      : checked?.signature === signature
        ? checked.result
        : { status: "checking" };

  useEffect(() => {
    if (!open || !complete || rangeInvalid) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const settle = (result: Availability) => {
        if (!cancelled) setChecked({ signature, result });
      };
      try {
        const params = new URLSearchParams({ projectId, weekStart, weekEnd });
        const res = await fetch(`/api/reports/check?${params.toString()}`);
        if (cancelled) return;
        if (!res.ok) {
          const { message } = await readApiError(
            res,
            "Gagal memeriksa ketersediaan periode."
          );
          settle({ status: "error", message });
          return;
        }
        const body = await res.json();
        settle(
          body.available
            ? { status: "available", projectName: body.projectName }
            : { status: "conflict" }
        );
      } catch {
        settle({ status: "error", message: NETWORK_ERROR_MESSAGE });
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, complete, rangeInvalid, signature, projectId, weekStart, weekEnd]);

  function resetForm() {
    setProjectId(projects[0]?.id ?? "");
    setWeekStart(defaultWeekStart);
    setWeekEnd(defaultWeekEnd);
    setChecked(null);
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/reports/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, weekStart, weekEnd }),
      });
      if (!res.ok) {
        const { message } = await readApiError(res, "Gagal membuat report.");
        toast.error("Report gagal dibuat", { description: message });
        return;
      }
      const body = await res.json();
      setOpen(false);
      router.push(`/reports/${body.id}/edit`);
    } catch {
      toast.error("Report gagal dibuat", {
        description: NETWORK_ERROR_MESSAGE,
      });
    } finally {
      setCreating(false);
    }
  }

  const selectedProjectName = projects.find((p) => p.id === projectId)?.name ?? "";
  const canCreate = availability.status === "available" && !creating;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) resetForm();
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-1 size-4" /> New report
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start weekly report</DialogTitle>
          <DialogDescription>
            Pilih project dan periode minggu. Draft akan langsung dibuat setelah
            kamu klik Create report.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Project</Label>
            <Select
              items={Object.fromEntries(projects.map((p) => [p.id, p.name]))}
              value={projectId}
              onValueChange={(v) => v && setProjectId(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start-week-start">Week start</Label>
              <Input
                id="start-week-start"
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-week-end">Week end</Label>
              <Input
                id="start-week-end"
                type="date"
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
              />
            </div>
          </div>

          {availability.status !== "idle" && (
            <div
              className={cn(
                "rounded-md px-3 py-2 text-sm",
                availability.status === "checking" &&
                  "bg-muted text-muted-foreground",
                availability.status === "available" &&
                  "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
                (availability.status === "conflict" ||
                  availability.status === "error") &&
                  "bg-destructive/10 text-destructive"
              )}
            >
              {availability.status === "checking" && "Memeriksa periode..."}
              {availability.status === "available" &&
                `Belum ada report untuk ${selectedProjectName} pada ${formatDate(
                  weekStart
                )} - ${formatDate(weekEnd)}.`}
              {availability.status === "conflict" &&
                `Sudah ada report untuk ${selectedProjectName} pada periode ini. Pilih project atau periode lain.`}
              {availability.status === "error" && availability.message}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button type="button" onClick={handleCreate} disabled={!canCreate}>
            {creating ? "Membuat..." : "Create report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
