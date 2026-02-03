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

    // Get current and previous month data for comparisons
    const currentYear = 2026;
    const currentMonth = 6; // June 2026
    const previousMonth = 5;

    const currentData = await prisma.kPIData.findUnique({
      where: {
        month_year: {
          month: currentMonth,
          year: currentYear,
        },
      },
    });

    const previousData = await prisma.kPIData.findUnique({
      where: {
        month_year: {
          month: previousMonth,
          year: currentYear,
        },
      },
    });

    if (!currentData) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    // Calculate trends
    const kpis = {
      feesCollection: {
        current: currentData.feesCollectionPercent,
        previous: previousData?.feesCollectionPercent || 0,
        trend: previousData
          ? currentData.feesCollectionPercent - previousData.feesCollectionPercent
          : 0,
      },
      schoolsExpenditure: {
        current: currentData.schoolsExpenditurePercent,
        previous: previousData?.schoolsExpenditurePercent || 0,
        trend: previousData
          ? currentData.schoolsExpenditurePercent - previousData.schoolsExpenditurePercent
          : 0,
      },
      infrastructure: {
        current: currentData.infrastructurePercent,
        previous: previousData?.infrastructurePercent || 0,
        trend: previousData
          ? currentData.infrastructurePercent - previousData.infrastructurePercent
          : 0,
      },
      totalEnrollment: {
        current: currentData.totalEnrollment,
        previous: previousData?.totalEnrollment || 0,
        trend: previousData
          ? currentData.totalEnrollment - previousData.totalEnrollment
          : 0,
      },
      theologyEnrollment: {
        current: currentData.theologyEnrollment,
        previous: previousData?.theologyEnrollment || 0,
        trend: previousData
          ? currentData.theologyEnrollment - previousData.theologyEnrollment
          : 0,
      },
      p7PrepExams: {
        current: currentData.p7PrepExamsPercent,
        previous: previousData?.p7PrepExamsPercent || 0,
        trend: previousData
          ? currentData.p7PrepExamsPercent - previousData.p7PrepExamsPercent
          : 0,
      },
    };

    return NextResponse.json(kpis);
  } catch (error) {
    console.error("Error fetching KPIs:", error);
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
      month,
      year,
      feesCollectionPercent,
      schoolsExpenditurePercent,
      infrastructurePercent,
      totalEnrollment,
      theologyEnrollment,
      p7PrepExamsPercent,
    } = body;

    const kpiData = await prisma.kPIData.upsert({
      where: {
        month_year: {
          month: parseInt(month),
          year: parseInt(year),
        },
      },
      update: {
        feesCollectionPercent: parseFloat(feesCollectionPercent),
        schoolsExpenditurePercent: parseFloat(schoolsExpenditurePercent),
        infrastructurePercent: parseFloat(infrastructurePercent),
        totalEnrollment: parseInt(totalEnrollment),
        theologyEnrollment: parseInt(theologyEnrollment),
        p7PrepExamsPercent: parseFloat(p7PrepExamsPercent),
      },
      create: {
        month: parseInt(month),
        year: parseInt(year),
        feesCollectionPercent: parseFloat(feesCollectionPercent),
        schoolsExpenditurePercent: parseFloat(schoolsExpenditurePercent),
        infrastructurePercent: parseFloat(infrastructurePercent),
        totalEnrollment: parseInt(totalEnrollment),
        theologyEnrollment: parseInt(theologyEnrollment),
        p7PrepExamsPercent: parseFloat(p7PrepExamsPercent),
      },
    });

    return NextResponse.json(kpiData);
  } catch (error) {
    console.error("Error updating KPIs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
