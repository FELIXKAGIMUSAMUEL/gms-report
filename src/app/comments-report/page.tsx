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
  kpiValue?: {
    label: string;
    value: string;
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
  const [selectedUserType, setSelectedUserType] = useState("all");
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    setCurrentPage(1); // Reset to first page when filters change
  }, [comments, startDate, endDate, selectedUserType]);

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

    // Filter by user type
    if (selectedUserType === "trustees") {
      filtered = filtered.filter(c => c.user !== null && c.user !== undefined);
    } else if (selectedUserType === "gm") {
      filtered = filtered.filter(c => !c.user && c.report?.generalManager);
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredComments(filtered);
  };

  const handlePrint = () => {
    window.print();
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredComments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedComments = filteredComments.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="block text-sm font-semibold text-gray-900 mb-2">Filter by User</label>
              <select
                value={selectedUserType}
                onChange={(e) => setSelectedUserType(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All Users</option>
                <option value="trustees">Trustees Only</option>
                <option value="gm">General Manager Only</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing <strong>{startIndex + 1}-{Math.min(endIndex, filteredComments.length)}</strong> of <strong>{filteredComments.length}</strong> comment{filteredComments.length !== 1 ? 's' : ''}
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
              <div className="flex items-center justify-center gap-4 mb-3">
                <img src="/sak.jpg" alt="SAK" style={{width:"56px",height:"56px",objectFit:"contain"}} />
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900">SIR APOLLO KAGGWA SCHOOLS</h1>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Since 1996</p>
                  <p className="text-sm font-semibold text-gray-700 mt-1">COMMENTS &amp; FEEDBACK REPORT</p>
                </div>
                <img src="/sak.jpg" alt="SAK" style={{width:"56px",height:"56px",objectFit:"contain"}} />
              </div>
              <div className="text-center text-xs text-gray-600">
                <p>Report Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                <p>Period: {new Date(startDate).toLocaleDateString('en-GB')} to {new Date(endDate).toLocaleDateString('en-GB')}</p>
                {selectedUserType !== "all" && (
                  <p>Filter: {selectedUserType === "trustees" ? "Trustees Only" : "General Managers Only"}</p>
                )}
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
                  {paginatedComments.map((comment, index) => {
                    const globalIndex = startIndex + index;
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

                    const categoryLabel = 
                      comment.category === "kpi" ? "KPI" :
                      comment.category === "red-issues" ? "Red Issue" :
                      comment.category === "projects" ? "Project" :
                      "Event";

                    const fieldLabel = 
                      comment.field === "feesComment" ? "Fees Collection" :
                      comment.field === "expenditureComment" ? "Expenditure" :
                      comment.field === "infrastructureComment" ? "Infrastructure" :
                      comment.field === "enrollmentComment" ? "Enrollment" :
                      comment.field === "theologyComment" ? "Theology Enrollment" :
                      comment.field === "p7prepComment" ? "P.7 Prep" :
                      comment.field === "syllabusComment" ? "Syllabus Coverage" :
                      comment.field === "admissionsComment" ? "Admissions" :
                      comment.field;

                    return (
                      <div key={comment.id} className={`border-l-4 ${categoryColor} pl-4 py-2 page-break-inside-avoid`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 text-xs text-gray-600 mb-1 flex-wrap">
                              <span className="font-semibold text-gray-900">#{globalIndex + 1}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${categoryBadge}`}>
                                {categoryLabel}
                              </span>
                              <span>{new Date(comment.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              {comment.category === "kpi" && (
                                <>
                                  <span>•</span>
                                  <span className="font-medium">{fieldLabel}</span>
                                </>
                              )}
                              {comment.report && (
                                <>
                                  <span>•</span>
                                  <span>Week {comment.report.weekNumber}, Term {comment.report.term}, {comment.report.year}</span>
                                </>
                              )}
                            </div>
                            
                            {/* KPI Value Details */}
                            {comment.kpiValue && (
                              <div className="text-xs text-gray-700 mb-2 bg-blue-50 p-2 rounded border border-blue-200">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-blue-900">{comment.kpiValue.label}:</span>
                                  <span className="text-lg font-bold text-blue-700">{comment.kpiValue.value}</span>
                                </div>
                              </div>
                            )}

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

              {/* Pagination Controls */}
              {filteredComments.length > itemsPerPage && (
                <div className="mt-6 flex items-center justify-center gap-2 print:hidden">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {/* First page */}
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

                    {/* Page numbers around current page */}
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

                    {/* Last page */}
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && <span className="px-2 text-gray-500">...</span>}
                        <button
                          onClick={() => goToPage(totalPages)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
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
            margin: 1.5cm;
            size: A4;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            font-size: 12pt !important;
          }

          .page-break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Increase font sizes for print */
          h1 {
            font-size: 20pt !important;
          }

          h2 {
            font-size: 16pt !important;
          }

          p, span, div {
            font-size: 11pt !important;
          }

          .text-xs, .text-sm {
            font-size: 10pt !important;
          }

          .text-lg {
            font-size: 14pt !important;
          }

          .text-2xl {
            font-size: 18pt !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
