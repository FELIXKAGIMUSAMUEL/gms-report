import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        reports: [], 
        issues: [], 
        events: [], 
        projects: [],
        schools: []
      });
    }

    const searchTerm = query.trim().toLowerCase();

    // Search across multiple tables in parallel
    const [reports, issues, events, projects, schools] = await Promise.all([
      // Search weekly reports
      prisma.weeklyReport.findMany({
        where: {
          OR: [
            { weekNumber: !isNaN(parseInt(searchTerm)) ? parseInt(searchTerm) : undefined },
            { year: !isNaN(parseInt(searchTerm)) ? parseInt(searchTerm) : undefined },
          ].filter(Boolean),
        },
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          weekNumber: true,
          year: true,
          term: true,
          feesCollectionPercent: true,
          totalEnrollment: true,
          createdAt: true,
        },
      }),

      // Search red issues
      prisma.redIssue.findMany({
        where: {
          OR: [
            { issue: { contains: searchTerm, mode: "insensitive" } },
            { inCharge: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),

      // Search upcoming events
      prisma.upcomingEvent.findMany({
        where: {
          OR: [
            { activity: { contains: searchTerm, mode: "insensitive" } },
            { inCharge: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        take: 10,
        orderBy: { date: "asc" },
      }),

      // Search GM projects
      prisma.gMProject.findMany({
        where: {
          OR: [
            { projectName: { contains: searchTerm, mode: "insensitive" } },
            { projectManager: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),

      // Search schools
      prisma.school.findMany({
        where: {
          name: { contains: searchTerm, mode: "insensitive" },
        },
        take: 10,
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      reports,
      issues,
      events,
      projects,
      schools,
      query: searchTerm,
    });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
