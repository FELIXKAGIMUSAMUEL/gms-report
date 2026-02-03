"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeftIcon, CheckCircleIcon, TrashIcon } from "@heroicons/react/24/outline";

interface P7CohortData {
  id: string;
  year: number;
  p6Promotion: number;
  prep1: number;
  prep2: number;
  prep3: number;
  prep4: number;
  prep5: number;
  prep6: number;
  prep7: number;
  prep8: number;
  prep9: number;
  ple: number;
}

const currentYear = new Date().getFullYear();

export default function P7EntryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [formData, setFormData] = useState<Partial<P7CohortData>>({});

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedRecords, setSavedRecords] = useState<P7CohortData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingSaved, setLoadingSaved] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchSavedRecords = async () => {
    setLoadingSaved(true);
    try {
      const res = await fetch("/api/p7-prep");
      if (res.ok) {
        const data = await res.json();
        setSavedRecords(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching saved records:", err);
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchSavedRecords();
    }
  }, [status]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === "" ? undefined : Number.parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const toNum = (v: any) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
      const payload = {
        year: selectedYear,
        p6Promotion: toNum(formData.p6Promotion),
        prep1: toNum(formData.prep1),
        prep2: toNum(formData.prep2),
        prep3: toNum(formData.prep3),
        prep4: toNum(formData.prep4),
        prep5: toNum(formData.prep5),
        prep6: toNum(formData.prep6),
        prep7: toNum(formData.prep7),
        prep8: toNum(formData.prep8),
        prep9: toNum(formData.prep9),
        ple: toNum(formData.ple),
      };

      let response;
      if (editingId) {
        response = await fetch(`/api/p7-prep?id=${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("/api/p7-prep", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save P7 data");
      }

      setSuccess(true);
      await fetchSavedRecords();
      setEditingId(null);
      setFormData({});
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: P7CohortData) => {
    setEditingId(record.id);
    setSelectedYear(record.year);
    setFormData({
      p6Promotion: record.p6Promotion,
      prep1: record.prep1,
      prep2: record.prep2,
      prep3: record.prep3,
      prep4: record.prep4,
      prep5: record.prep5,
      prep6: record.prep6,
      prep7: record.prep7,
      prep8: record.prep8,
      prep9: record.prep9,
      ple: record.ple,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`/api/p7-prep?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchSavedRecords();
        if (editingId === id) {
          setEditingId(null);
          setFormData({});
        }
      }
    } catch (err) {
      console.error("Error deleting record:", err);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleExport = () => {
    if (!savedRecords.length) return;
    const headers = [
      "Year",
      "P6 Promotion",
      "Prep 1",
      "Prep 2",
      "Prep 3",
      "Prep 4",
      "Prep 5",
      "Prep 6",
      "Prep 7",
      "Prep 8",
      "Prep 9",
      "PLE",
      "Avg",
    ];
    const rows = savedRecords.map((record) => {
      const values = [
        record.year,
        record.p6Promotion,
        record.prep1,
        record.prep2,
        record.prep3,
        record.prep4,
        record.prep5,
        record.prep6,
        record.prep7,
        record.prep8,
        record.prep9,
        record.ple,
      ];
      const avg = Math.round(values.slice(1).reduce((acc, val) => acc + val, 0) / 11);
      return [...values, avg].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `p7-prep-records-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const prepClasses = [
    { key: "p6Promotion", label: "P6 Promotion" },
    { key: "prep1", label: "Prep 1" },
    { key: "prep2", label: "Prep 2" },
    { key: "prep3", label: "Prep 3" },
    { key: "prep4", label: "Prep 4" },
    { key: "prep5", label: "Prep 5" },
    { key: "prep6", label: "Prep 6" },
    { key: "prep7", label: "Prep 7" },
    { key: "prep8", label: "Prep 8" },
    { key: "prep9", label: "Prep 9" },
    { key: "ple", label: "PLE" },
  ];

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
          <h1 className="text-3xl font-bold text-gray-900">P.7 Prep Exams Entry</h1>
          <p className="text-gray-600 mt-2">Track class year performance across prep exams (percent scores).</p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">P7 data saved successfully! Redirecting...</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Year Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Year Selection</h3>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
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
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
          
          {editingId && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-semibold text-amber-800">Editing record for year {selectedYear}</p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Prep Exam Performance (%)</h3>
            <p className="text-sm text-gray-600 mb-4">Enter the percentage score achieved at each prep stage for the selected year:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {prepClasses.map(prepClass => (
                <div key={prepClass.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{prepClass.label}</label>
                  <input
                    type="number"
                    name={prepClass.key}
                    min="0"
                    max="100"
                    value={(formData as any)[prepClass.key] ?? ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                    placeholder="Enter score"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
            >
              {loading ? "Saving..." : editingId ? "Update P7 Data" : "Save P7 Data"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-6 py-3 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 font-medium transition-colors"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Back
            </button>
          </div>
        </form>

        {/* Saved Records List */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Saved P.7 Prep Records</h3>
            <div className="flex items-center gap-3">
              {loadingSaved && <span className="text-sm text-gray-500">Loading...</span>}
              <button
                type="button"
                onClick={handleExport}
                disabled={savedRecords.length === 0}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export CSV
              </button>
            </div>
          </div>
          {savedRecords.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No saved records yet. Create one above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Year</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-900">Promotion</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-900">Prep 1</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-900">Prep 2</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-900">Prep 3</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-900">Prep 4</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-900">Prep 5</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-900">Prep 6</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-900">Prep 7</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-900">Prep 8</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-900">Prep 9</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-900">PLE</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-900">Avg</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {savedRecords.map((record) => {
                    const avg = Math.round(
                      (record.p6Promotion + record.prep1 + record.prep2 + record.prep3 + record.prep4 +
                       record.prep5 + record.prep6 + record.prep7 + record.prep8 + record.prep9 + record.ple) / 11
                    );
                    return (
                      <tr key={record.id} className={`hover:bg-gray-50 ${editingId === record.id ? 'bg-amber-50' : ''}`}>
                        <td className="px-4 py-3 font-semibold text-gray-900">{record.year}</td>
                        <td className="px-3 py-3 text-gray-700">{record.p6Promotion}%</td>
                        <td className="px-3 py-3 text-gray-700">{record.prep1}%</td>
                        <td className="px-3 py-3 text-gray-700">{record.prep2}%</td>
                        <td className="px-3 py-3 text-gray-700">{record.prep3}%</td>
                        <td className="px-3 py-3 text-gray-700">{record.prep4}%</td>
                        <td className="px-3 py-3 text-gray-700">{record.prep5}%</td>
                        <td className="px-3 py-3 text-gray-700">{record.prep6}%</td>
                        <td className="px-3 py-3 text-gray-700">{record.prep7}%</td>
                        <td className="px-3 py-3 text-gray-700">{record.prep8}%</td>
                        <td className="px-3 py-3 text-gray-700">{record.prep9}%</td>
                        <td className="px-3 py-3 text-gray-700">{record.ple}%</td>
                        <td className="px-3 py-3 font-semibold text-blue-600">{avg}%</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(record)}
                              className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="px-3 py-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
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
          )}

          {/* Overall Performance Summary */}
          {savedRecords.length > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Overall prep performance (avg % across all saved data):</h4>
              <p className="text-3xl font-bold text-blue-600">
                {(() => {
                  const yearlyAverages = savedRecords.map(record => {
                    const values = [
                      record.p6Promotion, record.prep1, record.prep2, record.prep3,
                      record.prep4, record.prep5, record.prep6, record.prep7,
                      record.prep8, record.prep9, record.ple
                    ];
                    const sum = values.reduce((acc, val) => acc + val, 0);
                    return sum / values.length;
                  });
                  const overall = yearlyAverages.length > 0
                    ? Math.round(yearlyAverages.reduce((acc, val) => acc + val, 0) / yearlyAverages.length)
                    : 0;
                  return overall;
                })()}%
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Based on {savedRecords.length} year(s) of saved prep exam data. Note: Prep exams are entered progressively throughout the year as they are completed.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
