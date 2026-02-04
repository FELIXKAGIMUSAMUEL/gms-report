"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { CheckCircleIcon, XCircleIcon, ClockIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";

interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  progress: number;
  year: number;
  term?: number;
  status: "not-started" | "in-progress" | "completed" | "missed";
}

export default function TrusteeGoalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "enrollment",
    targetValue: 0,
    unit: "",
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user?.role !== "TRUSTEE") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchGoals();
  }, [selectedYear]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/goals?year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setGoals(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async () => {
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newGoal,
          year: selectedYear,
          currentValue: 0,
          progress: 0,
        }),
      });

      if (response.ok) {
        setNewGoal({ title: "", description: "", category: "enrollment", targetValue: 0, unit: "" });
        setShowForm(false);
        fetchGoals();
      }
    } catch (error) {
      console.error("Error creating goal:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "green";
      case "in-progress":
        return "blue";
      case "missed":
        return "red";
      default:
        return "gray";
    }
  };

  const categoryIcons: Record<string, string> = {
    enrollment: "👥",
    financial: "💰",
    academic: "📚",
    infrastructure: "🏗️",
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Goals & Targets Management</h1>
          <p className="text-gray-600 mt-1">Set and track organizational goals and performance targets</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {[2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center gap-2"
          >
            <RocketLaunchIcon className="w-5 h-5" />
            Add New Goal
          </button>
        </div>

        {/* New Goal Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Goal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Goal title"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newGoal.category}
                onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="enrollment">Enrollment</option>
                <option value="financial">Financial</option>
                <option value="academic">Academic</option>
                <option value="infrastructure">Infrastructure</option>
              </select>
              <input
                type="number"
                placeholder="Target value"
                value={newGoal.targetValue}
                onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseFloat(e.target.value) })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Unit (%, students, Ugx, etc.)"
                value={newGoal.unit}
                onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Description (optional)"
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 md:col-span-2"
                rows={3}
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={createGoal}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                Create Goal
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Goals Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading goals...</div>
        ) : goals.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <RocketLaunchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">No goals set yet</p>
            <p className="text-sm text-gray-500 mt-1">Create your first organizational goal to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => {
              const statusColor = getStatusColor(goal.status);
              const icon = categoryIcons[goal.category] || "🎯";

              return (
                <div
                  key={goal.id}
                  className={`rounded-lg shadow p-6 border-l-4 ${
                    statusColor === "green"
                      ? "border-green-500 bg-green-50"
                      : statusColor === "blue"
                      ? "border-blue-500 bg-blue-50"
                      : statusColor === "red"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-500 bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">{icon}</div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        statusColor === "green"
                          ? "bg-green-200 text-green-800"
                          : statusColor === "blue"
                          ? "bg-blue-200 text-blue-800"
                          : statusColor === "red"
                          ? "bg-red-200 text-red-800"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {goal.status.toUpperCase().replace("_", " ")}
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 mb-2">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-gray-700">Progress</span>
                      <span className="text-sm font-bold text-gray-900">{goal.progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          statusColor === "green"
                            ? "bg-green-600"
                            : statusColor === "blue"
                            ? "bg-blue-600"
                            : "bg-red-600"
                        }`}
                        style={{ width: `${Math.min(goal.progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Target */}
                  <div className="text-sm">
                    <p className="text-gray-600">
                      <span className="font-semibold">{goal.currentValue.toLocaleString()}</span>
                      <span className="text-gray-500"> / </span>
                      <span className="font-semibold">{goal.targetValue.toLocaleString()}</span>
                      <span className="text-gray-500"> {goal.unit}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
