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

export default function TrusteeFinancialPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [revenueBySchool, setRevenueBySchool] = useState<any[]>([]);
  const [expenseByCategory, setExpenseByCategory] = useState<any[]>([]);
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
  }, [selectedYear]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const [incomeRes, expenseRes] = await Promise.all([
        fetch(`/api/income-sources?year=${selectedYear}`),
        fetch(`/api/other-income?year=${selectedYear}`),
      ]);

      if (incomeRes.ok) {
        const data = await incomeRes.json();
        setRevenueBySchool(Array.isArray(data) ? data : data.data || []);
      }

      if (expenseRes.ok) {
        const data = await expenseRes.json();
        setExpenseByCategory(Array.isArray(data) ? data : data.data || []);
      }

      // Generate mock financial trends
      const trends: FinancialData[] = [];
      for (let m = 1; m <= 12; m++) {
        trends.push({
          month: m,
          income: 50000 + Math.random() * 30000,
          expenditure: 35000 + Math.random() * 20000,
          balance: 50000 + Math.random() * 30000 - (35000 + Math.random() * 20000),
        });
      }
      setFinancialData(trends);
    } catch (error) {
      console.error("Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const totalIncome = financialData.reduce((sum, d) => sum + d.income, 0);
    const totalExpenditure = financialData.reduce((sum, d) => sum + d.expenditure, 0);
    const balance = totalIncome - totalExpenditure;
    const ratio = totalIncome > 0 ? (totalExpenditure / totalIncome) * 100 : 0;

    return { totalIncome, totalExpenditure, balance, ratio };
  }, [financialData]);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Financial Overview Dashboard</h1>
          <p className="text-gray-600 mt-1">Consolidated financial view across all schools</p>
        </div>

        {/* Year Filter */}
        <div className="mb-6">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {[2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Income"
            value={summary.totalIncome}
            format="currency"
            change={5.2}
            status="good"
          />
          <StatCard
            title="Total Expenditure"
            value={summary.totalExpenditure}
            format="currency"
            change={2.1}
            status="good"
          />
          <StatCard
            title="Net Balance"
            value={summary.balance}
            format="currency"
            change={8.3}
            status="good"
          />
          <StatCard
            title="Expense Ratio"
            value={summary.ratio}
            format="percent"
            change={-1.5}
            status="good"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Cash Flow Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Cash Flow Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
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

          {/* Budget Variance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget vs Actual</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financialData.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="#3b82f6" name="Planned" />
                <Bar dataKey="expenditure" fill="#f59e0b" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue and Expense Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by School */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by School</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueBySchool.length > 0 ? revenueBySchool : [
                    { name: "School A", value: 25 },
                    { name: "School B", value: 22 },
                    { name: "School C", value: 20 },
                    { name: "School D", value: 18 },
                    { name: "School E", value: 15 },
                  ]}
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
          </div>

          {/* Expense by Category */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseByCategory.length > 0 ? expenseByCategory : [
                    { name: "Salaries", value: 35 },
                    { name: "Operations", value: 25 },
                    { name: "Maintenance", value: 15 },
                    { name: "Utilities", value: 15 },
                    { name: "Other", value: 10 },
                  ]}
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
