"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

interface BudgetEntry {
  id: string;
  year: number;
  term: number;
  category: string;
  amount: number;
  notes?: string | null;
}

const currentYear = new Date().getFullYear();
const START_YEAR = 2023;
const availableYears = Array.from(
  { length: currentYear - START_YEAR + 1 },
  (_, i) => currentYear - i
);

export default function BudgetEntryPage() {
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        year: String(selectedYear),
        term: String(selectedTerm),
      });
      const res = await fetch(`/api/budgets?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load budgets");
      }
      const data = await res.json();
      setEntries(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [selectedYear, selectedTerm]);

  const totalBudget = useMemo(
    () => entries.reduce((sum, entry) => sum + (entry.amount || 0), 0),
    [entries]
  );

  const handleSubmit = async () => {
    if (!category.trim()) {
      setError("Category is required");
      return;
    }
    if (!amount.trim()) {
      setError("Amount is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: selectedYear,
          term: selectedTerm,
          category,
          amount,
          notes,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save budget");
      }

      const created = await res.json();
      setEntries((prev) => {
        const existingIndex = prev.findIndex((entry) => entry.id === created.id);
        if (existingIndex >= 0) {
          const copy = [...prev];
          copy[existingIndex] = created;
          return copy;
        }
        return [created, ...prev];
      });
      setCategory("");
      setAmount("");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save budget");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this budget entry?")) return;
    try {
      setError(null);
      const res = await fetch(`/api/budgets?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete budget");
      }
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete budget");
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
              <p className="text-sm font-semibold text-gray-700 mt-1">BUDGET REPORT</p>
            </div>
            <img src="/sak.jpg" alt="SAK" style={{width:"56px",height:"56px",objectFit:"contain"}} />
          </div>
          <div className="text-center text-xs text-gray-600">
            <p>Report Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            <p>Period: Term {selectedTerm}, {selectedYear}</p>
          </div>
        </div>
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Budget Entry</h1>
            <p className="text-gray-600 mt-1">Capture budget allocations by term and category</p>
          </div>
          <button
            onClick={() => window.print()}
            className="print:hidden px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg"
          >
            Print Report
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 border border-gray-200 print:hidden">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Budget Item</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white"
                >
                  {availableYears.map((year) => (
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
                <label className="block text-sm font-semibold text-gray-800 mb-2">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white"
                  placeholder="Salaries, Maintenance, Utilities..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Amount (Ugx)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2">Notes (optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                {saving ? "Saving..." : "Save Budget"}
              </button>
            </div>
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Summary</h2>
            <p className="text-sm text-gray-500 mb-4">Total budget for selected term</p>
            <p className="text-3xl font-bold text-gray-900">Ugx {totalBudget.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Budget Items</h2>
          </div>
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading budgets...</div>
          ) : entries.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No budget items for selected term.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Category</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Amount</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Notes</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-t border-gray-200">
                      <td className="px-4 py-2 text-gray-700">{entry.category}</td>
                      <td className="px-4 py-2 text-gray-700">Ugx {entry.amount.toLocaleString()}</td>
                      <td className="px-4 py-2 text-gray-700">{entry.notes || "—"}</td>
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
