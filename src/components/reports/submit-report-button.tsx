"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          typeof body?.error === "string"
            ? body.error
            : "Gagal submit report."
        );
        return;
      }
      toast.success("Report berhasil disubmit untuk review");
      router.refresh();
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
