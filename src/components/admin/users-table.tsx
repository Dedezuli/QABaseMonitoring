"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { readApiError } from "@/lib/api-client-error";
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
import { UserFormDialog, type UserRow } from "./user-form-dialog";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

type Row = UserRow & {
  createdAt: string;
  _count: { assignments: number; reports: number };
};

export function UsersTable({
  users,
  currentUserId,
}: {
  users: Row[];
  currentUserId: string;
}) {
  const router = useRouter();

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const { message } = await readApiError(res, "Gagal menghapus user.");
      toast.error("User gagal dihapus", { description: message });
      throw new Error("delete failed");
    }
    toast.success("User berhasil dihapus");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <UserFormDialog
          trigger={
            <Button>
              <Plus className="mr-1 size-4" /> Tambah User
            </Button>
          }
        />
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Project Assigned</TableHead>
              <TableHead>Reports</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell>{u._count.assignments}</TableCell>
                <TableCell>{u._count.reports}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <UserFormDialog
                      user={u}
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    {u.id !== currentUserId && (
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
                        title={`Hapus user ${u.name}?`}
                        description="User yang dihapus tidak bisa dikembalikan. Report dan assignment miliknya akan ikut terhapus."
                        onConfirm={() => handleDelete(u.id)}
                      />
                    )}
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
