import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { describeFieldError } from "@/lib/field-labels";

/**
 * Every error response carries a ready-to-display `error` string. `fieldErrors`
 * is extra, so a form can highlight inputs without the client having to
 * reconstruct a message from a raw validation payload.
 */
export type ApiErrorPayload = {
  error: string;
  fieldErrors?: Record<string, string>;
};

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message } satisfies ApiErrorPayload, {
    status,
  });
}

export function validationError(error: ZodError, status = 400) {
  const flat = error.flatten();

  const fieldErrors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(flat.fieldErrors)) {
    if (Array.isArray(messages) && messages.length) {
      fieldErrors[field] = messages[0];
    }
  }

  const entries = Object.entries(fieldErrors);
  const parts = [
    ...flat.formErrors,
    ...entries.map(([field, message]) => describeFieldError(field, message)),
  ];

  const message =
    parts.length === 0
      ? "Data yang dikirim belum valid. Periksa kembali isian anda."
      : parts.length === 1
        ? parts[0]
        : `${parts[0]} (dan ${parts.length - 1} isian lain perlu diperbaiki)`;

  return NextResponse.json(
    { error: message, fieldErrors } satisfies ApiErrorPayload,
    { status }
  );
}
