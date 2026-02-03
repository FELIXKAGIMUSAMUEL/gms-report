import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Fetch theology enrollment data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");
    const term = searchParams.get("term");
    const school = searchParams.get("school");

    const query: any = {};
    if (year) query.year = parseInt(year);
    if (term) query.term = parseInt(term);
    if (school) query.school = school;

    const data = await prisma.theologyEnrollment.findMany({
      where: query,
      orderBy: [{ year: "desc" }, { term: "desc" }, { school: "asc" }, { class: "asc" }],
    });

    console.log(`🔍 Theology API Query: year=${year}, term=${term}, records=${data.length}, total=${data.reduce((s, e) => s + e.count, 0)}`);

    const response = NextResponse.json(data);
    // Prevent caching to ensure fresh data on filter changes
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    return response;
  } catch (error) {
    console.error("Failed to fetch theology enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch theology enrollments" },
      { status: 500 }
    );
  }
}

// POST: Create theology enrollment record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { school, class: className, term, year, count } = body;

    if (!school || !className || !term || !year) {
      return NextResponse.json(
        { error: "Missing required fields: school, class, term, year" },
        { status: 400 }
      );
    }

    if (count < 0) {
      return NextResponse.json(
        { error: "Count cannot be negative" },
        { status: 400 }
      );
    }

    // Upsert: create or update
    const data = await prisma.theologyEnrollment.upsert({
      where: {
        school_class_term_year: {
          school,
          class: className,
          term,
          year,
        },
      },
      update: { count },
      create: {
        school,
        class: className,
        term,
        year,
        count,
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to save theology enrollment:", error);
    return NextResponse.json(
      { error: "Failed to save theology enrollment" },
      { status: 500 }
    );
  }
}

// PUT: Update theology enrollment record
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, school, class: className, term, year, count } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID is required for update" },
        { status: 400 }
      );
    }

    if (count < 0) {
      return NextResponse.json(
        { error: "Count cannot be negative" },
        { status: 400 }
      );
    }

    const data = await prisma.theologyEnrollment.update({
      where: { id },
      data: { count },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to update theology enrollment:", error);
    return NextResponse.json(
      { error: "Failed to update theology enrollment" },
      { status: 500 }
    );
  }
}

// DELETE: Delete theology enrollment record
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID is required for deletion" },
        { status: 400 }
      );
    }

    await prisma.theologyEnrollment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete theology enrollment:", error);
    return NextResponse.json(
      { error: "Failed to delete theology enrollment" },
      { status: 500 }
    );
  }
}
