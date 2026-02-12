"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  RocketLaunchIcon,
  UsersIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  SquaresPlusIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

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
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear]);

  // Pagination calculations
  const totalPages = Math.ceil(goals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGoals = goals.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    setFormError("");
    setFormSuccess("");

    // Validation
    if (!newGoal.title.trim()) {
      setFormError("Goal title is required");
      return;
    }
    if (newGoal.targetValue <= 0) {
      setFormError("Target value must be greater than 0");
      return;
    }
    if (!newGoal.unit.trim()) {
      setFormError("Unit is required (e.g., %, students, Ugx)");
      return;
    }

    try {
      setSubmitting(true);
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

      const data = await response.json();

      if (response.ok) {
        setFormSuccess("Goal created successfully!");
        setNewGoal({ title: "", description: "", category: "enrollment", targetValue: 0, unit: "" });
        setShowForm(false);
        await new Promise(resolve => setTimeout(resolve, 800));
        fetchGoals();
      } else {
        setFormError(data.error || "Failed to create goal");
      }
    } catch (error) {
      console.error("Error creating goal:", error);
      setFormError("Error creating goal. Please try again.");
    } finally {
      setSubmitting(false);
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

  const categoryIcons: Record<string, any> = {
    enrollment: UsersIcon,
    financial: CurrencyDollarIcon,
    academic: AcademicCapIcon,
    infrastructure: SquaresPlusIcon,
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
            <label className="block text-sm font-bold text-gray-900 mb-2">Academic Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 font-bold bg-white"
            >
              {[2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors flex items-center gap-2 self-end"
          >
            <PlusIcon className="w-5 h-5" />
            Create New Goal
          </button>
        </div>

        {/* New Goal Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200 p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Goal</h2>

            {/* Error Message */}
            {formError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-red-800 font-semibold text-sm">{formError}</p>
              </div>
            )}

            {/* Success Message */}
            {formSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-300 rounded-lg">
                <p className="text-green-800 font-semibold text-sm">{formSuccess}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Goal Title */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Goal Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Increase enrollment to 500 students"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder-gray-400 font-medium"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Category *</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 font-medium bg-white"
                >
                  <option value="enrollment">Enrollment</option>
                  <option value="financial">Financial</option>
                  <option value="academic">Academic</option>
                  <option value="infrastructure">Infrastructure</option>
                </select>
              </div>

              {/* Target Value */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Target Value *</label>
                <input
                  type="number"
                  placeholder="e.g., 500"
                  value={newGoal.targetValue || ""}
                  onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder-gray-400 font-medium"
                  step="0.01"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Unit *</label>
                <input
                  type="text"
                  placeholder="e.g., %, students, Ugx, hours"
                  value={newGoal.unit}
                  onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder-gray-400 font-medium"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-900 mb-2">Description (Optional)</label>
                <textarea
                  placeholder="Add details about this goal..."
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder-gray-400 font-medium"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={createGoal}
                disabled={submitting}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold transition-colors flex items-center gap-2"
              >
                {submitting ? "Creating..." : "Create Goal"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormError("");
                  setFormSuccess("");
                }}
                disabled={submitting}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:cursor-not-allowed font-bold transition-colors"
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
          <>
            <div className="mb-4 text-sm text-gray-600">
              Showing <strong>{startIndex + 1}-{Math.min(endIndex, goals.length)}</strong> of <strong>{goals.length}</strong> goal{goals.length !== 1 ? 's' : ''}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedGoals.map((goal) => {
              const statusColor = getStatusColor(goal.status);
              const IconComponent = categoryIcons[goal.category];

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
                    <div>
                      {IconComponent && (
                        <IconComponent className="w-8 h-8 text-blue-600" />
                      )}
                    </div>
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

          {/* Pagination Controls */}
          {goals.length > itemsPerPage && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {currentPage > 3 && (
                  <>
                    <button
                      onClick={() => goToPage(1)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      1
                    </button>
                    {currentPage > 4 && <span className="px-2 text-gray-500">...</span>}
                  </>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    return page === currentPage ||
                           page === currentPage - 1 ||
                           page === currentPage - 2 ||
                           page === currentPage + 1 ||
                           page === currentPage + 2;
                  })
                  .map(page => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-2 border rounded-lg text-sm font-medium ${
                        page === currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && <span className="px-2 text-gray-500">...</span>}
                    <button
                      onClick={() => goToPage(totalPages)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  </>                )}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
