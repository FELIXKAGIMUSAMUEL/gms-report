import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("[income-sources GET] Starting fetch...");
    const sources = await prisma.incomeSource.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    console.log("[income-sources GET] Success, found", sources.length, "sources");
    return NextResponse.json({ data: sources });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : "";
    console.error("[income-sources GET] Error:", msg);
    console.error("[income-sources GET] Stack:", stack);
    return NextResponse.json(
      { error: msg || "Internal server error", type: error instanceof Error ? error.constructor.name : "unknown" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log("[income-sources POST] Starting...");
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Source name is required" },
        { status: 400 }
      );
    }

    const source = await prisma.incomeSource.create({
      data: {
        name: name.trim(),
      },
    });
    console.log("[income-sources POST] Created source:", source.id);
    return NextResponse.json(source, { status: 201 });
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error("[income-sources POST] Error:", msg);
    console.error("[income-sources POST] Stack:", error?.stack);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Income source already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: msg || "Internal server error", code: error?.code },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    await prisma.incomeSource.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Income source deactivated" });
  } catch (error) {
    console.error("Error deactivating income source:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
