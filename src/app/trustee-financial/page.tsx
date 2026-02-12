"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";

interface FinancialData {
  month: number;
  income: number;
  expenditure: number;
  balance: number;
}

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
}

const currentYear = new Date().getFullYear();
const START_YEAR = 2023;
const availableYears = Array.from(
  { length: currentYear - START_YEAR + 1 },
  (_, i) => currentYear - i
);

export default function TrusteeFinancialPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [previousEntries, setPreviousEntries] = useState<FinancialEntry[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user?.role !== "TRUSTEE") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchFinancialData();
  }, [selectedYear, selectedTerm]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const [currentRes, previousRes, budgetRes] = await Promise.all([
        fetch(`/api/financial-entries?year=${selectedYear}&term=${selectedTerm}`),
        fetch(`/api/financial-entries?year=${selectedYear - 1}&term=${selectedTerm}`),
        fetch(`/api/budgets?year=${selectedYear}&term=${selectedTerm}`),
      ]);

      if (currentRes.ok) {
        const data = await currentRes.json();
        setEntries(Array.isArray(data) ? data : data.data || []);
      } else {
        setEntries([]);
      }

      if (previousRes.ok) {
        const data = await previousRes.json();
        setPreviousEntries(Array.isArray(data) ? data : data.data || []);
      } else {
        setPreviousEntries([]);
      }

      if (budgetRes.ok) {
        const data = await budgetRes.json();
        setBudgets(Array.isArray(data) ? data : data.data || []);
      } else {
        setBudgets([]);
      }
    } catch (error) {
      console.error("Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const monthlyData = useMemo(() => {
    const base: FinancialData[] = Array.from({ length: 12 }, (_, idx) => ({
      month: idx + 1,
      income: 0,
      expenditure: 0,
      balance: 0,
    }));

    entries.forEach((entry) => {
      if (!entry.month || entry.month < 1 || entry.month > 12) return;
      const target = base[entry.month - 1];
      if (!target) return;
      if (entry.type === "INCOME") {
        target.income += entry.amount || 0;
      } else {
        target.expenditure += entry.amount || 0;
      }
    });

    base.forEach((row) => {
      row.balance = row.income - row.expenditure;
    });

    return base;
  }, [entries]);

  const previousTotals = useMemo(() => {
    const totalIncome = previousEntries
      .filter((entry) => entry.type === "INCOME")
      .reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const totalExpenditure = previousEntries
      .filter((entry) => entry.type === "EXPENSE")
      .reduce((sum, entry) => sum + (entry.amount || 0), 0);
    return { totalIncome, totalExpenditure };
  }, [previousEntries]);

  const revenueBySchool = useMemo(() => {
    const totals: Record<string, number> = {};
    entries
      .filter((entry) => entry.type === "INCOME")
      .forEach((entry) => {
        const key = entry.school || "Unassigned";
        totals[key] = (totals[key] || 0) + (entry.amount || 0);
      });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [entries]);

  const revenueBySource = useMemo(() => {
    const totals: Record<string, number> = {};
    entries
      .filter((entry) => entry.type === "INCOME")
      .forEach((entry) => {
        const key = entry.source || "Other";
        totals[key] = (totals[key] || 0) + (entry.amount || 0);
      });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [entries]);

  const expenseByCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    entries
      .filter((entry) => entry.type === "EXPENSE")
      .forEach((entry) => {
        const key = entry.category || "Other";
        totals[key] = (totals[key] || 0) + (entry.amount || 0);
      });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [entries]);

  const budgetVsActualData = useMemo(() => {
    const actualTotals: Record<string, number> = {};
    entries
      .filter((entry) => entry.type === "EXPENSE")
      .forEach((entry) => {
        const key = entry.category || "Other";
        actualTotals[key] = (actualTotals[key] || 0) + (entry.amount || 0);
      });

    const budgetTotals: Record<string, number> = {};
    budgets.forEach((entry: any) => {
      const key = entry.category || "Other";
      budgetTotals[key] = (budgetTotals[key] || 0) + (entry.amount || 0);
    });

    const categories = Array.from(
      new Set([...Object.keys(actualTotals), ...Object.keys(budgetTotals)])
    );

    return categories.map((category) => ({
      category,
      budget: budgetTotals[category] || 0,
      actual: actualTotals[category] || 0,
    }));
  }, [entries, budgets]);

  const summary = useMemo(() => {
    const totalIncome = monthlyData.reduce((sum, d) => sum + d.income, 0);
    const totalExpenditure = monthlyData.reduce((sum, d) => sum + d.expenditure, 0);
    const balance = totalIncome - totalExpenditure;
    const ratio = totalIncome > 0 ? (totalExpenditure / totalIncome) * 100 : 0;

    const incomeChange = previousTotals.totalIncome > 0
      ? ((totalIncome - previousTotals.totalIncome) / previousTotals.totalIncome) * 100
      : 0;
    const expenseChange = previousTotals.totalExpenditure > 0
      ? ((totalExpenditure - previousTotals.totalExpenditure) / previousTotals.totalExpenditure) * 100
      : 0;
    const balanceChangeBase = previousTotals.totalIncome - previousTotals.totalExpenditure;
    const balanceChange = balanceChangeBase !== 0
      ? ((balance - balanceChangeBase) / Math.abs(balanceChangeBase)) * 100
      : 0;
    const ratioChange = previousTotals.totalIncome > 0
      ? (((totalExpenditure / totalIncome) * 100) - ((previousTotals.totalExpenditure / previousTotals.totalIncome) * 100))
      : 0;

    return {
      totalIncome,
      totalExpenditure,
      balance,
      ratio,
      incomeChange,
      expenseChange,
      balanceChange,
      ratioChange,
    };
  }, [monthlyData, previousTotals]);

  const StatCard = ({ title, value, format, change, status }: any) => {
    const isPositive = change >= 0;

    return (
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">
          {format === "currency" ? `Ugx ${(value / 1000000).toFixed(1)}M` : `${value.toFixed(1)}%`}
        </p>
        <div className="flex items-center gap-1 mt-3">
          {isPositive ? (
            <ArrowUpIcon className="w-4 h-4 text-green-600" />
          ) : (
            <ArrowDownIcon className="w-4 h-4 text-red-600" />
          )}
          <span className={`text-sm font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {Math.abs(change).toFixed(1)}% {isPositive ? "increase" : "decrease"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="hidden print:block border-b-2 border-gray-800 pb-4 mb-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">SIR APOLLO KAGGWA SCHOOLS - SINCE 1996</h1>
            <p className="text-sm text-gray-600 mt-1">FINANCIAL OVERVIEW REPORT</p>
            <div className="mt-3 text-xs text-gray-600">
              <p>Report Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <p>Period: Term {selectedTerm}, {selectedYear}</p>
            </div>
          </div>
        </div>
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Overview Dashboard</h1>
            <p className="text-gray-600 mt-1">Consolidated financial view across all schools</p>
          </div>
          <button
            onClick={() => window.print()}
            className="print:hidden px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg"
          >
            Print Report
          </button>
        </div>

        {/* Year/Term Filter */}
        <div className="mb-6 flex flex-wrap gap-3 print:hidden">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border-2 border-gray-400 rounded-lg text-base font-medium text-gray-900 bg-white shadow-sm hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(parseInt(e.target.value))}
            className="px-4 py-2 border-2 border-gray-400 rounded-lg text-base font-medium text-gray-900 bg-white shadow-sm hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {[1, 2, 3].map((term) => (
              <option key={term} value={term}>Term {term}</option>
            ))}
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Income"
            value={summary.totalIncome}
            format="currency"
            change={summary.incomeChange}
            status="good"
          />
          <StatCard
            title="Total Expenditure"
            value={summary.totalExpenditure}
            format="currency"
            change={summary.expenseChange}
            status="good"
          />
          <StatCard
            title="Net Balance"
            value={summary.balance}
            format="currency"
            change={summary.balanceChange}
            status="good"
          />
          <StatCard
            title="Expense Ratio"
            value={summary.ratio}
            format="percent"
            change={summary.ratioChange}
            status="good"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Cash Flow Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Cash Flow Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={(value) => `M${value}`} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  name="Income"
                />
                <Line
                  type="monotone"
                  dataKey="expenditure"
                  stroke="#ef4444"
                  name="Expenditure"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Budget vs Actual */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget vs Actual</h3>
            {budgetVsActualData.length === 0 ? (
              <div className="text-sm text-gray-500">No budget or expense data for this term.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetVsActualData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
                  <Bar dataKey="actual" fill="#f59e0b" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Revenue and Expense Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue by Source */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Source</h3>
            {revenueBySource.length === 0 ? (
              <div className="text-sm text-gray-500">No income data for this year.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueBySource}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Revenue by School */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by School</h3>
            {revenueBySchool.length === 0 ? (
              <div className="text-sm text-gray-500">No school-tagged income data.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueBySchool}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Expense by Category */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense by Category</h3>
            {expenseByCategory.length === 0 ? (
              <div className="text-sm text-gray-500">No expense data for this year.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
