"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ArrowUpIcon, ArrowDownIcon, SparklesIcon, ExclamationTriangleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface WeeklyReport {
  id: string;
  weekNumber: number;
  year: number;
  term: number;
  feesCollectionPercent: number;
  schoolsExpenditurePercent: number;
  infrastructurePercent: number;
  totalEnrollment: number;
  theologyEnrollment: number;
  p7PrepExamsPercent: number;
}

const currentYear = new Date().getFullYear();
const START_YEAR = 2023;
const availableYears = Array.from(
  { length: currentYear - START_YEAR + 1 },
  (_, i) => currentYear - i
);

export default function TrusteeDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [currentYearReports, setCurrentYearReports] = useState<WeeklyReport[]>([]);
  const [previousYearReports, setPreviousYearReports] = useState<WeeklyReport[]>([]);
  const [currentEnrollmentTotal, setCurrentEnrollmentTotal] = useState(0);
  const [previousEnrollmentTotal, setPreviousEnrollmentTotal] = useState(0);
  const [currentTheologyTotal, setCurrentTheologyTotal] = useState(0);
  const [previousTheologyTotal, setPreviousTheologyTotal] = useState(0);
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
  }, [selectedYear, selectedTerm]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [currentRes, previousRes, currentEnrollmentRes, previousEnrollmentRes, currentTheologyRes, previousTheologyRes, issuesRes] = await Promise.all([
        fetch(`/api/reports?year=${selectedYear}&term=${selectedTerm}`),
        fetch(`/api/reports?year=${selectedYear - 1}&term=${selectedTerm}`),
        fetch(`/api/enrollment?year=${selectedYear}&term=${selectedTerm}`),
        fetch(`/api/enrollment?year=${selectedYear - 1}&term=${selectedTerm}`),
        fetch(`/api/theology-enrollment?year=${selectedYear}&term=${selectedTerm}`),
        fetch(`/api/theology-enrollment?year=${selectedYear - 1}&term=${selectedTerm}`),
        fetch(`/api/issues?status=ACTIVE`),
      ]);

      if (currentRes.ok) {
        const data = await currentRes.json();
        setCurrentYearReports(Array.isArray(data) ? data : data.data || []);
      } else {
        setCurrentYearReports([]);
      }

      if (previousRes.ok) {
        const data = await previousRes.json();
        setPreviousYearReports(Array.isArray(data) ? data : data.data || []);
      } else {
        setPreviousYearReports([]);
      }

      if (currentEnrollmentRes.ok) {
        const data = await currentEnrollmentRes.json();
        const rows = Array.isArray(data) ? data : data.data || [];
        setCurrentEnrollmentTotal(rows.reduce((sum: number, row: any) => sum + (row.count || 0), 0));
      } else {
        setCurrentEnrollmentTotal(0);
      }

      if (previousEnrollmentRes.ok) {
        const data = await previousEnrollmentRes.json();
        const rows = Array.isArray(data) ? data : data.data || [];
        setPreviousEnrollmentTotal(rows.reduce((sum: number, row: any) => sum + (row.count || 0), 0));
      } else {
        setPreviousEnrollmentTotal(0);
      }

      if (currentTheologyRes.ok) {
        const data = await currentTheologyRes.json();
        const rows = Array.isArray(data) ? data : data.data || [];
        setCurrentTheologyTotal(rows.reduce((sum: number, row: any) => sum + (row.count || 0), 0));
      } else {
        setCurrentTheologyTotal(0);
      }

      if (previousTheologyRes.ok) {
        const data = await previousTheologyRes.json();
        const rows = Array.isArray(data) ? data : data.data || [];
        setPreviousTheologyTotal(rows.reduce((sum: number, row: any) => sum + (row.count || 0), 0));
      } else {
        setPreviousTheologyTotal(0);
      }

      if (issuesRes.ok) {
        const data = await issuesRes.json();
        const items = Array.isArray(data) ? data : data.data || [];
        setIssues(items.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary metrics
  const metrics = useMemo(() => {
    if (!currentYearReports.length) return null;

    const avg = (reports: WeeklyReport[], selector: (r: WeeklyReport) => number) =>
      reports.length
        ? reports.reduce((sum, r) => sum + selector(r), 0) / reports.length
        : 0;

    const currentFees = avg(currentYearReports, (r) => r.feesCollectionPercent || 0);
    const previousFees = avg(previousYearReports, (r) => r.feesCollectionPercent || 0);

    const currentEnrollmentReportAvg = avg(currentYearReports, (r) => r.totalEnrollment || 0);
    const previousEnrollmentReportAvg = avg(previousYearReports, (r) => r.totalEnrollment || 0);

    const currentTheologyReportAvg = avg(currentYearReports, (r) => r.theologyEnrollment || 0);
    const previousTheologyReportAvg = avg(previousYearReports, (r) => r.theologyEnrollment || 0);

    const currentP7Prep = avg(currentYearReports, (r) => r.p7PrepExamsPercent || 0);
    const previousP7Prep = avg(previousYearReports, (r) => r.p7PrepExamsPercent || 0);

    const currentExpenditure = avg(currentYearReports, (r) => r.schoolsExpenditurePercent || 0);
    const previousExpenditure = avg(previousYearReports, (r) => r.schoolsExpenditurePercent || 0);

    const currentInfrastructure = avg(currentYearReports, (r) => r.infrastructurePercent || 0);
    const previousInfrastructure = avg(previousYearReports, (r) => r.infrastructurePercent || 0);

    return {
      fees: {
        current: currentFees,
        previous: previousFees,
        change: currentFees - previousFees,
      },
      enrollment: {
        current: currentEnrollmentTotal,
        previous: previousEnrollmentTotal,
        change: currentEnrollmentTotal - previousEnrollmentTotal,
        reportAvg: currentEnrollmentReportAvg,
        reportPrevAvg: previousEnrollmentReportAvg,
      },
      theology: {
        current: currentTheologyTotal,
        previous: previousTheologyTotal,
        change: currentTheologyTotal - previousTheologyTotal,
        reportAvg: currentTheologyReportAvg,
        reportPrevAvg: previousTheologyReportAvg,
      },
      p7prep: {
        current: currentP7Prep,
        previous: previousP7Prep,
        change: currentP7Prep - previousP7Prep,
      },
      expenditure: {
        current: currentExpenditure,
        previous: previousExpenditure,
        change: currentExpenditure - previousExpenditure,
      },
      infrastructure: {
        current: currentInfrastructure,
        previous: previousInfrastructure,
        change: currentInfrastructure - previousInfrastructure,
      },
    };
  }, [
    currentYearReports,
    previousYearReports,
    currentEnrollmentTotal,
    previousEnrollmentTotal,
    currentTheologyTotal,
    previousTheologyTotal,
  ]);

  const hasKpiData = currentYearReports.length > 0;
  const chartData = useMemo(
    () => [...currentYearReports].sort((a, b) => a.weekNumber - b.weekNumber),
    [currentYearReports]
  );

  const MetricCard = ({ title, value, unit, change, status, previousValue, compareLabel, secondaryValue, secondaryCompareLabel }: any) => {
    const isPositive = change >= 0;
    const statusColor = status === "good" ? "green" : status === "warning" ? "amber" : "red";
    const displayValue = typeof value === "number" ? value.toLocaleString() : value;
    const displayPrevious = typeof previousValue === "number" ? previousValue.toLocaleString() : previousValue;

    return (
      <div className={`bg-white rounded-lg shadow p-6 border-l-4 border-${statusColor}-500`}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{displayValue}{unit}</p>
            <p className="text-xs text-gray-500 mt-1">
              Last year ({compareLabel}): {displayPrevious}{unit}
            </p>
            {secondaryValue !== undefined && secondaryValue !== null && (
              <p className="text-xs text-gray-500 mt-1">
                Weekly report avg ({secondaryCompareLabel}): {typeof secondaryValue === "number" ? secondaryValue.toFixed(1) : secondaryValue}{unit}
              </p>
            )}
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

        {/* Year/Term Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
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

        {!hasKpiData && (
          <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
            No weekly report data available for Term {selectedTerm}, {selectedYear}. Add weekly reports for this term to populate metrics and charts.
          </div>
        )}

        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <MetricCard
              title="Fees Collection"
              value={metrics.fees.current.toFixed(1)}
              unit="%"
              change={metrics.fees.change}
              previousValue={metrics.fees.previous.toFixed(1)}
              compareLabel={`Term ${selectedTerm}, ${selectedYear - 1}`}
              status={metrics.fees.current >= 85 ? "good" : metrics.fees.current >= 70 ? "warning" : "critical"}
            />
            <MetricCard
              title="Total Enrollment"
              value={metrics.enrollment.current}
              unit=" students"
              change={metrics.enrollment.change}
              previousValue={metrics.enrollment.previous}
              compareLabel={`Term ${selectedTerm}, ${selectedYear - 1}`}
              secondaryValue={metrics.enrollment.reportAvg}
              secondaryCompareLabel={`Term ${selectedTerm}, ${selectedYear}`}
              status={metrics.enrollment.change >= 0 ? "good" : "warning"}
            />
            <MetricCard
              title="Theology Enrollment"
              value={metrics.theology.current}
              unit=" students"
              change={metrics.theology.change}
              previousValue={metrics.theology.previous}
              compareLabel={`Term ${selectedTerm}, ${selectedYear - 1}`}
              secondaryValue={metrics.theology.reportAvg}
              secondaryCompareLabel={`Term ${selectedTerm}, ${selectedYear}`}
              status={metrics.theology.change >= 0 ? "good" : "warning"}
            />
            <MetricCard
              title="P.7 Prep Performance"
              value={metrics.p7prep.current.toFixed(1)}
              unit="%"
              change={metrics.p7prep.change}
              previousValue={metrics.p7prep.previous.toFixed(1)}
              compareLabel={`Term ${selectedTerm}, ${selectedYear - 1}`}
              status={metrics.p7prep.current >= 80 ? "good" : metrics.p7prep.current >= 60 ? "warning" : "critical"}
            />
            <MetricCard
              title="Expenditure"
              value={metrics.expenditure.current.toFixed(1)}
              unit="%"
              change={metrics.expenditure.change}
              previousValue={metrics.expenditure.previous.toFixed(1)}
              compareLabel={`Term ${selectedTerm}, ${selectedYear - 1}`}
              status={metrics.expenditure.current <= 100 ? "good" : "warning"}
            />
            <MetricCard
              title="Infrastructure"
              value={metrics.infrastructure.current.toFixed(1)}
              unit="%"
              change={metrics.infrastructure.change}
              previousValue={metrics.infrastructure.previous.toFixed(1)}
              compareLabel={`Term ${selectedTerm}, ${selectedYear - 1}`}
              status={metrics.infrastructure.current >= 70 ? "good" : "warning"}
            />
          </div>
        )}

        {/* Charts Section */}
        {hasKpiData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Fees Collection Trend */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fees Collection Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="weekNumber" tickFormatter={(value) => `WK ${value}`} />
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
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="weekNumber" tickFormatter={(value) => `WK ${value}`} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalEnrollment" fill="#10b981" name="Regular" />
                  <Bar dataKey="theologyEnrollment" fill="#8b5cf6" name="Theology" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

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
                    <p className="font-semibold text-gray-900">{issue.issue}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>In charge: {issue.inCharge || "Unassigned"}</span>
                      <span>Status: {issue.status || "OPEN"}</span>
                      <span>Created: {new Date(issue.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="px-2 py-1 rounded text-xs font-semibold bg-red-200 text-red-800">
                    ATTENTION
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
