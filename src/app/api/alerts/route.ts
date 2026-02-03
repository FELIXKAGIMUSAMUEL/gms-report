import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get current week number based on term settings
async function getCurrentWeekInfo() {
  const today = new Date();
  const currentYear = today.getFullYear();

  // Get all term settings for current year
  const termSettings = await prisma.termSetting.findMany({
    where: { year: currentYear },
    orderBy: { term: "asc" },
  });

  // Find which term we're currently in
  for (const termSetting of termSettings) {
    const startDate = new Date(termSetting.startDate);
    const endDate = new Date(termSetting.endDate);

    if (today >= startDate && today <= endDate) {
      // Calculate week number within this term
      const diffTime = today.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const weekNumber = Math.floor(diffDays / 7) + 1;

      return {
        currentWeek: weekNumber,
        currentTerm: termSetting.term,
        currentYear: termSetting.year,
        termStartDate: startDate,
        termEndDate: endDate,
        isInTerm: true,
      };
    }
  }

  // If no term found, return default ISO week calculation
  const start = new Date(currentYear, 0, 1);
  const diff = today.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const isoWeek = Math.ceil(diff / oneWeek);

  return {
    currentWeek: isoWeek,
    currentTerm: 1,
    currentYear,
    termStartDate: null,
    termEndDate: null,
    isInTerm: false,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const weekInfo = await getCurrentWeekInfo();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const alerts = [];

    // 1. Check for missing weekly report submission (GM only)
    if (session.user.role === "GM" && weekInfo.isInTerm) {
      const latestReport = await prisma.weeklyReport.findFirst({
        where: {
          year: weekInfo.currentYear,
          term: weekInfo.currentTerm,
        },
        orderBy: { weekNumber: "desc" },
      });

      // Check if report for previous week is missing (only check if we're past Sunday)
      const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
      if (dayOfWeek >= 1) {
        // Monday or later
        const expectedWeek = weekInfo.currentWeek - 1;
        if (expectedWeek > 0 && (!latestReport || latestReport.weekNumber < expectedWeek)) {
          alerts.push({
            id: `weekly-report-${weekInfo.currentTerm}-${expectedWeek}`,
            type: "WEEKLY_REPORT_REMINDER",
            priority: "high",
            title: "Weekly Report Pending",
            message: `Week ${expectedWeek} report for Term ${weekInfo.currentTerm} has not been submitted yet. Please submit before end of week.`,
            actionUrl: "/update-report",
            actionText: "Submit Report",
            createdAt: new Date().toISOString(),
          });
        }
      }
    } else if (session.user.role === "GM" && !weekInfo.isInTerm) {
      // Alert GM if term settings are not configured
      alerts.push({
        id: "term-settings-missing",
        type: "SYSTEM",
        priority: "high",
        title: "Term Settings Required",
        message: "Please configure term start and end dates in Settings to enable accurate weekly report tracking.",
        actionUrl: "/settings",
        actionText: "Configure Terms",
        createdAt: new Date().toISOString(),
      });
    }

    // 2. Check for unresolved red issues older than 7 days
    const oldIssues = await prisma.redIssue.findMany({
      where: {
        status: { not: "RESOLVED" },
        createdAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      take: 5,
      orderBy: { createdAt: "asc" },
    });

    oldIssues.forEach((issue) => {
      const daysOld = Math.floor(
        (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      alerts.push({
        id: `red-issue-${issue.id}`,
        type: "RED_ISSUE_ESCALATION",
        priority: daysOld > 14 ? "critical" : "high",
        title: "Red Issue Requires Attention",
        message: `Issue "${issue.issue || "Untitled"}" has been open for ${daysOld} days. Status: ${issue.status || "Pending"}`,
        actionUrl: "/issues-entry",
        actionText: "View Issue",
        createdAt: issue.createdAt,
        metadata: { issueId: issue.id, daysOld },
      });
    });

    // 3. Check for upcoming events in next 3 days
    const upcomingEvents = await prisma.upcomingEvent.findMany({
      where: {
        date: {
          gte: today,
          lte: threeDaysFromNow,
        },
        status: "ACTIVE",
      },
      orderBy: { date: "asc" },
    });

    upcomingEvents.forEach((event) => {
      const eventDate = new Date(event.date);
      const daysUntil = Math.ceil(
        (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      alerts.push({
        id: `event-${event.id}`,
        type: "UPCOMING_EVENT",
        priority: daysUntil === 0 ? "high" : "medium",
        title: daysUntil === 0 ? "Event Today!" : `Event in ${daysUntil} day${daysUntil > 1 ? "s" : ""}`,
        message: `${event.activity} - ${event.inCharge}`,
        actionUrl: "/events-entry",
        actionText: "View Details",
        createdAt: event.createdAt,
        metadata: { eventId: event.id, eventDate: event.date, daysUntil },
      });
    });

    // 4. Check for overdue todos (if user has any)
    const overdueTodos = await prisma.todo.findMany({
      where: {
        userId,
        isCompleted: false,
        dueDate: { lt: today },
      },
      take: 5,
      orderBy: { dueDate: "asc" },
    });

    overdueTodos.forEach((todo) => {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(todo.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      alerts.push({
        id: `todo-${todo.id}`,
        type: "OVERDUE_TODO",
        priority: todo.priority === "HIGH" ? "high" : "medium",
        title: "Overdue Task",
        message: `${todo.title} - ${daysOverdue} day${daysOverdue > 1 ? "s" : ""} overdue`,
        actionUrl: "/dashboard",
        actionText: "View Task",
        createdAt: todo.createdAt,
        metadata: { todoId: todo.id, daysOverdue },
      });
    });

    // Sort by priority and creation date
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ alerts, count: alerts.length });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
