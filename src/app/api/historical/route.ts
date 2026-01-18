import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/historical - Get historical data aggregated by year or quarter
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get("groupBy") || "quarter";
    const startYear = parseInt(searchParams.get("startYear") || "2020");
    const endYear = parseInt(searchParams.get("endYear") || "2026");

    const reports = await prisma.report.findMany({
      where: {
        year: {
          gte: startYear,
          lte: endYear,
        },
      },
      orderBy: [{ year: "asc" }, { quarter: "asc" }],
    });

    if (groupBy === "year") {
      // Aggregate by year
      const yearlyData = reports.reduce((acc: any, report) => {
        const existing = acc.find((item: any) => item.year === report.year);
        if (existing) {
          existing.baptisms += report.baptisms;
          existing.professionOfFaith += report.professionOfFaith;
          existing.tithes += report.tithes;
          existing.combinedOfferings += report.combinedOfferings;
          existing.membership = report.membership; // Take latest
          existing.sabbathSchoolAttendance = report.sabbathSchoolAttendance; // Take latest
          existing.quarters += 1;
        } else {
          acc.push({
            year: report.year,
            baptisms: report.baptisms,
            professionOfFaith: report.professionOfFaith,
            tithes: report.tithes,
            combinedOfferings: report.combinedOfferings,
            membership: report.membership,
            sabbathSchoolAttendance: report.sabbathSchoolAttendance,
            quarters: 1,
          });
        }
        return acc;
      }, []);

      return NextResponse.json(yearlyData);
    }

    // Return quarterly data with formatted labels
    const quarterlyData = reports.map((report) => ({
      ...report,
      label: `Q${report.quarter} ${report.year}`,
    }));

    return NextResponse.json(quarterlyData);
  } catch (error) {
    console.error("Error fetching historical data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
