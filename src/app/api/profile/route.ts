import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { profileUpdateSchema } from "@/lib/validation";

export async function PUT(request: NextRequest) {
  const { user, error } = await requireSession();
  if (error) return error;

  const body = await request.json();
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { id: user!.id } });
  if (!existing) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  if (data.newPassword) {
    const valid = await bcrypt.compare(data.currentPassword, existing.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Password saat ini salah" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: user!.id },
    data: {
      name: data.name,
      ...(data.newPassword
        ? { passwordHash: await bcrypt.hash(data.newPassword, 10) }
        : {}),
    },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json(updated);
}
