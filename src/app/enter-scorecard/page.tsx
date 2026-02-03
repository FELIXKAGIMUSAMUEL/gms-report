"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface FormData {
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

export default function EnterScorecard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    schoolId: "",
    schoolName: "",
    term: 1,
    week: 1,
    year: currentYear,
    academicScore: 0,
    financeScore: 0,
    qualityScore: 0,
    technologyScore: 0,
    theologyScore: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ["term", "week", "year", "academicScore", "financeScore", "qualityScore", "technologyScore", "theologyScore"].includes(name) ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/scorecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save scorecard");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save scorecard");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Button */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">School Scorecard Entry</h1>
          <p className="text-gray-600 mt-2">Record performance scores for a school</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Scorecard saved successfully!</p>
              <p className="text-sm text-green-800">Redirecting to dashboard...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="font-medium text-red-900">Error: {error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          
          {/* School Information */}
          <h3 className="text-lg font-semibold text-gray-900 mb-4">School Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">School ID</label>
              <input
                type="text"
                name="schoolId"
                placeholder="Unique school identifier"
                value={formData.schoolId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">School Name</label>
              <input
                type="text"
                name="schoolName"
                placeholder="School name"
                value={formData.schoolName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Period */}
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reporting Period</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Year</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {[currentYear - 3, currentYear - 2, currentYear - 1, currentYear].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Term</label>
              <select
                name="term"
                value={formData.term}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value={1}>Term 1</option>
                <option value={2}>Term 2</option>
                <option value={3}>Term 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Week</label>
              <select
                name="week"
                value={formData.week}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(w => (
                  <option key={w} value={w}>Week {w}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Scores */}
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Scores (0-100)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Academic Score</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  name="academicScore"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.academicScore}
                  onChange={handleChange}
                  className="flex-1 h-10 border border-gray-300 rounded-lg px-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="text-lg font-bold text-blue-600 w-12 text-right">{formData.academicScore}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Finance Score</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  name="financeScore"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.financeScore}
                  onChange={handleChange}
                  className="flex-1 h-10 border border-gray-300 rounded-lg px-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="text-lg font-bold text-blue-600 w-12 text-right">{formData.financeScore}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Quality Score</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  name="qualityScore"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.qualityScore}
                  onChange={handleChange}
                  className="flex-1 h-10 border border-gray-300 rounded-lg px-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="text-lg font-bold text-blue-600 w-12 text-right">{formData.qualityScore}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">TDP Score</label>
              <div className="flex items-center gap-3">
                  <input
                    type="number"
                    name="technologyScore"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.technologyScore}
                    onChange={handleChange}
                    className="flex-1 h-10 border border-gray-300 rounded-lg px-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-lg font-bold text-blue-600 w-12 text-right">{formData.technologyScore}</span>
              </div>
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">Theology Score</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    name="theologyScore"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.theologyScore}
                    onChange={handleChange}
                    className="flex-1 h-10 border border-gray-300 rounded-lg px-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-lg font-bold text-blue-600 w-12 text-right">{formData.theologyScore}</span>
                </div>
            </div>
          </div>

          {/* Average Score Display */}
          <div className="bg-blue-50 p-4 rounded-lg mb-8">
            <p className="text-sm text-gray-600">Average Score</p>
            <p className="text-3xl font-bold text-blue-600">
              {(
                (formData.academicScore + formData.financeScore + formData.qualityScore + formData.technologyScore + formData.theologyScore) / 5
              ).toFixed(1)}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-end pt-8 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Saving..." : "Save Scorecard"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
