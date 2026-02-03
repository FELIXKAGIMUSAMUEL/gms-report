"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { CalendarIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

interface TermSetting {
	id?: string;
	term: number;
	year: number;
	startDate: string;
	endDate: string;
	weeksCount: number;
}

export default function SettingsPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [termSettings, setTermSettings] = useState<TermSetting[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Term Settings</h1>
					<p className="text-gray-600">
						Configure the start and end dates for each academic term. This helps the system track weekly
						report deadlines and send timely reminders.
					</p>
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
		</DashboardLayout>
	);
}
