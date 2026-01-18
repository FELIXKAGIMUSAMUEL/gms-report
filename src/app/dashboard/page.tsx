"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import KPICard from "@/components/dashboard/KPICard";
import TrendsChart from "@/components/dashboard/TrendsChart";
import QuarterlyTable from "@/components/dashboard/QuarterlyTable";

interface Report {
  id: string;
  year: number;
  quarter: number;
  baptisms: number;
  professionOfFaith: number;
  tithes: number;
  combinedOfferings: number;
  membership: number;
  sabbathSchoolAttendance: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      // Fetch all reports
      const reportsRes = await fetch("/api/reports");
      const reportsData = await reportsRes.json();
      setReports(reportsData);

      // Fetch historical data for charts
      const historicalRes = await fetch("/api/historical?groupBy=quarter");
      const historicalData = await historicalRes.json();
      setHistoricalData(historicalData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Calculate KPIs from latest quarter
  const latestReport = reports[0];
  const previousReport = reports[1];

  const calculateTrend = (current: number, previous: number) => {
    if (!previous) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(change)),
      isPositive: change > 0,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                GMS Report Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Welcome, {session.user?.name || session.user?.email}
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => router.push("/update-report")}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Update Report
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Baptisms"
            value={latestReport?.baptisms || 0}
            icon="💧"
            trend={
              latestReport && previousReport
                ? calculateTrend(latestReport.baptisms, previousReport.baptisms)
                : undefined
            }
          />
          <KPICard
            title="Profession of Faith"
            value={latestReport?.professionOfFaith || 0}
            icon="🙏"
            trend={
              latestReport && previousReport
                ? calculateTrend(
                    latestReport.professionOfFaith,
                    previousReport.professionOfFaith
                  )
                : undefined
            }
          />
          <KPICard
            title="Current Membership"
            value={latestReport?.membership || 0}
            icon="👥"
            trend={
              latestReport && previousReport
                ? calculateTrend(latestReport.membership, previousReport.membership)
                : undefined
            }
          />
          <KPICard
            title="SS Attendance"
            value={latestReport?.sabbathSchoolAttendance || 0}
            icon="📚"
            trend={
              latestReport && previousReport
                ? calculateTrend(
                    latestReport.sabbathSchoolAttendance,
                    previousReport.sabbathSchoolAttendance
                  )
                : undefined
            }
          />
        </div>

        {/* Financial KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <KPICard
            title="Quarterly Tithes"
            value={`$${latestReport?.tithes.toFixed(2) || "0.00"}`}
            icon="💰"
            trend={
              latestReport && previousReport
                ? calculateTrend(latestReport.tithes, previousReport.tithes)
                : undefined
            }
          />
          <KPICard
            title="Combined Offerings"
            value={`$${latestReport?.combinedOfferings.toFixed(2) || "0.00"}`}
            icon="🎁"
            trend={
              latestReport && previousReport
                ? calculateTrend(
                    latestReport.combinedOfferings,
                    previousReport.combinedOfferings
                  )
                : undefined
            }
          />
        </div>

        {/* Trends Chart */}
        <div className="mb-8">
          <TrendsChart
            data={historicalData.slice(-12)} // Last 12 quarters
            dataKeys={[
              { key: "baptisms", name: "Baptisms", color: "#3b82f6" },
              { key: "professionOfFaith", name: "Profession of Faith", color: "#10b981" },
              { key: "membership", name: "Membership", color: "#f59e0b" },
            ]}
          />
        </div>

        {/* Quarterly Table */}
        <QuarterlyTable reports={reports.slice(0, 8)} />
      </main>
    </div>
  );
}
