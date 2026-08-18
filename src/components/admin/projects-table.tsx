"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  ProjectFormDialog,
  type ProjectRow,
  type QaUserOption,
} from "./project-form-dialog";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

type Row = ProjectRow & {
  reportCount: number;
  documentCount: number;
  assignedNames: string[];
};

export function ProjectsTable({
  projects,
  qaUsers,
}: {
  projects: Row[];
  qaUsers: QaUserOption[];
}) {
  const router = useRouter();

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body?.error ?? "Gagal menghapus project.");
      throw new Error("delete failed");
    }
    toast.success("Project berhasil dihapus");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ProjectFormDialog
          qaUsers={qaUsers}
          trigger={
            <Button>
              <Plus className="mr-1 size-4" /> Tambah Project
            </Button>
          }
        />
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Project</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>QA Assigned</TableHead>
              <TableHead>Reports</TableHead>
              <TableHead>Dokumen</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Belum ada project.
                </TableCell>
              </TableRow>
            )}
            {projects.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/projects/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.code}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{p.status}</Badge>
                </TableCell>
                <TableCell className="max-w-[220px] truncate">
                  {p.assignedNames.length ? p.assignedNames.join(", ") : "-"}
                </TableCell>
                <TableCell>{p.reportCount}</TableCell>
                <TableCell>{p.documentCount}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <ProjectFormDialog
                      project={p}
                      qaUsers={qaUsers}
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    <ConfirmDeleteButton
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      }
                      title={`Hapus project ${p.name}?`}
                      description="Semua report, assignment, dan dokumen pada project ini akan ikut terhapus permanen."
                      onConfirm={() => handleDelete(p.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
