"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PrinterIcon, EyeIcon } from "@heroicons/react/24/outline";

const currentYear = new Date().getFullYear();
const START_YEAR = 2023;
const availableYears = Array.from(
  { length: currentYear - START_YEAR + 1 },
  (_, i) => currentYear - i
);

const metricLabels: Record<string, string> = {
  fees: "Fees Collection",
  expenditure: "Schools Expenditure",
  infrastructure: "Infrastructure",
  enrollment: "Enrollment & Admissions",
  academics: "Academic Performance",
  syllabus: "Syllabus Coverage",
};

export default function GMWeeklyReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [weekStart, setWeekStart] = useState(1);
  const [weekEnd, setWeekEnd] = useState(14);
  const [includeMetrics, setIncludeMetrics] = useState({
    fees: true,
    expenditure: true,
    infrastructure: true,
    enrollment: true,
    academics: true,
    syllabus: true,
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [gmName, setGmName] = useState(session?.user?.name || "General Manager");

  const selectedMetrics = Object.entries(includeMetrics)
    .filter(([, value]) => value)
    .map(([key]) => metricLabels[key] || key);

  const hasMetricsSelected = selectedMetrics.length > 0;

  // Fetch weekly report data
  const fetchReportData = async () => {
    setDataLoading(true);
    try {
      const response = await fetch(
        `/api/weekly-reports?year=${selectedYear}&term=${selectedTerm}`
      );
      const allReports = (await response.json()) as any[];
      
      // Filter by week range
      const filtered = allReports.filter(
        (report) => report.weekNumber >= weekStart && report.weekNumber <= weekEnd
      );
      
      setReportData(filtered);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user?.role !== "GM") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (hasMetricsSelected) {
      fetchReportData();
    }
  }, [selectedYear, selectedTerm, weekStart, weekEnd, hasMetricsSelected]);

  return (
    <DashboardLayout>
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .print-header { display: block !important; page-break-after: avoid; }
          .print-content { display: block !important; }
          .report-section { page-break-inside: avoid; margin-bottom: 1.5rem; }
          h1, h2, h3 { page-break-after: avoid; }
          .signature-section { display: block !important; margin-top: 3rem; }
        }
        @media screen {
          .print-header { display: none; }
          .print-content { margin-top: 2rem; }
          .signature-section { margin-top: 3rem; }
        }
      `}</style>

      {/* Print Header */}
      <div className="print-header w-full bg-blue-900 text-white p-8 text-center mb-8">
        <div className="flex items-center justify-center gap-6 mb-4">
          <img src="/sak.jpg" alt="SAK" style={{width:"72px",height:"72px",objectFit:"contain",background:"white",borderRadius:"8px",padding:"4px"}} />
          <div>
            <h1 className="text-4xl font-bold">SIR APOLLO KAGGWA SCHOOLS</h1>
            <p className="text-lg mt-1">SINCE 1996</p>
          </div>
          <img src="/sak.jpg" alt="SAK" style={{width:"72px",height:"72px",objectFit:"contain",background:"white",borderRadius:"8px",padding:"4px"}} />
        </div>
        <h2 className="text-2xl font-bold mt-2">WEEKLY PERFORMANCE REPORT</h2>
        <p className="mt-3 text-lg">Term {selectedTerm}, {selectedYear}</p>
        <p className="text-sm mt-2">Weeks {weekStart} - {weekEnd}</p>
      </div>

      {/* Form Builder - Hide on Print */}
      <div className="no-print max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Weekly Reports</h1>
          <p className="text-gray-600 mt-1">Generate weekly performance reports for your submission</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Report Builder</h2>
              <p className="text-sm text-gray-600 mt-1">Select the period, weeks, and metrics to include.</p>
            </div>

            {/* Period Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Academic Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-gray-900"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Term</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-gray-900"
                >
                  <option value={1}>Term 1</option>
                  <option value={2}>Term 2</option>
                  <option value={3}>Term 3</option>
                </select>
              </div>
            </div>

            {/* Week Range Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Start Week</label>
                <select
                  value={weekStart}
                  onChange={(e) => setWeekStart(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-gray-900"
                >
                  {Array.from({ length: 14 }, (_, i) => i + 1).map((week) => (
                    <option key={week} value={week}>Week {week}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">End Week</label>
                <select
                  value={weekEnd}
                  onChange={(e) => setWeekEnd(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-gray-900"
                >
                  {Array.from({ length: 14 }, (_, i) => i + 1).map((week) => (
                    <option key={week} value={week}>Week {week}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* GM Name Input */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-2">Your Name (for signature)</label>
              <input
                type="text"
                value={gmName}
                onChange={(e) => setGmName(e.target.value)}
                placeholder="General Manager Name"
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-gray-900"
              />
            </div>

            {/* Metrics Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Include in Report</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(includeMetrics).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-blue-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        setIncludeMetrics({ ...includeMetrics, [key]: e.target.checked })
                      }
                      className="w-5 h-5 rounded text-blue-600"
                    />
                    <span className="font-semibold text-gray-700">{metricLabels[key] || key}</span>
                  </label>
                ))}
              </div>
              {!hasMetricsSelected && (
                <p className="mt-3 text-sm text-amber-700">Select at least one metric to generate a report.</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setPreviewOpen(true)}
                disabled={!hasMetricsSelected || reportData.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 font-semibold transition-colors"
              >
                <EyeIcon className="w-5 h-5" />
                Preview
              </button>
              <button
                onClick={() => window.print()}
                disabled={!hasMetricsSelected || dataLoading || reportData.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold transition-colors"
              >
                <PrinterIcon className="w-5 h-5" />
                {dataLoading ? "Loading..." : "Print Report"}
              </button>
            </div>
          </div>

          {/* Report Summary */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 h-fit">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Report Summary</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <span className="font-semibold text-gray-900">Period:</span> Term {selectedTerm}, {selectedYear}
              </div>
              <div>
                <span className="font-semibold text-gray-900">Weeks:</span> {weekStart} to {weekEnd}
              </div>
              <div>
                <span className="font-semibold text-gray-900">Your Name:</span> {gmName}
              </div>
              <div>
                <span className="font-semibold text-gray-900">Data Loaded:</span> {reportData.length} week(s)
              </div>
              <div>
                <span className="font-semibold text-gray-900">Sections:</span>
                <ul className="mt-2 list-disc list-inside text-gray-600">
                  {selectedMetrics.length === 0 ? (
                    <li>No sections selected</li>
                  ) : (
                    selectedMetrics.map((label) => <li key={label}>{label}</li>)
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Report Content - Print Ready */}
      {reportData.length > 0 && (
        <div className="print-content max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white">
          {/* Executive Summary */}
          <div className="report-section mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">Executive Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                <p className="text-sm text-gray-600">Weeks Covered</p>
                <p className="text-3xl font-bold text-blue-900">{reportData.length}</p>
              </div>
              <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
                <p className="text-sm text-gray-600">Total Enrollment</p>
                <p className="text-3xl font-bold text-green-900">{reportData.reduce((sum, r) => sum + (r.totalEnrollment || 0), 0)}</p>
              </div>
              <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded">
                <p className="text-sm text-gray-600">Average Fees Collection</p>
                <p className="text-3xl font-bold text-purple-900">{(reportData.reduce((sum, r) => sum + (r.feesCollectionPercent || 0), 0) / reportData.length).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Fees Collection */}
          {includeMetrics.fees && (
            <div className="report-section mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">Fees Collection</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left font-semibold">Week</th>
                      <th className="border border-gray-300 p-2 text-right font-semibold">Collection %</th>
                      <th className="border border-gray-300 p-2 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-semibold">Week {report.weekNumber}</td>
                        <td className="border border-gray-300 p-2 text-right">{report.feesCollectionPercent}%</td>
                        <td className="border border-gray-300 p-2">
                          {report.feesCollectionPercent >= 80 ? (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">On Track</span>
                          ) : report.feesCollectionPercent >= 60 ? (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">Attention</span>
                          ) : (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">Critical</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Schools Expenditure */}
          {includeMetrics.expenditure && (
            <div className="report-section mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">Schools Expenditure</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left font-semibold">Week</th>
                      <th className="border border-gray-300 p-2 text-right font-semibold">Expenditure %</th>
                      <th className="border border-gray-300 p-2 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-semibold">Week {report.weekNumber}</td>
                        <td className="border border-gray-300 p-2 text-right">{report.schoolsExpenditurePercent}%</td>
                        <td className="border border-gray-300 p-2">
                          {report.schoolsExpenditurePercent <= 100 && report.schoolsExpenditurePercent >= 80 ? (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">Normal</span>
                          ) : report.schoolsExpenditurePercent > 100 ? (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">Over Budget</span>
                          ) : (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">Under Budget</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Infrastructure */}
          {includeMetrics.infrastructure && (
            <div className="report-section mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">Infrastructure Status</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left font-semibold">Week</th>
                      <th className="border border-gray-300 p-2 text-right font-semibold">Progress %</th>
                      <th className="border border-gray-300 p-2 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-semibold">Week {report.weekNumber}</td>
                        <td className="border border-gray-300 p-2 text-right">{report.infrastructurePercent}%</td>
                        <td className="border border-gray-300 p-2">
                          {report.infrastructurePercent >= 75 ? (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">Good Progress</span>
                          ) : report.infrastructurePercent >= 50 ? (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">In Progress</span>
                          ) : (
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold">Needs Attention</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Enrollment & Admissions */}
          {includeMetrics.enrollment && (
            <div className="report-section mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">Enrollment & Admissions</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left font-semibold">Week</th>
                      <th className="border border-gray-300 p-2 text-right font-semibold">Total Enrollment</th>
                      <th className="border border-gray-300 p-2 text-right font-semibold">Theology Students</th>
                      <th className="border border-gray-300 p-2 text-right font-semibold">New Admissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-semibold">Week {report.weekNumber}</td>
                        <td className="border border-gray-300 p-2 text-right">{report.totalEnrollment}</td>
                        <td className="border border-gray-300 p-2 text-right">{report.theologyEnrollment}</td>
                        <td className="border border-gray-300 p-2 text-right">{report.admissions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Academic Performance */}
          {includeMetrics.academics && (
            <div className="report-section mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">Academic Performance</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left font-semibold">Week</th>
                      <th className="border border-gray-300 p-2 text-right font-semibold">P7 Prep Exams %</th>
                      <th className="border border-gray-300 p-2 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-semibold">Week {report.weekNumber}</td>
                        <td className="border border-gray-300 p-2 text-right">{report.p7PrepExamsPercent}%</td>
                        <td className="border border-gray-300 p-2">
                          {report.p7PrepExamsPercent >= 80 ? (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">Excellent</span>
                          ) : report.p7PrepExamsPercent >= 60 ? (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">Good</span>
                          ) : (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">Needs Improvement</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Syllabus Coverage */}
          {includeMetrics.syllabus && (
            <div className="report-section mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">Syllabus Coverage</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left font-semibold">Week</th>
                      <th className="border border-gray-300 p-2 text-right font-semibold">Coverage %</th>
                      <th className="border border-gray-300 p-2 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-semibold">Week {report.weekNumber}</td>
                        <td className="border border-gray-300 p-2 text-right">{report.syllabusCoveragePercent}%</td>
                        <td className="border border-gray-300 p-2">
                          {report.syllabusCoveragePercent >= 80 ? (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">On Track</span>
                          ) : report.syllabusCoveragePercent >= 60 ? (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">Monitor</span>
                          ) : (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">Behind</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Signature Section */}
          <div className="signature-section border-t-2 border-gray-300 mt-8 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <p className="text-sm text-gray-600 mb-8">___________________________________</p>
                <p className="text-sm font-semibold text-gray-900">{gmName}</p>
                <p className="text-sm text-gray-600">General Manager</p>
                <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-8">___________________________________</p>
                <p className="text-sm font-semibold text-gray-900">Director&apos;s Signature</p>
                <p className="text-sm text-gray-600">Date: ____________________</p>
              </div>
            </div>
          </div>

          {/* Report Footer */}
          <div className="border-t-2 border-gray-300 mt-8 pt-6 text-center text-xs text-gray-500">
            <p>This is an official report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
            <p className="mt-1">SIR APOLLO KAGGWA SCHOOLS - WEEKLY PERFORMANCE REPORT</p>
          </div>
        </div>
      )}

      {/* Data Loading / No Data Message */}
      {!dataLoading && hasMetricsSelected && reportData.length === 0 && (
        <div className="print-content max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800 font-semibold">No data available for the selected period.</p>
            <p className="text-sm text-yellow-700 mt-2">Try selecting a different term or week range.</p>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && reportData.length > 0 && (
        <div className="no-print fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Report Preview</h3>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-gray-500 hover:text-gray-700 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="text-sm text-gray-700 space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">Report Details</p>
                <p className="text-gray-600">Term {selectedTerm}, {selectedYear} · Weeks {weekStart}-{weekEnd}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">Data Summary</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-blue-50 p-2 rounded">
                    <span className="text-gray-600">Weeks:</span>
                    <span className="font-bold text-blue-900"> {reportData.length}</span>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <span className="text-gray-600">Total Enrollment:</span>
                    <span className="font-bold text-green-900"> {reportData.reduce((sum, r) => sum + (r.totalEnrollment || 0), 0)}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">Sections Included</p>
                <ul className="space-y-1">
                  {selectedMetrics.map((label) => (
                    <li key={label} className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
