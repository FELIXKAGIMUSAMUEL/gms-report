import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weeklyReportId = searchParams.get("reportId");
    const year = searchParams.get("year");
    const term = searchParams.get("term");
    const week = searchParams.get("week");

    let where: any = {};
    if (weeklyReportId) where.weeklyReportId = weeklyReportId;
    if (year && term && week) {
      where.year = parseInt(year);
      where.term = parseInt(term);
      where.week = parseInt(week);
    }

    const data = await prisma.schoolKPIData.findMany({
      where,
      orderBy: { school: "asc" },
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching school KPI data:", error);
    return NextResponse.json(
      { error: "Failed to fetch school KPI data" },
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
      weeklyReportId,
      school,
      year,
      term,
      week,
      feesCollectionPercent,
      expenditurePercent,
      infrastructurePercent,
      syllabusCoveragePercent,
      admissionsCount,
    } = body;

    if (!weeklyReportId || !school || !year || !term || !week) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const data = await prisma.schoolKPIData.upsert({
      where: {
        weeklyReportId_school: { weeklyReportId, school },
      },
      create: {
        weeklyReportId,
        school,
        year,
        term,
        week,
        feesCollectionPercent: feesCollectionPercent || 0,
        expenditurePercent: expenditurePercent || 0,
        infrastructurePercent: infrastructurePercent || 0,
        syllabusCoveragePercent: syllabusCoveragePercent || 0,
        admissionsCount: admissionsCount || 0,
      },
      update: {
        feesCollectionPercent: feesCollectionPercent || 0,
        expenditurePercent: expenditurePercent || 0,
        infrastructurePercent: infrastructurePercent || 0,
        syllabusCoveragePercent: syllabusCoveragePercent || 0,
        admissionsCount: admissionsCount || 0,
      },
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error saving school KPI data:", error);
    return NextResponse.json(
      { error: "Failed to save school KPI data" },
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const data = await prisma.schoolKPIData.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error updating school KPI data:", error);
    return NextResponse.json(
      { error: "Failed to update school KPI data" },
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
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await prisma.schoolKPIData.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting school KPI data:", error);
    return NextResponse.json(
      { error: "Failed to delete school KPI data" },
      { status: 500 }
    );
  }
}
