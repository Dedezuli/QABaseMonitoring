import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { projectUploadDir } from "@/lib/uploads";

const MAX_SIZE_BYTES = 20 * 1024 * 1024;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const documents = await prisma.projectDocument.findMany({
    where: { projectId: id },
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Project tidak ditemukan" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File wajib diupload" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Ukuran file maksimal 20MB" },
      { status: 400 }
    );
  }

  const dir = projectUploadDir(id);
  await mkdir(dir, { recursive: true });

  const ext = path.extname(file.name);
  const storedName = `${randomUUID()}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, storedName), bytes);

  const document = await prisma.projectDocument.create({
    data: {
      projectId: id,
      originalName: file.name,
      filePath: path.join(id, storedName),
      uploadedById: user!.id,
    },
    include: { uploadedBy: { select: { name: true } } },
  });

  return NextResponse.json(document, { status: 201 });
}
