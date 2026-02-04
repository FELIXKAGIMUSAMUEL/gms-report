"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ExclamationTriangleIcon, CheckIcon, ClockIcon } from "@heroicons/react/24/outline";

interface Issue {
  id: string;
  title: string;
  description: string;
  status: "open" | "in-progress" | "closed";
  severity: "critical" | "high" | "medium" | "low";
  school: string;
  createdAt: string;
  updatedAt: string;
  daysOpen: number;
  assignee?: string;
}

export default function IssuesDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchIssues();
    }
  }, [status]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/trustee/issues");
      if (response.ok) {
        const data = await response.json();
        setIssues(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-900 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-900 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-900 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-900 border-blue-300";
      default:
        return "bg-gray-100 text-gray-900 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "closed":
        return <CheckIcon className="w-5 h-5 text-green-600" />;
      case "in-progress":
        return <ClockIcon className="w-5 h-5 text-blue-600" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
    }
  };

  const filteredIssues = issues.filter(
    (issue) =>
      (filterStatus === "all" || issue.status === filterStatus) &&
      (filterSeverity === "all" || issue.severity === filterSeverity)
  );

  const stats = {
    total: issues.length,
    open: issues.filter((i) => i.status === "open").length,
    inProgress: issues.filter((i) => i.status === "in-progress").length,
    closed: issues.filter((i) => i.status === "closed").length,
    critical: issues.filter((i) => i.severity === "critical").length,
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Issues & Action Items</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-600 font-medium">Total Issues</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-600 font-medium">Open</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.open}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-600 font-medium">In Progress</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-600 font-medium">Closed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.closed}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-600 font-medium">🚨 Critical</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.critical}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Severity</option>
                <option value="critical">🚨 Critical</option>
                <option value="high">⚠️ High</option>
                <option value="medium">⚡ Medium</option>
                <option value="low">ℹ️ Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading issues...</p>
          ) : filteredIssues.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500 text-lg">No issues found</p>
              <p className="text-gray-400 text-sm mt-1">Great work! All issues are resolved</p>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div key={issue.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(issue.status)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{issue.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(issue.severity)}`}>
                      {issue.severity.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200 text-sm">
                  <div>
                    <span className="text-gray-600">School:</span>
                    <span className="font-semibold text-gray-900 ml-2">{issue.school}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold text-gray-900 ml-2 capitalize">{issue.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Days Open:</span>
                    <span className="font-semibold text-gray-900 ml-2">{issue.daysOpen}</span>
                  </div>
                  {issue.assignee && (
                    <div>
                      <span className="text-gray-600">Assigned to:</span>
                      <span className="font-semibold text-gray-900 ml-2">{issue.assignee}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
