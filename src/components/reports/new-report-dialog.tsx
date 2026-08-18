"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  const [availability, setAvailability] = useState<Availability>({ status: "idle" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open || !projectId || !weekStart || !weekEnd) return;
    if (new Date(weekEnd) < new Date(weekStart)) {
      setAvailability({ status: "error", message: "Tanggal akhir harus setelah tanggal mulai" });
      return;
    }

    let cancelled = false;
    setAvailability({ status: "checking" });
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ projectId, weekStart, weekEnd });
        const res = await fetch(`/api/reports/check?${params.toString()}`);
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setAvailability({ status: "error", message: body?.error ?? "Gagal memeriksa periode." });
          return;
        }
        setAvailability(
          body.available
            ? { status: "available", projectName: body.projectName }
            : { status: "conflict" }
        );
      } catch {
        if (!cancelled) {
          setAvailability({ status: "error", message: "Gagal memeriksa periode." });
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, projectId, weekStart, weekEnd]);

  function resetForm() {
    setProjectId(projects[0]?.id ?? "");
    setWeekStart(defaultWeekStart);
    setWeekEnd(defaultWeekEnd);
    setAvailability({ status: "idle" });
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/reports/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, weekStart, weekEnd }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof body?.error === "string" ? body.error : "Gagal membuat report.");
        return;
      }
      setOpen(false);
      router.push(`/reports/${body.id}/edit`);
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
