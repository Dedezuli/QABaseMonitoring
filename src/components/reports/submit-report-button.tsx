"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { readApiError, NETWORK_ERROR_MESSAGE } from "@/lib/api-client-error";
import { Send } from "lucide-react";

export function SubmitReportButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/submit`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const { message } = await readApiError(res, "Gagal submit report.");
        toast.error("Report belum bisa disubmit", { description: message });
        return;
      }
      toast.success("Report berhasil disubmit untuk review");
      router.refresh();
    } catch {
      toast.error("Gagal submit report", {
        description: NETWORK_ERROR_MESSAGE,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Button onClick={handleSubmit} disabled={submitting}>
      <Send className="mr-1 size-4" />
      {submitting ? "Submitting..." : "Submit for Review"}
    </Button>
  );
}
