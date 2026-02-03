"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/outline";

interface WeeklyReport {
  id: string;
  weekNumber: number;
  year: number;
  weekStartDate: string;
  weekEndDate: string;
  feesCollectionPercent: number;
  schoolsExpenditurePercent: number;
  infrastructurePercent: number;
  totalEnrollment: number;
  theologyEnrollment: number;
  p7PrepExamsPercent: number;
  isDraft: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export default function PastReportsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<number | "all">("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchReports();
    }
  }, [status]);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/weekly-reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.sort((a: WeeklyReport, b: WeeklyReport) => {
          if (b.year !== a.year) return b.year - a.year;
          return b.weekNumber - a.weekNumber;
        }));
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      const res = await fetch(`/api/weekly-reports/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchReports();
      } else {
        alert("Failed to delete report");
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("An error occurred");
    }
  };

  const filteredReports = filterYear === "all"
    ? reports
    : reports.filter(r => r.year === filterYear);

  const availableYears = Array.from(new Set(reports.map(r => r.year))).sort((a, b) => b - a);

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return null;
  }

  const isGM = session.user?.role === "GM";

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Past Reports</h1>
              <p className="mt-2 text-sm text-gray-600">
                View historical weekly reports
              </p>
            </div>

            {/* Year Filter */}
            <div className="flex items-center gap-3">
              <label htmlFor="year-filter" className="text-sm font-medium text-gray-700">
                Filter by Year:
              </label>
              <select
                id="year-filter"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No reports found</p>
            {isGM && (
              <button
                onClick={() => router.push("/update-report")}
                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Create First Report
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
              >
                {/* Report Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Week {report.weekNumber}
                    </h3>
                    <p className="text-sm text-gray-500">{report.year}</p>
                  </div>
                  {report.isDraft && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-semibold">
                      Draft
                    </span>
                  )}
                </div>

                {/* Date Range */}
                <p className="text-sm text-gray-600 mb-4">
                  {new Date(report.weekStartDate).toLocaleDateString()} - {new Date(report.weekEndDate).toLocaleDateString()}
                </p>

                {/* Key Metrics Preview */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fees Collection:</span>
                    <span className="font-semibold text-gray-900">{report.feesCollectionPercent}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Enrollment:</span>
                    <span className="font-semibold text-gray-900">{report.totalEnrollment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">P7 Prep Pass Rate:</span>
                    <span className="font-semibold text-gray-900">{report.p7PrepExamsPercent}%</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // View details (you could create a modal or detail page)
                      router.push(`/dashboard`);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <EyeIcon className="w-4 h-4" />
                    View
                  </button>
                  
                  {isGM && (
                    <>
                      <button
                        onClick={() => {
                          router.push(`/update-report?week=${report.weekNumber}&year=${report.year}`);
                        }}
                        className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <PencilIcon className="w-4 h-4" />
                        Edit
                      </button>
                      
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{filteredReports.length}</p>
              <p className="text-sm text-gray-600">Total Reports</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {filteredReports.filter(r => !r.isDraft).length}
              </p>
              <p className="text-sm text-gray-600">Published</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {filteredReports.filter(r => r.isDraft).length}
              </p>
              <p className="text-sm text-gray-600">Drafts</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {availableYears.length}
              </p>
              <p className="text-sm text-gray-600">Years</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
