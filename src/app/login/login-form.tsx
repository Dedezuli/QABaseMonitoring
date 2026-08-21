"use client";

import { useActionState } from "react";
import { authenticate } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div>
        <h1 className="font-heading text-[23px] font-bold">QA Weekly Report</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Masuk untuk melihat dan mengisi laporan mingguan QA.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="nama@perusahaan.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}
        <Button type="submit" className="w-full font-bold" disabled={isPending}>
          {isPending ? "Memproses..." : "Masuk"}
        </Button>
      </form>
    </div>
  );
}
