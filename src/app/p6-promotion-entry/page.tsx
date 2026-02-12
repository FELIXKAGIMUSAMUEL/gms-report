"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeftIcon, CheckCircleIcon, PencilSquareIcon, TrashIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";
import { buildSchoolMatchIndex, resolveSchoolName } from "@/lib/school-matching";

interface P6PromotionResult {
  id: string;
  school: string;
  year: number;
  setNumber: number;
  popn: number;
  absences: number;
  actualPopn: number;
  agg4: number;
  divisionI: number;
  divisionII: number;
  divisionIII: number;
  divisionIV: number;
  ungraded: number;
  api: number;
  rank: string | null;
}

interface School {
  id: string;
  name: string;
}

const currentYear = new Date().getFullYear();
const START_YEAR = 2022;
const availableYears = Array.from({ length: currentYear - START_YEAR + 1 }, (_, i) => currentYear - i);
const availableSets = [4, 5, 6];

export default function P6PromotionEntryPage() {
  const { status } = useSession();
  const router = useRouter();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedSet, setSelectedSet] = useState<number>(6);
  const [schools, setSchools] = useState<School[]>([]);
  const [results, setResults] = useState<P6PromotionResult[]>([]);
  const [editingData, setEditingData] = useState<Record<string, P6PromotionResult>>({});

  const schoolMatchIndex = useMemo(() => buildSchoolMatchIndex(schools), [schools]);
  const getResolvedSchoolName = (rawValue: string) => resolveSchoolName(rawValue, schoolMatchIndex);
  const getDisplaySchoolName = (rawValue: string) => getResolvedSchoolName(rawValue) || rawValue;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [currentEntryData, setCurrentEntryData] = useState({
    popn: 0,
    absences: 0,
    actualPopn: 0,
    agg4: 0,
    divisionI: 0,
    divisionII: 0,
    divisionIII: 0,
    divisionIV: 0,
    ungraded: 0,
  });

  const actualPopnValue = currentEntryData.actualPopn > 0
    ? currentEntryData.actualPopn
    : Math.max(currentEntryData.popn - currentEntryData.absences, 0);

  const totalDivisions =
    currentEntryData.divisionI +
    currentEntryData.divisionII +
    currentEntryData.divisionIII +
    currentEntryData.divisionIV +
    currentEntryData.ungraded;

  const apiPreview = useMemo(() => {
    if (!actualPopnValue) return 0;
    return (
      (currentEntryData.agg4 / actualPopnValue) * 100 +
      (currentEntryData.divisionI / actualPopnValue) * 500
    );
  }, [currentEntryData, actualPopnValue]);

  const percentOfActual = (value: number) => {
    if (!actualPopnValue) return 0;
    return (value / actualPopnValue) * 100;
  };

  const hasSelectedSchool = Boolean(selectedSchool);

  const fetchSchools = useCallback(async () => {
    try {
      const response = await fetch("/api/schools");
      if (response.ok) {
        const data = await response.json();
        setSchools(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch schools:", err);
    }
  }, []);

  const fetchResults = useCallback(async () => {
    try {
      setFetchLoading(true);
      const params = new URLSearchParams({ year: String(selectedYear), setNumber: String(selectedSet) });
      const response = await fetch(`/api/p6-promotion-results?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        setResults(list);
        const mapped: Record<string, P6PromotionResult> = {};
        list.forEach((record: P6PromotionResult) => {
          mapped[record.school] = record;
        });
        setEditingData(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch P6 promotion results:", err);
    } finally {
      setFetchLoading(false);
    }
  }, [selectedYear, selectedSet]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSchools();
      fetchResults();
    }
  }, [status, fetchSchools, fetchResults]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchResults();
    }
  }, [selectedYear, selectedSet, status, fetchResults]);

  const handleSaveEntry = async () => {
    if (!selectedSchool) {
      setError("Please select a school");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/p6-promotion-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school: selectedSchool,
          year: selectedYear,
          setNumber: selectedSet,
          popn: currentEntryData.popn,
          absences: currentEntryData.absences,
          actualPopn: currentEntryData.actualPopn,
          agg4: currentEntryData.agg4,
          divisionI: currentEntryData.divisionI,
          divisionII: currentEntryData.divisionII,
          divisionIII: currentEntryData.divisionIII,
          divisionIV: currentEntryData.divisionIV,
          ungraded: currentEntryData.ungraded,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save data");
      }

      const result = await response.json();
      setEditingData(prev => ({ ...prev, [result.school]: result }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      setCurrentEntryData({
        popn: 0,
        absences: 0,
        actualPopn: 0,
        agg4: 0,
        divisionI: 0,
        divisionII: 0,
        divisionIII: 0,
        divisionIV: 0,
        ungraded: 0,
      });
      setSelectedSchool("");

      await fetchResults();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  const handleEditEntry = (school: string) => {
    const data = editingData[school];
    if (!data) return;
    setSelectedSchool(school);
    setCurrentEntryData({
      popn: data.popn,
      absences: data.absences,
      actualPopn: data.actualPopn,
      agg4: data.agg4,
      divisionI: data.divisionI,
      divisionII: data.divisionII,
      divisionIII: data.divisionIII,
      divisionIV: data.divisionIV,
      ungraded: data.ungraded,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteEntry = async (school: string) => {
    const record = editingData[school];
    if (!record) return;
    if (!confirm(`Delete P6 promotion results for ${school} (Set ${selectedSet})?`)) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/p6-promotion-results?id=${record.id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete record");
      }
      setEditingData(prev => {
        const updated = { ...prev };
        delete updated[school];
        return updated;
      });
      await fetchResults();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete data");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = schools.map((school) => ({
      School: school.name,
      Year: selectedYear,
      Set: selectedSet,
      POPN: 0,
      ABS: 0,
      "Act POPN": 0,
      "AGG 4": 0,
      "Div I": 0,
      "Div II": 0,
      "Div III": 0,
      "Div IV": 0,
      Ungraded: 0,
    }));

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws["!cols"] = [
      { wch: 20 },
      { wch: 8 },
      { wch: 6 },
      { wch: 10 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 10 },
      { wch: 10 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "P6 Promotion Template");
    XLSX.writeFile(wb, `P6_Promotion_Template_${selectedYear}_Set${selectedSet}.xlsx`);
  };

  const handleImportFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      if (schools.length === 0) {
        await fetchSchools();
      }

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error("No data found in Excel file");
      }

      let savedCount = 0;
      let failedCount = 0;
      const skippedSchools: string[] = [];

      for (const row of jsonData as any[]) {
        const school = row.School || row.SCHOOL || row.school;
        if (!school) continue;

        const resolvedName = getResolvedSchoolName(school);
        if (!resolvedName) {
          skippedSchools.push(String(school));
          failedCount++;
          continue;
        }

        const year = Number.parseInt(row.Year ?? row.YEAR ?? selectedYear, 10) || selectedYear;
        const setNumber = Number.parseInt(row.Set ?? row.SET ?? selectedSet, 10) || selectedSet;

        const payload = {
          school: resolvedName,
          year,
          setNumber,
          popn: Number.parseInt(row.POPN ?? row.Popn ?? row.popn ?? 0, 10) || 0,
          absences: Number.parseInt(row.ABS ?? row.Abs ?? row.abs ?? 0, 10) || 0,
          actualPopn: Number.parseInt(row["Act POPN"] ?? row.actPopn ?? row.ActPopn ?? 0, 10) || 0,
          agg4: Number.parseInt(row["AGG 4"] ?? row.AGG4 ?? row.agg4 ?? 0, 10) || 0,
          divisionI: Number.parseInt(row["Div I"] ?? row["DIV I"] ?? row.DivI ?? row.Div1 ?? row.div1 ?? 0, 10) || 0,
          divisionII: Number.parseInt(row["Div II"] ?? row["DIV II"] ?? row.DivII ?? row.Div2 ?? row.div2 ?? 0, 10) || 0,
          divisionIII: Number.parseInt(row["Div III"] ?? row["DIV III"] ?? row.DivIII ?? row.Div3 ?? row.div3 ?? 0, 10) || 0,
          divisionIV: Number.parseInt(row["Div IV"] ?? row["DIV IV"] ?? row.DivIV ?? row.Div4 ?? row.div4 ?? 0, 10) || 0,
          ungraded: Number.parseInt(row.Ungraded ?? row.ungraded ?? row.UNGRADED ?? 0, 10) || 0,
        };

        try {
          const response = await fetch("/api/p6-promotion-results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (response.ok) {
            savedCount++;
          } else {
            failedCount++;
          }
        } catch {
          failedCount++;
        }
      }

      await fetchResults();

      if (failedCount === 0) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const preview = skippedSchools.slice(0, 5).join(", ");
        const suffix = skippedSchools.length > 5 ? "..." : "";
        const skippedMsg = skippedSchools.length > 0 ? ` Skipped: ${preview}${suffix}` : "";
        setError(`Imported ${savedCount} rows, but ${failedCount} failed.${skippedMsg}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import data");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const handleExportToExcel = () => {
    const rows = results.map((record) => ({
      School: getDisplaySchoolName(record.school),
      Year: record.year,
      Set: record.setNumber,
      POPN: record.popn,
      ABS: record.absences,
      "Act POPN": record.actualPopn,
      "AGG 4": record.agg4,
      "Div I": record.divisionI,
      "Div II": record.divisionII,
      "Div III": record.divisionIII,
      "Div IV": record.divisionIV,
      Ungraded: record.ungraded,
      API: record.api,
      Rank: record.rank || "",
      "Div I %": record.actualPopn ? ((record.divisionI / record.actualPopn) * 100).toFixed(1) : "0.0",
      "Div II %": record.actualPopn ? ((record.divisionII / record.actualPopn) * 100).toFixed(1) : "0.0",
      "Div III %": record.actualPopn ? ((record.divisionIII / record.actualPopn) * 100).toFixed(1) : "0.0",
      "Div IV %": record.actualPopn ? ((record.divisionIV / record.actualPopn) * 100).toFixed(1) : "0.0",
      "Ungraded %": record.actualPopn ? ((record.ungraded / record.actualPopn) * 100).toFixed(1) : "0.0",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `P6 Promotion ${selectedYear} Set${selectedSet}`);
    XLSX.writeFile(wb, `P6_Promotion_${selectedYear}_Set${selectedSet}.xlsx`);
  };

  const sortedResults = useMemo(
    () => results.slice().sort((a, b) => a.school.localeCompare(b.school)),
    [results]
  );

  // Reset pagination when year or set changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedSet]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = sortedResults.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">P.6 Promotion Entry (Sets 4, 5, 6)</h1>
          <p className="text-gray-600 mt-2">
            Capture per-school promotion results per set (POPN, ABS, Actual POPN, AGG 4, Divisions, API, rank). Actual POPN defaults to POPN - ABS when omitted.
          </p>
        </div>

        {success && (
          <div className="mb-4 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded">
            <CheckCircleIcon className="w-5 h-5" />
            <span>Saved successfully</span>
          </div>
        )}

        {error && (
          <div className="mb-4 text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Set</label>
              <select
                value={selectedSet}
                onChange={(e) => setSelectedSet(Number(e.target.value))}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {availableSets.map((set) => (
                  <option key={set} value={set}>
                    Set {set}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select school</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.name}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
            {!hasSelectedSchool && (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                Select a school to enter promotion details.
              </div>
            )}
          </div>
          {hasSelectedSchool && (
            <>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">POPN</label>
                  <input
                    type="number"
                    value={currentEntryData.popn}
                    onChange={(e) => setCurrentEntryData(prev => ({ ...prev, popn: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ABS</label>
                  <input
                    type="number"
                    value={currentEntryData.absences}
                    onChange={(e) => setCurrentEntryData(prev => ({ ...prev, absences: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actual POPN (defaults to POPN - ABS)</label>
                  <input
                    type="number"
                    value={currentEntryData.actualPopn}
                    onChange={(e) => setCurrentEntryData(prev => ({ ...prev, actualPopn: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AGG 4</label>
                  <input
                    type="number"
                    value={currentEntryData.agg4}
                    onChange={(e) => setCurrentEntryData(prev => ({ ...prev, agg4: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API (auto)</label>
                  <input
                    type="text"
                    value={apiPreview.toFixed(1)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Div I</label>
                  <input
                    type="number"
                    value={currentEntryData.divisionI}
                    onChange={(e) => setCurrentEntryData(prev => ({ ...prev, divisionI: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Div II</label>
                  <input
                    type="number"
                    value={currentEntryData.divisionII}
                    onChange={(e) => setCurrentEntryData(prev => ({ ...prev, divisionII: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Div III</label>
                  <input
                    type="number"
                    value={currentEntryData.divisionIII}
                    onChange={(e) => setCurrentEntryData(prev => ({ ...prev, divisionIII: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Div IV</label>
                  <input
                    type="number"
                    value={currentEntryData.divisionIV}
                    onChange={(e) => setCurrentEntryData(prev => ({ ...prev, divisionIV: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ungraded</label>
                  <input
                    type="number"
                    value={currentEntryData.ungraded}
                    onChange={(e) => setCurrentEntryData(prev => ({ ...prev, ungraded: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                <p>Total divisions: {totalDivisions}</p>
                <p>Actual POPN used: {actualPopnValue}</p>
                <p className="mt-1">Div I %: {percentOfActual(currentEntryData.divisionI).toFixed(1)}%</p>
              </div>
            </>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleSaveEntry}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Download Template
            </button>
            <label className="px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center gap-2">
              <ArrowDownTrayIcon className="w-4 h-4" />
              Import Excel
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFromExcel} />
            </label>
            <button
              onClick={handleExportToExcel}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>

        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Entries for {selectedYear} — Set {selectedSet}</h2>
              <p className="text-sm text-gray-600">Division percentages use Actual POPN.</p>
            </div>
            <div className="text-right">
              {fetchLoading ? (
                <span className="text-sm text-gray-500">Loading...</span>
              ) : sortedResults.length > 0 && (
                <div className="text-sm text-gray-600">
                  Showing <strong>{startIndex + 1}-{Math.min(endIndex, sortedResults.length)}</strong> of <strong>{sortedResults.length}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold text-gray-900">School</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-900">POPN</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-900">ABS</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-900">Act POPN</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-900">AGG 4</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-900">Div I</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-900">Div II</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-900">Div III</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-900">Div IV</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-900">Ungraded</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-900">Div I %</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-900">API</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-900">Rank</th>
                  <th className="px-3 py-3 text-right font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedResults.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 font-semibold text-gray-900">{getDisplaySchoolName(record.school)}</td>
                    <td className="px-3 py-3 text-gray-700">{record.popn}</td>
                    <td className="px-3 py-3 text-gray-700">{record.absences}</td>
                    <td className="px-3 py-3 text-gray-700">{record.actualPopn}</td>
                    <td className="px-3 py-3 text-gray-700">{record.agg4}</td>
                    <td className="px-3 py-3 text-gray-700">{record.divisionI}</td>
                    <td className="px-3 py-3 text-gray-700">{record.divisionII}</td>
                    <td className="px-3 py-3 text-gray-700">{record.divisionIII}</td>
                    <td className="px-3 py-3 text-gray-700">{record.divisionIV}</td>
                    <td className="px-3 py-3 text-gray-700">{record.ungraded}</td>
                    <td className="px-3 py-3 text-gray-700">{record.actualPopn ? ((record.divisionI / record.actualPopn) * 100).toFixed(1) : "0.0"}%</td>
                    <td className="px-3 py-3 text-gray-700">{record.api.toFixed(1)}</td>
                    <td className="px-3 py-3 text-gray-700">{record.rank || ""}</td>
                    <td className="px-3 py-3 text-right text-sm">
                      <button
                        onClick={() => handleEditEntry(record.school)}
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 mr-3"
                      >
                        <PencilSquareIcon className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(record.school)}
                        className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                      >
                        <TrashIcon className="w-4 h-4" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedResults.length === 0 && (
                  <tr>
                    <td colSpan={14} className="px-3 py-6 text-center text-gray-500">
                      No records for this year and set yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {sortedResults.length > itemsPerPage && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {currentPage > 3 && (
                  <>
                    <button
                      onClick={() => goToPage(1)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      1
                    </button>
                    {currentPage > 4 && <span className="px-2 text-gray-500">...</span>}
                  </>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    return page === currentPage ||
                           page === currentPage - 1 ||
                           page === currentPage - 2 ||
                           page === currentPage + 1 ||
                           page === currentPage + 2;
                  })
                  .map(page => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-2 border rounded-lg text-sm font-medium ${
                        page === currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && <span className="px-2 text-gray-500">...</span>}
                    <button
                      onClick={() => goToPage(totalPages)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
