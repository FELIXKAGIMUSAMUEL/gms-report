"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  ArrowDownTrayIcon,
  DocumentIcon,
  UsersIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  ClockIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

interface ExportFormat {
  name: string;
  icon: any;
  description: string;
  format: "excel" | "csv" | "pdf";
  category: string;
  apiType: string;
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
      icon: DocumentIcon,
      description: "Export all weekly reports in CSV format",
      format: "csv",
      category: "Reports",
      apiType: "all-weekly-reports",
    },
    {
      name: "Enrollment Data",
      icon: UsersIcon,
      description: "Export enrollment trends by school and term",
      format: "csv",
      category: "Data",
      apiType: "enrollment-data",
    },
    {
      name: "P.7 Prep Results",
      icon: AcademicCapIcon,
      description: "Export P.7 exam results and rankings",
      format: "csv",
      category: "Data",
      apiType: "enrollment-data",
    },
    {
      name: "Financial Summary",
      icon: CurrencyDollarIcon,
      description: "Export fees collection and expenditure data",
      format: "csv",
      category: "Financial",
      apiType: "financial-summary",
    },
    {
      name: "School Scorecard",
      icon: ChartBarIcon,
      description: "Export comprehensive school performance scorecard",
      format: "csv",
      category: "Analytics",
      apiType: "all-weekly-reports",
    },
    {
      name: "Issues & Actions",
      icon: BellIcon,
      description: "Export all open issues with status and timeline",
      format: "csv",
      category: "Issues",
      apiType: "all-weekly-reports",
    },
    {
      name: "Comments Report",
      icon: ChatBubbleLeftIcon,
      description: "Export all comments in CSV format",
      format: "csv",
      category: "Comments",
      apiType: "all-weekly-reports",
    },
    {
      name: "Budget Data",
      icon: CurrencyDollarIcon,
      description: "Export budget allocations and spending",
      format: "csv",
      category: "Financial",
      apiType: "budget-data",
    },
  ];

  const handleExport = async (option: ExportFormat) => {
    try {
      setExporting(true);

      const response = await fetch(`/api/trustee/export?type=${option.apiType}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.headers
        .get("content-disposition")
        ?.split("filename=")[1]
        .replace(/"/g, "") || `${option.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.csv`;
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
                .map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <div
                      key={option.name}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="mb-3">
                        <IconComponent className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm mb-2">{option.name}</h3>
                      <p className="text-xs text-gray-600 mb-4">{option.description}</p>
                      <button
                        onClick={() => handleExport(option)}
                        disabled={exporting}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-sm transition-colors"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  );
                })
            }
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
