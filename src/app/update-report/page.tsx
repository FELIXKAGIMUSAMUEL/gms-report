"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function UpdateReportPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  const [formData, setFormData] = useState({
    year: currentYear,
    quarter: currentQuarter,
    baptisms: 0,
    professionOfFaith: 0,
    tithes: 0,
    combinedOfferings: 0,
    membership: 0,
    sabbathSchoolAttendance: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    // Load existing report if it exists
    const loadReport = async () => {
      try {
        const res = await fetch(
          `/api/reports?year=${formData.year}&quarter=${formData.quarter}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setFormData({
              year: data.year,
              quarter: data.quarter,
              baptisms: data.baptisms,
              professionOfFaith: data.professionOfFaith,
              tithes: data.tithes,
              combinedOfferings: data.combinedOfferings,
              membership: data.membership,
              sabbathSchoolAttendance: data.sabbathSchoolAttendance,
            });
          }
        }
      } catch (err) {
        console.error("Error loading report:", err);
      }
    };

    if (status === "authenticated") {
      loadReport();
    }
  }, [formData.year, formData.quarter, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update report");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Define which fields are integers vs floats
    const integerFields = ["year", "quarter", "baptisms", "professionOfFaith", "membership", "sabbathSchoolAttendance"];
    const floatFields = ["tithes", "combinedOfferings"];
    
    let parsedValue: number;
    if (integerFields.includes(name)) {
      parsedValue = parseInt(value) || 0;
    } else if (floatFields.includes(name)) {
      parsedValue = parseFloat(value) || 0;
    } else {
      parsedValue = 0;
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Update Report</h1>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Period Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="year"
                  className="block text-sm font-medium text-gray-700"
                >
                  Year
                </label>
                <select
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {[...Array(7)].map((_, i) => {
                    const year = 2020 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label
                  htmlFor="quarter"
                  className="block text-sm font-medium text-gray-700"
                >
                  Quarter
                </label>
                <select
                  id="quarter"
                  name="quarter"
                  value={formData.quarter}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={1}>Q1 (Jan-Mar)</option>
                  <option value={2}>Q2 (Apr-Jun)</option>
                  <option value={3}>Q3 (Jul-Sep)</option>
                  <option value={4}>Q4 (Oct-Dec)</option>
                </select>
              </div>
            </div>

            {/* Conversions */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Conversions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="baptisms"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Baptisms
                  </label>
                  <input
                    type="number"
                    id="baptisms"
                    name="baptisms"
                    min="0"
                    value={formData.baptisms}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="professionOfFaith"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Profession of Faith
                  </label>
                  <input
                    type="number"
                    id="professionOfFaith"
                    name="professionOfFaith"
                    min="0"
                    value={formData.professionOfFaith}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Financial */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Financial
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="tithes"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Tithes ($)
                  </label>
                  <input
                    type="number"
                    id="tithes"
                    name="tithes"
                    min="0"
                    step="0.01"
                    value={formData.tithes}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="combinedOfferings"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Combined Offerings ($)
                  </label>
                  <input
                    type="number"
                    id="combinedOfferings"
                    name="combinedOfferings"
                    min="0"
                    step="0.01"
                    value={formData.combinedOfferings}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Membership & Attendance */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Membership & Attendance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="membership"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Total Membership
                  </label>
                  <input
                    type="number"
                    id="membership"
                    name="membership"
                    min="0"
                    value={formData.membership}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sabbathSchoolAttendance"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Sabbath School Attendance
                  </label>
                  <input
                    type="number"
                    id="sabbathSchoolAttendance"
                    name="sabbathSchoolAttendance"
                    min="0"
                    value={formData.sabbathSchoolAttendance}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
                Report updated successfully! Redirecting...
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
              >
                {loading ? "Saving..." : "Save Report"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
