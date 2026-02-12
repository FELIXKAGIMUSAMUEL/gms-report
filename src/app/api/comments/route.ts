import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const field = searchParams.get("field");
    const generalManager = searchParams.get("generalManager");
    const category = searchParams.get("category"); // "kpi", "red-issues", "projects", "events", "all"

    // Build where clause for KPI comments
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (field) {
      where.field = field;
    }

    const results: any[] = [];

    // Fetch KPI comments if category is "kpi" or "all"
    if (!category || category === "all" || category === "kpi") {
      const comments = await prisma.comment.findMany({
        where,
        include: {
          report: {
            select: {
              year: true,
              term: true,
              weekNumber: true,
              generalManager: true,
              feesCollectionPercent: true,
              schoolsExpenditurePercent: true,
              infrastructurePercent: true,
              syllabusCoveragePercent: true,
              admissions: true,
              totalEnrollment: true,
              theologyEnrollment: true,
              p7PrepExamsPercent: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Filter by generalManager if provided
      let filteredComments = comments;
      if (generalManager) {
        filteredComments = comments.filter(
          (c) => c.report?.generalManager === generalManager
        );
      }

      filteredComments.forEach((c) => {
        // Map field names to KPI values
        let kpiValue = null;
        if (c.report) {
          switch (c.field) {
            case "feesComment":
              kpiValue = { label: "Fees Collection", value: `${c.report.feesCollectionPercent.toFixed(1)}%` };
              break;
            case "expenditureComment":
              kpiValue = { label: "Expenditure", value: `${c.report.schoolsExpenditurePercent.toFixed(1)}%` };
              break;
            case "infrastructureComment":
              kpiValue = { label: "Infrastructure", value: `${c.report.infrastructurePercent.toFixed(1)}%` };
              break;
            case "syllabusComment":
              kpiValue = { label: "Syllabus Coverage", value: `${c.report.syllabusCoveragePercent.toFixed(1)}%` };
              break;
            case "admissionsComment":
              kpiValue = { label: "Admissions", value: c.report.admissions.toString() };
              break;
            case "enrollmentComment":
              kpiValue = { label: "Total Enrollment", value: c.report.totalEnrollment.toString() };
              break;
            case "theologyComment":
              kpiValue = { label: "Theology Enrollment", value: c.report.theologyEnrollment.toString() };
              break;
            case "p7prepComment":
              kpiValue = { label: "P.7 Prep Results", value: `${c.report.p7PrepExamsPercent.toFixed(1)}%` };
              break;
          }
        }

        results.push({
          id: c.id,
          category: "kpi",
          field: c.field,
          text: c.text,
          createdAt: c.createdAt,
          report: c.report,
          user: null,
          kpiValue,
        });
      });
    }

    // Fetch Reactions (for Red Issues, Projects, Events, and KPI metrics)
    if (!category || category === "all" || category === "kpi" || category === "red-issues" || category === "projects" || category === "events") {
      const reactionWhere: any = {
        type: "COMMENT", // Only fetch comment-type reactions
      };

      if (startDate || endDate) {
        reactionWhere.createdAt = {};
        if (startDate) {
          reactionWhere.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          reactionWhere.createdAt.lte = end;
        }
      }

      // Filter by category
      if (category === "red-issues") {
        reactionWhere.sectionId = { startsWith: "red-issue-" };
      } else if (category === "projects") {
        reactionWhere.sectionId = { startsWith: "project-" };
      } else if (category === "events") {
        reactionWhere.sectionId = { startsWith: "event-" };
      } else if (category === "kpi") {
        // KPI reactions don't have these prefixes
        reactionWhere.AND = [
          { NOT: { sectionId: { startsWith: "red-issue-" } } },
          { NOT: { sectionId: { startsWith: "project-" } } },
          { NOT: { sectionId: { startsWith: "event-" } } },
        ];
      }

      const reactions = await prisma.reaction.findMany({
        where: reactionWhere,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          weeklyReport: {
            select: {
              year: true,
              term: true,
              weekNumber: true,
              generalManager: true,
              feesCollectionPercent: true,
              schoolsExpenditurePercent: true,
              infrastructurePercent: true,
              syllabusCoveragePercent: true,
              admissions: true,
              totalEnrollment: true,
              theologyEnrollment: true,
              p7PrepExamsPercent: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      for (const r of reactions) {
        const categoryType = r.sectionId.startsWith("red-issue-")
          ? "red-issues"
          : r.sectionId.startsWith("project-")
            ? "projects"
            : r.sectionId.startsWith("event-")
              ? "events"
              : "kpi"; // Default to KPI for other sectionIds

        // Skip if category filter doesn't match
        if (category && category !== "all" && category !== categoryType) {
          continue;
        }

        // Filter by generalManager if provided
        if (generalManager && r.weeklyReport?.generalManager !== generalManager) {
          continue;
        }

        // Fetch the related item details or KPI values
        let itemDetails = null;
        let kpiValue = null;
        
        if (categoryType === "red-issues") {
          const issueId = r.sectionId.replace("red-issue-", "");
          const issue = await prisma.redIssue.findUnique({
            where: { id: issueId },
            select: { issue: true, status: true, inCharge: true },
          });
          itemDetails = issue ? { title: issue.issue, status: issue.status, inCharge: issue.inCharge } : null;
        } else if (categoryType === "projects") {
          const projectId = r.sectionId.replace("project-", "");
          const project = await prisma.gMProject.findUnique({
            where: { id: projectId },
            select: { projectName: true, status: true, projectManager: true },
          });
          itemDetails = project ? { title: project.projectName, status: project.status, inCharge: project.projectManager } : null;
        } else if (categoryType === "events") {
          const eventId = r.sectionId.replace("event-", "");
          const event = await prisma.upcomingEvent.findUnique({
            where: { id: eventId },
            select: { activity: true, date: true, inCharge: true },
          });
          itemDetails = event ? { title: event.activity, date: event.date, inCharge: event.inCharge } : null;
        } else if (categoryType === "kpi" && r.weeklyReport) {
          // Map sectionId to KPI values
          const sectionId = r.sectionId.toLowerCase();
          if (sectionId.includes("fees") || sectionId.includes("collection")) {
            kpiValue = { label: "Fees Collection", value: `${r.weeklyReport.feesCollectionPercent.toFixed(1)}%` };
          } else if (sectionId.includes("expenditure")) {
            kpiValue = { label: "Expenditure", value: `${r.weeklyReport.schoolsExpenditurePercent.toFixed(1)}%` };
          } else if (sectionId.includes("infrastructure")) {
            kpiValue = { label: "Infrastructure", value: `${r.weeklyReport.infrastructurePercent.toFixed(1)}%` };
          } else if (sectionId.includes("syllabus")) {
            kpiValue = { label: "Syllabus Coverage", value: `${r.weeklyReport.syllabusCoveragePercent.toFixed(1)}%` };
          } else if (sectionId.includes("admission")) {
            kpiValue = { label: "Admissions", value: r.weeklyReport.admissions.toString() };
          } else if (sectionId.includes("enrollment") && !sectionId.includes("theology")) {
            kpiValue = { label: "Total Enrollment", value: r.weeklyReport.totalEnrollment.toString() };
          } else if (sectionId.includes("theology")) {
            kpiValue = { label: "Theology Enrollment", value: r.weeklyReport.theologyEnrollment.toString() };
          } else if (sectionId.includes("p7") || sectionId.includes("prep")) {
            kpiValue = { label: "P.7 Prep Results", value: `${r.weeklyReport.p7PrepExamsPercent.toFixed(1)}%` };
          }
        }

        results.push({
          id: r.id,
          category: categoryType,
          field: r.sectionId,
          text: r.comment,
          createdAt: r.createdAt,
          report: r.weeklyReport,
          user: r.user,
          itemDetails,
          kpiValue,
        });
      }
    }

    // Sort all results by date descending
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "GM") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reportId, field, text } = body;

    if (!reportId || !field || !text) {
      return NextResponse.json(
        { error: "Missing required fields: reportId, field, text" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        reportId,
        field,
        text,
      },
      include: {
        report: {
          select: {
            year: true,
            term: true,
            weekNumber: true,
            generalManager: true,
          },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error: any) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment", details: error.message },
      { status: 500 }
    );
  }
}
