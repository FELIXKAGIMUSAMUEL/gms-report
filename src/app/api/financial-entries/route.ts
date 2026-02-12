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
    const term = searchParams.get("term");
    const month = searchParams.get("month");
    const type = searchParams.get("type");
    const school = searchParams.get("school");
    const source = searchParams.get("source");
    const category = searchParams.get("category");

    const where: any = { year };
    if (term) where.term = parseNumber(term, 1);
    if (month) where.month = parseNumber(month, 1);
    if (type) where.type = type;
    if (school) where.school = school;
    if (source) where.source = source;
    if (category) where.category = category;

    const entries = await prisma.financialEntry.findMany({
      where,
      orderBy: [{ year: "desc" }, { term: "desc" }, { month: "desc" }, { week: "desc" }],
    });

    return NextResponse.json({ data: entries });
  } catch (error) {
    console.error("Error fetching financial entries:", error);
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
    const {
      type,
      amount,
      year,
      term,
      month,
      week,
      school,
      source,
      category,
      notes,
    } = body;

    if (!type || (type !== "INCOME" && type !== "EXPENSE")) {
      return NextResponse.json(
        { error: "type must be INCOME or EXPENSE" },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json(
        { error: "amount must be a valid non-negative number" },
        { status: 400 }
      );
    }

    const parsedYear = parseInt(year, 10);
    if (Number.isNaN(parsedYear)) {
      return NextResponse.json({ error: "year is required" }, { status: 400 });
    }

    const parsedTerm = term ? parseInt(term, 10) : 1;
    const parsedMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    const parsedWeek = week ? parseInt(week, 10) : null;

    const entry = await prisma.financialEntry.create({
      data: {
        type,
        amount: parsedAmount,
        year: parsedYear,
        term: Number.isNaN(parsedTerm) ? 1 : parsedTerm,
        month: Number.isNaN(parsedMonth) ? 1 : parsedMonth,
        week: Number.isNaN(parsedWeek as any) ? null : parsedWeek,
        school: typeof school === "string" && school.trim() ? school.trim() : null,
        source: typeof source === "string" && source.trim() ? source.trim() : null,
        category: typeof category === "string" && category.trim() ? category.trim() : null,
        notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating financial entry:", error);
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

    const body = await request.json();
    const {
      id,
      type,
      amount,
      year,
      term,
      month,
      week,
      school,
      source,
      category,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const data: any = {};
    if (type) data.type = type;
    if (amount !== undefined) data.amount = parseFloat(amount) || 0;
    if (year !== undefined) data.year = parseInt(year, 10);
    if (term !== undefined) data.term = parseInt(term, 10) || 1;
    if (month !== undefined) data.month = parseInt(month, 10) || 1;
    if (week !== undefined) data.week = week ? parseInt(week, 10) : null;
    if (school !== undefined) data.school = school ? String(school).trim() : null;
    if (source !== undefined) data.source = source ? String(source).trim() : null;
    if (category !== undefined) data.category = category ? String(category).trim() : null;
    if (notes !== undefined) data.notes = notes ? String(notes).trim() : null;

    const updated = await prisma.financialEntry.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating financial entry:", error);
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

    await prisma.financialEntry.delete({ where: { id } });
    return NextResponse.json({ message: "Financial entry deleted" });
  } catch (error) {
    console.error("Error deleting financial entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
