"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeftIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";

interface SchoolKPIData {
  id: string;
  school: string;
  feesCollectionPercent: number;
  expenditurePercent: number;
  infrastructurePercent: number;
  syllabusCoveragePercent: number;
  admissionsCount: number;
}

export default function KPIBreakdownPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const weekNumber = searchParams.get("week") || "1";
  const year = searchParams.get("year") || new Date().getFullYear().toString();
  const term = searchParams.get("term") || "1";
  const metricType = searchParams.get("metric") || "fees";

  const [data, setData] = useState<SchoolKPIData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/school-kpi?year=${year}&term=${term}&week=${weekNumber}`
        );
        if (response.ok) {
          const result = await response.json();
          setData(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching KPI breakdown:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, term, weekNumber]);

  const getMetricValue = (school: SchoolKPIData): number | string => {
    switch (metricType) {
      case "fees":
        return school.feesCollectionPercent.toFixed(1);
      case "expenditure":
        return school.expenditurePercent.toFixed(1);
      case "infrastructure":
        return school.infrastructurePercent.toFixed(1);
      case "syllabus":
        return school.syllabusCoveragePercent.toFixed(1);
      case "admissions":
        return school.admissionsCount;
      default:
        return 0;
    }
  };

  const getMetricLabel = (): string => {
    switch (metricType) {
      case "fees":
        return "Fees Collection %";
      case "expenditure":
        return "Expenditure %";
      case "infrastructure":
        return "Infrastructure %";
      case "syllabus":
        return "Syllabus Coverage %";
      case "admissions":
        return "Admissions Count";
      default:
        return "Metric";
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aVal = typeof getMetricValue(a) === "string" ? 0 : getMetricValue(a);
    const bVal = typeof getMetricValue(b) === "string" ? 0 : getMetricValue(b);
    return (bVal as number) - (aVal as number);
  });

  const handleExport = () => {
    const exportData = sortedData.map((school, idx) => ({
      Rank: idx + 1,
      School: school.school,
      [getMetricLabel()]: getMetricValue(school),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KPI Breakdown");
    XLSX.writeFile(
      wb,
      `KPI_${metricType}_W${weekNumber}_T${term}_${year}.xlsx`
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {getMetricLabel()} Breakdown
          </h1>
          <p className="text-gray-600 mt-2">
            Week {weekNumber}, Term {term}, {year}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {sortedData.length} Schools
              </h2>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Export
              </button>
            </div>

            {sortedData.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">No data available for this period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        School
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                        {getMetricLabel()}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedData.map((school, idx) => (
                      <tr key={school.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-800">
                          {school.school}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900 font-semibold text-right">
                          {getMetricValue(school)}
                          {metricType !== "admissions" && "%"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
