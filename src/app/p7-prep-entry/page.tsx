"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeftIcon, CheckCircleIcon, TrashIcon, ArrowDownTrayIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";

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

interface School {
  id: string;
  name: string;
}

const PREP_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const currentYear = new Date().getFullYear();

export default function P7PrepEntryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [schools, setSchools] = useState<School[]>([]);
  const [results, setResults] = useState<P7PrepResult[]>([]);
  const [allResults, setAllResults] = useState<P7PrepResult[]>([]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Current entry being edited
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedPrep, setSelectedPrep] = useState<number>(1);
  const [currentEntryData, setCurrentEntryData] = useState({
    enrollment: 0,
    divisionI: 0,
    divisionII: 0,
    divisionIII: 0,
    divisionIV: 0,
    averageScore: 0,
  });

  // Local editing state: { "SCHOOL:PREP": data }
  const [editingData, setEditingData] = useState<Record<string, P7PrepResult>>({});

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
      const params = new URLSearchParams({ year: String(selectedYear), term: String(selectedTerm) });
      const response = await fetch(`/api/p7-prep-results?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setResults(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch results:", err);
    } finally {
      setFetchLoading(false);
    }
  }, [selectedYear, selectedTerm]);

  const fetchAllResults = useCallback(async () => {
    try {
      const response = await fetch("/api/p7-prep-results");
      if (response.ok) {
        const data = await response.json();
        setAllResults(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch all results:", err);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSchools();
      fetchResults();
      fetchAllResults();
    }
  }, [status, fetchSchools, fetchResults, fetchAllResults]);

  // Initialize editing data when results load
  useEffect(() => {
    const initialData: Record<string, P7PrepResult> = {};
    results.forEach(result => {
      const key = `${result.school}:${result.prepNumber}`;
      initialData[key] = result;
    });
    setEditingData(initialData);
  }, [results]);

  const handleSaveEntry = async () => {
    if (!selectedSchool) {
      setError("Please select a school");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/p7-prep-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school: selectedSchool,
          prepNumber: selectedPrep,
          term: selectedTerm,
          year: selectedYear,
          enrollment: currentEntryData.enrollment,
          divisionI: currentEntryData.divisionI,
          divisionII: currentEntryData.divisionII,
          divisionIII: currentEntryData.divisionIII,
          divisionIV: currentEntryData.divisionIV,
          averageScore: currentEntryData.averageScore,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save data");
      }

      const result = await response.json();

      // Update editing data
      const key = `${selectedSchool}:${selectedPrep}`;
      setEditingData(prev => ({
        ...prev,
        [key]: result
      }));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Clear current entry
      setCurrentEntryData({
        enrollment: 0,
        divisionI: 0,
        divisionII: 0,
        divisionIII: 0,
        divisionIV: 0,
        averageScore: 0,
      });
      setSelectedSchool("");
      setSelectedPrep(1);
      
      // Refresh data
      await fetchResults();
      await fetchAllResults();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (school: string, prepNumber: number) => {
    if (!confirm(`Delete Prep ${prepNumber} results for ${school}?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Find the record to get its ID
      const record = results.find(r => r.school === school && r.prepNumber === prepNumber);
      if (!record) {
        throw new Error("Record not found");
      }

      const response = await fetch(`/api/p7-prep-results?id=${record.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete record");
      }

      // Update local state
      const key = `${school}:${prepNumber}`;
      setEditingData(prev => {
        const newData = { ...prev };
        delete newData[key];
        return newData;
      });

      // Refresh data
      await fetchResults();
      await fetchAllResults();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete data");
    } finally {
      setLoading(false);
    }
  };

  const handleEditEntry = (school: string, prepNumber: number) => {
    const key = `${school}:${prepNumber}`;
    const data = editingData[key];
    
    setSelectedSchool(school);
    setSelectedPrep(prepNumber);
    setCurrentEntryData({
      enrollment: data.enrollment,
      divisionI: data.divisionI,
      divisionII: data.divisionII,
      divisionIII: data.divisionIII,
      divisionIV: data.divisionIV,
      averageScore: data.averageScore,
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadTemplate = () => {
    const templateData = PREP_NUMBERS.map(prep => ({
      School: "SAMPLE_SCHOOL",
      Prep: prep,
      Enrollment: 0,
      "Division I": 0,
      "Division II": 0,
      "Division III": 0,
      "Division IV": 0,
      "Average Score": 0,
    }));

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 20 },
      { wch: 6 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "P.7 Prep Template");
    XLSX.writeFile(wb, "P7_Prep_Import_Template.xlsx");
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
      for (const row: any of jsonData) {
        const school = row.School || row.SCHOOL || row.school;
        const prep = row.Prep || row.PREP || row.prep;

        if (!school || prep === undefined) continue;

        const response = await fetch("/api/p7-prep-results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            school,
            prepNumber: parseInt(prep),
            term: selectedTerm,
            year: selectedYear,
            enrollment: parseInt(row.Enrollment || 0),
            divisionI: parseInt(row["Division I"] || 0),
            divisionII: parseInt(row["Division II"] || 0),
            divisionIII: parseInt(row["Division III"] || 0),
            divisionIV: parseInt(row["Division IV"] || 0),
            averageScore: parseFloat(row["Average Score"] || 0),
          }),
        });

        if (response.ok) {
          savedCount++;
        }
      }

      await fetchResults();
      await fetchAllResults();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to import Excel file");
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleExportToExcel = () => {
    if (Object.keys(editingData).length === 0) {
      setError("No data to export");
      return;
    }

    const exportData = Object.values(editingData).map(result => ({
      School: result.school,
      Prep: result.prepNumber,
      Enrollment: result.enrollment,
      "Division I": result.divisionI,
      "Division II": result.divisionII,
      "Division III": result.divisionIII,
      "Division IV": result.divisionIV,
      "Average Score": result.averageScore.toFixed(1),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [
      { wch: 20 },
      { wch: 6 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `P7 Prep T${selectedTerm} ${selectedYear}`);
    XLSX.writeFile(wb, `P7_Prep_Results_Term${selectedTerm}_${selectedYear}.xlsx`);
  };

  // Calculate division percentages
  const getDivisionPercentage = (division: number, total: number) => {
    if (total === 0) return 0;
    return ((division / total) * 100).toFixed(1);
  };

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
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">P.7 Prep Exam Results Tracking</h1>
          <p className="text-gray-600 mt-2">Enter division results and average scores for each prep exam</p>
        </div>

        {/* Import Section */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-200">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">📥 Quick Import from Excel</h3>
            <p className="text-sm text-gray-600 mb-3">
              Import P.7 prep results for multiple schools at once.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Download Template
              </button>
              <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors cursor-pointer shadow-sm">
                <ArrowDownTrayIcon className="w-5 h-5 rotate-180" />
                Import Excel File
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

        {/* Success & Error Alerts */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">Data saved successfully!</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Period Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Term</label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(Number(e.target.value))}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3].map(t => (
                  <option key={t} value={t}>Term {t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {fetchLoading && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="ml-3 text-gray-600">Loading results...</p>
            </div>
          </div>
        )}

        {/* Entry Form */}
        {!fetchLoading && schools.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Enter P.7 Prep Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">School</label>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select a School --</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.name}>{school.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Prep Exam</label>
                <select
                  value={selectedPrep}
                  onChange={(e) => setSelectedPrep(Number(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PREP_NUMBERS.map(p => (
                    <option key={p} value={p}>Prep {p}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedSchool && (
              <>
                <h3 className="text-md font-semibold text-gray-900 mb-4">
                  Results for {selectedSchool} - Prep {selectedPrep}
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Enrollment</label>
                    <input
                      type="number"
                      min="0"
                      value={currentEntryData.enrollment}
                      onChange={(e) => setCurrentEntryData(prev => ({ ...prev, enrollment: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 text-center border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Div I</label>
                    <input
                      type="number"
                      min="0"
                      value={currentEntryData.divisionI}
                      onChange={(e) => setCurrentEntryData(prev => ({ ...prev, divisionI: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 text-center border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Div II</label>
                    <input
                      type="number"
                      min="0"
                      value={currentEntryData.divisionII}
                      onChange={(e) => setCurrentEntryData(prev => ({ ...prev, divisionII: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 text-center border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Div III</label>
                    <input
                      type="number"
                      min="0"
                      value={currentEntryData.divisionIII}
                      onChange={(e) => setCurrentEntryData(prev => ({ ...prev, divisionIII: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 text-center border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Div IV</label>
                    <input
                      type="number"
                      min="0"
                      value={currentEntryData.divisionIV}
                      onChange={(e) => setCurrentEntryData(prev => ({ ...prev, divisionIV: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 text-center border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Avg Score (0-100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={currentEntryData.averageScore}
                      onChange={(e) => setCurrentEntryData(prev => ({ ...prev, averageScore: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 text-center border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold bg-white"
                    />
                  </div>
                </div>

                {/* Validation message */}
                {currentEntryData.divisionI + currentEntryData.divisionII + currentEntryData.divisionIII + currentEntryData.divisionIV > currentEntryData.enrollment && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <p className="text-yellow-800 text-sm font-medium">
                      ⚠️ Sum of divisions ({currentEntryData.divisionI + currentEntryData.divisionII + currentEntryData.divisionIII + currentEntryData.divisionIV}) exceeds enrollment ({currentEntryData.enrollment})
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
                        enrollment: 0,
                        divisionI: 0,
                        divisionII: 0,
                        divisionIII: 0,
                        divisionIV: 0,
                        averageScore: 0,
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

        {/* Results Table */}
        {!fetchLoading && Object.keys(editingData).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">
                Entered Results - Term {selectedTerm}, {selectedYear}
              </h2>
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
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Prep</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Enrollment</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Div I</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Div II</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Div III</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Div IV</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Avg Score</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.values(editingData).sort((a, b) => {
                    if (a.school !== b.school) return a.school.localeCompare(b.school);
                    return a.prepNumber - b.prepNumber;
                  }).map(result => (
                    <tr key={`${result.school}-${result.prepNumber}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{result.school}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{result.prepNumber}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{result.enrollment}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{result.divisionI}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{result.divisionII}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{result.divisionIII}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">{result.divisionIV}</td>
                      <td className="px-3 py-3 text-center border-l border-gray-300 text-gray-700 font-semibold">{result.averageScore.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center border-l border-gray-300">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditEntry(result.school, result.prepNumber)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <PencilSquareIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(result.school, result.prepNumber)}
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

        {/* Summary Statistics */}
        {!fetchLoading && Object.keys(editingData).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-600 text-sm font-medium mb-2">Results Entered</p>
              <p className="text-3xl font-bold text-gray-900">{Object.keys(editingData).length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-600 text-sm font-medium mb-2">Schools</p>
              <p className="text-3xl font-bold text-gray-900">
                {new Set(Object.values(editingData).map(r => r.school)).size}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-600 text-sm font-medium mb-2">Avg Score (Overall)</p>
              <p className="text-3xl font-bold text-gray-900">
                {(
                  Object.values(editingData).reduce((sum, r) => sum + r.averageScore, 0) /
                  Object.keys(editingData).length
                ).toFixed(1)}
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
