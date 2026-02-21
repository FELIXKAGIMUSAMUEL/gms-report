import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");
    const term = searchParams.get("term");
    const enrollmentTypeId = searchParams.get("enrollmentTypeId");
    const school = searchParams.get("school");
    const cls = searchParams.get("class");

    const where: any = {};
    if (year) where.year = Number(year);
    if (term) where.term = Number(term);
    if (enrollmentTypeId) where.enrollmentTypeId = enrollmentTypeId;
    if (school) where.school = school;
    if (cls) where.class = cls;

    const records = await prisma.dynamicEnrollment.findMany({
      where,
      include: { enrollmentType: true },
      orderBy: [{ year: "desc" }, { term: "desc" }, { school: "asc" }, { class: "asc" }],
    });

    return NextResponse.json({ data: records });
  } catch (error) {
    console.error("Error fetching dynamic enrollments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { enrollmentTypeId, school = "", class: cls = "", year, term, count } = await request.json();

    if (!enrollmentTypeId || !year || !term) {
      return NextResponse.json(
        { error: "Missing required fields: enrollmentTypeId, year, term" },
        { status: 400 }
      );
    }

    if (typeof count !== "number" || count < 0) {
      return NextResponse.json({ error: "Count must be a non-negative number" }, { status: 400 });
    }

    const saved = await prisma.dynamicEnrollment.upsert({
      where: {
        enrollmentTypeId_school_class_year_term: {
          enrollmentTypeId,
          school,
          class: cls,
          year: Number(year),
          term: Number(term),
        },
      },
      update: { count },
      create: {
        enrollmentTypeId,
        school,
        class: cls,
        year: Number(year),
        term: Number(term),
        count,
      },
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error("Error saving dynamic enrollment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, school, class: cls, count } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    const data: any = {};
    if (school !== undefined) data.school = school;
    if (cls !== undefined) data.class = cls;
    if (count !== undefined) {
      if (typeof count !== "number" || count < 0)
        return NextResponse.json({ error: "Count must be a non-negative number" }, { status: 400 });
      data.count = count;
    }
    const updated = await prisma.dynamicEnrollment.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating dynamic enrollment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    await prisma.dynamicEnrollment.delete({ where: { id } });
    return NextResponse.json({ message: "Record deleted" });
  } catch (error) {
    console.error("Error deleting dynamic enrollment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
