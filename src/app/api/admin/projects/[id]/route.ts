import { NextRequest, NextResponse } from "next/server";
import { rm } from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { projectSchema } from "@/lib/validation";
import { projectUploadDir } from "@/lib/uploads";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      assignments: { include: { user: { select: { id: true, name: true, email: true } } } },
      documents: { include: { uploadedBy: { select: { name: true } } } },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const [existing, codeTaken, currentAssignments] = await Promise.all([
    prisma.project.findUnique({ where: { id }, select: { id: true } }),
    prisma.project.findFirst({
      where: { code: data.code, NOT: { id } },
      select: { id: true },
    }),
    prisma.projectAssignment.findMany({
      where: { projectId: id },
      select: { userId: true },
    }),
  ]);

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (codeTaken) {
    return NextResponse.json(
      { error: "Code project sudah dipakai" },
      { status: 409 }
    );
  }

  const currentIds = new Set(currentAssignments.map((a) => a.userId));
  const nextIds = new Set(data.assignedUserIds);

  const toRemove = [...currentIds].filter((uid) => !nextIds.has(uid));
  const toAdd = [...nextIds].filter((uid) => !currentIds.has(uid));

  const project = await prisma.$transaction(async (tx) => {
    if (toRemove.length) {
      await tx.projectAssignment.deleteMany({
        where: { projectId: id, userId: { in: toRemove } },
      });
    }
    if (toAdd.length) {
      await tx.projectAssignment.createMany({
        data: toAdd.map((userId) => ({ projectId: id, userId })),
      });
    }
    return tx.project.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description || null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        status: data.status,
      },
      include: {
        assignments: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
  });

  return NextResponse.json(project);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.project.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await rm(projectUploadDir(id), { recursive: true, force: true });

  return NextResponse.json({ ok: true });
}
