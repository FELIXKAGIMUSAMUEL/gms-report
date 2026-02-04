"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { DocumentDownloadIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";

interface ExportFormat {
  name: string;
  icon: string;
  description: string;
  format: "excel" | "csv" | "pdf";
  category: string;
}

export default function ExportCenterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const exportOptions: ExportFormat[] = [
    {
      name: "All Weekly Reports",
      icon: "📋",
      description: "Export all weekly reports in Excel format",
      format: "excel",
      category: "Reports",
    },
    {
      name: "Enrollment Data",
      icon: "👥",
      description: "Export enrollment trends by school and term",
      format: "excel",
      category: "Data",
    },
    {
      name: "P.7 Prep Results",
      icon: "📊",
      description: "Export P.7 exam results and rankings",
      format: "excel",
      category: "Data",
    },
    {
      name: "Financial Summary",
      icon: "💰",
      description: "Export fees collection and expenditure data",
      format: "excel",
      category: "Financial",
    },
    {
      name: "School Scorecard",
      icon: "🎯",
      description: "Export comprehensive school performance scorecard",
      format: "excel",
      category: "Analytics",
    },
    {
      name: "Issues & Action Items",
      icon: "🚨",
      description: "Export all open issues with status and timeline",
      format: "excel",
      category: "Issues",
    },
    {
      name: "Comments Report (CSV)",
      icon: "💬",
      description: "Export all comments in CSV format",
      format: "csv",
      category: "Comments",
    },
    {
      name: "Monthly Digest PDF",
      icon: "📄",
      description: "Generate printable monthly summary report",
      format: "pdf",
      category: "Reports",
    },
  ];

  const handleExport = async (exportType: string) => {
    try {
      setExporting(true);

      const response = await fetch(`/api/trustee/export?type=${exportType}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportType}-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (session?.user?.role !== "TRUSTEE") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">This page is for trustees only.</p>
        </div>
      </DashboardLayout>
    );
  }

  const categories = [...new Set(exportOptions.map((opt) => opt.category))];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Export & Download Center</h1>
          <p className="text-gray-600 mt-2">Download data in multiple formats for analysis and reporting</p>
        </div>

        {/* Export Options by Category */}
        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exportOptions
                .filter((opt) => opt.category === category)
                .map((option) => (
                  <div
                    key={option.name}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="text-4xl mb-3">{option.icon}</div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-2">{option.name}</h3>
                    <p className="text-xs text-gray-600 mb-4">{option.description}</p>
                    <button
                      onClick={() => handleExport(option.name.replace(/\s+/g, "-").toLowerCase())}
                      disabled={exporting}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-sm transition-colors"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* Scheduled Reports */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Reports</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Weekly Summary</p>
                <p className="text-xs text-gray-600">Sent every Monday at 8:00 AM</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition-colors">
                Configure
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Monthly Digest</p>
                <p className="text-xs text-gray-600">Sent on the 1st of each month</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition-colors">
                Configure
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Quarterly Report</p>
                <p className="text-xs text-gray-600">Sent at the end of each term</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition-colors">
                Configure
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
