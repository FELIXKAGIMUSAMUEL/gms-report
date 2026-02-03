"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface FormData {
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

export default function EnterKPI() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    weekNumber: 1,
    year: currentYear,
    feesCollectionPercent: 0,
    schoolsExpenditurePercent: 0,
    infrastructurePercent: 0,
    totalEnrollment: 0,
    theologyEnrollment: 0,
    p7PrepExamsPercent: 0,
    syllabusCoveragePercent: 0,
    admissions: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "weekNumber" || name === "year" ? Number(value) : Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save KPI");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save KPI");
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
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
          <h1 className="text-3xl font-bold text-gray-900">Enter Weekly KPI</h1>
          <p className="text-gray-600 mt-2">Record key performance indicators for the selected week</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">KPI saved successfully!</p>
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
          
          {/* Period Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Week Number</label>
              <input
                type="number"
                name="weekNumber"
                min="1"
                max="52"
                value={formData.weekNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Year</label>
              <select
                name="year"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: Number(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {[currentYear - 3, currentYear - 2, currentYear - 1, currentYear].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Financial Metrics */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Fees Collection %</label>
                <input
                  type="number"
                  name="feesCollectionPercent"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.feesCollectionPercent}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Schools Expenditure %</label>
                <input
                  type="number"
                  name="schoolsExpenditurePercent"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.schoolsExpenditurePercent}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Infrastructure %</label>
                <input
                  type="number"
                  name="infrastructurePercent"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.infrastructurePercent}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Enrollment Metrics */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Total Enrollment</label>
                <input
                  type="number"
                  name="totalEnrollment"
                  min="0"
                  value={formData.totalEnrollment}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Theology Enrollment</label>
                <input
                  type="number"
                  name="theologyEnrollment"
                  min="0"
                  value={formData.theologyEnrollment}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Admissions</label>
                <input
                  type="number"
                  name="admissions"
                  min="0"
                  value={formData.admissions}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Academic Metrics */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">P7 Prep Exams %</label>
                <input
                  type="number"
                  name="p7PrepExamsPercent"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.p7PrepExamsPercent}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Syllabus Coverage %</label>
                <input
                  type="number"
                  name="syllabusCoveragePercent"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.syllabusCoveragePercent}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
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
              {loading ? "Saving..." : "Save KPI"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
