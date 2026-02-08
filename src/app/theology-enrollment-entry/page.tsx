"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeftIcon, CheckCircleIcon, TrashIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ArrowDownTrayIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";

interface TheologyEnrollment {
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

const CLASSES = ["KG1", "KG2", "KG3", "P.1", "P.2", "P.3", "P.4", "P.5", "P.6", "P.7"];
const currentYear = new Date().getFullYear();
const START_YEAR = 2023;
const availableYears = Array.from({ length: currentYear - START_YEAR + 1 }, (_, i) => currentYear - i);

export default function TheologyEnrollmentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [schools, setSchools] = useState<School[]>([]);
  const [enrollments, setEnrollments] = useState<TheologyEnrollment[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<TheologyEnrollment[]>([]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Current school being edited
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [currentSchoolData, setCurrentSchoolData] = useState<Record<string, number>>({});

  // Local editing state
  const [editingData, setEditingData] = useState<Record<string, Record<string, number>>>({});

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

  const fetchEnrollments = useCallback(async () => {
    try {
      setFetchLoading(true);
      const params = new URLSearchParams({ year: String(selectedYear), term: String(selectedTerm) });
      const response = await fetch(`/api/theology-enrollment?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setEnrollments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch enrollments:", err);
    } finally {
      setFetchLoading(false);
    }
  }, [selectedYear, selectedTerm]);

  const fetchAllEnrollments = useCallback(async () => {
    try {
      const response = await fetch("/api/theology-enrollment");
      if (response.ok) {
        const data = await response.json();
        setAllEnrollments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch all enrollments:", err);
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
      fetchEnrollments();
      fetchAllEnrollments();
    }
  }, [status, fetchSchools, fetchEnrollments, fetchAllEnrollments]);

  // Initialize editing data when enrollments load - only include schools with actual data
  useEffect(() => {
    const initialData: Record<string, Record<string, number>> = {};
    schools.forEach(school => {
      const schoolEnrollments = enrollments.filter(e => e.school === school.name);
      // Only add school if it has enrollment data
      if (schoolEnrollments.length > 0 && schoolEnrollments.some(e => e.count > 0)) {
        initialData[school.name] = {};
        CLASSES.forEach(cls => {
          const enrollment = schoolEnrollments.find(e => e.class === cls);
          initialData[school.name][cls] = enrollment?.count || 0;
        });
      }
    });
    setEditingData(initialData);
  }, [enrollments, schools]);

  const handleSaveAll = async () => {
    setLoading(true);
    setError(null);

    try {
      for (const schoolName of Object.keys(editingData)) {
        for (const className of Object.keys(editingData[schoolName])) {
          const count = editingData[schoolName][className];
          const response = await fetch("/api/theology-enrollment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              school: schoolName,
              class: className,
              term: selectedTerm,
              year: selectedYear,
              count,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to save ${schoolName} ${className}`);
          }
        }
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await fetchEnrollments();
      await fetchAllEnrollments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save enrollments");
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = (schoolName: string, className: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setCurrentSchoolData(prev => ({
      ...prev,
      [className]: numValue,
    }));
  };

  const handleSaveSchool = async () => {
    if (!selectedSchool) {
      setError("Please select a school");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      for (const className of CLASSES) {
        const count = currentSchoolData[className] || 0;
        const response = await fetch("/api/theology-enrollment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            school: selectedSchool,
            class: className,
            term: selectedTerm,
            year: selectedYear,
            count,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to save data for ${className}`);
        }
      }

      // Update the editingData to include this school
      setEditingData(prev => ({
        ...prev,
        [selectedSchool]: { ...currentSchoolData }
      }));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Clear current school data
      setCurrentSchoolData({});
      setSelectedSchool("");
      
      // Refresh enrollments
      await fetchEnrollments();
      await fetchAllEnrollments();
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save enrollment data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchool = (schoolName: string) => {
    setEditingData(prev => {
      const newData = { ...prev };
      delete newData[schoolName];
      return newData;
    });
  };

  const handleEditSchool = (schoolName: string) => {
    // Load the school's data into the form
    setSelectedSchool(schoolName);
    setCurrentSchoolData(editingData[schoolName] || {});
    
    // Scroll to the top to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportToExcel = () => {
    if (Object.keys(editingData).length === 0) {
      setError("No data to export");
      return;
    }

    // Prepare data for export
    const exportData = Object.keys(editingData).map(schoolName => {
      const schoolData = editingData[schoolName];
      const total = CLASSES.reduce((sum, cls) => sum + (schoolData[cls] || 0), 0);
      
      return {
        School: schoolName,
        KG1: schoolData['KG1'] || 0,
        KG2: schoolData['KG2'] || 0,
        KG3: schoolData['KG3'] || 0,
        'P.1': schoolData['P.1'] || 0,
        'P.2': schoolData['P.2'] || 0,
        'P.3': schoolData['P.3'] || 0,
        'P.4': schoolData['P.4'] || 0,
        'P.5': schoolData['P.5'] || 0,
        'P.6': schoolData['P.6'] || 0,
        'P.7': schoolData['P.7'] || 0,
        Total: total,
      };
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // School
      ...CLASSES.map(() => ({ wch: 8 })), // Class columns
      { wch: 10 }, // Total
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Term ${selectedTerm} ${selectedYear}`);

    // Generate filename
    const filename = `Theology_Enrollment_Term${selectedTerm}_${selectedYear}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  };

  // Calculate totals and variances
  const schoolAnalysis = useMemo(() => {
    const analysis: Record<string, {
      currentTotal: number;
      previousTotal: number;
      variance: number;
      variancePercent: number;
      byClass: Record<string, { current: number; previous: number; variance: number }>;
    }> = {};

    schools.forEach(school => {
      const current = editingData[school.name] || {};
      const currentTotal = Object.values(current).reduce((sum, val) => sum + (val || 0), 0);

      // Find previous term data for variance calculation
      let previousTotal = 0;
      const prevTerm = selectedTerm === 1 ? 3 : selectedTerm - 1;
      const prevYear = selectedTerm === 1 ? selectedYear - 1 : selectedYear;

      allEnrollments.forEach(e => {
        if (
          e.school === school.name &&
          e.term === prevTerm &&
          e.year === prevYear
        ) {
          previousTotal += e.count;
        }
      });

      const variance = currentTotal - previousTotal;
      const variancePercent = previousTotal > 0 ? (variance / previousTotal) * 100 : 0;

      // Class-level variance
      const byClass: Record<string, { current: number; previous: number; variance: number }> = {};
      CLASSES.forEach(cls => {
        const currentCount = current[cls] || 0;
        const previousCount = allEnrollments.find(
          e => e.school === school.name && e.class === cls && e.term === prevTerm && e.year === prevYear
        )?.count || 0;

        byClass[cls] = {
          current: currentCount,
          previous: previousCount,
          variance: currentCount - previousCount,
        };
      });

      analysis[school.name] = {
        currentTotal,
        previousTotal,
        variance,
        variancePercent,
        byClass,
      };
    });

    return analysis;
  }, [editingData, schools, allEnrollments, selectedTerm, selectedYear]);

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  const showTable = schools.length > 0;

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
          <h1 className="text-3xl font-bold text-gray-900">Theology Enrollment Tracking</h1>
          <p className="text-gray-600 mt-2">Enter enrollment numbers for each school by class and term</p>
        </div>

        {/* Success & Error Alerts */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">Enrollment data saved successfully!</p>
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
                {availableYears.map(y => (
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
              <p className="ml-3 text-gray-600">Loading enrollment data...</p>
            </div>
          </div>
        )}

        {/* No Schools Warning */}
        {!fetchLoading && !showTable && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800 font-semibold">No schools found!</p>
            <p className="text-yellow-700 mt-2">Please make sure schools are added to the system first.</p>
          </div>
        )}

        {/* School Selection and Entry Form */}
        {!fetchLoading && showTable && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Select School to Enter Data</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">School</label>
                <select
                  value={selectedSchool}
                  onChange={(e) => {
                    setSelectedSchool(e.target.value);
                    // Load existing data if available
                    if (editingData[e.target.value]) {
                      setCurrentSchoolData(editingData[e.target.value]);
                    } else {
                      setCurrentSchoolData({});
                    }
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select a School --</option>
                  {schools.filter(s => !editingData[s.name] || s.name === selectedSchool).map(school => (
                    <option key={school.id} value={school.name}>{school.name}</option>
                  ))}
                </select>
              </div>

              {selectedSchool && (
                <>
                  <h3 className="text-md font-semibold text-gray-900 mb-3">
                    {editingData[selectedSchool] ? 'Edit' : 'Enter'} Enrollment for {selectedSchool} - Term {selectedTerm}, {selectedYear}
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                    {CLASSES.map(cls => (
                      <div key={cls}>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">{cls}</label>
                        <input
                          type="number"
                          min="0"
                          value={currentSchoolData[cls] || ''}
                          onChange={(e) => handleCellChange(selectedSchool, cls, e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 text-center border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold bg-white placeholder:text-gray-400"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveSchool}
                      disabled={loading}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold transition-colors"
                    >
                      {loading ? "Saving..." : editingData[selectedSchool] ? "Update School Data" : "Save School Data"}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSchool("");
                        setCurrentSchoolData({});
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Saved Schools List */}
            {Object.keys(editingData).length > 0 && Object.values(editingData).some(schoolData => 
              CLASSES.some(cls => (schoolData[cls] || 0) > 0)
            ) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-white">
                    Entered Schools - Term {selectedTerm}, {selectedYear}
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
                        {CLASSES.map(cls => (
                          <th key={cls} className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">
                            {cls}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center font-semibold text-gray-700 border-l border-gray-300 bg-blue-50">Total</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.keys(editingData).map(schoolName => {
                        const schoolData = editingData[schoolName];
                        const total = CLASSES.reduce((sum, cls) => sum + (schoolData[cls] || 0), 0);
                        
                        return (
                          <tr key={schoolName} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-semibold text-gray-900">{schoolName}</td>
                            {CLASSES.map(cls => (
                              <td key={cls} className="px-3 py-3 text-center border-l border-gray-300 text-gray-700">
                                {schoolData[cls] || 0}
                              </td>
                            ))}
                            <td className="px-4 py-3 text-center font-bold bg-blue-50 border-l border-gray-300 text-gray-900 text-lg">
                              {total}
                            </td>
                            <td className="px-4 py-3 text-center border-l border-gray-300">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditSchool(schoolName)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Edit"
                                >
                                  <PencilSquareIcon className="w-5 h-5 inline" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSchool(schoolName)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Remove"
                                >
                                  <TrashIcon className="w-5 h-5 inline" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Enrollment Entry Table */}
        {false && !fetchLoading && showTable && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600">
            <h2 className="text-lg font-bold text-white">
              Theology Enrollment - Term {selectedTerm}, {selectedYear}
            </h2>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">School</th>
                {CLASSES.map(cls => (
                  <th key={cls} className="px-3 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">
                    {cls}
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-semibold text-gray-700 border-l border-gray-300 bg-blue-50">Total</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700 border-l border-gray-300">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {schools.map(school => {
                const analysis = schoolAnalysis[school.name];
                const currentTotal = analysis?.currentTotal || 0;
                const variance = analysis?.variance || 0;
                const variancePercent = analysis?.variancePercent || 0;

                return (
                  <tr key={school.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{school.name}</td>
                    {CLASSES.map(cls => (
                      <td key={cls} className="px-3 py-3 text-center border-l border-gray-300">
                        <input
                          type="number"
                          min="0"
                          value={editingData[school.name]?.[cls] || ''}
                          onChange={(e) => handleCellChange(school.name, cls, e.target.value)}
                          placeholder="0"
                          className="w-16 px-2 py-1 text-center border-2 border-gray-400 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold bg-white placeholder:text-gray-400"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center font-bold bg-blue-50 border-l border-gray-300">
                      {currentTotal}
                    </td>
                    <td className="px-4 py-3 text-center border-l border-gray-300">
                      {variance !== 0 && (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            {variance > 0 ? (
                              <>
                                <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                                <span className="text-green-600 font-semibold">+{variance}</span>
                              </>
                            ) : (
                              <>
                                <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />
                                <span className="text-red-600 font-semibold">{variance}</span>
                              </>
                            )}
                          </div>
                          <span className="text-xs text-gray-600">
                            {variancePercent > 0 ? '+' : ''}{variancePercent.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}

        {/* Summary Statistics */}
        {!fetchLoading && Object.keys(editingData).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm font-medium mb-2">Schools Entered</p>
            <p className="text-3xl font-bold text-gray-900">{Object.keys(editingData).length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm font-medium mb-2">Total Theology Students</p>
            <p className="text-3xl font-bold text-gray-900">
              {Object.values(editingData).reduce((sum, schoolData) => 
                sum + CLASSES.reduce((s, cls) => s + (schoolData[cls] || 0), 0), 0
              )}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm font-medium mb-2">Remaining Schools</p>
            <p className="text-3xl font-bold text-gray-900">
              {schools.length - Object.keys(editingData).length}
            </p>
          </div>
        </div>
        )}

        {/* Save Button */}
        {false && !fetchLoading && showTable && (
        <div className="flex gap-2">
          <button
            onClick={handleSaveAll}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold transition-colors"
          >
            {loading ? "Saving..." : "Save All Enrollment Data"}
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
        )}
      </div>
    </DashboardLayout>
  );
}
