"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { CalendarIcon, CheckCircleIcon, XCircleIcon, BuildingOfficeIcon, AcademicCapIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

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
	const [activeTab, setActiveTab] = useState<"terms" | "schools">("terms");

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
						className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
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
									className="bg-gray-50 rounded-lg p-5 border border-gray-200"
								>
									<h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
										<CalendarIcon className="w-5 h-5 text-blue-600" />
										Term {setting.term}
									</h3>

									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Start Date (Week 1)
											</label>
											<input
												type="date"
												value={setting.startDate}
												onChange={(e) =>
													handleInputChange(globalIndex, "startDate", e.target.value)
												}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												End Date
											</label>
											<input
												type="date"
												value={setting.endDate}
												onChange={(e) =>
													handleInputChange(globalIndex, "endDate", e.target.value)
												}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
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
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
			</div>
		</DashboardLayout>
	);
}
