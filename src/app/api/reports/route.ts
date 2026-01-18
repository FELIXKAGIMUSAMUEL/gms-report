import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const reportSchema = z.object({
  year: z.number().min(2020).max(2100),
  quarter: z.number().min(1).max(4),
  baptisms: z.number().min(0),
  professionOfFaith: z.number().min(0),
  tithes: z.number().min(0),
  combinedOfferings: z.number().min(0),
  membership: z.number().min(0),
  sabbathSchoolAttendance: z.number().min(0),
});

// GET /api/reports - Get all reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const quarter = searchParams.get("quarter");

    let reports;
    if (year && quarter) {
      reports = await prisma.report.findUnique({
        where: {
          year_quarter: {
            year: parseInt(year),
            quarter: parseInt(quarter),
          },
        },
      });
      return NextResponse.json(reports);
    }

    reports = await prisma.report.findMany({
      orderBy: [{ year: "desc" }, { quarter: "desc" }],
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create or update a report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = reportSchema.parse(body);

    const report = await prisma.report.upsert({
      where: {
        year_quarter: {
          year: validatedData.year,
          quarter: validatedData.quarter,
        },
      },
      update: {
        baptisms: validatedData.baptisms,
        professionOfFaith: validatedData.professionOfFaith,
        tithes: validatedData.tithes,
        combinedOfferings: validatedData.combinedOfferings,
        membership: validatedData.membership,
        sabbathSchoolAttendance: validatedData.sabbathSchoolAttendance,
      },
      create: validatedData,
    });

    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating/updating report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
