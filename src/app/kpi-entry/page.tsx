"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface WeeklyReport {
  id: string;
  weekNumber: number;
  year: number;
  feesCollectionPercent: number;
  schoolsExpenditurePercent: number;
  infrastructurePercent: number;
  totalEnrollment: number;
  theologyEnrollment: number;
  p7PrepExamsPercent: number;
  syllabusCoveragePercent: number;
  admissions: number;
}

const currentYear = new Date().getFullYear();

function SavedReportsList({ selectedYear, selectedTerm, onLoad }: { selectedYear: number; selectedTerm: number; onLoad: (r: WeeklyReport) => void }) {
  const [items, setItems] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"term" | "all">("term");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const fetchReports = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/reports?year=${selectedYear}`);
      const data = await res.json();
      setItems(data?.data || []);
    } catch (e) {
      setErr("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  useEffect(() => {
    setPage(1);
  }, [selectedTerm, selectedYear, viewMode]);

  const deleteReport = async (id: string) => {
    const ok = window.confirm("Delete this report? This cannot be undone.");
    if (!ok) return;
    const res = await fetch(`/api/weekly-reports/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchReports();
    } else {
      alert("Failed to delete report");
    }
  };

  if (loading) return <p className="text-gray-600">Loading...</p>;
  if (err) return <p className="text-red-600">{err}</p>;
  if (!items.length) return <p className="text-gray-600">No reports for this year yet.</p>;

  const termStart = (selectedTerm - 1) * 13 + 1;
  const termEnd = selectedTerm * 13;
  const filtered = items.filter(r => {
    if (viewMode === "all") return true;
    return r.weekNumber >= termStart && r.weekNumber <= termEnd;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.weekNumber - a.weekNumber;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = sorted.slice(startIdx, startIdx + pageSize);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="font-semibold">View:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode("term")}
              className={`px-3 py-1 rounded-full text-sm font-medium border ${viewMode === "term" ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-200 text-gray-700"}`}
            >
              Current Term (T{selectedTerm})
            </button>
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`px-3 py-1 rounded-full text-sm font-medium border ${viewMode === "all" ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-200 text-gray-700"}`}
            >
              All Terms (Year {selectedYear})
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Showing {Math.min(sorted.length, startIdx + 1)}-{Math.min(sorted.length, startIdx + pageSize)} of {sorted.length}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Period</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Fees %</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Expenditure %</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Infra %</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Enrollment</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Theology</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">P7 Prep %</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Syllabus %</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Admissions</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageItems.map(r => {
              const term = Math.ceil(r.weekNumber / 13);
              const weekInTerm = ((r.weekNumber - 1) % 13) + 1;
              const inCurrentTerm = term === selectedTerm;
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm text-gray-800">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${inCurrentTerm ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                        T{term} · W{weekInTerm}
                      </span>
                      <span className="text-xs text-gray-500">Year {r.year}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-800">{Math.round(r.feesCollectionPercent)}</td>
                  <td className="px-3 py-2 text-sm text-gray-800">{Math.round(r.schoolsExpenditurePercent)}</td>
                  <td className="px-3 py-2 text-sm text-gray-800">{Math.round(r.infrastructurePercent)}</td>
                  <td className="px-3 py-2 text-sm text-gray-800">{r.totalEnrollment}</td>
                  <td className="px-3 py-2 text-sm text-gray-800">{r.theologyEnrollment}</td>
                  <td className="px-3 py-2 text-sm text-gray-800">{Math.round(r.p7PrepExamsPercent)}</td>
                  <td className="px-3 py-2 text-sm text-gray-800">{Math.round(r.syllabusCoveragePercent)}</td>
                  <td className="px-3 py-2 text-sm text-gray-800">{r.admissions}</td>
                  <td className="px-3 py-2 text-sm">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onLoad(r)}
                        className="px-3 py-1 rounded-md border border-blue-300 text-blue-700 hover:bg-blue-50 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteReport(r.id)}
                        className="px-3 py-1 rounded-md border border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-700">
        <div className="flex gap-2 items-center">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className={`px-3 py-1 rounded-md border ${currentPage === 1 ? "border-gray-200 text-gray-400 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className={`px-3 py-1 rounded-md border ${currentPage === totalPages ? "border-gray-200 text-gray-400 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
          >
            Next
          </button>
        </div>
        <p>Page {currentPage} of {totalPages}</p>
      </div>
    </div>
  );
}


export default function KPIEntryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [showExistingModal, setShowExistingModal] = useState(false);
  const [existingReport, setExistingReport] = useState<WeeklyReport | null>(null);
  const [lastCheckedKey, setLastCheckedKey] = useState<string>("");
  const formRef = useRef<HTMLFormElement | null>(null);

  const [formData, setFormData] = useState<Partial<WeeklyReport>>({
    feesCollectionPercent: undefined,
    schoolsExpenditurePercent: undefined,
    infrastructurePercent: undefined,
    totalEnrollment: undefined,
    theologyEnrollment: undefined,
    p7PrepExamsPercent: undefined,
    syllabusCoveragePercent: undefined,
    admissions: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollToFormTop = () => {
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      const firstInput = formRef.current?.querySelector("input, select, textarea") as HTMLElement | null;
      if (firstInput) {
        firstInput.focus({ preventScroll: true });
      }
    });
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const termWeekToAbsolute = (term: number, week: number): number => {
    return (term - 1) * 13 + week;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "totalEnrollment" || name === "theologyEnrollment" || name === "admissions"
        ? parseInt(value) || 0
        : parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const absWeek = termWeekToAbsolute(selectedTerm, selectedWeek);
      // Check if report exists for this period first
      const checkRes = await fetch(`/api/reports?year=${selectedYear}&weekNumber=${absWeek}`);
      let exists: WeeklyReport | null = null;
      if (checkRes.ok) {
        const data = await checkRes.json();
        exists = (data?.data || [])[0] || null;
      }
      if (exists) {
        setExistingReport(exists);
        setShowExistingModal(true);
        return; // Wait for user confirmation
      }

      const payload = {
        ...formData,
        weekNumber: absWeek,
        year: selectedYear,
      };

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save KPI data");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  const confirmUpdateExisting = async () => {
    if (!existingReport) return;
    setLoading(true);
    setError(null);
    try {
      const absWeek = termWeekToAbsolute(selectedTerm, selectedWeek);
      const payload = {
        ...formData,
        weekNumber: absWeek,
        year: selectedYear,
      };
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update KPI data");
      }
      setShowExistingModal(false);
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  // Check for existing report when period changes
  // No auto modal on period change; we only warn on save attempt
  useEffect(() => {
    setLastCheckedKey("");
  }, [selectedYear, selectedTerm, selectedWeek]);

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">KPI Data Entry</h1>
          <p className="text-gray-600 mt-2">Enter weekly KPI metrics for your report</p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">KPI data saved successfully! Redirecting...</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Period Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Period Selection</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
              >
                {[currentYear - 3, currentYear - 2, currentYear - 1, currentYear].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
              >
                <option value={1}>Term 1</option>
                <option value={2}>Term 2</option>
                <option value={3}>Term 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Week</label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(w => (
                  <option key={w} value={w}>Week {w}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">

          {/* Existing Period Modal */}
          {showExistingModal && existingReport && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowExistingModal(false)} />
              <div className="relative bg-white border border-gray-200 rounded-lg shadow-lg w-full max-w-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Period Already Has Data</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Week {termWeekToAbsolute(selectedTerm, selectedWeek)} of {selectedYear} already has a saved report.
                  Would you like to load it and update?
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4 text-sm text-gray-700">
                  <div className="flex justify-between"><span>Fees %</span><span className="font-medium">{Math.round(existingReport.feesCollectionPercent)}</span></div>
                  <div className="flex justify-between"><span>Expenditure %</span><span className="font-medium">{Math.round(existingReport.schoolsExpenditurePercent)}</span></div>
                  <div className="flex justify-between"><span>Infrastructure %</span><span className="font-medium">{Math.round(existingReport.infrastructurePercent)}</span></div>
                  <div className="flex justify-between"><span>Enrollment</span><span className="font-medium">{existingReport.totalEnrollment}</span></div>
                  <div className="flex justify-between"><span>P7 Prep %</span><span className="font-medium">{Math.round(existingReport.p7PrepExamsPercent)}</span></div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={confirmUpdateExisting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Update Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExistingModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 font-medium"
                  >
                    Change Period
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Financial KPIs */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Financial KPIs</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fees Collection %</label>
                <input
                  type="number"
                  name="feesCollectionPercent"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.feesCollectionPercent ?? ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                  placeholder="0-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schools Expenditure %</label>
                <input
                  type="number"
                  name="schoolsExpenditurePercent"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.schoolsExpenditurePercent ?? ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                  placeholder="0-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Infrastructure %</label>
                <input
                  type="number"
                  name="infrastructurePercent"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.infrastructurePercent ?? ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                  placeholder="0-100"
                />
              </div>
            </div>
          </div>

          {/* Enrollment KPIs */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Enrollment KPIs</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Enrollment</label>
                <input
                  type="number"
                  name="totalEnrollment"
                  min="0"
                  value={formData.totalEnrollment ?? ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theology Enrollment</label>
                <input
                  type="number"
                  name="theologyEnrollment"
                  min="0"
                  value={formData.theologyEnrollment ?? ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admissions</label>
                <input
                  type="number"
                  name="admissions"
                  min="0"
                  value={formData.admissions ?? ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Academic KPIs */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Academic KPIs</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">P7 Prep Exams %</label>
                <input
                  type="number"
                  name="p7PrepExamsPercent"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.p7PrepExamsPercent ?? ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                  placeholder="0-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Syllabus Coverage %</label>
                <input
                  type="number"
                  name="syllabusCoveragePercent"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.syllabusCoveragePercent ?? ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0-100"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
            >
              {loading ? "Saving..." : "Save KPI Data"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Existing Data Summary & Manage */}
        <div className="bg-white mt-6 p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Reports (Year {selectedYear})</h3>
          <SavedReportsList selectedYear={selectedYear} selectedTerm={selectedTerm} onLoad={(r) => {
            const term = Math.ceil(r.weekNumber / 13);
            const weekInTerm = ((r.weekNumber - 1) % 13) + 1;
            setSelectedTerm(term);
            setSelectedWeek(weekInTerm);
            setFormData({
              feesCollectionPercent: r.feesCollectionPercent,
              schoolsExpenditurePercent: r.schoolsExpenditurePercent,
              infrastructurePercent: r.infrastructurePercent,
              totalEnrollment: r.totalEnrollment,
              theologyEnrollment: r.theologyEnrollment,
              p7PrepExamsPercent: r.p7PrepExamsPercent,
              syllabusCoveragePercent: r.syllabusCoveragePercent,
              admissions: r.admissions,
            });
            scrollToFormTop();
          }} />
        </div>
      </div>
    </DashboardLayout>
  );
}
