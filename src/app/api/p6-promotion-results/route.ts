import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const toInt = (value: unknown) => {
  const parsed = typeof value === "string" ? parseInt(value, 10) : value;
  return Number.isFinite(parsed) ? (parsed as number) : 0;
};

const calculateApi = (agg4: number, divisionI: number, actualPopn: number) => {
  if (!actualPopn || actualPopn <= 0) return 0;
  return (agg4 / actualPopn) * 100 + (divisionI / actualPopn) * 500;
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
    const setParam = searchParams.get("setNumber");
    const school = searchParams.get("school");

    const where: any = {};
    if (yearParam) where.year = parseInt(yearParam, 10);
    if (setParam) where.setNumber = parseInt(setParam, 10);
    if (school) where.school = school;

    const results = await prisma.p6PromotionResult.findMany({
      where,
      orderBy: [{ year: "asc" }, { setNumber: "asc" }, { school: "asc" }],
    });

    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("Error fetching P6 promotion results:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const school = body?.school;
    const year = toInt(body?.year);
    const setNumber = toInt(body?.setNumber);

    if (!school || !Number.isFinite(year) || !Number.isFinite(setNumber)) {
      return NextResponse.json(
        { error: "Missing required fields: school, year, setNumber" },
        { status: 400 }
      );
    }

    if (![4, 5, 6].includes(setNumber)) {
      return NextResponse.json({ error: "setNumber must be 4, 5, or 6" }, { status: 400 });
    }

    const popn = toInt(body?.popn);
    const absences = toInt(body?.absences);
    const providedActual = toInt(body?.actualPopn);
    const actualPopn = providedActual > 0 ? providedActual : Math.max(popn - absences, 0);
    const agg4 = toInt(body?.agg4);
    const divisionI = toInt(body?.divisionI);
    const divisionII = toInt(body?.divisionII);
    const divisionIII = toInt(body?.divisionIII);
    const divisionIV = toInt(body?.divisionIV);
    const ungraded = toInt(body?.ungraded);
    const api = calculateApi(agg4, divisionI, actualPopn);

    const totalDivisions = divisionI + divisionII + divisionIII + divisionIV + ungraded;
    if (actualPopn > 0 && totalDivisions > actualPopn) {
      return NextResponse.json(
        { error: `Divisions sum (${totalDivisions}) cannot exceed actual popn (${actualPopn})` },
        { status: 400 }
      );
    }

    const result = await prisma.p6PromotionResult.upsert({
      where: { school_year_setNumber: { school, year, setNumber } },
      update: {
        popn,
        absences,
        actualPopn,
        agg4,
        divisionI,
        divisionII,
        divisionIII,
        divisionIV,
        ungraded,
        api,
      },
      create: {
        school,
        year,
        setNumber,
        popn,
        absences,
        actualPopn,
        agg4,
        divisionI,
        divisionII,
        divisionIII,
        divisionIV,
        ungraded,
        api,
      },
    });

    const peerResults = await prisma.p6PromotionResult.findMany({
      where: { year, setNumber },
      orderBy: [{ api: "desc" }, { school: "asc" }],
    });

    await prisma.$transaction(
      peerResults.map((record, index) =>
        prisma.p6PromotionResult.update({
          where: { id: record.id },
          data: { rank: ordinal(index + 1) },
        })
      )
    );

    const refreshed = await prisma.p6PromotionResult.findUnique({ where: { id: result.id } });

    return NextResponse.json(refreshed ?? result);
  } catch (error) {
    console.error("Error saving P6 promotion result:", error);
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

    const existing = await prisma.p6PromotionResult.findUnique({ where: { id } });
    await prisma.p6PromotionResult.delete({ where: { id } });

    if (existing) {
      const peerResults = await prisma.p6PromotionResult.findMany({
        where: { year: existing.year, setNumber: existing.setNumber },
        orderBy: [{ api: "desc" }, { school: "asc" }],
      });

      await prisma.$transaction(
        peerResults.map((record, index) =>
          prisma.p6PromotionResult.update({
            where: { id: record.id },
            data: { rank: ordinal(index + 1) },
          })
        )
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting P6 promotion result:", error);
    return NextResponse.json({ error: "Failed to delete result" }, { status: 500 });
  }
}
