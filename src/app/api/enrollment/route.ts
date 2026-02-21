import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch enrollment data
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

    const data = await prisma.enrollment.findMany({
      where: query,
      orderBy: [{ year: "desc" }, { term: "desc" }, { school: "asc" }, { class: "asc" }],
    });

    console.log(`🔍 Enrollment API Query: year=${year}, term=${term}, records=${data.length}, total=${data.reduce((s, e) => s + e.count, 0)}`);

    const response = NextResponse.json(data);
    // Prevent caching to ensure fresh data on filter changes
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    return response;
  } catch (error) {
    console.error("Failed to fetch enrollment enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollment enrollments" },
      { status: 500 }
    );
  }
}

// POST: Create enrollment enrollment record
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
    const data = await prisma.enrollment.upsert({
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
    console.error("Failed to save enrollment enrollment:", error);
    return NextResponse.json(
      { error: "Failed to save enrollment enrollment" },
      { status: 500 }
    );
  }
}

// PUT: Update enrollment enrollment record
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

    const data = await prisma.enrollment.update({
      where: { id },
      data: { count },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to update enrollment enrollment:", error);
    return NextResponse.json(
      { error: "Failed to update enrollment enrollment" },
      { status: 500 }
    );
  }
}

// DELETE: Delete enrollment enrollment record
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

    await prisma.enrollment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete enrollment enrollment:", error);
    return NextResponse.json(
      { error: "Failed to delete enrollment enrollment" },
      { status: 500 }
    );
  }
}
