"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import * as XLSX from "xlsx";
import { 
  PlusIcon, TrashIcon, PencilSquareIcon, 
  ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  BuildingOfficeIcon, AcademicCapIcon,
  ArrowUpTrayIcon
} from "@heroicons/react/24/outline";

interface School {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
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

interface ScorecardWithTrend extends WeeklyScorecard {
  totalScore: number;
  averageScore: number;
  lastWeekTotal?: number;
  trend?: number;
  position?: number;
}

const currentYear = new Date().getFullYear();

// Format numeric scores to two decimal places and hide invalid values
const formatScore = (value?: number) =>
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "—";

const formatAverage = (value?: number) =>
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(1) : "—";

export default function ScorecardEntryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(1);

  const [schools, setSchools] = useState<School[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [scorecards, setScorecards] = useState<WeeklyScorecard[]>([]);
  const [allScorecards, setAllScorecards] = useState<WeeklyScorecard[]>([]);
  
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  
  const [scores, setScores] = useState({
    academicScore: 50,
    financeScore: 50,
    qualityScore: 50,
    technologyScore: 50,
    theologyScore: 50,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showSchoolManager, setShowSchoolManager] = useState(false);
  const [editingScorecardId, setEditingScorecardId] = useState<string | null>(null);
  const [showDepartmentManager, setShowDepartmentManager] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [selectedSchools, setSelectedSchools] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'overall' | 'school'>('overall');
  const [selectionMode, setSelectionMode] = useState(false);

  const downloadTemplate = () => {
    // Create sample data
    const templateData = [
      {
        SCH: "CPS",
        ACADEMIC: 72.67,
        QUALITY: 86.00,
        FINANCE: 10.00,
        THEOLOGY: 89.65,
        TDP: 70.61,
        YEAR: selectedYear,
        TERM: selectedTerm,
        WEEK: selectedWeek,
      },
      {
        SCH: "FAIRWAYS",
        ACADEMIC: 83.89,
        QUALITY: 77.26,
        FINANCE: 77.98,
        THEOLOGY: 70.30,
        TDP: 89.40,
        YEAR: selectedYear,
        TERM: selectedTerm,
        WEEK: selectedWeek,
      },
      {
        SCH: "KIRA",
        ACADEMIC: 79.56,
        QUALITY: 84.22,
        FINANCE: 84.80,
        THEOLOGY: 71.87,
        TDP: 65.22,
        YEAR: selectedYear,
        TERM: selectedTerm,
        WEEK: selectedWeek,
      },
    ];

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scorecards");

    // Set column widths
    worksheet["!cols"] = [
      { wch: 15 }, // SCH
      { wch: 12 }, // ACADEMIC
      { wch: 12 }, // QUALITY
      { wch: 12 }, // FINANCE
      { wch: 12 }, // THEOLOGY
      { wch: 12 }, // TDP
      { wch: 10 }, // YEAR
      { wch: 10 }, // TERM
      { wch: 10 }, // WEEK
    ];

    // Download file
    XLSX.writeFile(workbook, `Scorecard_Template_Term${selectedTerm}_Week${selectedWeek}_${selectedYear}.xlsx`);
  };

  const fetchSchools = useCallback(async () => {
    try {
      const response = await fetch("/api/schools");
      if (response.ok) {
        const data = await response.json();
        setSchools(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch schools:", err);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetch("/api/departments");
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  }, []);

  const fetchScorecards = useCallback(async () => {
    try {
      setFetchLoading(true);
      const params = new URLSearchParams({ year: String(selectedYear), term: String(selectedTerm) });
      const response = await fetch(`/api/scorecard?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        // API returns array directly, convert to our format
        const all = (Array.isArray(data) ? data : []).map((sc: any) => ({
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
        setAllScorecards(all);
        const filtered = all.filter((sc: WeeklyScorecard) =>
          sc.year === selectedYear && sc.term === selectedTerm && sc.week === selectedWeek
        );
        setScorecards(filtered);
      }
    } catch (err) {
      console.error("Failed to fetch scorecards:", err);
    } finally {
      setFetchLoading(false);
    }
  }, [selectedYear, selectedTerm, selectedWeek]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSchools();
      fetchDepartments();
      fetchScorecards();
    }
  }, [status, fetchSchools, fetchDepartments, fetchScorecards]);

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;

    try {
      const response = await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSchoolName.trim() }),
      });

      if (response.ok) {
        setNewSchoolName("");
        await fetchSchools();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add school");
      }
    } catch (err) {
      alert("Failed to add school");
    }
  };

  const handleDeleteSchool = async (id: string) => {
    if (!confirm("Delete this school? This cannot be undone.")) return;

    try {
      const response = await fetch("/api/schools", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        await fetchSchools();
      } else {
        alert("Failed to delete school");
      }
    } catch (err) {
      alert("Failed to delete school");
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartmentName.trim()) return;

    try {
      const response = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDepartmentName.trim() }),
      });

      if (response.ok) {
        setNewDepartmentName("");
        await fetchDepartments();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add department");
      }
    } catch (err) {
      alert("Failed to add department");
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm("Delete this department? This cannot be undone.")) return;

    try {
      const response = await fetch("/api/departments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        await fetchDepartments();
      } else {
        alert("Failed to delete department");
      }
    } catch (err) {
      alert("Failed to delete department");
    }
  };

  const handleAddScorecard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const school = schools.find(s => s.id === selectedSchoolId);
      if (!school) {
        throw new Error("Please select a school");
      }

      // Convert to API format (uses school name and percent fields)
      const payload = {
        school: school.name,
        week: selectedWeek,
        year: selectedYear,
        term: selectedTerm,
        academicPercent: scores.academicScore,
        financePercent: scores.financeScore,
        qualityPercent: scores.qualityScore,
        tdpPercent: scores.technologyScore,
        theologyPercent: scores.theologyScore,
      };

      const url = editingScorecardId 
        ? `/api/scorecard?id=${editingScorecardId}`
        : "/api/scorecard";
      const method = editingScorecardId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save scorecard");
      }

      setSuccess(true);
      setSelectedSchoolId("");
      setEditingScorecardId(null);
      setScores({
        academicScore: 50,
        financeScore: 50,
        qualityScore: 50,
        technologyScore: 50,
        theologyScore: 50,
      });

      setTimeout(() => setSuccess(false), 3000);
      await fetchScorecards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save scorecard");
    } finally {
      setLoading(false);
    }
  };

  const handleEditScorecard = (scorecard: WeeklyScorecard) => {
    const school = schools.find(s => s.name === scorecard.schoolName);
    if (school) {
      setSelectedSchoolId(school.id);
    }
    setSelectedYear(scorecard.year);
    setSelectedTerm(scorecard.term);
    setSelectedWeek(scorecard.week);
    setScores({
      academicScore: scorecard.academicScore,
      financeScore: scorecard.financeScore,
      qualityScore: scorecard.qualityScore,
      technologyScore: scorecard.technologyScore,
      theologyScore: scorecard.theologyScore,
    });
    setEditingScorecardId(scorecard.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingScorecardId(null);
    setSelectedSchoolId("");
    setScores({
      academicScore: 50,
      financeScore: 50,
      qualityScore: 50,
      technologyScore: 50,
      theologyScore: 50,
    });
  };

  const handleDeleteScorecard = async (scorecardId: string) => {
    if (!confirm("Delete this scorecard? This cannot be undone.")) return;

    try {
      const response = await fetch(`/api/scorecard?id=${scorecardId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchScorecards();
      } else {
        alert("Failed to delete scorecard");
      }
    } catch (err) {
      alert("Failed to delete scorecard");
    }
  };

  const toggleSchoolSelection = (schoolName: string) => {
    const newSelected = new Set(selectedSchools);
    if (newSelected.has(schoolName)) {
      newSelected.delete(schoolName);
    } else {
      newSelected.add(schoolName);
    }
    setSelectedSchools(newSelected);
  };

  const handleDeleteSelectedSchools = async () => {
    if (selectedSchools.size === 0) {
      alert("Please select schools to delete");
      return;
    }

    if (!confirm(`Delete data for ${selectedSchools.size} school(s)? This cannot be undone.`)) {
      return;
    }

    try {
      for (const schoolName of selectedSchools) {
        const schoolScorecards = scorecards.filter(sc => sc.schoolName === schoolName);
        for (const sc of schoolScorecards) {
          await fetch(`/api/scorecard?id=${sc.id}`, {
            method: "DELETE",
          });
        }
      }
      setSelectedSchools(new Set());
      await fetchScorecards();
    } catch (err) {
      alert("Failed to delete selected schools");
    }
  };

  const downloadTableAsExcel = () => {
    if (rankedTableData.length === 0) {
      alert("No data to download");
      return;
    }

    const heading = `Score Card Table - Term ${selectedTerm}, Week ${selectedWeek} (${selectedYear})`;
    
    // Create headers
    const headers = ['SCH', 'ACADEMIC', 'QUALITY', 'FINANCE', 'THEOLOGY', 'TDP', `OVERALL TERM ${selectedTerm}, ${selectedYear}`, 'ACTIONS'];
    const subHeaders = ['', 'SCORE', 'RANK', 'SCORE', 'RANK', 'SCORE', 'RANK', 'SCORE', 'RANK', 'SCORE', 'RANK', 'SCORE', 'TREND', ''];
    
    // Prepare data rows
    const dataRows = rankedTableData.map(item => {
      const progress = progressIndicators.get(item.schoolName);
      let trendCell = '';
      if (progress && progress.direction !== 'none') {
        const arrow = progress.direction === 'up' ? '↑' : '↓';
        const sign = progress.percentChange > 0 ? '+' : '';
        trendCell = `${arrow} ${sign}${progress.percentChange.toFixed(1)}%`;
      }
      
      return [
        item.schoolName,
        formatScore(item.academicScore),
        item.academicScore > 0 ? item.academicRank : '-',
        formatScore(item.qualityScore),
        item.qualityScore > 0 ? item.qualityRank : '-',
        formatScore(item.financeScore),
        item.financeScore > 0 ? item.financeRank : '-',
        formatScore(item.theologyScore),
        item.theologyScore > 0 ? item.theologyRank : '-',
        formatScore(item.technologyScore),
        item.technologyScore > 0 ? item.tdpRank : '-',
        formatScore(item.totalScore),
        item.totalScore > 0 ? item.overallRank : '-',
        trendCell,
      ];
    });

    // Add average row
    const avgRow = [
      'AVG',
      formatAverage(averages.academic),
      '',
      formatAverage(averages.quality),
      '',
      formatAverage(averages.finance),
      '',
      formatAverage(averages.theology),
      '',
      formatAverage(averages.tdp),
      '',
      formatAverage(averages.overall),
      '',
      '',
    ];

    // Combine: heading, blank row, headers, subheaders, data rows, average row
    const allData = [
      [heading],
      [], // blank row
      headers,
      subHeaders,
      ...dataRows,
      avgRow,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(allData);
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scorecards");
    
    worksheet["!cols"] = [
      { wch: 15 }, // SCH
      { wch: 10 }, // ACADEMIC SCORE
      { wch: 8 },  // ACADEMIC RANK
      { wch: 10 }, // QUALITY SCORE
      { wch: 8 },  // QUALITY RANK
      { wch: 10 }, // FINANCE SCORE
      { wch: 8 },  // FINANCE RANK
      { wch: 10 }, // THEOLOGY SCORE
      { wch: 8 },  // THEOLOGY RANK
      { wch: 10 }, // TDP SCORE
      { wch: 8 },  // TDP RANK
      { wch: 10 }, // OVERALL SCORE
      { wch: 8 },  // TREND
      { wch: 8 },  // ACTIONS
    ];

    XLSX.writeFile(workbook, `Scorecard_Report_Term${selectedTerm}_Week${selectedWeek}_${selectedYear}.xlsx`);
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportStatus(null);
    setError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (const row of jsonData) {
        try {
          // Map Excel columns to scorecard fields
          const schoolName = row.SCH || row.School || row.SCHOOL || row.school;
          
          // Parse values and check if they're in decimal format (0.247) vs percentage (24.7)
          // Excel stores percentages as decimals, so if value < 1 and we expect 0-100, multiply by 100
          const parsePercentage = (val: any): number => {
            const num = parseFloat(val || 0);
            // If less than 1 and not 0, assume it's from Excel percentage format (0.247 = 24.7%)
            return (num > 0 && num < 1) ? num * 100 : num;
          };
          
          const academic = parsePercentage(row.ACADEMIC || row.Academic || row.academic || 0);
          const quality = parsePercentage(row.QUALITY || row.Quality || row.quality || 0);
          const finance = parsePercentage(row.FINANCE || row.Finance || row.finance || 0);
          const theology = parsePercentage(row.THEOLOGY || row.Theology || row.theology || 0);
          const tdp = parsePercentage(row.TDP || row.Tdp || row.tdp || 0);

          // Period can come from Excel or UI dropdowns
          const importYear = row.YEAR ? parseInt(row.YEAR) : selectedYear;
          const importTerm = row.TERM ? parseInt(row.TERM) : selectedTerm;
          const importWeek = row.WEEK ? parseInt(row.WEEK) : selectedWeek;

          if (!schoolName) {
            errors.push(`Row skipped: Missing school name`);
            failedCount++;
            continue;
          }

          const payload = {
            school: schoolName,
            week: importWeek,
            year: importYear,
            term: importTerm,
            academicPercent: academic,
            financePercent: finance,
            qualityPercent: quality,
            tdpPercent: tdp,
            theologyPercent: theology,
          };

          const response = await fetch("/api/scorecard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            successCount++;
          } else {
            const error = await response.json();
            errors.push(`${schoolName}: ${error.error || 'Failed to import'}`);
            failedCount++;
          }
        } catch (err) {
          errors.push(`Row error: ${err instanceof Error ? err.message : 'Unknown error'}`);
          failedCount++;
        }
      }

      setImportStatus({ success: successCount, failed: failedCount, errors });
      await fetchScorecards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import Excel file");
    } finally {
      setImporting(false);
      e.target.value = ''; // Reset file input
    }
  };

  const tableData: ScorecardWithTrend[] = useMemo(() => {
    const data = scorecards.map(sc => {
      // Only count non-zero scores (assessed departments)
      const scores = [
        sc.academicScore,
        sc.financeScore,
        sc.qualityScore,
        sc.technologyScore,
        sc.theologyScore,
      ].filter(score => score > 0);

      const total = scores.reduce((sum, score) => sum + score, 0);
      const average = scores.length > 0 ? total / scores.length : 0;
      const assessedCount = scores.length;

      return {
        ...sc,
        totalScore: total,
        averageScore: average,
        assessedCount, // Track how many departments were assessed
      };
    });

    return data;
  }, [scorecards, allScorecards, selectedYear, selectedTerm, selectedWeek]);

  // Calculate ranks for each category (excluding zero/unassessed scores)
  const rankedTableData = useMemo(() => {
    const getRank = (schools: typeof tableData, getScore: (sc: typeof tableData[0]) => number) => {
      // Filter out schools with zero scores (unassessed)
      const assessed = schools.filter(sc => getScore(sc) > 0);
      const sorted = [...assessed].sort((a, b) => getScore(b) - getScore(a));
      const ranks = new Map();
      sorted.forEach((sc, idx) => {
        ranks.set(sc.schoolName, idx + 1);
      });
      return ranks;
    };

    const academicRanks = getRank(tableData, sc => sc.academicScore);
    const financeRanks = getRank(tableData, sc => sc.financeScore);
    const qualityRanks = getRank(tableData, sc => sc.qualityScore);
    const tdpRanks = getRank(tableData, sc => sc.technologyScore);
    const theologyRanks = getRank(tableData, sc => sc.theologyScore);
    const overallRanks = getRank(tableData, sc => sc.totalScore);

    const withRanks = tableData.map(sc => ({
      ...sc,
      academicRank: academicRanks.get(sc.schoolName) || null,
      financeRank: financeRanks.get(sc.schoolName) || null,
      qualityRank: qualityRanks.get(sc.schoolName) || null,
      tdpRank: tdpRanks.get(sc.schoolName) || null,
      theologyRank: theologyRanks.get(sc.schoolName) || null,
      overallRank: overallRanks.get(sc.schoolName) || null,
    }));

    // Sort by overall rank (ascending - 1 is best)
    return withRanks.sort((a, b) => {
      const rankA = a.overallRank || 9999;
      const rankB = b.overallRank || 9999;
      return rankA - rankB;
    });
  }, [tableData]);

  // Calculate averages for footer (only count non-zero/assessed scores)
  const averages = useMemo(() => {
    if (rankedTableData.length === 0) {
      return {
        academic: 0,
        finance: 0,
        quality: 0,
        tdp: 0,
        theology: 0,
        overall: 0,
      };
    }

    const calculateAvg = (getScore: (sc: typeof rankedTableData[0]) => number) => {
      const scores = rankedTableData
        .map(getScore)
        .filter(score => score > 0);
      return scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
    };

    return {
      academic: calculateAvg(sc => sc.academicScore),
      finance: calculateAvg(sc => sc.financeScore),
      quality: calculateAvg(sc => sc.qualityScore),
      tdp: calculateAvg(sc => sc.technologyScore),
      theology: calculateAvg(sc => sc.theologyScore),
      overall: calculateAvg(sc => sc.totalScore),
    };
  }, [rankedTableData]);

  // Calculate progress/decline compared to previous week
  const progressIndicators = useMemo(() => {
    const indicators = new Map<string, { difference: number, percentChange: number, direction: 'up' | 'down' | 'none' }>();
    
    rankedTableData.forEach(current => {
      // Find the same school's score from previous week
      const previousWeek = allScorecards.find(
        sc => sc.schoolName === current.schoolName && 
             sc.year === selectedYear && 
             sc.term === selectedTerm && 
             sc.week === selectedWeek - 1
      );

      if (previousWeek) {
        const prevTotal = (previousWeek.academicScore || 0) +
                         (previousWeek.financeScore || 0) +
                         (previousWeek.qualityScore || 0) +
                         (previousWeek.technologyScore || 0) +
                         (previousWeek.theologyScore || 0);
        
        const diff = current.totalScore - prevTotal;
        const percentChange = prevTotal > 0 ? (diff / prevTotal) * 100 : 0;
        const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'none';
        
        indicators.set(current.schoolName, { difference: diff, percentChange, direction });
      }
    });

    return indicators;
  }, [rankedTableData, allScorecards, selectedYear, selectedTerm, selectedWeek]);

  if (status === "loading" || fetchLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">School Scorecard</h1>
          <div className="flex gap-2">
            <label className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
              <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
              {importing ? 'Importing...' : 'Import Excel'}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelImport}
                disabled={importing}
                className="hidden"
              />
            </label>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              title="Download Excel template with sample data"
            >
              <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
              Download Template
            </button>
            {selectedSchools.size > 0 && (
              <button
                onClick={handleDeleteSelectedSchools}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                title={`Delete data for ${selectedSchools.size} selected school(s)`}
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete Selected ({selectedSchools.size})
              </button>
            )}
            <button
              onClick={() => setShowSchoolManager(!showSchoolManager)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BuildingOfficeIcon className="w-4 h-4 mr-2" />
              Manage Schools
            </button>
            <button
              onClick={() => setShowDepartmentManager(!showDepartmentManager)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <AcademicCapIcon className="w-4 h-4 mr-2" />
              Manage Departments
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
            <span className="mr-2">✓</span> Scorecard saved successfully!
          </div>
        )}

        {importStatus && (
          <div className={`border px-4 py-3 rounded-lg ${
            importStatus.failed === 0 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : importStatus.success === 0 
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <p className="font-semibold mb-2">
              Import Complete: {importStatus.success} succeeded, {importStatus.failed} failed
            </p>
            {importStatus.errors.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto">
                <p className="text-sm font-semibold mb-1">Errors:</p>
                <ul className="text-sm space-y-1">
                  {importStatus.errors.slice(0, 10).map((err, idx) => (
                    <li key={idx}>• {err}</li>
                  ))}
                  {importStatus.errors.length > 10 && (
                    <li className="font-semibold">... and {importStatus.errors.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Score Entry Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">{editingScorecardId ? 'Edit Scorecard' : 'Add Scorecard'}</h2>
            {editingScorecardId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>
          
          <form onSubmit={handleAddScorecard} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Term</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(Number(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[1, 2, 3].map(t => (
                    <option key={t} value={t}>Term {t}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Week</label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({length: 13}, (_, i) => i + 1).map(w => (
                    <option key={w} value={w}>Week {w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">School</label>
                <select
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select School</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { key: 'academicScore', label: 'Academic', color: 'blue' },
                { key: 'financeScore', label: 'Finance', color: 'green' },
                { key: 'qualityScore', label: 'Quality', color: 'purple' },
                { key: 'technologyScore', label: 'TDP', color: 'indigo' },
                { key: 'theologyScore', label: 'Theology', color: 'pink' },
              ].map(({ key, label, color }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">{label}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={scores[key as keyof typeof scores]}
                    onChange={(e) => setScores(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div
                      className={`bg-${color}-600 h-2 rounded-full transition-all`}
                      style={{ width: `${scores[key as keyof typeof scores]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? "Saving..." : editingScorecardId ? "Update Scorecard" : "Save Scorecard"}
            </button>
          </form>
        </div>

        {/* Ranked Score Card Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-xl font-bold text-white">Score Card Table - Term {selectedTerm}, Week {selectedWeek} ({selectedYear})</h2>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={downloadTableAsExcel}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                title="Download current table as Excel"
              >
                <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                Download Table
              </button>
              {selectionMode && (
                <button
                  onClick={() => {
                    setSelectionMode(false);
                    setSelectedSchools(new Set());
                  }}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Done Selecting
                </button>
              )}
              {!selectionMode && (
                <button
                  onClick={() => setSelectionMode(true)}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Select for Deletion
                </button>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  {selectionMode && <th className="px-2 py-2 text-center font-semibold text-gray-700 w-8">☐</th>}
                  <th className="px-2 py-2 text-left font-semibold text-gray-700">SCH</th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-700 border-l border-gray-300" colSpan={2}>ACADEMIC</th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-700 border-l border-gray-300" colSpan={2}>QUALITY</th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-700 border-l border-gray-300" colSpan={2}>FINANCE</th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-700 border-l border-gray-300" colSpan={2}>THEOLOGY</th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-700 border-l border-gray-300" colSpan={2}>TDP</th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-700 border-l border-gray-300" colSpan={2}>OVERALL TERM {selectedTerm}, {selectedYear}</th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-700 border-l border-gray-300">ACTIONS</th>
                </tr>
                <tr>
                  {selectionMode && <th className="px-2 py-1"></th>}
                  <th className="px-2 py-1"></th>
                  <th className="px-2 py-1 text-center font-semibold text-gray-600">SCORE</th>
                  <th className="px-2 py-1 text-center font-semibold text-gray-600">RANK</th>
                  <th className="px-2 py-1 text-center font-semibold text-gray-600 border-l border-gray-300">SCORE</th>
                  <th className="px-2 py-1 text-center font-semibold text-gray-600">RANK</th>
                  <th className="px-2 py-1 text-center font-semibold text-gray-600 border-l border-gray-300">SCORE</th>
                  <th className="px-2 py-1 text-center font-semibold text-gray-600">RANK</th>
                  <th className="px-2 py-1 text-center font-semibold text-gray-600 border-l border-gray-300">SCORE</th>
                  <th className="px-2 py-1 text-center font-semibold text-gray-600">RANK</th>
                  <th className="px-2 py-1 text-center font-semibold text-gray-600 border-l border-gray-300">SCORE</th>
                  <th className="px-2 py-1 text-center font-semibold text-gray-600">RANK</th>
                  <th className="px-2 py-1 text-center font-semibold text-gray-600 border-l border-gray-300">SCORE</th>
                  <th className="px-2 py-1 text-center font-semibold text-gray-600">TREND</th>
                  <th className="px-2 py-1 text-center font-semibold text-gray-600 border-l border-gray-300"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rankedTableData.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                      No scorecards for this period. Add one above to get started!
                    </td>
                  </tr>
                ) : (
                  rankedTableData.map((item) => {
                    const progress = progressIndicators.get(item.schoolName);
                    const isSelected = selectedSchools.has(item.schoolName);
                    
                    return (
                      <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isSelected && selectionMode ? 'bg-blue-100' : ''}`}>
                        {selectionMode && (
                          <td className="px-2 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSchoolSelection(item.schoolName)}
                              className="w-4 h-4 cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="px-2 py-2 font-semibold text-gray-900">{item.schoolName}</td>
                        <td className="px-2 py-2 text-center text-gray-700">{formatScore(item.academicScore)}</td>
                        <td className="px-2 py-2 text-center font-semibold text-gray-700 bg-blue-50">{item.academicScore > 0 ? item.academicRank : '-'}</td>
                        <td className="px-2 py-2 text-center text-gray-700 border-l border-gray-300">{formatScore(item.qualityScore)}</td>
                        <td className="px-2 py-2 text-center font-semibold text-gray-700 bg-blue-50">{item.qualityScore > 0 ? item.qualityRank : '-'}</td>
                        <td className="px-2 py-2 text-center text-gray-700 border-l border-gray-300">{formatScore(item.financeScore)}</td>
                        <td className="px-2 py-2 text-center font-semibold text-gray-700 bg-blue-50">{item.financeScore > 0 ? item.financeRank : '-'}</td>
                        <td className="px-2 py-2 text-center text-gray-700 border-l border-gray-300">{formatScore(item.theologyScore)}</td>
                        <td className="px-2 py-2 text-center font-semibold text-gray-700 bg-blue-50">{item.theologyScore > 0 ? item.theologyRank : '-'}</td>
                        <td className="px-2 py-2 text-center text-gray-700 border-l border-gray-300">{formatScore(item.technologyScore)}</td>
                        <td className="px-2 py-2 text-center font-semibold text-gray-700 bg-blue-50">{item.technologyScore > 0 ? item.tdpRank : '-'}</td>
                        <td className="px-2 py-2 text-center text-gray-700 border-l border-gray-300 font-bold">{formatScore(item.totalScore)}</td>
                        <td className="px-2 py-2 text-center font-semibold text-gray-700 bg-blue-50">
                          <div className="flex flex-col items-center justify-center">
                            <span>{item.totalScore > 0 ? item.overallRank : '-'}</span>
                            {progress && progress.direction !== 'none' && (
                              <div className="flex flex-col items-center mt-1">
                                <span className={
                                  progress.direction === 'up' ? 'text-green-600 font-bold text-lg' :
                                  'text-red-600 font-bold text-lg'
                                }>
                                  {progress.direction === 'up' ? '↑' : '↓'}
                                </span>
                                <span className="text-xs text-gray-600">
                                  {progress.percentChange > 0 ? '+' : ''}{progress.percentChange.toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center border-l border-gray-300">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEditScorecard(item)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <PencilSquareIcon className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteScorecard(item.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                {rankedTableData.length > 0 && (
                  <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                    {selectionMode && <td className="px-2 py-2"></td>}
                    <td className="px-2 py-2 text-gray-900">AVG</td>
                    <td className="px-2 py-2 text-center text-gray-700">{formatAverage(averages.academic)}</td>
                    <td className="px-2 py-2 text-center bg-blue-100"></td>
                    <td className="px-2 py-2 text-center text-gray-700 border-l border-gray-300">{formatAverage(averages.quality)}</td>
                    <td className="px-2 py-2 text-center bg-blue-100"></td>
                    <td className="px-2 py-2 text-center text-gray-700 border-l border-gray-300">{formatAverage(averages.finance)}</td>
                    <td className="px-2 py-2 text-center bg-blue-100"></td>
                    <td className="px-2 py-2 text-center text-gray-700 border-l border-gray-300">{formatAverage(averages.theology)}</td>
                    <td className="px-2 py-2 text-center bg-blue-100"></td>
                    <td className="px-2 py-2 text-center text-gray-700 border-l border-gray-300">{formatAverage(averages.tdp)}</td>
                    <td className="px-2 py-2 text-center bg-blue-100"></td>
                    <td className="px-2 py-2 text-center text-gray-700 border-l border-gray-300">{formatAverage(averages.overall)}</td>
                    <td className="px-2 py-2 text-center bg-blue-100"></td>
                    <td className="px-2 py-2 border-l border-gray-300"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* School Management Modal */}
        {showSchoolManager && (
          <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-blue-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">School Management</h2>
            <form onSubmit={handleAddSchool} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  placeholder="Enter school name"
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add School
                </button>
              </div>
            </form>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {schools.map((school) => (
                <div
                  key={school.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="text-sm font-medium text-gray-900">{school.name}</span>
                  <button
                    onClick={() => handleDeleteSchool(school.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Department Management Modal */}
        {showDepartmentManager && (
          <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-purple-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Department Management</h2>
            <form onSubmit={handleAddDepartment} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  placeholder="Enter department name"
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Department
                </button>
              </div>
            </form>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="text-sm font-medium text-gray-900">{dept.name}</span>
                  <button
                    onClick={() => handleDeleteDepartment(dept.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
