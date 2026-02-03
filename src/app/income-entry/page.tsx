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
  percentage: number;
  year: number;
  month: number;
}

const months = [
  { num: 1, name: "January" },
  { num: 2, name: "February" },
  { num: 3, name: "March" },
  { num: 4, name: "April" },
  { num: 5, name: "May" },
  { num: 6, name: "June" },
  { num: 7, name: "July" },
  { num: 8, name: "August" },
  { num: 9, name: "September" },
  { num: 10, name: "October" },
  { num: 11, name: "November" },
  { num: 12, name: "December" },
];

export default function IncomeEntryPage() {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth() + 1
  );
  const [newSourceName, setNewSourceName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingSource, setAddingSource] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingSourceName, setEditingSourceName] = useState("");
  const [deletingSourceId, setDeletingSourceId] = useState<string | null>(null);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [editingIncomePercentage, setEditingIncomePercentage] = useState("");

  const years = useMemo(
    () => [currentYear, currentYear - 1, currentYear - 2, currentYear - 3],
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
      (inc) => inc.year === selectedYear && inc.month === selectedMonth
    );
    const prefilled = relevant.reduce<Record<string, string>>((acc, inc) => {
      acc[inc.source] = (inc.percentage ?? 0).toString();
      return acc;
    }, {});
    setPercentages(prefilled);
  }, [incomes, selectedMonth, selectedYear]);

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
      setPercentages((prev) => {
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
        setPercentages((prev) => {
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
    setEditingIncomePercentage((income.percentage ?? 0).toString());
  };

  const handleSaveIncomePercentage = async () => {
    if (!editingIncomeId || !editingIncomePercentage.trim()) return;

    try {
      setError(null);
      const percentage = parseFloat(editingIncomePercentage);
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        throw new Error("Invalid percentage (must be 0-100)");
      }

      const res = await fetch("/api/other-income", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingIncomeId,
          percentage,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update percentage");
      }

      setIncomes((prev) =>
        prev.map((inc) =>
          inc.id === editingIncomeId ? { ...inc, percentage } : inc
        )
      );

      setEditingIncomeId(null);
      setEditingIncomePercentage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update percentage");
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

  const handlePercentageChange = (source: string, value: string) => {
    setPercentages((prev) => ({ ...prev, [source]: value }));
  };

  const handleSaveIncomes = async () => {
    const entries = sources
      .map((source) => ({ source: source.name, raw: percentages[source.name] }))
      .filter((item) => item.raw !== undefined && item.raw !== "");

    if (!entries.length) {
      setError("Please enter at least one percentage");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payloads = entries.map((item) => {
        const value = parseFloat(item.raw || "0");
        if (Number.isNaN(value) || value < 0 || value > 100) {
          throw new Error(`Invalid percentage for ${item.source} (must be 0-100)`);
        }
        const existing = incomes.find(
          (inc) =>
            inc.source === item.source &&
            inc.year === selectedYear &&
            inc.month === selectedMonth
        );
        return { source: item.source, percentage: value, existing };
      });

      await Promise.all(
        payloads.map(({ source, percentage, existing }) => {
          if (existing) {
            return fetch("/api/other-income", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: existing.id,
                source,
                percentage,
                year: selectedYear,
                month: selectedMonth,
              }),
            });
          }

          return fetch("/api/other-income", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              source,
              percentage,
              year: selectedYear,
              month: selectedMonth,
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
      setPercentages({});
      setError(null);
      alert("Income entries saved successfully");
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
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-4 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
              >
                {months.map((m) => (
                  <option key={m.num} value={m.num}>
                    {m.name}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {sources.map((source) => (
                  <div key={source.id} className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-900 mb-2">
                      {source.name}
                    </label>
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
                      className="px-4 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveIncomes}
                disabled={saving}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                Save Income for {months.find((m) => m.num === selectedMonth)?.name}{" "}
                {selectedYear}
              </button>
            </>
          )}
        </div>

        {Object.entries(groupedIncomes)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([yearKey, yearIncomes]) => {
            const monthlyData = yearIncomes.reduce<Record<number, IncomeEntry[]>>(
              (acc, inc) => {
                if (!acc[inc.month]) acc[inc.month] = [];
                acc[inc.month].push(inc);
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
                {Object.entries(monthlyData)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([monthNum, monthIncomes]) => {
                    const monthName = months.find(
                      (m) => m.num === Number(monthNum)
                    )?.name;
                    const total = monthIncomes.reduce(
                      (sum, inc) => sum + (inc.percentage ?? 0),
                      0
                    );
                    const average = monthIncomes.length > 0 ? total / monthIncomes.length : 0;

                    return (
                      <div
                        key={monthNum}
                        className="mb-4 border-b border-gray-200 pb-4 last:border-0"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-900">{monthName}</h4>
                          <span className="text-sm font-semibold text-blue-600">
                            Average: {average.toFixed(1)}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {monthIncomes.map((inc) => (
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
                                    value={editingIncomePercentage}
                                    onChange={(e) => setEditingIncomePercentage(e.target.value)}
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    className="flex-1 px-1 py-0.5 border border-blue-400 rounded text-xs font-semibold text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSaveIncomePercentage();
                                      if (e.key === "Escape") setEditingIncomeId(null);
                                    }}
                                  />
                                  <button
                                    onClick={handleSaveIncomePercentage}
                                    className="px-1 py-0.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
                                  >
                                    ✓
                                  </button>
                                </div>
                              ) : (
                                <p className="text-sm font-semibold text-gray-900">
                                  {(inc.percentage ?? 0).toFixed(1)}%
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
