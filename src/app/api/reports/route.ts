import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push-notifications";
import { prisma } from "@/lib/prisma";

// GET /api/reports - Get all weekly reports with optional filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const weekNumber = searchParams.get("weekNumber");
    const term = searchParams.get("term");

    const where: any = {};
    if (year) where.year = parseInt(year);
    if (weekNumber) where.weekNumber = parseInt(weekNumber);
    if (term) where.term = parseInt(term);

    const reports = await prisma.weeklyReport.findMany({
      where,
      orderBy: [{ year: "desc" }, { weekNumber: "desc" }],
    });

    return NextResponse.json({ data: reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/reports - Create a new weekly report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      year,
      weekNumber,
      term = 1,
      weekStartDate,
      weekEndDate,
      feesCollectionPercent,
      schoolsExpenditurePercent,
      infrastructurePercent,
      totalEnrollment,
      theologyEnrollment,
      p7PrepExamsPercent,
      syllabusCoveragePercent,
      admissions,
      isDraft,
    } = body;

    // Calculate week start and end dates if not provided
    let startDate = weekStartDate ? new Date(weekStartDate) : null;
    let endDate = weekEndDate ? new Date(weekEndDate) : null;

    if (!startDate || isNaN(startDate.getTime())) {
      // Calculate from ISO week number
      const jan4 = new Date(year, 0, 4);
      const dayOfWeek = jan4.getDay();
      const firstMonday = new Date(jan4);
      firstMonday.setDate(jan4.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      startDate = new Date(firstMonday);
      startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);
    }

    if (!endDate || isNaN(endDate.getTime())) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
    }

    const report = await prisma.weeklyReport.upsert({
      where: {
        weekNumber_year_term: { weekNumber, year, term },
      },
      update: {
        term,
        weekStartDate: startDate,
        weekEndDate: endDate,
        feesCollectionPercent: parseFloat(feesCollectionPercent) || 0,
        schoolsExpenditurePercent: parseFloat(schoolsExpenditurePercent) || 0,
        infrastructurePercent: parseFloat(infrastructurePercent) || 0,
        totalEnrollment: parseInt(totalEnrollment) || 0,
        theologyEnrollment: parseInt(theologyEnrollment) || 0,
        p7PrepExamsPercent: parseFloat(p7PrepExamsPercent) || 0,
        syllabusCoveragePercent: parseFloat(syllabusCoveragePercent) || 0,
        admissions: parseInt(admissions) || 0,
        isDraft: isDraft !== false,
      },
      create: {
        year,
        term,
        weekNumber,
        weekStartDate: startDate,
        weekEndDate: endDate,
        feesCollectionPercent: parseFloat(feesCollectionPercent) || 0,
        schoolsExpenditurePercent: parseFloat(schoolsExpenditurePercent) || 0,
        infrastructurePercent: parseFloat(infrastructurePercent) || 0,
        totalEnrollment: parseInt(totalEnrollment) || 0,
        theologyEnrollment: parseInt(theologyEnrollment) || 0,
        p7PrepExamsPercent: parseFloat(p7PrepExamsPercent) || 0,
        syllabusCoveragePercent: parseFloat(syllabusCoveragePercent) || 0,
        admissions: parseInt(admissions) || 0,
        isDraft: isDraft !== false,
      },
    });

    // Notify all trustees about the report update
    if (session.user.role === 'GM') {
      const trustees = await prisma.user.findMany({
        where: { role: 'TRUSTEE' },
        select: { id: true },
      });

      const isUpdate = report.weekNumber && report.year;
      const notificationData = trustees.map(trustee => ({
        type: 'REPORT_PUBLISHED' as const,
        title: `GM posted Week ${weekNumber} ${year} Report`,
        message: isUpdate 
          ? `Weekly report for Week ${weekNumber}, ${year} has been ${isDraft ? 'saved as draft' : 'published'}`
          : `New weekly report created for Week ${weekNumber}, ${year}`,
        data: JSON.stringify({
          reportId: report.id,
          weekNumber: report.weekNumber,
          year: report.year,
        }),
        userId: trustee.id,
        isRead: false,
      }));

      if (notificationData.length > 0) {
        await prisma.notification.createMany({
          data: notificationData,
        });

        // Send push notifications to all trustees
        for (const trustee of trustees) {
          sendPushToUser(trustee.id, {
            title: `GM posted Week ${weekNumber} ${year} Report`,
            message: isUpdate 
              ? `Weekly report for Week ${weekNumber}, ${year} has been ${isDraft ? 'saved as draft' : 'published'}`
              : `New weekly report created for Week ${weekNumber}, ${year}`,
            url: "/dashboard",
            tag: `report-${report.id}`,
          }).catch(err => console.error("Failed to send push:", err));
        }
      }
    }

    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating report:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
