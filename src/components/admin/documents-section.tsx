"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { Download, Trash2, Upload } from "lucide-react";

export type DocumentRow = {
  id: string;
  originalName: string;
  uploadedAt: string;
  uploadedBy: { name: string };
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function DocumentsSection({
  projectId,
  documents,
}: {
  projectId: string;
  documents: DocumentRow[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Pilih file terlebih dahulu.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/admin/projects/${projectId}/documents`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body?.error ?? "Gagal upload dokumen.");
        return;
      }
      toast.success("Dokumen berhasil diupload");
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Gagal menghapus dokumen.");
      throw new Error("delete failed");
    }
    toast.success("Dokumen berhasil dihapus");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleUpload} className="flex flex-wrap items-center gap-2">
        <Input ref={fileInputRef} type="file" className="max-w-xs" />
        <Button type="submit" disabled={uploading}>
          <Upload className="mr-1 size-4" />
          {uploading ? "Mengupload..." : "Upload Dokumen"}
        </Button>
      </form>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama File</TableHead>
              <TableHead>Diupload oleh</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Belum ada dokumen.
                </TableCell>
              </TableRow>
            )}
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.originalName}</TableCell>
                <TableCell>{doc.uploadedBy.name}</TableCell>
                <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      nativeButton={false}
                      render={<a href={`/api/documents/${doc.id}`} />}
                    >
                      <Download className="size-4" />
                    </Button>
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
                      title={`Hapus dokumen ${doc.originalName}?`}
                      description="File yang dihapus tidak bisa dikembalikan."
                      onConfirm={() => handleDelete(doc.id)}
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
