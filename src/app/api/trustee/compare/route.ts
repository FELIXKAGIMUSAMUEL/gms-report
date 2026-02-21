import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "TRUSTEE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const school1 = searchParams.get("school1");
    const school2 = searchParams.get("school2");

    if (!school1 || !school2) {
      return NextResponse.json({ error: "Both schools required" }, { status: 400 });
    }

    // Get current year and term
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    let currentTerm = Math.ceil(currentMonth / 4); // Rough estimate
    if (currentTerm > 3) currentTerm = 3;

    // Fetch latest weekly data for both schools
    const [report1Data, report2Data] = await Promise.all([
      prisma.schoolKPIData.findFirst({
        where: {
          school: school1,
          year: currentYear,
          term: currentTerm,
        },
        orderBy: { week: "desc" },
      }),
      prisma.schoolKPIData.findFirst({
        where: {
          school: school2,
          year: currentYear,
          term: currentTerm,
        },
        orderBy: { week: "desc" },
      }),
    ]);

    // Build comparison data
    const metrics = [
      { name: "Fees Collection %", key: "feesCollectionPercent" },
      { name: "Expenditure %", key: "expenditurePercent" },
      { name: "Infrastructure %", key: "infrastructurePercent" },
      { name: "Syllabus Coverage %", key: "syllabusCoveragePercent" },
      { name: "Admissions", key: "admissionsCount" },
    ];

    const comparisons = metrics.map((metric) => {
      const value1 = report1Data ? (report1Data as any)[metric.key] || 0 : 0;
      const value2 = report2Data ? (report2Data as any)[metric.key] || 0 : 0;

      const difference = value1 - value2;
      const percentDiff = value2 !== 0 ? ((difference / value2) * 100) : 0;

      return {
        metric: metric.name,
        school1: { name: school1, value: value1 },
        school2: { name: school2, value: value2 },
        difference: Math.round(difference * 100) / 100,
        percentDiff: Math.round(percentDiff * 100) / 100,
      };
    });

    return NextResponse.json(comparisons);
  } catch (error) {
    console.error("Error comparing schools:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
