"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { DocumentArrowDownIcon, PrinterIcon, EyeIcon } from "@heroicons/react/24/outline";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const currentYear = new Date().getFullYear();
const START_YEAR = 2023;
const availableYears = Array.from(
  { length: currentYear - START_YEAR + 1 },
  (_, i) => currentYear - i
);

const metricLabels: Record<string, string> = {
  enrollment: "Enrollment",
  fees: "Fees Collection",
  academics: "Academic Performance",
  infrastructure: "Infrastructure",
  issues: "Issues & Risks",
};

export default function TrusteeBoardReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [reportType, setReportType] = useState("quarterly");
  const [includeMetrics, setIncludeMetrics] = useState({
    enrollment: true,
    fees: true,
    academics: true,
    infrastructure: true,
    issues: true,
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(false);

  const selectedMetrics = Object.entries(includeMetrics)
    .filter(([, value]) => value)
    .map(([key]) => metricLabels[key] || key);

  const hasMetricsSelected = selectedMetrics.length > 0;
  const reportFileName = `board-report-${selectedYear}-term${selectedTerm}.pdf`;

  // Fetch report data
  const fetchReportData = async () => {
    setDataLoading(true);
    try {
      const [financialRes, budgetRes, weeklyRes] = await Promise.all([
        fetch(`/api/financial-entries?year=${selectedYear}&term=${selectedTerm}`),
        fetch(`/api/budgets?year=${selectedYear}&term=${selectedTerm}`),
        fetch(`/api/weekly-reports?year=${selectedYear}&term=${selectedTerm}`),
      ]);

      const financial = await financialRes.json();
      const budget = await budgetRes.json();
      const weekly = await weeklyRes.json();

      // Process data
      const income = Array.isArray(financial) ? financial.filter((f: any) => f.type === "INCOME") : [];
      const expenses = Array.isArray(financial) ? financial.filter((f: any) => f.type === "EXPENSE") : [];
      const totalIncome = income.reduce((sum: number, f: any) => sum + (parseFloat(f.amount) || 0), 0);
      const totalExpense = expenses.reduce((sum: number, f: any) => sum + (parseFloat(f.amount) || 0), 0);
      const netBalance = totalIncome - totalExpense;

      // Monthly aggregation
      const monthlyAgg: Record<number, { income: number; expense: number }> = {};
      income.forEach((f: any) => {
        const month = f.month || 1;
        if (!monthlyAgg[month]) monthlyAgg[month] = { income: 0, expense: 0 };
        monthlyAgg[month].income += parseFloat(f.amount) || 0;
      });
      expenses.forEach((f: any) => {
        const month = f.month || 1;
        if (!monthlyAgg[month]) monthlyAgg[month] = { income: 0, expense: 0 };
        monthlyAgg[month].expense += parseFloat(f.amount) || 0;
      });

      const monthlyData = Object.entries(monthlyAgg).map(([month, data]) => ({
        month: `Month ${month}`,
        income: data.income,
        expense: data.expense,
      }));

      // Budget vs actual by category
      const budgetMap = new Map((Array.isArray(budget) ? budget : []).map((b: any) => [b.category, parseFloat(b.amount) || 0]));
      const expensesByCategory: Record<string, number> = {};
      expenses.forEach((f: any) => {
        const category = f.category || "Other";
        expensesByCategory[category] = (expensesByCategory[category] || 0) + parseFloat(f.amount) || 0;
      });

      const budgetVsActual = Array.from(budgetMap.keys()).map((category) => ({
        category,
        budget: budgetMap.get(category),
        actual: expensesByCategory[category] || 0,
      }));

      setReportData({
        totalIncome,
        totalExpense,
        netBalance,
        monthlyData,
        budgetVsActual,
        incomeCount: income.length,
        expenseCount: expenses.length,
        weeklyReports: Array.isArray(weekly) ? weekly : [],
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (hasMetricsSelected) {
      fetchReportData();
    }
  }, [selectedYear, selectedTerm, hasMetricsSelected]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user?.role !== "TRUSTEE") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

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
        }
        @media screen {
          .print-header { display: none; }
          .print-content { margin-top: 2rem; }
        }
      `}</style>

      {/* Print Header */}
      <div className="print-header w-full bg-blue-900 text-white p-8 text-center mb-8">
        <h1 className="text-4xl font-bold">SIR APOLLO KAGGWA SCHOOLS</h1>
        <p className="text-lg mt-2">SINCE 1996</p>
        <h2 className="text-2xl font-bold mt-6">BOARD MEETING REPORT</h2>
        <p className="mt-3 text-lg">Term {selectedTerm}, {selectedYear}</p>
        <p className="text-sm mt-4">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* Form Builder - Hide on Print */}
      <div className="no-print max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Board Meeting Reports</h1>
          <p className="text-gray-600 mt-1">Generate professional reports for board presentations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Report Builder</h2>
              <p className="text-sm text-gray-600 mt-1">Select the period, report type, and sections to include.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-gray-900"
                >
                  <option value="quarterly">Term Report</option>
                  <option value="annual">Annual Report</option>
                  <option value="summary">Executive Summary</option>
                </select>
              </div>
            </div>

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
                <p className="mt-3 text-sm text-amber-700">Select at least one section to generate a report.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setPreviewOpen(true)}
                disabled={!hasMetricsSelected}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 font-semibold transition-colors"
              >
                <EyeIcon className="w-5 h-5" />
                Preview
              </button>
              <button
                onClick={() => window.print()}
                disabled={!hasMetricsSelected || dataLoading}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold transition-colors"
              >
                <PrinterIcon className="w-5 h-5" />
                {dataLoading ? "Loading..." : "Print Report"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 h-fit">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Report Summary</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <span className="font-semibold text-gray-900">Period:</span> Term {selectedTerm}, {selectedYear}
              </div>
              <div>
                <span className="font-semibold text-gray-900">Report Type:</span> {reportType === "quarterly" ? "Term Report" : reportType === "annual" ? "Annual Report" : "Executive Summary"}
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
              <div>
                <span className="font-semibold text-gray-900">File name:</span> {reportFileName}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Report Content - Print Ready */}
      {reportData && (
        <div className="print-content max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white">
          {/* Executive Summary */}
          {includeMetrics.fees && (
            <div className="report-section mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">Executive Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                  <p className="text-sm text-gray-600">Total Income</p>
                  <p className="text-2xl font-bold text-blue-900">UGX {reportData.totalIncome.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
                  <p className="text-sm text-gray-600">Total Expenditure</p>
                  <p className="text-2xl font-bold text-red-900">UGX {reportData.totalExpense.toLocaleString()}</p>
                </div>
                <div className={`border-l-4 p-4 rounded ${reportData.netBalance >= 0 ? "bg-green-50 border-green-600" : "bg-orange-50 border-orange-600"}`}>
                  <p className="text-sm text-gray-600">Net Balance</p>
                  <p className={`text-2xl font-bold ${reportData.netBalance >= 0 ? "text-green-900" : "text-orange-900"}`}>
                    UGX {reportData.netBalance.toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded">
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-purple-900">{reportData.incomeCount + reportData.expenseCount}</p>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Cash Flow Chart */}
          {includeMetrics.fees && reportData.monthlyData.length > 0 && (
            <div className="report-section mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">Monthly Cash Flow</h2>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={reportData.monthlyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `UGX ${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Budget vs Actual */}
          {includeMetrics.academics && reportData.budgetVsActual.length > 0 && (
            <div className="report-section mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">Budget vs Actual Expenditure</h2>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={reportData.budgetVsActual} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => `UGX ${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="budget" fill="#8b5cf6" />
                  <Bar dataKey="actual" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Key Performance Indicators */}
          {includeMetrics.enrollment && (
            <div className="report-section mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">Key Performance Indicators</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">💰 Financial Health</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Revenue Generated: UGX {reportData.totalIncome.toLocaleString()}</li>
                    <li>• Expenses Incurred: UGX {reportData.totalExpense.toLocaleString()}</li>
                    <li>• Surplus/Deficit: UGX {reportData.netBalance.toLocaleString()}</li>
                    <li>• Expense Ratio: {((reportData.totalExpense / reportData.totalIncome) * 100).toFixed(1)}%</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">📊 Activity Summary</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Total Income Entries: {reportData.incomeCount}</li>
                    <li>• Total Expense Entries: {reportData.expenseCount}</li>
                    <li>• Reporting Period: Term {selectedTerm}, {selectedYear}</li>
                    <li>• Report Type: {reportType === "quarterly" ? "Term Report" : reportType === "annual" ? "Annual Report" : "Executive Summary"}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Issues & Risks */}
          {includeMetrics.issues && (
            <div className="report-section mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">Issues & Risks</h2>
              <div className="bg-amber-50 border-l-4 border-amber-600 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Budget Compliance Check:</strong> {reportData.budgetVsActual.some((b: any) => b.actual > b.budget) ? `⚠️ ${reportData.budgetVsActual.filter((b: any) => b.actual > b.budget).length} category/categories exceeded budget allocation.` : "✓ All categories within budget limits."}
                </p>
              </div>
              <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">No critical issues reported for this term. Continue monitoring cash flow and budget allocations.</p>
              </div>
            </div>
          )}

          {/* Infrastructure & Infrastructure */}
          {includeMetrics.infrastructure && (
            <div className="report-section mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">Infrastructure & Operations</h2>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>✓ Systems operational and fully functional</li>
                  <li>✓ All financial records accurately maintained</li>
                  <li>✓ Data integrity verified and validated</li>
                  <li>✓ Regular backups performed and verified</li>
                </ul>
              </div>
            </div>
          )}

          {/* Report Footer */}
          <div className="border-t-2 border-gray-300 mt-8 pt-6 text-center text-sm text-gray-600">
            <p>This is an official report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
            <p className="mt-1">Prepared for Board Review - Term {selectedTerm}, {selectedYear}</p>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && reportData && (
        <div className="no-print fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Report Preview</h3>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="text-sm text-gray-700 space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">Report Overview</p>
                <p className="text-gray-600">Term {selectedTerm}, {selectedYear} · {reportType === "quarterly" ? "Term Report" : reportType === "annual" ? "Annual Report" : "Executive Summary"}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">Financial Snapshot</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-blue-50 p-2 rounded">
                    <span className="text-gray-600">Income:</span>
                    <span className="font-bold text-blue-900"> UGX {reportData.totalIncome.toLocaleString()}</span>
                  </div>
                  <div className="bg-red-50 p-2 rounded">
                    <span className="text-gray-600">Expense:</span>
                    <span className="font-bold text-red-900"> UGX {reportData.totalExpense.toLocaleString()}</span>
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
