"use client";

import { useState } from "react";
import { toast } from "sonner";
import { readApiError, NETWORK_ERROR_MESSAGE } from "@/lib/api-client-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfileForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const [name, setName] = useState(initialName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, currentPassword, newPassword }),
      });
      if (!res.ok) {
        const { message, fieldErrors } = await readApiError(
          res,
          "Gagal menyimpan profil."
        );
        setErrors(fieldErrors);
        toast.error("Profil gagal disimpan", { description: message });
        return;
      }
      toast.success("Profil berhasil diperbarui");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      toast.error("Profil gagal disimpan", {
        description: NETWORK_ERROR_MESSAGE,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
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
            <Label htmlFor="currentPassword">Password saat ini</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Isi jika ingin ganti password"
            />
            {errors.currentPassword && (
              <p className="text-sm text-destructive">
                {errors.currentPassword}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Password baru</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Kosongkan jika tidak diubah"
            />
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword}</p>
            )}
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
