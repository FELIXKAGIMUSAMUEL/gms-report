"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";

interface P7PleResult {
  id: string;
  school: string;
  year: number;
  popn: number;
  agg4: number;
  divisionI: number;
  divisionII: number;
  divisionIII: number;
  divisionIV: number;
  divisionU: number;
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

export default function P7EntryPage() {
  const { status } = useSession();
  const router = useRouter();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [schools, setSchools] = useState<School[]>([]);
  const [results, setResults] = useState<P7PleResult[]>([]);
  const [editingData, setEditingData] = useState<Record<string, P7PleResult>>({});

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [currentEntryData, setCurrentEntryData] = useState({
    popn: 0,
    agg4: 0,
    divisionI: 0,
    divisionII: 0,
    divisionIII: 0,
    divisionIV: 0,
    divisionU: 0,
  });

  const totalDivisions =
    currentEntryData.divisionI +
    currentEntryData.divisionII +
    currentEntryData.divisionIII +
    currentEntryData.divisionIV +
    currentEntryData.divisionU;

  const apiPreview = useMemo(() => {
    if (!currentEntryData.popn) return 0;
    return (
      (currentEntryData.agg4 / currentEntryData.popn) * 100 +
      (currentEntryData.divisionI / currentEntryData.popn) * 500
    );
  }, [currentEntryData]);

  const percentOfPopn = (value: number, popn: number) => {
    if (!popn) return 0;
    return (value / popn) * 100;
  };

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
      const params = new URLSearchParams({ year: String(selectedYear) });
      const response = await fetch(`/api/p7-ple-results?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        setResults(list);
        const mapped: Record<string, P7PleResult> = {};
        list.forEach((record: P7PleResult) => {
          mapped[record.school] = record;
        });
        setEditingData(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch PLE results:", err);
    } finally {
      setFetchLoading(false);
    }
  }, [selectedYear]);

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
  }, [selectedYear, status, fetchResults]);

  const handleSaveEntry = async () => {
    if (!selectedSchool) {
      setError("Please select a school");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/p7-ple-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school: selectedSchool,
          year: selectedYear,
          popn: currentEntryData.popn,
          agg4: currentEntryData.agg4,
          divisionI: currentEntryData.divisionI,
          divisionII: currentEntryData.divisionII,
          divisionIII: currentEntryData.divisionIII,
          divisionIV: currentEntryData.divisionIV,
          divisionU: currentEntryData.divisionU,
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
        agg4: 0,
        divisionI: 0,
        divisionII: 0,
        divisionIII: 0,
        divisionIV: 0,
        divisionU: 0,
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
      agg4: data.agg4,
      divisionI: data.divisionI,
      divisionII: data.divisionII,
      divisionIII: data.divisionIII,
      divisionIV: data.divisionIV,
      divisionU: data.divisionU,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteEntry = async (school: string) => {
    const record = editingData[school];
    if (!record) return;
    if (!confirm(`Delete PLE results for ${school}?`)) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/p7-ple-results?id=${record.id}`, { method: "DELETE" });
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
      POPN: 0,
      "AGG 4": 0,
      "Div I": 0,
      "Div II": 0,
      "Div III": 0,
      "Div IV": 0,
      "Div U": 0,
    }));

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws["!cols"] = [
      { wch: 20 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 10 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PLE Results Template");
    XLSX.writeFile(wb, `PLE_Results_Template_${selectedYear}.xlsx`);
  };

  const handleImportFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error("No data found in Excel file");
      }

      let savedCount = 0;
      let failedCount = 0;

      for (const row of jsonData as any[]) {
        const school = row.School || row.SCHOOL || row.school;
        if (!school) continue;

        const year = Number.parseInt(row.Year || row.YEAR || selectedYear, 10) || selectedYear;

        const payload = {
          school,
          year,
          popn: Number.parseInt(row.POPN ?? row.Popn ?? row.popn ?? 0, 10) || 0,
          agg4: Number.parseInt(row["AGG 4"] ?? row.AGG4 ?? row.agg4 ?? 0, 10) || 0,
          divisionI: Number.parseInt(row["Div I"] ?? row["DIV I"] ?? row.DivI ?? row.Div1 ?? row.div1 ?? 0, 10) || 0,
          divisionII: Number.parseInt(row["Div II"] ?? row["DIV II"] ?? row.DivII ?? row.Div2 ?? row.div2 ?? 0, 10) || 0,
          divisionIII: Number.parseInt(row["Div III"] ?? row["DIV III"] ?? row.DivIII ?? row.Div3 ?? row.div3 ?? 0, 10) || 0,
          divisionIV: Number.parseInt(row["Div IV"] ?? row["DIV IV"] ?? row.DivIV ?? row.Div4 ?? row.div4 ?? 0, 10) || 0,
          divisionU: Number.parseInt(row["Div U"] ?? row["DIV U"] ?? row.DivU ?? row.DivU ?? row.divu ?? 0, 10) || 0,
        };

        try {
          const response = await fetch("/api/p7-ple-results", {
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
        setError(`Imported ${savedCount} rows, but ${failedCount} failed`);
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
      School: record.school,
      Year: record.year,
      POPN: record.popn,
      "AGG 4": record.agg4,
      "Div I": record.divisionI,
      "Div II": record.divisionII,
      "Div III": record.divisionIII,
      "Div IV": record.divisionIV,
      "Div U": record.divisionU,
      API: record.api,
      Rank: record.rank || "",
      "AGG 4 %": record.popn ? ((record.agg4 / record.popn) * 100).toFixed(1) : "0.0",
      "Div I %": record.popn ? ((record.divisionI / record.popn) * 100).toFixed(1) : "0.0",
      "Div II %": record.popn ? ((record.divisionII / record.popn) * 100).toFixed(1) : "0.0",
      "Div III %": record.popn ? ((record.divisionIII / record.popn) * 100).toFixed(1) : "0.0",
      "Div IV %": record.popn ? ((record.divisionIV / record.popn) * 100).toFixed(1) : "0.0",
      "Div U %": record.popn ? ((record.divisionU / record.popn) * 100).toFixed(1) : "0.0",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `PLE Results ${selectedYear}`);
    XLSX.writeFile(wb, `PLE_Results_${selectedYear}.xlsx`);
  };

  const sortedResults = useMemo(
    () => results.slice().sort((a, b) => a.school.localeCompare(b.school)),
    [results]
  );

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
          <h1 className="text-3xl font-bold text-gray-900">PLE Tracking</h1>
          <p className="text-gray-600 mt-2">
            Capture overall PLE summary by school and year (POPN, AGG 4, divisions, API, rank).
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">PLE data saved successfully.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error: {error}</p>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-48 px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
              >
                Download Template
              </button>
              <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold cursor-pointer transition-colors">
                Import Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportFromExcel}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {fetchLoading && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="ml-3 text-gray-600">Loading results...</p>
            </div>
          </div>
        )}

        {!fetchLoading && schools.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Enter PLE Summary</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">School</label>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select a School --</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.name}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedSchool && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">POPN</label>
                    <input
                      type="number"
                      min="0"
                      value={currentEntryData.popn}
                      onChange={(e) => setCurrentEntryData(prev => ({ ...prev, popn: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full px-3 py-2 text-center border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">AGG 4</label>
                    <input
                      type="number"
                      min="0"
                      value={currentEntryData.agg4}
                      onChange={(e) => setCurrentEntryData(prev => ({ ...prev, agg4: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full px-3 py-2 text-center border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Div I</label>
                    <input
                      type="number"
                      min="0"
                      value={currentEntryData.divisionI}
                      onChange={(e) => setCurrentEntryData(prev => ({ ...prev, divisionI: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full px-3 py-2 text-center border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Div II</label>
                    <input
                      type="number"
                      min="0"
                      value={currentEntryData.divisionII}
                      onChange={(e) => setCurrentEntryData(prev => ({ ...prev, divisionII: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full px-3 py-2 text-center border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Div III</label>
                    <input
                      type="number"
                      min="0"
                      value={currentEntryData.divisionIII}
                      onChange={(e) => setCurrentEntryData(prev => ({ ...prev, divisionIII: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full px-3 py-2 text-center border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Div IV</label>
                    <input
                      type="number"
                      min="0"
                      value={currentEntryData.divisionIV}
                      onChange={(e) => setCurrentEntryData(prev => ({ ...prev, divisionIV: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full px-3 py-2 text-center border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Div U</label>
                    <input
                      type="number"
                      min="0"
                      value={currentEntryData.divisionU}
                      onChange={(e) => setCurrentEntryData(prev => ({ ...prev, divisionU: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full px-3 py-2 text-center border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600">API (auto)</p>
                    <p className="text-lg font-bold text-gray-900">{apiPreview.toFixed(1)}</p>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600">AGG 4 %</p>
                    <p className="text-lg font-bold text-gray-900">
                      {percentOfPopn(currentEntryData.agg4, currentEntryData.popn).toFixed(1)}%
                    </p>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600">Div I %</p>
                    <p className="text-lg font-bold text-gray-900">
                      {percentOfPopn(currentEntryData.divisionI, currentEntryData.popn).toFixed(1)}%
                    </p>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600">Div II %</p>
                    <p className="text-lg font-bold text-gray-900">
                      {percentOfPopn(currentEntryData.divisionII, currentEntryData.popn).toFixed(1)}%
                    </p>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600">Div III %</p>
                    <p className="text-lg font-bold text-gray-900">
                      {percentOfPopn(currentEntryData.divisionIII, currentEntryData.popn).toFixed(1)}%
                    </p>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600">Div IV %</p>
                    <p className="text-lg font-bold text-gray-900">
                      {percentOfPopn(currentEntryData.divisionIV, currentEntryData.popn).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {totalDivisions > currentEntryData.popn && currentEntryData.popn > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <p className="text-yellow-800 text-sm font-medium">
                      Sum of divisions ({totalDivisions}) exceeds POPN ({currentEntryData.popn})
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveEntry}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold transition-colors"
                  >
                    {loading ? "Saving..." : "Save Results"}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSchool("");
                      setCurrentEntryData({
                        popn: 0,
                        agg4: 0,
                        divisionI: 0,
                        divisionII: 0,
                        divisionIII: 0,
                        divisionIV: 0,
                        divisionU: 0,
                      });
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {!fetchLoading && sortedResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-8">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-emerald-600 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">PLE Results - {selectedYear}</h2>
              <button
                onClick={handleExportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-semibold transition-colors"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Export to Excel
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">School</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">POPN</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">AGG 4</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Div I</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Div II</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Div III</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Div IV</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Div U</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">API</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Rank</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">AGG 4 %</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Div I %</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Div II %</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Div III %</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Div IV %</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Div U %</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedResults.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{result.school}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{result.popn}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{result.agg4}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{result.divisionI}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{result.divisionII}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{result.divisionIII}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{result.divisionIV}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{result.divisionU}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{result.api.toFixed(1)}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{result.rank || "-"}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">
                        {result.popn ? ((result.agg4 / result.popn) * 100).toFixed(1) : "0.0"}%
                      </td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">
                        {result.popn ? ((result.divisionI / result.popn) * 100).toFixed(1) : "0.0"}%
                      </td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">
                        {result.popn ? ((result.divisionII / result.popn) * 100).toFixed(1) : "0.0"}%
                      </td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">
                        {result.popn ? ((result.divisionIII / result.popn) * 100).toFixed(1) : "0.0"}%
                      </td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">
                        {result.popn ? ((result.divisionIV / result.popn) * 100).toFixed(1) : "0.0"}%
                      </td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">
                        {result.popn ? ((result.divisionU / result.popn) * 100).toFixed(1) : "0.0"}%
                      </td>
                      <td className="px-4 py-3 text-center border-l border-gray-300">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditEntry(result.school)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <PencilSquareIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(result.school)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
