"use client";

import { useState } from "react";
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

export function ConfirmDeleteButton({
  trigger,
  title,
  description,
  onConfirm,
}: {
  trigger: React.ReactElement;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      // error already surfaced via toast by the caller
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Batal
          </DialogClose>
          <Button variant="destructive" onClick={handleConfirm} disabled={busy}>
            {busy ? "Menghapus..." : "Ya, hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
