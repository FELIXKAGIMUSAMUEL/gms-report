"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

const currentYear = new Date().getFullYear();
const TERM_OPTIONS = [1, 2, 3];
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
const CLASS_OPTIONS = ["", "KG1", "KG2", "KG3", "P.1", "P.2", "P.3", "P.4", "P.5", "P.6", "P.7"];

interface School {
  id: string;
  name: string;
}

interface EnrollmentType {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { records: number };
}

interface DynamicEnrollment {
  id: string;
  enrollmentTypeId: string;
  school: string;
  class: string;
  year: number;
  term: number;
  count: number;
  createdAt: string;
  updatedAt: string;
}

export default function EnrollmentTypesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [types, setTypes] = useState<EnrollmentType[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  // Add new type
  const [newTypeName, setNewTypeName] = useState("");
  const [addingType, setAddingType] = useState(false);

  // Inline rename
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [savingRename, setSavingRename] = useState(false);

  // Per-type records panel
  const [expandedTypeId, setExpandedTypeId] = useState<string | null>(null);
  const [records, setRecords] = useState<DynamicEnrollment[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Filter state inside expanded panel
  const [filterSchool, setFilterSchool] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");

  // New record entry form
  const [newYear, setNewYear] = useState(currentYear);
  const [newTerm, setNewTerm] = useState(1);
  const [newSchool, setNewSchool] = useState("");
  const [newClass, setNewClass] = useState("");
  const [newCount, setNewCount] = useState(0);
  const [savingRecord, setSavingRecord] = useState(false);

  // Inline record edit
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<Partial<DynamicEnrollment>>({});
  const [savingRecordEdit, setSavingRecordEdit] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/enrollment-types?all=true");
      if (res.ok) {
        const data = await res.json();
        setTypes(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSchools = useCallback(async () => {
    try {
      const res = await fetch("/api/schools");
      if (res.ok) {
        const data = await res.json();
        setSchools(data.data || []);
      }
    } catch {/* ignore */}
  }, []);

  useEffect(() => {
    if (status === "authenticated") { fetchTypes(); fetchSchools(); }
  }, [status, fetchTypes, fetchSchools]);

  const handleAddType = async () => {
    if (!newTypeName.trim()) return;
    setAddingType(true);
    try {
      const res = await fetch("/api/enrollment-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTypeName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to add type");
        return;
      }
      setNewTypeName("");
      await fetchTypes();
    } finally {
      setAddingType(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!editingName.trim()) return;
    setSavingRename(true);
    try {
      const res = await fetch("/api/enrollment-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editingName }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to rename");
        return;
      }
      setEditingId(null);
      await fetchTypes();
    } finally {
      setSavingRename(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const res = await fetch("/api/enrollment-types", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !currentActive }),
    });
    if (res.ok) await fetchTypes();
    else alert("Failed to update status");
  };

  const fetchRecords = useCallback(async (typeId: string) => {
    setLoadingRecords(true);
    try {
      const res = await fetch(`/api/dynamic-enrollments?enrollmentTypeId=${typeId}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.data || []);
      }
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  const handleToggleExpand = (typeId: string) => {
    if (expandedTypeId === typeId) {
      setExpandedTypeId(null); setRecords([]); setEditingRecordId(null);
      setFilterSchool("ALL"); setFilterClass("ALL");
    } else {
      setExpandedTypeId(typeId); setEditingRecordId(null);
      setFilterSchool("ALL"); setFilterClass("ALL");
      fetchRecords(typeId);
    }
  };

  const handleSaveRecord = async () => {
    if (!expandedTypeId) return;
    setSavingRecord(true);
    try {
      const res = await fetch("/api/dynamic-enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentTypeId: expandedTypeId,
          school: newSchool,
          class: newClass,
          year: newYear,
          term: newTerm,
          count: newCount,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to save record");
        return;
      }
      setNewCount(0);
      await fetchRecords(expandedTypeId);
      await fetchTypes();
    } finally {
      setSavingRecord(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    const res = await fetch("/api/dynamic-enrollments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok && expandedTypeId) {
      await fetchRecords(expandedTypeId);
      await fetchTypes();
    } else {
      alert("Failed to delete record");
    }
  };

  const handleSaveRecordEdit = async (rec: DynamicEnrollment) => {
    setSavingRecordEdit(true);
    try {
      const res = await fetch("/api/dynamic-enrollments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rec.id,
          school: editingRecord.school ?? rec.school,
          class: editingRecord.class ?? rec.class,
          count: editingRecord.count ?? rec.count,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to update");
        return;
      }
      setEditingRecordId(null);
      if (expandedTypeId) await fetchRecords(expandedTypeId);
    } finally {
      setSavingRecordEdit(false);
    }
  };

  const isGM = (session?.user as any)?.role === "GM";

  // Unique schools/classes in this type's records for filter dropdowns
  const recordSchools = Array.from(new Set(records.map(r => r.school).filter(Boolean))).sort();
  const recordClasses = Array.from(new Set(records.map(r => r.class).filter(Boolean))).sort();
  const filteredRecords = records.filter(r => {
    if (filterSchool !== "ALL" && r.school !== filterSchool) return false;
    if (filterClass !== "ALL" && r.class !== filterClass) return false;
    return true;
  });

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enrollment Types Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Create and manage custom enrollment categories (Swimming, Tours, Clubs, etc.) and record counts per year / term.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="shrink-0 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Add new type — GM only */}
        {isGM && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Add New Enrollment Type</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddType()}
                placeholder="e.g. Swimming, Tours, After-school Clubs…"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleAddType}
                disabled={addingType || !newTypeName.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                {addingType ? "Adding…" : "Add Type"}
              </button>
            </div>
          </div>
        )}

        {/* Types list */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">All Types</h2>
              <p className="text-xs text-gray-400 mt-0.5">{types.length} type{types.length !== 1 ? "s" : ""} total</p>
            </div>
            <span className="text-xs text-gray-400">Hover a row to see edit actions</span>
          </div>

          {types.length === 0 ? (
            <div className="px-6 py-16 text-center text-gray-400 text-sm">
              No enrollment types yet. Add one above.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {types.map((type) => (
                <div key={type.id} className="group">
                  {/* Type row */}
                  <div className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors">
                    {/* Name / inline edit */}
                    <div className="flex-1 min-w-0">
                      {editingId === type.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(type.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="flex-1 px-3 py-1.5 border border-purple-400 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <button
                            onClick={() => handleRename(type.id)}
                            disabled={savingRename}
                            title="Save rename"
                            className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            title="Cancel"
                            className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-sm font-semibold ${type.isActive ? "text-gray-900" : "text-gray-400 line-through"}`}>
                            {type.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              type.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {type.isActive ? "Active" : "Inactive"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {type._count?.records ?? 0} record{(type._count?.records ?? 0) !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* GM action buttons */}
                    {isGM && editingId !== type.id && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingId(type.id); setEditingName(type.name); }}
                          title="Rename"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(type.id, type.isActive)}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                            type.isActive
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-green-50 text-green-600 hover:bg-green-100"
                          }`}
                        >
                          {type.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      </div>
                    )}

                    {/* Expand records */}
                    <button
                      onClick={() => handleToggleExpand(type.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                    >
                      {expandedTypeId === type.id ? (
                        <><ChevronUpIcon className="w-3.5 h-3.5" /> Hide Records</>
                      ) : (
                        <><ChevronDownIcon className="w-3.5 h-3.5" /> View / Add Records</>
                      )}
                    </button>
                  </div>

                  {/* Records panel */}
                  {expandedTypeId === type.id && (
                    <div className="border-t border-gray-100 bg-gray-50 px-6 pb-6">
                      <div className="pt-4 space-y-4">

                        {/* Entry form */}
                        {isGM && (
                          <div className="bg-white border border-dashed border-purple-200 rounded-xl p-5">
                            <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Add / Update Record</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                              <div className="col-span-2">
                                <label className="block text-[11px] font-medium text-gray-500 mb-1">School</label>
                                <select
                                  value={newSchool}
                                  onChange={(e) => setNewSchool(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                                >
                                  <option value="">All / Any</option>
                                  {schools.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] font-medium text-gray-500 mb-1">Class</label>
                                <select
                                  value={newClass}
                                  onChange={(e) => setNewClass(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                                >
                                  {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c || "All / Any"}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] font-medium text-gray-500 mb-1">Year</label>
                                <select
                                  value={newYear}
                                  onChange={(e) => setNewYear(Number(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                                >
                                  {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] font-medium text-gray-500 mb-1">Term</label>
                                <select
                                  value={newTerm}
                                  onChange={(e) => setNewTerm(Number(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                                >
                                  {TERM_OPTIONS.map(t => <option key={t} value={t}>Term {t}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] font-medium text-gray-500 mb-1">Count</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={newCount}
                                  onChange={(e) => setNewCount(Number(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                                />
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end">
                              <button
                                onClick={handleSaveRecord}
                                disabled={savingRecord}
                                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                              >
                                {savingRecord ? "Saving…" : "Save / Update"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Filter bar */}
                        {records.length > 0 && (
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs font-semibold text-gray-500">Filter:</span>
                            {recordSchools.length > 0 && (
                              <select value={filterSchool} onChange={(e) => setFilterSchool(e.target.value)}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white">
                                <option value="ALL">All Schools</option>
                                {recordSchools.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            )}
                            {recordClasses.length > 0 && (
                              <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white">
                                <option value="ALL">All Classes</option>
                                {recordClasses.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            )}
                            {(filterSchool !== "ALL" || filterClass !== "ALL") && (
                              <button onClick={() => { setFilterSchool("ALL"); setFilterClass("ALL"); }}
                                className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-100">
                                Clear
                              </button>
                            )}
                            <span className="text-xs text-gray-400 ml-auto">
                              {filteredRecords.length} of {records.length} record{records.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}

                        {/* Records table */}
                        {loadingRecords ? (
                          <div className="text-center py-6 text-sm text-gray-500">Loading records…</div>
                        ) : records.length === 0 ? (
                          <div className="text-center py-6 text-sm text-gray-400">No records yet. Use the form above to add one.</div>
                        ) : (
                          <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-100 text-left">
                                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">School</th>
                                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Class</th>
                                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Year</th>
                                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Term</th>
                                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Count</th>
                                  {isGM && <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 bg-white">
                                {[...filteredRecords]
                                  .sort((a, b) => b.year - a.year || b.term - a.term || a.school.localeCompare(b.school) || a.class.localeCompare(b.class))
                                  .map((rec) => (
                                    <tr key={rec.id} className="hover:bg-blue-50 transition-colors">
                                      <td className="px-4 py-3 text-gray-700">
                                        {editingRecordId === rec.id ? (
                                          <select
                                            value={editingRecord.school ?? rec.school}
                                            onChange={(e) => setEditingRecord(prev => ({ ...prev, school: e.target.value }))}
                                            className="w-full px-2 py-1 border border-blue-400 rounded text-sm text-gray-900"
                                          >
                                            <option value="">All / Any</option>
                                            {schools.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                          </select>
                                        ) : (
                                          rec.school || <span className="text-gray-400 italic text-xs">Any</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-gray-700">
                                        {editingRecordId === rec.id ? (
                                          <select
                                            value={editingRecord.class ?? rec.class}
                                            onChange={(e) => setEditingRecord(prev => ({ ...prev, class: e.target.value }))}
                                            className="px-2 py-1 border border-blue-400 rounded text-sm text-gray-900"
                                          >
                                            {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c || "Any"}</option>)}
                                          </select>
                                        ) : (
                                          rec.class || <span className="text-gray-400 italic text-xs">Any</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 font-semibold text-gray-900">{rec.year}</td>
                                      <td className="px-4 py-3 text-gray-700">Term {rec.term}</td>
                                      <td className="px-4 py-3">
                                        {editingRecordId === rec.id ? (
                                          <input
                                            autoFocus
                                            type="number"
                                            min={0}
                                            value={editingRecord.count ?? rec.count}
                                            onChange={(e) => setEditingRecord(prev => ({ ...prev, count: Number(e.target.value) }))}
                                            onKeyDown={(e) => { if (e.key === "Enter") handleSaveRecordEdit(rec); if (e.key === "Escape") setEditingRecordId(null); }}
                                            className="w-24 px-2 py-1 border border-blue-400 rounded text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500"
                                          />
                                        ) : (
                                          <span className="font-bold text-gray-900">{rec.count.toLocaleString()}</span>
                                        )}
                                      </td>
                                      {isGM && (
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-2">
                                            {editingRecordId === rec.id ? (
                                              <>
                                                <button onClick={() => handleSaveRecordEdit(rec)} disabled={savingRecordEdit}
                                                  className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200" title="Save">
                                                  <CheckIcon className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setEditingRecordId(null)}
                                                  className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200" title="Cancel">
                                                  <XMarkIcon className="w-4 h-4" />
                                                </button>
                                              </>
                                            ) : (
                                              <>
                                                <button
                                                  onClick={() => { setEditingRecordId(rec.id); setEditingRecord({ school: rec.school, class: rec.class, count: rec.count }); }}
                                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                  <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteRecord(rec.id)}
                                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                  <TrashIcon className="w-4 h-4" />
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
