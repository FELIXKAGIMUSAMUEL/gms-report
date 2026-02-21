import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GM") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attachment = await prisma.attachment.findUnique({ where: { id: params.id } });
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete file from disk
  try {
    const filePath = path.join(process.cwd(), "public", attachment.url);
    await unlink(filePath);
  } catch {
    // File may already be missing — continue
  }

  await prisma.attachment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
