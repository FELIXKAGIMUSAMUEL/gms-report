"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

interface FinancialEntry {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  year: number;
  term: number;
  month: number;
  week: number | null;
  school?: string | null;
  source?: string | null;
  category?: string | null;
  notes?: string | null;
}

interface School {
  id: string;
  name: string;
}

interface IncomeSource {
  id: string;
  name: string;
}

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const weeks = Array.from({ length: 14 }, (_, i) => ({ value: i + 1, label: `Week ${i + 1}` }));

export default function FinancialEntryPage() {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const START_YEAR = 2023;
  const years = useMemo(
    () => Array.from({ length: currentYear - START_YEAR + 1 }, (_, i) => currentYear - i),
    [currentYear]
  );

  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    type: "INCOME",
    amount: "",
    year: currentYear,
    term: 1,
    month: new Date().getMonth() + 1,
    week: "",
    school: "",
    source: "",
    category: "",
    notes: "",
  });

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        year: String(selectedYear),
        term: String(selectedTerm),
        month: String(selectedMonth),
      });
      const res = await fetch(`/api/financial-entries?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load financial entries");
      }
      const data = await res.json();
      setEntries(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries");
    } finally {
      setLoading(false);
    }
  };

  const loadDropdownData = async () => {
    try {
      const [schoolsRes, sourcesRes] = await Promise.all([
        fetch("/api/schools"),
        fetch("/api/income-sources"),
      ]);

      if (schoolsRes.ok) {
        const data = await schoolsRes.json();
        setSchools(data.data || []);
      }

      if (sourcesRes.ok) {
        const data = await sourcesRes.json();
        setIncomeSources(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load dropdown data:", err);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [selectedYear, selectedTerm, selectedMonth]);

  useEffect(() => {
    loadDropdownData();
  }, []);

  const handleChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        type: form.type,
        amount: form.amount,
        year: form.year,
        term: form.term,
        month: form.month,
        week: form.week ? Number(form.week) : null,
        school: form.school,
        source: form.type === "INCOME" ? form.source : null,
        category: form.type === "EXPENSE" ? form.category : null,
        notes: form.notes,
      };

      const res = await fetch("/api/financial-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create entry");
      }

      const created = await res.json();
      setEntries((prev) => [created, ...prev]);
      setForm((prev) => ({
        ...prev,
        amount: "",
        school: "",
        source: "",
        category: "",
        notes: "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      setError(null);
      const res = await fetch(`/api/financial-entries?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete entry");
      }
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    }
  };

  return (
    <DashboardLayout>
      <style jsx global>{`
        @media print {
          @page {
            size: portrait;
            margin: 1cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
        }
      `}</style>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="hidden print:block border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex items-center justify-center gap-4 mb-3">
            <img src="/sak.jpg" alt="SAK" style={{width:"56px",height:"56px",objectFit:"contain"}} />
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">SIR APOLLO KAGGWA SCHOOLS</h1>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Since 1996</p>
              <p className="text-sm font-semibold text-gray-700 mt-1">INCOME &amp; EXPENDITURE REPORT</p>
            </div>
            <img src="/sak.jpg" alt="SAK" style={{width:"56px",height:"56px",objectFit:"contain"}} />
          </div>
          <div className="text-center text-xs text-gray-600">
            <p>Report Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            <p>Period: Term {selectedTerm}, {selectedYear} &middot; {months[selectedMonth - 1]}</p>
          </div>
        </div>
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Entry</h1>
            <p className="text-gray-600 mt-1">Enter income and expense amounts by period</p>
          </div>
          <button
            onClick={() => window.print()}
            className="print:hidden px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg"
          >
            Print Report
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print:hidden">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Entry</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => handleChange("type", e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white"
                >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Amount (Ugx)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => handleChange("amount", e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Year</label>
                <select
                  value={form.year}
                  onChange={(e) => handleChange("year", Number(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Term</label>
                <select
                  value={form.term}
                  onChange={(e) => handleChange("term", Number(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white"
                >
                  {[1, 2, 3].map((term) => (
                    <option key={term} value={term}>Term {term}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Month</label>
                <select
                  value={form.month}
                  onChange={(e) => handleChange("month", Number(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white"
                >
                  {months.map((label, idx) => (
                    <option key={label} value={idx + 1}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Week (optional)</label>
                <select
                  value={form.week}
                  onChange={(e) => handleChange("week", e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white"
                >
                  <option value="">Select week</option>
                  {weeks.map((week) => (
                    <option key={week.value} value={week.value}>
                      {week.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">School (optional)</label>
                <select
                  value={form.school}
                  onChange={(e) => handleChange("school", e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white"
                >
                  <option value="">Select school</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.name}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>
              {form.type === "INCOME" ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Income Source</label>
                  <select
                    value={form.source}
                    onChange={(e) => handleChange("source", e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white"
                  >
                    <option value="">Select source</option>
                    {incomeSources.map((source) => (
                      <option key={source.id} value={source.name}>
                        {source.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Expense Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white"
                  />
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2">Notes (optional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white"
                />
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-semibold rounded-lg"
              >
                <PlusIcon className="w-4 h-4" />
                {saving ? "Saving..." : "Add Entry"}
              </button>
            </div>
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Term</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(Number(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white"
                >
                  {[1, 2, 3].map((term) => (
                    <option key={term} value={term}>Term {term}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white"
                >
                  {months.map((label, idx) => (
                    <option key={label} value={idx + 1}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Entries</h2>
          </div>
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading entries...</div>
          ) : entries.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No entries found for selected period.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Type</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Amount</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">School</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Source/Category</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Term</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Month</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Week</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-t border-gray-200">
                      <td className="px-4 py-2 text-gray-700">{entry.type}</td>
                      <td className="px-4 py-2 text-gray-700">Ugx {entry.amount.toLocaleString()}</td>
                      <td className="px-4 py-2 text-gray-700">{entry.school || "—"}</td>
                      <td className="px-4 py-2 text-gray-700">
                        {entry.type === "INCOME" ? (entry.source || "—") : (entry.category || "—")}
                      </td>
                      <td className="px-4 py-2 text-gray-700">{entry.term}</td>
                      <td className="px-4 py-2 text-gray-700">{months[entry.month - 1]}</td>
                      <td className="px-4 py-2 text-gray-700">{entry.week || "—"}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
