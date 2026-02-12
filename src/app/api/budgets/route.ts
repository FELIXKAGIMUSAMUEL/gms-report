import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const parseNumber = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const year = parseNumber(searchParams.get("year"), new Date().getFullYear());
    const term = parseNumber(searchParams.get("term"), 1);

    const entries = await prisma.budgetEntry.findMany({
      where: { year, term },
      orderBy: [{ category: "asc" }],
    });

    return NextResponse.json({ data: entries });
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "GM") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { year, term, category, amount, notes } = body;

    const parsedYear = parseInt(year, 10);
    const parsedTerm = term ? parseInt(term, 10) : 1;
    const parsedAmount = parseFloat(amount);

    if (Number.isNaN(parsedYear)) {
      return NextResponse.json({ error: "year is required" }, { status: 400 });
    }
    if (!category || !String(category).trim()) {
      return NextResponse.json({ error: "category is required" }, { status: 400 });
    }
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json({ error: "amount must be non-negative" }, { status: 400 });
    }

    const entry = await prisma.budgetEntry.upsert({
      where: {
        year_term_category: {
          year: parsedYear,
          term: Number.isNaN(parsedTerm) ? 1 : parsedTerm,
          category: String(category).trim(),
        },
      },
      update: {
        amount: parsedAmount,
        notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      },
      create: {
        year: parsedYear,
        term: Number.isNaN(parsedTerm) ? 1 : parsedTerm,
        category: String(category).trim(),
        amount: parsedAmount,
        notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating budget entry:", error);
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
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.budgetEntry.delete({ where: { id } });
    return NextResponse.json({ message: "Budget entry deleted" });
  } catch (error) {
    console.error("Error deleting budget entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
