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
    const week = searchParams.get("week");
    const year = searchParams.get("year") || "2026";
    const term = searchParams.get("term");

    const filter: Record<string, number> = { year: parseInt(year) };
    if (week) filter.week = parseInt(week);
    if (term) filter.term = parseInt(term);

    const scorecards = await prisma.weeklyScorecard.findMany({
      where: filter,
      orderBy: [
        { week: "desc" },
        { school: "asc" },
      ],
    });

    return NextResponse.json(scorecards);
  } catch (error) {
    console.error("Error fetching scorecards:", error);
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
      week,
      year,
      term = 1,
      school,
      academicPercent,
      financePercent,
      qualityPercent,
      tdpPercent,
      theologyPercent,
    } = body;

    const scorecard = await prisma.weeklyScorecard.upsert({
      where: {
        week_year_term_school: {
          week: parseInt(week),
          year: parseInt(year),
          term: parseInt(term),
          school,
        },
      },
      update: {
        term: parseInt(term),
        academicPercent: parseFloat(academicPercent),
        financePercent: parseFloat(financePercent),
        qualityPercent: parseFloat(qualityPercent),
        tdpPercent: parseFloat(tdpPercent),
        theologyPercent: parseFloat(theologyPercent),
      },
      create: {
        week: parseInt(week),
        year: parseInt(year),
        term: parseInt(term),
        school,
        academicPercent: parseFloat(academicPercent),
        financePercent: parseFloat(financePercent),
        qualityPercent: parseFloat(qualityPercent),
        tdpPercent: parseFloat(tdpPercent),
        theologyPercent: parseFloat(theologyPercent),
      },
    });

    return NextResponse.json(scorecard);
  } catch (error) {
    console.error("Error creating/updating scorecard:", error);
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
    const {
      week,
      year,
      term = 1,
      school,
      academicPercent,
      financePercent,
      qualityPercent,
      tdpPercent,
      theologyPercent,
    } = body;

    const scorecard = await prisma.weeklyScorecard.update({
      where: { id },
      data: {
        week: parseInt(week),
        year: parseInt(year),
        term: parseInt(term ?? 1),
        school,
        academicPercent: parseFloat(academicPercent),
        financePercent: parseFloat(financePercent),
        qualityPercent: parseFloat(qualityPercent),
        tdpPercent: parseFloat(tdpPercent),
        theologyPercent: parseFloat(theologyPercent),
      },
    });

    return NextResponse.json(scorecard);
  } catch (error) {
    console.error("Error updating scorecard:", error);
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

    await prisma.weeklyScorecard.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Scorecard deleted successfully" });
  } catch (error) {
    console.error("Error deleting scorecard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
