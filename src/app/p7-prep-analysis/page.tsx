"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface P7PrepResult {
  id: string;
  school: string;
  prepNumber: number;
  term: number;
  year: number;
  enrollment: number;
  divisionI: number;
  divisionII: number;
  divisionIII: number;
  divisionIV: number;
  averageScore: number;
}

interface SchoolAnalysis {
  school: string;
  totalEnrollment: number;
  divI: number;
  divII: number;
  divIII: number;
  divIV: number;
  percentDivI: number;
  api: number;
  rank: number;
}

const currentYear = new Date().getFullYear();
const START_YEAR = 2023;
const PREP_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function P7PrepAnalysisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [results, setResults] = useState<P7PrepResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        year: String(selectedYear),
        term: String(selectedTerm),
      });
      const response = await fetch(`/api/p7-prep-results?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch results");
      }
      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchResults();
    }
  }, [status, selectedYear, selectedTerm]);

  const prepsForSelectedTerm = selectedTerm === 1
    ? [1, 2, 3]
    : selectedTerm === 2
      ? [4, 5, 6]
      : [7, 8, 9];

  // Calculate comprehensive school analysis
  const schoolAnalysis = useMemo(() => {
    const schoolMap = new Map<string, {
      enrollment: number;
      divI: number;
      divII: number;
      divIII: number;
      divIV: number;
      totalWeighted: number;
    }>();

    results.forEach(r => {
      const existing = schoolMap.get(r.school) || {
        enrollment: 0,
        divI: 0,
        divII: 0,
        divIII: 0,
        divIV: 0,
        totalWeighted: 0,
      };

      existing.enrollment += r.enrollment;
      existing.divI += r.divisionI;
      existing.divII += r.divisionII;
      existing.divIII += r.divisionIII;
      existing.divIV += r.divisionIV;
      existing.totalWeighted += (r.averageScore * r.enrollment);

      schoolMap.set(r.school, existing);
    });

    const analysis: SchoolAnalysis[] = Array.from(schoolMap.entries()).map(([school, data]) => {
      const totalDivisions = data.divI + data.divII + data.divIII + data.divIV;
      const percentDivI = totalDivisions > 0 ? (data.divI / totalDivisions) * 100 : 0;
      const api = data.enrollment > 0 ? data.totalWeighted / data.enrollment : 0;

      return {
        school,
        totalEnrollment: data.enrollment,
        divI: data.divI,
        divII: data.divII,
        divIII: data.divIII,
        divIV: data.divIV,
        percentDivI,
        api,
        rank: 0,
      };
    });

    // Sort by API and assign ranks
    analysis.sort((a, b) => b.api - a.api);
    analysis.forEach((item, index) => {
      item.rank = index + 1;
    });

    return analysis;
  }, [results]);

  const divisionDistribution = useMemo(() => {
    const total = results.reduce((sum, r) => sum + r.divisionI + r.divisionII + r.divisionIII + r.divisionIV, 0);
    const divI = results.reduce((sum, r) => sum + r.divisionI, 0);
    const divII = results.reduce((sum, r) => sum + r.divisionII, 0);
    const divIII = results.reduce((sum, r) => sum + r.divisionIII, 0);
    const divIV = results.reduce((sum, r) => sum + r.divisionIV, 0);

    return [
      { name: 'Div I', value: divI, percentage: total > 0 ? ((divI / total) * 100).toFixed(1) : 0 },
      { name: 'Div II', value: divII, percentage: total > 0 ? ((divII / total) * 100).toFixed(1) : 0 },
      { name: 'Div III', value: divIII, percentage: total > 0 ? ((divIII / total) * 100).toFixed(1) : 0 },
      { name: 'Div IV', value: divIV, percentage: total > 0 ? ((divIV / total) * 100).toFixed(1) : 0 },
    ];
  }, [results]);

  const prepPerformanceTrend = useMemo(() => {
    return prepsForSelectedTerm.map(prepNum => {
      const prepResults = results.filter(r => r.prepNumber === prepNum);
      const totalEnrollment = prepResults.reduce((sum, r) => sum + r.enrollment, 0);
      const weightedAvg = totalEnrollment > 0
        ? prepResults.reduce((sum, r) => sum + (r.averageScore * r.enrollment), 0) / totalEnrollment
        : 0;
      
      return {
        prep: `Prep ${prepNum}`,
        avgScore: Number(weightedAvg.toFixed(1)),
        schools: prepResults.length,
      };
    });
  }, [results, prepsForSelectedTerm]);

  const topPerformers = useMemo(() => {
    return schoolAnalysis.slice(0, 5);
  }, [schoolAnalysis]);

  const summary = useMemo(() => {
    const totalEnrollment = results.reduce((sum, r) => sum + (r.enrollment || 0), 0);
    const totalSchools = new Set(results.map(r => r.school)).size;
    const weightedAverage = totalEnrollment === 0
      ? 0
      : results.reduce((sum, r) => sum + (r.averageScore * (r.enrollment || 0)), 0) / totalEnrollment;
    
    const totalDivI = results.reduce((sum, r) => sum + r.divisionI, 0);
    const totalDivII = results.reduce((sum, r) => sum + r.divisionII, 0);
    const totalDivIII = results.reduce((sum, r) => sum + r.divisionIII, 0);
    const totalDivIV = results.reduce((sum, r) => sum + r.divisionIV, 0);
    const totalDivisions = totalDivI + totalDivII + totalDivIII + totalDivIV;
    const percentDivI = totalDivisions > 0 ? (totalDivI / totalDivisions) * 100 : 0;

    return {
      totalSchools,
      totalEnrollment,
      weightedAverage: Number(weightedAverage.toFixed(1)),
      totalDivI,
      totalDivII,
      totalDivIII,
      totalDivIV,
      percentDivI: Number(percentDivI.toFixed(1)),
    };
  }, [results]);

  if (status === "loading") {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">P.7 Prep Analysis</h1>
          <p className="text-sm text-gray-600 mt-1">Comprehensive performance analysis with rankings, trends, and insights</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-4 py-2 border-2 border-gray-400 rounded-lg bg-white font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: currentYear - START_YEAR + 1 }, (_, i) => currentYear - i).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Term</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(Number(e.target.value))}
                  className="px-4 py-2 border-2 border-gray-400 rounded-lg bg-white font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>Term 1 (Prep 1-3)</option>
                  <option value={2}>Term 2 (Prep 4-6)</option>
                  <option value={3}>Term 3 (Prep 7-9)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-lg shadow-md text-white">
            <div className="text-xs font-semibold opacity-90 mb-1">Schools Participating</div>
            <div className="text-3xl font-bold">{summary.totalSchools}</div>
            <div className="text-xs mt-2 opacity-75">Term {selectedTerm}, {selectedYear}</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-5 rounded-lg shadow-md text-white">
            <div className="text-xs font-semibold opacity-90 mb-1">Total Enrollment</div>
            <div className="text-3xl font-bold">{summary.totalEnrollment.toLocaleString()}</div>
            <div className="text-xs mt-2 opacity-75">Across all preps</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 rounded-lg shadow-md text-white">
            <div className="text-xs font-semibold opacity-90 mb-1">Avg Performance (API)</div>
            <div className="text-3xl font-bold">{summary.weightedAverage}</div>
            <div className="text-xs mt-2 opacity-75">Out of 100</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 rounded-lg shadow-md text-white">
            <div className="text-xs font-semibold opacity-90 mb-1">Division I Rate</div>
            <div className="text-3xl font-bold">{summary.percentDivI}%</div>
            <div className="text-xs mt-2 opacity-75">{summary.totalDivI} students</div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            Loading analysis...
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-gray-400 text-lg mb-2">No data available</div>
            <p className="text-sm text-gray-600">No prep results found for Term {selectedTerm}, {selectedYear}.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-8">
            {/* Top Performers */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                Top Performing Schools
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {topPerformers.map((school, idx) => (
                  <div key={school.school} className={`p-4 rounded-lg border-2 ${
                    idx === 0 ? 'bg-yellow-50 border-yellow-400' :
                    idx === 1 ? 'bg-gray-50 border-gray-400' :
                    idx === 2 ? 'bg-orange-50 border-orange-400' :
                    'bg-white border-gray-300'
                  }`}>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-700 mb-1">#{idx + 1}</div>
                      <div className="font-semibold text-gray-900 mb-2">{school.school}</div>
                      <div className="text-sm text-gray-600">API: <span className="font-bold text-gray-900">{school.api.toFixed(1)}</span></div>
                      <div className="text-xs text-gray-500 mt-1">Div I: {school.percentDivI.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Division Distribution */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Division Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={divisionDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {divisionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {divisionDistribution.map((div, idx) => (
                    <div key={div.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[idx] }}></div>
                      <span className="text-gray-700">{div.name}: <strong>{div.value}</strong> ({div.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prep Performance Trend */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Across Preps</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={prepPerformanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="prep" />
                    <YAxis domain={[0, 100]} label={{ value: 'Avg Score', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgScore" fill="#3b82f6" name="Average Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* School Rankings Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
                <h2 className="text-xl font-bold text-white">School Rankings & Performance</h2>
                <p className="text-xs text-blue-100 mt-1">Sorted by Academic Performance Index (API)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-center font-bold text-gray-700">Rank</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-700 border-l border-gray-300">School</th>
                      <th className="px-3 py-3 text-center font-bold text-gray-700 border-l border-gray-300">Enrollment</th>
                      <th className="px-3 py-3 text-center font-bold text-gray-700 border-l border-gray-300">Div I</th>
                      <th className="px-3 py-3 text-center font-bold text-gray-700 border-l border-gray-300">Div II</th>
                      <th className="px-3 py-3 text-center font-bold text-gray-700 border-l border-gray-300">Div III</th>
                      <th className="px-3 py-3 text-center font-bold text-gray-700 border-l border-gray-300">Div IV</th>
                      <th className="px-3 py-3 text-center font-bold text-gray-700 border-l border-gray-300">% Div I</th>
                      <th className="px-3 py-3 text-center font-bold text-gray-700 border-l border-gray-300">API</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {schoolAnalysis.map((school) => (
                      <tr key={school.school} className={`hover:bg-gray-50 ${
                        school.rank === 1 ? 'bg-yellow-50' :
                        school.rank === 2 ? 'bg-gray-50' :
                        school.rank === 3 ? 'bg-orange-50' : ''
                      }`}>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                            school.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                            school.rank === 2 ? 'bg-gray-300 text-gray-900' :
                            school.rank === 3 ? 'bg-orange-400 text-orange-900' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {school.rank}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900 border-l border-gray-300">{school.school}</td>
                        <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{school.totalEnrollment}</td>
                        <td className="px-3 py-3 text-center border-l border-gray-300 text-green-700 font-semibold">{school.divI}</td>
                        <td className="px-3 py-3 text-center border-l border-gray-300 text-blue-700 font-semibold">{school.divII}</td>
                        <td className="px-3 py-3 text-center border-l border-gray-300 text-orange-700 font-semibold">{school.divIII}</td>
                        <td className="px-3 py-3 text-center border-l border-gray-300 text-red-700 font-semibold">{school.divIV}</td>
                        <td className="px-3 py-3 text-center border-l border-gray-300">
                          <span className={`font-bold ${
                            school.percentDivI >= 70 ? 'text-green-600' :
                            school.percentDivI >= 50 ? 'text-blue-600' :
                            school.percentDivI >= 30 ? 'text-orange-600' :
                            'text-red-600'
                          }`}>
                            {school.percentDivI.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center border-l border-gray-300">
                          <span className={`font-bold text-lg ${
                            school.api >= 85 ? 'text-green-600' :
                            school.api >= 75 ? 'text-blue-600' :
                            school.api >= 65 ? 'text-orange-600' :
                            'text-red-600'
                          }`}>
                            {school.api.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                      <td colSpan={2} className="px-4 py-3 text-gray-900">TOTAL / AVERAGE</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-900">{summary.totalEnrollment}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-green-700">{summary.totalDivI}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-blue-700">{summary.totalDivII}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-orange-700">{summary.totalDivIII}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-red-700">{summary.totalDivIV}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-900">{summary.percentDivI.toFixed(1)}%</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-900 text-lg">{summary.weightedAverage.toFixed(1)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            {prepsForSelectedTerm.map((prepNumber) => {
              const prepResults = results
                .filter(r => r.prepNumber === prepNumber)
                .sort((a, b) => a.school.localeCompare(b.school));

              if (prepResults.length === 0) return null;

              return (
                <div key={`analysis-prep-${prepNumber}`} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">Prep {prepNumber} Results</h3>
                    <span className="text-xs text-gray-500">{prepResults.length} schools</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b-2 border-gray-300">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">School</th>
                          <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Enrollment</th>
                          <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Div I</th>
                          <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">DIV AVG %</th>
                          <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Div II</th>
                          <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Div III</th>
                          <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Div IV</th>
                          <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Avg Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {prepResults.map(result => {
                          const totalDivisions = result.divisionI + result.divisionII + result.divisionIII + result.divisionIV;
                          const divAvgPercent = totalDivisions > 0 ? ((result.divisionI / totalDivisions) * 100) : 0;
                          
                          return (
                            <tr key={`${result.school}-${result.prepNumber}`} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-semibold text-gray-900">{result.school}</td>
                              <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{result.enrollment}</td>
                              <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{result.divisionI}</td>
                              <td className="px-3 py-3 text-center border-l border-gray-300">
                                <span className={`font-semibold ${
                                  divAvgPercent >= 70 ? 'text-green-600' :
                                  divAvgPercent >= 50 ? 'text-blue-600' :
                                  divAvgPercent >= 30 ? 'text-orange-600' :
                                  'text-red-600'
                                }`}>
                                  {divAvgPercent.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{result.divisionII}</td>
                              <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{result.divisionIII}</td>
                              <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{result.divisionIV}</td>
                              <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700 font-semibold">{result.averageScore.toFixed(1)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
