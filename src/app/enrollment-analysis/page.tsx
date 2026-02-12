"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowLeftIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, PencilIcon } from "@heroicons/react/24/outline";

interface EnrollmentEnrollment {
  id: string;
  school: string;
  class: string;
  term: number;
  year: number;
  count: number;
}

const CLASSES = ["KG1", "KG2", "KG3", "P.1", "P.2", "P.3", "P.4", "P.5", "P.6", "P.7"];
const currentYear = new Date().getFullYear();
const START_YEAR = 2023;
const availableYears = Array.from({ length: currentYear - START_YEAR + 1 }, (_, i) => currentYear - i);

export default function EnrollmentAnalysisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [enrollments, setEnrollments] = useState<EnrollmentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [compareYears, setCompareYears] = useState<number[]>([currentYear, currentYear - 1]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAllEnrollments();
    }
  }, [status]);

  const fetchAllEnrollments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/enrollment");
      if (response.ok) {
        const data = await response.json();
        setEnrollments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch enrollments:", err);
    } finally {
      setLoading(false);
    }
  };

  // School trends by term for selected year
  const schoolTrends = useMemo(() => {
    const schoolData: Record<string, { school: string; term1: number; term2: number; term3: number }> = {};

    enrollments.forEach(e => {
      if (e.year === selectedYear) {
        if (!schoolData[e.school]) {
          schoolData[e.school] = { school: e.school, term1: 0, term2: 0, term3: 0 };
        }
        if (e.term === 1) schoolData[e.school].term1 += e.count;
        if (e.term === 2) schoolData[e.school].term2 += e.count;
        if (e.term === 3) schoolData[e.school].term3 += e.count;
      }
    });

    return Object.values(schoolData).sort((a, b) => b.term1 - a.term1);
  }, [enrollments, selectedYear]);

  // Multi-year comparison data
  const multiYearComparison = useMemo(() => {
    const data: Record<string, any> = {};

    compareYears.forEach(year => {
      enrollments.forEach(e => {
        if (e.year === year) {
          const key = `${e.school}-${e.term}`;
          if (!data[key]) {
            data[key] = { school: e.school, term: e.term };
          }
          data[key][`year${year}`] = (data[key][`year${year}`] || 0) + e.count;
        }
      });
    });

    return Object.values(data).sort((a: any, b: any) => {
      if (a.school !== b.school) return a.school.localeCompare(b.school);
      return a.term - b.term;
    });
  }, [enrollments, compareYears]);

  // Class distribution for selected year
  const classDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    CLASSES.forEach(cls => distribution[cls] = 0);

    enrollments.forEach(e => {
      if (e.year === selectedYear) {
        distribution[e.class] = (distribution[e.class] || 0) + e.count;
      }
    });

    return CLASSES.map(cls => ({ class: cls, count: distribution[cls] }));
  }, [enrollments, selectedYear]);

  // Term-to-term variance by school
  const termVariances = useMemo(() => {
    const variances: Record<string, any> = {};

    enrollments.forEach(e => {
      if (e.year === selectedYear) {
        if (!variances[e.school]) {
          variances[e.school] = { school: e.school, terms: {} };
        }
        if (!variances[e.school].terms[e.term]) {
          variances[e.school].terms[e.term] = 0;
        }
        variances[e.school].terms[e.term] += e.count;
      }
    });

    return Object.values(variances).map((v: any) => {
      const term1 = v.terms[1] || 0;
      const term2 = v.terms[2] || 0;
      const term3 = v.terms[3] || 0;

      return {
        school: v.school,
        term1,
        term2,
        term3,
        term1to2: term2 - term1,
        term2to3: term3 - term2,
        term1to3: term3 - term1,
        term1to2Percent: term1 > 0 ? ((term2 - term1) / term1 * 100) : 0,
        term2to3Percent: term2 > 0 ? ((term3 - term2) / term2 * 100) : 0,
      };
    });
  }, [enrollments, selectedYear]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const totalByYear: Record<number, number> = {};
    const totalByTerm: Record<string, number> = {};

    enrollments.forEach(e => {
      totalByYear[e.year] = (totalByYear[e.year] || 0) + e.count;
      const key = `${e.year}-${e.term}`;
      totalByTerm[key] = (totalByTerm[key] || 0) + e.count;
    });

    return { totalByYear, totalByTerm };
  }, [enrollments]);

  // Term enrollment across multiple years for selected term
  const termAcrossYears = useMemo(() => {
    const data: Record<string, any> = {};

    enrollments.forEach(e => {
      if (e.term === selectedTerm) {
        if (!data[e.school]) {
          data[e.school] = { school: e.school };
        }
        data[e.school][`year${e.year}`] = (data[e.school][`year${e.year}`] || 0) + e.count;
      }
    });

    return Object.values(data).sort((a: any, b: any) => a.school.localeCompare(b.school));
  }, [enrollments, selectedTerm]);

  // Year-range variance (e.g., 2022-2025, 2024-2025)
  const yearRangeVariance = useMemo(() => {
    const schoolYearData: Record<string, Record<number, number>> = {};

    // Build year data for each school
    availableYears.forEach(year => {
      enrollments.forEach(e => {
        if (e.year === year && e.term === selectedTerm) {
          if (!schoolYearData[e.school]) {
            schoolYearData[e.school] = {};
          }
          schoolYearData[e.school][year] = (schoolYearData[e.school][year] || 0) + e.count;
        }
      });
    });

    // Calculate variance for different period ranges
    const periods = [
      { from: availableYears[availableYears.length - 1], to: availableYears[0], label: `${availableYears[availableYears.length - 1]}-${availableYears[0]}` },
      { from: availableYears[availableYears.length - 2] || availableYears[availableYears.length - 1], to: availableYears[0], label: `${availableYears[availableYears.length - 2] || availableYears[availableYears.length - 1]}-${availableYears[0]}` },
    ];

    return periods.map(period => ({
      period: period.label,
      schools: Object.keys(schoolYearData).map(school => {
        const startValue = schoolYearData[school][period.from] || 0;
        const endValue = schoolYearData[school][period.to] || 0;
        const change = endValue - startValue;
        const changePercent = startValue > 0 ? ((change / startValue) * 100) : 0;

        return {
          school,
          start: startValue,
          end: endValue,
          change,
          changePercent,
        };
      }).filter(s => s.start > 0 || s.end > 0),
    }));
  }, [enrollments, selectedTerm, availableYears]);

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Enrollment Enrollment Analysis</h1>
            <p className="text-gray-600 mt-2">Detailed trends, comparisons, and variance analysis</p>
          </div>
          <button
            onClick={() => router.push("/enrollment-entry")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PencilIcon className="w-5 h-5" />
            Enter Data
          </button>
        </div>

        {/* Year & Term Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Analysis Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Selected Term</label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(Number(e.target.value))}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Term 1</option>
                <option value={2}>Term 2</option>
                <option value={3}>Term 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Compare Year 1</label>
              <select
                value={compareYears[0]}
                onChange={(e) => setCompareYears([Number(e.target.value), compareYears[1]])}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Compare Year 2</label>
              <select
                value={compareYears[1]}
                onChange={(e) => setCompareYears([compareYears[0], Number(e.target.value)])}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm font-medium mb-2">Term 1 Total ({selectedYear})</p>
            <p className="text-3xl font-bold text-gray-900">
              {overallStats.totalByTerm[`${selectedYear}-1`] || 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm font-medium mb-2">Term 2 Total ({selectedYear})</p>
            <p className="text-3xl font-bold text-gray-900">
              {overallStats.totalByTerm[`${selectedYear}-2`] || 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm font-medium mb-2">Term 3 Total ({selectedYear})</p>
            <p className="text-3xl font-bold text-gray-900">
              {overallStats.totalByTerm[`${selectedYear}-3`] || 0}
            </p>
          </div>
        </div>

        {/* School Trends Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment by School - {selectedYear}</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={schoolTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="school" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="term1" fill="#3b82f6" name="Term 1" />
              <Bar dataKey="term2" fill="#10b981" name="Term 2" />
              <Bar dataKey="term3" fill="#f59e0b" name="Term 3" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Class Distribution Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment by Class - {selectedYear}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="class" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Term-to-Term Variance Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600">
            <h3 className="text-lg font-bold text-white">Term-to-Term Variance - {selectedYear}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">School</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Term 1</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Term 2</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Term 3</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 bg-blue-50">T1→T2</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 bg-green-50">T2→T3</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 bg-purple-50">T1→T3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {termVariances.map((v) => (
                  <tr key={v.school} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{v.school}</td>
                    <td className="px-4 py-3 text-center text-gray-900 font-semibold text-base">{v.term1}</td>
                    <td className="px-4 py-3 text-center text-gray-900 font-semibold text-base">{v.term2}</td>
                    <td className="px-4 py-3 text-center text-gray-900 font-semibold text-base">{v.term3}</td>
                    <td className="px-4 py-3 text-center bg-blue-50">
                      <div className="flex flex-col items-center gap-1">
                        <span className={v.term1to2 >= 0 ? "text-green-600 font-semibold text-base" : "text-red-600 font-semibold text-base"}>
                          {v.term1to2 > 0 ? "+" : ""}{v.term1to2}
                        </span>
                        <span className="text-xs text-gray-600 font-medium">
                          {v.term1to2Percent > 0 ? "+" : ""}{v.term1to2Percent.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center bg-green-50">
                      <div className="flex flex-col items-center gap-1">
                        <span className={v.term2to3 >= 0 ? "text-green-600 font-semibold text-base" : "text-red-600 font-semibold text-base"}>
                          {v.term2to3 > 0 ? "+" : ""}{v.term2to3}
                        </span>
                        <span className="text-xs text-gray-600 font-medium">
                          {v.term2to3Percent > 0 ? "+" : ""}{v.term2to3Percent.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center bg-purple-50">
                      <div className="flex flex-col items-center gap-1">
                        <span className={v.term1to3 >= 0 ? "text-green-600 font-semibold text-base" : "text-red-600 font-semibold text-base"}>
                          {v.term1to3 > 0 ? "+" : ""}{v.term1to3}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Multi-Year Comparison Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Year Comparison: {compareYears[0]} vs {compareYears[1]}
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={multiYearComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="school" 
                angle={-45} 
                textAnchor="end" 
                height={100}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={`year${compareYears[0]}`} fill="#3b82f6" name={String(compareYears[0])} />
              <Bar dataKey={`year${compareYears[1]}`} fill="#10b981" name={String(compareYears[1])} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Term Enrollment Across Years Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Term {selectedTerm} Enrollment by School - Across All Years
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={termAcrossYears}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="school" 
                angle={-45} 
                textAnchor="end" 
                height={100}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              {availableYears.map((year, idx) => (
                <Bar key={year} dataKey={`year${year}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][idx % 4]} name={String(year)} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Year-Range Variance Summary */}
        <div className="space-y-6">
          {yearRangeVariance.map((variance) => (
            <div key={variance.period} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-blue-600">
                <h3 className="text-lg font-bold text-white">Enrollment Variance: {variance.period}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">School</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700 bg-blue-50">Start Year</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700 bg-blue-50">End Year</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700 bg-purple-50">Change</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700 bg-purple-50">% Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {variance.schools.map((school) => (
                      <tr key={school.school} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{school.school}</td>
                        <td className="px-4 py-3 text-center text-gray-900 font-semibold text-base bg-blue-50">{school.start}</td>
                        <td className="px-4 py-3 text-center text-gray-900 font-semibold text-base bg-blue-50">{school.end}</td>
                        <td className="px-4 py-3 text-center bg-purple-50">
                          <span className={school.change >= 0 ? "text-green-600 font-semibold text-base" : "text-red-600 font-semibold text-base"}>
                            {school.change > 0 ? "+" : ""}{school.change}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center bg-purple-50">
                          <div className="flex flex-col items-center gap-1">
                            <span className={school.change >= 0 ? "text-green-600 font-semibold text-base" : "text-red-600 font-semibold text-base"}>
                              {school.changePercent > 0 ? "+" : ""}{school.changePercent.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
