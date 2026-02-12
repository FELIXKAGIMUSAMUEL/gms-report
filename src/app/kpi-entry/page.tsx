"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
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

interface EnrollmentRecord {
  id: string;
  school: string;
  class: string;
  term: number;
  year: number;
  count: number;
}

interface School {
  id: string;
  name: string;
}

const currentYear = new Date().getFullYear();
const CLASSES = ["KG1", "KG2", "KG3", "P.1", "P.2", "P.3", "P.4", "P.5", "P.6", "P.7"];

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


interface SchoolKPIEntry {
  school: string;
  feesCollectionPercent: number;
  expenditurePercent: number;
  infrastructurePercent: number;
  syllabusCoveragePercent: number;
  admissionsCount: number;
}

export default function KPIEntryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [entryMode, setEntryMode] = useState<"aggregate" | "per-school">("aggregate");

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

  const [schools, setSchools] = useState<School[]>([]);
  const [enrollmentRecords, setEnrollmentRecords] = useState<EnrollmentRecord[]>([]);
  const [theologyRecords, setTheologyRecords] = useState<EnrollmentRecord[]>([]);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [schoolKPIData, setSchoolKPIData] = useState<SchoolKPIEntry[]>([]);
  const [prepPrefill, setPrepPrefill] = useState<{ percent: number; label: string }>({ percent: 0, label: "No prep data" });
  const [p7PrepResults, setP7PrepResults] = useState<P7PrepResult[]>([]);

  const [adjustModal, setAdjustModal] = useState<{ type: "enrollment" | "theology" | null; school: string; className: string; delta: number; saving: boolean; error: string | null }>({
    type: null,
    school: "",
    className: "",
    delta: 0,
    saving: false,
    error: null,
  });

  const scrollToFormTop = () => {
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      const firstInput = formRef.current?.querySelector("input, select, textarea") as HTMLElement | null;
      if (firstInput) {
        firstInput.focus({ preventScroll: true });
      }
    });
  };

  const fetchSchools = useCallback(async () => {
    try {
      const res = await fetch("/api/schools");
      if (res.ok) {
        const data = await res.json();
        setSchools(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch schools", err);
    }
  }, []);

  const aggregateCounts = (records: EnrollmentRecord[]) => records.reduce((sum, r) => sum + (r.count || 0), 0);

  useEffect(() => {
    if (schools.length > 0 && schoolKPIData.length === 0) {
      setSchoolKPIData(
        schools.map(school => ({
          school: school.name,
          feesCollectionPercent: 0,
          expenditurePercent: 0,
          infrastructurePercent: 0,
          syllabusCoveragePercent: 0,
          admissionsCount: 0,
        }))
      );
    }
  }, [schools, schoolKPIData.length]);

  const loadPrefills = useCallback(async () => {
    setPrefillLoading(true);
    try {
      const params = new URLSearchParams({ year: String(selectedYear), term: String(selectedTerm) });
      const [enrollRes, theoRes] = await Promise.all([
        fetch(`/api/enrollment?${params.toString()}`),
        fetch(`/api/theology-enrollment?${params.toString()}`),
      ]);

      if (enrollRes.ok) {
        const enrollmentData = await enrollRes.json();
        const list = Array.isArray(enrollmentData) ? enrollmentData : [];
        setEnrollmentRecords(list);
        const total = aggregateCounts(list);
        setFormData(prev => ({ ...prev, totalEnrollment: total }));
      }

      if (theoRes.ok) {
        const theologyData = await theoRes.json();
        const list = Array.isArray(theologyData) ? theologyData : [];
        setTheologyRecords(list);
        const total = aggregateCounts(list);
        setFormData(prev => ({ ...prev, theologyEnrollment: total }));
      }
    } catch (err) {
      console.error("Failed to prefill enrollment/theology", err);
    } finally {
      setPrefillLoading(false);
    }
  }, [selectedYear, selectedTerm]);

  const loadPrepPrefill = useCallback(async () => {
    try {
      const params = new URLSearchParams({ year: String(selectedYear), term: String(selectedTerm) });
      const res = await fetch(`/api/p7-prep-results?${params.toString()}`);
      const data = res.ok ? await res.json() : [];
      const list: P7PrepResult[] = Array.isArray(data) ? data : [];
      setP7PrepResults(list);

      const byTerm = list.filter(r => r.year === selectedYear && r.term === selectedTerm);
      if (!byTerm.length) {
        setPrepPrefill({ percent: 0, label: "No prep data" });
        setFormData(prev => ({ ...prev, p7PrepExamsPercent: 0 }));
        return;
      }
      const maxPrep = Math.max(...byTerm.map(r => r.prepNumber));
      const latest = byTerm.filter(r => r.prepNumber === maxPrep);
      const div1 = latest.reduce((sum, r) => sum + (r.divisionI || 0), 0);
      const enroll = latest.reduce((sum, r) => sum + (r.enrollment || 0), 0);
      const percent = enroll ? (div1 / enroll) * 100 : 0;
      setPrepPrefill({ percent, label: `Prep ${maxPrep}` });
      setFormData(prev => ({ ...prev, p7PrepExamsPercent: percent }));
    } catch (err) {
      console.error("Failed to prefill prep data", err);
    }
  }, [selectedYear, selectedTerm]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSchools();
      loadPrefills();
      loadPrepPrefill();
    }
  }, [status, fetchSchools, loadPrefills, loadPrepPrefill]);

  useEffect(() => {
    if (status === "authenticated") {
      loadPrefills();
      loadPrepPrefill();
    }
  }, [status, selectedYear, selectedTerm, loadPrefills, loadPrepPrefill]);

  const termWeekToAbsolute = (term: number, week: number): number => {
    return (term - 1) * 13 + week;
  };

  const calculateAggregates = (schoolData: SchoolKPIEntry[]) => {
    if (!schoolData.length) return null;
    const avgFees = schoolData.reduce((s, d) => s + d.feesCollectionPercent, 0) / schoolData.length;
    const avgExpenditure = schoolData.reduce((s, d) => s + d.expenditurePercent, 0) / schoolData.length;
    const avgInfra = schoolData.reduce((s, d) => s + d.infrastructurePercent, 0) / schoolData.length;
    const avgSyllabus = schoolData.reduce((s, d) => s + d.syllabusCoveragePercent, 0) / schoolData.length;
    const totalAdmissions = schoolData.reduce((s, d) => s + d.admissionsCount, 0);
    return { avgFees, avgExpenditure, avgInfra, avgSyllabus, totalAdmissions };
  };

  const handleSchoolKPIChange = (index: number, field: keyof SchoolKPIEntry, value: number) => {
    setSchoolKPIData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmitPerSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const absWeek = termWeekToAbsolute(selectedTerm, selectedWeek);
      const agg = calculateAggregates(schoolKPIData);
      if (!agg) throw new Error("No school data");

      const checkRes = await fetch(`/api/reports?year=${selectedYear}&weekNumber=${absWeek}`);
      let existing: WeeklyReport | null = null;
      if (checkRes.ok) {
        const data = await checkRes.json();
        existing = (data?.data || [])[0] || null;
      }
      if (existing) {
        setExistingReport(existing);
        setShowExistingModal(true);
        return;
      }

      const payload = {
        weekNumber: absWeek,
        year: selectedYear,
        term: selectedTerm,
        feesCollectionPercent: agg.avgFees,
        schoolsExpenditurePercent: agg.avgExpenditure,
        infrastructurePercent: agg.avgInfra,
        syllabusCoveragePercent: agg.avgSyllabus,
        admissions: agg.totalAdmissions,
        totalEnrollment: formData.totalEnrollment || 0,
        theologyEnrollment: formData.theologyEnrollment || 0,
        p7PrepExamsPercent: formData.p7PrepExamsPercent || 0,
      };

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");
      const report = await res.json();

      await Promise.all(
        schoolKPIData.map(data =>
          fetch("/api/school-kpi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              weeklyReportId: report.id,
              school: data.school,
              year: selectedYear,
              term: selectedTerm,
              week: selectedWeek,
              feesCollectionPercent: data.feesCollectionPercent,
              expenditurePercent: data.expenditurePercent,
              infrastructurePercent: data.infrastructurePercent,
              syllabusCoveragePercent: data.syllabusCoveragePercent,
              admissionsCount: data.admissionsCount,
            }),
          })
        )
      );

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
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

  const openAdjust = (type: "enrollment" | "theology") => {
    setAdjustModal({ type, school: "", className: "", delta: 0, saving: false, error: null });
  };

  const handleAdjustSave = async () => {
    if (!adjustModal.type) return;
    const { school, className, delta } = adjustModal;
    if (!school || !className) {
      setAdjustModal(prev => ({ ...prev, error: "Select school and class" }));
      return;
    }

    const records = adjustModal.type === "enrollment" ? enrollmentRecords : theologyRecords;
    const existing = records.find(r => r.school === school && r.class === className && r.term === selectedTerm && r.year === selectedYear);
    const base = existing?.count || 0;
    const newCount = Math.max(0, base + delta);

    setAdjustModal(prev => ({ ...prev, saving: true, error: null }));
    try {
      const payload = { school, class: className, term: selectedTerm, year: selectedYear, count: newCount };
      const endpoint = adjustModal.type === "enrollment" ? "/api/enrollment" : "/api/theology-enrollment";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save adjustment");
      }
      setAdjustModal({ type: null, school: "", className: "", delta: 0, saving: false, error: null });
      await loadPrefills();
    } catch (err) {
      setAdjustModal(prev => ({ ...prev, saving: false, error: err instanceof Error ? err.message : "Failed to save adjustment" }));
    }
  };

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
        <form ref={formRef} onSubmit={entryMode === "per-school" ? handleSubmitPerSchool : handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">

          {/* Entry Mode Tabs */}
          <div className="flex gap-2 border-b border-gray-200 mb-6">
            <button
              type="button"
              onClick={() => setEntryMode("aggregate")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                entryMode === "aggregate"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Aggregate Entry
            </button>
            <button
              type="button"
              onClick={() => setEntryMode("per-school")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                entryMode === "per-school"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Per-School Entry
            </button>
          </div>

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
          
          {/* Aggregate Entry Mode */}
          {entryMode === "aggregate" && (
            <>
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
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">Total Enrollment</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-900 font-bold text-lg">
                    {formData.totalEnrollment ?? "—"}
                  </div>
                  <button
                    type="button"
                    onClick={() => openAdjust("enrollment")}
                    className="px-3 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                  >
                    Adjust
                  </button>
                  <button
                    type="button"
                    onClick={loadPrefills}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                </div>
                <p className="text-xs text-gray-600">Prefilled from Enrollment (Year {selectedYear}, Term {selectedTerm})</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">Theology Enrollment</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-900 font-bold text-lg">
                    {formData.theologyEnrollment ?? "—"}
                  </div>
                  <button
                    type="button"
                    onClick={() => openAdjust("theology")}
                    className="px-3 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                  >
                    Adjust
                  </button>
                  <button
                    type="button"
                    onClick={loadPrefills}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                </div>
                <p className="text-xs text-gray-600">Prefilled from Theology Enrollment (Year {selectedYear}, Term {selectedTerm})</p>
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
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-900 font-bold text-lg">
                    {prepPrefill.percent ? `${prepPrefill.percent.toFixed(1)}%` : "—"}
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/p7-prep-entry")}
                    className="px-3 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                  >
                    Edit on Prep Page
                  </button>
                  <button
                    type="button"
                    onClick={loadPrepPrefill}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">Showing {prepPrefill.label} Div I % for Year {selectedYear}, Term {selectedTerm}.</p>
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
            </>
          )}

          {/* Per-School Entry Mode */}
          {entryMode === "per-school" && (
            <>
              <div className="space-y-6">
                {/* Per-School KPI Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">School</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Fees %</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Expenditure %</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Infrastructure %</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Syllabus %</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Admissions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schoolKPIData.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{row.school}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={row.feesCollectionPercent || ''}
                              onChange={(e) => handleSchoolKPIChange(idx, "feesCollectionPercent", parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={row.expenditurePercent || ''}
                              onChange={(e) => handleSchoolKPIChange(idx, "expenditurePercent", parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={row.infrastructurePercent || ''}
                              onChange={(e) => handleSchoolKPIChange(idx, "infrastructurePercent", parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={row.syllabusCoveragePercent || ''}
                              onChange={(e) => handleSchoolKPIChange(idx, "syllabusCoveragePercent", parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              value={row.admissionsCount || ''}
                              onChange={(e) => handleSchoolKPIChange(idx, "admissionsCount", parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Auto-Calculated Aggregates */}
                {schoolKPIData.length > 0 && calculateAggregates(schoolKPIData) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Auto-Calculated Aggregates</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-700">Avg Fees %:</span>
                        <span className="ml-2 font-semibold text-gray-900">{calculateAggregates(schoolKPIData)?.avgFees.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-700">Avg Expenditure %:</span>
                        <span className="ml-2 font-semibold text-gray-900">{calculateAggregates(schoolKPIData)?.avgExpenditure.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-700">Avg Infrastructure %:</span>
                        <span className="ml-2 font-semibold text-gray-900">{calculateAggregates(schoolKPIData)?.avgInfra.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-700">Avg Syllabus %:</span>
                        <span className="ml-2 font-semibold text-gray-900">{calculateAggregates(schoolKPIData)?.avgSyllabus.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-700">Total Admissions:</span>
                        <span className="ml-2 font-semibold text-gray-900">{calculateAggregates(schoolKPIData)?.totalAdmissions}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Submit */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
            >
              {loading ? "Saving..." : `Save KPI Data (${entryMode === "per-school" ? "Per-School" : "Aggregate"})`}
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

        {/* Adjust Modal */}
        {adjustModal.type && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setAdjustModal({ type: null, school: "", className: "", delta: 0, saving: false, error: null })} />
            <div className="relative bg-white border border-gray-200 rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Adjust {adjustModal.type === "enrollment" ? "Enrollment" : "Theology Enrollment"}</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                  <select
                    value={adjustModal.school}
                    onChange={(e) => setAdjustModal(prev => ({ ...prev, school: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select school</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select
                    value={adjustModal.className}
                    onChange={(e) => setAdjustModal(prev => ({ ...prev, className: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select class</option>
                    {CLASSES.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delta (increase/decrease)</label>
                  <input
                    type="number"
                    value={adjustModal.delta}
                    onChange={(e) => setAdjustModal(prev => ({ ...prev, delta: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-600 mt-1">Applies to Year {selectedYear}, Term {selectedTerm}. New count = current + delta (floors at 0).</p>
                </div>
              </div>
              {adjustModal.error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded">{adjustModal.error}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustModal({ type: null, school: "", className: "", delta: 0, saving: false, error: null })}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                  disabled={adjustModal.saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAdjustSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={adjustModal.saving}
                >
                  {adjustModal.saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

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
