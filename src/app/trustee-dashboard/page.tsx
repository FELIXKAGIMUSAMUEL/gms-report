"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ArrowUpIcon, ArrowDownIcon, SparklesIcon, ExclamationTriangleIcon, CheckCircleIcon, ClockIcon } from "@heroicons/react/24/outline";

interface KPIData {
  month: number;
  year: number;
  feesCollectionPercent: number;
  schoolsExpenditurePercent: number;
  infrastructurePercent: number;
  totalEnrollment: number;
  theologyEnrollment: number;
  p7PrepExamsPercent: number;
}

interface TrendData {
  period: string;
  value: number;
  previousValue: number;
}

export default function TrusteeDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user?.role !== "TRUSTEE") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [kpiRes, issuesRes] = await Promise.all([
        fetch(`/api/kpis?year=${selectedYear}`),
        fetch(`/api/issues?status=open&limit=5`),
      ]);

      if (kpiRes.ok) {
        const data = await kpiRes.json();
        setKpiData(Array.isArray(data) ? data : data.data || []);
      }

      if (issuesRes.ok) {
        const data = await issuesRes.json();
        setIssues(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary metrics
  const metrics = useMemo(() => {
    if (!kpiData.length) return null;

    const currentMonth = kpiData[kpiData.length - 1];
    const previousMonth = kpiData[kpiData.length - 2];

    return {
      fees: {
        current: currentMonth?.feesCollectionPercent || 0,
        previous: previousMonth?.feesCollectionPercent || 0,
        change: (currentMonth?.feesCollectionPercent || 0) - (previousMonth?.feesCollectionPercent || 0),
      },
      enrollment: {
        current: currentMonth?.totalEnrollment || 0,
        previous: previousMonth?.totalEnrollment || 0,
        change: (currentMonth?.totalEnrollment || 0) - (previousMonth?.totalEnrollment || 0),
      },
      theology: {
        current: currentMonth?.theologyEnrollment || 0,
        previous: previousMonth?.theologyEnrollment || 0,
        change: (currentMonth?.theologyEnrollment || 0) - (previousMonth?.theologyEnrollment || 0),
      },
      p7prep: {
        current: currentMonth?.p7PrepExamsPercent || 0,
        previous: previousMonth?.p7PrepExamsPercent || 0,
        change: (currentMonth?.p7PrepExamsPercent || 0) - (previousMonth?.p7PrepExamsPercent || 0),
      },
      expenditure: {
        current: currentMonth?.schoolsExpenditurePercent || 0,
        previous: previousMonth?.schoolsExpenditurePercent || 0,
        change: (currentMonth?.schoolsExpenditurePercent || 0) - (previousMonth?.schoolsExpenditurePercent || 0),
      },
      infrastructure: {
        current: currentMonth?.infrastructurePercent || 0,
        previous: previousMonth?.infrastructurePercent || 0,
        change: (currentMonth?.infrastructurePercent || 0) - (previousMonth?.infrastructurePercent || 0),
      },
    };
  }, [kpiData]);

  const MetricCard = ({ title, value, unit, change, status }: any) => {
    const isPositive = change >= 0;
    const statusColor = status === "good" ? "green" : status === "warning" ? "amber" : "red";

    return (
      <div className={`bg-white rounded-lg shadow p-6 border-l-4 border-${statusColor}-500`}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value.toLocaleString()}{unit}</p>
          </div>
          <div className={`p-3 rounded-lg ${statusColor === "green" ? "bg-green-100" : statusColor === "amber" ? "bg-amber-100" : "bg-red-100"}`}>
            {statusColor === "green" && <CheckCircleIcon className={`w-6 h-6 text-green-600`} />}
            {statusColor === "amber" && <ExclamationTriangleIcon className={`w-6 h-6 text-amber-600`} />}
            {statusColor === "red" && <ExclamationTriangleIcon className={`w-6 h-6 text-red-600`} />}
          </div>
        </div>
        <div className="flex items-center gap-1 mt-3">
          {isPositive ? (
            <ArrowUpIcon className="w-4 h-4 text-green-600" />
          ) : (
            <ArrowDownIcon className="w-4 h-4 text-red-600" />
          )}
          <span className={`text-sm font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {Math.abs(change).toFixed(1)}{unit} {isPositive ? "increase" : "decrease"}
          </span>
        </div>
      </div>
    );
  };

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin">
            <SparklesIcon className="w-12 h-12 text-blue-600" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Trustee Executive Dashboard</h1>
          <p className="text-gray-600 mt-1">High-level overview and key insights for governance</p>
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

        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <MetricCard
              title="Fees Collection"
              value={metrics.fees.current.toFixed(1)}
              unit="%"
              change={metrics.fees.change}
              status={metrics.fees.current >= 85 ? "good" : metrics.fees.current >= 70 ? "warning" : "critical"}
            />
            <MetricCard
              title="Total Enrollment"
              value={metrics.enrollment.current}
              unit=" students"
              change={metrics.enrollment.change}
              status={metrics.enrollment.change >= 0 ? "good" : "warning"}
            />
            <MetricCard
              title="Theology Enrollment"
              value={metrics.theology.current}
              unit=" students"
              change={metrics.theology.change}
              status={metrics.theology.change >= 0 ? "good" : "warning"}
            />
            <MetricCard
              title="P.7 Prep Performance"
              value={metrics.p7prep.current.toFixed(1)}
              unit="%"
              change={metrics.p7prep.change}
              status={metrics.p7prep.current >= 80 ? "good" : metrics.p7prep.current >= 60 ? "warning" : "critical"}
            />
            <MetricCard
              title="Expenditure"
              value={metrics.expenditure.current.toFixed(1)}
              unit="%"
              change={metrics.expenditure.change}
              status={metrics.expenditure.current <= 100 ? "good" : "warning"}
            />
            <MetricCard
              title="Infrastructure"
              value={metrics.infrastructure.current.toFixed(1)}
              unit="%"
              change={metrics.infrastructure.change}
              status={metrics.infrastructure.current >= 70 ? "good" : "warning"}
            />
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Fees Collection Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fees Collection Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={kpiData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="feesCollectionPercent"
                  stroke="#3b82f6"
                  dot={{ fill: "#3b82f6" }}
                  name="Fees Collection %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Enrollment Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={kpiData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalEnrollment" fill="#10b981" name="Regular" />
                <Bar dataKey="theologyEnrollment" fill="#8b5cf6" name="Theology" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Critical Issues Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              Issues Requiring Attention
            </h3>
            <a href="/issues-entry" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
              View All →
            </a>
          </div>

          {issues.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p>No critical issues currently</p>
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map((issue) => (
                <div key={issue.id} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{issue.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>School: {issue.school || "All"}</span>
                      <span>Created: {new Date(issue.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    issue.priority === "high" ? "bg-red-200 text-red-800" :
                    issue.priority === "medium" ? "bg-amber-200 text-amber-800" :
                    "bg-blue-200 text-blue-800"
                  }`}>
                    {issue.priority?.toUpperCase() || "MEDIUM"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/trustee-scorecard"
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors"
          >
            <h4 className="font-semibold text-blue-900">School Rankings</h4>
            <p className="text-sm text-blue-700 mt-1">View performance scorecard</p>
          </a>
          <a
            href="/trustee-financial"
            className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors"
          >
            <h4 className="font-semibold text-green-900">Financial Overview</h4>
            <p className="text-sm text-green-700 mt-1">Consolidated financial view</p>
          </a>
          <a
            href="/trustee-comparisons"
            className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:bg-purple-100 transition-colors"
          >
            <h4 className="font-semibold text-purple-900">Comparisons</h4>
            <p className="text-sm text-purple-700 mt-1">School vs school analysis</p>
          </a>
          <a
            href="/trustee-board-reports"
            className="bg-amber-50 border border-amber-200 rounded-lg p-4 hover:bg-amber-100 transition-colors"
          >
            <h4 className="font-semibold text-amber-900">Board Reports</h4>
            <p className="text-sm text-amber-700 mt-1">Generate meeting reports</p>
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}
