import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const field = searchParams.get("field");
    const generalManager = searchParams.get("generalManager");

    // Build where clause
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (field) {
      where.field = field;
    }

    // Fetch comments with report data
    const comments = await prisma.comment.findMany({
      where,
      include: {
        report: {
          select: {
            year: true,
            term: true,
            weekNumber: true,
            generalManager: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filter by generalManager if provided (after fetching with report relation)
    let filteredComments = comments;
    if (generalManager) {
      filteredComments = comments.filter(
        (c) => c.report?.generalManager === generalManager
      );
    }

    return NextResponse.json(filteredComments);
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "GM") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reportId, field, text } = body;

    if (!reportId || !field || !text) {
      return NextResponse.json(
        { error: "Missing required fields: reportId, field, text" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        reportId,
        field,
        text,
      },
      include: {
        report: {
          select: {
            year: true,
            term: true,
            weekNumber: true,
            generalManager: true,
          },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error: any) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment", details: error.message },
      { status: 500 }
    );
  }
}
