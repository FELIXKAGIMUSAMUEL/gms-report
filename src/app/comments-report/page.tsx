"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PrinterIcon } from "@heroicons/react/24/outline";

interface Comment {
  id: string;
  category: "kpi" | "red-issues" | "projects" | "events";
  reportId?: string;
  field: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  report?: {
    year: number;
    term: number;
    weekNumber: number;
    generalManager: string;
  };
  user?: {
    name: string;
    email: string;
  } | null;
  itemDetails?: {
    title: string;
    status?: string;
    inCharge?: string;
    date?: string;
  } | null;
}

const currentYear = new Date().getFullYear();

export default function CommentsReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedField, setSelectedField] = useState("all");
  const [selectedGM, setSelectedGM] = useState("all");
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldLabels: Record<string, string> = {
    feesComment: "Fees Collection",
    expenditureComment: "Expenditure",
    infrastructureComment: "Infrastructure",
    enrollmentComment: "Enrollment",
    theologyComment: "Theology Enrollment",
    p7prepComment: "P.7 Prep",
    syllabusComment: "Syllabus Coverage",
    admissionsComment: "Admissions",
  };

  const categoryLabels: Record<string, string> = {
    all: "All Categories",
    kpi: "KPI Comments",
    "red-issues": "Red Issues Feedback",
    projects: "Project Feedback",
    events: "Event Feedback",
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchComments();
    }
  }, [status]);

  useEffect(() => {
    filterComments();
  }, [comments, startDate, endDate, selectedCategory, selectedField, selectedGM]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/comments");
      if (!response.ok) throw new Error("Failed to fetch comments");
      const data = await response.json();
      setComments(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  };

  const filterComments = () => {
    let filtered = [...comments];

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(c => new Date(c.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(c => new Date(c.createdAt) <= end);
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    // Filter by field (only for KPI comments)
    if (selectedField !== "all") {
      filtered = filtered.filter(c => c.category === "kpi" && c.field === selectedField);
    }

    // Filter by GM
    if (selectedGM !== "all") {
      filtered = filtered.filter(c => c.report?.generalManager === selectedGM);
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredComments(filtered);
  };

  const handlePrint = () => {
    window.print();
  };

  const uniqueGMs = Array.from(new Set(comments.map(c => c.report?.generalManager).filter(Boolean)));

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 print:hidden">
          <h1 className="text-3xl font-bold text-gray-900">Comments Report</h1>
          <p className="text-sm text-gray-600 mt-1">Generate and print comments from weekly reports</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6 print:hidden">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Report Type</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              >
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">KPI Field</label>
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                disabled={selectedCategory !== "all" && selectedCategory !== "kpi"}
                className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed cursor-pointer"
              >
                <option value="all">All KPI Fields</option>
                {Object.entries(fieldLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">General Manager</label>
              <select
                value={selectedGM}
                onChange={(e) => setSelectedGM(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All GMs</option>
                {uniqueGMs.map((gm) => (
                  <option key={gm} value={gm}>{gm}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing <strong>{filteredComments.length}</strong> comment{filteredComments.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={handlePrint}
              disabled={filteredComments.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              <PrinterIcon className="w-5 h-5" />
              Print Report
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            Loading comments...
          </div>
        )}

        {/* Print Preview / Report */}
        {!loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 print:shadow-none print:border-none">
            {/* Print Header */}
            <div className="hidden print:block border-b-2 border-gray-800 pb-4 mb-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">SIR APOLLO KAGGWA SCHOOLS</h1>
                <p className="text-sm text-gray-600 mt-1">COMMENTS & FEEDBACK REPORT</p>
                <div className="mt-3 text-xs text-gray-600">
                  <p>Report Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <p>Period: {new Date(startDate).toLocaleDateString('en-GB')} to {new Date(endDate).toLocaleDateString('en-GB')}</p>
                  {selectedCategory !== "all" && <p>Report Type: {categoryLabels[selectedCategory]}</p>}
                  {selectedField !== "all" && <p>KPI Field: {fieldLabels[selectedField]}</p>}
                  {selectedGM !== "all" && <p>General Manager: {selectedGM}</p>}
                </div>
              </div>
            </div>

            {/* Preview Header */}
            <div className="print:hidden px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Report Preview</h2>
              <p className="text-xs text-gray-500 mt-1">This is how your report will look when printed</p>
            </div>

            {/* Comments List */}
            <div className="p-6">
              {filteredComments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No comments found</p>
                  <p className="text-sm mt-2">Try adjusting your filter criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredComments.map((comment, index) => {
                    const categoryColor = 
                      comment.category === "kpi" ? "border-blue-500" :
                      comment.category === "red-issues" ? "border-red-500" :
                      comment.category === "projects" ? "border-purple-500" :
                      "border-amber-500";

                    const categoryBadge = 
                      comment.category === "kpi" ? "bg-blue-100 text-blue-800" :
                      comment.category === "red-issues" ? "bg-red-100 text-red-800" :
                      comment.category === "projects" ? "bg-purple-100 text-purple-800" :
                      "bg-amber-100 text-amber-800";

                    return (
                      <div key={comment.id} className={`border-l-4 ${categoryColor} pl-4 py-2 page-break-inside-avoid`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 text-xs text-gray-600 mb-1 flex-wrap">
                              <span className="font-semibold text-gray-900">#{index + 1}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${categoryBadge}`}>
                                {categoryLabels[comment.category]}
                              </span>
                              <span>{new Date(comment.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              {comment.category === "kpi" && (
                                <>
                                  <span>•</span>
                                  <span className="font-medium">{fieldLabels[comment.field] || comment.field}</span>
                                </>
                              )}
                              {comment.report && (
                                <>
                                  <span>•</span>
                                  <span>Week {comment.report.weekNumber}, Term {comment.report.term}, {comment.report.year}</span>
                                </>
                              )}
                            </div>
                            
                            {/* Item Details for Red Issues, Projects, Events */}
                            {comment.itemDetails && (
                              <div className="text-xs text-gray-700 mb-2 bg-gray-50 p-2 rounded">
                                <div className="font-semibold text-gray-900">{comment.itemDetails.title}</div>
                                <div className="flex gap-3 mt-1 text-[11px]">
                                  {comment.itemDetails.status && (
                                    <span>Status: <span className="font-medium">{comment.itemDetails.status.replace(/_/g, " ")}</span></span>
                                  )}
                                  {comment.itemDetails.inCharge && (
                                    <span>In-Charge: <span className="font-medium">{comment.itemDetails.inCharge}</span></span>
                                  )}
                                  {comment.itemDetails.date && (
                                    <span>Date: <span className="font-medium">{new Date(comment.itemDetails.date).toLocaleDateString('en-GB')}</span></span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Author Info */}
                            <div className="text-xs text-gray-500 mb-2">
                              {comment.user ? (
                                <span>By: <span className="font-medium text-gray-700">{comment.user.name}</span></span>
                              ) : comment.report?.generalManager ? (
                                <span>By: <span className="font-medium text-gray-700">{comment.report.generalManager}</span></span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        
                        {/* Comment Text */}
                        <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded border border-gray-100">
                          {comment.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Print Footer */}
            <div className="hidden print:block border-t-2 border-gray-800 pt-4 mt-6 text-center text-xs text-gray-600">
              <p>Total Comments: {filteredComments.length}</p>
              <p className="mt-1">--- End of Report ---</p>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 2cm;
            size: A4;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .page-break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
