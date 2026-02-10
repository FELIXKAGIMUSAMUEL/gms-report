"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { AcademicCapIcon } from "@heroicons/react/24/outline";

interface Comparison {
  metric: string;
  school1: { name: string; value: number | string };
  school2: { name: string; value: number | string };
  difference: number;
  percentDiff: number;
}

export default function ComparativeAnalysisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [schools, setSchools] = useState<string[]>([]);
  const [selectedSchool1, setSelectedSchool1] = useState("");
  const [selectedSchool2, setSelectedSchool2] = useState("");
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSchools();
    }
  }, [status]);

  const fetchSchools = async () => {
    try {
      const response = await fetch("/api/schools");
      if (response.ok) {
        const data = await response.json();
        const schoolList = Array.isArray(data) ? data : data.data || [];
        setSchools(schoolList.map((s: any) => (typeof s === "string" ? s : s.name)));
        if (schoolList.length >= 2) {
          setSelectedSchool1(schoolList[0]?.name || schoolList[0]);
          setSelectedSchool2(schoolList[1]?.name || schoolList[1]);
        }
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!selectedSchool1 || !selectedSchool2 || selectedSchool1 === selectedSchool2) {
      alert("Please select two different schools");
      return;
    }

    try {
      const response = await fetch(
        `/api/trustee/compare?school1=${selectedSchool1}&school2=${selectedSchool2}`
      );
      if (response.ok) {
        const data = await response.json();
        setComparisons(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Comparison error:", error);
    }
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

  if (session?.user?.role !== "TRUSTEE") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">This page is for trustees only.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Comparative Analysis</h1>

        {/* School Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Schools to Compare</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School 1</label>
              <select
                value={selectedSchool1}
                onChange={(e) => setSelectedSchool1(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select School</option>
                {schools.map((school) => (
                  <option key={school} value={school}>
                    {school}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School 2</label>
              <select
                value={selectedSchool2}
                onChange={(e) => setSelectedSchool2(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select School</option>
                {schools.map((school) => (
                  <option key={school} value={school}>
                    {school}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCompare}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                Compare
              </button>
            </div>
          </div>
        </div>

        {/* Comparison Results */}
        {comparisons.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedSchool1} vs {selectedSchool2}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Metric</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">{selectedSchool1}</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">{selectedSchool2}</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Difference</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">% Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {comparisons.map((comp, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{comp.metric}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900 font-semibold">
                        {typeof comp.school1.value === "number"
                          ? comp.school1.value.toLocaleString()
                          : comp.school1.value}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900 font-semibold">
                        {typeof comp.school2.value === "number"
                          ? comp.school2.value.toLocaleString()
                          : comp.school2.value}
                      </td>
                      <td className={`px-6 py-4 text-center text-sm font-semibold ${
                        comp.difference >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {comp.difference >= 0 ? "+" : ""}{typeof comp.difference === "number" 
                          ? comp.difference.toLocaleString() 
                          : comp.difference}
                      </td>
                      <td className={`px-6 py-4 text-center text-sm font-semibold ${
                        comp.percentDiff >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {comp.percentDiff >= 0 ? "+" : ""}{comp.percentDiff.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analysis Tools Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Peer Benchmarking</h3>
            <p className="text-gray-600 text-sm mb-4">
              Compare each school with similar-sized schools to identify best practices
            </p>
            <button className="w-full px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 font-semibold transition-colors">
              Launch Benchmarking
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Historical Trends</h3>
            <p className="text-gray-600 text-sm mb-4">
              View 3-5 year trend analysis for selected schools
            </p>
            <button className="w-full px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 font-semibold transition-colors">
              View Trends
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
