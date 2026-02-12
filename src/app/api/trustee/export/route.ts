import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function convertToCSV(data: any[], headers: string[]): string {
  const csvHeaders = headers.join(",");
  const csvRows = data.map((row) =>
    headers.map((header) => {
      const value = row[header];
      if (typeof value === "string" && value.includes(",")) {
        return `"${value}"`;
      }
      return value ?? "";
    }).join(",")
  );
  return [csvHeaders, ...csvRows].join("\n");
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "TRUSTEE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all-weekly-reports";

    let csvContent = "";
    let fileName = "";

    switch (type) {
      case "all-weekly-reports": {
        const reports = await prisma.weeklyReport.findMany({
          orderBy: [{ year: "desc" }, { term: "desc" }, { weekNumber: "desc" }],
          take: 1000,
        });

        csvContent = convertToCSV(
          reports.map((r) => ({
            Week: r.weekNumber,
            Year: r.year,
            Term: r.term,
            "Fees Collection %": r.feesCollectionPercent,
            "Expenditure %": r.schoolsExpenditurePercent,
            "Infrastructure %": r.infrastructurePercent,
            "Total Enrollment": r.totalEnrollment,
            "Theology Enrollment": r.theologyEnrollment,
            "P7 Prep Exams %": r.p7PrepExamsPercent,
            "Syllabus Coverage %": r.syllabusCoveragePercent,
            Admissions: r.admissions,
            "Published Date": r.publishedAt ? new Date(r.publishedAt).toLocaleDateString() : "Draft",
          })),
          [
            "Week",
            "Year",
            "Term",
            "Fees Collection %",
            "Expenditure %",
            "Infrastructure %",
            "Total Enrollment",
            "Theology Enrollment",
            "P7 Prep Exams %",
            "Syllabus Coverage %",
            "Admissions",
            "Published Date",
          ]
        );
        fileName = "weekly-reports";
        break;
      }

      case "enrollment-data": {
        const kpiData = await prisma.kPIData.findMany({
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 500,
        });

        csvContent = convertToCSV(
          kpiData.map((k) => ({
            Month: k.month,
            Year: k.year,
            "Total Enrollment": k.totalEnrollment,
            "Theology Enrollment": k.theologyEnrollment,
            "Fees %": k.feesCollectionPercent,
            "Expenditure %": k.schoolsExpenditurePercent,
          })),
          ["Month", "Year", "Total Enrollment", "Theology Enrollment", "Fees %", "Expenditure %"]
        );
        fileName = "enrollment-data";
        break;
      }

      case "financial-summary": {
        const financialEntries = await prisma.financialEntry.findMany({
          orderBy: { createdAt: "desc" },
          take: 1000,
        });

        csvContent = convertToCSV(
          financialEntries.map((f) => ({
            Type: f.type,
            Amount: f.amount,
            Year: f.year,
            Term: f.term,
            Month: f.month,
            Category: f.category || "N/A",
            Source: f.source || "N/A",
            School: f.school || "N/A",
            Notes: f.notes || "",
            Date: new Date(f.createdAt).toLocaleDateString(),
          })),
          ["Type", "Amount", "Year", "Term", "Month", "Category", "Source", "School", "Notes", "Date"]
        );
        fileName = "financial-summary";
        break;
      }

      case "budget-data": {
        const budgets = await prisma.budgetEntry.findMany({
          orderBy: [{ year: "desc" }, { term: "desc" }],
          take: 500,
        });

        csvContent = convertToCSV(
          budgets.map((b) => ({
            Year: b.year,
            Term: b.term,
            Category: b.category,
            Amount: b.amount,
            Notes: b.notes || "",
            "Created Date": new Date(b.createdAt).toLocaleDateString(),
          })),
          ["Year", "Term", "Category", "Amount", "Notes", "Created Date"]
        );
        fileName = "budget-data";
        break;
      }

      case "goals": {
        const goals = await prisma.goal.findMany({
          orderBy: [{ year: "desc" }, { createdAt: "desc" }],
          take: 500,
        });

        csvContent = convertToCSV(
          goals.map((g) => ({
            Title: g.title,
            Category: g.category,
            "Target Value": g.targetValue,
            "Current Value": g.currentValue,
            Progress: g.progress,
            Unit: g.unit,
            Status: g.status,
            Year: g.year,
            Term: g.term || "N/A",
            Description: g.description || "",
          })),
          [
            "Title",
            "Category",
            "Target Value",
            "Current Value",
            "Progress",
            "Unit",
            "Status",
            "Year",
            "Term",
            "Description",
          ]
        );
        fileName = "goals";
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    return new NextResponse(blob, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}-${new Date().toISOString().split("T")[0]}.csv"`,
        "Content-Type": "text/csv;charset=utf-8;",
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
