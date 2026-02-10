import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const toInt = (value: unknown) => {
  const parsed = typeof value === "string" ? parseInt(value, 10) : value;
  return Number.isFinite(parsed) ? (parsed as number) : 0;
};

const toFloat = (value: unknown) => {
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? (parsed as number) : 0;
};

const calculateApi = (agg4: number, divisionI: number, popn: number) => {
  if (!popn || popn <= 0) return 0;
  return (agg4 / popn) * 100 + (divisionI / popn) * 500;
};

const ordinal = (value: number) => {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  const mod10 = value % 10;
  if (mod10 === 1) return `${value}st`;
  if (mod10 === 2) return `${value}nd`;
  if (mod10 === 3) return `${value}rd`;
  return `${value}th`;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get("year");
    const school = searchParams.get("school");

    const where: any = {};
    if (yearParam) where.year = parseInt(yearParam, 10);
    if (school) where.school = school;

    const results = await prisma.p7PleResult.findMany({
      where,
      orderBy: [{ year: "asc" }, { school: "asc" }],
    });

    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("Error fetching P7 PLE results:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const school = body?.school;
    const year = toInt(body?.year);

    if (!school || !Number.isFinite(year)) {
      return NextResponse.json(
        { error: "Missing required fields: school, year" },
        { status: 400 }
      );
    }

    const popn = toInt(body?.popn);
    const agg4 = toInt(body?.agg4);
    const divisionI = toInt(body?.divisionI);
    const divisionII = toInt(body?.divisionII);
    const divisionIII = toInt(body?.divisionIII);
    const divisionIV = toInt(body?.divisionIV);
    const divisionU = toInt(body?.divisionU);
    const api = calculateApi(agg4, divisionI, popn);

    const totalDivisions = divisionI + divisionII + divisionIII + divisionIV + divisionU;
    if (popn > 0 && totalDivisions > popn) {
      return NextResponse.json(
        { error: `Divisions sum (${totalDivisions}) cannot exceed popn (${popn})` },
        { status: 400 }
      );
    }

    const result = await prisma.p7PleResult.upsert({
      where: { school_year: { school, year } },
      update: {
        popn,
        agg4,
        divisionI,
        divisionII,
        divisionIII,
        divisionIV,
        divisionU,
        api,
      },
      create: {
        school,
        year,
        popn,
        agg4,
        divisionI,
        divisionII,
        divisionIII,
        divisionIV,
        divisionU,
        api,
      },
    });

    const yearResults = await prisma.p7PleResult.findMany({
      where: { year },
      orderBy: [{ api: "desc" }, { school: "asc" }],
    });

    await prisma.$transaction(
      yearResults.map((record, index) =>
        prisma.p7PleResult.update({
          where: { id: record.id },
          data: { rank: ordinal(index + 1) },
        })
      )
    );

    const refreshed = await prisma.p7PleResult.findUnique({ where: { id: result.id } });

    return NextResponse.json(refreshed ?? result);
  } catch (error) {
    console.error("Error saving P7 PLE result:", error);
    return NextResponse.json({ error: "Failed to save result" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const existing = await prisma.p7PleResult.findUnique({ where: { id } });
    await prisma.p7PleResult.delete({ where: { id } });

    if (existing) {
      const yearResults = await prisma.p7PleResult.findMany({
        where: { year: existing.year },
        orderBy: [{ api: "desc" }, { school: "asc" }],
      });

      await prisma.$transaction(
        yearResults.map((record, index) =>
          prisma.p7PleResult.update({
            where: { id: record.id },
            data: { rank: ordinal(index + 1) },
          })
        )
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting P7 PLE result:", error);
    return NextResponse.json({ error: "Failed to delete result" }, { status: 500 });
  }
}
