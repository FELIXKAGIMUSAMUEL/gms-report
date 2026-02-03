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
    const status = searchParams.get("status") || "ACTIVE";

    const issues = await prisma.redIssue.findMany({
      where: status === "ALL" ? {} : { itemStatus: status as any },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(issues);
  } catch (error) {
    console.error("Error fetching issues:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user?.role !== "GM" && session.user?.role !== "TRUSTEE")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { issue, inCharge, status, itemStatus } = body;
    const safeIssue = typeof issue === "string" && issue.trim().length > 0 ? issue.trim() : "Untitled issue";
    const safeInCharge = typeof inCharge === "string" ? inCharge.trim() : "";

    const redIssue = await prisma.redIssue.create({
      data: {
        issue: safeIssue,
        inCharge: safeInCharge,
        status: (status as any) || "OPEN",
        itemStatus: (itemStatus as any) || "ACTIVE",
      },
    });

    return NextResponse.json(redIssue);
  } catch (error) {
    console.error("Error creating issue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "GM") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { issue, inCharge, status, itemStatus } = body;

    const data: Record<string, any> = {};
    if (issue !== undefined) data.issue = typeof issue === "string" && issue.trim().length > 0 ? issue.trim() : "Untitled issue";
    if (inCharge !== undefined) data.inCharge = typeof inCharge === "string" ? inCharge.trim() : "";
    if (status !== undefined) data.status = status as any;
    if (itemStatus !== undefined) data.itemStatus = itemStatus as any;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const redIssue = await prisma.redIssue.update({
      where: { id },
      data,
    });

    return NextResponse.json(redIssue);
  } catch (error) {
    console.error("Error updating issue:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "GM") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id, itemStatus } = body;

    if (!id || !itemStatus) {
      return NextResponse.json({ error: "id and itemStatus are required" }, { status: 400 });
    }

    const updated = await prisma.redIssue.update({
      where: { id },
      data: { itemStatus },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating issue item status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "GM") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.redIssue.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Issue deleted successfully" });
  } catch (error) {
    console.error("Error deleting issue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
