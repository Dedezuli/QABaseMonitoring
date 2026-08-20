import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { userUpdateSchema } from "@/lib/validation";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const parsed = userUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [existing, emailTaken] = await Promise.all([
    prisma.user.findUnique({ where: { id }, select: { role: true } }),
    prisma.user.findFirst({
      where: { email: parsed.data.email, NOT: { id } },
      select: { id: true },
    }),
  ]);

  if (!existing) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }
  if (emailTaken) {
    return NextResponse.json(
      { error: "Email sudah dipakai user lain" },
      { status: 409 }
    );
  }

  if (existing.role === "ADMIN" && parsed.data.role !== "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Tidak bisa mengubah role admin terakhir" },
        { status: 400 }
      );
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      ...(parsed.data.password
        ? { passwordHash: await bcrypt.hash(parsed.data.password, 10) }
        : {}),
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user: admin, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  if (id === admin!.id) {
    return NextResponse.json(
      { error: "Tidak bisa menghapus akun sendiri" },
      { status: 400 }
    );
  }

  const [existing, adminCount] = await Promise.all([
    prisma.user.findUnique({ where: { id }, select: { role: true } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  if (!existing) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }
  if (existing.role === "ADMIN" && adminCount <= 1) {
    return NextResponse.json(
      { error: "Tidak bisa menghapus admin terakhir" },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
