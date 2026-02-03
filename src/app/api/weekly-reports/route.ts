import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reports = await prisma.weeklyReport.findMany({
      where: {
        isDraft: false,
      },
      orderBy: [
        { year: "asc" },
        { weekNumber: "asc" },
      ],
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching weekly reports:", error);
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
      weekNumber,
      year,
      term = 1,
      weekStartDate,
      weekEndDate,
      feesCollectionPercent,
      schoolsExpenditurePercent,
      infrastructurePercent,
      totalEnrollment,
      theologyEnrollment,
      p7PrepExamsPercent,
      syllabusCoveragePercent,
      admissions,
      isDraft,
    } = body;

    const report = await prisma.weeklyReport.upsert({
      where: {
        weekNumber_year_term: {
          weekNumber: parseInt(weekNumber),
          year: parseInt(year),
          term: parseInt(term),
        },
      },
      update: {
        term: parseInt(term) || 1,
        feesCollectionPercent: parseFloat(feesCollectionPercent),
        schoolsExpenditurePercent: parseFloat(schoolsExpenditurePercent),
        infrastructurePercent: parseFloat(infrastructurePercent),
        totalEnrollment: parseInt(totalEnrollment),
        theologyEnrollment: parseInt(theologyEnrollment),
        p7PrepExamsPercent: parseFloat(p7PrepExamsPercent),
        syllabusCoveragePercent: parseFloat(syllabusCoveragePercent),
        admissions: parseInt(admissions),
        isDraft: isDraft !== undefined ? isDraft : false,
        publishedAt: isDraft ? null : new Date(),
      },
      create: {
        weekNumber: parseInt(weekNumber),
        year: parseInt(year),
        term: parseInt(term) || 1,
        weekStartDate: new Date(weekStartDate),
        weekEndDate: new Date(weekEndDate),
        feesCollectionPercent: parseFloat(feesCollectionPercent),
        schoolsExpenditurePercent: parseFloat(schoolsExpenditurePercent),
        infrastructurePercent: parseFloat(infrastructurePercent),
        totalEnrollment: parseInt(totalEnrollment),
        theologyEnrollment: parseInt(theologyEnrollment),
        p7PrepExamsPercent: parseFloat(p7PrepExamsPercent),
        syllabusCoveragePercent: parseFloat(syllabusCoveragePercent),
        admissions: parseInt(admissions),
        isDraft: isDraft !== undefined ? isDraft : false,
        publishedAt: isDraft ? null : new Date(),
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error creating/updating weekly report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
