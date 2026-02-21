import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const all = request.nextUrl.searchParams.get("all") === "true";
    const types = await prisma.enrollmentType.findMany({
      where: all ? undefined : { isActive: true },
      include: { _count: { select: { records: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: types });
  } catch (error) {
    console.error("Error fetching enrollment types:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Type name is required" }, { status: 400 });
    }

    const created = await prisma.enrollmentType.create({
      data: { name: name.trim() },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Enrollment type already exists" }, { status: 409 });
    }
    console.error("Error creating enrollment type:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, isActive } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const data: any = {};
    if (name !== undefined) {
      if (!name.trim()) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      data.name = name.trim();
    }
    if (isActive !== undefined) data.isActive = isActive;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.enrollmentType.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Enrollment type name already exists" }, { status: 409 });
    }
    console.error("Error updating enrollment type:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.enrollmentType.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Enrollment type deactivated" });
  } catch (error) {
    console.error("Error deactivating enrollment type:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
