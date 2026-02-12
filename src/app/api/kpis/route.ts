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

    const url = new URL(request.url);
    const yearParam = url.searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    const kpis = await prisma.kPIData.findMany({
      where: {
        year,
      },
      orderBy: {
        month: "asc",
      },
    });

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
