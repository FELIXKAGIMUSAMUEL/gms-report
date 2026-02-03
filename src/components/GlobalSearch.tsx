"use client";

import { useState, useEffect, useRef } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface SearchResult {
  reports: Array<{
    id: string;
    weekNumber: number;
    year: number;
    term: number;
    feesCollectionPercent: number;
    totalEnrollment: number;
  }>;
  issues: Array<{
    id: string;
    issue: string;
    status?: string;
  }>;
  events: Array<{
    id: string;
    activity: string;
    date: string;
    inCharge: string;
  }>;
  projects: Array<{
    id: string;
    projectName: string;
    status: string;
  }>;
  schools: Array<{
    id: string;
    name: string;
  }>;
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search with debounce
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
    setResults(null);
  };

  const navigateTo = (path: string) => {
    handleClose();
    router.push(path);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        title="Search (Cmd/Ctrl + K)"
      >
        <MagnifyingGlassIcon className="w-5 h-5" />
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleClose}
      />

      {/* Search Modal */}
      <div className="fixed inset-x-4 top-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-50">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reports, issues, events, projects, schools..."
              className="flex-1 text-sm outline-none"
            />
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Searching...
              </div>
            )}

            {!loading && query.length < 2 && (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Type at least 2 characters to search
              </div>
            )}

            {!loading && query.length >= 2 && results && (
              <div className="py-2">
                {/* Weekly Reports */}
                {results.reports.length > 0 && (
                  <div className="mb-4">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Weekly Reports ({results.reports.length})
                    </div>
                    {results.reports.map((report) => (
                      <button
                        key={report.id}
                        onClick={() => navigateTo(`/dashboard?year=${report.year}&term=${report.term}&week=${report.weekNumber}`)}
                        className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          Week {report.weekNumber}, {report.year} - Term {report.term}
                        </div>
                        <div className="text-xs text-gray-500">
                          Enrollment: {report.totalEnrollment} • Fees: {report.feesCollectionPercent}%
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Red Issues */}
                {results.issues.length > 0 && (
                  <div className="mb-4">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Red Issues ({results.issues.length})
                    </div>
                    {results.issues.map((issue) => (
                      <button
                        key={issue.id}
                        onClick={() => navigateTo("/issues-entry")}
                        className="w-full px-4 py-2 text-left hover:bg-red-50 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {issue.issue || "Untitled Issue"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Status: {issue.status || "Open"}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Events */}
                {results.events.length > 0 && (
                  <div className="mb-4">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Upcoming Events ({results.events.length})
                    </div>
                    {results.events.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => navigateTo("/events-entry")}
                        className="w-full px-4 py-2 text-left hover:bg-green-50 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {event.activity}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(event.date).toLocaleDateString()} • {event.inCharge}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Projects */}
                {results.projects.length > 0 && (
                  <div className="mb-4">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Projects ({results.projects.length})
                    </div>
                    {results.projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => navigateTo("/projects-entry")}
                        className="w-full px-4 py-2 text-left hover:bg-purple-50 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {project.projectName}
                        </div>
                        <div className="text-xs text-gray-500">
                          Status: {project.status}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Schools */}
                {results.schools.length > 0 && (
                  <div className="mb-4">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Schools ({results.schools.length})
                    </div>
                    {results.schools.map((school) => (
                      <button
                        key={school.id}
                        onClick={() => navigateTo("/scorecard-entry")}
                        className="w-full px-4 py-2 text-left hover:bg-yellow-50 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {school.name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* No results */}
                {results.reports.length === 0 &&
                  results.issues.length === 0 &&
                  results.events.length === 0 &&
                  results.projects.length === 0 &&
                  results.schools.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">
                      No results found for &quot;{query}&quot;
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
