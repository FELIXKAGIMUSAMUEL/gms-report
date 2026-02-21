"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface FormData {
  source: string;
  amount: number;
  percentage: number;
  year: number;
  month: number;
}

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function EnterIncome() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    source: "",
    amount: 0,
    percentage: 0,
    year: currentYear,
    month: currentMonth,
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
      [name]: ["amount", "percentage", "year", "month"].includes(name) ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/other-income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save income");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save income");
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
          <h1 className="text-3xl font-bold text-gray-900">Record Other Income</h1>
          <p className="text-gray-600 mt-2">Add income from sources other than fees</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Income recorded successfully!</p>
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
          
          {/* Income Source */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">Income Source</label>
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select an income source</option>
              <option value="DONATIONS">Donations</option>
              <option value="GRANTS">Grants</option>
              <option value="SPONSORSHIPS">Sponsorships</option>
              <option value="INVESTMENTS">Investments</option>
              <option value="SHOP_SALES">Shop Sales</option>
              <option value="TUITION_MISC">Miscellaneous Tuition</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Percentage */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">Percentage (%)</label>
            <input
              type="number"
              name="percentage"
              min="0"
              max="100"
              step="0.1"
              value={formData.percentage}
              onChange={handleChange}
              placeholder="0.0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Enter the percentage contribution (0-100%)</p>
          </div>

          {/* Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
              <label className="block text-sm font-medium text-gray-900 mb-2">Month</label>
              <select
                name="month"
                value={formData.month}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value={1}>January</option>
                <option value={2}>February</option>
                <option value={3}>March</option>
                <option value={4}>April</option>
                <option value={5}>May</option>
                <option value={6}>June</option>
                <option value={7}>July</option>
                <option value={8}>August</option>
                <option value={9}>September</option>
                <option value={10}>October</option>
                <option value={11}>November</option>
                <option value={12}>December</option>
              </select>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-green-50 p-4 rounded-lg mb-8">
            <p className="text-sm text-gray-600">Amount to Record</p>
            <p className="text-3xl font-bold text-green-600">
              UGX {formData.amount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              {formData.source || "No source selected"} • {formData.month > 0 ? new Date(2024, formData.month - 1).toLocaleString('default', { month: 'long' }) : 'Month'} {formData.year}
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
              {loading ? "Saving..." : "Record Income"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
