"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PlusIcon, TrashIcon, PencilSquareIcon } from "@heroicons/react/24/outline";

interface IncomeSource {
  id: string;
  name: string;
}

interface IncomeEntry {
  id: string;
  source: string;
  amount: number;
  percentage: number; // Legacy field
  year: number;
  month: number;
  term: number;
  week: number | null;
}

const terms = [
  { num: 1, name: "Term 1" },
  { num: 2, name: "Term 2" },
  { num: 3, name: "Term 3" },
];

const weeks = Array.from({ length: 14 }, (_, i) => ({ num: i + 1, name: `Week ${i + 1}` }));

export default function IncomeEntryPage() {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const START_YEAR = 2023;
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [newSourceName, setNewSourceName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingSource, setAddingSource] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingSourceName, setEditingSourceName] = useState("");
  const [deletingSourceId, setDeletingSourceId] = useState<string | null>(null);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [editingIncomeAmount, setEditingIncomeAmount] = useState("");

  const years = useMemo(
    () => Array.from({ length: currentYear - START_YEAR + 1 }, (_, i) => currentYear - i),
    [currentYear]
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [srcRes, incomeRes] = await Promise.all([
          fetch("/api/income-sources"),
          fetch("/api/other-income"),
        ]);

        if (!srcRes.ok) {
          const errBody = await srcRes.json().catch(() => ({}));
          console.error("Income sources error:", srcRes.status, errBody);
          throw new Error(`Failed to load income sources: ${srcRes.status}`);
        }
        if (!incomeRes.ok) {
          const errBody = await incomeRes.json().catch(() => ({}));
          console.error("Other income error:", incomeRes.status, errBody);
          throw new Error(`Failed to load incomes: ${incomeRes.status}`);
        }

        const srcJson = await srcRes.json();
        const incomeJson = await incomeRes.json();
        console.log("Loaded sources:", srcJson);
        console.log("Loaded incomes:", incomeJson);
        setSources(srcJson.data || srcJson || []);
        setIncomes(incomeJson.data || incomeJson || []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load data";
        console.error("Load error:", msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const relevant = incomes.filter(
      (inc) => {
        const matchYear = inc.year === selectedYear;
        const matchTerm = (inc as any).term === selectedTerm;
        const matchWeek = selectedWeek === null || (inc as any).week === selectedWeek;
        return matchYear && matchTerm && matchWeek;
      }
    );
    const prefilled = relevant.reduce<Record<string, string>>((acc, inc) => {
      acc[inc.source] = ((inc as any).amount || inc.percentage || 0).toString();
      return acc;
    }, {});
    setAmounts(prefilled);
  }, [incomes, selectedTerm, selectedWeek, selectedYear]);

  const groupedIncomes = useMemo(() => {
    return incomes.reduce<Record<string, IncomeEntry[]>>((acc, inc) => {
      const key = `${inc.year}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(inc);
      return acc;
    }, {});
  }, [incomes]);

  const handleAddSource = async () => {
    const name = newSourceName.trim();
    if (!name) return;

    try {
      setAddingSource(true);
      setError(null);
      const res = await fetch("/api/income-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to add source");
      }

      const created = await res.json();
      setSources((prev) => [...prev, created]);
      setNewSourceName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add source");
    } finally {
      setAddingSource(false);
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      setError(null);
      const res = await fetch("/api/income-sources", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete source");
      }

      setSources((prev) => prev.filter((s) => s.id !== id));
      setAmounts((prev) => {
        const copy = { ...prev };
        const removed = sources.find((s) => s.id === id)?.name;
        if (removed) delete copy[removed];
        return copy;
      });
      setDeletingSourceId(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete income source"
      );
    }
  };

  const handleEditSource = (source: IncomeSource) => {
    setEditingSourceId(source.id);
    setEditingSourceName(source.name);
  };

  const handleSaveSourceName = async () => {
    if (!editingSourceId || !editingSourceName.trim()) return;

    try {
      setError(null);
      const oldSource = sources.find((s) => s.id === editingSourceId);
      if (!oldSource) throw new Error("Source not found");

      // For now, we just update the local state
      // In a real app, you'd want to add an API endpoint to update source names
      setSources((prev) =>
        prev.map((s) =>
          s.id === editingSourceId ? { ...s, name: editingSourceName.trim() } : s
        )
      );

      if (oldSource.name !== editingSourceName.trim()) {
        setAmounts((prev) => {
          const copy = { ...prev };
          copy[editingSourceName.trim()] = copy[oldSource.name] || "";
          delete copy[oldSource.name];
          return copy;
        });
      }

      setEditingSourceId(null);
      setEditingSourceName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update source");
    }
  };

  const handleEditIncome = (income: IncomeEntry) => {
    setEditingIncomeId(income.id);
    setEditingIncomeAmount(((income as any).amount || income.percentage || 0).toString());
  };

  const handleSaveIncomeAmount = async () => {
    if (!editingIncomeId || !editingIncomeAmount.trim()) return;

    try {
      setError(null);
      const amount = parseFloat(editingIncomeAmount);
      if (isNaN(amount) || amount < 0) {
        throw new Error("Invalid amount (must be positive number)");
      }

      const res = await fetch("/api/other-income", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingIncomeId,
          amount,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update amount");
      }

      setIncomes((prev) =>
        prev.map((inc) =>
          inc.id === editingIncomeId ? { ...inc, amount, percentage: 0 } as any : inc
        )
      );

      setEditingIncomeId(null);
      setEditingIncomeAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update amount");
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    if (!confirm("Delete this income entry?")) return;

    try {
      setError(null);
      const res = await fetch("/api/other-income", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: incomeId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete entry");
      }

      setIncomes((prev) => prev.filter((inc) => inc.id !== incomeId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete income entry");
    }
  };

  const handleAmountChange = (source: string, value: string) => {
    setAmounts((prev) => ({ ...prev, [source]: value }));
  };

  const handlePercentageChange = (source: string, value: string) => {
    setPercentages((prev) => ({ ...prev, [source]: value }));
  };

  const handleClearPeriod = async (term: number, week: number | null, yearKey: string) => {
    const confirmMsg = week 
      ? `Delete all income entries for Term ${term}, Week ${week} in ${yearKey}?`
      : `Delete all income entries for Term ${term} in ${yearKey}?`;
    
    if (!confirm(confirmMsg)) return;

    try {
      setError(null);
      const toDelete = incomes.filter(inc => {
        const matchYear = inc.year === parseInt(yearKey);
        const matchTerm = (inc as any).term === term;
        const matchWeek = week === null 
          ? (inc as any).week === null 
          : (inc as any).week === week;
        return matchYear && matchTerm && matchWeek;
      });

      await Promise.all(
        toDelete.map(inc =>
          fetch("/api/other-income", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: inc.id }),
          })
        )
      );

      setIncomes(prev => prev.filter(inc => !toDelete.find(d => d.id === inc.id)));
      alert(`Cleared ${toDelete.length} entries successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear entries");
    }
  };

  const handleSaveIncomes = async () => {
    const entries = sources
      .map((source) => ({ 
        source: source.name, 
        rawAmount: amounts[source.name],
        rawPercentage: percentages[source.name] 
      }))
      .filter((item) => (item.rawAmount !== undefined && item.rawAmount !== "") || (item.rawPercentage !== undefined && item.rawPercentage !== ""));

    if (!entries.length) {
      setError("Please enter at least one amount or percentage");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      let updatedCount = 0;
      let createdCount = 0;

      const payloads = entries.map((item) => {
        const amount = item.rawAmount ? parseFloat(item.rawAmount) : 0;
        const percentage = item.rawPercentage ? parseFloat(item.rawPercentage) : 0;
        
        if (item.rawAmount && (Number.isNaN(amount) || amount < 0)) {
          throw new Error(`Invalid amount for ${item.source} (must be >= 0)`);
        }
        if (item.rawPercentage && (Number.isNaN(percentage) || percentage < 0 || percentage > 100)) {
          throw new Error(`Invalid percentage for ${item.source} (must be 0-100)`);
        }
        
        const existing = incomes.find(
          (inc) => {
            const matchSource = inc.source === item.source;
            const matchYear = inc.year === selectedYear;
            const matchTerm = (inc as any).term === selectedTerm;
            const matchWeek = selectedWeek === null 
              ? (inc as any).week === null 
              : (inc as any).week === selectedWeek;
            return matchSource && matchYear && matchTerm && matchWeek;
          }
        );
        return { source: item.source, amount, percentage, existing };
      });

      await Promise.all(
        payloads.map(async ({ source, amount, percentage, existing }) => {
          if (existing) {
            updatedCount++;
            return fetch("/api/other-income", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: existing.id,
                source,
                amount,
                percentage,
                year: selectedYear,
                term: selectedTerm,
                week: selectedWeek,
              }),
            });
          }

          createdCount++;
          return fetch("/api/other-income", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              source,
              amount,
              percentage,
              year: selectedYear,
              month: new Date().getMonth() + 1, // Keep month for backward compatibility
              term: selectedTerm,
              week: selectedWeek,
            }),
          });
        })
      );

      const refreshed = await fetch("/api/other-income");
      if (!refreshed.ok) {
        throw new Error("Failed to refresh incomes");
      }
      const refreshedJson = await refreshed.json();
      setIncomes(refreshedJson.data || refreshedJson || []);
      setAmounts({});
      setPercentages({});
      setError(null);
      
      const message = [];
      if (createdCount > 0) message.push(`${createdCount} new`);
      if (updatedCount > 0) message.push(`${updatedCount} updated`);
      alert(`Income entries saved: ${message.join(', ')}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save incomes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Income Management</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Income Sources</h2>
              <p className="text-sm text-gray-600">
                Add sources here before recording percentages.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                placeholder="e.g., Swimming, Uniforms, Transportation"
                className="flex-1 px-4 py-2 border-2 border-gray-400 rounded-lg text-sm bg-white font-medium text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleAddSource()}
              />
              <button
                onClick={handleAddSource}
                disabled={addingSource}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add Source
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                {editingSourceId === source.id ? (
                  <>
                    <input
                      type="text"
                      value={editingSourceName}
                      onChange={(e) => setEditingSourceName(e.target.value)}
                      className="px-2 py-1 border-2 border-blue-400 rounded text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveSourceName();
                        if (e.key === "Escape") setEditingSourceId(null);
                      }}
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={handleSaveSourceName}
                        className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingSourceId(null)}
                        className="flex-1 px-2 py-1 bg-gray-400 text-white rounded text-xs font-medium hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium text-gray-900 mb-2">
                      {source.name}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditSource(source)}
                        className="flex-1 p-1 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors flex items-center justify-center gap-1"
                        title="Edit"
                      >
                        <PencilSquareIcon className="w-3 h-3" />
                        <span className="text-xs">Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          setDeletingSourceId(source.id);
                          if (confirm(`Delete "${source.name}"?`)) {
                            handleDeleteSource(source.id);
                          } else {
                            setDeletingSourceId(null);
                          }
                        }}
                        disabled={deletingSourceId === source.id}
                        className="flex-1 p-1 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors disabled:text-gray-400 disabled:bg-gray-100 flex items-center justify-center gap-1"
                        title="Delete"
                      >
                        <TrashIcon className="w-3 h-3" />
                        <span className="text-xs">Delete</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          {sources.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No income sources added yet
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Term
              </label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(Number(e.target.value))}
                className="px-4 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
              >
                {terms.map((t) => (
                  <option key={t.num} value={t.num}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Week <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <select
                value={selectedWeek ?? ''}
                onChange={(e) => setSelectedWeek(e.target.value ? Number(e.target.value) : null)}
                className="px-4 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="">All Weeks</option>
                {weeks.map((w) => (
                  <option key={w.num} value={w.num}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {sources.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Please add income sources first
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {sources.map((source) => {
                  const existingEntry = incomes.find(
                    (inc) =>
                      inc.source === source.name &&
                      inc.year === selectedYear &&
                      (inc as any).term === selectedTerm &&
                      ((selectedWeek === null && (inc as any).week === null) ||
                       (inc as any).week === selectedWeek)
                  );
                  return (
                  <div key={source.id} className="flex flex-col p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
                      <span>{source.name}</span>
                      {existingEntry && (
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                          Has Data
                        </span>
                      )}
                    </label>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Amount (UGX) <span className="text-gray-400">- Optional</span></label>
                        <input
                          type="number"
                          value={amounts[source.name] || ""}
                          onChange={(e) =>
                            handleAmountChange(source.name, e.target.value)
                          }
                          placeholder="0"
                          min="0"
                          step="1"
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Percentage (%) <span className="text-gray-400">- Optional</span></label>
                        <input
                          type="number"
                          value={percentages[source.name] || ""}
                          onChange={(e) =>
                            handlePercentageChange(source.name, e.target.value)
                          }
                          placeholder="0.0"
                          min="0"
                          max="100"
                          step="0.1"
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              <button
                onClick={handleSaveIncomes}
                disabled={saving}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                {(() => {
                  const hasAnyDataForPeriod = sources.some((source) =>
                    incomes.find(
                      (inc) =>
                        inc.source === source.name &&
                        inc.year === selectedYear &&
                        (inc as any).term === selectedTerm &&
                        ((selectedWeek === null && (inc as any).week === null) ||
                         (inc as any).week === selectedWeek)
                    )
                  );
                  return hasAnyDataForPeriod
                    ? `Update Income for Term ${selectedTerm}${selectedWeek ? `, Week ${selectedWeek}` : ''} ${selectedYear}`
                    : `Save Income for Term ${selectedTerm}${selectedWeek ? `, Week ${selectedWeek}` : ''} ${selectedYear}`;
                })()}
              </button>
            </>
          )}
        </div>

        {Object.entries(groupedIncomes)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([yearKey, yearIncomes]) => {
            const termData = yearIncomes.reduce<Record<string, IncomeEntry[]>>(
              (acc, inc) => {
                const term = (inc as any).term || 1;
                const week = (inc as any).week;
                const key = week ? `${term}-${week}` : `${term}`;
                if (!acc[key]) acc[key] = [];
                acc[key].push(inc);
                return acc;
              },
              {}
            );

            const hasInvalidPercentages = yearIncomes.some(inc => (inc.percentage ?? 0) > 100);

            return (
              <div
                key={yearKey}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Year {yearKey}
                </h3>
                {hasInvalidPercentages && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Warning:</strong> Some entries exceed 100%. These may be old monetary amounts. 
                      Please delete invalid entries and re-enter correct percentages (0-100%).
                    </p>
                  </div>
                )}
                {Object.entries(termData)
                  .sort(([a], [b]) => {
                    const [termA, weekA] = a.split('-').map(Number);
                    const [termB, weekB] = b.split('-').map(Number);
                    if (termA !== termB) return termB - termA;
                    return (weekB || 0) - (weekA || 0);
                  })
                  .map(([termKey, termIncomes]) => {
                    const [term, week] = termKey.split('-').map(Number);
                    const displayName = week ? `Term ${term}, Week ${week}` : `Term ${term}`;
                    const totalAmount = termIncomes.reduce(
                      (sum, inc) => sum + ((inc as any).amount || 0),
                      0
                    );
                    const totalPercentage = termIncomes.reduce(
                      (sum, inc) => sum + (inc.percentage || 0),
                      0
                    );
                    const avgPercentage = termIncomes.length > 0 ? totalPercentage / termIncomes.length : 0;

                    return (
                      <div
                        key={termKey}
                        className="mb-4 border-b border-gray-200 pb-4 last:border-0"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-900">{displayName}</h4>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-blue-600">
                              Total: {totalAmount.toLocaleString()} UGX
                            </span>
                            <span className="text-sm font-semibold text-green-600">
                              Avg %: {avgPercentage.toFixed(1)}%
                            </span>
                            <button
                              onClick={() => handleClearPeriod(term, week || null, yearKey)}
                              className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
                              title="Delete all entries for this period"
                            >
                              <TrashIcon className="w-3 h-3" />
                              Clear All
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {termIncomes.map((inc) => (
                            <div key={inc.id} className="p-2 bg-gray-50 rounded border border-gray-200 hover:border-gray-300 transition-colors">
                              <div className="flex items-start justify-between gap-1 mb-1">
                                <p className="text-xs text-gray-600">{inc.source}</p>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleEditIncome(inc)}
                                    className="p-0.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Edit"
                                  >
                                    <PencilSquareIcon className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteIncome(inc.id)}
                                    className="p-0.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete"
                                  >
                                    <TrashIcon className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              {editingIncomeId === inc.id ? (
                                <div className="flex gap-1">
                                  <input
                                    type="number"
                                    value={editingIncomeAmount}
                                    onChange={(e) => setEditingIncomeAmount(e.target.value)}
                                    min="0"
                                    step="1"
                                    className="flex-1 px-1 py-0.5 border border-blue-400 rounded text-xs font-semibold text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSaveIncomeAmount();
                                      if (e.key === "Escape") setEditingIncomeId(null);
                                    }}
                                  />
                                  <button
                                    onClick={handleSaveIncomeAmount}
                                    className="px-1 py-0.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
                                  >
                                    ✓
                                  </button>
                                </div>
                              ) : (
                                <p className="text-sm font-semibold text-gray-900">
                                  {((inc as any).amount || inc.percentage || 0).toLocaleString()} UGX
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })}
      </div>
    </DashboardLayout>
  );
}
