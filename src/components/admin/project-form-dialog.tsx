"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ProjectStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Pencil } from "lucide-react";

export type QaUserOption = { id: string; name: string; email: string };

export type ProjectRow = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: ProjectStatus;
  assignedUserIds: string[];
};

const statusLabel: Record<ProjectStatus, string> = {
  ACTIVE: "Aktif",
  ON_HOLD: "On Hold",
  DONE: "Selesai",
};

function toDateInputValue(v: string | null) {
  return v ? v.slice(0, 10) : "";
}

export function ProjectFormDialog({
  project,
  qaUsers,
  trigger,
}: {
  project?: ProjectRow;
  qaUsers: QaUserOption[];
  trigger?: React.ReactElement;
}) {
  const router = useRouter();
  const isEdit = !!project;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project?.name ?? "");
  const [code, setCode] = useState(project?.code ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [startDate, setStartDate] = useState(
    toDateInputValue(project?.startDate ?? null)
  );
  const [endDate, setEndDate] = useState(
    toDateInputValue(project?.endDate ?? null)
  );
  const [status, setStatus] = useState<ProjectStatus>(
    project?.status ?? "ACTIVE"
  );
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>(
    project?.assignedUserIds ?? []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setName(project?.name ?? "");
    setCode(project?.code ?? "");
    setDescription(project?.description ?? "");
    setStartDate(toDateInputValue(project?.startDate ?? null));
    setEndDate(toDateInputValue(project?.endDate ?? null));
    setStatus(project?.status ?? "ACTIVE");
    setAssignedUserIds(project?.assignedUserIds ?? []);
    setErrors({});
  }

  function toggleUser(userId: string) {
    setAssignedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch(
        isEdit ? `/api/admin/projects/${project!.id}` : "/api/admin/projects",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            code,
            description,
            startDate: startDate || null,
            endDate: endDate || null,
            status,
            assignedUserIds,
          }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body?.error?.fieldErrors) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(body.error.fieldErrors)) {
            if (Array.isArray(msgs) && msgs.length) fieldErrors[key] = msgs[0];
          }
          setErrors(fieldErrors);
        }
        toast.error(
          typeof body?.error === "string"
            ? body.error
            : "Gagal menyimpan project."
        );
        return;
      }

      toast.success(
        isEdit ? "Project berhasil diperbarui" : "Project berhasil ditambahkan"
      );
      setOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

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
          trigger ?? (
            <Button variant="outline">
              <Pencil className="mr-1 size-4" /> Edit Project
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Project" : "Tambah Project"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui detail project dan assignment QA."
              : "Buat project baru dan assign QA yang akan mengerjakan."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Nama Project</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CMS"
                maxLength={20}
                required
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Mulai project</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Berakhir project</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              items={statusLabel}
              value={status}
              onValueChange={(v) => v && setStatus(v as ProjectStatus)}
            >
              <SelectTrigger className="w-full" id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(statusLabel) as ProjectStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabel[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assign QA</Label>
            {qaUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada user dengan role QA. Tambahkan user QA terlebih
                dahulu di halaman Users.
              </p>
            ) : (
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
                {qaUsers.map((qa) => (
                  <label
                    key={qa.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="size-4 rounded border-input"
                      checked={assignedUserIds.includes(qa.id)}
                      onChange={() => toggleUser(qa.id)}
                    />
                    <span>
                      {qa.name}{" "}
                      <span className="text-muted-foreground">
                        ({qa.email})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Batal
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
