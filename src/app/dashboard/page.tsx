"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import KPITargetSettings from "@/components/KPITargetSettings";
import TodoListCard from "@/components/TodoListCard";
import PushNotificationSetup from "@/components/PushNotificationSetup";
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
	const [theologyEnrollments, setTheologyEnrollments] = useState<any[]>([]);
	const [previousTheologyEnrollments, setPreviousTheologyEnrollments] = useState<any[]>([]);
	const [enrollments, setEnrollments] = useState<any[]>([]);
	const [previousEnrollments, setPreviousEnrollments] = useState<any[]>([]);
	const [reactions, setReactions] = useState<Reaction[]>([]);
	const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
	const [postingReaction, setPostingReaction] = useState<Record<string, boolean>>({});
	const [p7YearsWindow, setP7YearsWindow] = useState<number>(4);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectionInitialized, setSelectionInitialized] = useState(false);
	const [eventStatusFilter, setEventStatusFilter] = useState<"ACTIVE" | "COMPLETED" | "ALL">("ALL");
	const [incomeSourceDeleting, setIncomeSourceDeleting] = useState<string | null>(null);
	const [todos, setTodos] = useState<Todo[]>([]);
	const [newTodo, setNewTodo] = useState({ title: "", description: "", dueDate: "", priority: "MEDIUM", category: "GENERAL" });
	const [showTodoForm, setShowTodoForm] = useState(false);
	const [projectStatusFilter, setProjectStatusFilter] = useState<"ALL" | "OPEN" | "IN_PROGRESS" | "COMPLETED">("ALL");

	const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
	const [enrollmentForm, setEnrollmentForm] = useState({
		year: 2020,
		totalEnrollment: 0,
		theologyEnrollment: 0,
	});
	const [savingEnrollment, setSavingEnrollment] = useState(false);

	const [kpiTargets, setKpiTargets] = useState({
		feesCollectionPercent: 100,
		schoolsExpenditurePercent: 85,
		infrastructurePercent: 80,
		p7PrepExamsPercent: 90,
		syllabusCoveragePercent: 95,
		totalEnrollment: undefined as number | undefined,
		theologyEnrollment: undefined as number | undefined,
		admissions: undefined as number | undefined,
	});

	useEffect(() => {
		const savedTargets = localStorage.getItem("kpiTargets");
		if (savedTargets) {
			try {
				setKpiTargets(JSON.parse(savedTargets));
			} catch (e) {
				console.error("Failed to parse saved KPI targets", e);
			}
		}
	}, []);

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
		}
	}, [status, router]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				setError(null);

				const scorecardsParams = new URLSearchParams({
					year: String(selectedYear),
					term: String(selectedTerm),
				});

			const theologyParams = new URLSearchParams({
				year: String(selectedYear),
				term: String(selectedTerm),
			});

			// Calculate previous term (handles year rollover)
			const prevTerm = selectedTerm === 1 ? 3 : selectedTerm - 1;
			const prevYear = selectedTerm === 1 ? selectedYear - 1 : selectedYear;
			const previousTheologyParams = new URLSearchParams({
				year: String(prevYear),
				term: String(prevTerm),
			});

			const enrollmentParams = new URLSearchParams({
				year: String(selectedYear),
				term: String(selectedTerm),
			});

			const previousEnrollmentParams = new URLSearchParams({
				year: String(prevYear),
				term: String(prevTerm),
			});

			const [reportsRes, scorecardsRes, p7Res, issuesRes, eventsRes, projectsRes, sourcesRes, incomesRes, theologyRes, previousTheologyRes, enrollmentRes, previousEnrollmentRes, reactionsRes, todosRes] = await Promise.all([
				fetch("/api/reports"),
				fetch(`/api/scorecard?${scorecardsParams.toString()}`),
				fetch("/api/p7-prep"),
				fetch("/api/issues"),
				fetch("/api/events"),
				fetch("/api/projects"),
				fetch("/api/income-sources"),
				fetch("/api/other-income"),
				fetch(`/api/theology-enrollment?${theologyParams.toString()}`),
				fetch(`/api/theology-enrollment?${previousTheologyParams.toString()}`),
				fetch(`/api/enrollment?${enrollmentParams.toString()}`),
				fetch(`/api/enrollment?${previousEnrollmentParams.toString()}`),
				fetch("/api/reactions"),
				fetch("/api/todos"),
			]);

			if (!reportsRes.ok) throw new Error("Failed to fetch reports");
			if (!scorecardsRes.ok) throw new Error("Failed to fetch scorecards");
			if (!p7Res.ok) throw new Error("Failed to fetch P7 data");
			if (!issuesRes.ok) throw new Error("Failed to fetch issues");

			const reportsData = await reportsRes.json();
			const scorecardsData = await scorecardsRes.json();
			const p7ResponseData = await p7Res.json();
			const issuesData = await issuesRes.json();
			const eventsData = eventsRes.ok ? await eventsRes.json() : { data: [] };
			const projectsData = projectsRes.ok ? await projectsRes.json() : { data: [] };
			const sourcesData = sourcesRes.ok ? await sourcesRes.json() : { data: [] };
			const incomesResponse = incomesRes.ok ? await incomesRes.json() : { data: [] };
			const theologyData = theologyRes.ok ? await theologyRes.json() : [];
			const previousTheologyData = previousTheologyRes.ok ? await previousTheologyRes.json() : [];
			const enrollmentData = enrollmentRes.ok ? await enrollmentRes.json() : [];
			const previousEnrollmentData = previousEnrollmentRes.ok ? await previousEnrollmentRes.json() : [];
			const reactionsData = reactionsRes.ok ? await reactionsRes.json() : [];
			const todosData = todosRes.ok ? await todosRes.json() : [];

			const currentTheologyTotal = Array.isArray(theologyData) ? theologyData.reduce((sum: number, e: any) => sum + e.count, 0) : 0;
			const previousTheologyTotal = Array.isArray(previousTheologyData) ? previousTheologyData.reduce((sum: number, e: any) => sum + e.count, 0) : 0;

			console.log('📊 Theology Data Fetched:', {
				selectedYear,
				selectedTerm,
				currentRecords: Array.isArray(theologyData) ? theologyData.length : 0,
				currentTotal: currentTheologyTotal,
				firstCurrentRecord: theologyData[0],
				prevTerm: selectedTerm === 1 ? 3 : selectedTerm - 1,
				prevYear: selectedTerm === 1 ? selectedYear - 1 : selectedYear,
				previousRecords: Array.isArray(previousTheologyData) ? previousTheologyData.length : 0,
				previousTotal: previousTheologyTotal,
				firstPreviousRecord: previousTheologyData[0],
			});

			setReports(reportsData.data || []);

			const normalizedScorecards = (Array.isArray(scorecardsData) ? scorecardsData : scorecardsData.data || []).map((sc: any) => ({
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
				setScorecards(normalizedScorecards);
				setP7Data(Array.isArray(p7ResponseData) ? p7ResponseData : p7ResponseData.data || []);
				setIssues(Array.isArray(issuesData) ? issuesData : issuesData.data || []);
				setEvents(Array.isArray(eventsData) ? eventsData : eventsData.data || []);
				setProjects(Array.isArray(projectsData) ? projectsData : (projectsData.data || []));
				setIncomeSources(sourcesData.data || []);
				setIncomes(incomesResponse.data || []);
				setTheologyEnrollments(Array.isArray(theologyData) ? theologyData : []);
				setPreviousTheologyEnrollments(Array.isArray(previousTheologyData) ? previousTheologyData : []);
				setEnrollments(Array.isArray(enrollmentData) ? enrollmentData : []);
				setPreviousEnrollments(Array.isArray(previousEnrollmentData) ? previousEnrollmentData : []);
				setReactions(Array.isArray(reactionsData) ? reactionsData : reactionsData.data || []);
				setTodos(Array.isArray(todosData) ? todosData : todosData.data || []);
			} catch (err) {
				console.error(err);
				setError(err instanceof Error ? err.message : "Failed to load dashboard data");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [selectedYear, selectedTerm]);

	useEffect(() => {
		if (selectionInitialized) return;

		const latestReport = [...reports].sort((a, b) => b.year - a.year || b.weekNumber - a.weekNumber)[0];
		const latestScorecard = [...scorecards].sort((a, b) => b.year - a.year || b.week - a.week)[0];

			if (latestReport) {
				setSelectedYear(latestReport.year);
				setSelectedWeek(latestReport.weekNumber);
				if (latestReport.term) {
					setSelectedTerm(latestReport.term);
				}
				setSelectionInitialized(true);
			} else if (latestScorecard) {
				setSelectedYear(latestScorecard.year);
				setSelectedWeek(latestScorecard.week);
				setSelectedTerm(latestScorecard.term || 1);
				setSelectionInitialized(true);
			}
			// If no data yet, do not mark initialized; wait for fetch to complete
	}, [reports, scorecards, selectionInitialized]);

	const filteredReports = useMemo(() => {
		const sorted = [...reports].sort((a, b) => b.year - a.year || b.weekNumber - a.weekNumber);
		if (viewMode === "consolidated") {
			return sorted.filter(r => r.year === selectedYear && (r.term ?? selectedTerm) === selectedTerm);
		}
		return sorted.filter(
			r => r.year === selectedYear && (r.term ?? selectedTerm) === selectedTerm && r.weekNumber === selectedWeek
		);
	}, [reports, selectedYear, selectedWeek, selectedTerm, viewMode]);

	const currentReport = filteredReports[0];
	const currentReportId = currentReport?.id;

	const previousWeekReport = useMemo(() => {
		const targetWeek = selectedWeek - 1;
		if (targetWeek <= 0) return undefined;
		return reports.find(
			r => r.year === selectedYear && (r.term ?? selectedTerm) === selectedTerm && r.weekNumber === targetWeek
		);
	}, [reports, selectedYear, selectedWeek, selectedTerm]);

	// Calculate current theology enrollment from API data (same throughout the term)
	const currentTheologyEnrollment = useMemo(() => {
		const total = theologyEnrollments.reduce((sum, e) => sum + e.count, 0);
		console.log('✅ Current Theology:', {
			year: selectedYear,
			term: selectedTerm,
			records: theologyEnrollments.length,
			total,
			sampleData: theologyEnrollments.slice(0, 2)
		});
		return total;
	}, [theologyEnrollments, selectedYear, selectedTerm]);

	// Calculate previous term theology enrollment for comparison
	const previousTheologyEnrollment = useMemo(() => {
		const total = previousTheologyEnrollments.reduce((sum, e) => sum + e.count, 0);
		const prevTerm = selectedTerm === 1 ? 3 : selectedTerm - 1;
		const prevYear = selectedTerm === 1 ? selectedYear - 1 : selectedYear;
		console.log('⬅️ Previous Theology:', {
			prevYear,
			prevTerm,
			records: previousTheologyEnrollments.length,
			total,
			sampleData: previousTheologyEnrollments.slice(0, 2)
		});
		return total;
	}, [previousTheologyEnrollments, selectedTerm, selectedYear]);

	// Calculate current schools enrollment from API data
	const currentEnrollment = useMemo(() => {
		const total = enrollments.reduce((sum, e) => sum + e.count, 0);
		console.log('✅ Current Enrollment:', {
			year: selectedYear,
			term: selectedTerm,
			records: enrollments.length,
			total,
			sampleData: enrollments.slice(0, 2),
			allSchools: [...new Set(enrollments.map(e => e.school))],
			bySchool: enrollments.reduce((acc: any, e) => {
				if (!acc[e.school]) acc[e.school] = 0;
				acc[e.school] += e.count;
				return acc;
			}, {})
		});
		return total;
	}, [enrollments, selectedYear, selectedTerm]);

	// Calculate previous term schools enrollment for comparison
	const previousEnrollment = useMemo(() => {
		const total = previousEnrollments.reduce((sum, e) => sum + e.count, 0);
		const prevTerm = selectedTerm === 1 ? 3 : selectedTerm - 1;
		const prevYear = selectedTerm === 1 ? selectedYear - 1 : selectedYear;
		console.log('⬅️ Previous Enrollment:', {
			prevYear,
			prevTerm,
			records: previousEnrollments.length,
			total,
			sampleData: previousEnrollments.slice(0, 2)
		});
		return total;
	}, [previousEnrollments, selectedYear, selectedTerm]);

	const kpiMetrics = useMemo(() => {
		const current = currentReport;
		return [
			{
				label: "Fees Collection",
				sectionId: "fees-collection",
				value: Math.round(current?.feesCollectionPercent ?? 0),
				lastValue: Math.round(previousWeekReport?.feesCollectionPercent ?? 0),
				target: kpiTargets.feesCollectionPercent,
			},
			{
				label: "Expenditure %",
				sectionId: "schools-expenditure",
				value: Math.round(current?.schoolsExpenditurePercent ?? 0),
				lastValue: Math.round(previousWeekReport?.schoolsExpenditurePercent ?? 0),
				target: kpiTargets.schoolsExpenditurePercent,
			},
			{
				label: "Infrastructure %",
				sectionId: "infrastructure",
				value: Math.round(current?.infrastructurePercent ?? 0),
				lastValue: Math.round(previousWeekReport?.infrastructurePercent ?? 0),
				target: kpiTargets.infrastructurePercent,
			},
			{
				label: "Enrollment",
				sectionId: "enrollment",
				value: currentEnrollment,
				lastValue: previousEnrollment,
				target: kpiTargets.totalEnrollment,
			},
			{
				label: "Theology",
				sectionId: "theology-enrollment",
				value: currentTheologyEnrollment,
				lastValue: previousTheologyEnrollment,
				target: kpiTargets.theologyEnrollment,
			},
			{
				label: "P7 Prep %",
				sectionId: "p7-prep",
				value: Math.round(current?.p7PrepExamsPercent ?? 0),
				lastValue: Math.round(previousWeekReport?.p7PrepExamsPercent ?? 0),
				target: kpiTargets.p7PrepExamsPercent,
			},
			{
				label: "Syllabus %",
				sectionId: "syllabus-coverage",
				value: Math.round(current?.syllabusCoveragePercent ?? 0),
				lastValue: Math.round(previousWeekReport?.syllabusCoveragePercent ?? 0),
				target: kpiTargets.syllabusCoveragePercent,
			},
			{
				label: "Admissions",
				sectionId: "admissions",
				value: current?.admissions ?? 0,
				lastValue: previousWeekReport?.admissions ?? 0,
				target: kpiTargets.admissions,
			},
		];
	}, [currentReport, previousWeekReport, kpiTargets, currentTheologyEnrollment, previousTheologyEnrollment, currentEnrollment, previousEnrollment]);

	const filteredScorecards = useMemo(() => {
		const byYear = scorecards.filter(sc => sc.year === selectedYear);
		if (viewMode === "consolidated") {
			return byYear;
		}
		return byYear.filter(sc => sc.week === selectedWeek && sc.term === selectedTerm);
	}, [scorecards, selectedYear, selectedWeek, selectedTerm, viewMode]);

	const rankedScorecards = useMemo(() => {
		// Group by schoolId and keep only the latest entry per school
		const schoolMap = new Map();
		filteredScorecards.forEach(sc => {
			const existing = schoolMap.get(sc.schoolId);
			// Keep the entry with the highest week number (most recent)
			if (!existing || sc.week > existing.week) {
				schoolMap.set(sc.schoolId, sc);
			}
		});
		
		// Convert map back to array and calculate rankings
		return Array.from(schoolMap.values())
			.map(sc => {
				const avg =
					(sc.academicScore + sc.financeScore + sc.qualityScore + sc.technologyScore + sc.theologyScore) / 5;
				const total =
					sc.academicScore + sc.financeScore + sc.qualityScore + sc.technologyScore + sc.theologyScore;
				return { ...sc, avg, total };
			})
			.sort((a, b) => b.total - a.total)
			.map((sc, idx) => ({ ...sc, position: idx + 1 }));
	}, [filteredScorecards]);

	const previousScorecards = useMemo(() => {
		const previousWeek = selectedWeek - 1;
		if (previousWeek <= 0) return [];
		const byYear = scorecards.filter(sc => sc.year === selectedYear);
		if (viewMode === "consolidated") {
			return byYear;
		}
		return byYear.filter(sc => sc.week === previousWeek && sc.term === selectedTerm);
	}, [scorecards, selectedYear, selectedWeek, selectedTerm, viewMode]);

	const getTrendIndicator = (currentAvg: number, schoolId: string) => {
		const prevScorecard = previousScorecards.find(sc => sc.schoolId === schoolId);
		if (!prevScorecard) return { trend: "stable", icon: "—", diff: 0 };
		const prevAvg = (prevScorecard.academicScore + prevScorecard.financeScore + prevScorecard.qualityScore + prevScorecard.theologyScore) / 4;
		const diff = currentAvg - prevAvg;
		if (Math.abs(diff) < 0.5) return { trend: "stable", icon: "→", diff: 0 };
		return diff > 0 ? { trend: "up", icon: "↑", diff } : { trend: "down", icon: "↓", diff };
	};

	const getScoreColor = (score: number) => {
		if (score >= 80) return "bg-green-100 text-green-900";
		if (score >= 60) return "bg-yellow-100 text-yellow-900";
		return "bg-red-100 text-red-900";
	};

	const formatDate = (dateStr?: string) => {
		if (!dateStr) return "—";
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return "—";
		return d.toLocaleDateString();
	};

	const daysBetween = (a?: string, b?: string) => {
		if (!a) return null;
		const start = new Date(a);
		const end = b ? new Date(b) : new Date();
		if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
		const ms = end.getTime() - start.getTime();
		return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
	};

	const filteredIssues = useMemo(() => {
		if (viewMode === "consolidated") {
			return issues.filter(issue => (issue.year ?? selectedYear) === selectedYear);
		}
		return issues.filter(
			issue => (issue.year ?? selectedYear) === selectedYear &&
				(issue.week ?? selectedWeek) === selectedWeek &&
				(issue.term ?? selectedTerm) === selectedTerm
		);
	}, [issues, selectedYear, selectedWeek, selectedTerm, viewMode]);

	const filteredProjects = useMemo(() => {
		let list = [...projects];
		if (projectStatusFilter !== "ALL") {
			list = list.filter(p => {
				const status = p.status || "ACTIVE";
				// Map database status to filter values
				if (projectStatusFilter === "COMPLETED") return status === "COMPLETED";
				if (projectStatusFilter === "OPEN") return status === "ACTIVE";
				if (projectStatusFilter === "IN_PROGRESS") return status === "ACTIVE";
				return true;
			});
		}
		return list.sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0) || a.projectName.localeCompare(b.projectName));
	}, [projects, projectStatusFilter]);

	const tableEvents = useMemo(() => {
		let filtered = [...events];
		if (viewMode === "consolidated") {
			filtered = filtered.filter(evt => (evt.year ?? selectedYear) === selectedYear);
		} else {
			filtered = filtered.filter(evt => (evt.year ?? selectedYear) === selectedYear && (evt.weekNumber ?? selectedWeek) === selectedWeek);
		}
		if (eventStatusFilter !== "ALL") {
			filtered = filtered.filter(evt => (evt.status ?? "ACTIVE") === eventStatusFilter);
		}
		return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
	}, [events, selectedYear, selectedWeek, viewMode, eventStatusFilter]);

	const enrollmentTrends = useMemo(() => {
		// Show enrollment from 2020 to current year
		const years = [];
		for (let year = 2020; year <= currentYear; year++) {
			years.push(year);
		}
		
		return years.map(year => {
			const yearReports = reports.filter(r => r.year === year);
			
			if (yearReports.length === 0) {
				return {
					year: year.toString(),
					enrollment: 0,
					theology: 0,
					isFuture: year > currentYear,
				};
			}
			
			// For years >= 2026, enrollment keeps changing, so show latest value
			// For past years, show average enrollment
			if (year >= 2026) {
				// Get the most recent week's enrollment for current/future years
				const sortedReports = yearReports.sort((a, b) => {
					const termDiff = (b.term ?? 1) - (a.term ?? 1);
					if (termDiff !== 0) return termDiff;
					return b.weekNumber - a.weekNumber;
				});
				const latestReport = sortedReports[0];
				return {
					year: year.toString(),
					enrollment: latestReport.totalEnrollment,
					theology: latestReport.theologyEnrollment,
					isFuture: false,
				};
			} else {
				// For past years (2020-2025), calculate average
				const totalEnrollment = yearReports.reduce((sum, r) => sum + r.totalEnrollment, 0);
				const totalTheology = yearReports.reduce((sum, r) => sum + r.theologyEnrollment, 0);
				return {
					year: year.toString(),
					enrollment: Math.round(totalEnrollment / yearReports.length),
					theology: Math.round(totalTheology / yearReports.length),
					isFuture: false,
				};
			}
		});
	}, [reports]);

	const p7ChartData = useMemo(() => {
		const sorted = [...p7Data].sort((a, b) => a.year - b.year);
		const years = Array.from(new Set(sorted.map(d => d.year))).sort((a, b) => a - b);
		const windowYears = years.slice(Math.max(0, years.length - p7YearsWindow));
		return sorted
			.filter(d => windowYears.includes(d.year))
			.map(d => ({
				year: d.year,
				Promotion: d.p6Promotion,
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
	}, [p7Data, p7YearsWindow]);

	const p7TableData = useMemo(() => {
		const sorted = [...p7Data].sort((a, b) => a.year - b.year);
		const years = Array.from(new Set(sorted.map(d => d.year))).sort((a, b) => a - b);
		const last3Years = years.slice(Math.max(0, years.length - 3));
		return sorted.filter(d => last3Years.includes(d.year));
	}, [p7Data]);

	const incomeChartData = useMemo(() => {
		const grouped = new Map<string, Map<number, number>>();
		incomes.forEach(inc => {
			if (!grouped.has(inc.source)) {
				grouped.set(inc.source, new Map());
			}
			const yearMap = grouped.get(inc.source)!;
			yearMap.set(inc.year, (yearMap.get(inc.year) || 0) + inc.percentage);
		});

		const allYears = new Set<number>();
		incomes.forEach(inc => allYears.add(inc.year));
		const years = Array.from(allYears).sort((a, b) => a - b);

		return Array.from(grouped.entries()).map(([source, yearMap]) => {
			const item: Record<string, number | string> = { name: source };
			years.forEach(year => {
				item[`year_${year}`] = yearMap.get(year) || 0;
			});
				return item;
		});
	}, [incomes]);

	const schoolRankings = useMemo(() => {
		const schoolScores = new Map<string, { name: string; scores: number[] }>();
		filteredScorecards.forEach(sc => {
			const key = sc.schoolId;
			const avg =
				(sc.academicScore + sc.financeScore + sc.qualityScore + sc.technologyScore + sc.theologyScore) / 5;
			if (!schoolScores.has(key)) {
				schoolScores.set(key, { name: sc.schoolName, scores: [avg] });
			} else {
				schoolScores.get(key)!.scores.push(avg);
			}
		});

		return Array.from(schoolScores.values())
			.map(v => ({
				name: v.name,
				avgScore: v.scores.reduce((a, b) => a + b, 0) / v.scores.length,
			}))
			.sort((a, b) => b.avgScore - a.avgScore)
			.slice(0, 10);
	}, [filteredScorecards]);

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

				// Handle toggle-off responses
				if (saved?.deleted && saved.id) {
					setReactions(prev => prev.filter(r => r.id !== saved.id));
					return;
				}

				const savedReaction: Reaction | Reaction[] = saved.data || saved;
				const isThumb = type === "THUMBS_UP" || type === "THUMBS_DOWN";
				const currentUserId = session?.user?.id;

				setReactions(prev => {
					const incoming = Array.isArray(savedReaction) ? savedReaction : [savedReaction];
					let next = [...prev];

					// Ensure only one thumb reaction per user per section/report
					if (isThumb && currentUserId) {
						next = next.filter(
							r => !(
								r.userId === currentUserId &&
								r.weeklyReportId === currentReportId &&
								r.sectionId === sectionId &&
								(r.type === "THUMBS_UP" || r.type === "THUMBS_DOWN")
							)
						);
					}

					incoming.forEach(r => {
						next = next.filter(existing => existing.id !== r.id);
						next.push(r);
					});

					return next;
				});

				if (type === "COMMENT") {
					setCommentDrafts(prev => ({ ...prev, [sectionId]: "" }));
				}
			} catch (err) {
				alert(err instanceof Error ? err.message : "Failed to save reaction");
			} finally {
				setPostingReaction(prev => ({ ...prev, [key]: false }));
			}
		},
		[currentReportId, session?.user?.id]
	);

	const handleSaveEnrollment = useCallback(async () => {
		if (!enrollmentForm.totalEnrollment || enrollmentForm.totalEnrollment <= 0) {
			alert("Please enter a valid total enrollment");
			return;
		}

		try {
			setSavingEnrollment(true);

			// Create a weekly report entry for week 1 of the year to represent historical data
			const response = await fetch("/api/reports", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					year: enrollmentForm.year,
					weekNumber: 1,
					term: 1,
					totalEnrollment: enrollmentForm.totalEnrollment,
					theologyEnrollment: enrollmentForm.theologyEnrollment,
					feesCollectionPercent: 0,
					schoolsExpenditurePercent: 0,
					infrastructurePercent: 0,
					p7PrepExamsPercent: 0,
					syllabusCoveragePercent: 0,
					admissions: 0,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to save enrollment data");
			}

			// Refresh reports data
			const reportsRes = await fetch("/api/reports");
			if (reportsRes.ok) {
				const reportsData = await reportsRes.json();
				setReports(reportsData.data || []);
			}

			// Reset form
			setEnrollmentForm({
				year: enrollmentForm.year + 1 <= currentYear ? enrollmentForm.year + 1 : 2020,
				totalEnrollment: 0,
				theologyEnrollment: 0,
			});

			alert(`Enrollment record saved for ${enrollmentForm.year}`);
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to save enrollment data");
		} finally {
			setSavingEnrollment(false);
		}
	}, [enrollmentForm]);

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

			// Sheet 2: Enrollment Trends (Yearly)
			const trendsData = enrollmentTrends.map(item => ({
				"Year": item.year,
				"Total Enrollment": item.enrollment,
				"Theology Enrollment": item.theology,
			}));
			const trendsSheet = XLSX.utils.json_to_sheet(trendsData);
			trendsSheet['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 18 }];
			XLSX.utils.book_append_sheet(wb, trendsSheet, "Enrollment Trends");

			// Sheet 3: School Rankings
			const rankingsData = schoolRankings.map((school, idx) => ({
				"Rank": idx + 1,
				"School": school.name,
				"Average Score": school.avgScore.toFixed(2),
			}));
			const rankingsSheet = XLSX.utils.json_to_sheet(rankingsData);
			rankingsSheet['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 15 }];
			XLSX.utils.book_append_sheet(wb, rankingsSheet, "School Rankings");

			// Sheet 4: P7 Performance
			const p7Data = p7ChartData.map(item => ({
				"Year": item.year,
				"Promotion": item.Promotion,
				"Prep 1": item["Prep 1"],
				"Prep 2": item["Prep 2"],
				"Prep 3": item["Prep 3"],
				"Prep 4": item["Prep 4"],
				"Prep 5": item["Prep 5"],
				"Prep 6": item["Prep 6"],
				"Prep 7": item["Prep 7"],
				"Prep 8": item["Prep 8"],
				"Prep 9": item["Prep 9"],
				"PLE": item.PLE,
			}));
			const p7Sheet = XLSX.utils.json_to_sheet(p7Data);
			p7Sheet['!cols'] = Array(12).fill({ wch: 12 });
			XLSX.utils.book_append_sheet(wb, p7Sheet, "P7 Performance");

			// Sheet 5: Upcoming Events
			const eventsData = tableEvents.map(evt => ({
				"Date": formatDate(evt.date),
				"Activity": evt.activity,
				"In Charge": evt.inCharge,
				"Status": evt.status || "ACTIVE",
			}));
			const eventsSheet = XLSX.utils.json_to_sheet(eventsData);
			eventsSheet['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 12 }];
			XLSX.utils.book_append_sheet(wb, eventsSheet, "Upcoming Events");

			// Sheet 6: GM Projects
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
	}, [kpiMetrics, enrollmentTrends, schoolRankings, p7ChartData, tableEvents, filteredProjects, selectedYear, selectedTerm, formatDate]);

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
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Push Notification Setup - Mobile Friendly */}
				<div className="mb-6 md:hidden">
					<PushNotificationSetup />
				</div>

				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900">Weekly Report Dashboard</h1>
					<p className="text-gray-600 mt-2">
						{viewMode === "current"
							? `Week ${selectedWeek}, Term ${selectedTerm}, ${selectedYear}`
							: "Consolidated View - All Periods"}
					</p>
					{error && <p className="text-red-600 text-sm mt-2">{error}</p>}
				</div>

				<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
					<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
						<div className="flex flex-col gap-3">
							<div className="flex gap-2">
								<button
									onClick={() => setViewMode("current")}
									className={`px-4 py-2 rounded-lg font-medium transition-colors ${
										viewMode === "current"
											? "bg-blue-600 text-white"
											: "bg-gray-100 text-gray-700 hover:bg-gray-200"
									}`}
								>
									Current Period
								</button>
								<button
									onClick={() => setViewMode("consolidated")}
									className={`px-4 py-2 rounded-lg font-medium transition-colors ${
										viewMode === "consolidated"
											? "bg-blue-600 text-white"
											: "bg-gray-100 text-gray-700 hover:bg-gray-200"
									}`}
								>
								Consolidated
							</button>
						</div>
						{viewMode === "consolidated" && (
							<p className="text-sm text-amber-600 font-medium bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
								⚠️ Week filter is disabled in Consolidated mode - showing all weeks
							</p>
						)}
					</div>

					<div className="flex gap-4 items-center mt-4">
							<button
								onClick={exportToExcel}
								className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
								title="Export dashboard data to Excel"
							>
								<ArrowDownTrayIcon className="w-5 h-5" />
								Export
							</button>
							<button
								onClick={() => window.print()}
								className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
								title="Print dashboard with all charts"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H9a2 2 0 00-2 2v2a2 2 0 002 2h6a2 2 0 002-2v-2a2 2 0 00-2-2zm-6-4h.01M9 9h.01M15 9h.01M15 17h.01" />
								</svg>
								Print
							</button>
							<KPITargetSettings
								targets={kpiTargets}
								onUpdate={(newTargets) => setKpiTargets((prev) => ({ ...prev, ...newTargets }))}
							/>
						</div>
					</div>
				</div>

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
						const isTheology = metric.sectionId === "theology-enrollment";
						const isEnrollment = metric.sectionId === "enrollment";

						const sectionReactions = reactions.filter(
							r => r.sectionId === metric.sectionId && r.weeklyReportId === currentReportId
						);
						const thumbsUp = sectionReactions.filter(r => r.type === "THUMBS_UP").length;
						const thumbsDown = sectionReactions.filter(r => r.type === "THUMBS_DOWN").length;
						const comments = sectionReactions.filter(r => r.type === "COMMENT");
						const draft = commentDrafts[metric.sectionId] || "";
						const isPostingUp = postingReaction[`${metric.sectionId}-THUMBS_UP`] || false;
						const isPostingDown = postingReaction[`${metric.sectionId}-THUMBS_DOWN`] || false;
						const isPostingComment = postingReaction[`${metric.sectionId}-COMMENT`] || false;
						const isTrustee = userRole === "TRUSTEE";
						const isGM = userRole === "GM";
						const canReact = isTrustee && !!currentReportId;

						return (
							<div
								key={idx}
								className={`bg-white p-6 rounded-xl shadow-sm border transition-all hover:shadow-md hover:-translate-y-0.5 ${
									targetMet ? "border-green-300 bg-gradient-to-b from-green-50/60 to-white" : "border-gray-100"
								} ${isTheology ? "cursor-pointer" : ""}`}
								onClick={isTheology ? () => router.push("/theology-analysis") : undefined}
							>
								<div className="flex items-start justify-between mb-4">
									<div className="flex items-center gap-2">
										<span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
											{metric.label}
										</span>
										{isTheology && (
											<span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-100 rounded-full border border-blue-200">
												Click for details
											</span>
										)}
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
								<p className="text-4xl font-semibold text-gray-900 leading-none">
									{metric.value}{metric.label.includes('%') || ['Fees Collection', 'Expenditure %', 'Infrastructure %', 'P7 Prep %', 'Syllabus %'].includes(metric.label) ? '%' : ''}
								</p>
								{hasTarget && <span className="text-xs font-semibold text-gray-600">Target {metric.target}{metric.label.includes('%') || ['Fees Collection', 'Expenditure %', 'Infrastructure %', 'P7 Prep %', 'Syllabus %'].includes(metric.label) ? '%' : ''}</span>}

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
									{isTheology ? (
										// Theology uses previous TERM, not previous week
										metric.lastValue > 0 ? (
											<span>
												Last term: <span className="font-semibold text-gray-800">{metric.lastValue}</span>
											</span>
										) : (
											<span className="italic">No previous term data</span>
										)
									) : previousWeekReport ? (
										<span>
											Last week: <span className="font-semibold text-gray-800">{metric.lastValue}{metric.label.includes('%') || ['Fees Collection', 'Expenditure %', 'Infrastructure %', 'P7 Prep %', 'Syllabus %'].includes(metric.label) ? '%' : ''}</span>
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
													disabled={isPostingUp}
													onClick={() => postReaction(metric.sectionId, "THUMBS_UP")}
													className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
														isPostingUp
															? "bg-blue-50 text-blue-600 border-blue-200"
															: "bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
													}`}
													title="Like this KPI"
												>
													<HandThumbUpIcon className="w-4 h-4" /> {thumbsUp}
												</button>
												<button
													disabled={isPostingDown}
													onClick={() => postReaction(metric.sectionId, "THUMBS_DOWN")}
													className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
														isPostingDown
															? "bg-red-50 text-red-600 border-red-200"
															: "bg-white text-gray-700 border-gray-200 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
													}`}
													title="Dislike this KPI"
												>
													<HandThumbDownIcon className="w-4 h-4" /> {thumbsDown}
												</button>
												<button
													onClick={() => {
														const detailsEl = document.getElementById(`kpi-comments-${idx}`);
														if (detailsEl) detailsEl.toggleAttribute("open");
													}}
													className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-colors"
													title="View and add comments"
												>
													<ChatBubbleLeftRightIcon className="w-4 h-4" /> {comments.length}
												</button>
											</div>
											{/* Trustee view: no GM seen label */}
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
											<p className="text-[10px] text-gray-500 italic">Seen by trustee</p>
									</div>
								)}

								<details id={`kpi-comments-${idx}`} className="group border border-gray-100 rounded-lg bg-gray-50/60 transition-colors">
									<summary className="flex items-center justify-between px-3 py-2 cursor-pointer text-xs font-semibold text-gray-700">
										<div className="flex items-center gap-2">
											<ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-600" />
											<span>Comments</span>
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
											isTrustee ? (
												<div className="flex flex-col gap-2">
													<label className="text-[11px] font-semibold text-gray-700">Add your comment</label>
													<div className="flex gap-2">
														<input
															value={draft}
															onChange={(e) => setCommentDrafts(prev => ({ ...prev, [metric.sectionId]: e.target.value }))}
															placeholder="Add a note for the GM"
															className="flex-1 px-3 py-2 text-sm font-medium text-gray-900 bg-white placeholder:text-gray-400 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
														/>
														<button
															disabled={!draft.trim() || isPostingComment}
															onClick={() => postReaction(metric.sectionId, "COMMENT", draft.trim())}
															className="px-3 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
														>
															{isPostingComment ? "Saving..." : "Post"}
														</button>
													</div>
												</div>
											) : isGM ? (
												<div className="flex flex-col gap-2">
													<label className="text-[11px] font-semibold text-gray-700">GM note to trustees</label>
													<textarea
														value={draft}
														onChange={(e) => setCommentDrafts(prev => ({ ...prev, [metric.sectionId]: e.target.value }))}
														placeholder="Explain this KPI to trustees"
														rows={2}
														className="w-full px-3 py-2 text-sm font-medium text-gray-900 bg-white placeholder:text-gray-400 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
													/>
													<div className="flex justify-end">
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
												<p className="text-xs text-gray-500">Notes and reactions are available to trustees for this period.</p>
											)
										) : (
											<p className="text-xs text-gray-500">Select a specific period to add context.</p>
										)}
									</div>
								</details>
							</div>
						);
					})}

				<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:-translate-y-0.5">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							<span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
								TO-DO LIST
							</span>
						</div>
						<button
							onClick={() => setShowTodoForm(!showTodoForm)}
							className="px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium transition-colors"
						>
							{showTodoForm ? "✕" : "+ Add"}
						</button>
					</div>

					{showTodoForm && (
						<div className="mb-4 pb-4 border-b border-gray-200">
							<input
								type="text"
								placeholder="Task title"
								value={newTodo.title}
								onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
								className="w-full px-2 py-1.5 mb-2 border border-gray-300 rounded text-xs font-medium text-gray-900 bg-white placeholder:text-gray-400"
							/>
							<input
								type="date"
								value={newTodo.dueDate}
								onChange={(e) => setNewTodo(prev => ({ ...prev, dueDate: e.target.value }))}
								className="w-full px-2 py-1.5 mb-2 border border-gray-300 rounded text-xs font-medium text-gray-900 bg-white placeholder:text-gray-400"
							/>
							<div className="flex gap-2">
								<select
								value={newTodo.priority}
								onChange={(e) => setNewTodo(prev => ({ ...prev, priority: e.target.value }))}
								className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-900 bg-white"
							>
								<option value="LOW">Low</option>
								<option value="MEDIUM">Medium</option>
								<option value="HIGH">High</option>
							</select>
							<select
								value={newTodo.category}
								onChange={(e) => setNewTodo(prev => ({ ...prev, category: e.target.value }))}
								className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-900 bg-white"
							>
								<option value="GENERAL">General</option>
								<option value="MEETING">Meeting</option>
								<option value="EVENT">Event</option>
								<option value="DEADLINE">Deadline</option>
							</select>
							</div>
							<div className="flex gap-2 mt-2">
								<button
									onClick={async () => {
										if (!newTodo.title || !newTodo.dueDate) return;
										try {
											const res = await fetch("/api/todos", {
												method: "POST",
												headers: { "Content-Type": "application/json" },
												body: JSON.stringify(newTodo),
											});
											if (res.ok) {
												setNewTodo({ title: "", description: "", dueDate: "", priority: "MEDIUM", category: "GENERAL" });
												setShowTodoForm(false);
												const todosRes = await fetch("/api/todos");
												if (todosRes.ok) setTodos(await todosRes.json());
											}
										} catch (e) {
											alert("Failed to add todo");
										}
									}}
									className="flex-1 px-2 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
								>
									Save
								</button>
								<button
									onClick={() => {
										setShowTodoForm(false);
										setNewTodo({ title: "", description: "", dueDate: "", priority: "MEDIUM", category: "GENERAL" });
									}}
									className="flex-1 px-2 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300"
								>
									Cancel
								</button>
							</div>
						</div>
					)}

					<div className="space-y-2 max-h-[280px] overflow-y-auto">
						{todos.filter(t => !t.isCompleted && !t.isDeferred).length === 0 ? (
							<p className="text-gray-500 text-xs text-center py-4">No active tasks</p>
						) : (
							todos.filter(t => !t.isCompleted && !t.isDeferred).slice(0, 5).map(todo => {
								const today = new Date();
								today.setHours(0, 0, 0, 0);
								const due = new Date(todo.dueDate);
								due.setHours(0, 0, 0, 0);
								const daysLeft = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
								const isUrgent = daysLeft <= 1;
								const priorityColor = todo.priority === "HIGH" ? "text-red-600" : todo.priority === "MEDIUM" ? "text-yellow-600" : "text-green-600";
								const categoryIcon = todo.category === "MEETING" ? "📅" : todo.category === "EVENT" ? "🎉" : todo.category === "DEADLINE" ? "⏰" : "📝";

								return (
									<div
										key={todo.id}
										className={`p-2 rounded-lg border ${isUrgent ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}
									>
										<div className="flex items-start gap-2">
											<button
												onClick={async () => {
													try {
														await fetch("/api/todos", {
															method: "PATCH",
															headers: { "Content-Type": "application/json" },
															body: JSON.stringify({ id: todo.id, isCompleted: true }),
														});
														const todosRes = await fetch("/api/todos");
														if (todosRes.ok) setTodos(await todosRes.json());
													} catch (e) {
														console.error(e);
													}
												}}
												className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
											/>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-1.5 mb-0.5">
													<span className="text-sm">{categoryIcon}</span>
													<p className="font-semibold text-sm text-gray-900 truncate">{todo.title}</p>
												</div>
												<div className="flex items-center gap-2 text-xs">
													<span className={`font-semibold ${priorityColor}`}>{todo.priority}</span>
													<span className="text-gray-600">
														{new Date(todo.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
													</span>
												</div>
												<p className={`text-xs mt-0.5 ${isUrgent ? "text-red-600 font-semibold" : "text-gray-500"}`}>
													{daysLeft >= 0 ? `${daysLeft} days left` : `Overdue by ${Math.abs(daysLeft)} days`}
												</p>
											</div>
											<button
												onClick={async () => {
													try {
														await fetch(`/api/todos?id=${todo.id}`, { method: "DELETE" });
														const todosRes = await fetch("/api/todos");
														if (todosRes.ok) setTodos(await todosRes.json());
													} catch (e) {
														console.error(e);
													}
												}}
												className="flex-shrink-0 text-gray-400 hover:text-red-600 text-xs"
											>
												🗑️
											</button>
										</div>
									</div>
								);
							})
						)}
					</div>

					{todos.filter(t => !t.isCompleted && !t.isDeferred).length > 5 && (
						<p className="text-xs text-gray-500 text-center mt-2">
							+{todos.filter(t => !t.isCompleted && !t.isDeferred).length - 5} more tasks
						</p>
					)}
				</div>
			</div>

			<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
				<div className="flex items-center justify-between mb-4">
					<div>
						<h3 className="text-lg font-semibold text-gray-900">Enrollment Trends (2020 - {currentYear})</h3>
						<p className="text-xs text-gray-500 mt-1">Showing average enrollment for past years (2020-2025) and latest enrollment from 2026 onwards (updates as data is entered).</p>
					</div>
					{userRole === "GM" && (
						<button
							onClick={() => setShowEnrollmentForm(!showEnrollmentForm)}
							className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
						>
							{showEnrollmentForm ? "Hide Form" : "Add Historical Data"}
						</button>
					)}
				</div>

				{showEnrollmentForm && userRole === "GM" && (
					<div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
						<h4 className="text-sm font-semibold text-gray-900 mb-3">Enter Past Enrollment Record</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
									<label className="block text-xs font-medium text-gray-900 mb-1">Year</label>
									<select
										value={enrollmentForm.year}
										onChange={(e) => setEnrollmentForm({ ...enrollmentForm, year: Number(e.target.value) })}
										className="w-full px-3 py-2 text-sm font-medium text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
									>
										{Array.from({ length: currentYear - 2020 + 1 }, (_, i) => 2020 + i).map(year => (
											<option key={year} value={year}>{year}</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-xs font-medium text-gray-900 mb-1">Total Enrollment</label>
									<input
										type="number"
										min="0"
										value={enrollmentForm.totalEnrollment || ""}
										onChange={(e) => setEnrollmentForm({ ...enrollmentForm, totalEnrollment: Number(e.target.value) })}
										placeholder="Enter total enrollment"
										className="w-full px-3 py-2 text-sm font-medium text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder:text-gray-400"
									/>
								</div>
							</div>
							<div className="mt-4 flex justify-end gap-2">
								<button
									onClick={() => {
										setShowEnrollmentForm(false);
										setEnrollmentForm({ year: 2020, totalEnrollment: 0, theologyEnrollment: 0 });
									}}
									className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									onClick={handleSaveEnrollment}
									disabled={savingEnrollment}
									className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
								>
									{savingEnrollment ? "Saving..." : "Save Record"}
								</button>
							</div>
						</div>
					)}

					<ResponsiveContainer width="100%" height={400}>
						<LineChart data={enrollmentTrends}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
							<YAxis label={{ value: 'Enrollment', angle: -90, position: 'insideLeft' }} />
							<Tooltip />
							<Legend />
							<Line type="monotone" dataKey="enrollment" stroke="#3b82f6" strokeWidth={2} name="Total Enrollment" />
						</LineChart>
					</ResponsiveContainer>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
						<div>
							<h3 className="text-lg font-semibold text-gray-900">P.7 PREP EXAMS</h3>
							<p className="text-sm text-gray-600">Chart compares prep milestones; table shows last 3 years.</p>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xs text-gray-600">Chart years</span>
							<select
								value={p7YearsWindow}
								onChange={(e) => setP7YearsWindow(Number(e.target.value))}
								className="px-2 py-1 text-xs font-bold text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
							>
								<option value={3}>Last 3</option>
								<option value={4}>Last 4</option>
								<option value={5}>Last 5</option>
								<option value={999}>All Years</option>
							</select>
						</div>
					</div>
					<div className="mb-4">
						<ResponsiveContainer width="100%" height={360}>
							<LineChart data={p7ChartData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="year" />
								<YAxis />
								<Tooltip />
								<Legend wrapperStyle={{ fontSize: "12px" }} />
								<Line type="monotone" dataKey="Promotion" stroke="#ef4444" strokeWidth={2} dot={false} />
								<Line type="monotone" dataKey="Prep 1" stroke="#f97316" strokeWidth={2} dot={false} />
								<Line type="monotone" dataKey="Prep 2" stroke="#eab308" strokeWidth={2} dot={false} />
								<Line type="monotone" dataKey="Prep 3" stroke="#84cc16" strokeWidth={2} dot={false} />
								<Line type="monotone" dataKey="Prep 4" stroke="#22c55e" strokeWidth={2} dot={false} />
								<Line type="monotone" dataKey="Prep 5" stroke="#10b981" strokeWidth={2} dot={false} />
								<Line type="monotone" dataKey="Prep 6" stroke="#14b8a6" strokeWidth={2} dot={false} />
								<Line type="monotone" dataKey="Prep 7" stroke="#06b6d4" strokeWidth={2} dot={false} />
								<Line type="monotone" dataKey="Prep 8" stroke="#0ea5e9" strokeWidth={2} dot={false} />
								<Line type="monotone" dataKey="Prep 9" stroke="#3b82f6" strokeWidth={2} dot={false} />
								<Line type="monotone" dataKey="PLE" stroke="#6366f1" strokeWidth={2} dot={false} />
							</LineChart>
						</ResponsiveContainer>
					</div>
					<div className="overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-4 py-3 text-left font-semibold text-gray-900">Year</th>
									<th className="px-3 py-3 text-left font-semibold text-gray-900">Promotion</th>
									<th className="px-3 py-3 text-left font-semibold text-gray-900">Prep 1</th>
									<th className="px-3 py-3 text-left font-semibold text-gray-900">Prep 2</th>
									<th className="px-3 py-3 text-left font-semibold text-gray-900">Prep 3</th>
									<th className="px-3 py-3 text-left font-semibold text-gray-900">Prep 4</th>
									<th className="px-3 py-3 text-left font-semibold text-gray-900">Prep 5</th>
									<th className="px-3 py-3 text-left font-semibold text-gray-900">Prep 6</th>
									<th className="px-3 py-3 text-left font-semibold text-gray-900">Prep 7</th>
									<th className="px-3 py-3 text-left font-semibold text-gray-900">Prep 8</th>
									<th className="px-3 py-3 text-left font-semibold text-gray-900">Prep 9</th>
									<th className="px-3 py-3 text-left font-semibold text-gray-900">PLE</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200">
								{p7TableData.map((d) => (
									<tr key={d.id} className="hover:bg-gray-50">
										<td className="px-4 py-3 font-semibold text-gray-900">{d.year}</td>
										<td className="px-3 py-3 text-gray-700">{d.p6Promotion}</td>
										<td className="px-3 py-3 text-gray-700">{d.prep1}</td>
										<td className="px-3 py-3 text-gray-700">{d.prep2}</td>
										<td className="px-3 py-3 text-gray-700">{d.prep3}</td>
										<td className="px-3 py-3 text-gray-700">{d.prep4}</td>
										<td className="px-3 py-3 text-gray-700">{d.prep5}</td>
										<td className="px-3 py-3 text-gray-700">{d.prep6}</td>
										<td className="px-3 py-3 text-gray-700">{d.prep7}</td>
										<td className="px-3 py-3 text-gray-700">{d.prep8}</td>
										<td className="px-3 py-3 text-gray-700">{d.prep9}</td>
										<td className="px-3 py-3 text-gray-700">{d.ple}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
						<h3 className="text-lg font-semibold text-gray-900">Other Income</h3>
						{userRole === "GM" && (
							<a
								href="/income-entry"
								className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
							>
								Manage Income Sources
							</a>
						)}
					</div>
					{incomeChartData.length > 0 ? (
						<div>
							{incomes.some(inc => inc.percentage > 100) && (
								<div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
									<p className="text-sm text-yellow-800">
										<strong>Note:</strong> Some percentages exceed 100%. This may be old data from before the percentage conversion. 
										Please <a href="/income-entry" className="underline font-medium">review and update your income data</a> with correct percentages (0-100%).
									</p>
								</div>
							)}
							<ResponsiveContainer width="100%" height={400}>
								<BarChart data={incomeChartData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="name" />
									<YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
									<Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
									<Legend />
									{Array.from(new Set(incomes.map(inc => inc.year)))
										.sort((a, b) => a - b)
										.map((year, index) => (
											<Bar key={year} dataKey={`year_${year}`} fill={COLORS[index % COLORS.length]} name={`Year ${year}`} />
										))}
								</BarChart>
							</ResponsiveContainer>
							<div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
								{incomeChartData.map((item, idx) => (
									<div key={idx} className="p-3 bg-gray-50 rounded-lg">
										<p className="text-xs font-medium text-gray-700">{item.name as string}</p>
										<p className="text-sm font-semibold text-gray-900">
											{Object.keys(item)
												.filter(k => k.startsWith("year_"))
												.reduce((sum, k) => sum + Number(item[k]), 0)
												.toFixed(1)}%
										</p>
									</div>
								))}
							</div>
						</div>
					) : (
						<div className="h-[300px] flex items-center justify-center text-gray-500">
							No income data available. <a href="/income-entry" className="text-blue-600 ml-2 hover:underline">Add income sources</a>
						</div>
					)}
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
					<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">Red Issues</h3>
						{filteredIssues.length === 0 ? (
							<p className="text-gray-500 text-center py-8">No issues found for this period</p>
						) : (
							<div className="space-y-0 max-h-[400px] overflow-y-auto">
								{filteredIssues.slice(0, 8).map((issue, index) => {
									const status = issue.status || "OPEN";
									const statusColorMap: Record<string, { bg: string; text: string }> = {
										OPEN: { bg: "bg-red-100", text: "text-red-800" },
										IN_PROGRESS: { bg: "bg-yellow-100", text: "text-yellow-800" },
										RESOLVED: { bg: "bg-green-100", text: "text-green-800" },
									};
									const statusColors = statusColorMap[status] || statusColorMap.OPEN;

									return (
										<div key={issue.id}>
											<div className="flex items-start gap-4 py-4">
												<span
													className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${statusColors.bg} ${statusColors.text}`}
												>
													{status.replace(/_/g, " ")}
												</span>
												<div className="flex-1 min-w-0">
													<p className="font-bold text-gray-900 text-sm leading-5">
														{issue.issue || issue.title || "Untitled issue"}
													</p>
													<p className="text-xs text-gray-600 mt-1">{issue.inCharge || "Unassigned"}</p>
													<p className="text-[11px] text-gray-500 mt-1">
														Posted: <span className="font-medium text-gray-700">{formatDate(issue.createdAt)}</span>
														• {status === "RESOLVED" ? "Resolved after" : "Open for"} {(() => {
															const days = daysBetween(issue.createdAt, issue.resolvedAt);
															return days == null ? "—" : `${days} day${days === 1 ? "" : "s"}`;
														})()}
													</p>
												</div>
											</div>
											{index < filteredIssues.slice(0, 8).length - 1 && <div className="border-b border-gray-200"></div>}
										</div>
									);
								})}
							</div>
						)}
					</div>

					<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
						<div className="flex items-center justify-between gap-3 mb-4">
							<div className="flex items-center gap-2">
								<SparklesIcon className="w-5 h-5 text-purple-600" />
								<h3 className="text-lg font-semibold text-gray-900">GM Projects</h3>
							</div>
							<div className="flex items-center gap-2">
								<label className="text-sm text-gray-700">Status</label>
								<select
									value={projectStatusFilter}
									onChange={(e) => setProjectStatusFilter(e.target.value as typeof projectStatusFilter)}
									className="border rounded-lg px-3 py-2 text-sm font-bold text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
								>
									<option value="ALL">All</option>
									<option value="OPEN">Open</option>
									<option value="IN_PROGRESS">In Progress</option>
									<option value="COMPLETED">Completed</option>
								</select>
							</div>
						</div>
						{filteredProjects.length > 0 ? (
							<div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
								{filteredProjects.map((project) => {
									const progressColor = 
										project.progress >= 80
											? "from-green-500 to-green-600"
											: project.progress >= 60
												? "from-blue-500 to-blue-600"
												: project.progress >= 40
													? "from-yellow-500 to-yellow-600"
													: "from-red-500 to-red-600";
									
									return (
										<div 
											key={project.id} 
											className="group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all duration-200"
										>
											{/* Header: Title left, Manager right */}
											<div className="flex items-start justify-between mb-3">
												<div className="flex-1">
													<h4 className="font-bold text-gray-900 text-base leading-tight">
														{project.projectName}
													</h4>
													{project.status && (
														<span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
															project.status === "COMPLETED"
																? "bg-green-100 text-green-700"
															: project.status === "IN_PROGRESS"
																? "bg-blue-100 text-blue-700"
																: "bg-gray-100 text-gray-600"
														}`}>
															{project.status.replace(/_/g, " ")}
														</span>
													)}
												</div>
												<div className="text-right ml-4">
													<p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Manager</p>
													<p className="text-sm font-bold text-gray-900 mt-0.5">{project.projectManager}</p>
												</div>
											</div>

											{/* Progress Bar with embedded percentage */}
											<div className="relative">
												<div className="flex items-center justify-between mb-1.5">
													<span className="text-xs font-semibold text-gray-600">Progress</span>
													<span className={`text-sm font-bold ${
														project.progress >= 80 ? "text-green-600" : 
														project.progress >= 60 ? "text-blue-600" : 
														project.progress >= 40 ? "text-yellow-600" : "text-red-600"
													}`}>
														{project.progress}%
													</span>
												</div>
												<div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
													<div
														className={`absolute inset-y-0 left-0 bg-gradient-to-r ${progressColor} rounded-full transition-all duration-500 ease-out shadow-sm`}
														style={{ width: `${project.progress}%` }}
													>
														<div className="absolute inset-0 bg-white/20 animate-pulse"></div>
													</div>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						) : (
							<div className="text-center py-12">
								<SparklesIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
								<p className="text-gray-500 font-medium">No projects match the filter</p>
							</div>
						)}
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
					<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold text-gray-900">Schools Scorecard</h3>
							{rankedScorecards.length > 0 && (
								<button
									onClick={() => {
										const ws = XLSX.utils.json_to_sheet(
											rankedScorecards.map(sc => ({
												Position: sc.position,
												School: sc.schoolName,
												Academic: Number(sc.academicScore.toFixed(2)),
												Finance: Number(sc.financeScore.toFixed(2)),
												Quality: Number(sc.qualityScore.toFixed(2)),
												Theology: Number(sc.theologyScore.toFixed(2)),
												Average: Number(sc.avg.toFixed(2)),
											}))
										);
										const wb = XLSX.utils.book_new();
										XLSX.utils.book_append_sheet(wb, ws, "Schools Scorecard");
										XLSX.writeFile(wb, `Schools_Scorecard_Week${selectedWeek}_${selectedYear}.xlsx`);
									}}
									className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
									title="Export Schools Scorecard"
								>
									<ArrowDownTrayIcon className="w-4 h-4" />
									Export
								</button>
							)}
						</div>
						{rankedScorecards.length > 0 ? (
							<div className="overflow-x-auto">
								<table className="min-w-full">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Pos</th>
											<th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">School</th>
											<th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Acad</th>
											<th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Fin</th>
											<th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">QA</th>
											<th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Theo</th>
											<th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Avg</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200">
										{rankedScorecards.map((sc) => {
											const { trend, icon, diff } = getTrendIndicator(sc.avg, sc.schoolId);
											const avgColor = getScoreColor(sc.avg);
											const diffColor = diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-gray-500";
											const diffSign = diff > 0 ? "+" : "";
											
											const getRankColor = (position: number) => {
												if (position === 1) return "bg-yellow-400 text-yellow-900";
												if (position === 2) return "bg-gray-300 text-gray-900";
												if (position === 3) return "bg-orange-400 text-orange-900";
												return "bg-gray-200 text-gray-700";
											};

											return (
												<tr key={sc.id} className="hover:bg-gray-50">
													<td className="px-4 py-3">
														<div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getRankColor(sc.position)}`}>
															{sc.position}
														</div>
													</td>
													<td className="px-4 py-3 text-sm font-medium text-gray-900">
														<div className="flex items-center gap-2">
															<span className={`text-lg ${
																trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-400"
															}`}>{icon}</span>
															<span>{sc.schoolName}</span>
															{diff !== 0 && (
																<span className={`text-xs font-semibold ${diffColor}`}>
																	{diffSign}{diff.toFixed(1)}
																</span>
															)}
														</div>
													</td>
													<td className="px-4 py-3 text-sm text-gray-700">{formatScore(sc.academicScore)}</td>
													<td className="px-4 py-3 text-sm text-gray-700">{formatScore(sc.financeScore)}</td>
													<td className="px-4 py-3 text-sm text-gray-700">{formatScore(sc.qualityScore)}</td>
													<td className="px-4 py-3 text-sm text-gray-700">{formatScore(sc.theologyScore)}</td>
													<td className={`px-4 py-3 text-sm font-semibold rounded px-2 py-1 ${avgColor}`}>{formatScore(sc.avg)}</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						) : (
							<p className="text-gray-500 text-center py-8">No scorecard data for this period</p>
						)}
					</div>

					<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
						<div className="flex flex-col gap-3 mb-4">
							<div>
								<h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
								<p className="text-sm text-gray-600">Add/view/manage events in Manage → Upcoming Events. Upcoming events.</p>
							</div>
							<div className="flex items-center gap-2">
								<label className="text-sm text-gray-700">Status</label>
								<select
									value={eventStatusFilter}
									onChange={(e) => setEventStatusFilter(e.target.value as typeof eventStatusFilter)}
									className="border rounded-lg px-3 py-2 text-sm font-bold text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
								>
									<option value="ALL">All</option>
									<option value="ACTIVE">Active</option>
									<option value="COMPLETED">Completed</option>
								</select>
							</div>
						</div>

						{tableEvents.length === 0 ? (
							<p className="text-gray-500 text-center py-6">No events found for this filter.</p>
						) : (
							<div className="overflow-x-auto max-h-[400px]">
								<table className="min-w-full text-sm">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-4 py-3 text-left font-semibold text-gray-900">Date</th>
											<th className="px-4 py-3 text-left font-semibold text-gray-900">Activity</th>
											<th className="px-4 py-3 text-left font-semibold text-gray-900">In-Charge</th>
											<th className="px-4 py-3 text-left font-semibold text-gray-900">Rate</th>
											<th className="px-4 py-3 text-left font-semibold text-gray-900">Due</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200">
										{tableEvents.map((event) => {
											const priority = event.rate || event.priority || "Low";
											const dueIn = daysUntil(event.date);
											const dueLabel =
												dueIn < 0
													? `Overdue ${Math.abs(dueIn)}d`
													: dueIn === 0
														? "Due today"
														: `In ${dueIn} day${dueIn === 1 ? "" : "s"}`;
											return (
												<tr key={event.id} className="hover:bg-gray-50">
													<td className="px-4 py-3 text-gray-900 text-xs">{new Date(event.date).toLocaleDateString()}</td>
													<td className="px-4 py-3 text-gray-900 font-medium text-xs">{event.activity}</td>
													<td className="px-4 py-3 text-gray-700 text-xs">{event.inCharge}</td>
													<td className="px-4 py-3">
														<span
															className={`px-2 py-1 rounded text-[10px] font-semibold whitespace-nowrap ${
																priority === "High"
																	? "bg-red-100 text-red-800"
																	: priority === "Medium"
																		? "bg-yellow-100 text-yellow-800"
																		: "bg-green-100 text-green-800"
															}`}
														>
															{priority}
														</span>
													</td>
													<td className="px-4 py-3">
														<span
															className={`text-[10px] font-semibold ${
																dueIn < 0 ? "text-red-700" : dueIn === 0 ? "text-amber-700" : "text-gray-700"
															}`}
														>
															{dueLabel}
														</span>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
