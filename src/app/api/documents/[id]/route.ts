import { NextRequest, NextResponse } from "next/server";
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api-error";
import { requireAdmin } from "@/lib/api-auth";
import { UPLOAD_ROOT } from "@/lib/uploads";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const doc = await prisma.projectDocument.findUnique({ where: { id } });
  if (!doc) return errorResponse("Data tidak ditemukan. Mungkin sudah dihapus — coba muat ulang halaman.", 404);

  const filePath = path.join(UPLOAD_ROOT, doc.filePath);
  let data: Buffer;
  try {
    data = await readFile(filePath);
  } catch {
    return NextResponse.json({ error: "File tidak ditemukan di server" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.originalName)}"`,
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const doc = await prisma.projectDocument.findUnique({ where: { id } });
  if (!doc) return errorResponse("Data tidak ditemukan. Mungkin sudah dihapus — coba muat ulang halaman.", 404);

  await prisma.projectDocument.delete({ where: { id } });
  await rm(path.join(UPLOAD_ROOT, doc.filePath), { force: true });

  return NextResponse.json({ ok: true });
}
