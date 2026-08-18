import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { projectSchema } from "@/lib/validation";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const projects = await prisma.project.findMany({
    include: {
      assignments: { include: { user: { select: { id: true, name: true, email: true } } } },
      _count: { select: { reports: true, documents: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const codeTaken = await prisma.project.findUnique({ where: { code: data.code } });
  if (codeTaken) {
    return NextResponse.json(
      { error: "Code project sudah dipakai" },
      { status: 409 }
    );
  }

  const project = await prisma.project.create({
    data: {
      name: data.name,
      code: data.code,
      description: data.description || null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      status: data.status,
      assignments: {
        create: data.assignedUserIds.map((userId) => ({ userId })),
      },
    },
    include: {
      assignments: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  return NextResponse.json(project, { status: 201 });
}
