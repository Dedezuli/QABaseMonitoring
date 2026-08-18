"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Trash2 } from "lucide-react";

export function DeleteReportButton({
  reportId,
  redirectTo = "/dashboard",
}: {
  reportId: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Gagal menghapus report.");
        return;
      }
      toast.success("Report berhasil dihapus.");
      setOpen(false);
      router.push(redirectTo);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline" className="text-destructive" />}
      >
        <Trash2 className="mr-1 size-4" /> Hapus
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus report ini?</DialogTitle>
          <DialogDescription>
            Tindakan ini tidak dapat dibatalkan. Report beserta data bug
            production di dalamnya akan dihapus permanen.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Batal
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Menghapus..." : "Ya, hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
