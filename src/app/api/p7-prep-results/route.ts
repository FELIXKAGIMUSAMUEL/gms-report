import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const term = searchParams.get('term') ? parseInt(searchParams.get('term')!) : 1;
    const school = searchParams.get('school');
    const prepNumber = searchParams.get('prepNumber') ? parseInt(searchParams.get('prepNumber')!) : undefined;

    const where: any = { year, term };
    if (school) where.school = school;
    if (prepNumber) where.prepNumber = prepNumber;

    const results = await prisma.p7PrepResult.findMany({
      where,
      orderBy: [{ prepNumber: 'asc' }, { school: 'asc' }],
    });

    console.log(`🔍 P7 Prep Results API: year=${year}, term=${term}, records=${results.length}`);

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error fetching P7 prep results:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { school, prepNumber, term, year, enrollment, divisionI, divisionII, divisionIII, divisionIV, averageScore } = body;

    if (!school || prepNumber === undefined || !term || !year) {
      return NextResponse.json(
        { error: 'Missing required fields: school, prepNumber, term, year' },
        { status: 400 }
      );
    }

    // Validate divisions sum doesn't exceed enrollment
    const totalDivisions = (divisionI || 0) + (divisionII || 0) + (divisionIII || 0) + (divisionIV || 0);
    if (totalDivisions > enrollment) {
      return NextResponse.json(
        { error: `Divisions sum (${totalDivisions}) cannot exceed enrollment (${enrollment})` },
        { status: 400 }
      );
    }

    // Validate score is 0-100
    if (averageScore < 0 || averageScore > 100) {
      return NextResponse.json(
        { error: 'Average score must be between 0 and 100' },
        { status: 400 }
      );
    }

    const result = await prisma.p7PrepResult.upsert({
      where: { school_prepNumber_term_year: { school, prepNumber, term, year } },
      update: {
        enrollment,
        divisionI,
        divisionII,
        divisionIII,
        divisionIV,
        averageScore,
      },
      create: {
        school,
        prepNumber,
        term,
        year,
        enrollment,
        divisionI,
        divisionII,
        divisionIII,
        divisionIV,
        averageScore,
      },
    });

    console.log(`✅ P7 Prep Result saved: ${school} Prep ${prepNumber}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving P7 prep result:', error);
    return NextResponse.json({ error: 'Failed to save result' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    await prisma.p7PrepResult.delete({
      where: { id },
    });

    console.log(`🗑️ P7 Prep Result deleted: ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting P7 prep result:', error);
    return NextResponse.json({ error: 'Failed to delete result' }, { status: 500 });
  }
}
