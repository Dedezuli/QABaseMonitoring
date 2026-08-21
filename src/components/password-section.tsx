"use client";

import { useState } from "react";
import { toast } from "sonner";
import { readApiError, NETWORK_ERROR_MESSAGE } from "@/lib/api-client-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

function PasswordInput({
  id,
  value,
  onChange,
  error,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={cn("pr-10", error && "border-destructive")}
          aria-invalid={!!error}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function PasswordSection() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
  }

  function close() {
    reset();
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      if (!res.ok) {
        const { message, fieldErrors } = await readApiError(
          res,
          "Gagal mengganti password."
        );
        setErrors(fieldErrors);
        toast.error("Password gagal diganti", { description: message });
        return;
      }
      toast.success("Password berhasil diganti");
      close();
    } catch {
      toast.error("Password gagal diganti", {
        description: NETWORK_ERROR_MESSAGE,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Password</h3>
          <p className="text-sm text-muted-foreground">
            Ganti password akun secara berkala untuk menjaga keamanan.
          </p>
        </div>
        {open ? (
          <Button variant="ghost" size="sm" onClick={close}>
            Tutup
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setOpen(true)}>
            Ganti password
          </Button>
        )}
      </div>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border p-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Password saat ini</Label>
            <PasswordInput
              id="currentPassword"
              value={currentPassword}
              onChange={setCurrentPassword}
              error={errors.currentPassword}
              autoComplete="current-password"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Password baru</Label>
              <PasswordInput
                id="newPassword"
                value={newPassword}
                onChange={setNewPassword}
                error={errors.newPassword}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Konfirmasi password baru</Label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={setConfirmPassword}
                error={errors.confirmPassword}
                autoComplete="new-password"
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">Minimal 8 karakter.</p>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan password baru"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
