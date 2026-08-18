"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function ApproveCoauthorButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/coauthor-approve`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(
          typeof body?.error === "string" ? body.error : "Gagal approve."
        );
        return;
      }
      toast.success("Berhasil approve sebagai co-author");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" onClick={handleApprove} disabled={loading}>
      <CheckCircle2 className="mr-1 size-4" />
      {loading ? "Menyimpan..." : "Approve as co-author"}
    </Button>
  );
}
