"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import KPITargetSettings from "@/components/KPITargetSettings";
import TodoListCard from "@/components/TodoListCard";
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
} from "recharts";
import {
	ArrowDownTrayIcon,
	ArrowTrendingUpIcon,
	ArrowTrendingDownIcon,
	CalendarIcon,
	CheckCircleIcon,
	SparklesIcon,
	ClockIcon,
	HandThumbUpIcon,
	HandThumbDownIcon,
	ChatBubbleLeftRightIcon,
	CheckIcon,
	XMarkIcon,
	BellIcon,
} from "@heroicons/react/24/outline";

interface WeeklyReport {
	id: string;
	weekNumber: number;
	year: number;
	feesCollectionPercent: number;
	schoolsExpenditurePercent: number;
	infrastructurePercent: number;
	totalEnrollment: number;
	theologyEnrollment: number;
	p7PrepExamsPercent: number;
	syllabusCoveragePercent: number;
	admissions: number;
	term?: number;
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

interface P7CohortData {
	id: string;
	year: number;
	p6Promotion: number;
	prep1: number;
	prep2: number;
	prep3: number;
	prep4: number;
	prep5: number;
	prep6: number;
	prep7: number;
	prep8: number;
	prep9: number;
	ple: number;
}

interface RedIssue {
	id: string;
	title?: string;
	description?: string;
	status?: string;
	priority?: number;
	week?: number;
	year?: number;
	term?: number;
	issue?: string;
	inCharge?: string;
	createdAt?: string;
	resolvedAt?: string;
}

interface UpcomingEvent {
	id: string;
	date: string;
	activity: string;
	inCharge: string;
	rate?: string;
	priority?: string;
	status?: "ACTIVE" | "COMPLETED";
	weekNumber?: number;
	year?: number;
}

interface GMProject {
	id: string;
	projectName: string;
	projectManager: string;
	progress: number;
	status?: string;
}

interface OtherIncome {
	id: string;
	source: string;
	amount: number;
	year: number;
	month: number;
}

interface IncomeSource {
	id: string;
	name: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

interface Reaction {
	id: string;
	type: "THUMBS_UP" | "THUMBS_DOWN" | "COMMENT";
	comment?: string | null;
	sectionId: string;
	weeklyReportId?: string | null;
	userId: string;
	user?: { name?: string | null };
	createdAt: string;
}

interface Todo {
	id: string;
	userId: string;
	title: string;
	description?: string;
	dueDate: string;
	isCompleted: boolean;
	completedAt?: string;
	isDeferred: boolean;
	deferredUntil?: string;
	priority: "HIGH" | "MEDIUM" | "LOW";
	category: "MEETING" | "TRAINING" | "EVENT" | "DEADLINE" | "GENERAL" | "OTHER";
	reminderSent: boolean;
	createdAt: string;
	updatedAt: string;
}

const currentYear = new Date().getFullYear();
const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#eab308"];

const formatScore = (value?: number) =>
	typeof value === "number" && Number.isFinite(value) ? value.toFixed(1) : "—";

const daysUntil = (dateStr: string) => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const target = new Date(dateStr);
	target.setHours(0, 0, 0, 0);
	return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export default function Dashboard() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const userRole = session?.user?.role;

	const [viewMode, setViewMode] = useState<"current" | "consolidated">("current");
	const [selectedYear, setSelectedYear] = useState(currentYear);
	const [selectedTerm, setSelectedTerm] = useState(1);
	const [selectedWeek, setSelectedWeek] = useState(1);

	const [reports, setReports] = useState<WeeklyReport[]>([]);
	const [scorecards, setScorecards] = useState<WeeklyScorecard[]>([]);
	const [p7Data, setP7Data] = useState<P7CohortData[]>([]);
	const [issues, setIssues] = useState<RedIssue[]>([]);
	const [events, setEvents] = useState<UpcomingEvent[]>([]);
	const [projects, setProjects] = useState<GMProject[]>([]);
	const [incomes, setIncomes] = useState<OtherIncome[]>([]);
	const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
	const [reactions, setReactions] = useState<Reaction[]>([]);
	const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
	const [postingReaction, setPostingReaction] = useState<Record<string, boolean>>({});
	const [showCommentInput, setShowCommentInput] = useState<Record<string, boolean>>({});
	const [p7YearsWindow, setP7YearsWindow] = useState<number>(4);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectionInitialized, setSelectionInitialized] = useState(false);

	// Derived data
	const currentReportId = useMemo(() => {
		return reports.find(r => r.weekNumber === selectedWeek && r.year === selectedYear && (r.term || 1) === selectedTerm)?.id;
	}, [reports, selectedWeek, selectedYear, selectedTerm]);

	const previousWeekReport = useMemo(() => {
		if (!currentReportId) return null;
		const prevWeek = selectedWeek === 1 ? 52 : selectedWeek - 1;
		const prevYear = selectedWeek === 1 ? selectedYear - 1 : selectedYear;
		return reports.find(r => r.weekNumber === prevWeek && r.year === prevYear && (r.term || 1) === selectedTerm);
	}, [reports, selectedWeek, selectedYear, currentReportId, selectedTerm]);

	const enrollmentTrends = useMemo(() => {
		return reports
			.filter(r => r.year === selectedYear && (r.term || 1) === selectedTerm)
			.sort((a, b) => a.weekNumber - b.weekNumber)
			.map(r => ({
				week: r.weekNumber,
				enrollment: r.totalEnrollment,
				theology: r.theologyEnrollment,
			}));
	}, [reports, selectedYear, selectedTerm]);

	const kpiMetrics = useMemo(() => {
		const current = reports.find(r => r.weekNumber === selectedWeek && r.year === selectedYear && (r.term || 1) === selectedTerm);
		const prev = previousWeekReport;

		if (!current) return [];

		return [
			{
				label: "Fees Collection",
				value: current.feesCollectionPercent,
				lastValue: prev?.feesCollectionPercent || 0,
				sectionId: "fees-collection",
				target: 80,
			},
			{
				label: "Schools Expenditure",
				value: current.schoolsExpenditurePercent,
				lastValue: prev?.schoolsExpenditurePercent || 0,
				sectionId: "schools-expenditure",
				target: 70,
			},
			{
				label: "Infrastructure",
				value: current.infrastructurePercent,
				lastValue: prev?.infrastructurePercent || 0,
				sectionId: "infrastructure",
				target: 60,
			},
			{
				label: "Total Enrollment",
				value: current.totalEnrollment,
				lastValue: prev?.totalEnrollment || 0,
				sectionId: "enrollment",
				target: undefined,
			},
			{
				label: "Theology Enrollment",
				value: current.theologyEnrollment,
				lastValue: prev?.theologyEnrollment || 0,
				sectionId: "theology-enrollment",
				target: undefined,
			},
			{
				label: "P7 Exam Prep",
				value: current.p7PrepExamsPercent,
				lastValue: prev?.p7PrepExamsPercent || 0,
				sectionId: "p7-prep",
				target: 85,
			},
			{
				label: "Syllabus Coverage",
				value: current.syllabusCoveragePercent,
				lastValue: prev?.syllabusCoveragePercent || 0,
				sectionId: "syllabus-coverage",
				target: 90,
			},
			{
				label: "New Admissions",
				value: current.admissions,
				lastValue: prev?.admissions || 0,
				sectionId: "admissions",
				target: undefined,
			},
		];
	}, [reports, selectedWeek, selectedYear, selectedTerm, previousWeekReport]);

	const schoolRankings = useMemo(() => {
		const termScores = scorecards
			.filter(s => s.year === selectedYear && s.term === selectedTerm)
			.map(s => ({
				name: s.schoolName,
				score: (s.academicScore + s.financeScore + s.qualityScore + s.technologyScore + s.theologyScore) / 5,
			}))
			.sort((a, b) => b.score - a.score);
		return termScores;
	}, [scorecards, selectedYear, selectedTerm]);

	const p7ChartData = useMemo(() => {
		const latestYear = Math.max(...p7Data.map(d => d.year), currentYear - 1);
		const data = p7Data
			.filter(d => d.year >= latestYear - p7YearsWindow + 1 && d.year <= latestYear)
			.map(d => ({
				year: d.year,
				"P6 Promotion": d.p6Promotion,
				"Prep 1": d.prep1,
				"Prep 2": d.prep2,
				"Prep 3": d.prep3,
				"Prep 4": d.prep4,
				"Prep 5": d.prep5,
				"Prep 6": d.prep6,
				"Prep 7": d.prep7,
				"Prep 8": d.prep8,
				"Prep 9": d.prep9,
				PLE: d.ple,
			}));
		return data;
	}, [p7Data, p7YearsWindow]);

	const tableEvents = useMemo(() => {
		return events
			.filter(e => e.status === "ACTIVE")
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
			.slice(0, 5);
	}, [events]);

	const filteredProjects = useMemo(() => {
		return projects.filter(p => p.status === "ACTIVE").slice(0, 5);
	}, [projects]);

	// Fetch data
	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
			return;
		}

		if (status !== "authenticated") return;

		const fetchData = async () => {
			try {
				setLoading(true);

				const [reportsRes, scorecardsRes, p7Res, issuesRes, eventsRes, projectsRes, sourcesRes, incomesRes, reactionsRes] = await Promise.all([
					fetch(`/api/reports?year=${selectedYear}&weekNumber=${selectedWeek}&term=${selectedTerm}`),
					fetch(`/api/scorecard?year=${selectedYear}&term=${selectedTerm}`),
					fetch("/api/p7-prep"),
					fetch(`/api/issues?year=${selectedYear}&term=${selectedTerm}`),
					fetch("/api/events"),
					fetch("/api/projects"),
					fetch("/api/income-sources"),
					fetch(`/api/other-income?year=${selectedYear}`),
					fetch("/api/reactions"),
				]);

				const reportsData = reportsRes.ok ? await reportsRes.json() : [];
				const scorecardsData = scorecardsRes.ok ? await scorecardsRes.json() : [];
				const p7DataResult = p7Res.ok ? await p7Res.json() : [];
				const issuesData = issuesRes.ok ? await issuesRes.json() : [];
				const eventsData = eventsRes.ok ? await eventsRes.json() : [];
				const projectsData = projectsRes.ok ? await projectsRes.json() : [];
				const sourcesData = sourcesRes.ok ? await sourcesRes.json() : [];
				const incomesData = incomesRes.ok ? await incomesRes.json() : [];
				const reactionsData = reactionsRes.ok ? await reactionsRes.json() : [];

				setReports(Array.isArray(reportsData) ? reportsData : reportsData.data || []);
				setScorecards(Array.isArray(scorecardsData) ? scorecardsData : scorecardsData.data || []);
				setP7Data(Array.isArray(p7DataResult) ? p7DataResult : p7DataResult.data || []);
				setIssues(Array.isArray(issuesData) ? issuesData : issuesData.data || []);
				setEvents(Array.isArray(eventsData) ? eventsData : eventsData.data || []);
				setProjects(Array.isArray(projectsData) ? projectsData : projectsData.data || []);
				setIncomeSources(Array.isArray(sourcesData) ? sourcesData : sourcesData.data || []);
				setIncomes(Array.isArray(incomesData) ? incomesData : incomesData.data || []);
				setReactions(Array.isArray(reactionsData) ? reactionsData : reactionsData.data || []);
				setError(null);
			} catch (err) {
				console.error("Fetch error:", err);
				setError("Failed to load dashboard data");
			} finally {
				setLoading(false);
				setSelectionInitialized(true);
			}
		};

		fetchData();
	}, [status, selectedYear, selectedWeek, selectedTerm, router]);

	const postReaction = useCallback(
		async (sectionId: string, type: Reaction["type"], comment?: string) => {
			if (!currentReportId) return;

			const key = `${sectionId}-${type}`;
			try {
				setPostingReaction(prev => ({ ...prev, [key]: true }));
				const res = await fetch("/api/reactions", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ sectionId, type, comment, weeklyReportId: currentReportId }),
				});
				if (!res.ok) throw new Error("Failed to save reaction");
				const saved = await res.json();
				const savedReaction: Reaction | Reaction[] = saved.data || saved;
				setReactions(prev => {
					const next = Array.isArray(savedReaction) ? savedReaction : [savedReaction];
					return [...prev, ...next];
				});
				if (type === "COMMENT") {
					setCommentDrafts(prev => ({ ...prev, [sectionId]: "" }));
					setShowCommentInput(prev => ({ ...prev, [sectionId]: false }));
				}
			} catch (err) {
				alert(err instanceof Error ? err.message : "Failed to save reaction");
			} finally {
				setPostingReaction(prev => ({ ...prev, [key]: false }));
			}
		},
		[currentReportId]
	);

	const exportToExcel = useCallback(() => {
		try {
			const wb = XLSX.utils.book_new();

			// Sheet 1: KPI Summary
			const kpiData = kpiMetrics.map(metric => ({
				"KPI": metric.label,
				"Current": metric.value,
				"Previous": metric.lastValue,
				"Change": metric.value - metric.lastValue,
				"Target": metric.target || "-",
			}));
			const kpiSheet = XLSX.utils.json_to_sheet(kpiData);
			kpiSheet['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
			XLSX.utils.book_append_sheet(wb, kpiSheet, "KPI Summary");

			// Sheet 2: Enrollment Trends
			const trendsData = enrollmentTrends.map(item => ({
				"Week": item.week,
				"Total Enrollment": item.enrollment,
				"Theology Enrollment": item.theology,
			}));
			const trendsSheet = XLSX.utils.json_to_sheet(trendsData);
			trendsSheet['!cols'] = [{ wch: 10 }, { wch: 15 }, { wch: 20 }];
			XLSX.utils.book_append_sheet(wb, trendsSheet, "Enrollment Trends");

			// Sheet 3: School Rankings
			const rankingsData = schoolRankings.map((item, idx) => ({
				"Rank": idx + 1,
				"School": item.name,
				"Score": item.score.toFixed(2),
			}));
			const rankingsSheet = XLSX.utils.json_to_sheet(rankingsData);
			rankingsSheet['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 12 }];
			XLSX.utils.book_append_sheet(wb, rankingsSheet, "School Rankings");

			// Sheet 4: P7 Performance
			const p7Data = p7ChartData.map(item => ({
				"Year": item.year,
				"P6 Promotion": item["P6 Promotion"],
				"Prep 1": item["Prep 1"],
				"Prep 2": item["Prep 2"],
				"Prep 3": item["Prep 3"],
				"Prep 4": item["Prep 4"],
				"Prep 5": item["Prep 5"],
				"Prep 6": item["Prep 6"],
				"Prep 7": item["Prep 7"],
				"Prep 8": item["Prep 8"],
				"Prep 9": item["Prep 9"],
				"PLE": item["PLE"],
			}));
			const p7Sheet = XLSX.utils.json_to_sheet(p7Data);
			XLSX.utils.book_append_sheet(wb, p7Sheet, "P7 Performance");

			// Sheet 5: Events
			const eventData = tableEvents.map(evt => ({
				"Date": new Date(evt.date).toLocaleDateString(),
				"Activity": evt.activity,
				"In Charge": evt.inCharge,
			}));
			const eventSheet = XLSX.utils.json_to_sheet(eventData);
			eventSheet['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 20 }];
			XLSX.utils.book_append_sheet(wb, eventSheet, "Events");

			// Sheet 6: Projects
			const projectsData = filteredProjects.map(proj => ({
				"Project": proj.projectName,
				"Manager": proj.projectManager,
				"Progress %": proj.progress,
				"Status": proj.status || "ACTIVE",
			}));
			const projectsSheet = XLSX.utils.json_to_sheet(projectsData);
			projectsSheet['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 12 }];
			XLSX.utils.book_append_sheet(wb, projectsSheet, "GM Projects");

			// Generate filename
			const timestamp = new Date().toISOString().slice(0, 10);
			const filename = `Dashboard_Report_${selectedYear}_T${selectedTerm}_${timestamp}.xlsx`;

			// Save the workbook
			XLSX.writeFile(wb, filename);
		} catch (error) {
			console.error("Export failed:", error);
			alert("Failed to export to Excel");
		}
	}, [kpiMetrics, enrollmentTrends, schoolRankings, p7ChartData, tableEvents, filteredProjects, selectedYear, selectedTerm]);

	if (status === "loading" || loading) {
		return (
			<DashboardLayout 
				selectedYear={selectedYear}
				selectedTerm={selectedTerm}
				selectedWeek={selectedWeek}
				setSelectedYear={setSelectedYear}
				setSelectedTerm={setSelectedTerm}
				setSelectedWeek={setSelectedWeek}
				showPeriodFilters={true}
			>
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
						<p className="text-gray-600">Loading dashboard...</p>
					</div>
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout 
			selectedYear={selectedYear}
			selectedTerm={selectedTerm}
			selectedWeek={selectedWeek}
			setSelectedYear={setSelectedYear}
			setSelectedTerm={setSelectedTerm}
			setSelectedWeek={setSelectedWeek}
			showPeriodFilters={true}
		>
			<div className="space-y-8">
				{/* Error Display */}
				{error && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
						{error}
					</div>
				)}

				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
						<p className="text-gray-600 mt-1">
							Week {selectedWeek} • Term {selectedTerm} • {selectedYear}
						</p>
					</div>
					<div className="flex gap-3">
						<button
							onClick={exportToExcel}
							className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
						>
							<ArrowDownTrayIcon className="w-5 h-5" />
							Export
						</button>
						<button
							onClick={() => window.print()}
							className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
						>
							<BellIcon className="w-5 h-5" />
							Print
						</button>
					</div>
				</div>

				{/* KPI Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
					{kpiMetrics.map((metric, idx) => {
						const trend = metric.value - metric.lastValue;
						let trendPercent = "0";
						if (metric.lastValue === 0 && metric.value > 0) {
							trendPercent = "100";
						} else if (metric.lastValue === 0 && metric.value === 0) {
							trendPercent = "0";
						} else if (metric.lastValue !== 0) {
							trendPercent = ((trend / Math.abs(metric.lastValue)) * 100).toFixed(1);
						}
						const isPositive = trend > 0;
						const isNeutral = trend === 0;
						const hasTarget = metric.target !== undefined && metric.target !== null;
						const targetMet = hasTarget && metric.value >= (metric.target || 0);
						const targetProgress = hasTarget && metric.target ? Math.min((metric.value / metric.target) * 100, 100) : 0;

						const sectionReactions = reactions.filter(
							r => r.sectionId === metric.sectionId && r.weeklyReportId === currentReportId
						);
						const currentUserId = session?.user?.id;
						const userThumbsUp = sectionReactions.find(r => r.type === "THUMBS_UP" && r.userId === currentUserId);
						const userThumbsDown = sectionReactions.find(r => r.type === "THUMBS_DOWN" && r.userId === currentUserId);
						const thumbsUp = sectionReactions.filter(r => r.type === "THUMBS_UP").length;
						const thumbsDown = sectionReactions.filter(r => r.type === "THUMBS_DOWN").length;
						const comments = sectionReactions.filter(r => r.type === "COMMENT");
						const draft = commentDrafts[metric.sectionId] || "";
						const isPostingUp = postingReaction[`${metric.sectionId}-THUMBS_UP`] || false;
						const isPostingDown = postingReaction[`${metric.sectionId}-THUMBS_DOWN`] || false;
						const isPostingComment = postingReaction[`${metric.sectionId}-COMMENT`] || false;
						const isTrustee = userRole === "TRUSTEE";
						const isGM = userRole === "GM";

						return (
							<div
								key={idx}
								className={`bg-white p-6 rounded-xl shadow-sm border transition-all hover:shadow-md hover:-translate-y-0.5 ${
									targetMet ? "border-green-300 bg-gradient-to-b from-green-50/60 to-white" : "border-gray-100"
								}`}
							>
								<div className="flex items-start justify-between mb-4">
									<div className="flex items-center gap-2">
										<span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
											{metric.label}
										</span>
										{targetMet && (
											<span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-green-700 bg-green-100 rounded-full border border-green-200">
												<CheckCircleIcon className="w-4 h-4" /> Target met
											</span>
										)}
									</div>
									<div
										className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border ${
											isNeutral
												? "text-gray-600 bg-gray-50 border-gray-200"
												: isPositive
													? "text-green-700 bg-green-50 border-green-200"
													: "text-red-700 bg-red-50 border-red-200"
										}`}
									>
										{isNeutral ? (
											<span>Flat</span>
										) : isPositive ? (
											<>
												<ArrowTrendingUpIcon className="w-4 h-4" /> +{trendPercent}%
											</>
										) : (
											<>
												<ArrowTrendingDownIcon className="w-4 h-4" /> {trendPercent}%
											</>
										)}
									</div>
								</div>

								<div className="flex items-end justify-between mb-3">
									<p className="text-4xl font-semibold text-gray-900 leading-none">{metric.value}</p>
									{hasTarget && <span className="text-xs font-semibold text-gray-600">Target {metric.target}</span>}
								</div>

								{hasTarget && (
									<div className="mt-2 mb-4">
										<div className="flex items-center justify-between mb-1 text-xs text-gray-600">
											<span>Progress</span>
											<span className={targetMet ? "text-green-700 font-semibold" : "font-semibold text-gray-700"}>
												{targetProgress.toFixed(0)}%
											</span>
										</div>
										<div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
											<div
												className={`h-2 rounded-full transition-all duration-500 ${
													targetMet
														? "bg-green-500"
														: targetProgress >= 80
															? "bg-blue-500"
															: targetProgress >= 50
																? "bg-amber-500"
																: "bg-red-500"
												}`}
												style={{ width: `${targetProgress}%` }}
											></div>
										</div>
									</div>
								)}

								<div className="flex items-center justify-between text-xs text-gray-600 mb-4">
									{previousWeekReport ? (
										<span>
											Last week: <span className="font-semibold text-gray-800">{metric.lastValue}</span>
										</span>
									) : (
										<span className="italic">No previous data</span>
									)}
									{currentReportId && (
										<span className="text-gray-500">Period #{selectedWeek} • Term {selectedTerm}</span>
									)}
								</div>

								{/* Trustee Reactions - Always Visible */}
								{isTrustee && currentReportId && (
									<div className="mb-4 pb-4 border-b border-gray-200">
										<div className="flex items-center justify-between gap-2 mb-2">
											<div className="flex items-center gap-2">
												<button
													disabled={isPostingUp || !!userThumbsUp}
													onClick={() => postReaction(metric.sectionId, "THUMBS_UP")}
													className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
														userThumbsUp
															? "bg-blue-100 text-blue-700 border-blue-300 cursor-not-allowed"
															: isPostingUp
																? "bg-blue-50 text-blue-600 border-blue-200"
																: "bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
													}`}
													title={userThumbsUp ? "You already liked this" : "Like this KPI"}
												>
													<HandThumbUpIcon className="w-4 h-4" /> {thumbsUp}
												</button>
												<button
													disabled={isPostingDown || !!userThumbsDown}
													onClick={() => postReaction(metric.sectionId, "THUMBS_DOWN")}
													className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
														userThumbsDown
															? "bg-red-100 text-red-700 border-red-300 cursor-not-allowed"
															: isPostingDown
																? "bg-red-50 text-red-600 border-red-200"
																: "bg-white text-gray-700 border-gray-200 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
													}`}
													title={userThumbsDown ? "You already disliked this" : "Dislike this KPI"}
												>
													<HandThumbDownIcon className="w-4 h-4" /> {thumbsDown}
												</button>
												<button
													onClick={() => {
														setShowCommentInput(prev => ({ ...prev, [metric.sectionId]: !prev[metric.sectionId] }));
													}}
													className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-colors"
													title="View and add comments"
												>
													<ChatBubbleLeftRightIcon className="w-4 h-4" /> {comments.length}
												</button>
											</div>
											{isGM && sectionReactions.length > 0 && (
												<span className="text-[10px] text-gray-500 italic">Seen by GM</span>
											)}
										</div>
									</div>
								)}

								{/* GM View - Show reactions with seen indicator */}
								{isGM && currentReportId && sectionReactions.length > 0 && (
									<div className="mb-4 pb-4 border-b border-gray-200">
										<div className="flex items-center gap-2 mb-1">
											<div className="flex items-center gap-2">
												<span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
													<HandThumbUpIcon className="w-3.5 h-3.5" /> {thumbsUp}
												</span>
												<span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200">
													<HandThumbDownIcon className="w-3.5 h-3.5" /> {thumbsDown}
												</span>
												<span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
													<ChatBubbleLeftRightIcon className="w-3.5 h-3.5" /> {comments.length}
												</span>
											</div>
										</div>
										<p className="text-[10px] text-gray-500 italic">Seen by GM</p>
									</div>
								)}

								<details className="group border border-gray-100 rounded-lg bg-gray-50/60 transition-colors">
									<summary className="flex items-center justify-between px-3 py-2 cursor-pointer text-xs font-semibold text-gray-700">
										<div className="flex items-center gap-2">
											<ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-600" />
											<span>Comments & Context</span>
										</div>
										<span className="text-gray-500 group-open:hidden">Show</span>
										<span className="text-gray-500 hidden group-open:block">Hide</span>
									</summary>
									<div className="px-3 pb-3 pt-1 space-y-3">
										<div className="space-y-2 max-h-40 overflow-y-auto">
											{comments.length === 0 && (
												<p className="text-xs text-gray-500 italic">No comments yet.</p>
											)}
											{comments.map((c) => (
												<div key={c.id} className="p-2 rounded-lg bg-white border border-gray-100">
													<p className="text-xs text-gray-800 leading-snug">{c.comment}</p>
													<p className="mt-1 text-[10px] text-gray-500">
														{c.user?.name || "User"} • {new Date(c.createdAt).toLocaleString()}
													</p>
												</div>
											))}
										</div>

										{currentReportId ? (
											isTrustee && showCommentInput[metric.sectionId] ? (
												<div className="flex flex-col gap-2">
													<label className="text-[11px] font-semibold text-gray-700">Add your comment</label>
													<div className="flex gap-2">
														<input
															value={draft}
															onChange={(e) => setCommentDrafts(prev => ({ ...prev, [metric.sectionId]: e.target.value }))}
															placeholder="Add a note for the GM"
															className="flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
															autoFocus
														/>
														<button
															disabled={!draft.trim() || isPostingComment}
															onClick={() => postReaction(metric.sectionId, "COMMENT", draft.trim())}
															className="px-3 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
														>
															{isPostingComment ? "Saving..." : "Post"}
														</button>
														<button
															onClick={() => setShowCommentInput(prev => ({ ...prev, [metric.sectionId]: false }))}
															className="px-3 py-2 text-sm font-semibold rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
														>
															Cancel
														</button>
													</div>
												</div>
											) : isGM && showCommentInput[metric.sectionId] ? (
												<div className="flex flex-col gap-2">
													<label className="text-[11px] font-semibold text-gray-700">GM note to trustees</label>
													<textarea
														value={draft}
														onChange={(e) => setCommentDrafts(prev => ({ ...prev, [metric.sectionId]: e.target.value }))}
														placeholder="Explain this KPI to trustees"
														rows={2}
														className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
														autoFocus
													/>
													<div className="flex justify-end gap-2">
														<button
															onClick={() => setShowCommentInput(prev => ({ ...prev, [metric.sectionId]: false }))}
															className="px-3 py-2 text-sm font-semibold rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
														>
															Cancel
														</button>
														<button
															disabled={!draft.trim() || isPostingComment}
															onClick={() => postReaction(metric.sectionId, "COMMENT", draft.trim())}
															className="px-3 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
														>
															{isPostingComment ? "Saving..." : "Post"}
														</button>
													</div>
												</div>
											) : (
												!isTrustee && !isGM && <p className="text-xs text-gray-500">Notes and reactions are available to trustees for this period.</p>
											)
										) : (
											<p className="text-xs text-gray-500">Select a specific period to add context.</p>
										)}
									</div>
								</details>
							</div>
						);
					})}
				</div>

				{/* Charts Section */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
					{/* Enrollment Trends */}
					<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
						<h3 className="text-lg font-semibold mb-4 text-gray-900">Enrollment Trends</h3>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={enrollmentTrends}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="week" />
								<YAxis />
								<Tooltip />
								<Legend />
								<Line type="monotone" dataKey="enrollment" stroke="#3b82f6" name="Total" />
								<Line type="monotone" dataKey="theology" stroke="#8b5cf6" name="Theology" />
							</LineChart>
						</ResponsiveContainer>
					</div>

					{/* School Rankings */}
					<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
						<h3 className="text-lg font-semibold mb-4 text-gray-900">School Rankings</h3>
						{schoolRankings.length > 0 ? (
							<div className="space-y-3">
								{schoolRankings.map((school, idx) => (
									<div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
												{idx + 1}
											</div>
											<span className="font-medium text-gray-700">{school.name}</span>
										</div>
										<span className="font-semibold text-gray-900">{school.score.toFixed(1)}</span>
									</div>
								))}
							</div>
						) : (
							<p className="text-gray-500 text-center py-8">No school data available</p>
						)}
					</div>
				</div>

				{/* Events and Projects */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
					{/* Upcoming Events */}
					<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
						<h3 className="text-lg font-semibold mb-4 text-gray-900">Upcoming Events</h3>
						{tableEvents.length > 0 ? (
							<div className="space-y-3">
								{tableEvents.map((event, idx) => {
									const daysLeft = daysUntil(event.date);
									return (
										<div key={idx} className="p-3 bg-gray-50 rounded-lg">
											<div className="flex items-start justify-between mb-1">
												<h4 className="font-medium text-gray-900">{event.activity}</h4>
												<span className={`text-xs font-semibold px-2 py-1 rounded-full ${
													daysLeft <= 0 ? "bg-red-100 text-red-700" :
													daysLeft <= 7 ? "bg-yellow-100 text-yellow-700" :
													"bg-green-100 text-green-700"
												}`}>
													{daysLeft <= 0 ? "Today" : `${daysLeft}d`}
												</span>
											</div>
											<p className="text-xs text-gray-600">{event.inCharge}</p>
										</div>
									);
								})}
							</div>
						) : (
							<p className="text-gray-500 text-center py-8">No upcoming events</p>
						)}
					</div>

					{/* GM Projects */}
					<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
						<h3 className="text-lg font-semibold mb-4 text-gray-900">GM Projects</h3>
						{filteredProjects.length > 0 ? (
							<div className="space-y-3">
								{filteredProjects.map((project, idx) => (
									<div key={idx} className="p-3 bg-gray-50 rounded-lg">
										<div className="flex items-start justify-between mb-2">
											<h4 className="font-medium text-gray-900 text-sm">{project.projectName}</h4>
											<span className="text-xs font-semibold text-blue-600">{project.progress}%</span>
										</div>
										<div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-1">
											<div
												className="bg-blue-600 h-2 rounded-full transition-all"
												style={{ width: `${project.progress}%` }}
											></div>
										</div>
										<p className="text-xs text-gray-600">{project.projectManager}</p>
									</div>
								))}
							</div>
						) : (
							<p className="text-gray-500 text-center py-8">No active projects</p>
						)}
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
