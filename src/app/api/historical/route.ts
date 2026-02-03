import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/historical - Get historical data aggregated by year or week
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get("groupBy") || "week";
    const startYear = parseInt(searchParams.get("startYear") || "2020");
    const endYear = parseInt(searchParams.get("endYear") || "2026");

    const reports = await prisma.weeklyReport.findMany({
      where: {
        year: {
          gte: startYear,
          lte: endYear,
        },
        isDraft: false,
      },
      orderBy: [{ year: "asc" }, { weekNumber: "asc" }],
    });

    if (groupBy === "year") {
      // Aggregate by year
      const yearlyData = reports.reduce((acc: any, report) => {
        const existing = acc.find((item: any) => item.year === report.year);
        if (existing) {
          existing.totalEnrollment = report.totalEnrollment; // Take latest
          existing.theologyEnrollment = report.theologyEnrollment; // Take latest
          existing.admissions += report.admissions;
          existing.avgFeesCollection = (existing.avgFeesCollection * existing.weeks + report.feesCollectionPercent) / (existing.weeks + 1);
          existing.avgInfrastructure = (existing.avgInfrastructure * existing.weeks + report.infrastructurePercent) / (existing.weeks + 1);
          existing.weeks += 1;
        } else {
          acc.push({
            year: report.year,
            totalEnrollment: report.totalEnrollment,
            theologyEnrollment: report.theologyEnrollment,
            admissions: report.admissions,
            avgFeesCollection: report.feesCollectionPercent,
            avgInfrastructure: report.infrastructurePercent,
            weeks: 1,
          });
        }
        return acc;
      }, []);

      return NextResponse.json(yearlyData);
    }

    // Return weekly data with formatted labels
    const weeklyData = reports.map((report) => ({
      ...report,
      label: `W${report.weekNumber} ${report.year}`,
    }));

    return NextResponse.json(weeklyData);
  } catch (error) {
    console.error("Error fetching historical data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
