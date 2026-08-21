import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { passwordChangeSchema } from "@/lib/validation";
import { errorResponse, validationError } from "@/lib/api-error";

export async function PUT(request: NextRequest) {
  const { user, error } = await requireSession();
  if (error) return error;

  const body = await request.json();
  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error);
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { id: user!.id },
    select: { passwordHash: true },
  });
  if (!existing) {
    return errorResponse("Akun tidak ditemukan.", 404);
  }

  const valid = await bcrypt.compare(
    data.currentPassword,
    existing.passwordHash
  );
  if (!valid) {
    // Reported against the field so the form can highlight the right input.
    return NextResponse.json(
      {
        error: "Password saat ini salah.",
        fieldErrors: { currentPassword: "Password saat ini salah." },
      },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user!.id },
    data: { passwordHash: await bcrypt.hash(data.newPassword, 10) },
  });

  return NextResponse.json({ ok: true });
}
