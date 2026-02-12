import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const projects = await prisma.gMProject.findMany({
      where: status && status !== "ALL" ? { status: status as any } : undefined,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const normalizeItemStatus = (status?: string | null) => {
  if (!status) return "ACTIVE";
  const normalized = status.trim().toUpperCase();
  if (normalized === "COMPLETED" || normalized === "DONE") return "COMPLETED";
  if (normalized === "ACTIVE") return "ACTIVE";
  if (normalized === "IN PROGRESS" || normalized === "IN_PROGRESS") return "ACTIVE";
  return "ACTIVE";
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user?.role !== "GM" && session.user?.role !== "TRUSTEE")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { projectName, progress, projectManager, status } = body;

    // Validate required fields
    if (!projectName || !projectManager) {
      return NextResponse.json(
        { error: "projectName and projectManager are required" },
        { status: 400 }
      );
    }

    // Validate progress is a number between 0-100
    const progressNum = parseFloat(progress);
    if (isNaN(progressNum) || progressNum < 0 || progressNum > 100) {
      return NextResponse.json(
        { error: "progress must be a number between 0 and 100" },
        { status: 400 }
      );
    }

    // Map frontend status to database ItemStatus enum
    const dbStatus = normalizeItemStatus(status);

    const project = await prisma.gMProject.create({
      data: {
        projectName,
        progress: progressNum,
        projectManager,
        status: dbStatus as any,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user?.role !== "GM" && session.user?.role !== "TRUSTEE")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id, projectName, progress, projectManager, status } = body;

    // Validate id
    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    // Map frontend status to database ItemStatus enum
    const dbStatus = normalizeItemStatus(status);

    const project = await prisma.gMProject.update({
      where: { id },
      data: {
        ...(projectName && { projectName }),
        ...(progress !== undefined && { progress: parseFloat(progress) }),
        ...(projectManager && { projectManager }),
        ...(dbStatus && { status: dbStatus as any }),
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user?.role !== "GM" && session.user?.role !== "TRUSTEE")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id, progress, status } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Map frontend status to database ItemStatus enum
    const dbStatus = normalizeItemStatus(status);

    const updateData: any = {};
    if (progress !== undefined) updateData.progress = parseFloat(progress);
    if (dbStatus !== undefined) updateData.status = dbStatus;

    const updated = await prisma.gMProject.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating project status:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user?.role !== "GM" && session.user?.role !== "TRUSTEE")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.gMProject.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
