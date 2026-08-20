"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { readApiError, NETWORK_ERROR_MESSAGE } from "@/lib/api-client-error";
import { CheckCircle2, RotateCcw } from "lucide-react";

export function ReviewActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [note, setNote] = useState("");
  const [submittingRevision, setSubmittingRevision] = useState(false);

  async function sendReview(action: "APPROVED" | "NEED_REVISION", reviewNote?: string) {
    try {
      const res = await fetch(`/api/reports/${reportId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: reviewNote ?? "" }),
      });
      if (!res.ok) {
        const { message } = await readApiError(res, "Gagal menyimpan review.");
        toast.error("Review gagal disimpan", { description: message });
        return false;
      }
      return true;
    } catch {
      toast.error("Review gagal disimpan", {
        description: NETWORK_ERROR_MESSAGE,
      });
      return false;
    }
  }

  async function handleApprove() {
    setApproving(true);
    try {
      const ok = await sendReview("APPROVED");
      if (ok) {
        toast.success("Report disetujui");
        router.refresh();
      }
    } finally {
      setApproving(false);
    }
  }

  async function handleRequestRevision(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) {
      toast.error("Catatan revisi wajib diisi");
      return;
    }
    setSubmittingRevision(true);
    try {
      const ok = await sendReview("NEED_REVISION", note);
      if (ok) {
        toast.success("Report dikembalikan untuk revisi");
        setRevisionOpen(false);
        setNote("");
        router.refresh();
      }
    } finally {
      setSubmittingRevision(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogTrigger render={<Button variant="outline" />}>
          <RotateCcw className="mr-1 size-4" /> Minta Revisi
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Minta revisi report</DialogTitle>
            <DialogDescription>
              Tulis catatan yang akan dilihat oleh QA agar tahu apa yang perlu
              diperbaiki.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRequestRevision} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note">Catatan revisi</Label>
              <Textarea
                id="note"
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: mohon lengkapi detail bug production."
                required
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Batal
              </DialogClose>
              <Button type="submit" disabled={submittingRevision}>
                {submittingRevision ? "Mengirim..." : "Kirim"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Button onClick={handleApprove} disabled={approving}>
        <CheckCircle2 className="mr-1 size-4" />
        {approving ? "Menyimpan..." : "Approve"}
      </Button>
    </div>
  );
}
