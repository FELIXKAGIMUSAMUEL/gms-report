"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useState, useEffect, createContext, useContext, useCallback } from "react";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";

// Filter Context
interface FilterContextType {
  selectedYear: number;
  selectedWeek: number;
  selectedTerm: number;
  setFilters: (year: number, week: number, term: number) => void;
}

const FilterContext = createContext<FilterContextType | null>(null);

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useFilters must be used within FilterProvider');
  return context;
};
import {
  HomeIcon,
  DocumentPlusIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChartBarIcon,
  CalendarIcon,
  RocketLaunchIcon,
  ChartPieIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  UserCircleIcon,
  UserGroupIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";
import NotificationBell from "./NotificationBell";
import MessagingDrawer from "./MessagingDrawer";
import GlobalSearch from "./GlobalSearch";
import AlertsPanel from "./AlertsPanel";
import PushNotificationManager from "./PushNotificationManager";
import PWAInstallPrompt from "./PWAInstallPrompt";

interface LayoutProps {
  children: ReactNode;
  selectedYear?: number;
  selectedTerm?: number;
  selectedWeek?: number;
  setSelectedYear?: (year: number) => void;
  setSelectedTerm?: (term: number) => void;
  setSelectedWeek?: (week: number) => void;
  showPeriodFilters?: boolean;
}

export default function DashboardLayout({ 
  children, 
  selectedYear: propSelectedYear,
  selectedTerm: propSelectedTerm,
  selectedWeek: propSelectedWeek,
  setSelectedYear: propSetSelectedYear,
  setSelectedTerm: propSetSelectedTerm,
  setSelectedWeek: propSetSelectedWeek,
  showPeriodFilters = false
}: LayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userRole = session?.user?.role;
  const portalTitle = userRole === "TRUSTEE" ? "Trustee Portal" : "GM Report Portal";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isP7EntryPath = pathname === "/p7-entry" || pathname.startsWith("/p7-prep");
  const [updateReportOpen, setUpdateReportOpen] = useState((pathname.includes("-entry") || pathname === "/gm-weekly-report" || pathname === "/trustee-financial") && !isP7EntryPath && !pathname.includes("scorecard"));
  const [enrollmentOpen, setEnrollmentOpen] = useState(pathname.includes("enrollment") && !pathname.includes("theology"));
  const [theologyOpen, setTheologyOpen] = useState(pathname.includes("theology"));
  const [p7prepOpen, setP7PrepOpen] = useState(isP7EntryPath);
  const [trusteeHubOpen, setTrusteeHubOpen] = useState(pathname.includes("trustee-"));
  const [scorecardOpen, setScorecarOpen] = useState(pathname.includes("scorecard"));
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Check session validity on mount and periodically
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);
  
  // Get current week
  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
  };
  
  const currentYear = new Date().getFullYear();
  const currentWeek = getCurrentWeek();
  
  const [selectedYear, setSelectedYear] = useState(parseInt(searchParams.get('year') || String(currentYear)));
  const [selectedWeek, setSelectedWeek] = useState(parseInt(searchParams.get('week') || String(currentWeek)));
  const [selectedTerm, setSelectedTerm] = useState(parseInt(searchParams.get('term') || '1'));

  // Use prop values if provided, otherwise use local state
  const activeYear = propSelectedYear ?? selectedYear;
  const activeTerm = propSelectedTerm ?? selectedTerm;
  const activeWeek = propSelectedWeek ?? selectedWeek;
  const handleYearChange = propSetSelectedYear ?? setSelectedYear;
  const handleTermChange = propSetSelectedTerm ?? setSelectedTerm;
  const handleWeekChange = propSetSelectedWeek ?? setSelectedWeek;

  const currentUserId = session?.user?.id;
  
  const updateFilters = (year: number, week: number, term: number) => {
    setSelectedYear(year);
    setSelectedWeek(week);
    setSelectedTerm(term);
    const params = new URLSearchParams();
    if (year !== currentYear) params.set('year', String(year));
    if (week !== currentWeek) params.set('week', String(week));
    if (term !== 1) params.set('term', String(term));
    const queryString = params.toString();
    router.push(`${pathname}${queryString ? '?' + queryString : ''}`);
  };

  const refreshUnreadMessages = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const response = await fetch("/api/messages");
      if (!response.ok) return;
      const data = await response.json();
      const unread = data.filter((message: any) => message.recipientId === currentUserId && !message.isRead).length;
      setUnreadMessages(unread);
    } catch (error) {
      console.error("Error fetching unread messages:", error);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    refreshUnreadMessages();
    const interval = setInterval(refreshUnreadMessages, 12000);
    return () => clearInterval(interval);
  }, [currentUserId, refreshUnreadMessages]);

  const openMessaging = () => {
    setMessagingOpen(true);
    refreshUnreadMessages();
  };

  const closeMessaging = () => setMessagingOpen(false);

  // Auto-logout after 30 minutes of inactivity
  useInactivityLogout(30);

  if (!session) return null;

  const isGM = session.user.role === "GM";
  const isTrustee = session.user.role === "TRUSTEE";

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon, show: true },
    { name: "Submissions", href: "#", icon: DocumentPlusIcon, show: isGM, isDropdown: true, dropdownKey: "updateReport" },
    { name: "Scorecard", href: "#", icon: ChartPieIcon, show: isGM || isTrustee, isDropdown: true, dropdownKey: "scorecard" },
    { name: "Schools Enrollment", href: "#", icon: UserGroupIcon, show: true, isDropdown: true, dropdownKey: "enrollment" },
    { name: "Theology Enrollment", href: "#", icon: AcademicCapIcon, show: true, isDropdown: true, dropdownKey: "theology" },
    { name: "P.7 Prep & PLE", href: "#", icon: AcademicCapIcon, show: true, isDropdown: true, dropdownKey: "p7prep" },
    { name: "Analytics", href: "/analytics", icon: ChartBarIcon, show: true },
    { name: "Past Reports", href: "/past-reports", icon: ClockIcon, show: true },
    { name: "Trustee Hub", href: "#", icon: SparklesIcon, show: isTrustee, isDropdown: true, dropdownKey: "trusteeHub" },
    { name: "Comments Report", href: "/comments-report", icon: ChatBubbleLeftRightIcon, show: true },
    { name: "Settings", href: "/settings", icon: UserCircleIcon, show: isGM },
  ];

  const updateReportSections = [
    { name: "KPI Entry", href: "/kpi-entry", icon: ChartBarIcon },
    { name: "Events Management", href: "/events-entry", icon: CalendarIcon },
    { name: "Projects Management", href: "/projects-entry", icon: RocketLaunchIcon },
    { name: "Issues Management", href: "/issues-entry", icon: ExclamationTriangleIcon },
    { name: "Income and Expenditure", href: "/financial-entry", icon: CurrencyDollarIcon },
    { name: "Budget Entry", href: "/budget-entry", icon: CurrencyDollarIcon },
    { name: "Financial Overview", href: "/trustee-financial", icon: ChartBarIcon },
    { name: "Weekly Report", href: "/gm-weekly-report", icon: DocumentPlusIcon },
  ];

  const scorecardSections = isGM ? [
    { name: "Scorecard Entry", href: "/scorecard-entry", icon: DocumentPlusIcon },
    { name: "Scorecard Analysis", href: "/scorecard-analysis", icon: ChartBarIcon },
  ] : [
    { name: "Scorecard Analysis", href: "/scorecard-analysis", icon: ChartBarIcon },
  ];

  // Theology sections - showing only entry for GM, only analysis for Trustee
  const theologySections = isGM ? [
    { name: "Theology Enrollment Tracking", href: "/theology-enrollment-entry", icon: DocumentPlusIcon, description: "Enter enrollment numbers for each school by class and term" },
    { name: "Theology Enrollment Analysis", href: "/theology-analysis", icon: ChartBarIcon, description: "Detailed trends, comparisons, and variance analysis" },
  ] : [
    { name: "Theology Enrollment Analysis", href: "/theology-analysis", icon: ChartBarIcon, description: "Detailed trends, comparisons, and variance analysis" },
  ];

  // Enrollment sections - showing only entry for GM, only analysis for Trustee
  const enrollmentSections = isGM ? [
    { name: "Enrollment Tracking", href: "/enrollment-entry", icon: DocumentPlusIcon, description: "Enter enrollment numbers for each school by class and term" },
    { name: "Enrollment Analysis", href: "/enrollment-analysis", icon: ChartBarIcon, description: "Detailed trends, comparisons, and variance analysis" },
    { name: "Enrollment Types", href: "/enrollment-types", icon: DocumentPlusIcon, description: "Manage custom enrollment categories (Swimming, Tours, etc.)" },
  ] : [
    { name: "Enrollment Analysis", href: "/enrollment-analysis", icon: ChartBarIcon, description: "Detailed trends, comparisons, and variance analysis" },
  ];

  // P.7 Prep sections - showing only entry for GM, only analysis for Trustee
  const p7PrepSections = isGM ? [
    { name: "PLE Tracking", href: "/p7-entry", icon: AcademicCapIcon, description: "Enter PLE overall summary by school and year" },
    { name: "P.6 Promotion Entry", href: "/p6-promotion-entry", icon: AcademicCapIcon, description: "Capture P.6 promotion results and API/rank" },
    { name: "P.7 Prep Results Tracking", href: "/p7-prep-entry", icon: DocumentPlusIcon, description: "Enter division results and average scores for each prep exam" },
    { name: "P.7 Prep Analysis", href: "/p7-prep-analysis", icon: ChartBarIcon, description: "Prep trends, school rankings, and performance analysis" },
  ] : [
    { name: "P.7 Prep Analysis", href: "/p7-prep-analysis", icon: ChartBarIcon, description: "Prep trends, school rankings, and performance analysis" },
  ];

  // Trustee Hub sections
  const trusteeHubSections = [
    { name: "Executive Dashboard", href: "/trustee-dashboard", icon: ChartBarIcon, description: "High-level overview and key metrics" },
    { name: "Financial Overview", href: "/trustee-financial", icon: CurrencyDollarIcon, description: "Consolidated financial view and cash flows" },
    { name: "Board Meeting Reports", href: "/trustee-board-reports", icon: DocumentPlusIcon, description: "Generate formatted reports for board meetings" },
    { name: "Comparative Analysis", href: "/trustee-analysis", icon: ChartBarIcon, description: "School vs school comparisons and benchmarking" },
    { name: "Goals & Targets", href: "/trustee-goals", icon: RocketLaunchIcon, description: "Organizational goals and progress tracking" },
    { name: "Export Center", href: "/trustee-export", icon: DocumentPlusIcon, description: "Bulk export and custom reports" },
  ];

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center min-h-16 py-2 gap-3 sm:gap-4">
            {/* Left: Logo, Mobile Menu Button, and Mobile Filter Button */}
            <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              {showPeriodFilters && (
                <button
                  onClick={() => setMobileFiltersOpen(v => !v)}
                  className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-xs font-semibold border border-gray-200"
                  title="Period filters"
                >
                  <CalendarIcon className="h-4 w-4 text-blue-600" />
                  <span>Y{activeYear} T{activeTerm} W{activeWeek}</span>
                  {mobileFiltersOpen ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
                </button>
              )}
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                  <img src="/sak.jpg" alt="SAK" className="w-full h-full object-contain" />
                </div>
                <div className="hidden sm:block min-w-0">
                  <h1 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 truncate max-w-[14rem] lg:max-w-none">{portalTitle}</h1>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 truncate max-w-[14rem] lg:max-w-none">SAK General Managers Report</p>
                </div>
              </div>
            </div>

            {/* Center: Period filters */}
            {showPeriodFilters && (
              <div className="hidden lg:flex items-center gap-3 flex-1 justify-center max-w-2xl mx-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-xl border border-gray-200 shadow-sm">
                  {/* Year filter */}
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    <label className="text-sm font-bold text-gray-800">Year</label>
                    <select
                      value={activeYear}
                      onChange={(e) => handleYearChange(parseInt(e.target.value))}
                      className="px-3 py-2 text-base font-bold text-gray-900 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[2024, 2025, 2026].map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  {/* Term filter */}
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-purple-600" />
                    <label className="text-sm font-bold text-gray-800">Term</label>
                    <select
                      value={activeTerm}
                      onChange={(e) => handleTermChange(parseInt(e.target.value))}
                      className="px-3 py-2 text-base font-bold text-gray-900 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>Term 1</option>
                      <option value={2}>Term 2</option>
                      <option value={3}>Term 3</option>
                    </select>
                  </div>

                  {/* Week filter */}
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-green-600" />
                    <label className="text-sm font-bold text-gray-800">Week</label>
                    <select
                      value={activeWeek}
                      onChange={(e) => handleWeekChange(parseInt(e.target.value))}
                      className="px-3 py-2 text-base font-bold text-gray-900 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 13 }, (_, i) => i + 1).map((week) => (
                        <option key={week} value={week}>Week {week}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Right: User Info and Actions */}
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap justify-end">
              <div className="hidden sm:block">
                <GlobalSearch />
              </div>
              <AlertsPanel />
              <NotificationBell />
              <button
                onClick={openMessaging}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Open messages"
              >
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-gray-700" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-2 py-1 text-[10px] font-bold leading-none text-white bg-blue-600 rounded-full">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </button>

	            </div>
          </div>
        </div>
        {/* Mobile period filter panel */}
        {showPeriodFilters && mobileFiltersOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                <label className="text-xs font-bold text-gray-700">Year</label>
                <select
                  value={activeYear}
                  onChange={(e) => handleYearChange(parseInt(e.target.value))}
                  className="px-2 py-1.5 text-sm font-bold text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[2024, 2025, 2026].map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <SparklesIcon className="w-4 h-4 text-purple-600" />
                <label className="text-xs font-bold text-gray-700">Term</label>
                <select
                  value={activeTerm}
                  onChange={(e) => handleTermChange(parseInt(e.target.value))}
                  className="px-2 py-1.5 text-sm font-bold text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Term 1</option>
                  <option value={2}>Term 2</option>
                  <option value={3}>Term 3</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4 text-green-600" />
                <label className="text-xs font-bold text-gray-700">Week</label>
                <select
                  value={activeWeek}
                  onChange={(e) => handleWeekChange(parseInt(e.target.value))}
                  className="px-2 py-1.5 text-sm font-bold text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 13 }, (_, i) => i + 1).map((week) => (
                    <option key={week} value={week}>Week {week}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile sidebar */}
        <div className={`md:hidden ${sidebarOpen ? "fixed inset-0 z-40" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white shadow-xl">
          <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-blue-600 to-blue-700">
            <span className="text-xl font-semibold text-white">GM Report</span>
            <button onClick={() => setSidebarOpen(false)} className="text-white">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) =>
              item.show ? (
                item.isDropdown ? (
                  <div key={item.name} className="space-y-1">
                    <button
                      onClick={() => {
                        if (item.dropdownKey === "updateReport") {
                          setUpdateReportOpen(!updateReportOpen);
                        } else if (item.dropdownKey === "enrollment") {
                          setEnrollmentOpen(!enrollmentOpen);
                        } else if (item.dropdownKey === "theology") {
                          setTheologyOpen(!theologyOpen);
                        } else if (item.dropdownKey === "p7prep") {
                          setP7PrepOpen(!p7prepOpen);
                        } else if (item.dropdownKey === "trusteeHub") {
                          setTrusteeHubOpen(!trusteeHubOpen);
                        } else if (item.dropdownKey === "scorecard") {
                          setScorecarOpen(!scorecardOpen);
                        }
                      }}
                      className={`w-full group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        (item.dropdownKey === "updateReport" && pathname.includes("-entry") && !isP7EntryPath && !pathname.includes("scorecard")) ||
                        (item.dropdownKey === "enrollment" && pathname.includes("enrollment") && !pathname.includes("theology")) ||
                        (item.dropdownKey === "theology" && pathname.includes("theology")) ||
                        (item.dropdownKey === "p7prep" && isP7EntryPath) ||
                        (item.dropdownKey === "trusteeHub" && pathname.includes("trustee-")) ||
                        (item.dropdownKey === "scorecard" && pathname.includes("scorecard"))
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </div>
                      {((item.dropdownKey === "updateReport" && updateReportOpen) || 
                        (item.dropdownKey === "enrollment" && enrollmentOpen) ||
                        (item.dropdownKey === "theology" && theologyOpen) ||
                        (item.dropdownKey === "p7prep" && p7prepOpen) ||
                        (item.dropdownKey === "trusteeHub" && trusteeHubOpen) ||
                        (item.dropdownKey === "scorecard" && scorecardOpen)) ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </button>
                    
                    {item.dropdownKey === "updateReport" && updateReportOpen && (
                      <div className="ml-8 space-y-1">
                        {updateReportSections.map((section) => (
                          <Link
                            key={section.name}
                            href={section.href}
                            onClick={() => setSidebarOpen(false)}
                            className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                          >
                            <section.icon className="mr-2 h-4 w-4" />
                            {section.name}
                          </Link>
                        ))}
                      </div>
                    )}

                    {item.dropdownKey === "enrollment" && enrollmentOpen && (
                      <div className="ml-8 space-y-1">
                        {enrollmentSections.map((section) => (
                          <Link
                            key={section.name}
                            href={section.href}
                            onClick={() => setSidebarOpen(false)}
                            className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                          >
                            <section.icon className="mr-2 h-4 w-4" />
                            <span className="text-xs">{section.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {item.dropdownKey === "theology" && theologyOpen && (
                      <div className="ml-8 space-y-1">
                        {theologySections.map((section) => (
                          <Link
                            key={section.name}
                            href={section.href}
                            onClick={() => setSidebarOpen(false)}
                            className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                          >
                            <section.icon className="mr-2 h-4 w-4" />
                            <span className="text-xs">{section.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {item.dropdownKey === "p7prep" && p7prepOpen && (
                      <div className="ml-8 space-y-1">
                        {p7PrepSections.map((section) => (
                          <Link
                            key={section.name}
                            href={section.href}
                            onClick={() => setSidebarOpen(false)}
                            className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                          >
                            <section.icon className="mr-2 h-4 w-4" />
                            <span className="text-xs">{section.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {item.dropdownKey === "trusteeHub" && trusteeHubOpen && (
                      <div className="ml-8 space-y-1">
                        {trusteeHubSections.map((section) => (
                          <Link
                            key={section.name}
                            href={section.href}
                            onClick={() => setSidebarOpen(false)}
                            className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                          >
                            <section.icon className="mr-2 h-4 w-4" />
                            <span className="text-xs">{section.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {item.dropdownKey === "scorecard" && scorecardOpen && (
                      <div className="ml-8 space-y-1">
                        {scorecardSections.map((section) => (
                          <Link
                            key={section.name}
                            href={section.href}
                            onClick={() => setSidebarOpen(false)}
                            className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                          >
                            <section.icon className="mr-2 h-4 w-4" />
                            {section.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      pathname === item.href
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              ) : null
            )}
          </nav>
          <div className="p-4 border-t">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white shadow">
                  <img
                    src={session.user.avatarUrl || "/User_Avatar.png"}
                    alt={session.user.name ?? ""}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                <p className="text-xs text-gray-500">{session.user.role}</p>
              </div>
            </div>
            <a
              href="/profile"
              className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors mb-2"
            >
              <UserCircleIcon className="mr-2 h-5 w-5" />
              Edit Profile
            </a>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? "w-16" : "w-64"}`}>
        <div className="flex flex-col w-full">
          <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-sm">
            {/* Sidebar header */}
            <div className={`flex items-center h-16 px-3 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800 ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
              {!sidebarCollapsed && (
                <span className="text-sm font-bold text-white tracking-wide">NAVIGATION</span>
              )}
              <div className={`flex items-center ${sidebarCollapsed ? "flex-col gap-1" : "gap-2"}`}>
                {/* Fullscreen toggle */}
                <button
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  className="p-2 rounded-lg text-white bg-white/20 hover:bg-white/40 transition-colors"
                >
                  {isFullscreen
                    ? <ArrowsPointingInIcon className="h-5 w-5" />
                    : <ArrowsPointingOutIcon className="h-5 w-5" />}
                </button>
                {/* Collapse toggle */}
                <button
                  onClick={toggleSidebar}
                  title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  className="p-2 rounded-lg text-white bg-white/20 hover:bg-white/40 transition-colors"
                >
                  {sidebarCollapsed
                    ? <ChevronRightIcon className="h-5 w-5" />
                    : <ChevronLeftIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-3 py-6 space-y-1">
                {navigation.map((item) =>
                  item.show ? (
                    item.isDropdown ? (
                      <div key={item.name} className="space-y-1">
                        <button
                          onClick={() => {
                            if (item.dropdownKey === "updateReport") {
                              setUpdateReportOpen(!updateReportOpen);
                            } else if (item.dropdownKey === "enrollment") {
                              setEnrollmentOpen(!enrollmentOpen);
                            } else if (item.dropdownKey === "theology") {
                              setTheologyOpen(!theologyOpen);
                            } else if (item.dropdownKey === "p7prep") {
                              setP7PrepOpen(!p7prepOpen);
                            } else if (item.dropdownKey === "trusteeHub") {
                              setTrusteeHubOpen(!trusteeHubOpen);
                            } else if (item.dropdownKey === "scorecard") {
                              setScorecarOpen(!scorecardOpen);
                            }
                          }}
                          className={`w-full group flex items-center ${sidebarCollapsed ? "justify-center" : "justify-between"} px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            (item.dropdownKey === "updateReport" && pathname.includes("-entry") && !isP7EntryPath && !pathname.includes("scorecard")) ||
                            (item.dropdownKey === "enrollment" && pathname.includes("enrollment") && !pathname.includes("theology")) ||
                            (item.dropdownKey === "theology" && pathname.includes("theology")) ||
                            (item.dropdownKey === "p7prep" && isP7EntryPath) ||
                            (item.dropdownKey === "trusteeHub" && pathname.includes("trustee-")) ||
                            (item.dropdownKey === "scorecard" && pathname.includes("scorecard"))
                              ? "bg-blue-50 text-blue-700 shadow-sm"
                              : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                          }`}
                          title={sidebarCollapsed ? item.name : undefined}
                        >
                          <div className="flex items-center">
                            <item.icon className={`${sidebarCollapsed ? "" : "mr-3"} h-5 w-5 ${
                              (item.dropdownKey === "updateReport" && pathname.includes("-entry") && !isP7EntryPath && !pathname.includes("scorecard")) ||
                              (item.dropdownKey === "enrollment" && pathname.includes("enrollment") && !pathname.includes("theology")) ||
                              (item.dropdownKey === "theology" && pathname.includes("theology")) ||
                              (item.dropdownKey === "p7prep" && isP7EntryPath) ||
                              (item.dropdownKey === "trusteeHub" && pathname.includes("trustee-")) ||
                              (item.dropdownKey === "scorecard" && pathname.includes("scorecard"))
                                ? "text-blue-600" 
                                : "text-gray-400"
                            }`} />
                            {!sidebarCollapsed && item.name}
                          </div>
                          {!sidebarCollapsed && (((item.dropdownKey === "updateReport" && updateReportOpen) || 
                            (item.dropdownKey === "enrollment" && enrollmentOpen) ||
                            (item.dropdownKey === "theology" && theologyOpen) ||
                            (item.dropdownKey === "p7prep" && p7prepOpen) ||
                            (item.dropdownKey === "trusteeHub" && trusteeHubOpen) ||
                            (item.dropdownKey === "scorecard" && scorecardOpen)) ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          ))}                        </button>
                        
                        {!sidebarCollapsed && item.dropdownKey === "updateReport" && updateReportOpen && (
                          <div className="ml-8 space-y-1 mt-1">
                            {updateReportSections.map((section) => (
                              <Link
                                key={section.name}
                                href={section.href}
                                className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                              >
                                <section.icon className="mr-2 h-4 w-4" />
                                {section.name}
                              </Link>
                            ))}
                          </div>
                        )}

                        {!sidebarCollapsed && item.dropdownKey === "enrollment" && enrollmentOpen && (
                          <div className="ml-8 space-y-1 mt-1">
                            {enrollmentSections.map((section) => (
                              <Link
                                key={section.name}
                                href={section.href}
                                className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                              >
                                <section.icon className="mr-2 h-4 w-4" />
                                <span className="text-xs">{section.name}</span>
                              </Link>
                            ))}
                          </div>
                        )}

                        {!sidebarCollapsed && item.dropdownKey === "theology" && theologyOpen && (
                          <div className="ml-8 space-y-1 mt-1">
                            {theologySections.map((section) => (
                              <Link
                                key={section.name}
                                href={section.href}
                                className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                              >
                                <section.icon className="mr-2 h-4 w-4" />
                                <span className="text-xs">{section.name}</span>
                              </Link>
                            ))}
                          </div>
                        )}

                        {!sidebarCollapsed && item.dropdownKey === "p7prep" && p7prepOpen && (
                          <div className="ml-8 space-y-1 mt-1">
                            {p7PrepSections.map((section) => (
                              <Link
                                key={section.name}
                                href={section.href}
                                className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                              >
                                <section.icon className="mr-2 h-4 w-4" />
                                <span className="text-xs">{section.name}</span>
                              </Link>
                            ))}
                          </div>
                        )}

                        {!sidebarCollapsed && item.dropdownKey === "trusteeHub" && trusteeHubOpen && (
                          <div className="ml-8 space-y-1 mt-1">
                            {trusteeHubSections.map((section) => (
                              <Link
                                key={section.name}
                                href={section.href}
                                className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                              >
                                <section.icon className="mr-2 h-4 w-4" />
                                <span className="text-xs">{section.name}</span>
                              </Link>
                            ))}
                          </div>
                        )}

                        {!sidebarCollapsed && item.dropdownKey === "scorecard" && scorecardOpen && (
                          <div className="ml-8 space-y-1 mt-1">
                            {scorecardSections.map((section) => (
                              <Link
                                key={section.name}
                                href={section.href}
                                className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                              >
                                <section.icon className="mr-2 h-4 w-4" />
                                {section.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        key={item.name}
                        href={item.href}
                        title={sidebarCollapsed ? item.name : undefined}
                        className={`group flex items-center ${sidebarCollapsed ? "justify-center" : ""} px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          pathname === item.href
                            ? "bg-blue-50 text-blue-700 shadow-sm"
                            : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        }`}
                      >
                        <item.icon className={`${sidebarCollapsed ? "" : "mr-3"} h-5 w-5 ${pathname === item.href ? "text-blue-600" : "text-gray-400"}`} />
                        {!sidebarCollapsed && item.name}
                      </Link>
                    )
                  ) : null
                )}
              </nav>
              <div className="p-3 border-t border-gray-200 mt-auto space-y-2">
                {sidebarCollapsed ? (
                  <>
                    <a href="/profile" title="Edit Profile" className="flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      <UserCircleIcon className="h-5 w-5" />
                    </a>
                    <button onClick={handleSignOut} title="Sign Out" className="w-full flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href="/profile"
                      className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <UserCircleIcon className="mr-2 h-5 w-5" />
                      Edit Profile
                    </a>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" />
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
      </div>
      </div>
      <MessagingDrawer
        open={messagingOpen}
        onClose={closeMessaging}
        currentUserId={currentUserId}
        onMessageSent={refreshUnreadMessages}
        onMessagesRead={refreshUnreadMessages}
      />
      <PushNotificationManager />
      <PWAInstallPrompt />
    </div>
  );
}
