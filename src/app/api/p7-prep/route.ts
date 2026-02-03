import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const p7PrepData = await prisma.p7PrepPerformance.findMany({
      orderBy: {
        year: "asc",
      },
    });

    return NextResponse.json(p7PrepData);
  } catch (error) {
    console.error("Error fetching P7 prep data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const toNum = (v: any) => {
      const n = typeof v === "string" ? parseFloat(v) : v;
      return Number.isFinite(n) ? n : 0;
    };
    const year = typeof body?.year === "string" ? parseInt(body.year, 10) : body?.year;
    const p6Promotion = toNum(body?.p6Promotion);
    const prep1 = toNum(body?.prep1);
    const prep2 = toNum(body?.prep2);
    const prep3 = toNum(body?.prep3);
    const prep4 = toNum(body?.prep4);
    const prep5 = toNum(body?.prep5);
    const prep6 = toNum(body?.prep6);
    const prep7 = toNum(body?.prep7);
    const prep8 = toNum(body?.prep8);
    const prep9 = toNum(body?.prep9);
    const ple = toNum(body?.ple);

    if (!Number.isFinite(year)) {
      return NextResponse.json({ error: "'year' is required and must be a number" }, { status: 400 });
    }

    // Upsert by unique 'year' to simplify UX
    const record = await prisma.p7PrepPerformance.upsert({
      where: { year },
      create: {
        year,
        p6Promotion,
        prep1,
        prep2,
        prep3,
        prep4,
        prep5,
        prep6,
        prep7,
        prep8,
        prep9,
        ple,
      },
      update: {
        p6Promotion,
        prep1,
        prep2,
        prep3,
        prep4,
        prep5,
        prep6,
        prep7,
        prep8,
        prep9,
        ple,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    console.error("Error creating/updating P7 prep record:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "A record for this year already exists." }, { status: 409 });
      }
    }
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "'id' query param is required" }, { status: 400 });
    }

    const body = await req.json();
    const toNum = (v: any) => {
      const n = typeof v === "string" ? parseFloat(v) : v;
      return Number.isFinite(n) ? n : 0;
    };
    const year = typeof body?.year === "string" ? parseInt(body.year, 10) : body?.year;
    const data: any = {
      p6Promotion: toNum(body?.p6Promotion),
      prep1: toNum(body?.prep1),
      prep2: toNum(body?.prep2),
      prep3: toNum(body?.prep3),
      prep4: toNum(body?.prep4),
      prep5: toNum(body?.prep5),
      prep6: toNum(body?.prep6),
      prep7: toNum(body?.prep7),
      prep8: toNum(body?.prep8),
      prep9: toNum(body?.prep9),
      ple: toNum(body?.ple),
    };
    if (Number.isFinite(year)) {
      data.year = year;
    }
    const record = await prisma.p7PrepPerformance.update({
      where: { id },
      data,
    });

    return NextResponse.json(record);
  } catch (error: any) {
    console.error("Error updating P7 prep record:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Record not found" }, { status: 404 });
      }
      if (error.code === "P2002") {
        return NextResponse.json({ error: "Another record already uses this year." }, { status: 409 });
      }
    }
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "'id' query param is required" }, { status: 400 });
    }

    await prisma.p7PrepPerformance.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting P7 prep record:", error);
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
