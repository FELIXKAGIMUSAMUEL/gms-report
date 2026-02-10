"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  DocumentTextIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";

interface WeeklyReport {
  id: string;
  weekNumber: number;
  year: number;
  term: number;
  weekStartDate: string;
  weekEndDate: string;
  generalManager: string;
  feesCollectionPercent: number;
  schoolsExpenditurePercent: number;
  infrastructurePercent: number;
  totalEnrollment: number;
  theologyEnrollment: number;
  p7PrepExamsPercent: number;
  syllabusCoveragePercent: number;
  admissions: number;
  isDraft: boolean;
  publishedAt: string | null;
  createdAt: string;
}

interface Scorecard {
  id: string;
  school: string;
  term: number;
  week: number;
  year: number;
  academicPercent: number;
  financePercent: number;
  qualityPercent: number;
  tdpPercent: number;
  theologyPercent: number;
  createdAt: string;
}

interface RedIssue {
  id: string;
  title: string;
  status: string;
  inCharge: string;
  term: number;
  week: number;
  year: number;
  createdAt: string;
}

interface Project {
  id: string;
  title: string;
  status: string;
  inCharge: string;
  date: string;
  createdAt: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  inCharge: string;
  createdAt: string;
}

interface Comment {
  id: string;
  category: string;
  field: string;
  text: string;
  createdAt: string;
  report?: {
    year: number;
    term: number;
    weekNumber: number;
  };
}

type ViewMode = "reports" | "scorecards" | "issues" | "projects" | "events" | "comments";

export default function ArchivePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [viewMode, setViewMode] = useState<ViewMode>("reports");
  const [loading, setLoading] = useState(true);
  
  // Data
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [redIssues, setRedIssues] = useState<RedIssue[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  
  // Filters
  const [filterYear, setFilterYear] = useState<number | "all">("all");
  const [filterTerm, setFilterTerm] = useState<number | "all">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAllData();
    }
  }, [status]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [reportsRes, scorecardsRes, issuesRes, projectsRes, eventsRes, commentsRes] = await Promise.all([
        fetch("/api/reports"),
        fetch("/api/scorecard"),
        fetch("/api/red-issues"),
        fetch("/api/projects"),
        fetch("/api/events"),
        fetch("/api/comments"),
      ]);

      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(Array.isArray(data) ? data : data.data || []);
      }

      if (scorecardsRes.ok) {
        const data = await scorecardsRes.json();
        setScorecards(Array.isArray(data) ? data : data.data || []);
      }

      if (issuesRes.ok) {
        const data = await issuesRes.json();
        setRedIssues(Array.isArray(data) ? data : data.data || []);
      }

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(Array.isArray(data) ? data : data.data || []);
      }

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(Array.isArray(data) ? data : data.data || []);
      }

      if (commentsRes.ok) {
        const data = await commentsRes.json();
        setComments(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error fetching archive data:", error);
    } finally {
      setLoading(false);
    }
  };

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    reports.forEach(r => years.add(r.year));
    scorecards.forEach(s => years.add(s.year));
    redIssues.forEach(i => years.add(i.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [reports, scorecards, redIssues]);

  const filteredData = useMemo(() => {
    let data: any[] = [];
    
    switch(viewMode) {
      case "reports":
        data = reports;
        break;
      case "scorecards":
        data = scorecards;
        break;
      case "issues":
        data = redIssues;
        break;
      case "projects":
        data = projects;
        break;
      case "events":
        data = events;
        break;
      case "comments":
        data = comments;
        break;
    }

    // Apply year filter
    if (filterYear !== "all") {
      data = data.filter((item: any) => {
        if (viewMode === "comments" && item.report) {
          return item.report.year === filterYear;
        }
        return item.year === filterYear;
      });
    }

    // Apply term filter
    if (filterTerm !== "all") {
      data = data.filter((item: any) => {
        if (viewMode === "comments" && item.report) {
          return item.report.term === filterTerm;
        }
        return item.term === filterTerm;
      });
    }

    // Apply status filter
    if (filterStatus !== "all" && (viewMode === "issues" || viewMode === "projects")) {
      data = data.filter((item: any) => item.status === filterStatus);
    }

    // Apply search
    if (searchQuery) {
      data = data.filter((item: any) =>
        JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return data;
  }, [viewMode, reports, scorecards, redIssues, projects, events, comments, filterYear, filterTerm, filterStatus, searchQuery]);

  const exportData = () => {
    try {
      const wb = XLSX.utils.book_new();

      const dataMap: Record<ViewMode, any[]> = {
        reports,
        scorecards,
        issues: redIssues,
        projects,
        events,
        comments,
      };

      Object.entries(dataMap).forEach(([key, data]) => {
        if (data.length > 0) {
          const sheet = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(wb, sheet, key.charAt(0).toUpperCase() + key.slice(1));
        }
      });

      const timestamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Archive_${timestamp}.xlsx`);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data");
    }
  };

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return null;
  }

  const isGM = session.user?.role === "GM";

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Records Archive</h1>
          <p className="mt-2 text-sm text-gray-600">
            Historical records, reports, and important information
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode("reports")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                viewMode === "reports"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <DocumentTextIcon className="w-4 h-4" />
              Weekly Reports ({reports.length})
            </button>
            <button
              onClick={() => setViewMode("scorecards")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                viewMode === "scorecards"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <ChartBarIcon className="w-4 h-4" />
              Scorecards ({scorecards.length})
            </button>
            <button
              onClick={() => setViewMode("issues")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                viewMode === "issues"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <ExclamationTriangleIcon className="w-4 h-4" />
              Red Issues ({redIssues.length})
            </button>
            <button
              onClick={() => setViewMode("projects")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                viewMode === "projects"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <BriefcaseIcon className="w-4 h-4" />
              Projects ({projects.length})
            </button>
            <button
              onClick={() => setViewMode("events")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                viewMode === "events"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Events ({events.length})
            </button>
            <button
              onClick={() => setViewMode("comments")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                viewMode === "comments"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              Comments ({comments.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className="w-5 h-5 text-gray-600" />
            <h3 className="text-md font-semibold text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search anything..."
                  className="w-full pl-10 px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Year</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Term</label>
              <select
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All Terms</option>
                <option value={1}>Term 1</option>
                <option value={2}>Term 2</option>
                <option value={3}>Term 3</option>
              </select>
            </div>
            {(viewMode === "issues" || viewMode === "projects") && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing <strong>{filteredData.length}</strong> record{filteredData.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export All Data
            </button>
          </div>
        </div>

        {/* Data Display */}
        {filteredData.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">No records found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              {viewMode === "reports" && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">GM</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Fees %</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Enrollment</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">P7 Prep %</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(filteredData as WeeklyReport[]).map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {report.year}, Term {report.term}, Week {report.weekNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{report.generalManager}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{report.feesCollectionPercent.toFixed(1)}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{report.totalEnrollment.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{report.p7PrepExamsPercent.toFixed(1)}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            report.isDraft ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                          }`}>
                            {report.isDraft ? "Draft" : "Published"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {viewMode === "scorecards" && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">School</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Academic</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Finance</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Quality</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Technology</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Theology</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Avg</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(filteredData as Scorecard[]).map((sc) => {
                      const avg = (sc.academicPercent + sc.financePercent + sc.qualityPercent + sc.tdpPercent + sc.theologyPercent) / 5;
                      return (
                        <tr key={sc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sc.school}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {sc.year}, T{sc.term}, W{sc.week}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sc.academicPercent.toFixed(1)}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sc.financePercent.toFixed(1)}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sc.qualityPercent.toFixed(1)}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sc.tdpPercent.toFixed(1)}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sc.theologyPercent.toFixed(1)}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{avg.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {viewMode === "issues" && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">In Charge</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(filteredData as RedIssue[]).map((issue) => (
                      <tr key={issue.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{issue.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {issue.year}, T{issue.term}, W{issue.week}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{issue.inCharge}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            issue.status === "Resolved" 
                              ? "bg-green-100 text-green-800"
                              : issue.status === "In Progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {issue.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {viewMode === "projects" && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">In Charge</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(filteredData as Project[]).map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{project.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{project.inCharge}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            project.status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : project.status === "In Progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(project.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {viewMode === "events" && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">In Charge</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(filteredData as Event[]).map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{event.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{event.inCharge}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(event.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(event.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {viewMode === "comments" && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Field</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Comment</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(filteredData as Comment[]).map((comment) => (
                      <tr key={comment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{comment.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {comment.report ? `${comment.report.year}, T${comment.report.term}, W${comment.report.weekNumber}` : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{comment.field}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-md truncate">{comment.text}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Records Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-blue-800">Weekly Reports:</span>
                <span className="font-bold text-blue-900">{reports.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-800">Scorecards:</span>
                <span className="font-bold text-blue-900">{scorecards.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-800">Red Issues:</span>
                <span className="font-bold text-blue-900">{redIssues.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Activity</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-green-800">Projects:</span>
                <span className="font-bold text-green-900">{projects.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-800">Events:</span>
                <span className="font-bold text-green-900">{events.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-800">Comments:</span>
                <span className="font-bold text-green-900">{comments.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm border border-purple-200 p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">Coverage</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-purple-800">Years:</span>
                <span className="font-bold text-purple-900">{availableYears.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-purple-800">Total Records:</span>
                <span className="font-bold text-purple-900">
                  {reports.length + scorecards.length + redIssues.length + projects.length + events.length + comments.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-purple-800">Last Updated:</span>
                <span className="font-bold text-purple-900">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
