"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import KPITargetSettings from "@/components/KPITargetSettings";
import TodoListCard from "@/components/TodoListCard";
import AttachmentPanel from "@/components/AttachmentPanel";
import PushNotificationSetup from "@/components/PushNotificationSetup";
import * as XLSX from "xlsx";
import {
	LineChart,
	Line,
	BarChart,
	Bar,
	Cell,
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
	createdAt?: string;
	updatedAt?: string;
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
	percentage?: number;
	year: number;
	month: number;
	term?: number;
}

interface IncomeSource {
	id: string;
	name: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

interface EnrollmentType {
	id: string;
	name: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

interface DynamicEnrollment {
	id: string;
	enrollmentTypeId: string;
	school: string;
	class: string;
	year: number;
	term: number;
	count: number;
	enrollmentType?: EnrollmentType;
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

interface TermSetting {
	id: string;
	term: number;
	year: number;
	startDate: string;
	endDate: string;
	weeksCount: number;
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

const getLatestTimestamp = (items: any[], keys: string[]) => {
	let latest: Date | null = null;
	items.forEach((item) => {
		keys.forEach((key) => {
			const value = item?.[key];
			if (!value) return;
			const date = new Date(value);
			if (isNaN(date.getTime())) return;
			if (!latest || date > latest) {
				latest = date;
			}
		});
	});
	return latest;
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
	const [p7PrepResults, setP7PrepResults] = useState<any[]>([]);
	const [p7PleResults, setP7PleResults] = useState<any[]>([]);
	const [p6PromotionResults, setP6PromotionResults] = useState<any[]>([]);
	const [issues, setIssues] = useState<RedIssue[]>([]);
	const [events, setEvents] = useState<UpcomingEvent[]>([]);
	const [projects, setProjects] = useState<GMProject[]>([]);
	const [savingProjectIds, setSavingProjectIds] = useState<Set<string>>(new Set());
	const [incomes, setIncomes] = useState<OtherIncome[]>([]);
	const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
	const [enrollmentTypes, setEnrollmentTypes] = useState<EnrollmentType[]>([]);
	const [dynamicEnrollments, setDynamicEnrollments] = useState<DynamicEnrollment[]>([]);
	const [allDynamicEnrollments, setAllDynamicEnrollments] = useState<DynamicEnrollment[]>([]);
	const [theologyEnrollments, setTheologyEnrollments] = useState<any[]>([]);
	const [previousTheologyEnrollments, setPreviousTheologyEnrollments] = useState<any[]>([]);
	const [enrollments, setEnrollments] = useState<any[]>([]);
	const [previousEnrollments, setPreviousEnrollments] = useState<any[]>([]);
	const [allEnrollments, setAllEnrollments] = useState<any[]>([]); // For chart trends
	const [allTheologyEnrollments, setAllTheologyEnrollments] = useState<any[]>([]); // For chart trends
	const [reactions, setReactions] = useState<Reaction[]>([]);
	const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
	const [postingReaction, setPostingReaction] = useState<Record<string, boolean>>({});
	const [termSettings, setTermSettings] = useState<TermSetting[]>([]);
	const [p7YearsWindow, setP7YearsWindow] = useState<number>(999); // Default to all years
	const [p7ChartType, setP7ChartType] = useState<"line" | "bar">("bar"); // Chart type toggle
	const [p7PrepFilter, setP7PrepFilter] = useState<string>("ALL"); // Prep filter
	const [showTermAverages, setShowTermAverages] = useState<boolean>(false); // Term averages panel
	const [enrollmentSchoolFilter, setEnrollmentSchoolFilter] = useState<string>("ALL"); // School filter for enrollment chart
	const [enrollmentClassFilter, setEnrollmentClassFilter] = useState<string>("ALL"); // Class filter for enrollment chart
	const [enrollmentTermFilter, setEnrollmentTermFilter] = useState<number | "ALL">("ALL"); // Term filter for enrollment chart
	const [enrollmentTypeFilter, setEnrollmentTypeFilter] = useState<string>("ALL");
	const [enrollmentYearFilter, setEnrollmentYearFilter] = useState<number | "ALL">("ALL");
	const [enrollmentView, setEnrollmentView] = useState<"by-year" | "total">("by-year");
	const [enrollmentSeriesFilter, setEnrollmentSeriesFilter] = useState<"both" | "enrollment" | "theology">("both");
	const [incomeYearFilter, setIncomeYearFilter] = useState<number | "ALL">("ALL"); // Year filter for income
	const [incomeTermFilter, setIncomeTermFilter] = useState<number | "ALL">("ALL"); // Term filter for income
	const [incomeSourceFilter, setIncomeSourceFilter] = useState<string>("ALL"); // Source filter for income
	const [incomeDisplayMode, setIncomeDisplayMode] = useState<"amount" | "percentage">("percentage"); // Display mode for income
	const [incomeChartView, setIncomeChartView] = useState<"by-year" | "total">("by-year"); // Chart view mode
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
	const [refreshTick, setRefreshTick] = useState(0);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
	const [selectionInitialized, setSelectionInitialized] = useState(false);
	const [eventStatusFilter, setEventStatusFilter] = useState<"ACTIVE" | "COMPLETED" | "ALL">("ALL");
	const [eventPriorityFilter, setEventPriorityFilter] = useState<string>("ALL");
	const [completedEventIds, setCompletedEventIds] = useState<Set<string>>(new Set());
	const [calendarMonth, setCalendarMonth] = useState(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), 1);
	});
	const [incomeSourceDeleting, setIncomeSourceDeleting] = useState<string | null>(null);
	const [todos, setTodos] = useState<Todo[]>([]);
	const [newTodo, setNewTodo] = useState({ title: "", description: "", dueDate: "", priority: "MEDIUM", category: "GENERAL" });
	const [showTodoForm, setShowTodoForm] = useState(false);
	const [projectStatusFilter, setProjectStatusFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
	const [issueStatusFilter, setIssueStatusFilter] = useState<"ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED">("ALL");
	const [issueAssigneeFilter, setIssueAssigneeFilter] = useState<string>("ALL");
	const [issueSort, setIssueSort] = useState<"NEWEST" | "OLDEST" | "LONGEST_OPEN">("NEWEST");
	const [updatingIssueId, setUpdatingIssueId] = useState<string | null>(null);

	// Card-level year filter & expand/collapse state (Events, Projects, Issues)
	const [eventsCardYear, setEventsCardYear] = useState<number | "ALL">("ALL");
	const [showCompletedEvents, setShowCompletedEvents] = useState(false);
	const [showMoreActiveEvents, setShowMoreActiveEvents] = useState(false);
	const [showCompletedProjects, setShowCompletedProjects] = useState(false);
	const [showMoreActiveProjects, setShowMoreActiveProjects] = useState(false);
	const [issuesCardYear, setIssuesCardYear] = useState<number | "ALL">("ALL");
	const [showResolvedIssues, setShowResolvedIssues] = useState(false);
	const [showMoreActiveIssues, setShowMoreActiveIssues] = useState(false);

	const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
	const [showEnrollmentTypeManager, setShowEnrollmentTypeManager] = useState(false);
	const [enrollmentForm, setEnrollmentForm] = useState({
		year: 2020,
		totalEnrollment: 0,
		theologyEnrollment: 0,
	});
	const [newEnrollmentTypeName, setNewEnrollmentTypeName] = useState("");
	const [dynamicEnrollmentTypeId, setDynamicEnrollmentTypeId] = useState("");
	const [dynamicEnrollmentCount, setDynamicEnrollmentCount] = useState(0);
	const [savingEnrollmentType, setSavingEnrollmentType] = useState(false);
	const [savingDynamicEnrollment, setSavingDynamicEnrollment] = useState(false);
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
		if (!dynamicEnrollmentTypeId && enrollmentTypes.length > 0) {
			setDynamicEnrollmentTypeId(enrollmentTypes[0].id);
		}
	}, [enrollmentTypes, dynamicEnrollmentTypeId]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsRefreshing(true);
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

			const [reportsRes, scorecardsRes, p7Res, issuesRes, eventsRes, projectsRes, sourcesRes, incomesRes, enrollmentTypesRes, dynamicEnrollmentsRes, theologyRes, previousTheologyRes, enrollmentRes, previousEnrollmentRes, reactionsRes, todosRes, p7PrepRes, p7PleRes, p6PromotionRes, termSettingsRes] = await Promise.all([
			fetch("/api/reports"),
			fetch(`/api/scorecard?${scorecardsParams.toString()}`),
			fetch("/api/p7-prep"),
			fetch("/api/issues"),
			fetch("/api/events"),
			fetch("/api/projects"),
			fetch("/api/income-sources"),
			fetch("/api/other-income"),
			fetch("/api/enrollment-types"),
			fetch(`/api/dynamic-enrollments?year=${selectedYear}&term=${selectedTerm}`),
			fetch(`/api/theology-enrollment?${theologyParams.toString()}`),
			fetch(`/api/theology-enrollment?${previousTheologyParams.toString()}`),
			fetch(`/api/enrollment?${enrollmentParams.toString()}`),
			fetch(`/api/enrollment?${previousEnrollmentParams.toString()}`),
			fetch("/api/reactions"),
			fetch("/api/todos"),
			fetch("/api/p7-prep-results", { cache: "no-store" }),
			fetch("/api/p7-ple-results", { cache: "no-store" }),
			fetch("/api/p6-promotion-results", { cache: "no-store" }),
				fetch("/api/settings/term"),
			]);

			if (!reportsRes.ok) {
				if (reportsRes.status === 401) {
					window.location.href = "/login";
					return;
				}
				throw new Error("Failed to fetch reports");
			}
			if (!scorecardsRes.ok) throw new Error("Failed to fetch scorecards");
			if (!p7Res.ok) throw new Error("Failed to fetch P7 data");

			const reportsData = await reportsRes.json();
			const scorecardsData = await scorecardsRes.json();
			const p7ResponseData = await p7Res.json();
			const p7PrepData = p7PrepRes.ok ? await p7PrepRes.json() : [];
			const p7PleData = p7PleRes.ok ? await p7PleRes.json() : [];
			const p6PromotionData = p6PromotionRes.ok ? await p6PromotionRes.json() : [];
			const issuesData = issuesRes.ok ? await issuesRes.json() : [];
			const eventsData = eventsRes.ok ? await eventsRes.json() : { data: [] };
			const projectsData = projectsRes.ok ? await projectsRes.json() : { data: [] };
			const sourcesData = sourcesRes.ok ? await sourcesRes.json() : { data: [] };
			const incomesResponse = incomesRes.ok ? await incomesRes.json() : { data: [] };
			const enrollmentTypesData = enrollmentTypesRes.ok ? await enrollmentTypesRes.json() : { data: [] };
			const dynamicEnrollmentsData = dynamicEnrollmentsRes.ok ? await dynamicEnrollmentsRes.json() : { data: [] };
			const theologyData = theologyRes.ok ? await theologyRes.json() : [];
			const previousTheologyData = previousTheologyRes.ok ? await previousTheologyRes.json() : [];
			const enrollmentData = enrollmentRes.ok ? await enrollmentRes.json() : [];
			const previousEnrollmentData = previousEnrollmentRes.ok ? await previousEnrollmentRes.json() : [];
			const reactionsData = reactionsRes.ok ? await reactionsRes.json() : [];
			const todosData = todosRes.ok ? await todosRes.json() : [];
			const termSettingsData = termSettingsRes.ok ? await termSettingsRes.json() : { termSettings: [] };

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
		setP7PrepResults(Array.isArray(p7PrepData) ? p7PrepData : p7PrepData.data || []);
		setP7PleResults(Array.isArray(p7PleData) ? p7PleData : p7PleData.data || []);
		setP6PromotionResults(Array.isArray(p6PromotionData) ? p6PromotionData : p6PromotionData.data || []);
				setIssues(Array.isArray(issuesData) ? issuesData : issuesData.data || []);
				setEvents(Array.isArray(eventsData) ? eventsData : eventsData.data || []);
				setProjects(Array.isArray(projectsData) ? projectsData : (projectsData.data || []));
				setIncomeSources(sourcesData.data || []);
				setIncomes(incomesResponse.data || []);
				setEnrollmentTypes(Array.isArray(enrollmentTypesData) ? enrollmentTypesData : enrollmentTypesData.data || []);
				setDynamicEnrollments(Array.isArray(dynamicEnrollmentsData) ? dynamicEnrollmentsData : dynamicEnrollmentsData.data || []);
				setTheologyEnrollments(Array.isArray(theologyData) ? theologyData : []);
				setPreviousTheologyEnrollments(Array.isArray(previousTheologyData) ? previousTheologyData : []);
				setEnrollments(Array.isArray(enrollmentData) ? enrollmentData : []);
				setPreviousEnrollments(Array.isArray(previousEnrollmentData) ? previousEnrollmentData : []);
				setReactions(Array.isArray(reactionsData) ? reactionsData : reactionsData.data || []);
				setTodos(Array.isArray(todosData) ? todosData : todosData.data || []);
				setTermSettings(Array.isArray(termSettingsData.termSettings) ? termSettingsData.termSettings : []);
			} catch (err) {
				console.error(err);
				setError(err instanceof Error ? err.message : "Failed to load dashboard data");
			} finally {
				setLoading(false);
				setIsRefreshing(false);
				setHasFetchedOnce(true);
			}
		};

		fetchData();
	}, [selectedYear, selectedTerm, refreshTick]);

	const handleRefresh = useCallback(() => {
		setIsRefreshing(true);
		setRefreshTick(prev => prev + 1);
	}, []);

	const handleProjectProgressUpdate = useCallback(async (projectId: string, newProgress: number) => {
		setProjects((prev) => prev.map((project) =>
			project.id === projectId ? { ...project, progress: newProgress } : project
		));
		setSavingProjectIds((prev) => new Set(prev).add(projectId));

		try {
			const response = await fetch("/api/projects", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: projectId, progress: newProgress }),
			});

			if (!response.ok) {
				setError("Failed to update project progress.");
				setRefreshTick((prev) => prev + 1);
				setTimeout(() => setError(null), 3000);
			}
		} catch (err) {
			setError("Connection error. Project progress reverted.");
			setRefreshTick((prev) => prev + 1);
			setTimeout(() => setError(null), 3000);
		} finally {
			setTimeout(() => {
				setSavingProjectIds((prev) => {
					const next = new Set(prev);
					next.delete(projectId);
					return next;
				});
			}, 400);
		}
	}, []);

	useEffect(() => {
		const id = setInterval(() => {
			handleRefresh();
		}, 60000);
		return () => clearInterval(id);
	}, [handleRefresh]);

	// Fetch chart trend data separately (not affected by year/term filters)
	useEffect(() => {
		const fetchTrendData = async () => {
			try {
				const [allEnrollmentRes, allTheologyRes, allDynamicEnrollmentsRes] = await Promise.all([
					fetch("/api/enrollment"),
					fetch("/api/theology-enrollment"),
					fetch("/api/dynamic-enrollments"),
				]);

				const allEnrollmentData = allEnrollmentRes.ok ? await allEnrollmentRes.json() : [];
				const allTheologyData = allTheologyRes.ok ? await allTheologyRes.json() : [];
				const allDynamicData = allDynamicEnrollmentsRes.ok ? await allDynamicEnrollmentsRes.json() : { data: [] };

				setAllEnrollments(Array.isArray(allEnrollmentData) ? allEnrollmentData : []);
				setAllTheologyEnrollments(Array.isArray(allTheologyData) ? allTheologyData : []);
				setAllDynamicEnrollments(Array.isArray(allDynamicData) ? allDynamicData : allDynamicData.data || []);
			} catch (err) {
				console.error("Failed to fetch trend data:", err);
			}
		};

		fetchTrendData();
	}, [refreshTick]);

	const getCurrentTermSelection = useCallback(() => {
		if (!termSettings.length) return null;

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const activeTerm = termSettings.find((setting) => {
			const start = new Date(setting.startDate);
			const end = new Date(setting.endDate);
			start.setHours(0, 0, 0, 0);
			end.setHours(0, 0, 0, 0);
			return today >= start && today <= end;
		});

		if (!activeTerm) return null;

		const start = new Date(activeTerm.startDate);
		start.setHours(0, 0, 0, 0);
		const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
		const rawWeek = Math.floor(diffDays / 7) + 1;
		const weeksCount = activeTerm.weeksCount || 13;
		const week = Math.min(Math.max(rawWeek, 1), weeksCount);

		return {
			year: activeTerm.year,
			term: activeTerm.term,
			week,
		};
	}, [termSettings]);

	useEffect(() => {
		if (selectionInitialized) return;

		const currentTermSelection = getCurrentTermSelection();
		if (currentTermSelection) {
			setSelectedYear(currentTermSelection.year);
			setSelectedTerm(currentTermSelection.term);
			setSelectedWeek(currentTermSelection.week);
			setSelectionInitialized(true);
			return;
		}

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
	}, [reports, scorecards, selectionInitialized, getCurrentTermSelection]);

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

	const latestDataTimestamp = useMemo(() => {
		const candidates: (Date | null)[] = [];
		const reportTimestamp = currentReport?.updatedAt || currentReport?.createdAt;
		if (reportTimestamp) {
			const parsed = new Date(reportTimestamp);
			if (!isNaN(parsed.getTime())) {
				candidates.push(parsed);
			}
		}

		candidates.push(
			getLatestTimestamp(reports, ["updatedAt", "createdAt"]),
			getLatestTimestamp(scorecards, ["updatedAt", "createdAt"]),
			getLatestTimestamp(enrollments, ["updatedAt", "createdAt"]),
			getLatestTimestamp(allEnrollments, ["updatedAt", "createdAt"]),
			getLatestTimestamp(theologyEnrollments, ["updatedAt", "createdAt"]),
			getLatestTimestamp(allTheologyEnrollments, ["updatedAt", "createdAt"]),
			getLatestTimestamp(issues, ["updatedAt", "createdAt", "resolvedAt"]),
			getLatestTimestamp(events, ["updatedAt", "createdAt"]),
			getLatestTimestamp(projects, ["updatedAt", "createdAt"]),
			getLatestTimestamp(incomes, ["updatedAt", "createdAt"]),
			getLatestTimestamp(incomeSources, ["updatedAt", "createdAt"]),
			getLatestTimestamp(reactions, ["updatedAt", "createdAt"]),
			getLatestTimestamp(todos, ["updatedAt", "createdAt", "completedAt", "deferredUntil"]),
			getLatestTimestamp(p7Data, ["updatedAt", "createdAt"]),
			getLatestTimestamp(p7PrepResults, ["updatedAt", "createdAt"]),
			getLatestTimestamp(p7PleResults, ["updatedAt", "createdAt"]),
			getLatestTimestamp(p6PromotionResults, ["updatedAt", "createdAt"])
		);

		return candidates.filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0] ?? null;
	}, [
		currentReport,
		reports,
		scorecards,
		enrollments,
		allEnrollments,
		theologyEnrollments,
		allTheologyEnrollments,
		issues,
		events,
		projects,
		incomes,
		incomeSources,
		reactions,
		todos,
		p7Data,
		p7PrepResults,
		p7PleResults,
		p6PromotionResults,
	]);

	useEffect(() => {
		setLastUpdated(latestDataTimestamp);
	}, [latestDataTimestamp]);

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

	const prepProgress = useMemo(() => {
		const byPeriod = p7PrepResults.filter((r: any) => r.year === selectedYear && r.term === selectedTerm);
		if (!byPeriod.length) return { value: 0, lastValue: 0, label: "", lastLabel: "" };
		const prepNumbers = Array.from(new Set(byPeriod.map((r: any) => r.prepNumber))).sort((a, b) => b - a);
		const calcPercent = (prepNum: number) => {
			const rows = byPeriod.filter((r: any) => r.prepNumber === prepNum);
			const div1 = rows.reduce((sum: number, r: any) => sum + (r.divisionI || 0), 0);
			const enrollment = rows.reduce((sum: number, r: any) => sum + (r.enrollment || 0), 0);
			return enrollment ? (div1 / enrollment) * 100 : 0;
		};
		const value = calcPercent(prepNumbers[0]);
		const lastValue = prepNumbers[1] ? calcPercent(prepNumbers[1]) : 0;
		return { value, lastValue, label: `Prep ${prepNumbers[0]}` , lastLabel: prepNumbers[1] ? `Prep ${prepNumbers[1]}` : "" };
	}, [p7PrepResults, selectedYear, selectedTerm]);

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
				value: Math.round(prepProgress.value ?? 0),
				lastValue: Math.round(prepProgress.lastValue ?? 0),
				lastLabel: prepProgress.lastLabel,
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

		const metricSourceLabels = useMemo<Record<string, string>>(() => ({
			"p7-prep": prepProgress.label ? `From ${prepProgress.label} Div I%` : "No prep data yet",
			enrollment: `From enrollment entry · Y${selectedYear} T${selectedTerm}`,
			"theology-enrollment": `From theology entry · Y${selectedYear} T${selectedTerm}`,
		}), [prepProgress.label, selectedYear, selectedTerm]);

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

	const lastUpdatedLabel = useMemo(() => {
		if (!lastUpdated) return "Not updated yet";
		return lastUpdated.toLocaleString();
	}, [lastUpdated]);

	const lastUpdatedRelative = useMemo(() => {
		if (!lastUpdated) return "Never updated";
		const diffMs = Date.now() - lastUpdated.getTime();
		if (diffMs < 30_000) return "Updated just now";
		const minutes = Math.floor(diffMs / 60000);
		if (minutes < 1) return "Updated <1m ago";
		if (minutes < 60) return `Updated ${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `Updated ${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `Updated ${days}d ago`;
	}, [lastUpdated]);

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

	const issueAssignees = useMemo(() => {
		const names = new Set<string>();
		filteredIssues.forEach(issue => {
			if (issue.inCharge) names.add(issue.inCharge);
		});
		return ["ALL", ...Array.from(names).sort((a, b) => a.localeCompare(b))];
	}, [filteredIssues]);

	const dedupedIssues = useMemo(() => {
		const seen = new Set<string>();
		return filteredIssues.filter(issue => {
			const key = issue.id || `${issue.issue || issue.title || "unknown"}-${issue.createdAt || ""}-${issue.inCharge || ""}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
	}, [filteredIssues]);

	const statusCounts = useMemo(() => {
		return dedupedIssues.reduce(
			(acc, issue) => {
				const status = issue.status || "OPEN";
				acc[status] = (acc[status] || 0) + 1;
				return acc;
			},
			{ OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 } as Record<string, number>
		);
	}, [dedupedIssues]);

	const filteredIssueList = useMemo(() => {
		const statusOrder: Record<string, number> = { OPEN: 0, IN_PROGRESS: 1, RESOLVED: 2 };
		const getAgeDays = (issue: RedIssue) => {
			const days = daysBetween(issue.createdAt, issue.resolvedAt);
			return days == null ? 0 : days;
		};

		let list = dedupedIssues;
		if (issueStatusFilter !== "ALL") {
			list = list.filter(issue => (issue.status || "OPEN") === issueStatusFilter);
		}
		if (issueAssigneeFilter !== "ALL") {
			list = list.filter(issue => issue.inCharge === issueAssigneeFilter);
		}

		const sorted = [...list].sort((a, b) => {
			const statusDiff = (statusOrder[a.status || "OPEN"] ?? 99) - (statusOrder[b.status || "OPEN"] ?? 99);
			if (statusDiff !== 0) return statusDiff; // resolved sink to bottom
			const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
			const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
			switch (issueSort) {
				case "OLDEST":
					return dateA - dateB;
				case "LONGEST_OPEN":
					return getAgeDays(b) - getAgeDays(a);
				case "NEWEST":
				default:
					return dateB - dateA;
			}
		});

		return sorted.slice(0, 12);
	}, [dedupedIssues, issueAssigneeFilter, issueSort, issueStatusFilter]);

	const filteredProjects = useMemo(() => {
		let list = [...projects];
		if (projectStatusFilter !== "ALL") {
			list = list.filter(p => {
				const status = p.status || "ACTIVE";
				return projectStatusFilter === "COMPLETED"
					? status === "COMPLETED"
					: status === "ACTIVE";
			});
		}
		return list.sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0) || a.projectName.localeCompare(b.projectName));
	}, [projects, projectStatusFilter]);

	const tableEvents = useMemo(() => {
		// Deduplicate events by id/activity/date/inCharge
		const seen = new Set<string>();
		const deduped = events.filter(evt => {
			const key = `${evt.id || ""}-${evt.activity || ""}-${evt.date || ""}-${evt.inCharge || ""}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});

		let filtered = [...deduped];
		if (viewMode === "consolidated") {
			filtered = filtered.filter(evt => (evt.year ?? selectedYear) === selectedYear);
		} else {
			filtered = filtered.filter(evt => (evt.year ?? selectedYear) === selectedYear && (evt.weekNumber ?? selectedWeek) === selectedWeek);
		}
		
		// Apply status filter
		if (eventStatusFilter !== "ALL") {
			filtered = filtered.filter(evt => {
				const isCompleted = completedEventIds.has(evt.id);
				const status = isCompleted ? "COMPLETED" : (evt.status ?? "ACTIVE");
				return status === eventStatusFilter;
			});
		} else {
			// Separate completed from active
			const active = filtered.filter(evt => !completedEventIds.has(evt.id));
			const completed = filtered.filter(evt => completedEventIds.has(evt.id));
			filtered = [...active, ...completed];
		}

		// Apply priority filter
		if (eventPriorityFilter !== "ALL") {
			filtered = filtered.filter(evt => (evt.rate || evt.priority || "Low") === eventPriorityFilter);
		}

		// Sort by date (soonest first), then completed to bottom
		return filtered.sort((a, b) => {
			const aCompleted = completedEventIds.has(a.id);
			const bCompleted = completedEventIds.has(b.id);
			if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
			return new Date(a.date).getTime() - new Date(b.date).getTime();
		});
	}, [events, selectedYear, selectedWeek, viewMode, eventStatusFilter, eventPriorityFilter, completedEventIds]);

	// ── Card-level: Upcoming Events ─────────────────────────────────────────────
	const availableEventYears = useMemo(() => {
		const years = new Set<number>();
		events.forEach(evt => { if (evt.year) years.add(evt.year); });
		return Array.from(years).sort((a, b) => b - a);
	}, [events]);

	const cardEventsList = useMemo(() => {
		const seen = new Set<string>();
		const deduped = events.filter(evt => {
			const key = `${evt.id || ""}-${evt.activity || ""}-${evt.date || ""}-${evt.inCharge || ""}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
		let filtered = [...deduped];
		if (eventsCardYear !== "ALL") {
			filtered = filtered.filter(evt => (evt.year ?? selectedYear) === eventsCardYear);
		}
		if (eventStatusFilter !== "ALL") {
			filtered = filtered.filter(evt => {
				const isCompleted = completedEventIds.has(evt.id);
				const status = isCompleted ? "COMPLETED" : (evt.status ?? "ACTIVE");
				return status === eventStatusFilter;
			});
		}
		if (eventPriorityFilter !== "ALL") {
			filtered = filtered.filter(evt => (evt.rate || evt.priority || "Low") === eventPriorityFilter);
		}
		return filtered.sort((a, b) => {
			const aCompleted = completedEventIds.has(a.id) || a.status === "COMPLETED";
			const bCompleted = completedEventIds.has(b.id) || b.status === "COMPLETED";
			if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
			return new Date(a.date).getTime() - new Date(b.date).getTime();
		});
	}, [events, eventsCardYear, selectedYear, eventStatusFilter, eventPriorityFilter, completedEventIds]);

	const activeCardEvents = useMemo(() =>
		cardEventsList.filter(evt => !completedEventIds.has(evt.id) && evt.status !== "COMPLETED"),
		[cardEventsList, completedEventIds]);

	const completedCardEvents = useMemo(() =>
		cardEventsList.filter(evt => completedEventIds.has(evt.id) || evt.status === "COMPLETED"),
		[cardEventsList, completedEventIds]);

	// ── Card-level: GM Projects ──────────────────────────────────────────────────
	const activeProjects = useMemo(() =>
		projects
			.filter(p => (p.status || "ACTIVE") !== "COMPLETED")
			.sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0) || a.projectName.localeCompare(b.projectName)),
		[projects]);

	const completedProjects = useMemo(() =>
		projects
			.filter(p => (p.status || "ACTIVE") === "COMPLETED")
			.sort((a, b) => a.projectName.localeCompare(b.projectName)),
		[projects]);

	// ── Card-level: Red Issues ───────────────────────────────────────────────────
	const availableIssueYears = useMemo(() => {
		const years = new Set<number>();
		issues.forEach(issue => { if (issue.year) years.add(issue.year); });
		return Array.from(years).sort((a, b) => b - a);
	}, [issues]);

	const cardIssuesList = useMemo(() => {
		const seen = new Set<string>();
		let list = issues.filter(issue => {
			const key = issue.id || `${issue.issue || issue.title || "unknown"}-${issue.createdAt || ""}-${issue.inCharge || ""}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
		if (issuesCardYear !== "ALL") {
			list = list.filter(issue => (issue.year ?? selectedYear) === issuesCardYear);
		} else {
			if (viewMode === "consolidated") {
				list = list.filter(issue => (issue.year ?? selectedYear) === selectedYear);
			} else {
				list = list.filter(issue =>
					(issue.year ?? selectedYear) === selectedYear &&
					(issue.week ?? selectedWeek) === selectedWeek &&
					(issue.term ?? selectedTerm) === selectedTerm
				);
			}
		}
		return list;
	}, [issues, issuesCardYear, selectedYear, selectedWeek, selectedTerm, viewMode]);

	const activeCardIssues = useMemo(() => {
		let list = cardIssuesList.filter(issue => (issue.status || "OPEN") !== "RESOLVED");
		if (issueAssigneeFilter !== "ALL") {
			list = list.filter(issue => issue.inCharge === issueAssigneeFilter);
		}
		const statusOrder: Record<string, number> = { OPEN: 0, IN_PROGRESS: 1 };
		return [...list].sort((a, b) => {
			const statusDiff = (statusOrder[a.status || "OPEN"] ?? 0) - (statusOrder[b.status || "OPEN"] ?? 0);
			if (statusDiff !== 0) return statusDiff;
			const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
			const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
			switch (issueSort) {
				case "OLDEST": return dateA - dateB;
				case "LONGEST_OPEN": return (daysBetween(b.createdAt, b.resolvedAt) ?? 0) - (daysBetween(a.createdAt, a.resolvedAt) ?? 0);
				default: return dateB - dateA;
			}
		});
	}, [cardIssuesList, issueAssigneeFilter, issueSort]);

	const resolvedCardIssues = useMemo(() => {
		let list = cardIssuesList.filter(issue => issue.status === "RESOLVED");
		if (issueAssigneeFilter !== "ALL") {
			list = list.filter(issue => issue.inCharge === issueAssigneeFilter);
		}
		return [...list].sort((a, b) => {
			const dateA = a.resolvedAt ? new Date(a.resolvedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
			const dateB = b.resolvedAt ? new Date(b.resolvedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
			return dateB - dateA;
		});
	}, [cardIssuesList, issueAssigneeFilter]);

	const enrollmentTrends = useMemo(() => {
		// Show enrollment from 2020 to current year
		const allYears = [] as number[];
		for (let year = 2020; year <= currentYear; year++) {
			allYears.push(year);
		}
		const years = enrollmentYearFilter === "ALL"
			? allYears
			: allYears.filter((year) => year === enrollmentYearFilter);
		if (years.length === 0 && enrollmentYearFilter !== "ALL") {
			years.push(enrollmentYearFilter);
		}

		const termFilter = enrollmentTermFilter === "ALL" ? null : enrollmentTermFilter;
		const selectedDynamicTypeId = enrollmentTypeFilter.startsWith("TYPE:")
			? enrollmentTypeFilter.replace("TYPE:", "")
			: null;
		
		return years.map(year => {
			// Get all enrollment records for this year with filters applied
			let yearEnrollments = allEnrollments.filter(e => e.year === year);
			let yearTheologyEnrollments = allTheologyEnrollments.filter(e => e.year === year);

			if (termFilter !== null) {
				yearEnrollments = yearEnrollments.filter(e => e.term === termFilter);
				yearTheologyEnrollments = yearTheologyEnrollments.filter(e => e.term === termFilter);
			}
			
			// Apply school filter
			if (enrollmentSchoolFilter !== "ALL") {
				yearEnrollments = yearEnrollments.filter(e => e.school === enrollmentSchoolFilter);
				yearTheologyEnrollments = yearTheologyEnrollments.filter(e => e.school === enrollmentSchoolFilter);
			}
			
			// Apply class filter
			if (enrollmentClassFilter !== "ALL") {
				yearEnrollments = yearEnrollments.filter(e => e.class === enrollmentClassFilter);
				yearTheologyEnrollments = yearTheologyEnrollments.filter(e => e.class === enrollmentClassFilter);
			}

			const enrollmentTermTotals = new Map<number, number>();
			const theologyTermTotals = new Map<number, number>();

			yearEnrollments.forEach((e: any) => {
				const term = e.term ?? 1;
				enrollmentTermTotals.set(term, (enrollmentTermTotals.get(term) || 0) + (e.count || 0));
			});
			yearTheologyEnrollments.forEach((e: any) => {
				const term = e.term ?? 1;
				theologyTermTotals.set(term, (theologyTermTotals.get(term) || 0) + (e.count || 0));
			});

			const enrollmentTerms = Array.from(enrollmentTermTotals.keys());
			const theologyTerms = Array.from(theologyTermTotals.keys());
			const totalEnrollment = enrollmentTerms.reduce((sum, term) => sum + (enrollmentTermTotals.get(term) || 0), 0);
			const totalTheology = theologyTerms.reduce((sum, term) => sum + (theologyTermTotals.get(term) || 0), 0);
			const latestEnrollmentTerm = enrollmentTerms.length > 0 ? Math.max(...enrollmentTerms) : null;
			const latestTheologyTerm = theologyTerms.length > 0 ? Math.max(...theologyTerms) : null;
			const enrollmentLatest = latestEnrollmentTerm !== null ? (enrollmentTermTotals.get(latestEnrollmentTerm) || 0) : 0;
			const theologyLatest = latestTheologyTerm !== null ? (theologyTermTotals.get(latestTheologyTerm) || 0) : 0;

			const dynamicTypeTotal = selectedDynamicTypeId
				? allDynamicEnrollments
					.filter(item => item.enrollmentTypeId === selectedDynamicTypeId && item.year === year)
					.filter(item => termFilter === null || item.term === termFilter)
					.filter(item => enrollmentSchoolFilter === "ALL" || !item.school || item.school === enrollmentSchoolFilter)
					.filter(item => enrollmentClassFilter === "ALL" || !item.class || item.class === enrollmentClassFilter)
					.reduce((sum, item) => sum + (item.count || 0), 0)
				: 0;

			// Per-type totals for ALL mode — each type gets its own data key
			const dynamicTypeTotals: Record<string, number> = {};
			if (!selectedDynamicTypeId && enrollmentTypeFilter === "ALL") {
				enrollmentTypes.forEach(type => {
					dynamicTypeTotals[`dynamicType_${type.id}`] = allDynamicEnrollments
						.filter(item => item.enrollmentTypeId === type.id && item.year === year)
						.filter(item => termFilter === null || item.term === termFilter)
						.filter(item => enrollmentSchoolFilter === "ALL" || !item.school || item.school === enrollmentSchoolFilter)
						.filter(item => enrollmentClassFilter === "ALL" || !item.class || item.class === enrollmentClassFilter)
						.reduce((sum, item) => sum + (item.count || 0), 0);
				});
			}
			
			// If no data for this year, check WeeklyReport as fallback
			if (totalEnrollment === 0) {
				const yearReports = reports.filter(r => r.year === year && (termFilter === null || (r.term ?? 1) === termFilter));
				
				if (yearReports.length === 0) {
					return {
						year: year.toString(),
						enrollmentLatest: 0,
						theologyLatest: 0,
						isFuture: year > currentYear,
					};
				}
				
				const sortedReports = yearReports.sort((a, b) => {
					const termDiff = (b.term ?? 1) - (a.term ?? 1);
					if (termDiff !== 0) return termDiff;
					return b.weekNumber - a.weekNumber;
				});
				const latestReport = sortedReports[0];
				return {
					year: year.toString(),
					enrollmentLatest: latestReport.totalEnrollment,
					theologyLatest: latestReport.theologyEnrollment,
					isFuture: false,
				};
			}
			
			// Use data from Enrollment and TheologyEnrollment tables (or selected dynamic type)
			if (enrollmentTypeFilter === "CORE") {
				return {
					year: year.toString(),
					enrollmentLatest,
					theologyLatest: 0,
					isFuture: false,
				};
			}

			if (enrollmentTypeFilter === "THEOLOGY") {
				return {
					year: year.toString(),
					enrollmentLatest: 0,
					theologyLatest,
					isFuture: false,
				};
			}

			if (selectedDynamicTypeId) {
				return {
					year: year.toString(),
					enrollmentLatest: dynamicTypeTotal,
					theologyLatest: 0,
					isFuture: false,
				};
			}

			return {
				year: year.toString(),
				enrollmentLatest,
				theologyLatest,
				isFuture: false,
				...dynamicTypeTotals,
			};
		});
	}, [reports, allEnrollments, allTheologyEnrollments, allDynamicEnrollments, enrollmentTypes, currentYear, enrollmentSchoolFilter, enrollmentClassFilter, enrollmentTermFilter, enrollmentYearFilter, enrollmentTypeFilter]);

	const enrollmentSummaryData = useMemo(() => {
		const totals = enrollmentTrends.reduce(
			(acc, row) => {
				acc.enrollment += row.enrollmentLatest || 0;
				acc.theology += row.theologyLatest || 0;
				return acc;
			},
			{ enrollment: 0, theology: 0 }
		);

		const rows: Array<{ name: string; value: number }> = [];
		if (enrollmentSeriesFilter !== "theology") {
			rows.push({ name: "Enrollment", value: totals.enrollment });
		}
		if (enrollmentSeriesFilter !== "enrollment") {
			rows.push({ name: "Theology", value: totals.theology });
		}
		return rows;
	}, [enrollmentTrends, enrollmentSeriesFilter]);

	const selectedDynamicEnrollmentRecord = useMemo(() => {
		if (!dynamicEnrollmentTypeId) return null;
		return dynamicEnrollments.find(
			item => item.enrollmentTypeId === dynamicEnrollmentTypeId && item.year === selectedYear && item.term === selectedTerm
		) || null;
	}, [dynamicEnrollments, dynamicEnrollmentTypeId, selectedYear, selectedTerm]);

	useEffect(() => {
		if (selectedDynamicEnrollmentRecord) {
			setDynamicEnrollmentCount(selectedDynamicEnrollmentRecord.count || 0);
		}
	}, [selectedDynamicEnrollmentRecord]);

	const p7ChartData = useMemo(() => {
		// Use new P7 prep + PLE + P6 promotion results data if available, otherwise fall back to old data
		const hasNewData = (p7PrepResults?.length ?? 0) > 0 || (p7PleResults?.length ?? 0) > 0 || (p6PromotionResults?.length ?? 0) > 0;
		if (hasNewData) {
			const yearPrepMap = new Map<number, Map<number, { enrollment: number; divisionI: number }>>();
			const pleYearMap = new Map<number, { popn: number; divisionI: number }>();
			const promotionYearMap = new Map<number, { actualPopn: number; divisionI: number }>();

			p7PrepResults.forEach((result: any) => {
				if (!yearPrepMap.has(result.year)) {
					yearPrepMap.set(result.year, new Map());
				}
				const prepMap = yearPrepMap.get(result.year)!;
				const key = result.prepNumber;
				const existing = prepMap.get(key) || { enrollment: 0, divisionI: 0 };
				existing.enrollment += result.enrollment || 0;
				existing.divisionI += result.divisionI || 0;
				prepMap.set(key, existing);
			});

			p7PleResults.forEach((result: any) => {
				const current = pleYearMap.get(result.year) || { popn: 0, divisionI: 0 };
				current.popn += result.popn || 0;
				current.divisionI += result.divisionI || 0;
				pleYearMap.set(result.year, current);
			});

			p6PromotionResults.forEach((result: any) => {
				if (![4, 5, 6].includes(result.setNumber)) return;
				const actual = result.actualPopn || Math.max((result.popn || 0) - (result.absences || 0), 0);
				const current = promotionYearMap.get(result.year) || { actualPopn: 0, divisionI: 0 };
				current.actualPopn += actual;
				current.divisionI += result.divisionI || 0;
				promotionYearMap.set(result.year, current);
			});

			const yearSet = new Set<number>();
			yearPrepMap.forEach((_, year) => yearSet.add(year));
			pleYearMap.forEach((_, year) => yearSet.add(year));
			promotionYearMap.forEach((_, year) => yearSet.add(year));
			const orderedYears = Array.from(yearSet).sort((a, b) => a - b);

			const rows = orderedYears.map((year) => {
				const data: any = { year, Promotion: 0 };
				const prepMap = yearPrepMap.get(year) ?? new Map();
				for (let prep = 1; prep <= 9; prep++) {
					const prepData = prepMap.get(prep);
					if (prepData && prepData.enrollment > 0) {
						data[`Prep ${prep}`] = Math.round((prepData.divisionI / prepData.enrollment) * 1000) / 10;
					} else {
						data[`Prep ${prep}`] = 0;
					}
				}

				const promotionData = promotionYearMap.get(year);
				if (promotionData && promotionData.actualPopn > 0) {
					data.Promotion = Math.round((promotionData.divisionI / promotionData.actualPopn) * 1000) / 10;
				}

				const pleData = pleYearMap.get(year);
				if (pleData && pleData.popn > 0) {
					data.PLE = Math.round((pleData.divisionI / pleData.popn) * 1000) / 10;
				} else {
					data.PLE = 0;
				}

				return data;
			});

			if (p7YearsWindow === 999) {
				return rows; // All years
			}

			const windowYears = orderedYears.slice(Math.max(0, orderedYears.length - p7YearsWindow));
			return rows.filter((d) => windowYears.includes(d.year));
		}

		// Fall back to old data - show all years
		const sorted = [...p7Data].sort((a, b) => a.year - b.year);
		return sorted.map((d) => ({
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
	}, [p7Data, p7PrepResults, p7PleResults, p6PromotionResults, p7YearsWindow]);

	const p7TableData = useMemo(() => {
		// Use the same chart data to ensure consistency
		const sorted = [...p7ChartData].sort((a, b) => a.year - b.year);
		const years = Array.from(new Set(sorted.map(d => d.year))).sort((a, b) => a - b);
		const last3Years = years.slice(Math.max(0, years.length - 3));
		const filtered = sorted.filter(d => last3Years.includes(d.year));
		
		// Transform to match table structure (add id and use correct property names)
		return filtered.map((d, idx) => ({
			id: `${d.year}-${idx}`,
			year: d.year,
			p6Promotion: d.Promotion || 0,
			prep1: d["Prep 1"] || 0,
			prep2: d["Prep 2"] || 0,
			prep3: d["Prep 3"] || 0,
			prep4: d["Prep 4"] || 0,
			prep5: d["Prep 5"] || 0,
			prep6: d["Prep 6"] || 0,
			prep7: d["Prep 7"] || 0,
			prep8: d["Prep 8"] || 0,
			prep9: d["Prep 9"] || 0,
			ple: d.PLE || 0,
		}));
	}, [p7ChartData]);

	const incomeChartData = useMemo(() => {
		// Apply filters
		let filteredIncomes = incomes;
		
		if (incomeYearFilter !== "ALL") {
			filteredIncomes = filteredIncomes.filter(inc => inc.year === incomeYearFilter);
		}
		
		if (incomeTermFilter !== "ALL") {
			filteredIncomes = filteredIncomes.filter(inc => (inc as any).term === incomeTermFilter);
		}
		
		if (incomeSourceFilter !== "ALL") {
			filteredIncomes = filteredIncomes.filter(inc => inc.source === incomeSourceFilter);
		}
		
		// If showing all terms, group by year+term; otherwise group by year only
		if (incomeTermFilter === "ALL") {
			const grouped = new Map<string, Map<string, { amount: number; percentage: number }>>();
			filteredIncomes.forEach(inc => {
				if (!grouped.has(inc.source)) {
					grouped.set(inc.source, new Map());
				}
				const periodMap = grouped.get(inc.source)!;
				const term = (inc as any).term || 1;
				const periodKey = `${inc.year}_T${term}`;
				const existing = periodMap.get(periodKey) || { amount: 0, percentage: 0 };
				existing.amount += inc.amount || 0;
				existing.percentage += inc.percentage || 0;
				periodMap.set(periodKey, existing);
			});

			const allPeriods = new Set<string>();
			filteredIncomes.forEach(inc => {
				const term = (inc as any).term || 1;
				allPeriods.add(`${inc.year}_T${term}`);
			});
			const periods = Array.from(allPeriods).sort();

			return Array.from(grouped.entries()).map(([source, periodMap]) => {
				const item: Record<string, number | string> = { name: source };
				periods.forEach(period => {
					const data = periodMap.get(period);
					if (incomeDisplayMode === "amount") {
						item[period] = data?.amount || 0;
					} else {
						item[period] = data?.percentage || 0;
					}
				});
				return item;
			});
		} else {
			// Original logic: group by year only when a specific term is selected
			const grouped = new Map<string, Map<number, { amount: number; percentage: number }>>();
			filteredIncomes.forEach(inc => {
				if (!grouped.has(inc.source)) {
					grouped.set(inc.source, new Map());
				}
				const yearMap = grouped.get(inc.source)!;
				const existing = yearMap.get(inc.year) || { amount: 0, percentage: 0 };
				existing.amount += inc.amount || 0;
				existing.percentage += inc.percentage || 0;
				yearMap.set(inc.year, existing);
			});

			const allYears = new Set<number>();
			filteredIncomes.forEach(inc => allYears.add(inc.year));
			const years = Array.from(allYears).sort((a, b) => a - b);

			return Array.from(grouped.entries()).map(([source, yearMap]) => {
				const item: Record<string, number | string> = { name: source };
				years.forEach(year => {
					const data = yearMap.get(year);
					if (incomeDisplayMode === "amount") {
						item[`year_${year}`] = data?.amount || 0;
					} else {
						item[`year_${year}`] = data?.percentage || 0;
					}
				});
				return item;
			});
		}
	}, [incomes, incomeYearFilter, incomeTermFilter, incomeSourceFilter, incomeDisplayMode]);

	const incomeTermAverages = useMemo(() => {
		// Apply filters
		let filteredIncomes = incomes;
		
		if (incomeYearFilter !== "ALL") {
			filteredIncomes = filteredIncomes.filter(inc => inc.year === incomeYearFilter);
		}
		
		if (incomeSourceFilter !== "ALL") {
			filteredIncomes = filteredIncomes.filter(inc => inc.source === incomeSourceFilter);
		}
		
		// Group by term
		const termGroups = new Map<number, { amounts: number[]; percentages: number[] }>();
		filteredIncomes.forEach(inc => {
			const term = (inc as any).term || 1;
			if (!termGroups.has(term)) {
				termGroups.set(term, { amounts: [], percentages: [] });
			}
			const group = termGroups.get(term)!;
			group.amounts.push(inc.amount || 0);
			group.percentages.push(inc.percentage || 0);
		});

		return Array.from(termGroups.entries())
			.map(([term, data]) => ({
				name: `Term ${term}`,
				avgAmount: data.amounts.length > 0 
					? data.amounts.reduce((sum, val) => sum + val, 0) / data.amounts.length 
					: 0,
				avgPercentage: data.percentages.length > 0 
					? data.percentages.reduce((sum, val) => sum + val, 0) / data.percentages.length 
					: 0,
				count: data.amounts.length
			}))
			.sort((a, b) => parseInt(a.name.split(' ')[1]) - parseInt(b.name.split(' ')[1]));
	}, [incomes, incomeYearFilter, incomeSourceFilter]);

	const incomeTotalChartData = useMemo(() => {
		// Apply filters
		let filteredIncomes = incomes;
		
		if (incomeYearFilter !== "ALL") {
			filteredIncomes = filteredIncomes.filter(inc => inc.year === incomeYearFilter);
		}
		
		if (incomeTermFilter !== "ALL") {
			filteredIncomes = filteredIncomes.filter(inc => (inc as any).term === incomeTermFilter);
		}
		
		if (incomeSourceFilter !== "ALL") {
			filteredIncomes = filteredIncomes.filter(inc => inc.source === incomeSourceFilter);
		}
		
		// Group by source and aggregate all amounts/percentages
		const sourceGroups = new Map<string, { totalAmount: number; totalPercentage: number; count: number }>();
		filteredIncomes.forEach(inc => {
			if (!sourceGroups.has(inc.source)) {
				sourceGroups.set(inc.source, { totalAmount: 0, totalPercentage: 0, count: 0 });
			}
			const group = sourceGroups.get(inc.source)!;
			group.totalAmount += inc.amount || 0;
			group.totalPercentage += inc.percentage || 0;
			group.count += 1;
		});

		return Array.from(sourceGroups.entries())
			.map(([source, data]) => ({
				name: source,
				value: incomeDisplayMode === "amount" ? data.totalAmount : (data.count > 0 ? data.totalPercentage / data.count : 0),
				totalAmount: data.totalAmount,
				totalPercentage: data.count > 0 ? data.totalPercentage / data.count : 0,
				rawTotalPercentage: data.totalPercentage,
				count: data.count
			}))
			.sort((a, b) => b.value - a.value);
	}, [incomes, incomeYearFilter, incomeTermFilter, incomeSourceFilter, incomeDisplayMode]);

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
			const key = `${sectionId}-${type}`;
			try {
				setPostingReaction(prev => ({ ...prev, [key]: true }));
				const res = await fetch("/api/reactions", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ sectionId, type, comment, weeklyReportId: currentReportId ?? null }),
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

	const renderChartReactions = (sectionId: string, label: string) => {
		const sectionReactions = reactions.filter(r => r.sectionId === sectionId);
		const thumbsUp = sectionReactions.filter(r => r.type === "THUMBS_UP").length;
		const thumbsDown = sectionReactions.filter(r => r.type === "THUMBS_DOWN").length;
		const comments = sectionReactions.filter(r => r.type === "COMMENT");
		const draft = commentDrafts[sectionId] || "";
		const isPostingUp = postingReaction[`${sectionId}-THUMBS_UP`] || false;
		const isPostingDown = postingReaction[`${sectionId}-THUMBS_DOWN`] || false;
		const isPostingComment = postingReaction[`${sectionId}-COMMENT`] || false;
		const isTrustee = userRole === "TRUSTEE";
		const isGM = userRole === "GM";
		const detailsId = `chart-comments-${sectionId}`;

		return (
			<div className="mt-4 pt-3 border-t border-gray-200 space-y-3">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						{isTrustee && (
							<>
								<button
									disabled={isPostingUp}
									onClick={() => postReaction(sectionId, "THUMBS_UP")}
									className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50"
								>
									<HandThumbUpIcon className="w-4 h-4" /> {thumbsUp}
								</button>
								<button
									disabled={isPostingDown}
									onClick={() => postReaction(sectionId, "THUMBS_DOWN")}
									className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white text-gray-700 border-gray-200 hover:border-red-400 hover:bg-red-50 disabled:opacity-50"
								>
									<HandThumbDownIcon className="w-4 h-4" /> {thumbsDown}
								</button>
							</>
						)}
						<button
							onClick={() => {
								const detailsEl = document.getElementById(detailsId);
								if (detailsEl) detailsEl.toggleAttribute("open");
							}}
							className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50"
						>
							<ChatBubbleLeftRightIcon className="w-4 h-4" /> {comments.length}
						</button>
					</div>
					{isGM && sectionReactions.length > 0 && (
						<span className="text-[11px] text-gray-500">Seen by trustee</span>
					)}
				</div>

				<details id={detailsId} className="group border border-gray-100 rounded-lg bg-gray-50/60 transition-colors">
					<summary className="flex items-center justify-between px-3 py-2 cursor-pointer text-xs font-semibold text-gray-700">
						<span>{label} comments</span>
						<span className="text-gray-500 group-open:hidden">Show</span>
						<span className="text-gray-500 hidden group-open:block">Hide</span>
					</summary>
					<div className="px-3 pb-3 pt-1 space-y-3">
						<div className="space-y-2 max-h-40 overflow-y-auto">
							{comments.length === 0 && <p className="text-xs text-gray-500 italic">No comments yet.</p>}
							{comments.map((c) => (
								<div key={c.id} className="p-2 rounded-lg bg-white border border-gray-100">
									<p className="text-xs text-gray-800 leading-snug">{c.comment}</p>
									<p className="mt-1 text-[10px] text-gray-500">{c.user?.name || "User"} • {new Date(c.createdAt).toLocaleString()}</p>
								</div>
							))}
						</div>

						{(isTrustee || isGM) ? (
							<div className="flex flex-col gap-2">
								<label className="text-[11px] font-semibold text-gray-700">{isGM ? "GM note to trustees" : "Add your comment"}</label>
								<textarea
									value={draft}
									onChange={(e) => setCommentDrafts(prev => ({ ...prev, [sectionId]: e.target.value }))}
									placeholder={isGM ? "Explain this chart to trustees" : "Add a note for the GM"}
									rows={2}
									className="w-full px-3 py-2 text-sm font-medium text-gray-900 bg-white placeholder:text-gray-400 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
								/>
								<div className="flex items-center justify-between">
									<span className="text-[10px] text-gray-500">{draft.length}/5000</span>
									<button
										disabled={!draft.trim() || isPostingComment || draft.length > 5000}
										onClick={() => postReaction(sectionId, "COMMENT", draft.trim())}
										className="px-3 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{isPostingComment ? "Saving..." : "Post"}
									</button>
								</div>
							</div>
						) : null}
					</div>
				</details>
			</div>
		);
	};

	const handleUpdateIssueStatus = useCallback(
		async (issueId: string, newStatus: string) => {
			try {
				setUpdatingIssueId(issueId);
				const response = await fetch(`/api/issues/${issueId}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ status: newStatus }),
				});
				if (!response.ok) throw new Error("Failed to update issue status");
				
				const updated = await response.json();
				
				// Update the issue in the local state
				setIssues(prev => prev.map(issue => issue.id === issueId ? { ...issue, ...updated } : issue));
				
				// Refresh timestamp
				setLastUpdated(new Date());
			} catch (err) {
				alert(err instanceof Error ? err.message : "Failed to update issue status");
			} finally {
				setUpdatingIssueId(null);
			}
		},
		[]
	);

	const handleToggleEventCompletion = useCallback((eventId: string) => {
		setCompletedEventIds(prev => {
			const next = new Set(prev);
			if (next.has(eventId)) {
				next.delete(eventId);
			} else {
				next.add(eventId);
			}
			return next;
		});
	}, []);

	const eventPriorities = useMemo(() => {
		const priorities = new Set<string>();
		tableEvents.forEach(evt => {
			const priority = evt.rate || evt.priority || "Low";
			priorities.add(priority);
		});
		return ["ALL", ...Array.from(priorities).sort()];
	}, [tableEvents]);

	const toLocalDateKey = (date: Date) => {
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
	};

	const upcomingEventsForCalendar = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		return tableEvents
			.filter(evt => !completedEventIds.has(evt.id))
			.map(evt => ({ ...evt, parsedDate: new Date(evt.date) }))
			.filter(evt => !Number.isNaN(evt.parsedDate.getTime()) && evt.parsedDate >= today)
			.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
	}, [tableEvents, completedEventIds]);

	const calendarEventMap = useMemo(() => {
		const eventMap = new Map<string, { count: number; labels: string[] }>();
		upcomingEventsForCalendar.forEach(evt => {
			const key = toLocalDateKey(evt.parsedDate);
			const current = eventMap.get(key) || { count: 0, labels: [] };
			eventMap.set(key, {
				count: current.count + 1,
				labels: [...current.labels, evt.activity],
			});
		});
		return eventMap;
	}, [upcomingEventsForCalendar]);

	const calendarCells = useMemo(() => {
		const year = calendarMonth.getFullYear();
		const month = calendarMonth.getMonth();
		const firstDayOfMonth = new Date(year, month, 1);
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const startWeekday = firstDayOfMonth.getDay();
		const prevMonthDays = new Date(year, month, 0).getDate();

		const cells: Array<{ date: Date; inCurrentMonth: boolean }> = [];

		for (let day = startWeekday - 1; day >= 0; day--) {
			cells.push({
				date: new Date(year, month - 1, prevMonthDays - day),
				inCurrentMonth: false,
			});
		}

		for (let day = 1; day <= daysInMonth; day++) {
			cells.push({
				date: new Date(year, month, day),
				inCurrentMonth: true,
			});
		}

		while (cells.length < 42) {
			const nextDay = cells.length - (startWeekday + daysInMonth) + 1;
			cells.push({
				date: new Date(year, month + 1, nextDay),
				inCurrentMonth: false,
			});
		}

		return cells;
	}, [calendarMonth]);

	const getUrgencyColor = (daysUntil: number, isCompleted: boolean): string => {
		if (isCompleted) return "bg-gray-100 text-gray-400";
		if (daysUntil < 0) return "bg-red-100 text-red-700";
		if (daysUntil === 0) return "bg-amber-100 text-amber-700";
		if (daysUntil <= 7) return "bg-orange-100 text-orange-700";
		if (daysUntil <= 14) return "bg-yellow-100 text-yellow-700";
		if (daysUntil <= 30) return "bg-blue-100 text-blue-700";
		return "bg-gray-100 text-gray-600";
	};

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

	const handleAddEnrollmentType = useCallback(async () => {
		if (!newEnrollmentTypeName.trim()) {
			alert("Please enter enrollment type name");
			return;
		}

		try {
			setSavingEnrollmentType(true);
			const response = await fetch("/api/enrollment-types", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: newEnrollmentTypeName.trim() }),
			});

			if (!response.ok) {
				const errJson = await response.json().catch(() => ({}));
				throw new Error(errJson.error || "Failed to add enrollment type");
			}

			setNewEnrollmentTypeName("");
			handleRefresh();
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to add enrollment type");
		} finally {
			setSavingEnrollmentType(false);
		}
	}, [newEnrollmentTypeName, handleRefresh]);

	const handleSaveDynamicEnrollment = useCallback(async () => {
		if (!dynamicEnrollmentTypeId) {
			alert("Please select enrollment type");
			return;
		}
		if (dynamicEnrollmentCount < 0) {
			alert("Count cannot be negative");
			return;
		}

		try {
			setSavingDynamicEnrollment(true);
			const response = await fetch("/api/dynamic-enrollments", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					enrollmentTypeId: dynamicEnrollmentTypeId,
					year: selectedYear,
					term: selectedTerm,
					count: Number(dynamicEnrollmentCount),
				}),
			});

			if (!response.ok) {
				const errJson = await response.json().catch(() => ({}));
				throw new Error(errJson.error || "Failed to save enrollment record");
			}

			// Auto-switch the chart filter so the saved data is immediately visible
			setEnrollmentTypeFilter(`TYPE:${dynamicEnrollmentTypeId}`);
			handleRefresh();
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to save enrollment record");
		} finally {
			setSavingDynamicEnrollment(false);
		}
	}, [dynamicEnrollmentTypeId, dynamicEnrollmentCount, selectedYear, selectedTerm, handleRefresh, setEnrollmentTypeFilter]);

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
				"Enrollment (Latest Term)": item.enrollmentLatest,
				"Theology (Latest Term)": item.theologyLatest,
			}));
			const trendsSheet = XLSX.utils.json_to_sheet(trendsData);
			trendsSheet['!cols'] = [{ wch: 15 }, { wch: 22 }, { wch: 22 }];
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

	if (status === "loading" || (!hasFetchedOnce && loading)) {
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

				{isRefreshing && (
					<div className="mb-4">
						<div className="h-1 w-full overflow-hidden rounded-full bg-blue-100">
							<div className="h-full w-1/3 bg-blue-500 animate-pulse"></div>
						</div>
					</div>
				)}

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

					<div className="flex flex-col sm:items-end gap-2 mt-4">
						<div className="flex flex-wrap gap-3 items-center justify-end">
							<span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
								{isRefreshing ? "Refreshing..." : lastUpdatedRelative}
							</span>
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
						<div className="flex items-center gap-2 text-sm text-gray-500">
							<ClockIcon className="w-4 h-4" />
							<span>{lastUpdatedLabel}</span>
						</div>
					</div>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 mb-10">
					{kpiMetrics.map((metric, idx) => {
						const trend = metric.value - metric.lastValue;
						const isTheology = metric.sectionId === "theology-enrollment";
						const isEnrollment = metric.sectionId === "enrollment";
						const useAbsoluteChange = isTheology || isEnrollment;
						
						let trendPercent = "0";
						if (!useAbsoluteChange) {
							if (metric.lastValue === 0 && metric.value > 0) {
								trendPercent = "100";
							} else if (metric.lastValue === 0 && metric.value === 0) {
								trendPercent = "0";
							} else if (metric.lastValue !== 0) {
								trendPercent = ((trend / Math.abs(metric.lastValue)) * 100).toFixed(1);
							}
						}
						const isPositive = trend > 0;
						const isNeutral = trend === 0;
						const hasTarget = metric.target !== undefined && metric.target !== null;
						const targetMet = hasTarget && metric.value >= (metric.target || 0);
						const targetProgress = hasTarget && metric.target ? Math.min((metric.value / metric.target) * 100, 100) : 0;

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
								className={`bg-white p-4 md:p-5 rounded-xl shadow-sm border transition-all hover:shadow-md hover:-translate-y-0.5 ${
									targetMet ? "border-green-300 bg-gradient-to-b from-green-50/60 to-white" : "border-gray-100"
								}`}
							>
								<div className="flex items-start justify-between mb-3">
									<div className="flex items-center gap-2">
										<span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
											{metric.label}
										</span>
										{targetMet && (
											<span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-green-700 bg-green-100 rounded-full border border-green-200">
												<CheckCircleIcon className="w-4 h-4" /> Target met
											</span>
										)}
									</div>
									{metricSourceLabels[metric.sectionId] && (
										<p className="text-[11px] text-gray-500 mt-1">{metricSourceLabels[metric.sectionId]}</p>
									)}
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
										) : useAbsoluteChange ? (
											isPositive ? (
												<>
													<ArrowTrendingUpIcon className="w-4 h-4" /> +{Math.abs(trend).toLocaleString()}
												</>
											) : (
												<>
													<ArrowTrendingDownIcon className="w-4 h-4" /> {trend.toLocaleString()}
												</>
											)
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

									<div className="flex items-end justify-between mb-2">
										<p className="text-2xl sm:text-3xl font-semibold text-gray-900 leading-tight">
									{metric.value}{metric.label.includes('%') || ['Fees Collection', 'Expenditure %', 'Infrastructure %', 'P7 Prep %', 'Syllabus %'].includes(metric.label) ? '%' : ''}
								</p>
										{hasTarget && <span className="text-[11px] font-semibold text-gray-600">Target {metric.target}{metric.label.includes('%') || ['Fees Collection', 'Expenditure %', 'Infrastructure %', 'P7 Prep %', 'Syllabus %'].includes(metric.label) ? '%' : ''}</span>}

				</div>
								{hasTarget && (
										<div className="mt-2 mb-3">
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
									{metric.sectionId === "p7-prep" ? (
										metric.lastValue > 0 ? (
											<span>
												{metric.lastLabel || "Previous prep"}: <span className="font-semibold text-gray-800">{metric.lastValue}%</span>
											</span>
										) : (
											<span className="italic">No previous prep data</span>
										)
									) : isTheology || isEnrollment ? (
										// Theology and Enrollment use previous TERM, not previous week
										metric.lastValue > 0 ? (
											<span>
												Last term: <span className="font-semibold text-gray-800">{metric.lastValue.toLocaleString()}</span>
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
													<div className="space-y-2">
														<textarea
															value={draft}
															onChange={(e) => setCommentDrafts(prev => ({ ...prev, [metric.sectionId]: e.target.value }))}
															placeholder="Add a note for the GM"
															rows={2}
															className="w-full px-3 py-2 text-sm font-medium text-gray-900 bg-white placeholder:text-gray-400 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
														/>
														<div className="flex items-center justify-between">
															<span className="text-[10px] text-gray-500">{draft.length}/5000</span>
															<button
																disabled={!draft.trim() || isPostingComment || draft.length > 5000}
																onClick={() => postReaction(metric.sectionId, "COMMENT", draft.trim())}
																className="px-3 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
															>
																{isPostingComment ? "Saving..." : "Post"}
															</button>
														</div>
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
													<div className="flex items-center justify-between">
														<span className="text-[10px] text-gray-500">{draft.length}/5000</span>
														<button
															disabled={!draft.trim() || isPostingComment || draft.length > 5000}
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
				<div className="flex flex-col gap-4 mb-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-lg font-semibold text-gray-900">
								Enrollment Trends {enrollmentYearFilter === "ALL" ? `(2020 - ${currentYear})` : `(${enrollmentYearFilter})`}
							</h3>
							<p className="text-xs text-gray-500 mt-1">Shows latest-term enrollment totals across all schools and classes (filters apply).</p>
						</div>
						{userRole === "GM" && (
							<div className="flex items-center gap-2">
								<Link
									href="/enrollment-types"
									className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
								>
									Custom Types
								</Link>
								<button
									onClick={() => setShowEnrollmentForm(!showEnrollmentForm)}
									className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
								>
									{showEnrollmentForm ? "Hide Form" : "Add Historical Data"}
								</button>
							</div>
						)}
					</div>
					<div className="flex flex-wrap items-center gap-4">
						<div className="flex items-center gap-2">
							<span className="text-xs text-gray-600 font-medium">Year:</span>
							<select
								value={enrollmentYearFilter}
								onChange={(e) => setEnrollmentYearFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
								className="px-3 py-1.5 text-xs font-medium text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
							>
								<option value="ALL">All Years</option>
								{Array.from({ length: currentYear - 2020 + 1 }, (_, i) => 2020 + i)
									.sort((a, b) => b - a)
									.map(year => (
										<option key={year} value={year}>{year}</option>
									))}
							</select>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xs text-gray-600 font-medium">Filter by School:</span>
							<select
								value={enrollmentSchoolFilter}
								onChange={(e) => setEnrollmentSchoolFilter(e.target.value)}
								className="px-3 py-1.5 text-xs font-medium text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
							>
								<option value="ALL">All Schools</option>
								{allEnrollments && allEnrollments.length > 0 && Array.from(new Set(allEnrollments.map(e => e.school))).sort().map(school => (
									<option key={school} value={school}>{school}</option>
								))}
							</select>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xs text-gray-600 font-medium">Filter by Term:</span>
							<select
								value={enrollmentTermFilter}
								onChange={(e) => {
									const value = e.target.value;
									setEnrollmentTermFilter(value === "ALL" ? "ALL" : Number(value));
								}}
								className="px-3 py-1.5 text-xs font-medium text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
							>
								<option value="ALL">All Terms</option>
								<option value={1}>Term 1</option>
								<option value={2}>Term 2</option>
								<option value={3}>Term 3</option>
							</select>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xs text-gray-600 font-medium">Filter by Class:</span>
							<select
								value={enrollmentClassFilter}
								onChange={(e) => setEnrollmentClassFilter(e.target.value)}
								className="px-3 py-1.5 text-xs font-medium text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
							>
								<option value="ALL">All Classes</option>
								<option value="KG1">KG1</option>
								<option value="KG2">KG2</option>
								<option value="KG3">KG3</option>
								<option value="P.1">P.1</option>
								<option value="P.2">P.2</option>
								<option value="P.3">P.3</option>
								<option value="P.4">P.4</option>
								<option value="P.5">P.5</option>
								<option value="P.6">P.6</option>
								<option value="P.7">P.7</option>
							</select>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xs text-gray-600 font-medium">Enrollment Type:</span>
							<select
								value={enrollmentTypeFilter}
								onChange={(e) => setEnrollmentTypeFilter(e.target.value)}
								className="px-3 py-1.5 text-xs font-medium text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
							>
								<option value="ALL">All Types</option>
								<option value="CORE">Core Enrollment</option>
								<option value="THEOLOGY">Theology Enrollment</option>
								{enrollmentTypes.map(type => (
									<option key={type.id} value={`TYPE:${type.id}`}>{type.name}</option>
								))}
							</select>
						</div>
						<div className="flex items-center gap-2 border-l border-gray-300 pl-4">
							<span className="text-xs text-gray-600 font-medium">Display:</span>
							<button
								onClick={() => setEnrollmentSeriesFilter("both")}
								className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
									enrollmentSeriesFilter === "both"
										? "bg-blue-600 text-white"
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								Both
							</button>
							<button
								onClick={() => setEnrollmentSeriesFilter("enrollment")}
								className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
									enrollmentSeriesFilter === "enrollment"
										? "bg-blue-600 text-white"
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								Enrollment
							</button>
							<button
								onClick={() => setEnrollmentSeriesFilter("theology")}
								className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
									enrollmentSeriesFilter === "theology"
										? "bg-blue-600 text-white"
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								Theology
							</button>
						</div>
						<div className="flex items-center gap-2 border-l border-gray-300 pl-4">
							<span className="text-xs text-gray-600 font-medium">View:</span>
							<button
								onClick={() => setEnrollmentView("by-year")}
								className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
									enrollmentView === "by-year"
										? "bg-purple-600 text-white"
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								By Year
							</button>
							<button
								onClick={() => setEnrollmentView("total")}
								className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
									enrollmentView === "total"
										? "bg-purple-600 text-white"
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								Total Summary
							</button>
						</div>
						{(enrollmentSchoolFilter !== "ALL" || enrollmentClassFilter !== "ALL" || enrollmentTermFilter !== "ALL" || enrollmentYearFilter !== "ALL" || enrollmentTypeFilter !== "ALL") && (
							<button
								onClick={() => {
									setEnrollmentSchoolFilter("ALL");
									setEnrollmentClassFilter("ALL");
									setEnrollmentTermFilter("ALL");
									setEnrollmentYearFilter("ALL");
									setEnrollmentTypeFilter("ALL");
								}}
								className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
							>
								Clear Filters
							</button>
						)}
					</div>
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

					{enrollmentView === "by-year" ? (
						<ResponsiveContainer width="100%" height={400}>
							<LineChart data={enrollmentTrends}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
								<YAxis label={{ value: "Enrollment", angle: -90, position: "insideLeft" }} />
								<Tooltip />
								<Legend />
								{enrollmentSeriesFilter !== "theology" && (
									<Line type="monotone" dataKey="enrollmentLatest" stroke="#2563eb" strokeWidth={2} name="Enrollment (Latest Term)" />
								)}
								{enrollmentSeriesFilter !== "enrollment" && (
									<Line type="monotone" dataKey="theologyLatest" stroke="#7c3aed" strokeWidth={2} name="Theology (Latest Term)" />
								)}
								{enrollmentTypeFilter === "ALL" && enrollmentTypes.map((type, i) => {
									const DYNAMIC_COLORS = ["#059669", "#d97706", "#dc2626", "#0891b2", "#be185d", "#4f46e5", "#0d9488"];
									return (
										<Line key={type.id} type="monotone" dataKey={`dynamicType_${type.id}`} stroke={DYNAMIC_COLORS[i % DYNAMIC_COLORS.length]} strokeWidth={2} name={type.name} />
									);
								})}
							</LineChart>
						</ResponsiveContainer>
					) : (
						<ResponsiveContainer width="100%" height={360}>
							<BarChart data={enrollmentSummaryData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="name" />
								<YAxis label={{ value: "Total Enrollment", angle: -90, position: "insideLeft" }} />
								<Tooltip formatter={(value) => Number(value).toLocaleString()} />
								<Legend />
								<Bar dataKey="value" name="Total">
									{enrollmentSummaryData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.name === "Enrollment" ? "#2563eb" : "#7c3aed"} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					)}
					{renderChartReactions("chart-enrollment-trends", "Enrollment trends")}
				</div>

				<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h3 className="text-lg font-semibold text-gray-900">P.7 Prep Exams (DIV 1)</h3>
							<p className="text-sm text-gray-600">Division 1 percentage trends across prep exams; table shows last 3 years.</p>
						</div>
						<div className="flex items-center gap-3 flex-wrap">
							<div className="flex items-center gap-2">
								<span className="text-xs text-gray-600">Prep:</span>
								<select
									value={p7PrepFilter}
									onChange={(e) => setP7PrepFilter(e.target.value)}
									className="px-2 py-1 text-xs font-bold text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
								>
									<option value="ALL">All Preps</option>
									<option value="Promotion">Promotion</option>
									<option value="Prep 1">Prep 1</option>
									<option value="Prep 2">Prep 2</option>
									<option value="Prep 3">Prep 3</option>
									<option value="Prep 4">Prep 4</option>
									<option value="Prep 5">Prep 5</option>
									<option value="Prep 6">Prep 6</option>
									<option value="Prep 7">Prep 7</option>
									<option value="Prep 8">Prep 8</option>
									<option value="Prep 9">Prep 9</option>
									<option value="PLE">PLE</option>
								</select>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-xs text-gray-600">Years:</span>
								<select
									value={p7YearsWindow}
									onChange={(e) => {
										const value = Number(e.target.value);
										setP7YearsWindow(value);
									}}
									className="px-2 py-1 text-xs font-bold text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
								>
									<option value={999}>All Years</option>
									<option value={3}>Last 3</option>
									<option value={4}>Last 4</option>
									<option value={5}>Last 5</option>
								</select>
							</div>
							<div className="flex items-center gap-2 border-l border-gray-300 pl-3">
								<span className="text-xs text-gray-600">View:</span>
								<button
									onClick={() => setP7ChartType("line")}
									className={`px-2 py-1 text-xs font-medium rounded ${
										p7ChartType === "line" 
											? "bg-blue-600 text-white" 
											: "bg-gray-100 text-gray-700 hover:bg-gray-200"
									}`}
								>
									Line
								</button>
								<button
									onClick={() => setP7ChartType("bar")}
									className={`px-2 py-1 text-xs font-medium rounded ${
										p7ChartType === "bar" 
											? "bg-blue-600 text-white" 
											: "bg-gray-100 text-gray-700 hover:bg-gray-200"
									}`}
								>
									Bar
								</button>
							</div>
						</div>
					</div>
					<div className="mb-4">
						{(() => {
							const P7_SERIES: { key: string; color: string }[] = [
								{ key: "Promotion", color: "#ef4444" },
								{ key: "Prep 1",    color: "#f97316" },
								{ key: "Prep 2",    color: "#eab308" },
								{ key: "Prep 3",    color: "#84cc16" },
								{ key: "Prep 4",    color: "#22c55e" },
								{ key: "Prep 5",    color: "#10b981" },
								{ key: "Prep 6",    color: "#14b8a6" },
								{ key: "Prep 7",    color: "#06b6d4" },
								{ key: "Prep 8",    color: "#0ea5e9" },
								{ key: "Prep 9",    color: "#3b82f6" },
								{ key: "PLE",       color: "#6366f1" },
							];
							const activeSeries = p7PrepFilter === "ALL"
								? P7_SERIES
								: P7_SERIES.filter(s => s.key === p7PrepFilter);
							return (
								<ResponsiveContainer width="100%" height={360}>
									{p7ChartType === "line" ? (
										<LineChart data={p7ChartData}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="year" />
											<YAxis />
											<Tooltip />
											<Legend wrapperStyle={{ fontSize: "12px" }} />
											{activeSeries.map(s => (
												<Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} dot={false} />
											))}
										</LineChart>
									) : (
										<BarChart data={p7ChartData}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="year" />
											<YAxis />
											<Tooltip />
											<Legend wrapperStyle={{ fontSize: "12px" }} />
											{activeSeries.map(s => (
												<Bar key={s.key} dataKey={s.key} fill={s.color} />
											))}
										</BarChart>
									)}
								</ResponsiveContainer>
							);
						})()}
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
					{renderChartReactions("chart-p7-prep", "P.7 prep chart")}
				</div>

				<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
				<div className="flex flex-col gap-4 mb-4">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
					<div className="flex flex-wrap items-center gap-4">
						<div className="flex items-center gap-2">
							<span className="text-xs text-gray-600 font-medium">Year:</span>
							<select
								value={incomeYearFilter}
								onChange={(e) => setIncomeYearFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
								className="px-3 py-1.5 text-xs font-medium text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
							>
								<option value="ALL">All Years</option>
								{Array.from(new Set(incomes.map(inc => inc.year))).sort((a, b) => b - a).map(year => (
									<option key={year} value={year}>{year}</option>
								))}
							</select>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xs text-gray-600 font-medium">Term:</span>
							<select
								value={incomeTermFilter}
								onChange={(e) => setIncomeTermFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
								className="px-3 py-1.5 text-xs font-medium text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
							>
								<option value="ALL">All Terms</option>
								<option value={1}>Term 1</option>
								<option value={2}>Term 2</option>
								<option value={3}>Term 3</option>
							</select>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xs text-gray-600 font-medium">Source:</span>
							<select
								value={incomeSourceFilter}
								onChange={(e) => setIncomeSourceFilter(e.target.value)}
								className="px-3 py-1.5 text-xs font-medium text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
							>
								<option value="ALL">All Sources</option>
								{incomeSources.filter(s => s.isActive).map(source => (
									<option key={source.id} value={source.name}>{source.name}</option>
								))}
							</select>
						</div>
						<div className="flex items-center gap-2 border-l border-gray-300 pl-4">
							<span className="text-xs text-gray-600 font-medium">Display:</span>
							<button
								onClick={() => setIncomeDisplayMode("amount")}
								className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
									incomeDisplayMode === "amount" 
										? "bg-blue-600 text-white" 
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								Amounts
							</button>
							<button
								onClick={() => setIncomeDisplayMode("percentage")}
								className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
									incomeDisplayMode === "percentage" 
										? "bg-blue-600 text-white" 
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								Percentages
							</button>
						</div>
						<div className="flex items-center gap-2 border-l border-gray-300 pl-4">
							<span className="text-xs text-gray-600 font-medium">View:</span>
							<button
								onClick={() => setIncomeChartView("by-year")}
								className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
									incomeChartView === "by-year" 
										? "bg-purple-600 text-white" 
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								By Year
							</button>
							<button
								onClick={() => setIncomeChartView("total")}
								className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
									incomeChartView === "total" 
										? "bg-purple-600 text-white" 
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								Total Summary
							</button>
						</div>
						{(incomeYearFilter !== "ALL" || incomeTermFilter !== "ALL" || incomeSourceFilter !== "ALL") && (
							<button
								onClick={() => {
									setIncomeYearFilter("ALL");
									setIncomeTermFilter("ALL");
									setIncomeSourceFilter("ALL");
								}}
								className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
							>
								Clear Filters
							</button>
						)}
					</div>
				</div>
				{(incomeChartView === "by-year" ? incomeChartData.length > 0 : incomeTotalChartData.length > 0) ? (
					<div>
						{incomeChartView === "by-year" ? (
							<ResponsiveContainer width="100%" height={400}>
								<BarChart data={incomeChartData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="name" />
									<YAxis label={{ value: incomeDisplayMode === "amount" ? "Amount" : "Percentage (%)", angle: -90, position: "insideLeft" }} />
									<Tooltip formatter={(value) => incomeDisplayMode === "amount" ? `${Number(value).toLocaleString()}` : `${Number(value).toFixed(1)}%`} />
									<Legend />
									{incomeTermFilter === "ALL" ? (
										(() => {
											// Get all period keys from the data
											const periodKeys = new Set<string>();
											incomeChartData.forEach(item => {
												Object.keys(item).forEach(key => {
													if (key !== "name" && key.includes("_T")) {
														periodKeys.add(key);
													}
												});
											});
											return Array.from(periodKeys).sort().map((periodKey, index) => {
												const [year, term] = periodKey.split("_");
												return (
													<Bar 
														key={periodKey} 
														dataKey={periodKey} 
														fill={COLORS[index % COLORS.length]} 
														name={`${year} ${term}`} 
													/>
												);
											});
										})()
									) : (
										Array.from(new Set(incomes.map(inc => inc.year)))
											.sort((a, b) => a - b)
											.filter(year => incomeYearFilter === "ALL" || year === incomeYearFilter)
											.map((year, index) => (
												<Bar key={year} dataKey={`year_${year}`} fill={COLORS[index % COLORS.length]} name={`Year ${year}`} />
											))
									)}
								</BarChart>
							</ResponsiveContainer>
						) : (
							<ResponsiveContainer width="100%" height={400}>
								<BarChart data={incomeTotalChartData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="name" />
									<YAxis label={{ value: incomeDisplayMode === "amount" ? "Total Amount" : "Total Percentage", angle: -90, position: "insideLeft" }} />
									<Tooltip 
										content={({ active, payload }) => {
											if (active && payload && payload.length) {
												const data = payload[0].payload;
												return (
													<div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
														<p className="font-semibold text-gray-900">{data.name}</p>
														<p className="text-sm text-blue-600">
															Total Amount: {data.totalAmount.toLocaleString()} UGX
														</p>
														<p className="text-sm text-green-600">
															Total %: {data.totalPercentage.toFixed(1)}%
														</p>
														<p className="text-xs text-gray-500 mt-1">
															{data.count} {data.count === 1 ? 'entry' : 'entries'}
														</p>
													</div>
												);
											}
											return null;
										}}
									/>
									<Legend />
									<Bar dataKey="value" fill="#8b5cf6" name={incomeDisplayMode === "amount" ? "Total Amount" : "Total Percentage"} />
								</BarChart>
							</ResponsiveContainer>
						)}
						<div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
							{incomeChartView === "by-year" ? (
								incomeChartData.map((item, idx) => {
									const dataKeys = Object.keys(item).filter(k => k !== "name");
									const totalAmount = dataKeys.reduce((sum, k) => sum + Number(item[k]), 0);
									const sourceIncomes = incomes.filter(inc =>
										inc.source === item.name &&
										(incomeYearFilter === "ALL" || inc.year === incomeYearFilter) &&
										(incomeTermFilter === "ALL" || (inc as any).term === incomeTermFilter)
									);
									const avgPercentage = sourceIncomes.length > 0
										? sourceIncomes.reduce((sum, inc) => sum + (inc.percentage || 0), 0) / sourceIncomes.length
										: 0;
									return (
										<div key={idx} className="p-3 bg-gray-50 rounded-lg">
											<p className="text-xs font-medium text-gray-700">{item.name as string}</p>
											{incomeDisplayMode === "amount" ? (
												<>
													<p className="text-sm font-semibold text-gray-900">
														{totalAmount.toLocaleString()}
													</p>
													<p className="text-[10px] text-gray-500 mt-0.5">
														{avgPercentage.toFixed(1)}%
													</p>
												</>
											) : (
												<>
													<p className="text-sm font-semibold text-gray-900">
														{avgPercentage.toFixed(1)}%
													</p>
													<p className="text-[10px] text-gray-500 mt-0.5">
														{totalAmount.toLocaleString()}
													</p>
												</>
											)}
										</div>
									);
								})
							) : (
								incomeTotalChartData.map((item, idx) => (
									<div key={idx} className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
										<p className="text-xs font-medium text-purple-900">{item.name}</p>
										{incomeDisplayMode === "amount" ? (
											<>
												<p className="text-sm font-semibold text-purple-900">
													{item.totalAmount.toLocaleString()} UGX
												</p>
												<p className="text-[10px] text-purple-700 mt-0.5">
													{item.totalPercentage.toFixed(1)}%
												</p>
											</>
										) : (
											<>
												<p className="text-sm font-semibold text-purple-900">
													{item.totalPercentage.toFixed(1)}%
												</p>
												<p className="text-[10px] text-purple-700 mt-0.5">
													{item.totalAmount.toLocaleString()} UGX
												</p>
											</>
										)}
										<p className="text-[10px] text-purple-600 mt-1">
											{item.count} {item.count === 1 ? 'entry' : 'entries'}
										</p>
									</div>
								))
							)}
						</div>

						{/* Term Averages Chart */}
						{incomeTermAverages.length > 0 && (
							<div className="mt-6 pt-6 border-t border-gray-200">
								<button
									onClick={() => setShowTermAverages(v => !v)}
									className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors mb-3"
								>
									<span>{showTermAverages ? "▾" : "▸"}</span>
									<span>Average by Term/Period</span>
									<span className="text-xs font-normal text-gray-500">{showTermAverages ? "(click to hide)" : "(click to show)"}</span>
								</button>
								{showTermAverages && (
									<>
										<ResponsiveContainer width="100%" height={300}>
											<BarChart data={incomeTermAverages}>
												<CartesianGrid strokeDasharray="3 3" />
												<XAxis dataKey="name" />
												<YAxis label={{ value: incomeDisplayMode === "amount" ? "Average Amount" : "Average %", angle: -90, position: "insideLeft" }} />
												<Tooltip 
													formatter={(value, name) => {
														if (name === "Average Amount") return `${Number(value).toLocaleString()} UGX`;
														if (name === "Average Percentage") return `${Number(value).toFixed(1)}%`;
														return value;
													}}
												/>
												<Legend />
												{incomeDisplayMode === "amount" ? (
													<Bar dataKey="avgAmount" fill="#3b82f6" name="Average Amount" />
												) : (
													<Bar dataKey="avgPercentage" fill="#10b981" name="Average Percentage" />
												)}
											</BarChart>
										</ResponsiveContainer>
										<div className="mt-4 grid grid-cols-3 gap-4">
											{incomeTermAverages.map((item, idx) => (
												<div key={idx} className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
													<p className="text-xs font-medium text-blue-900">{item.name}</p>
													{incomeDisplayMode === "amount" ? (
														<>
															<p className="text-lg font-bold text-blue-900">
																{item.avgAmount.toLocaleString()} UGX
															</p>
															<p className="text-xs text-blue-700 mt-1">
																Avg %: {item.avgPercentage.toFixed(1)}%
															</p>
														</>
													) : (
														<>
															<p className="text-lg font-bold text-blue-900">
																{item.avgPercentage.toFixed(1)}%
															</p>
															<p className="text-xs text-blue-700 mt-1">
																Avg Amount: {item.avgAmount.toLocaleString()} UGX
															</p>
														</>
													)}
													<p className="text-xs text-blue-600 mt-1">
														{item.count} {item.count === 1 ? 'entry' : 'entries'}
													</p>
												</div>
											))}
										</div>
									</>
								)}
							</div>
						)}
						{renderChartReactions("chart-other-income", "Other income chart")}
					</div>
				) : (
					<div className="h-[300px] flex items-center justify-center text-gray-500">
						No income data available. <a href="/income-entry" className="text-blue-600 ml-2 hover:underline">Add income sources</a>
					</div>
				)}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
				<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
					{/* ── Red Issues Header ─────────────────────────────────── */}
					<div className="flex flex-col gap-3 mb-4">
						<div className="flex items-center justify-between gap-2 flex-wrap">
							<h3 className="text-lg font-semibold text-gray-900">Red Issues</h3>
							<div className="flex items-center gap-2 text-xs font-semibold">
								<span className="px-2 py-1 rounded-full bg-red-100 text-red-800">Open {activeCardIssues.filter(i => (i.status || "OPEN") === "OPEN").length}</span>
								<span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">In Progress {activeCardIssues.filter(i => i.status === "IN_PROGRESS").length}</span>
								<span className="px-2 py-1 rounded-full bg-green-100 text-green-800">Resolved {resolvedCardIssues.length}</span>
							</div>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							{availableIssueYears.length > 0 && (
								<select
									value={issuesCardYear === "ALL" ? "ALL" : String(issuesCardYear)}
									onChange={(e) => { setIssuesCardYear(e.target.value === "ALL" ? "ALL" : Number(e.target.value)); setShowMoreActiveIssues(false); setShowResolvedIssues(false); }}
									className="px-3 py-2 text-xs font-bold border-2 border-blue-300 rounded-lg bg-blue-50 text-blue-900 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
									title="Filter by year"
								>
									<option value="ALL">All Years</option>
									{availableIssueYears.map(y => <option key={y} value={y}>{y}</option>)}
								</select>
							)}
							<select
								value={issueAssigneeFilter}
								onChange={(e) => setIssueAssigneeFilter(e.target.value)}
								className="px-3 py-2 text-xs font-bold border-2 border-gray-400 rounded-lg bg-gray-50 text-gray-900 hover:border-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
							>
								{issueAssignees.map(name => (
									<option key={name} value={name}>{name === "ALL" ? "All Assigned" : name}</option>
								))}
							</select>
							<select
								value={issueSort}
								onChange={(e) => setIssueSort(e.target.value as typeof issueSort)}
								className="px-3 py-2 text-xs font-bold border-2 border-gray-400 rounded-lg bg-gray-50 text-gray-900 hover:border-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
							>
								<option value="NEWEST">Newest</option>
								<option value="OLDEST">Oldest</option>
								<option value="LONGEST_OPEN">Longest open</option>
							</select>
						</div>
					</div>

					{/* ── Active Issues (Open + In Progress) ───────────────── */}
					{activeCardIssues.length === 0 ? (
						<p className="text-gray-500 text-center py-8">No open issues{issuesCardYear !== "ALL" ? ` for ${issuesCardYear}` : ""}</p>
					) : (
						<>
							<div className="space-y-0 max-h-[280px] overflow-y-auto pr-1">
								{(showMoreActiveIssues ? activeCardIssues : activeCardIssues.slice(0, 5)).map((issue, index, arr) => {
									const status = issue.status || "OPEN";
									const statusColorMap: Record<string, { bg: string; text: string }> = {
										OPEN: { bg: "bg-red-100", text: "text-red-800" },
										IN_PROGRESS: { bg: "bg-yellow-100", text: "text-yellow-800" },
										RESOLVED: { bg: "bg-green-100", text: "text-green-800" },
									};
									const statusColors = statusColorMap[status] || statusColorMap.OPEN;
									const ageDays = (() => {
										const days = daysBetween(issue.createdAt, issue.resolvedAt);
										return days == null ? "—" : `${days} day${days === 1 ? "" : "s"}`;
									})();
									const title = issue.issue || issue.title || "Untitled issue";
									const isGM = userRole === "GM";
									const isTrustee = userRole === "TRUSTEE";
									const canUpdate = isGM && status !== "RESOLVED";
									const sectionId = `red-issue-${issue.id}`;
									const sectionReactions = reactions.filter(r => r.sectionId === sectionId);
									const thumbsUp = sectionReactions.filter(r => r.type === "THUMBS_UP").length;
									const thumbsDown = sectionReactions.filter(r => r.type === "THUMBS_DOWN").length;
									const comments = sectionReactions.filter(r => r.type === "COMMENT");
									const draft = commentDrafts[sectionId] || "";
									const isPostingUp = postingReaction[`${sectionId}-THUMBS_UP`] || false;
									const isPostingDown = postingReaction[`${sectionId}-THUMBS_DOWN`] || false;
									const isPostingComment = postingReaction[`${sectionId}-COMMENT`] || false;

									return (
										<div key={issue.id}>
											<div className="flex items-start gap-4 py-4">
												<div className="flex items-start gap-2 flex-shrink-0">
													<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusColors.bg} ${statusColors.text}`}>
														{status.replace(/_/g, " ")}
													</span>
													{canUpdate && (
														<select
															value={status}
															onChange={(e) => handleUpdateIssueStatus(issue.id, e.target.value)}
															disabled={updatingIssueId === issue.id}
															className="px-3 py-1 text-xs font-bold rounded-lg border-2 border-gray-400 bg-gray-50 text-gray-900 hover:border-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all shadow-sm w-28"
															title="Change status"
														>
															<option value={status} disabled>{status.replace(/_/g, " ")}</option>
															{status === "OPEN" && (<><option value="IN_PROGRESS">In Progress</option><option value="RESOLVED">Resolved</option></>)}
															{status === "IN_PROGRESS" && (<option value="RESOLVED">Resolved</option>)}
														</select>
													)}
												</div>
												<div className="flex-1 min-w-0">
													<p className="font-bold text-gray-900 text-sm leading-5 truncate" title={title}>{title}</p>
													<p className="text-xs text-gray-600 mt-1">{issue.inCharge || "Unassigned"}</p>
													<p className="text-[11px] text-gray-500 mt-1">
														Posted <span className="font-medium text-gray-700">{formatDate(issue.createdAt)}</span>
														{issue.year && issuesCardYear === "ALL" && <span className="ml-1 text-gray-400">({issue.year})</span>}
														• Open for {ageDays}
													</p>
													{isTrustee && (
														<div className="flex items-center gap-2 mt-2">
															<button disabled={isPostingUp} onClick={() => postReaction(sectionId, "THUMBS_UP")} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50">👍 {thumbsUp}</button>
															<button disabled={isPostingDown} onClick={() => postReaction(sectionId, "THUMBS_DOWN")} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors bg-white text-gray-700 border-gray-200 hover:border-red-400 hover:bg-red-50">👎 {thumbsDown}</button>
															<button onClick={() => { const el = document.getElementById(`issue-comments-${issue.id}`); if (el) el.toggleAttribute("open"); }} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50">💬 {comments.length}</button>
														</div>
													)}
													{isGM && sectionReactions.length > 0 && (
														<div className="flex items-center gap-2 mt-2">
															<span className="text-xs text-gray-600">👍 {thumbsUp} 👎 {thumbsDown} 💬 {comments.length}</span>
														</div>
													)}
													{(isTrustee || isGM) && (
														<details id={`issue-comments-${issue.id}`} className="mt-2">
															<summary className="text-xs text-blue-600 cursor-pointer hover:underline">
																{comments.length > 0 ? `View ${comments.length} comment(s)` : "Add comment"}
															</summary>
															<div className="mt-2 space-y-2">
																{comments.map((c) => (
																	<div key={c.id} className="p-2 rounded bg-gray-50 border border-gray-200">
																		<p className="text-xs text-gray-800">{c.comment}</p>
																		<p className="mt-1 text-[10px] text-gray-500">{c.user?.name || "User"} • {new Date(c.createdAt).toLocaleString()}</p>
																	</div>
																))}
																{isTrustee && (
																	<div className="space-y-2">
																		<textarea value={draft} onChange={(e) => setCommentDrafts(prev => ({ ...prev, [sectionId]: e.target.value }))} placeholder="Add a comment" rows={2} className="w-full px-2 py-1.5 text-xs text-gray-900 border rounded resize-none" />
																		<div className="flex items-center justify-between">
																			<span className="text-[10px] text-gray-500">{draft.length}/5000</span>
																			<button disabled={!draft.trim() || isPostingComment || draft.length > 5000} onClick={() => postReaction(sectionId, "COMMENT", draft.trim())} className="px-2 py-1 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{isPostingComment ? "Saving..." : "Post"}</button>
																		</div>
																	</div>
																)}
															</div>
														</details>
													)}
													<AttachmentPanel entityId={issue.id} entityType="issue" isGM={isGM} />
												</div>
											</div>
											{index < arr.length - 1 && <div className="border-b border-gray-200"></div>}
										</div>
									);
								})}
							</div>
							{activeCardIssues.length > 5 && (
								<button
									onClick={() => setShowMoreActiveIssues(v => !v)}
									className="mt-3 w-full py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
								>
									{showMoreActiveIssues ? "▲ Show less" : `▼ Show ${activeCardIssues.length - 5} more open / in-progress`}
								</button>
							)}
						</>
					)}

					{/* ── Resolved Issues (collapsible) ─────────────────────── */}
					{resolvedCardIssues.length > 0 && (
						<div className="mt-4 border-t border-gray-200 pt-3">
							<button
								onClick={() => setShowResolvedIssues(v => !v)}
								className="flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-900 w-full text-left"
							>
								<span className={`transition-transform inline-block text-xs ${showResolvedIssues ? "rotate-90" : ""}`}>▶</span>
								Resolved ({resolvedCardIssues.length}){issuesCardYear !== "ALL" ? ` — ${issuesCardYear}` : ""}
							</button>
							{showResolvedIssues && (
								<div className="mt-2 space-y-0 max-h-[280px] overflow-y-auto">
									{resolvedCardIssues.map((issue, index) => {
										const ageDays = (() => { const d = daysBetween(issue.createdAt, issue.resolvedAt); return d == null ? "—" : `${d}d`; })();
										const title = issue.issue || issue.title || "Untitled issue";
										return (
											<div key={issue.id}>
												<div className="flex items-start gap-3 py-2.5">
													<span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 uppercase tracking-wide mt-0.5">Done</span>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-medium text-gray-500 truncate line-through decoration-gray-300" title={title}>{title}</p>
														<p className="text-[11px] text-gray-400 mt-0.5">
															{issue.inCharge || "Unassigned"}
															{issue.year && issuesCardYear === "ALL" && <span className="ml-1">· {issue.year}</span>}
															{" · "}Resolved after {ageDays}
															{issue.resolvedAt && <span className="ml-1">· {new Date(issue.resolvedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}</span>}
														</p>
													</div>
												</div>
												{index < resolvedCardIssues.length - 1 && <div className="border-b border-gray-100"></div>}
											</div>
										);
									})}
								</div>
							)}
						</div>
					)}
				</div>

					<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
					{/* ── GM Projects Header ────────────────────────────────── */}
					<div className="flex items-center justify-between gap-3 mb-4">
						<div className="flex items-center gap-2">
							<SparklesIcon className="w-5 h-5 text-purple-600" />
							<h3 className="text-lg font-semibold text-gray-900">GM Projects</h3>
						</div>
						<div className="flex items-center gap-2 text-xs font-semibold">
							<span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800">Active {activeProjects.length}</span>
							<span className="px-2 py-1 rounded-full bg-green-100 text-green-800">Done {completedProjects.length}</span>
						</div>
					</div>

					{/* ── Active Projects ───────────────────────────────────── */}
					{activeProjects.length === 0 ? (
						<div className="text-center py-8">
							<SparklesIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
							<p className="text-gray-500 text-sm">No active projects</p>
						</div>
					) : (
						<>
							<div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
								{(showMoreActiveProjects ? activeProjects : activeProjects.slice(0, 5)).map((project) => {
									const progressColor =
										project.progress >= 80 ? "from-green-500 to-green-600"
										: project.progress >= 60 ? "from-blue-500 to-blue-600"
										: project.progress >= 40 ? "from-yellow-500 to-yellow-600"
										: "from-red-500 to-red-600";
									const isGM = userRole === "GM";
									const isTrustee = userRole === "TRUSTEE";
									const sectionId = `project-${project.id}`;
									const sectionReactions = reactions.filter(r => r.sectionId === sectionId);
									const thumbsUp = sectionReactions.filter(r => r.type === "THUMBS_UP").length;
									const thumbsDown = sectionReactions.filter(r => r.type === "THUMBS_DOWN").length;
									const comments = sectionReactions.filter(r => r.type === "COMMENT");
									const draft = commentDrafts[sectionId] || "";
									const isPostingUp = postingReaction[`${sectionId}-THUMBS_UP`] || false;
									const isPostingDown = postingReaction[`${sectionId}-THUMBS_DOWN`] || false;
									const isPostingComment = postingReaction[`${sectionId}-COMMENT`] || false;

									return (
										<div key={project.id} className="group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all duration-200">
											<div className="flex items-start justify-between mb-3">
												<div className="flex-1">
													<h4 className="font-bold text-gray-900 text-base leading-tight">{project.projectName}</h4>
													{project.status && (
														<span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${project.status === "COMPLETED" ? "bg-green-100 text-green-700" : project.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
															{project.status.replace(/_/g, " ")}
														</span>
													)}
												</div>
												<div className="text-right ml-4">
													<p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Manager</p>
													<p className="text-sm font-bold text-gray-900 mt-0.5">{project.projectManager}</p>
												</div>
											</div>
											<div className="relative mb-3">
												<div className="flex items-center justify-between mb-1.5">
													<span className="text-xs font-semibold text-gray-600">Progress</span>
													<span className={`text-sm font-bold ${project.progress >= 80 ? "text-green-600" : project.progress >= 60 ? "text-blue-600" : project.progress >= 40 ? "text-yellow-600" : "text-red-600"}`}>{project.progress}%</span>
													{isGM && savingProjectIds.has(project.id) && <span className="text-[10px] font-semibold text-blue-600">Saving...</span>}
												</div>
												<div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
													<div className={`absolute inset-y-0 left-0 bg-gradient-to-r ${progressColor} rounded-full transition-all duration-500 ease-out shadow-sm`} style={{ width: `${project.progress}%` }}>
														<div className="absolute inset-0 bg-white/20 animate-pulse"></div>
													</div>
												</div>
											</div>
											{isGM && (
												<div className="mt-3">
													<div className="flex items-center gap-3">
														<input type="range" min={0} max={100} value={project.progress} onChange={(e) => handleProjectProgressUpdate(project.id, Number(e.target.value))} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" disabled={savingProjectIds.has(project.id)} />
														<input type="number" min={0} max={100} value={project.progress} onChange={(e) => handleProjectProgressUpdate(project.id, Number(e.target.value))} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900" disabled={savingProjectIds.has(project.id)} />
														<span className="text-xs text-gray-500">%</span>
													</div>
												</div>
											)}
											{isTrustee && (
												<div className="flex items-center gap-2 pt-2 border-t border-gray-100">
													<button disabled={isPostingUp} onClick={() => postReaction(sectionId, "THUMBS_UP")} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50">👍 {thumbsUp}</button>
													<button disabled={isPostingDown} onClick={() => postReaction(sectionId, "THUMBS_DOWN")} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors bg-white text-gray-700 border-gray-200 hover:border-red-400 hover:bg-red-50">👎 {thumbsDown}</button>
													<button onClick={() => { const el = document.getElementById(`project-comments-${project.id}`); if (el) el.toggleAttribute("open"); }} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50">💬 {comments.length}</button>
												</div>
											)}
											{isGM && sectionReactions.length > 0 && (
												<div className="pt-2 border-t border-gray-100">
													<span className="text-xs text-gray-600">👍 {thumbsUp} 👎 {thumbsDown} 💬 {comments.length}</span>
												</div>
											)}
											{(isTrustee || isGM) && (
												<details id={`project-comments-${project.id}`} className="mt-2">
													<summary className="text-xs text-blue-600 cursor-pointer hover:underline">{comments.length > 0 ? `View ${comments.length} comment(s)` : "Add comment"}</summary>
													<div className="mt-2 space-y-2">
														{comments.map((c) => (
															<div key={c.id} className="p-2 rounded bg-gray-50 border border-gray-200">
																<p className="text-xs text-gray-800">{c.comment}</p>
																<p className="mt-1 text-[10px] text-gray-500">{c.user?.name || "User"} • {new Date(c.createdAt).toLocaleString()}</p>
															</div>
														))}
														{isTrustee && (
															<div className="space-y-2">
																<textarea value={draft} onChange={(e) => setCommentDrafts(prev => ({ ...prev, [sectionId]: e.target.value }))} placeholder="Add a comment" rows={2} className="w-full px-2 py-1.5 text-xs text-gray-900 border rounded resize-none" />
																<div className="flex items-center justify-between">
																	<span className="text-[10px] text-gray-500">{draft.length}/5000</span>
																	<button disabled={!draft.trim() || isPostingComment || draft.length > 5000} onClick={() => postReaction(sectionId, "COMMENT", draft.trim())} className="px-2 py-1 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{isPostingComment ? "Saving..." : "Post"}</button>
																</div>
															</div>
														)}
													</div>
												</details>
											)}
										<AttachmentPanel entityId={project.id} entityType="project" isGM={isGM} />
										</div>
									);
								})}
							</div>
							{activeProjects.length > 5 && (
								<button
									onClick={() => setShowMoreActiveProjects(v => !v)}
									className="mt-3 w-full py-2 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
								>
									{showMoreActiveProjects ? "▲ Show less" : `▼ Show ${activeProjects.length - 5} more active projects`}
								</button>
							)}
						</>
					)}

					{/* ── Completed Projects (collapsible) ─────────────────── */}
					{completedProjects.length > 0 && (
						<div className="mt-4 border-t border-gray-200 pt-3">
							<button
								onClick={() => setShowCompletedProjects(v => !v)}
								className="flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-900 w-full text-left"
							>
								<span className={`transition-transform inline-block text-xs ${showCompletedProjects ? "rotate-90" : ""}`}>▶</span>
								Completed Projects ({completedProjects.length})
							</button>
							{showCompletedProjects && (
								<div className="mt-2 space-y-2 max-h-[280px] overflow-y-auto">
									{completedProjects.map((project) => (
										<div key={project.id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
											<div className="flex-1 min-w-0">
												<p className="text-sm font-semibold text-gray-600 truncate line-through decoration-gray-400">{project.projectName}</p>
												<p className="text-[11px] text-gray-400 mt-0.5">{project.projectManager} · 100% complete</p>
											</div>
											<span className="flex-shrink-0 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Done</span>
										</div>
									))}
								</div>
							)}
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

					<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
						{/* ── Upcoming Events Header ────────────────────────── */}
						<div className="p-6 border-b border-gray-100">
							<div className="flex items-start justify-between mb-4 flex-wrap gap-2">
								<div>
									<h3 className="text-lg font-bold text-gray-900">Upcoming Events</h3>
									<p className="text-xs text-gray-500 mt-1">Track and manage important dates</p>
								</div>
								<div className="flex items-center gap-2 flex-wrap">
									<span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full font-medium">
										{activeCardEvents.length} active · {completedCardEvents.length} done
									</span>
								</div>
							</div>
							<div className="flex items-center gap-3 flex-wrap">
								{availableEventYears.length > 0 && (
									<div className="flex items-center gap-2">
										<label className="text-xs font-medium text-gray-600">Year:</label>
										<select
											value={eventsCardYear === "ALL" ? "ALL" : String(eventsCardYear)}
											onChange={(e) => { setEventsCardYear(e.target.value === "ALL" ? "ALL" : Number(e.target.value)); setShowMoreActiveEvents(false); setShowCompletedEvents(false); }}
											className="border-2 border-blue-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 transition-colors"
										>
											<option value="ALL">All Years</option>
											{availableEventYears.map(y => <option key={y} value={y}>{y}</option>)}
										</select>
									</div>
								)}
								<div className="flex items-center gap-2">
									<label className="text-xs font-medium text-gray-600">Priority:</label>
									<select
										value={eventPriorityFilter}
										onChange={(e) => setEventPriorityFilter(e.target.value)}
										className="border-2 border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-900 bg-white hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
									>
										{eventPriorities.map(p => (
											<option key={p} value={p}>{p === "ALL" ? "All Priorities" : p}</option>
										))}
									</select>
								</div>
							</div>
						</div>

						{/* ── Active Events ─────────────────────────────────── */}
						{activeCardEvents.length === 0 ? (
							<div className="p-12 text-center">
								<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
									<svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 00 2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
								</div>
								<p className="text-sm font-medium text-gray-500">No upcoming events{eventsCardYear !== "ALL" ? ` for ${eventsCardYear}` : ""}</p>
								<p className="text-xs text-gray-400 mt-1">Try adjusting your filters or add new events</p>
							</div>
						) : (
							<div className="p-4">
								<div className="space-y-0 max-h-[280px] overflow-y-auto pr-1">
									{(showMoreActiveEvents ? activeCardEvents : activeCardEvents.slice(0, 5)).map((event, index, arr) => {
										const priority = event.rate || event.priority || "Low";
										const daysUntilEvent = daysUntil(event.date);
										const isCompleted = completedEventIds.has(event.id);
										const countdownBadge = daysUntilEvent < 0 ? `${Math.abs(daysUntilEvent)}d ago` : daysUntilEvent === 0 ? "Today" : `${daysUntilEvent}d`;
										const urgencyColor = getUrgencyColor(daysUntilEvent, isCompleted);
										const statusClasses = "bg-blue-100 text-blue-800";
										const isGM = userRole === "GM";
										const isTrustee = userRole === "TRUSTEE";
										const sectionId = `event-${event.id}`;
										const sectionReactions = reactions.filter(r => r.sectionId === sectionId);
										const thumbsUp = sectionReactions.filter(r => r.type === "THUMBS_UP").length;
										const thumbsDown = sectionReactions.filter(r => r.type === "THUMBS_DOWN").length;
										const comments = sectionReactions.filter(r => r.type === "COMMENT");
										const draft = commentDrafts[sectionId] || "";
										const isPostingUp = postingReaction[`${sectionId}-THUMBS_UP`] || false;
										const isPostingDown = postingReaction[`${sectionId}-THUMBS_DOWN`] || false;
										const isPostingComment = postingReaction[`${sectionId}-COMMENT`] || false;

										return (
											<div key={event.id}>
												<div className="flex items-start gap-3 py-3">
													<div className="flex items-start gap-2 flex-shrink-0">
														<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusClasses}`}>
															ACTIVE
														</span>
														{isGM && (
															<label className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-full cursor-pointer">
																<input type="checkbox" checked={isCompleted} onChange={() => handleToggleEventCompletion(event.id)} className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
																Done
															</label>
														)}
													</div>
													<div className="flex-1 min-w-0">
														<p className="font-bold text-sm leading-5 truncate text-gray-900" title={event.activity}>{event.activity}</p>
														<p className="text-xs mt-1 text-gray-600">{event.inCharge || "Unassigned"}</p>
														<div className="flex flex-wrap items-center gap-2 mt-2">
															<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${priority === "High" ? "bg-red-100 text-red-700" : priority === "Medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{priority}</span>
															<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${urgencyColor}`}>{countdownBadge}</span>
															<span className="text-[11px] text-gray-500">
																{new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
																{event.year && eventsCardYear === "ALL" && <span className="ml-1 text-gray-400">({event.year})</span>}
															</span>
														</div>
														{(isTrustee || isGM) && (
															<details id={`event-comments-${event.id}`} className="mt-2">
																<summary className="text-xs text-blue-600 cursor-pointer hover:underline">{comments.length > 0 ? `View ${comments.length} comment(s)` : "Add comment"}</summary>
																<div className="mt-2 space-y-2">
																	{comments.map((c) => (
																		<div key={c.id} className="p-2 rounded bg-gray-50 border border-gray-200">
																			<p className="text-xs text-gray-800">{c.comment}</p>
																			<p className="mt-1 text-[10px] text-gray-500">{c.user?.name || "User"} • {new Date(c.createdAt).toLocaleString()}</p>
																		</div>
																	))}
																	{isTrustee && (
																		<div className="space-y-2">
																			<textarea value={draft} onChange={(e) => setCommentDrafts(prev => ({ ...prev, [sectionId]: e.target.value }))} placeholder="Add a comment" rows={2} className="w-full px-2 py-1.5 text-xs text-gray-900 border rounded resize-none" />
																			<div className="flex items-center justify-between">
																				<span className="text-[10px] text-gray-500">{draft.length}/5000</span>
																				<button disabled={!draft.trim() || isPostingComment || draft.length > 5000} onClick={() => postReaction(sectionId, "COMMENT", draft.trim())} className="px-2 py-1 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{isPostingComment ? "Saving..." : "Post"}</button>
																			</div>
																		</div>
																	)}
																</div>
															</details>
														)}
														{isTrustee && (
															<div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
																<button disabled={isPostingUp} onClick={() => postReaction(sectionId, "THUMBS_UP")} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50">👍 {thumbsUp}</button>
																<button disabled={isPostingDown} onClick={() => postReaction(sectionId, "THUMBS_DOWN")} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors bg-white text-gray-700 border-gray-200 hover:border-red-400 hover:bg-red-50">👎 {thumbsDown}</button>
																<button onClick={() => { const el = document.getElementById(`event-comments-${event.id}`); if (el) el.toggleAttribute("open"); }} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50">💬 {comments.length}</button>
															</div>
														)}
														{isGM && sectionReactions.length > 0 && (
															<div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-600">👍 {thumbsUp} 👎 {thumbsDown} 💬 {comments.length}</div>
														)}
														<AttachmentPanel entityId={event.id} entityType="event" isGM={isGM} />
													</div>
												</div>
												{index < arr.length - 1 && <div className="border-b border-gray-200"></div>}
											</div>
										);
									})}
								</div>
								{activeCardEvents.length > 5 && (
									<button
										onClick={() => setShowMoreActiveEvents(v => !v)}
										className="mt-3 w-full py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
									>
										{showMoreActiveEvents ? "▲ Show less" : `▼ Show ${activeCardEvents.length - 5} more upcoming events`}
									</button>
								)}
							</div>
						)}

						{/* ── Completed Events (collapsible) ────────────────── */}
						{completedCardEvents.length > 0 && (
							<div className="border-t border-gray-200 px-6 py-3">
								<button
									onClick={() => setShowCompletedEvents(v => !v)}
									className="flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-900 w-full text-left"
								>
									<span className={`transition-transform inline-block text-xs ${showCompletedEvents ? "rotate-90" : ""}`}>▶</span>
									Completed Events ({completedCardEvents.length}){eventsCardYear !== "ALL" ? ` — ${eventsCardYear}` : ""}
								</button>
								{showCompletedEvents && (
									<div className="mt-2 space-y-1 max-h-[280px] overflow-y-auto">
										{completedCardEvents.map((event, index) => {
											const priority = event.rate || event.priority || "Low";
											return (
												<div key={event.id}>
													<div className="flex items-start gap-3 py-2.5">
														<span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 uppercase tracking-wide mt-0.5">Done</span>
														<div className="flex-1 min-w-0">
															<p className="text-sm font-medium text-gray-500 truncate line-through decoration-gray-300" title={event.activity}>{event.activity}</p>
															<p className="text-[11px] text-gray-400 mt-0.5">
																{event.inCharge || "Unassigned"} · {priority}
																{event.year && eventsCardYear === "ALL" && <span className="ml-1">· {event.year}</span>}
																{" · "}{new Date(event.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
															</p>
														</div>
													</div>
													{index < completedCardEvents.length - 1 && <div className="border-b border-gray-100"></div>}
												</div>
											);
										})}
									</div>
								)}
							</div>
						)}
					</div>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h3 className="text-lg font-semibold text-gray-900">Events Calendar</h3>
							<p className="text-xs text-gray-500 mt-1">Monthly view with marked upcoming events</p>
						</div>
						<div className="flex items-center gap-2">
							<button
								onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
								className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
							>
								Previous
							</button>
							<span className="text-sm font-semibold text-gray-900 min-w-[160px] text-center">
								{calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
							</span>
							<button
								onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
								className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
							>
								Next
							</button>
						</div>
					</div>

					<div className="grid grid-cols-7 gap-1 mb-2">
						{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
							<div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
								{day}
							</div>
						))}
					</div>

					<div className="grid grid-cols-7 gap-1">
						{calendarCells.map((cell) => {
							const key = toLocalDateKey(cell.date);
							const eventInfo = calendarEventMap.get(key);
							const eventCount = eventInfo?.count || 0;
							const visibleLabels = eventInfo?.labels.slice(0, 2) || [];
							const remainingCount = Math.max(0, eventCount - visibleLabels.length);
							const isToday = toLocalDateKey(new Date()) === key;

							return (
								<div
									key={key}
									title={eventInfo ? eventInfo.labels.slice(0, 3).join(" • ") : ""}
									className={`min-h-[84px] p-1.5 border rounded-md transition-colors ${
										cell.inCurrentMonth ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100"
									} ${isToday ? "ring-2 ring-blue-400" : ""}`}
								>
									<div className={`text-xs font-semibold ${cell.inCurrentMonth ? "text-gray-900" : "text-gray-400"}`}>
										{cell.date.getDate()}
									</div>
									{eventCount > 0 && (
										<div className="mt-1 space-y-1">
											{visibleLabels.map((label, idx) => (
												<p key={`${key}-${idx}`} className="text-[10px] leading-3 text-blue-700 bg-blue-50 rounded px-1 py-0.5 truncate">
													{label}
												</p>
											))}
											{remainingCount > 0 && (
												<p className="text-[10px] leading-3 font-semibold text-gray-600">+{remainingCount} more</p>
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>

					<div className="mt-4 pt-4 border-t border-gray-200">
						<h4 className="text-sm font-semibold text-gray-900 mb-2">Upcoming events this month</h4>
						{upcomingEventsForCalendar.filter(evt => evt.parsedDate.getFullYear() === calendarMonth.getFullYear() && evt.parsedDate.getMonth() === calendarMonth.getMonth()).length === 0 ? (
							<p className="text-xs text-gray-500">No upcoming events in this month.</p>
						) : (
							<div className="space-y-1 max-h-28 overflow-y-auto">
								{upcomingEventsForCalendar
									.filter(evt => evt.parsedDate.getFullYear() === calendarMonth.getFullYear() && evt.parsedDate.getMonth() === calendarMonth.getMonth())
									.slice(0, 8)
									.map(evt => (
										<div key={evt.id} className="text-xs text-gray-700 flex items-center justify-between gap-3">
											<span className="truncate">{evt.activity}</span>
											<span className="text-gray-500 font-medium whitespace-nowrap">
												{evt.parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
											</span>
										</div>
									))}
							</div>
						)}
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
