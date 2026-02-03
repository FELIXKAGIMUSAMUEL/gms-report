"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import * as XLSX from "xlsx";
import {
	LineChart,
	Line,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	ComposedChart,
	PieChart,
	Pie,
	Cell,
} from "recharts";
import {
	ArrowDownTrayIcon,
	ArrowTrendingUpIcon,
	ArrowTrendingDownIcon,
	CalendarIcon,
	SparklesIcon,
} from "@heroicons/react/24/outline";

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
	syllabusCoveragePercent: number;
	admissions: number;
}

interface WeeklyScorecard {
	id: string;
	schoolId: string;
	schoolName: string;
	term: number;
	week: number;
	year: number;
	academicScore: number;
	financeScore: number;
	qualityScore: number;
	technologyScore: number;
	theologyScore: number;
}

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#eab308"];
const currentYear = new Date().getFullYear();

export default function AnalyticsPage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	const [reports, setReports] = useState<WeeklyReport[]>([]);
	const [scorecards, setScorecards] = useState<WeeklyScorecard[]>([]);
	const [loading, setLoading] = useState(true);

	// Comparison mode: "week" | "term" | "year"
	const [comparisonMode, setComparisonMode] = useState<"week" | "term" | "year">("term");
	
	// Selected values for comparison
	const [selectedYear, setSelectedYear] = useState(currentYear);
	const [selectedTerm, setSelectedTerm] = useState(1);
	const [selectedWeek, setSelectedWeek] = useState(1);
	const [compareYear, setCompareYear] = useState(currentYear - 1);
	const [compareTerm, setCompareTerm] = useState(1);
	const [compareWeek, setCompareWeek] = useState(1);

	const [viewMetric, setViewMetric] = useState<"fees" | "expenditure" | "infrastructure" | "enrollment" | "p7" | "syllabus" | "admissions">("fees");

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
		}
	}, [status, router]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const [reportsRes, scorecardsRes] = await Promise.all([
					fetch("/api/reports"),
					fetch("/api/scorecard"),
				]);

				if (reportsRes.ok) {
					const data = await reportsRes.json();
					setReports(Array.isArray(data) ? data : data.data || []);
				}

				if (scorecardsRes.ok) {
					const data = await scorecardsRes.json();
					const normalized = (Array.isArray(data) ? data : data.data || []).map((sc: any) => ({
						id: sc.id,
						schoolId: sc.school,
						schoolName: sc.school,
						term: sc.term ?? 1,
						week: sc.week,
						year: sc.year,
						academicScore: sc.academicPercent,
						financeScore: sc.financePercent,
						qualityScore: sc.qualityPercent,
						technologyScore: sc.tdpPercent,
						theologyScore: sc.theologyPercent,
					}));
					setScorecards(normalized);
				}
			} catch (err) {
				console.error("Failed to fetch analytics data:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	// Get period labels
	const getPeriodLabel = (year: number, term?: number, week?: number) => {
		if (week) return `W${week}, T${term}, ${year}`;
		if (term) return `Term ${term}, ${year}`;
		return `${year}`;
	};

	// Filter reports for current period
	const getReportsForPeriod = useCallback((year: number, term: number, week?: number) => {
		return reports.filter(r => {
			if (week) return r.year === year && (r.term ?? 1) === term && r.weekNumber === week;
			if (term) return r.year === year && (r.term ?? 1) === term;
			return r.year === year;
		});
	}, [reports]);

	// Filter scorecards for period
	const getScorecardsForPeriod = useCallback((year: number, term: number, week?: number) => {
		return scorecards.filter(sc => {
			if (week) return sc.year === year && sc.term === term && sc.week === week;
			if (term) return sc.year === year && sc.term === term;
			return sc.year === year;
		});
	}, [scorecards]);

	// Calculate comparison data
	const comparisonData = useMemo(() => {
		const period1Data = comparisonMode === "week" 
			? getReportsForPeriod(selectedYear, selectedTerm, selectedWeek)
			: comparisonMode === "term"
			? getReportsForPeriod(selectedYear, selectedTerm)
			: getReportsForPeriod(selectedYear, 1);

		const period2Data = comparisonMode === "week"
			? getReportsForPeriod(compareYear, compareTerm, compareWeek)
			: comparisonMode === "term"
			? getReportsForPeriod(compareYear, compareTerm)
			: getReportsForPeriod(compareYear, 1);

		const metrics = [
			{ 
				label: "Fees Collection %", 
				key: "feesCollectionPercent",
				period1: period1Data.length > 0 ? (period1Data.reduce((a, b) => a + b.feesCollectionPercent, 0) / period1Data.length).toFixed(1) : 0,
				period2: period2Data.length > 0 ? (period2Data.reduce((a, b) => a + b.feesCollectionPercent, 0) / period2Data.length).toFixed(1) : 0,
			},
			{ 
				label: "Expenditure %", 
				key: "schoolsExpenditurePercent",
				period1: period1Data.length > 0 ? (period1Data.reduce((a, b) => a + b.schoolsExpenditurePercent, 0) / period1Data.length).toFixed(1) : 0,
				period2: period2Data.length > 0 ? (period2Data.reduce((a, b) => a + b.schoolsExpenditurePercent, 0) / period2Data.length).toFixed(1) : 0,
			},
			{ 
				label: "Infrastructure %", 
				key: "infrastructurePercent",
				period1: period1Data.length > 0 ? (period1Data.reduce((a, b) => a + b.infrastructurePercent, 0) / period1Data.length).toFixed(1) : 0,
				period2: period2Data.length > 0 ? (period2Data.reduce((a, b) => a + b.infrastructurePercent, 0) / period2Data.length).toFixed(1) : 0,
			},
			{ 
				label: "Total Enrollment", 
				key: "totalEnrollment",
				period1: period1Data.length > 0 ? (period1Data.reduce((a, b) => a + b.totalEnrollment, 0) / period1Data.length).toFixed(0) : 0,
				period2: period2Data.length > 0 ? (period2Data.reduce((a, b) => a + b.totalEnrollment, 0) / period2Data.length).toFixed(0) : 0,
			},
			{ 
				label: "P7 Prep %", 
				key: "p7PrepExamsPercent",
				period1: period1Data.length > 0 ? (period1Data.reduce((a, b) => a + b.p7PrepExamsPercent, 0) / period1Data.length).toFixed(1) : 0,
				period2: period2Data.length > 0 ? (period2Data.reduce((a, b) => a + b.p7PrepExamsPercent, 0) / period2Data.length).toFixed(1) : 0,
			},
			{ 
				label: "Syllabus %", 
				key: "syllabusCoveragePercent",
				period1: period1Data.length > 0 ? (period1Data.reduce((a, b) => a + b.syllabusCoveragePercent, 0) / period1Data.length).toFixed(1) : 0,
				period2: period2Data.length > 0 ? (period2Data.reduce((a, b) => a + b.syllabusCoveragePercent, 0) / period2Data.length).toFixed(1) : 0,
			},
		];

		return metrics;
	}, [comparisonMode, selectedYear, selectedTerm, selectedWeek, compareYear, compareTerm, compareWeek, getReportsForPeriod]);

	// Trend data for line chart
	const trendData = useMemo(() => {
		if (comparisonMode === "week") {
			const period1 = getReportsForPeriod(selectedYear, selectedTerm);
			return period1.sort((a, b) => a.weekNumber - b.weekNumber).map(r => ({
				name: `W${r.weekNumber}`,
				[getPeriodLabel(selectedYear, selectedTerm)]: r[viewMetric as keyof WeeklyReport] || 0,
			}));
		} else if (comparisonMode === "term") {
			const period1 = getReportsForPeriod(selectedYear, selectedTerm);
			const period2 = getReportsForPeriod(compareYear, compareTerm);
			const allWeeks = Math.max(
				...period1.map(r => r.weekNumber),
				...period2.map(r => r.weekNumber),
			);
			const weeks = Array.from({ length: allWeeks }, (_, i) => i + 1);
			return weeks.map(week => {
				const p1 = period1.find(r => r.weekNumber === week);
				const p2 = period2.find(r => r.weekNumber === week);
				return {
					name: `W${week}`,
					[getPeriodLabel(selectedYear, selectedTerm)]: p1 ? p1[viewMetric as keyof WeeklyReport] || 0 : undefined,
					[getPeriodLabel(compareYear, compareTerm)]: p2 ? p2[viewMetric as keyof WeeklyReport] || 0 : undefined,
				};
			});
		} else {
			// Year comparison - show by term
			const period1 = getReportsForPeriod(selectedYear, 1);
			const period2 = getReportsForPeriod(compareYear, 1);
			return [1, 2, 3].map(term => {
				const p1 = period1.filter(r => (r.term ?? 1) === term);
				const p2 = period2.filter(r => (r.term ?? 1) === term);
				const p1Avg = p1.length > 0 ? p1.reduce((a, b) => a + ((b[viewMetric as keyof WeeklyReport] as number) || 0), 0) / p1.length : undefined;
				const p2Avg = p2.length > 0 ? p2.reduce((a, b) => a + ((b[viewMetric as keyof WeeklyReport] as number) || 0), 0) / p2.length : undefined;
				return {
					name: `Term ${term}`,
					[selectedYear]: p1Avg !== undefined ? parseFloat(p1Avg.toFixed(1)) : undefined,
					[compareYear]: p2Avg !== undefined ? parseFloat(p2Avg.toFixed(1)) : undefined,
				};
			});
		}
	}, [comparisonMode, selectedYear, selectedTerm, compareYear, compareTerm, viewMetric, getReportsForPeriod]);

	// School performance comparison
	const schoolPerformance = useMemo(() => {
		const period1 = getScorecardsForPeriod(selectedYear, selectedTerm, comparisonMode === "week" ? selectedWeek : undefined);
		const period2 = getScorecardsForPeriod(compareYear, compareTerm, comparisonMode === "week" ? compareWeek : undefined);

		const schools = new Set([
			...period1.map(sc => sc.schoolName),
			...period2.map(sc => sc.schoolName),
		]);

		return Array.from(schools).map(school => {
			const p1 = period1.filter(sc => sc.schoolName === school);
			const p2 = period2.filter(sc => sc.schoolName === school);
			const p1Avg = p1.length > 0 ? ((p1.reduce((a, b) => a + b.academicScore + b.financeScore + b.qualityScore + b.technologyScore, 0)) / (p1.length * 4)) : 0;
			const p2Avg = p2.length > 0 ? ((p2.reduce((a, b) => a + b.academicScore + b.financeScore + b.qualityScore + b.technologyScore, 0)) / (p2.length * 4)) : 0;
			return {
				name: school,
				[getPeriodLabel(selectedYear, selectedTerm, comparisonMode === "week" ? selectedWeek : undefined)]: parseFloat(p1Avg.toFixed(1)),
				[getPeriodLabel(compareYear, compareTerm, comparisonMode === "week" ? compareWeek : undefined)]: parseFloat(p2Avg.toFixed(1)),
			};
		});
	}, [comparisonMode, selectedYear, selectedTerm, selectedWeek, compareYear, compareTerm, compareWeek, getScorecardsForPeriod]);

	const exportAnalytics = useCallback(() => {
		try {
			const wb = XLSX.utils.book_new();

			// Comparison metrics sheet
			const metricsSheet = XLSX.utils.json_to_sheet(comparisonData.map(m => ({
				"KPI": m.label,
				[getPeriodLabel(selectedYear, selectedTerm)]: m.period1,
				[getPeriodLabel(compareYear, compareTerm)]: m.period2,
				"Difference": (parseFloat(m.period1 as string) - parseFloat(m.period2 as string)).toFixed(1),
			})));
			metricsSheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }];
			XLSX.utils.book_append_sheet(wb, metricsSheet, "Comparison");

			// Trend data
			const trendSheet = XLSX.utils.json_to_sheet(trendData);
			XLSX.utils.book_append_sheet(wb, trendSheet, "Trends");

			// School performance
			const schoolSheet = XLSX.utils.json_to_sheet(schoolPerformance);
			XLSX.utils.book_append_sheet(wb, schoolSheet, "School Performance");

			const timestamp = new Date().toISOString().slice(0, 10);
			const filename = `Analytics_${comparisonMode}_${timestamp}.xlsx`;
			XLSX.writeFile(wb, filename);
		} catch (error) {
			console.error("Export failed:", error);
			alert("Failed to export analytics");
		}
	}, [comparisonData, trendData, schoolPerformance, selectedYear, selectedTerm, compareYear, compareTerm, comparisonMode]);

	if (status === "loading" || loading) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center min-h-screen">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900">Analytics & Comparison</h1>
					<p className="text-gray-600 mt-2">Compare data across weeks, terms, or years</p>
				</div>

				{/* Comparison Controls */}
				<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
					<div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
						<div>
							<label className="block text-sm font-bold text-gray-700 mb-2">Comparison Mode</label>
							<select
								value={comparisonMode}
								onChange={(e) => setComparisonMode(e.target.value as any)}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium"
							>
								<option value="week">By Week</option>
								<option value="term">By Term</option>
								<option value="year">By Year</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-bold text-gray-700 mb-2">Period 1 - Year</label>
							<select
								value={selectedYear}
								onChange={(e) => setSelectedYear(parseInt(e.target.value))}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium"
							>
								{[2024, 2025, 2026].map(year => (
									<option key={year} value={year}>{year}</option>
								))}
							</select>
						</div>

						{comparisonMode !== "year" && (
							<div>
								<label className="block text-sm font-bold text-gray-700 mb-2">Term</label>
								<select
									value={selectedTerm}
									onChange={(e) => setSelectedTerm(parseInt(e.target.value))}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium"
								>
									<option value={1}>Term 1</option>
									<option value={2}>Term 2</option>
									<option value={3}>Term 3</option>
								</select>
							</div>
						)}

						{comparisonMode === "week" && (
							<div>
								<label className="block text-sm font-bold text-gray-700 mb-2">Week</label>
								<select
									value={selectedWeek}
									onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium"
								>
									{Array.from({ length: 13 }, (_, i) => i + 1).map(week => (
										<option key={week} value={week}>Week {week}</option>
									))}
								</select>
							</div>
						)}
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
						<div>
							<label className="block text-sm font-bold text-gray-700 mb-2">Period 2 - Year</label>
							<select
								value={compareYear}
								onChange={(e) => setCompareYear(parseInt(e.target.value))}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium"
							>
								{[2024, 2025, 2026].map(year => (
									<option key={year} value={year}>{year}</option>
								))}
							</select>
						</div>

						{comparisonMode !== "year" && (
							<div>
								<label className="block text-sm font-bold text-gray-700 mb-2">Term</label>
								<select
									value={compareTerm}
									onChange={(e) => setCompareTerm(parseInt(e.target.value))}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium"
								>
									<option value={1}>Term 1</option>
									<option value={2}>Term 2</option>
									<option value={3}>Term 3</option>
								</select>
							</div>
						)}

						{comparisonMode === "week" && (
							<div>
								<label className="block text-sm font-bold text-gray-700 mb-2">Week</label>
								<select
									value={compareWeek}
									onChange={(e) => setCompareWeek(parseInt(e.target.value))}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium"
								>
									{Array.from({ length: 13 }, (_, i) => i + 1).map(week => (
										<option key={week} value={week}>Week {week}</option>
									))}
								</select>
							</div>
						)}

						<div>
							<label className="block text-sm font-bold text-gray-700 mb-2">View Metric</label>
							<select
								value={viewMetric}
								onChange={(e) => setViewMetric(e.target.value as any)}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium"
							>
								<option value="fees">Fees Collection</option>
								<option value="expenditure">Expenditure</option>
								<option value="infrastructure">Infrastructure</option>
								<option value="enrollment">Enrollment</option>
								<option value="p7">P7 Prep</option>
								<option value="syllabus">Syllabus</option>
							</select>
						</div>
					</div>
				</div>

				{/* Export Button */}
				<div className="mb-6 flex justify-end">
					<button
						onClick={exportAnalytics}
						className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
					>
						<ArrowDownTrayIcon className="w-5 h-5" />
						Export Analytics
					</button>
				</div>

				{/* KPI Comparison Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
					{comparisonData.map((metric) => {
						const diff = parseFloat(metric.period1 as string) - parseFloat(metric.period2 as string);
						const isPositive = diff > 0;
						return (
							<div key={metric.key} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
								<h3 className="text-lg font-semibold text-gray-900 mb-4">{metric.label}</h3>
								<div className="space-y-3">
									<div>
										<p className="text-sm text-gray-600">{getPeriodLabel(selectedYear, selectedTerm, comparisonMode === "week" ? selectedWeek : undefined)}</p>
										<p className="text-2xl font-bold text-blue-600">{metric.period1}</p>
									</div>
									<div>
										<p className="text-sm text-gray-600">{getPeriodLabel(compareYear, compareTerm, comparisonMode === "week" ? compareWeek : undefined)}</p>
										<p className="text-2xl font-bold text-purple-600">{metric.period2}</p>
									</div>
									<div className={`flex items-center gap-2 p-2 rounded-lg ${isPositive ? "bg-green-50" : "bg-red-50"}`}>
										{isPositive ? (
											<ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
										) : (
											<ArrowTrendingDownIcon className="w-5 h-5 text-red-600" />
										)}
										<p className={`font-bold ${isPositive ? "text-green-700" : "text-red-700"}`}>
											{isPositive ? "+" : ""}{diff.toFixed(1)}
										</p>
									</div>
								</div>
							</div>
						);
					})}
				</div>

				{/* Trend Chart */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
					<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Analysis</h3>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={trendData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="name" />
								<YAxis />
								<Tooltip />
								<Legend />
								<Line 
									type="monotone" 
									dataKey={getPeriodLabel(selectedYear, selectedTerm, comparisonMode === "week" ? selectedWeek : undefined)}
									stroke="#3b82f6" 
									strokeWidth={2}
									dot={false}
								/>
								<Line 
									type="monotone" 
									dataKey={getPeriodLabel(compareYear, compareTerm, comparisonMode === "week" ? compareWeek : undefined)}
									stroke="#8b5cf6" 
									strokeWidth={2}
									dot={false}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>

					<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">School Performance Comparison</h3>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={schoolPerformance}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
								<YAxis />
								<Tooltip />
								<Legend />
								<Bar 
									dataKey={getPeriodLabel(selectedYear, selectedTerm, comparisonMode === "week" ? selectedWeek : undefined)}
									fill="#3b82f6" 
								/>
								<Bar 
									dataKey={getPeriodLabel(compareYear, compareTerm, comparisonMode === "week" ? compareWeek : undefined)}
									fill="#8b5cf6" 
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Detailed Comparison Table */}
				<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Comparison</h3>
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Metric</th>
									<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{getPeriodLabel(selectedYear, selectedTerm, comparisonMode === "week" ? selectedWeek : undefined)}</th>
									<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{getPeriodLabel(compareYear, compareTerm, comparisonMode === "week" ? compareWeek : undefined)}</th>
									<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Difference</th>
									<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Change %</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200">
								{comparisonData.map((metric) => {
									const p1 = parseFloat(metric.period1 as string);
									const p2 = parseFloat(metric.period2 as string);
									const diff = p1 - p2;
									const changePct = p2 !== 0 ? ((diff / p2) * 100).toFixed(1) : "N/A";
									return (
										<tr key={metric.key} className="hover:bg-gray-50">
											<td className="px-6 py-4 text-sm text-gray-900 font-medium">{metric.label}</td>
											<td className="px-6 py-4 text-sm text-gray-800">{p1}</td>
											<td className="px-6 py-4 text-sm text-gray-800">{p2}</td>
											<td className={`px-6 py-4 text-sm font-bold ${diff > 0 ? "text-green-700" : "text-red-700"}`}>
												{diff > 0 ? "+" : ""}{diff.toFixed(1)}
											</td>
											<td className={`px-6 py-4 text-sm font-bold ${changePct !== "N/A" && parseFloat(changePct as string) > 0 ? "text-green-700" : "text-red-700"}`}>
												{changePct !== "N/A" ? (parseFloat(changePct as string) > 0 ? "+" : "") + changePct : changePct}%
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
