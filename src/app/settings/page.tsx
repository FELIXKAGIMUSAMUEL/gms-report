"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { CalendarIcon, CheckCircleIcon, XCircleIcon, BuildingOfficeIcon, AcademicCapIcon, PlusIcon, TrashIcon, CircleStackIcon, ArrowUpTrayIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

interface TermSetting {
	id?: string;
	term: number;
	year: number;
	startDate: string;
	endDate: string;
	weeksCount: number;
}

interface School {
	id: string;
	name: string;
}

interface Department {
	id: string;
	name: string;
}

export default function SettingsPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [termSettings, setTermSettings] = useState<TermSetting[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
	
	// Schools & Departments
	const [schools, setSchools] = useState<School[]>([]);
	const [departments, setDepartments] = useState<Department[]>([]);
	const [newSchoolName, setNewSchoolName] = useState("");
	const [newDepartmentName, setNewDepartmentName] = useState("");
	const [activeTab, setActiveTab] = useState<"terms" | "schools" | "system">("terms");

	// System tab state
	const [backingUp, setBackingUp] = useState(false);
	const [backupResult, setBackupResult] = useState<{ ok?: boolean; message?: string; error?: string } | null>(null);
	const [sqlFile, setSqlFile] = useState<File | null>(null);
	const [sqlRunning, setSqlRunning] = useState(false);
	const [sqlResult, setSqlResult] = useState<{ ok?: boolean; output?: string; error?: string } | null>(null);
	const [updating, setUpdating] = useState(false);
	const [updateResult, setUpdateResult] = useState<{ ok?: boolean; output?: string; error?: string } | null>(null);
	// GitHub state
	const [githubRepoUrl, setGithubRepoUrl] = useState("");
	const [githubToken, setGithubToken] = useState("");
	const [githubBranch, setGithubBranch] = useState("main");
	const [githubConfigured, setGithubConfigured] = useState(false);
	const [savingGithub, setSavingGithub] = useState(false);
	const [checkingUpdates, setCheckingUpdates] = useState(false);
	const [applyingUpdate, setApplyingUpdate] = useState(false);
	const [githubCheckResult, setGithubCheckResult] = useState<{ ok?: boolean; hasUpdates?: boolean; commits?: string; localStatus?: string; branch?: string; error?: string } | null>(null);
	const [githubApplyResult, setGithubApplyResult] = useState<{ ok?: boolean; output?: string; error?: string; partialOutput?: string } | null>(null);

	// Initialize with current year and 3 terms
	const currentYear = new Date().getFullYear();
	const [selectedYear, setSelectedYear] = useState(currentYear);
	const [editingSettings, setEditingSettings] = useState<TermSetting[]>([
		{ term: 1, year: currentYear, startDate: "", endDate: "", weeksCount: 13 },
		{ term: 2, year: currentYear, startDate: "", endDate: "", weeksCount: 13 },
		{ term: 3, year: currentYear, startDate: "", endDate: "", weeksCount: 13 },
	]);

	// Get list of available years
	const availableYears = Array.from(
		new Set([...termSettings.map((s) => s.year), currentYear, currentYear + 1])
	).sort((a, b) => b - a);

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
		} else if (session?.user?.role !== "GM") {
			router.push("/dashboard");
		}
	}, [status, session, router]);

	useEffect(() => {
		fetchTermSettings();
		fetchSchools();
		fetchDepartments();
		// Load GitHub config
		fetch("/api/admin/github-update").then(r => r.ok ? r.json() : null).then(d => {
			if (d) { setGithubRepoUrl(d.repoUrl || ""); setGithubBranch(d.branch || "main"); setGithubConfigured(d.configured); }
		}).catch(() => {});
	}, []);

	const fetchTermSettings = async () => {
		try {
			const response = await fetch("/api/settings/term");
			if (response.ok) {
				const data = await response.json();
				if (data.termSettings && data.termSettings.length > 0) {
					setTermSettings(data.termSettings);
					setEditingSettings(
						data.termSettings.map((ts: TermSetting) => ({
							...ts,
							startDate: ts.startDate.split("T")[0],
							endDate: ts.endDate.split("T")[0],
						}))
					);
				}
			}
		} catch (error) {
			console.error("Error fetching term settings:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (index: number, field: keyof TermSetting, value: string | number) => {
		const updated = [...editingSettings];
		updated[index] = { ...updated[index], [field]: value };
		setEditingSettings(updated);
	};

	const handleSaveTerm = async (termIndex: number) => {
		// Only validate and save the selected term
		const setting = editingSettings[termIndex];

		// If both dates are empty, skip saving this term
		if (!setting.startDate && !setting.endDate) {
			setMessage({ type: "error", text: `Please fill in dates for Term ${setting.term}` });
			return;
		}

		// If only one date is filled, show error
		if (!setting.startDate || !setting.endDate) {
			setMessage({ type: "error", text: `Both start and end dates are required for Term ${setting.term}` });
			return;
		}

		if (new Date(setting.startDate) >= new Date(setting.endDate)) {
			setMessage({ type: "error", text: `Term ${setting.term}: Start date must be before end date` });
			return;
		}

		setSaving(true);
		setMessage(null);

		try {
			const response = await fetch("/api/settings/term", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ termSettings: [setting] }),
			});

			if (response.ok) {
				setMessage({ type: "success", text: `Term ${setting.term} settings saved successfully!` });
				fetchTermSettings();
			} else {
				const error = await response.json();
				setMessage({ type: "error", text: error.error || "Failed to save settings" });
			}
		} catch (error) {
			console.error("Error saving term settings:", error);
			setMessage({ type: "error", text: "An error occurred while saving" });
		} finally {
			setSaving(false);
		}
	};

	const handleSave = async () => {
		// Validate and save only filled terms
		const filledSettings = editingSettings.filter((s) => s.startDate && s.endDate);

		if (filledSettings.length === 0) {
			setMessage({ type: "error", text: "Please fill in dates for at least one term" });
			return;
		}

		// Validate each filled term
		for (const setting of filledSettings) {
			if (new Date(setting.startDate) >= new Date(setting.endDate)) {
				setMessage({ type: "error", text: `Term ${setting.term}: Start date must be before end date` });
				return;
			}
		}

		setSaving(true);
		setMessage(null);

		try {
			const response = await fetch("/api/settings/term", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ termSettings: filledSettings }),
			});

			if (response.ok) {
				setMessage({ type: "success", text: "Term settings saved successfully!" });
				fetchTermSettings();
			} else {
				const error = await response.json();
				setMessage({ type: "error", text: error.error || "Failed to save settings" });
			}
		} catch (error) {
			console.error("Error saving term settings:", error);
			setMessage({ type: "error", text: "An error occurred while saving" });
		} finally {
			setSaving(false);
		}
	};

	const handleYearChange = (year: number) => {
		setSelectedYear(year);
		// Load or initialize settings for selected year
		const yearSettings = editingSettings.filter((s) => s.year === year);
		if (yearSettings.length === 0) {
			// Initialize new year with empty terms
			const newTerms = [
				{ term: 1, year, startDate: "", endDate: "", weeksCount: 13 },
				{ term: 2, year, startDate: "", endDate: "", weeksCount: 13 },
				{ term: 3, year, startDate: "", endDate: "", weeksCount: 13 },
			];
			setEditingSettings([...editingSettings, ...newTerms]);
		}
	};

	const fetchSchools = async () => {
		try {
			const response = await fetch("/api/schools");
			if (response.ok) {
				const data = await response.json();
				setSchools(data.data || []);
			}
		} catch (error) {
			console.error("Error fetching schools:", error);
		}
	};

	const fetchDepartments = async () => {
		try {
			const response = await fetch("/api/departments");
			if (response.ok) {
				const data = await response.json();
				setDepartments(data.data || []);
			}
		} catch (error) {
			console.error("Error fetching departments:", error);
		}
	};

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
				setMessage({ type: "success", text: "School added successfully" });
				setTimeout(() => setMessage(null), 3000);
			} else {
				const error = await response.json();
				setMessage({ type: "error", text: error.error || "Failed to add school" });
			}
		} catch (err) {
			setMessage({ type: "error", text: "Failed to add school" });
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
				setMessage({ type: "success", text: "School deleted successfully" });
				setTimeout(() => setMessage(null), 3000);
			} else {
				setMessage({ type: "error", text: "Failed to delete school" });
			}
		} catch (err) {
			setMessage({ type: "error", text: "Failed to delete school" });
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
				setMessage({ type: "success", text: "Department added successfully" });
				setTimeout(() => setMessage(null), 3000);
			} else {
				const error = await response.json();
				setMessage({ type: "error", text: error.error || "Failed to add department" });
			}
		} catch (err) {
			setMessage({ type: "error", text: "Failed to add department" });
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
				setMessage({ type: "success", text: "Department deleted successfully" });
				setTimeout(() => setMessage(null), 3000);
			} else {
				setMessage({ type: "error", text: "Failed to delete department" });
			}
		} catch (err) {
			setMessage({ type: "error", text: "Failed to delete department" });
		}
	};

	if (status === "loading" || loading) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-xl text-gray-600">Loading...</div>
				</div>
			</DashboardLayout>
		);
	}

	if (session?.user?.role !== "GM") {
		return null;
	}

	// Get settings for selected year only
	const selectedYearSettings = editingSettings
		.filter((s) => s.year === selectedYear)
		.sort((a, b) => a.term - b.term);

	return (
		<DashboardLayout>
			<div className="max-w-6xl mx-auto py-8 px-4">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
					<p className="text-gray-600">
						Configure system settings, manage schools, departments, and academic terms.
					</p>
				</div>

				{/* Tabs */}
				<div className="mb-6 border-b border-gray-200">
					<nav className="flex gap-8">
						<button
							onClick={() => setActiveTab("terms")}
							className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
								activeTab === "terms"
									? "border-blue-600 text-blue-600"
									: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
							}`}
						>
							<div className="flex items-center gap-2">
								<CalendarIcon className="w-5 h-5" />
								Term Settings
							</div>
						</button>
						<button
							onClick={() => setActiveTab("schools")}
							className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
								activeTab === "schools"
									? "border-blue-600 text-blue-600"
									: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
							}`}
						>
							<div className="flex items-center gap-2">
								<BuildingOfficeIcon className="w-5 h-5" />
								Schools & Departments
							</div>
						</button>
						<button
							onClick={() => setActiveTab("system")}
							className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
								activeTab === "system"
									? "border-red-600 text-red-600"
									: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
							}`}
						>
							<div className="flex items-center gap-2">
								<CircleStackIcon className="w-5 h-5" />
								System
							</div>
						</button>
					</nav>
				</div>

				{message && (
					<div
						className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
							message.type === "success"
								? "bg-green-50 border border-green-200 text-green-800"
								: "bg-red-50 border border-red-200 text-red-800"
						}`}
					>
						{message.type === "success" ? (
							<CheckCircleIcon className="w-6 h-6 flex-shrink-0" />
						) : (
							<XCircleIcon className="w-6 h-6 flex-shrink-0" />
						)}
						<span>{message.text}</span>
					</div>
				)}

				{/* Term Settings Tab */}
				{activeTab === "terms" && (
				<div>
					<div className="mb-6">
						<h2 className="text-xl font-bold text-gray-900 mb-2">Academic Term Configuration</h2>
						<p className="text-sm text-gray-600">
							Configure the start and end dates for each academic term. This helps the system track weekly
							report deadlines and send timely reminders.
						</p>
					</div>

				{/* Year Selector */}
				<div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<label className="block text-sm font-semibold text-gray-700 mb-3">Select Academic Year</label>
					<select
						value={selectedYear}
						onChange={(e) => handleYearChange(Number(e.target.value))}
						style={{ color: "#111827", backgroundColor: "#ffffff", borderColor: "#374151" }} className="w-full md:w-48 px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-base"
					>
						{availableYears.map((year) => (
							<option key={year} value={year}>
								Academic Year {year}
							</option>
						))}
					</select>
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<h2 className="text-2xl font-semibold text-gray-900 mb-6">Academic Year {selectedYear}</h2>

					<div className="space-y-6">
						{selectedYearSettings.map((setting, index) => {
							const globalIndex = editingSettings.findIndex(
								(s) => s.term === setting.term && s.year === setting.year
							);

							return (
								<div
									key={`${setting.year}-${setting.term}`}
									className="bg-white rounded-lg p-5 border-2 border-blue-100"
								>
									<h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
										<CalendarIcon className="w-5 h-5 text-blue-600" />
										Term {setting.term}
									</h3>

									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div>
											<label className="block text-sm font-semibold text-gray-800 mb-2">
												Start Date (Week 1)
											</label>
											<input
												type="date"
												value={setting.startDate}
												onChange={(e) =>
													handleInputChange(globalIndex, "startDate", e.target.value)
												}
												style={{ color: "#111827", backgroundColor: "#ffffff", borderColor: "#374151" }}
												className="w-full px-3 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-base"
											/>
										</div>

										<div>
											<label className="block text-sm font-semibold text-gray-800 mb-2">
												End Date
											</label>
											<input
												type="date"
												value={setting.endDate}
												onChange={(e) =>
													handleInputChange(globalIndex, "endDate", e.target.value)
												}
												style={{ color: "#111827", backgroundColor: "#ffffff", borderColor: "#374151" }}
												className="w-full px-3 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-base"
											/>
										</div>

										<div>
											<label className="block text-sm font-semibold text-gray-800 mb-2">
												Number of Weeks
											</label>
											<input
												type="number"
												min="1"
												max="20"
												value={setting.weeksCount}
												onChange={(e) =>
													handleInputChange(
														globalIndex,
														"weeksCount",
														parseInt(e.target.value) || 13
													)
												}
												style={{ color: "#111827", backgroundColor: "#ffffff", borderColor: "#374151" }}
												className="w-full px-3 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-base"
											/>
										</div>
									</div>

									{setting.startDate && setting.endDate && (
										<div className="mt-3 text-sm text-gray-600">
											Term duration:{" "}
											{Math.ceil(
												(new Date(setting.endDate).getTime() -
													new Date(setting.startDate).getTime()) /
													(1000 * 60 * 60 * 24 * 7)
											)}{" "}
											weeks
										</div>
									)}

									{(setting.startDate || setting.endDate) && (
										<div className="mt-4 flex gap-2">
											<button
												onClick={() => handleSaveTerm(globalIndex)}
												disabled={saving}
												className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
											>
												{saving ? "Saving..." : "Save This Term"}
											</button>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>

				<div className="mt-8 flex gap-4">
					<button
						onClick={handleSave}
						disabled={saving}
						className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{saving ? "Saving..." : "Save All Filled Terms"}
					</button>
				</div>

				<div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
					<h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
					<ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
						<li>Set the start date for Week 1 of each term</li>
						<li>The system will automatically calculate deadlines for all weeks in the term</li>
						<li>You&apos;ll receive alerts if weekly reports are not submitted by Sunday of each week</li>
						<li>Statistics and trends will be accurately tracked based on these dates</li>
					</ul>
				</div>
				</div>
				)}

				{/* Schools & Departments Tab */}
				{activeTab === "schools" && (
				<div>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						{/* Schools Management */}
						<div className="bg-white p-6 rounded-lg shadow-sm border-2 border-blue-200">
							<div className="flex items-center gap-3 mb-6">
								<div className="p-2 bg-blue-100 rounded-lg">
									<BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
								</div>
								<div>
									<h2 className="text-xl font-semibold text-gray-900">School Management</h2>
									<p className="text-sm text-gray-600 mt-1">Add and manage schools in the system</p>
								</div>
							</div>
							
							<form onSubmit={handleAddSchool} className="mb-6">
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
										Add
									</button>
								</div>
							</form>

							<div className="space-y-2">
								<div className="flex items-center justify-between mb-3">
									<h3 className="text-sm font-semibold text-gray-700">All Schools ({schools.length})</h3>
								</div>
								<div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
									{schools.map((school) => (
										<div
											key={school.id}
											className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
										>
											<span className="text-sm font-medium text-gray-900">{school.name}</span>
											<button
												onClick={() => handleDeleteSchool(school.id)}
												className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
												title="Delete school"
											>
												<TrashIcon className="w-4 h-4" />
											</button>
										</div>
									))}
									{schools.length === 0 && (
										<div className="text-center py-8 text-gray-500 text-sm">
											No schools added yet
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Departments Management */}
						<div className="bg-white p-6 rounded-lg shadow-sm border-2 border-purple-200">
							<div className="flex items-center gap-3 mb-6">
								<div className="p-2 bg-purple-100 rounded-lg">
									<AcademicCapIcon className="w-6 h-6 text-purple-600" />
								</div>
								<div>
									<h2 className="text-xl font-semibold text-gray-900">Department Management</h2>
									<p className="text-sm text-gray-600 mt-1">Add and manage departments</p>
								</div>
							</div>
							
							<form onSubmit={handleAddDepartment} className="mb-6">
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
										Add
									</button>
								</div>
							</form>

							<div className="space-y-2">
								<div className="flex items-center justify-between mb-3">
									<h3 className="text-sm font-semibold text-gray-700">All Departments ({departments.length})</h3>
								</div>
								<div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
									{departments.map((dept) => (
										<div
											key={dept.id}
											className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
										>
											<span className="text-sm font-medium text-gray-900">{dept.name}</span>
											<button
												onClick={() => handleDeleteDepartment(dept.id)}
												className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
												title="Delete department"
											>
												<TrashIcon className="w-4 h-4" />
											</button>
										</div>
									))}
									{departments.length === 0 && (
										<div className="text-center py-8 text-gray-500 text-sm">
											No departments added yet
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					<div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-lg">
						<h3 className="font-semibold text-amber-900 mb-2">⚠️ Important Notes:</h3>
						<ul className="list-disc list-inside space-y-1 text-amber-800 text-sm">
							<li>Deleting a school or department is permanent and cannot be undone</li>
							<li>Ensure no scorecards or reports reference a school/department before deleting</li>
							<li>Changes here will immediately affect all related forms and reports</li>
						</ul>
					</div>
				</div>
				)}

				{/* System Tab */}
				{activeTab === "system" && (
				<div className="space-y-8">
					<div>
						<h2 className="text-xl font-bold text-gray-900 mb-1">System Management</h2>
						<p className="text-sm text-gray-500">Database backup, GitHub updates, and import tools. GM use only.</p>
					</div>

					{/* ── Developer Contact ─────────────────────────────── */}
					<div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
						<div className="p-3 bg-blue-100 rounded-full flex-shrink-0">
							<svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
						</div>
						<div className="flex-1">
							<p className="text-sm font-bold text-blue-900">System Issues or Errors?</p>
							<p className="text-sm text-blue-800 mt-0.5">Contact the developer directly for any bugs, errors, or technical problems.</p>
							<div className="mt-2 flex flex-wrap gap-3">
								<a href="tel:+256776003035" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
									<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
									Mustafa — +256 776 003 035
								</a>
								<a href="https://wa.me/256776003035" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors">
									<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
									WhatsApp
								</a>
							</div>
						</div>
					</div>

					{/* ── GitHub Connect & Updates ───────────────────────── */}
					<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-2 bg-gray-900 rounded-lg">
								<svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
							</div>
							<div>
								<h3 className="font-semibold text-gray-900">GitHub Auto-Update</h3>
								<p className="text-xs text-gray-500">Connect to your GitHub repository. Pull latest code and apply database changes in one click.</p>
							</div>
							{githubConfigured && <span className="ml-auto text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Connected</span>}
						</div>

						{/* Config form */}
						<div className="space-y-3 mb-5">
							<div>
								<label className="text-xs font-semibold text-gray-700 block mb-1">GitHub Repository URL</label>
								<input
									type="text"
									value={githubRepoUrl}
									onChange={e => setGithubRepoUrl(e.target.value)}
									placeholder="https://github.com/your-username/gms-report"
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 text-gray-900"
								/>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div>
									<label className="text-xs font-semibold text-gray-700 block mb-1">Personal Access Token (PAT)</label>
									<input
										type="password"
										value={githubToken}
										onChange={e => setGithubToken(e.target.value)}
										placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
										className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 text-gray-900"
									/>
									<p className="text-[10px] text-gray-400 mt-1">GitHub → Settings → Developer settings → Personal access tokens → Contents: read</p>
								</div>
								<div>
									<label className="text-xs font-semibold text-gray-700 block mb-1">Branch</label>
									<input
										type="text"
										value={githubBranch}
										onChange={e => setGithubBranch(e.target.value)}
										placeholder="main"
										className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 text-gray-900"
									/>
								</div>
							</div>
							<button
								onClick={async () => {
									if (!githubRepoUrl.trim() || !githubToken.trim()) return;
									setSavingGithub(true);
									const res = await fetch("/api/admin/github-update", {
										method: "POST",
										headers: { "Content-Type": "application/json" },
										body: JSON.stringify({ action: "save-config", repoUrl: githubRepoUrl.trim(), token: githubToken.trim(), branch: githubBranch.trim() || "main" }),
									});
									const data = await res.json();
									if (data.ok) setGithubConfigured(true);
									setSavingGithub(false);
								}}
								disabled={savingGithub || !githubRepoUrl.trim() || !githubToken.trim()}
								className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
							>
								{savingGithub ? "Saving…" : githubConfigured ? "Update Config" : "Save & Connect"}
							</button>
						</div>

						{githubConfigured && (
							<>
								<div className="border-t border-gray-100 pt-5 space-y-3">
									<div className="flex flex-wrap gap-3">
										<button
											onClick={async () => {
												setCheckingUpdates(true); setGithubCheckResult(null);
												const res = await fetch("/api/admin/github-update", {
													method: "POST",
													headers: { "Content-Type": "application/json" },
													body: JSON.stringify({ action: "check" }),
												});
												const data = await res.json();
												setGithubCheckResult(data);
												setCheckingUpdates(false);
											}}
											disabled={checkingUpdates || applyingUpdate}
											className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors border border-gray-300"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
											{checkingUpdates ? "Checking…" : "Check for Updates"}
										</button>
										<button
											onClick={async () => {
												if (!confirm("Pull latest code from GitHub and apply database changes? This may take 1–2 minutes.")) return;
												setApplyingUpdate(true); setGithubApplyResult(null);
												const res = await fetch("/api/admin/github-update", {
													method: "POST",
													headers: { "Content-Type": "application/json" },
													body: JSON.stringify({ action: "apply" }),
												});
												const data = await res.json();
												setGithubApplyResult(data);
												setApplyingUpdate(false);
											}}
											disabled={checkingUpdates || applyingUpdate}
											className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
											{applyingUpdate ? "Applying update… (up to 2min)" : "Pull & Apply Update"}
										</button>
									</div>
									{applyingUpdate && <p className="text-xs text-gray-500 animate-pulse">Pulling code, installing packages, syncing database… please wait.</p>}
									{githubCheckResult && (
										<div className={`p-3 rounded-lg text-sm ${githubCheckResult.ok ? (githubCheckResult.hasUpdates ? "bg-amber-50 border border-amber-200" : "bg-green-50 border border-green-200") : "bg-red-50 border border-red-200"}`}>
											{githubCheckResult.ok ? (
												<>
													<p className={`font-semibold ${githubCheckResult.hasUpdates ? "text-amber-800" : "text-green-800"}`}>
														{githubCheckResult.hasUpdates ? "⚠️ Updates available!" : "✅ Already up to date."}
													</p>
													{githubCheckResult.hasUpdates && (
														<pre className="mt-2 text-xs text-gray-700 whitespace-pre-wrap font-mono bg-white/60 p-2 rounded max-h-32 overflow-y-auto">{githubCheckResult.commits}</pre>
													)}
												</>
											) : (
												<p className="text-sm text-red-700">❌ {githubCheckResult.error}</p>
											)}
										</div>
									)}
									{githubApplyResult && (
										<div className={`p-3 rounded-lg text-xs font-mono whitespace-pre-wrap max-h-64 overflow-y-auto ${githubApplyResult.ok ? "bg-green-50 border border-green-200 text-green-900" : "bg-red-50 border border-red-200 text-red-800"}`}>
											{githubApplyResult.ok
												? `✅ Update applied successfully!\n\n${githubApplyResult.output ?? ""}`
												: `❌ ${githubApplyResult.error}\n\n${githubApplyResult.partialOutput ?? ""}`}
										</div>
									)}
									{githubApplyResult?.ok && (
										<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
											⚡ <strong>Restart required:</strong> The server needs to restart to load the new code. Run <code className="bg-blue-100 px-1 rounded">npm run build && npm start</code> (production) or just <code className="bg-blue-100 px-1 rounded">npm run dev</code> (development).
										</div>
									)}
								</div>
							</>
						)}
					</div>

					{/* ── Database Schema Sync ──────────────────────────── */}
					<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
						<div className="flex items-center gap-3 mb-3">
							<div className="p-2 bg-green-100 rounded-lg">
								<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
							</div>
							<div>
								<h3 className="font-semibold text-gray-900">Database Schema Sync</h3>
								<p className="text-xs text-gray-500">Sync the database to match the latest code. Safe — only adds new tables/columns, never removes existing data.</p>
							</div>
						</div>
						<p className="text-xs text-gray-500 mb-3">Run this after applying a code update if the app shows database errors. Your data stays intact.</p>
						<button
							onClick={async () => {
								if (!confirm("Sync database schema? Your data will not be affected.")) return;
								setUpdating(true); setUpdateResult(null);
								const res = await fetch("/api/admin/update", { method: "POST" });
								const data = await res.json();
								setUpdateResult(data);
								setUpdating(false);
							}}
							disabled={updating}
							className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
							{updating ? "Syncing… please wait" : "Sync Database Schema"}
						</button>
						{updating && <p className="mt-2 text-xs text-gray-500 animate-pulse">This may take up to 30 seconds…</p>}
						{updateResult && (
							<div className={`mt-3 p-3 rounded-lg text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto ${updateResult.ok ? "bg-green-50 border border-green-200 text-green-900" : "bg-red-50 border border-red-200 text-red-800"}`}>
								{updateResult.ok ? `✅ Database is up to date.\n\n${updateResult.output ?? ""}` : `❌ ${updateResult.error ?? updateResult.output}\n\nFor help: contact Mustafa +256 776 003 035`}
							</div>
						)}
					</div>

					{/* Backup */}
					<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-2 bg-blue-100 rounded-lg"><ShieldCheckIcon className="w-6 h-6 text-blue-600" /></div>
							<div>
								<h3 className="font-semibold text-gray-900">Database Backup</h3>
								<p className="text-xs text-gray-500">Creates a full SQL dump saved to the <code className="bg-gray-100 px-1 rounded">backups/</code> folder on the server.</p>
							</div>
						</div>
						<button
							onClick={async () => {
								setBackingUp(true); setBackupResult(null);
								const res = await fetch("/api/admin/backup", { method: "POST" });
								const data = await res.json();
								setBackupResult(data);
								setBackingUp(false);
							}}
							disabled={backingUp}
							className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
						>
							<CircleStackIcon className="w-4 h-4" />
							{backingUp ? "Backing up…" : "Run Backup Now"}
						</button>
						{backupResult && (
							<div className={`mt-3 p-3 rounded-lg text-sm ${
								backupResult.ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-700"
							}`}>
								{backupResult.ok ? `✅ ${backupResult.message}` : `❌ ${backupResult.error}`}
							</div>
						)}
					</div>

					{/* SQL Upload */}
					<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-2 bg-purple-100 rounded-lg"><ArrowUpTrayIcon className="w-6 h-6 text-purple-600" /></div>
							<div>
								<h3 className="font-semibold text-gray-900">Upload SQL Script</h3>
								<p className="text-xs text-gray-500">Upload a <code className="bg-gray-100 px-1 rounded">.sql</code> file to import data or run batch updates. Max 50 MB. Runs immediately against the live database.</p>
							</div>
						</div>
						<div className="p-3 mb-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
							⚠️ <strong>Caution:</strong> SQL runs directly. Always take a backup first before uploading scripts that modify data.
						</div>
						<div className="flex items-center gap-3 flex-wrap">
							<input
								type="file"
								accept=".sql"
								onChange={(e) => { setSqlFile(e.target.files?.[0] ?? null); setSqlResult(null); }}
								className="text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
							/>
							<button
								onClick={async () => {
									if (!sqlFile) return;
									if (!confirm(`Run "${sqlFile.name}" against the live database?`)) return;
									setSqlRunning(true); setSqlResult(null);
									const form = new FormData();
									form.append("sql", sqlFile);
									const res = await fetch("/api/admin/sql-upload", { method: "POST", body: form });
									const data = await res.json();
									setSqlResult(data);
									setSqlRunning(false);
								}}
								disabled={!sqlFile || sqlRunning}
								className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg font-semibold text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors"
							>
								<ArrowUpTrayIcon className="w-4 h-4" />
								{sqlRunning ? "Running…" : "Run SQL"}
							</button>
						</div>
						{sqlResult && (
							<div className={`mt-3 p-3 rounded-lg text-xs font-mono whitespace-pre-wrap ${
								sqlResult.ok ? "bg-green-50 border border-green-200 text-green-900" : "bg-red-50 border border-red-200 text-red-800"
							}`}>
								{sqlResult.ok ? `✅ Success\n${sqlResult.output ?? ""}` : `❌ ${sqlResult.error}`}
							</div>
						)}
					</div>
				</div>
				)}
			</div>
		</DashboardLayout>
	);
}
