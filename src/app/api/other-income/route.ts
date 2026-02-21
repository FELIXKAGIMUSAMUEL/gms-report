import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("[other-income GET] Starting fetch...");
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');
    const term = searchParams.get('term');
    const week = searchParams.get('week');
    
    const where: any = {};
    if (year) where.year = parseInt(year);
    if (term) where.term = parseInt(term);
    if (week) where.week = parseInt(week);
    
    const incomeData = await prisma.otherIncome.findMany({
      where,
      orderBy: [{ year: "desc" }, { term: "desc" }, { week: "desc" }, { month: "desc" }],
    });
    console.log("[other-income GET] Success, found", incomeData.length, "entries");
    return NextResponse.json({ data: incomeData });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : "";
    console.error("[other-income GET] Error:", msg);
    console.error("[other-income GET] Stack:", stack);
    return NextResponse.json(
      { error: msg || "Internal server error", type: error instanceof Error ? error.constructor.name : "unknown" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log("[other-income POST] Starting...");
    const { source, percentage, year, month, term, week, amount } = await request.json();

    if (!source || !year) {
      return NextResponse.json(
        { error: "Missing required fields (source, year)" },
        { status: 400 }
      );
    }

    if (percentage !== undefined && (percentage < 0 || percentage > 100)) {
      return NextResponse.json(
        { error: "Percentage must be between 0 and 100" },
        { status: 400 }
      );
    }

    const incomeEntry = await prisma.otherIncome.create({
      data: {
        source: source.trim(),
        percentage: percentage || 0,
        amount: amount || 0,
        year,
        month: month || new Date().getMonth() + 1,
        term: term || 1,
        week: week || null,
      },
    });
    console.log("[other-income POST] Created entry:", incomeEntry.id);
    return NextResponse.json(incomeEntry, { status: 201 });
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error("[other-income POST] Error:", msg);
    console.error("[other-income POST] Stack:", error?.stack);
    return NextResponse.json(
      { error: msg || "Internal server error", code: error?.code },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log("[other-income PUT] Starting...");
    const { id, source, percentage, year, month, term, week, amount } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    const data: any = {};
    if (source !== undefined) data.source = source.trim();
    if (percentage !== undefined) {
      if (percentage < 0 || percentage > 100) {
        return NextResponse.json(
          { error: "Percentage must be between 0 and 100" },
          { status: 400 }
        );
      }
      data.percentage = percentage;
    }
    if (amount !== undefined) data.amount = amount;
    if (year !== undefined) data.year = year;
    if (month !== undefined) data.month = month;
    if (term !== undefined) data.term = term;
    if (week !== undefined) data.week = week;

    const updated = await prisma.otherIncome.update({
      where: { id },
      data,
    });
    console.log("[other-income PUT] Updated entry:", id);
    return NextResponse.json(updated);
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error("[other-income PUT] Error:", msg);
    console.error("[other-income PUT] Stack:", error?.stack);
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

    await prisma.otherIncome.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Income entry deleted" });
  } catch (error) {
    console.error("Error deleting income entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
