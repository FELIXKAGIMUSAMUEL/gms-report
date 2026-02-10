"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

interface SchoolMetrics {
  name: string;
  totalEnrollment: number;
  feesCollection: number;
  p7PrepAverage: number;
  infrastructureScore: number;
  staffEngagement: number;
  overallScore: number;
  rank?: number;
  previousRank?: number;
  trend: "up" | "down" | "stable";
}

export default function TrusteeScorecard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [schools, setSchools] = useState<SchoolMetrics[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [sortBy, setSortBy] = useState<"overall" | "enrollment" | "fees" | "academics">("overall");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user?.role !== "TRUSTEE") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchSchoolMetrics();
  }, [selectedYear]);

  const fetchSchoolMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/schools?year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setSchools(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
    } finally {
      setLoading(false);
    }
  };

  const rankedSchools = useMemo(() => {
    // Calculate overall score from available metrics with defaults
    let sorted = schools.map(school => {
      const enrollment = school.totalEnrollment || 0;
      const fees = school.feesCollection || 0;
      const prep = school.p7PrepAverage || 0;
      const infra = school.infrastructureScore || 0;
      const staff = school.staffEngagement || 0;
      
      // Calculate overall as average of available percentage scores
      const overall = school.overallScore || ((fees + prep + infra + staff) / 4);
      
      return {
        ...school,
        totalEnrollment: enrollment,
        feesCollection: fees,
        p7PrepAverage: prep,
        infrastructureScore: infra,
        staffEngagement: staff,
        overallScore: overall,
      };
    });
    
    if (sortBy === "overall") {
      sorted.sort((a, b) => b.overallScore - a.overallScore);
    } else if (sortBy === "enrollment") {
      sorted.sort((a, b) => b.totalEnrollment - a.totalEnrollment);
    } else if (sortBy === "fees") {
      sorted.sort((a, b) => b.feesCollection - a.feesCollection);
    } else if (sortBy === "academics") {
      sorted.sort((a, b) => b.p7PrepAverage - a.p7PrepAverage);
    }

    return sorted.map((school, idx) => ({
      ...school,
      rank: idx + 1,
    }));
  }, [schools, sortBy]);

  const getStatusColor = (score: number) => {
    if (score >= 85) return "green";
    if (score >= 70) return "amber";
    return "red";
  };

  const getStatusBg = (score: number) => {
    if (score >= 85) return "bg-green-50";
    if (score >= 70) return "bg-amber-50";
    return "bg-red-50";
  };

  const renderStatusBadge = (value: number) => {
    const safeValue = value || 0;
    const color = getStatusColor(safeValue);
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
        color === "green" ? "bg-green-100 text-green-800" :
        color === "amber" ? "bg-amber-100 text-amber-800" :
        "bg-red-100 text-red-800"
      }`}>
        {safeValue.toFixed(1)}%
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">School Performance Scorecard</h1>
          <p className="text-gray-600 mt-1">Overall rankings and school-by-school performance metrics</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : rankedSchools.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No school data available for {selectedYear}</p>
            <p className="text-gray-400 text-sm mt-2">Try selecting a different year</p>
          </div>
        ) : (
          <>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {[2024, 2025, 2026].map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy("overall")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === "overall"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Overall
              </button>
              <button
                onClick={() => setSortBy("enrollment")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === "enrollment"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Enrollment
              </button>
              <button
                onClick={() => setSortBy("fees")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === "fees"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Fees
              </button>
              <button
                onClick={() => setSortBy("academics")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === "academics"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Academics
              </button>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {rankedSchools.slice(0, 3).map((school, idx) => {
            const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉";
            return (
              <div key={school.name} className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-amber-400 rounded-lg p-6">
                <div className="text-3xl mb-2">{medal}</div>
                <h3 className="text-xl font-bold text-gray-900">{school.name}</h3>
                <p className="text-3xl font-bold text-amber-600 mt-2">{(school.overallScore || 0).toFixed(1)}</p>
                <p className="text-xs text-gray-600 mt-1">Overall Score</p>
              </div>
            );
          })}
        </div>

        {/* Detailed Rankings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">School</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Enrollment</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Fees</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">P.7 Prep</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Infrastructure</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Staff</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Overall</th>
                </tr>
              </thead>
              <tbody>
                {rankedSchools.map((school, idx) => (
                  <tr key={school.name} className={`border-b border-gray-200 ${idx < 3 ? "bg-green-50" : "hover:bg-gray-50"}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        idx === 0 ? "bg-yellow-400 text-white" :
                        idx === 1 ? "bg-gray-400 text-white" :
                        idx === 2 ? "bg-orange-400 text-white" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {school.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-gray-900">{school.name}</div>
                        {school.trend === "up" && <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />}
                        {school.trend === "down" && <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-700">{school.totalEnrollment}</td>
                    <td className="px-6 py-4 text-center">
                      {renderStatusBadge(school.feesCollection)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderStatusBadge(school.p7PrepAverage)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderStatusBadge(school.infrastructureScore)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderStatusBadge(school.staffEngagement)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center gap-1 px-3 py-2 rounded font-bold text-sm ${
                        getStatusColor(school.overallScore || 0) === "green" ? "bg-green-100 text-green-800" :
                        getStatusColor(school.overallScore || 0) === "amber" ? "bg-amber-100 text-amber-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {(school.overallScore || 0).toFixed(1)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Heatmap Legend */}
        <div className="mt-8 flex items-center gap-4 text-sm">
          <span className="font-semibold text-gray-700">Status Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-gray-600">Excellent (≥85)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-100 border border-amber-300 rounded"></div>
            <span className="text-gray-600">Good (70-84)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-gray-600">Needs Attention (&lt;70)</span>
          </div>
        </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
