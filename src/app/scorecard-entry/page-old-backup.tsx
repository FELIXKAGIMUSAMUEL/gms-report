"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeftIcon, CheckCircleIcon, PlusIcon } from "@heroicons/react/24/outline";

interface WeeklyScorecard {
  id: string;
  schoolId: string;
  schoolName: string;
  term: number;
  week: number;
  year: number;
  academicScore: number;
  financeScore: number;
  qualityScore: number;
  technologyScore: number;
  theologyScore: number;
}

const currentYear = new Date().getFullYear();

export default function ScorecardEntryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(1);

  const [scorecards, setScorecards] = useState<WeeklyScorecard[]>([]);
  const [allScorecards, setAllScorecards] = useState<WeeklyScorecard[]>([]);
  const [newScorecard, setNewScorecard] = useState<Partial<WeeklyScorecard>>({
    schoolId: "",
    schoolName: "",
    academicScore: 0,
    financeScore: 0,
    qualityScore: 0,
    technologyScore: 0,
    theologyScore: 0,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  const fetchScorecards = useCallback(async () => {
    try {
      setFetchLoading(true);
      const response = await fetch("/api/scorecard");
      if (response.ok) {
        const data = await response.json();
        const all = data.data || [];
        setAllScorecards(all);
        const filtered = all.filter((sc: WeeklyScorecard) =>
          sc.year === selectedYear && sc.term === selectedTerm && sc.week === selectedWeek
        );
        setScorecards(filtered);
      }
    } catch (err) {
      console.error("Failed to fetch scorecards:", err);
    } finally {
      setFetchLoading(false);
    }
  }, [selectedYear, selectedTerm, selectedWeek]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch existing scorecards
  useEffect(() => {
    if (status === "authenticated") {
      fetchScorecards();
    }
  }, [status, fetchScorecards]);

  const handleAddScorecard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!newScorecard.schoolId || !newScorecard.schoolName) {
        throw new Error("School ID and name are required");
      }

      // Validate all scores are 0-100
      const scores = [
        newScorecard.academicScore,
        newScorecard.financeScore,
        newScorecard.qualityScore,
        newScorecard.technologyScore,
        newScorecard.theologyScore,
      ];

      if (scores.some(score => score! < 0 || score! > 100)) {
        throw new Error("All scores must be between 0 and 100");
      }

      const payload = {
        ...newScorecard,
        week: selectedWeek,
        year: selectedYear,
        term: selectedTerm,
      };

      const response = await fetch("/api/scorecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save scorecard");
      }

      setSuccess(true);
      setNewScorecard({
        schoolId: "",
        schoolName: "",
        academicScore: 0,
        financeScore: 0,
        qualityScore: 0,
        technologyScore: 0,
        theologyScore: 0,
      });

      setTimeout(() => setSuccess(false), 3000);
      await fetchScorecards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save scorecard");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScorecard = async (scorecardId: string) => {
    try {
      const response = await fetch(`/api/scorecard/${scorecardId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete scorecard");
      }

      await fetchScorecards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete scorecard");
    }
  };

  if (status === "loading" || fetchLoading) {
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">School Scorecard Entry</h1>
          <p className="text-gray-600 mt-2">Record weekly performance scores for each school</p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">Scorecard saved successfully!</p>
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

        {/* Add New Scorecard Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add School Scorecard</h3>
          <form onSubmit={handleAddScorecard} className="space-y-6">
            
            {/* School Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School ID</label>
                <input
                  type="text"
                  value={newScorecard.schoolId || ""}
                  onChange={(e) => setNewScorecard(prev => ({ ...prev, schoolId: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                  placeholder="e.g., SCH001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
                <input
                  type="text"
                  value={newScorecard.schoolName || ""}
                  onChange={(e) => setNewScorecard(prev => ({ ...prev, schoolName: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                  placeholder="e.g., Central Primary School"
                  required
                />
              </div>
            </div>

            {/* Performance Scores */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Performance Scores (0-100)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newScorecard.academicScore || 0}
                    onChange={(e) => setNewScorecard(prev => ({ ...prev, academicScore: Number(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Finance</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newScorecard.financeScore || 0}
                    onChange={(e) => setNewScorecard(prev => ({ ...prev, financeScore: Number(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quality</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newScorecard.qualityScore || 0}
                    onChange={(e) => setNewScorecard(prev => ({ ...prev, qualityScore: Number(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">TDP</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newScorecard.technologyScore || 0}
                    onChange={(e) => setNewScorecard(prev => ({ ...prev, technologyScore: Number(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theology</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newScorecard.theologyScore || 0}
                    onChange={(e) => setNewScorecard(prev => ({ ...prev, theologyScore: Number(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Average Score Display */}
            {(newScorecard.academicScore || newScorecard.financeScore || newScorecard.qualityScore || newScorecard.technologyScore || newScorecard.theologyScore) ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">Average Score:</p>
                <p className="text-2xl font-bold text-blue-600">
                  {((newScorecard.academicScore! + newScorecard.financeScore! + newScorecard.qualityScore! + newScorecard.technologyScore! + newScorecard.theologyScore!) / 5).toFixed(1)}/100
                </p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              {loading ? "Saving..." : "Save Scorecard"}
            </button>
          </form>
        </div>

        {/* Scorecards Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Scorecards ({scorecards.length})</h3>
          </div>
          {scorecards.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No scorecards for this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">School</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Academic</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Finance</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Quality</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">TDP</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Theology</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Average</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {scorecards.map((sc) => {
                    const avg = (sc.academicScore + sc.financeScore + sc.qualityScore + sc.technologyScore + sc.theologyScore) / 5;
                    return (
                      <tr key={sc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{sc.schoolName}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{sc.academicScore}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{sc.financeScore}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{sc.qualityScore}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{sc.technologyScore}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{sc.theologyScore}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-blue-600">{avg.toFixed(1)}</td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleDeleteScorecard(sc.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* All Saved Scorecards Summary */}
        <div className="bg-white mt-8 p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Saved Scorecards (All Periods)</h3>
          {fetchLoading ? (
            <p className="text-gray-600">Loading...</p>
          ) : allScorecards.length === 0 ? (
            <p className="text-gray-600">No scorecards saved yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Period</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">School</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Academic</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Finance</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Quality</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Avg</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allScorecards.map(sc => {
                    const avg = (sc.academicScore + sc.financeScore + sc.qualityScore + sc.technologyScore + sc.theologyScore) / 5;
                    return (
                      <tr key={sc.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-gray-800">{sc.year} · T{sc.term} · W{sc.week}</td>
                        <td className="px-3 py-2 text-sm text-gray-800">{sc.schoolName}</td>
                        <td className="px-3 py-2 text-sm text-gray-800">{sc.academicScore}</td>
                        <td className="px-3 py-2 text-sm text-gray-800">{sc.financeScore}</td>
                        <td className="px-3 py-2 text-sm text-gray-800">{sc.qualityScore}</td>
                        <td className="px-3 py-2 text-sm font-semibold text-blue-600">{avg.toFixed(1)}</td>
                        <td className="px-3 py-2 text-sm">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedYear(sc.year);
                                setSelectedTerm(sc.term);
                                setSelectedWeek(sc.week);
                                setNewScorecard({
                                  schoolId: sc.schoolId,
                                  schoolName: sc.schoolName,
                                  academicScore: sc.academicScore,
                                  financeScore: sc.financeScore,
                                  qualityScore: sc.qualityScore,
                                  technologyScore: sc.technologyScore,
                                  theologyScore: sc.theologyScore,
                                });
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              Load
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteScorecard(sc.id)}
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
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
