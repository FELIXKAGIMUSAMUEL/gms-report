import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "attachments");
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain", "text/csv",
];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const issueId = searchParams.get("issueId");
  const eventId = searchParams.get("eventId");

  if (!projectId && !issueId && !eventId) {
    return NextResponse.json({ error: "Must supply projectId, issueId, or eventId" }, { status: 400 });
  }

  const where: any = {};
  if (projectId) where.projectId = projectId;
  if (issueId) where.issueId = issueId;
  if (eventId) where.eventId = eventId;

  const attachments = await prisma.attachment.findMany({
    where,
    include: { uploadedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(attachments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GM") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const projectId = formData.get("projectId") as string | null;
  const issueId = formData.get("issueId") as string | null;
  const eventId = formData.get("eventId") as string | null;
  const label = formData.get("label") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!projectId && !issueId && !eventId) {
    return NextResponse.json({ error: "Must supply projectId, issueId, or eventId" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 20 MB)" }, { status: 400 });
  }

  // Build unique stored name
  const ext = path.extname(file.name) || "";
  const base = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
  const storedName = `${Date.now()}_${base}${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(path.join(UPLOAD_DIR, storedName), Buffer.from(bytes));

  const attachment = await prisma.attachment.create({
    data: {
      filename: file.name,
      storedName,
      url: `/uploads/attachments/${storedName}`,
      mimeType: file.type,
      size: file.size,
      label: label || null,
      uploadedById: session.user.id,
      projectId: projectId || null,
      issueId: issueId || null,
      eventId: eventId || null,
    },
    include: { uploadedBy: { select: { id: true, name: true } } },
  });

  return NextResponse.json(attachment, { status: 201 });
}
