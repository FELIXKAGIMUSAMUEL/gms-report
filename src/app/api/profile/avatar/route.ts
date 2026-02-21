import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, unlink } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 3 * 1024 * 1024; // 3 MB

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP or GIF images are allowed" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Image must be smaller than 3 MB" }, { status: 400 });
    }

    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const filename = `${session.user.id}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    const filePath = path.join(uploadDir, filename);

    // Remove any previous avatar files for this user
    for (const oldExt of ["jpg", "png", "webp", "gif"]) {
      try {
        await unlink(path.join(uploadDir, `${session.user.id}.${oldExt}`));
      } catch {}
    }

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const avatarUrl = `/uploads/avatars/${filename}`;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl },
    });

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    for (const ext of ["jpg", "png", "webp", "gif"]) {
      try {
        await unlink(path.join(uploadDir, `${session.user.id}.${ext}`));
      } catch {}
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
