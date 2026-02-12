import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "TRUSTEE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    const where: any = {};
    if (year) {
      where.year = parseInt(year);
    }

    const goals = await prisma.goal.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "TRUSTEE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, category, targetValue, unit, year, term, currentValue, progress, status } = body;

    if (!title || !category || !targetValue || !unit || !year) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const goal = await prisma.goal.create({
      data: {
        title,
        description,
        category,
        targetValue: parseFloat(targetValue),
        currentValue: currentValue ? parseFloat(currentValue) : 0,
        progress: progress ? parseFloat(progress) : 0,
        unit,
        year: parseInt(year),
        term: term ? parseInt(term) : null,
        status: status || "not-started",
      },
    });

    return NextResponse.json(goal);
  } catch (error: any) {
    console.error("Error creating goal:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Goal already exists for this year" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "TRUSTEE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id, currentValue, progress, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Goal ID required" }, { status: 400 });
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...(currentValue !== undefined && { currentValue: parseFloat(currentValue) }),
        ...(progress !== undefined && { progress: parseFloat(progress) }),
        ...(status && { status }),
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error("Error updating goal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "TRUSTEE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Goal ID required" }, { status: 400 });
    }

    await prisma.goal.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Goal deleted" });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
