"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { DocumentArrowDownIcon, PrinterIcon, EyeIcon } from "@heroicons/react/24/outline";

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
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user?.role !== "TRUSTEE") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  const generateReport = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: selectedYear,
          term: selectedTerm,
          type: reportType,
          metrics: includeMetrics,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `board-report-${selectedYear}-term${selectedTerm}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Board Meeting Reports</h1>
          <p className="text-gray-600 mt-1">Generate professional reports for board presentations</p>
        </div>

        {/* Report Builder */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Report Builder</h2>

          {/* Report Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Year Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Academic Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                {[2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Term Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Term</label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value={1}>Term 1</option>
                <option value={2}>Term 2</option>
                <option value={3}>Term 3</option>
              </select>
            </div>

            {/* Report Type */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="quarterly">Quarterly Report</option>
                <option value="annual">Annual Report</option>
                <option value="summary">Executive Summary</option>
              </select>
            </div>
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
                  <span className="font-semibold text-gray-700 capitalize">{key} Metrics</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-colors"
            >
              <EyeIcon className="w-5 h-5" />
              Preview
            </button>
            <button
              onClick={generateReport}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              {loading ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
            >
              <PrinterIcon className="w-5 h-5" />
              Print
            </button>
          </div>
        </div>

        {/* Report Templates Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-bold text-blue-900 mb-2">📊 Quarterly Report</h4>
            <p className="text-sm text-blue-700">Comprehensive term overview with all metrics, trends, and action items</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h4 className="font-bold text-green-900 mb-2">📈 Annual Report</h4>
            <p className="text-sm text-green-700">Year-long performance review with comparisons and strategic insights</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h4 className="font-bold text-purple-900 mb-2">✨ Executive Summary</h4>
            <p className="text-sm text-purple-700">Brief high-level overview ideal for quick board briefings</p>
          </div>
        </div>

        {/* Preview Modal */}
        {previewOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">📄 Report preview will show:</p>
                <ul className="text-sm text-left max-w-sm mx-auto space-y-2">
                  {Object.entries(includeMetrics).map(
                    ([key, value]) =>
                      value && (
                        <li key={key} className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          <span className="capitalize">{key} Metrics</span>
                        </li>
                      )
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
