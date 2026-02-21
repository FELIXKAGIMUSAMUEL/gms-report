"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ChevronDownIcon,
  BuildingOfficeIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { buildSchoolMatchIndex, resolveSchoolName } from "@/lib/school-matching";

interface School {
  id: string;
  name: string;
}

interface WeeklyScorecard {
  id: string;
  schoolId: string;
  schoolName: string;
  term: number;
  week: number;
  year: number;
  academicScore: number;
  financeScore: number;
  qualityScore: number;
  technologyScore: number;
  theologyScore: number;
}

interface MovingAverageData {
  weekLabel: string;
  [key: string]: number | string;
}

const currentYear = new Date().getFullYear();
const START_YEAR = 2023;
const availableYears = Array.from(
  { length: currentYear - START_YEAR + 1 },
  (_, i) => currentYear - i
);

const DEPARTMENTS = [
  { key: "financeScore", label: "Finance" },
  { key: "academicScore", label: "Academic" },
  { key: "qualityScore", label: "Quality Assurance" },
];

const formatScore = (value?: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(1)
    : "—";

const getDisplaySchoolName = (schoolName: string, schoolMatchIndex: any) => {
  const resolved = resolveSchoolName(schoolName, schoolMatchIndex);
  return resolved || schoolName;
};

export default function ScorecardAnalysisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [schools, setSchools] = useState<School[]>([]);
  const [allScorecards, setAllScorecards] = useState<WeeklyScorecard[]>([]);
  const [prevYearScorecards, setPrevYearScorecards] = useState<WeeklyScorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(
    new Set(["financeScore"])
  );

  const schoolMatchIndex = useMemo(
    () => buildSchoolMatchIndex(schools),
    [schools]
  );

  // Fetch schools
  const fetchSchools = useCallback(async () => {
    try {
      const response = await fetch("/api/schools");
      if (response.ok) {
        const data = await response.json();
        setSchools(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch schools:", err);
    }
  }, []);

  // Fetch all historical scorecard data
  const fetchAllScorecards = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch current year data
      const params = new URLSearchParams({
        year: String(selectedYear),
        term: String(selectedTerm),
      });
      const response = await fetch(`/api/scorecard?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const mapped = (Array.isArray(data) ? data : []).map((sc: any) => ({
          id: sc.id,
          schoolId: sc.school,
          schoolName: sc.school,
          term: sc.term ?? 1,
          week: sc.week,
          year: sc.year,
          academicScore: sc.academicPercent,
          financeScore: sc.financePercent,
          qualityScore: sc.qualityPercent,
          technologyScore: sc.tdpPercent,
          theologyScore: sc.theologyPercent,
        }));
        setAllScorecards(mapped);
      }
      
      // Fetch previous year data for same term
      const prevYearParams = new URLSearchParams({
        year: String(selectedYear - 1),
        term: String(selectedTerm),
      });
      const prevYearResponse = await fetch(`/api/scorecard?${prevYearParams.toString()}`);
      if (prevYearResponse.ok) {
        const prevYearData = await prevYearResponse.json();
        const prevYearMapped = (Array.isArray(prevYearData) ? prevYearData : []).map((sc: any) => ({
          id: sc.id,
          schoolId: sc.school,
          schoolName: sc.school,
          term: sc.term ?? 1,
          week: sc.week,
          year: sc.year,
          academicScore: sc.academicPercent,
          financeScore: sc.financePercent,
          qualityScore: sc.qualityPercent,
          technologyScore: sc.tdpPercent,
          theologyScore: sc.theologyPercent,
        }));
        setPrevYearScorecards(prevYearMapped);
      } else {
        setPrevYearScorecards([]);
      }
    } catch (err) {
      console.error("Failed to fetch scorecards:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedTerm]);

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Initial fetch
  useEffect(() => {
    if (status === "authenticated") {
      fetchSchools();
    }
  }, [status, fetchSchools]);

  // Fetch scorecards when year/term changes
  useEffect(() => {
    if (status === "authenticated") {
      fetchAllScorecards();
    }
  }, [status, selectedYear, selectedTerm, fetchAllScorecards]);

  // Calculate moving averages per school
  const movingAveragesByDept = useMemo(() => {
    const result: { [key: string]: MovingAverageData[] } = {};

    DEPARTMENTS.forEach((dept) => {
      const deptKey = dept.key;
      const schoolsMap = new Map<string, { week: number; score: number }[]>();

      // Group by school
      allScorecards.forEach((sc) => {
        const displayName = getDisplaySchoolName(
          sc.schoolName,
          schoolMatchIndex
        );
        if (!schoolsMap.has(displayName)) {
          schoolsMap.set(displayName, []);
        }
        const score = sc[deptKey as keyof WeeklyScorecard] as number;
        if (typeof score === "number" && score > 0) {
          schoolsMap.get(displayName)!.push({ week: sc.week, score });
        }
      });

      // Get max week number to create sequence
      let maxWeek = 0;
      schoolsMap.forEach((weeks) => {
        weeks.forEach(({ week }) => {
          maxWeek = Math.max(maxWeek, week);
        });
      });

      // Build table data with all weeks
      const tableData: MovingAverageData[] = [];
      for (let w = 1; w <= maxWeek; w++) {
        const row: MovingAverageData = {
          weekLabel: `Week ${w}`,
        };

        // Calculate average for each school at this week
        schoolsMap.forEach((weeks, schoolName) => {
          const weekScores = weeks
            .filter((x) => x.week <= w && x.week > 0)
            .sort((a, b) => a.week - b.week);

          if (weekScores.length > 0) {
            const avg =
              weekScores.reduce((sum, x) => sum + x.score, 0) /
              weekScores.length;
            row[schoolName] = Number(avg.toFixed(1));
          }
        });

        tableData.push(row);
      }

      result[deptKey] = tableData;
    });

    return result;
  }, [allScorecards, schoolMatchIndex]);

  // Calculate moving averages for previous year data
  const prevYearMovingAveragesByDept = useMemo(() => {
    const result: { [key: string]: MovingAverageData[] } = {};

    DEPARTMENTS.forEach((dept) => {
      const deptKey = dept.key;
      const schoolsMap = new Map<string, { week: number; score: number }[]>();

      // Group by school
      prevYearScorecards.forEach((sc) => {
        const displayName = getDisplaySchoolName(
          sc.schoolName,
          schoolMatchIndex
        );
        if (!schoolsMap.has(displayName)) {
          schoolsMap.set(displayName, []);
        }
        const score = sc[deptKey as keyof WeeklyScorecard] as number;
        if (typeof score === "number" && score > 0) {
          schoolsMap.get(displayName)!.push({ week: sc.week, score });
        }
      });

      // Get max week number to create sequence
      let maxWeek = 0;
      schoolsMap.forEach((weeks) => {
        weeks.forEach(({ week }) => {
          maxWeek = Math.max(maxWeek, week);
        });
      });

      // Build table data with all weeks
      const tableData: MovingAverageData[] = [];
      for (let w = 1; w <= maxWeek; w++) {
        const row: MovingAverageData = {
          weekLabel: `Week ${w}`,
        };

        // Calculate average for each school at this week
        schoolsMap.forEach((weeks, schoolName) => {
          const weekScores = weeks
            .filter((x) => x.week <= w && x.week > 0)
            .sort((a, b) => a.week - b.week);

          if (weekScores.length > 0) {
            const avg =
              weekScores.reduce((acc, x) => acc + x.score, 0) /
              weekScores.length;
            row[schoolName] = avg;
          } else {
            row[schoolName] = 0;
          }
        });

        tableData.push(row);
      }

      result[deptKey] = tableData;
    });

    return result;
  }, [prevYearScorecards, schoolMatchIndex]);

  // Get unique schools for table headers
  const uniqueSchools = useMemo(() => {
    const schools = new Set<string>();
    allScorecards.forEach((sc) => {
      const displayName = getDisplaySchoolName(
        sc.schoolName,
        schoolMatchIndex
      );
      schools.add(displayName);
    });
    return Array.from(schools).sort();
  }, [allScorecards, schoolMatchIndex]);

  const toggleDeptExpand = (deptKey: string) => {
    const newSet = new Set(expandedDepts);
    if (newSet.has(deptKey)) {
      newSet.delete(deptKey);
    } else {
      newSet.add(deptKey);
    }
    setExpandedDepts(newSet);
  };

  // Download CSV function
  const downloadCSV = () => {
    let csvContent = "Scorecard Analysis Report\n";
    csvContent += `Year: ${selectedYear}, Term: ${selectedTerm}\n\n`;

    DEPARTMENTS.forEach((dept) => {
      const tableData = movingAveragesByDept[dept.key] || [];
      if (tableData.length === 0) return;

      csvContent += `${dept.label} Department\n`;
      
      // Week-by-Week Data
      csvContent += "\nWeek-by-Week Data\n";
      const headers = ["Week", ...uniqueSchools, "AVG"];
      csvContent += headers.join(",") + "\n";
      
      tableData.forEach((row) => {
        const avgScore = uniqueSchools.length > 0
          ? uniqueSchools.reduce((sum, school) => sum + (row[school] as number || 0), 0) / uniqueSchools.length
          : 0;
        const rowData = [
          row.weekLabel,
          ...uniqueSchools.map((school) => formatScore(row[school] as number)),
          formatScore(avgScore),
        ];
        csvContent += rowData.join(",") + "\n";
      });

      // Variance Analysis
      csvContent += "\nVariance Analysis\n";
      const latestWeek = tableData[tableData.length - 1];
      const prevWeek = tableData[tableData.length - 2];
      
      if (latestWeek && prevWeek) {
        const latestWeekNum = latestWeek.weekLabel.match(/\d+/)?.[0] || "";
        const prevWeekNum = prevWeek.weekLabel.match(/\d+/)?.[0] || "";
        
        csvContent += `School,Week ${latestWeekNum} Term ${selectedTerm} ${selectedYear},Week ${prevWeekNum} Term ${selectedTerm} ${selectedYear},WoW Variance,Week ${latestWeekNum} Term ${selectedTerm} ${selectedYear - 1},ToT Variance\n`;
        
        // Get previous year data for variance calculation
        const prevYearTableData = prevYearMovingAveragesByDept[dept.key] || [];
        const latestWeekIndex = parseInt(latestWeekNum) - 1;
        const prevYearSameWeek = prevYearTableData[latestWeekIndex];
        
        uniqueSchools.forEach((school) => {
          const currentScore = latestWeek?.[school] as number || 0;
          const prevWeekScore = prevWeek?.[school] as number || 0;
          const wowVariance = currentScore && prevWeekScore ? currentScore - prevWeekScore : 0;
          
          const prevYearScore = prevYearSameWeek?.[school] as number || 0;
          const totVariance = currentScore && prevYearScore ? currentScore - prevYearScore : 0;
          
          csvContent += `${school},${formatScore(currentScore)},${formatScore(prevWeekScore)},${wowVariance > 0 ? '+' : ''}${formatScore(wowVariance)},${prevYearScore > 0 ? formatScore(prevYearScore) : '—'},${prevYearScore > 0 ? `${totVariance > 0 ? '+' : ''}${formatScore(totVariance)}` : '—'}\n`;
        });
        
        // AVG row
        const avgCurrentScore = uniqueSchools.length > 0 
          ? uniqueSchools.reduce((sum, school) => sum + (latestWeek?.[school] as number || 0), 0) / uniqueSchools.length
          : 0;
        const avgPrevWeekScore = uniqueSchools.length > 0
          ? uniqueSchools.reduce((sum, school) => sum + (prevWeek?.[school] as number || 0), 0) / uniqueSchools.length
          : 0;
        const avgWowVariance = uniqueSchools.length > 0
          ? uniqueSchools.reduce((sum, school) => {
              const current = latestWeek?.[school] as number || 0;
              const prev = prevWeek?.[school] as number || 0;
              return sum + (current && prev ? current - prev : 0);
            }, 0) / uniqueSchools.length
          : 0;
        
        const avgPrevYearScore = uniqueSchools.length > 0 && prevYearSameWeek
          ? uniqueSchools.reduce((sum, school) => sum + (prevYearSameWeek?.[school] as number || 0), 0) / uniqueSchools.length
          : 0;
        const avgTotVariance = avgCurrentScore && avgPrevYearScore ? avgCurrentScore - avgPrevYearScore : 0;
        
        csvContent += `AVG,${formatScore(avgCurrentScore)},${formatScore(avgPrevWeekScore)},${avgWowVariance > 0 ? '+' : ''}${formatScore(avgWowVariance)},${avgPrevYearScore > 0 ? formatScore(avgPrevYearScore) : '—'},${avgPrevYearScore > 0 ? `${avgTotVariance > 0 ? '+' : ''}${formatScore(avgTotVariance)}` : '—'}\n`;
      }
      
      csvContent += "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `scorecard-analysis-${selectedYear}-term${selectedTerm}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading analysis...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 1cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          nav, aside, .sidebar {
            display: none !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          .bg-blue-50, .bg-blue-100 {
            background-color: #dbeafe !important;
          }
          .bg-gray-50, .bg-gray-100 {
            background-color: #f9fafb !important;
          }
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Print Header */}
        <div className="hidden print:block border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex items-center justify-center gap-4 mb-2">
            <img src="/sak.jpg" alt="SAK" style={{width:"56px",height:"56px",objectFit:"contain"}} />
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">SIR APOLLO KAGGWA SCHOOLS</h1>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Since 1996</p>
              <p className="text-sm font-semibold text-gray-700 mt-1">SCORECARD ANALYSIS REPORT</p>
            </div>
            <img src="/sak.jpg" alt="SAK" style={{width:"56px",height:"56px",objectFit:"contain"}} />
          </div>
          <p className="text-center text-xs text-gray-600">Term {selectedTerm}, {selectedYear} &middot; Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Scorecard Analysis
            </h1>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg text-base font-medium text-gray-900 bg-white hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer shadow-sm"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Term
              </label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg text-base font-medium text-gray-900 bg-white hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer shadow-sm"
              >
                {[1, 2, 3].map((t) => (
                  <option key={t} value={t}>
                    Term {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={downloadCSV}
                disabled={allScorecards.length === 0}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors print:hidden"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Download CSV
              </button>
            </div>
            <div className="flex items-end">
              <button
                onClick={handlePrint}
                disabled={allScorecards.length === 0}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors print:hidden"
              >
                <PrinterIcon className="w-5 h-5" />
                Print
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : allScorecards.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6 text-center">
            <p className="text-gray-600 text-sm sm:text-base">
              No scorecard data available for the selected term.
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Department Sections */}
            {DEPARTMENTS.map((dept) => (
              <div
                key={dept.key}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
              >
                {/* Dropdown Header */}
                <button
                  onClick={() => toggleDeptExpand(dept.key)}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150 transition"
                >
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    {dept.label} Department
                  </h2>
                  <ChevronDownIcon
                    className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-600 transition-transform ${
                      expandedDepts.has(dept.key) ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Expanded Content */}
                {expandedDepts.has(dept.key) && (
                  <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
                    {/* Chart */}
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">
                        Moving Average Trend
                      </h3>
                      <div className="w-full h-64 sm:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={movingAveragesByDept[dept.key] || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="weekLabel"
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis
                              domain={[0, 100]}
                              tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                              formatter={(value) =>
                                typeof value === "number"
                                  ? value.toFixed(1)
                                  : value
                              }
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            {uniqueSchools.map((school, idx) => {
                              const colors = [
                                "#3b82f6",
                                "#ef4444",
                                "#10b981",
                                "#f59e0b",
                                "#8b5cf6",
                                "#ec4899",
                                "#14b8a6",
                                "#f97316",
                                "#6366f1",
                                "#84cc16",
                                "#06b6d4",
                                "#d946ef",
                              ];
                              return (
                                <Bar
                                  key={school}
                                  dataKey={school}
                                  fill={colors[idx % colors.length]}
                                />
                              );
                            })}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">
                        Week-by-Week Data
                      </h3>
                      <table className="min-w-full border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-300">
                            <th className="px-2 sm:px-4 py-2 text-left font-semibold text-gray-900">
                              Week
                            </th>
                            {uniqueSchools.map((school) => (
                              <th
                                key={school}
                                className="px-2 sm:px-4 py-2 text-right font-semibold text-gray-900 whitespace-nowrap"
                              >
                                {school}
                              </th>
                            ))}
                            <th className="px-2 sm:px-4 py-2 text-right font-semibold text-gray-900 whitespace-nowrap bg-blue-100">
                              AVG
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(movingAveragesByDept[dept.key] || []).map(
                            (row, idx) => {
                              // Calculate average for this row
                              const avgScore = uniqueSchools.length > 0
                                ? uniqueSchools.reduce((sum, school) => sum + (row[school] as number || 0), 0) / uniqueSchools.length
                                : 0;

                              return (
                                <tr
                                  key={idx}
                                  className={`border-b border-gray-200 ${
                                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                  }`}
                                >
                                  <td className="px-2 sm:px-4 py-2 font-medium text-gray-900">
                                    {row.weekLabel}
                                  </td>
                                  {uniqueSchools.map((school) => (
                                    <td
                                      key={school}
                                      className="px-2 sm:px-4 py-2 text-right text-gray-700"
                                    >
                                      {formatScore(row[school] as number)}
                                    </td>
                                  ))}
                                  <td className="px-2 sm:px-4 py-2 text-right text-gray-900 font-semibold bg-blue-50">
                                    {formatScore(avgScore)}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Variance Table */}
                    <div className="rounded-lg border border-gray-300 overflow-hidden">
                      <h4 className="text-sm font-semibold text-gray-900 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 mb-0">
                        Variance Analysis
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-xs sm:text-sm">
                          <thead>
                            {(() => {
                              const tableData = movingAveragesByDept[dept.key] || [];
                              const latestWeek = tableData[tableData.length - 1];
                              const prevWeek = tableData[tableData.length - 2];
                              
                              // Extract week numbers from labels (e.g., "Week 11" → 11)
                              const latestWeekNum = latestWeek?.weekLabel ? parseInt(latestWeek.weekLabel.match(/\d+/)?.[0] || '0') : 0;
                              const prevWeekNum = prevWeek?.weekLabel ? parseInt(prevWeek.weekLabel.match(/\d+/)?.[0] || '0') : latestWeekNum - 1;
                              
                              // Calculate previous year (same term, previous year)
                              const prevYear = selectedYear - 1;
                              
                              return (
                                <tr className="bg-gray-100 border-b border-gray-300">
                                  <th className="px-2 sm:px-4 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">School</th>
                                  <th className="px-2 sm:px-4 py-2 text-center font-semibold text-gray-900 whitespace-nowrap">
                                    <div>Week {latestWeekNum}</div>
                                    <div className="text-xs font-normal text-gray-600">Term {selectedTerm}, {selectedYear}</div>
                                  </th>
                                  <th className="px-2 sm:px-4 py-2 text-center font-semibold text-gray-900 whitespace-nowrap">
                                    <div>Week {prevWeekNum}</div>
                                    <div className="text-xs font-normal text-gray-600">Term {selectedTerm}, {selectedYear}</div>
                                  </th>
                                  <th className="px-2 sm:px-4 py-2 text-center font-semibold text-blue-700 whitespace-nowrap">
                                    <div>WoW Var.</div>
                                    <div className="text-xs font-normal text-blue-600">Week-over-Week</div>
                                  </th>
                                  <th className="px-2 sm:px-4 py-2 text-center font-semibold text-gray-900 whitespace-nowrap">
                                    <div>Week {latestWeekNum}</div>
                                    <div className="text-xs font-normal text-gray-600">Term {selectedTerm}, {prevYear}</div>
                                  </th>
                                  <th className="px-2 sm:px-4 py-2 text-center font-semibold text-green-700 whitespace-nowrap">
                                    <div>ToT Var.</div>
                                    <div className="text-xs font-normal text-green-600">Term-over-Term</div>
                                  </th>
                                </tr>
                              );
                            })()} 
                          </thead>
                          <tbody>
                            {uniqueSchools.map((school, schoolIdx) => {
                              const tableData = movingAveragesByDept[dept.key] || [];
                              const latestWeek = tableData[tableData.length - 1];
                              const prevWeek = tableData[tableData.length - 2];
                              
                              const currentScore = latestWeek?.[school] as number || 0;
                              const prevWeekScore = prevWeek?.[school] as number || 0;
                              const wowVariance = currentScore && prevWeekScore ? currentScore - prevWeekScore : 0;
                              
                              // Get previous year same week data
                              const prevYearTableData = prevYearMovingAveragesByDept[dept.key] || [];
                              const latestWeekNum = latestWeek?.weekLabel ? parseInt(latestWeek.weekLabel.match(/\d+/)?.[0] || '0') : 0;
                              const prevYearSameWeek = prevYearTableData[latestWeekNum - 1]; // Arrays are 0-indexed
                              const prevTermSameWeekScore = prevYearSameWeek?.[school] as number || 0;
                              const totVariance = currentScore && prevTermSameWeekScore ? currentScore - prevTermSameWeekScore : 0;
                              
                              const wowColor = wowVariance > 0 ? 'text-green-700 font-semibold' : wowVariance < 0 ? 'text-red-700 font-semibold' : 'text-gray-600';
                              const totColor = totVariance > 0 ? 'text-green-700 font-semibold' : totVariance < 0 ? 'text-red-700 font-semibold' : 'text-gray-600';

                              return (
                                <tr key={school} className={`border-b border-gray-200 ${schoolIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                  <td className="px-2 sm:px-4 py-2 font-medium text-gray-900">{school}</td>
                                  <td className="px-2 sm:px-4 py-2 text-center text-gray-700">{formatScore(currentScore)}</td>
                                  <td className="px-2 sm:px-4 py-2 text-center text-gray-700">{formatScore(prevWeekScore)}</td>
                                  <td className={`px-2 sm:px-4 py-2 text-center ${wowColor}`}>
                                    {wowVariance > 0 ? '+' : ''}{formatScore(wowVariance)}
                                  </td>
                                  <td className="px-2 sm:px-4 py-2 text-center text-gray-700">
                                    {prevTermSameWeekScore > 0 ? formatScore(prevTermSameWeekScore) : '—'}
                                  </td>
                                  <td className={`px-2 sm:px-4 py-2 text-center ${totColor}`}>
                                    {prevTermSameWeekScore > 0 ? `${totVariance > 0 ? '+' : ''}${formatScore(totVariance)}` : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                            {/* AVG Row */}
                            {(() => {
                              const tableData = movingAveragesByDept[dept.key] || [];
                              const latestWeek = tableData[tableData.length - 1] || {};
                              const prevWeek = tableData[tableData.length - 2] || {};
                              
                              // Calculate averages
                              const avgCurrentScore = uniqueSchools.length > 0 
                                ? uniqueSchools.reduce((sum, school) => sum + (latestWeek?.[school] as number || 0), 0) / uniqueSchools.length
                                : 0;
                              
                              const avgPrevWeekScore = uniqueSchools.length > 0 
                                ? uniqueSchools.reduce((sum, school) => sum + (prevWeek?.[school] as number || 0), 0) / uniqueSchools.length
                                : 0;
                              
                              const avgWowVariance = uniqueSchools.length > 0
                                ? uniqueSchools.reduce((sum, school) => {
                                    const current = latestWeek?.[school] as number || 0;
                                    const prev = prevWeek?.[school] as number || 0;
                                    return sum + (current && prev ? current - prev : 0);
                                  }, 0) / uniqueSchools.length
                                : 0;
                              
                              // Calculate average ToT variance
                              const prevYearTableData = prevYearMovingAveragesByDept[dept.key] || [];
                              const latestWeekNum = latestWeek?.weekLabel ? parseInt(latestWeek.weekLabel.match(/\d+/)?.[0] || '0') : 0;
                              const prevYearSameWeek = prevYearTableData[latestWeekNum - 1];
                              
                              const avgPrevYearScore = uniqueSchools.length > 0 && prevYearSameWeek
                                ? uniqueSchools.reduce((sum, school) => sum + (prevYearSameWeek?.[school] as number || 0), 0) / uniqueSchools.length
                                : 0;
                              
                              const avgTotVariance = avgCurrentScore && avgPrevYearScore ? avgCurrentScore - avgPrevYearScore : 0;
                              
                              const avgWowColor = avgWowVariance > 0 ? 'text-green-700 font-semibold' : avgWowVariance < 0 ? 'text-red-700 font-semibold' : 'text-gray-600';
                              const avgTotColor = avgTotVariance > 0 ? 'text-green-700 font-semibold' : avgTotVariance < 0 ? 'text-red-700 font-semibold' : 'text-gray-600';
                              
                              return (
                                <tr className="bg-blue-100 border-t-2 border-gray-300 font-semibold">
                                  <td className="px-2 sm:px-4 py-2 font-bold text-gray-900">AVG</td>
                                  <td className="px-2 sm:px-4 py-2 text-center text-gray-900">{formatScore(avgCurrentScore)}</td>
                                  <td className="px-2 sm:px-4 py-2 text-center text-gray-900">{formatScore(avgPrevWeekScore)}</td>
                                  <td className={`px-2 sm:px-4 py-2 text-center ${avgWowColor}`}>
                                    {avgWowVariance > 0 ? '+' : ''}{formatScore(avgWowVariance)}
                                  </td>
                                  <td className="px-2 sm:px-4 py-2 text-center text-gray-900">
                                    {avgPrevYearScore > 0 ? formatScore(avgPrevYearScore) : '—'}
                                  </td>
                                  <td className={`px-2 sm:px-4 py-2 text-center ${avgTotColor}`}>
                                    {avgPrevYearScore > 0 ? `${avgTotVariance > 0 ? '+' : ''}${formatScore(avgTotVariance)}` : '—'}
                                  </td>
                                </tr>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Link back to Scorecard Entry */}
        <div className="mt-8 sm:mt-10 text-center">
          <button
            onClick={() => router.push("/scorecard-entry")}
            className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium rounded-lg transition"
          >
            ← Back to Scorecard Entry
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
