"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeftIcon, CheckCircleIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";

type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
type IssueItemStatus = "ACTIVE" | "COMPLETED";

interface RedIssue {
  id: string;
  issue: string;
  inCharge?: string;
  status: IssueStatus;
  itemStatus?: IssueItemStatus;
  week?: number;
  year?: number;
  term?: number;
  createdAt?: string;
}

const currentYear = new Date().getFullYear();

export default function IssuesEntryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(1);

  const [issues, setIssues] = useState<RedIssue[]>([]);
  const [allIssues, setAllIssues] = useState<RedIssue[]>([]);
  const [newIssue, setNewIssue] = useState({
    issue: "",
    inCharge: "",
    status: "OPEN" as IssueStatus,
    itemStatus: "ACTIVE" as IssueItemStatus,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  const fetchIssues = useCallback(async () => {
    try {
      setFetchLoading(true);
      const response = await fetch("/api/issues?status=ALL");
      if (response.ok) {
        const data = await response.json();
        const all = Array.isArray(data) ? data : data.data || [];
        setAllIssues(all);
        setIssues(all);
      }
    } catch (err) {
      console.error("Failed to fetch issues:", err);
    } finally {
      setFetchLoading(false);
    }
  }, [selectedYear, selectedTerm, selectedWeek]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch existing issues
  useEffect(() => {
    if (status === "authenticated") {
      fetchIssues();
    }
  }, [status, fetchIssues]);

  const handleAddIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!newIssue.issue || newIssue.issue.trim().length === 0) {
        throw new Error("Issue is required");
      }

      const payload = {
        issue: newIssue.issue,
        inCharge: newIssue.inCharge,
        status: newIssue.status,
        itemStatus: newIssue.itemStatus,
        week: selectedWeek,
        year: selectedYear,
        term: selectedTerm,
      };

      const response = await fetch(editingId ? `/api/issues?id=${editingId}` : "/api/issues", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save issue");
      }

      setSuccess(true);
      setNewIssue({ issue: "", inCharge: "", status: "OPEN", itemStatus: "ACTIVE" });
      setEditingId(null);

      setTimeout(() => setSuccess(false), 3000);
      await fetchIssues();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save issue");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (issueId: string, newStatus: IssueStatus) => {
    try {
      const response = await fetch(`/api/issues?id=${issueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      await fetchIssues();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update issue");
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    try {
      const response = await fetch(`/api/issues?id=${issueId}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Failed to delete issue");
      }

      await fetchIssues();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete issue");
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
          <h1 className="text-3xl font-bold text-gray-900">Manage Red Issues</h1>
          <p className="text-gray-600 mt-2">Track and resolve critical issues</p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">Issue saved successfully!</p>
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

        {/* Add / Edit Issue Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{editingId ? "Edit Issue" : "Report New Issue"}</h3>
          <form onSubmit={handleAddIssue} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Issue</label>
              <input
                type="text"
                value={newIssue.issue}
                onChange={(e) => setNewIssue(prev => ({ ...prev, issue: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="Describe the issue briefly"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">In-Charge (optional)</label>
                <input
                  type="text"
                  value={newIssue.inCharge}
                  onChange={(e) => setNewIssue(prev => ({ ...prev, inCharge: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                  placeholder="Person responsible"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={newIssue.status}
                  onChange={(e) => setNewIssue(prev => ({ ...prev, status: e.target.value as IssueStatus }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Archive State</label>
                <select
                  value={newIssue.itemStatus}
                  onChange={(e) => setNewIssue(prev => ({ ...prev, itemStatus: e.target.value as IssueItemStatus }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Archived</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                {loading ? "Saving..." : editingId ? "Update Issue" : "Report Issue"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => { setEditingId(null); setNewIssue({ issue: "", inCharge: "", status: "OPEN", itemStatus: "ACTIVE" }); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Issues List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Issues ({issues.length})</h3>
          </div>
          {issues.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No issues for this period</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {issues.map((issue) => (
                <div key={issue.id} className="px-6 py-6 hover:bg-gray-50 transition-colors border-l-4 border-red-500">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg">{issue.issue || "Untitled issue"}</h4>
                      <p className="text-sm text-gray-600 mt-1">In-Charge: {issue.inCharge || "Unassigned"}</p>
                      <p className="text-xs text-gray-500 mt-1">{issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : ""}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <select
                        value={issue.status}
                        onChange={(e) => handleUpdateStatus(issue.id, e.target.value as IssueStatus)}
                        className={`px-3 py-1 rounded text-sm font-medium border-0 cursor-pointer ${
                          issue.status === "OPEN" ? "bg-red-100 text-red-800" :
                          issue.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-800" :
                          "bg-green-100 text-green-800"
                        }`}
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(issue.id);
                            setNewIssue({
                              issue: issue.issue || "",
                              inCharge: issue.inCharge || "",
                              status: issue.status,
                              itemStatus: issue.itemStatus ?? "ACTIVE",
                            });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="px-3 py-1 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteIssue(issue.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete issue"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Saved Issues Summary */}
        <div className="bg-white mt-8 p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Saved Issues (All Periods)</h3>
          {fetchLoading ? (
            <p className="text-gray-600">Loading...</p>
          ) : allIssues.length === 0 ? (
            <p className="text-gray-600">No issues saved yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Period</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Issue</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Archive</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allIssues.map(issue => (
                    <tr key={issue.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-800">{issue.year ? `${issue.year} · T${issue.term ?? "?"} · W${issue.week ?? "?"}` : "Not set"}</td>
                      <td className="px-3 py-2 text-sm text-gray-800">{issue.issue || "Untitled issue"}</td>
                      <td className="px-3 py-2 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          issue.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                          issue.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {issue.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <span className={`px-2 py-1 rounded text-[11px] font-semibold ${
                          (issue.itemStatus ?? 'ACTIVE') === 'COMPLETED' ? 'bg-gray-200 text-gray-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {(issue.itemStatus ?? 'ACTIVE') === 'COMPLETED' ? 'Archived' : 'Active'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedYear(issue.year || currentYear);
                              setSelectedTerm(issue.term || 1);
                              setSelectedWeek(issue.week || 1);
                              setNewIssue({
                                issue: issue.issue || "",
                                inCharge: issue.inCharge || "",
                                status: issue.status,
                                itemStatus: issue.itemStatus ?? 'ACTIVE',
                              });
                              setEditingId(issue.id);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteIssue(issue.id)}
                            className="px-3 py-1 rounded-md border border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
