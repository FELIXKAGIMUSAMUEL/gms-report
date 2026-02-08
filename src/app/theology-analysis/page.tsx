"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowLeftIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, PencilIcon } from "@heroicons/react/24/outline";

interface TheologyEnrollment {
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

export default function TheologyAnalysisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [enrollments, setEnrollments] = useState<TheologyEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(currentYear);
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
      const response = await fetch("/api/theology-enrollment");
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
            <h1 className="text-3xl font-bold text-gray-900">Theology Enrollment Analysis</h1>
            <p className="text-gray-600 mt-2">Detailed trends, comparisons, and variance analysis</p>
          </div>
          <button
            onClick={() => router.push("/theology-enrollment-entry")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PencilIcon className="w-5 h-5" />
            Enter Data
          </button>
        </div>

        {/* Year Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>
    </DashboardLayout>
  );
}
