"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { CheckCircleIcon, ExclamationTriangleIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

interface FormError {
  field: string;
  message: string;
}

export default function UpdateReportPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ type: "success" | "error"; text: string }[]>([]);
  const [activeTab, setActiveTab] = useState("kpi");

  // Form state
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    weekNumber: 1,
    weekStartDate: "",
    weekEndDate: "",
    feesCollectionPercent: 0,
    schoolsExpenditurePercent: 0,
    infrastructurePercent: 0,
    totalEnrollment: 0,
    theologyEnrollment: 0,
    p7PrepExamsPercent: 0,
    syllabusCoveragePercent: 0,
    admissions: 0,
  });

  const [p7PerpData, setP7PrepData] = useState({
    year: new Date().getFullYear(),
    p6Promotion: 0,
    prep1: 0, prep2: 0, prep3: 0, prep4: 0, prep5: 0, prep6: 0, prep7: 0, prep8: 0, prep9: 0,
    ple: 0,
  });

  const [events, setEvents] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({ date: "", activity: "", inCharge: "", priority: "Medium" });

  const [projects, setProjects] = useState<any[]>([]);
  const [newProject, setNewProject] = useState({ projectName: "", projectManager: "", progress: 0 });

  const [issues, setIssues] = useState<any[]>([]);
  const [newIssue, setNewIssue] = useState({ title: "", description: "", status: "OPEN", priority: 1 });

  const [scorecards, setScorecards] = useState<any[]>([]);
  const [newScorecard, setNewScorecard] = useState({ schoolId: "", schoolName: "", academicScore: 0, financeScore: 0, qualityScore: 0, technologyScore: 0, theologyScore: 0 });

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleP7InputChange = (field: string, value: any) => {
    setP7PrepData(prev => ({ ...prev, [field]: value }));
  };

  // Submit handlers
  const handleSaveReport = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save report");
      setMessages([{ type: "success", text: "Report saved successfully!" }]);
      setTimeout(() => setMessages([]), 3000);
    } catch (err) {
      setMessages([{ type: "error", text: err instanceof Error ? err.message : "Failed to save report" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddP7Prep = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/p7-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p7PerpData),
      });

      if (!response.ok) throw new Error("Failed to save P7 data");
      setMessages([{ type: "success", text: "P7 Prep data saved!" }]);
      setP7PrepData({
        year: new Date().getFullYear(),
        p6Promotion: 0,
        prep1: 0, prep2: 0, prep3: 0, prep4: 0, prep5: 0, prep6: 0, prep7: 0, prep8: 0, prep9: 0,
        ple: 0,
      });
      setTimeout(() => setMessages([]), 3000);
    } catch (err) {
      setMessages([{ type: "error", text: err instanceof Error ? err.message : "Failed to save P7 data" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.activity || !newEvent.date) {
      setMessages([{ type: "error", text: "Please fill all event fields" }]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEvent,
          weekNumber: formData.weekNumber,
          year: formData.year,
        }),
      });

      if (!response.ok) throw new Error("Failed to add event");
      const data = await response.json();
      setEvents([...events, data.data]);
      setNewEvent({ date: "", activity: "", inCharge: "", priority: "Medium" });
      setMessages([{ type: "success", text: "Event added!" }]);
      setTimeout(() => setMessages([]), 3000);
    } catch (err) {
      setMessages([{ type: "error", text: "Failed to add event" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async () => {
    if (!newProject.projectName) {
      setMessages([{ type: "error", text: "Please fill all project fields" }]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProject,
          weekNumber: formData.weekNumber,
          year: formData.year,
        }),
      });

      if (!response.ok) throw new Error("Failed to add project");
      const data = await response.json();
      setProjects([...projects, data.data]);
      setNewProject({ projectName: "", projectManager: "", progress: 0 });
      setMessages([{ type: "success", text: "Project added!" }]);
      setTimeout(() => setMessages([]), 3000);
    } catch (err) {
      setMessages([{ type: "error", text: "Failed to add project" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIssue = async () => {
    if (!newIssue.title) {
      setMessages([{ type: "error", text: "Please fill all issue fields" }]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newIssue,
          week: formData.weekNumber,
          year: formData.year,
          term: Math.ceil(formData.weekNumber / 13),
        }),
      });

      if (!response.ok) throw new Error("Failed to add issue");
      const data = await response.json();
      setIssues([...issues, data.data]);
      setNewIssue({ title: "", description: "", status: "OPEN", priority: 1 });
      setMessages([{ type: "success", text: "Issue added!" }]);
      setTimeout(() => setMessages([]), 3000);
    } catch (err) {
      setMessages([{ type: "error", text: "Failed to add issue" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddScorecard = async () => {
    if (!newScorecard.schoolId) {
      setMessages([{ type: "error", text: "Please select a school" }]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/scorecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newScorecard,
          week: formData.weekNumber,
          year: formData.year,
          term: Math.ceil(formData.weekNumber / 13),
        }),
      });

      if (!response.ok) throw new Error("Failed to add scorecard");
      const data = await response.json();
      setScorecards([...scorecards, data.data]);
      setNewScorecard({ schoolId: "", schoolName: "", academicScore: 0, financeScore: 0, qualityScore: 0, technologyScore: 0, theologyScore: 0 });
      setMessages([{ type: "success", text: "Scorecard added!" }]);
      setTimeout(() => setMessages([]), 3000);
    } catch (err) {
      setMessages([{ type: "error", text: "Failed to add scorecard" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      setEvents(events.filter(e => e.id !== id));
      setMessages([{ type: "success", text: "Event deleted!" }]);
      setTimeout(() => setMessages([]), 3000);
    } catch {
      setMessages([{ type: "error", text: "Failed to delete event" }]);
    } finally {
      setLoading(false);
    }
  };

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Messages */}
        {messages.length > 0 && (
          <div className="mb-6 space-y-2">
            {messages.map((msg, idx) => (
              <div key={idx} className={`p-4 rounded-lg flex items-center gap-3 ${msg.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                {msg.type === "success" ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5" />
                )}
                <span>{msg.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Update Weekly Report</h1>
          <p className="text-gray-600 mt-2">Add data for week {formData.weekNumber}, {formData.year}</p>
        </div>

        {/* Period Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <input type="number" value={formData.year} onChange={(e) => handleInputChange("year", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Week Number</label>
              <input type="number" min="1" max="52" value={formData.weekNumber} onChange={(e) => handleInputChange("weekNumber", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Week Start</label>
              <input type="date" value={formData.weekStartDate} onChange={(e) => handleInputChange("weekStartDate", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Week End</label>
              <input type="date" value={formData.weekEndDate} onChange={(e) => handleInputChange("weekEndDate", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <div className="flex gap-4 flex-wrap">
            {["kpi", "p7prep", "events", "projects", "issues", "scorecard"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
              }`}>
                {tab.replace(/([A-Z])/g, ' $1').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Section */}
        {activeTab === "kpi" && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">KPI Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Fees Collection %", field: "feesCollectionPercent" },
                { label: "Expenditure %", field: "schoolsExpenditurePercent" },
                { label: "Infrastructure %", field: "infrastructurePercent" },
                { label: "Total Enrollment", field: "totalEnrollment" },
                { label: "Theology Enrollment", field: "theologyEnrollment" },
                { label: "P7 Prep Exams %", field: "p7PrepExamsPercent" },
                { label: "Syllabus Coverage %", field: "syllabusCoveragePercent" },
                { label: "Admissions", field: "admissions" },
              ].map(item => (
                <div key={item.field}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{item.label}</label>
                  <input type="number" value={formData[item.field as keyof typeof formData]} onChange={(e) => handleInputChange(item.field, Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              ))}
            </div>
            <button onClick={handleSaveReport} disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
              {loading ? "Saving..." : "Save KPI Report"}
            </button>
          </div>
        )}

        {/* P7 Prep Section */}
        {activeTab === "p7prep" && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">P7 Cohort Journey</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <input type="number" value={p7PerpData.year} onChange={(e) => handleP7InputChange("year", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              {["p6Promotion", "prep1", "prep2", "prep3", "prep4", "prep5", "prep6", "prep7", "prep8", "prep9", "ple"].map(field => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{field.replace(/([A-Z])/g, ' $1')}</label>
                  <input type="number" value={p7PerpData[field as keyof typeof p7PerpData]} onChange={(e) => handleP7InputChange(field, Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              ))}
            </div>
            <button onClick={handleAddP7Prep} disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
              {loading ? "Saving..." : "Save P7 Data"}
            </button>
          </div>
        )}

        {/* Events Section */}
        {activeTab === "events" && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Events</h3>
            <div className="space-y-4 mb-6">
              {events.map(event => (
                <div key={event.id} className="p-4 bg-gray-50 rounded-lg flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{event.activity}</p>
                    <p className="text-sm text-gray-600">{event.date}</p>
                  </div>
                  <button onClick={() => handleDeleteEvent(event.id)} className="text-red-600 hover:text-red-700">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input type="date" value={newEvent.date} onChange={(e) => setNewEvent({...newEvent, date: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg" />
              <input placeholder="Activity" value={newEvent.activity} onChange={(e) => setNewEvent({...newEvent, activity: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg" />
              <input placeholder="In Charge" value={newEvent.inCharge} onChange={(e) => setNewEvent({...newEvent, inCharge: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg" />
              <select value={newEvent.priority} onChange={(e) => setNewEvent({...newEvent, priority: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <button onClick={handleAddEvent} disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              Add Event
            </button>
          </div>
        )}

        {/* Projects Section */}
        {activeTab === "projects" && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Projects</h3>
            <div className="space-y-4 mb-6">
              {projects.map(project => (
                <div key={project.id} className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{project.projectName}</p>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input placeholder="Project Name" value={newProject.projectName} onChange={(e) => setNewProject({...newProject, projectName: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg" />
              <input placeholder="Project Manager" value={newProject.projectManager} onChange={(e) => setNewProject({...newProject, projectManager: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg" />
              <input type="number" min="0" max="100" placeholder="Progress %" value={newProject.progress} onChange={(e) => setNewProject({...newProject, progress: Number(e.target.value)})} className="px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <button onClick={handleAddProject} disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              Add Project
            </button>
          </div>
        )}

        {/* Issues Section */}
        {activeTab === "issues" && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Red Issues</h3>
            <div className="space-y-4 mb-6">
              {issues.map(issue => (
                <div key={issue.id} className="p-4 border-l-4 border-red-500 bg-red-50 rounded">
                  <p className="font-medium text-gray-900">{issue.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input placeholder="Issue Title" value={newIssue.title} onChange={(e) => setNewIssue({...newIssue, title: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg" />
              <input placeholder="Description" value={newIssue.description} onChange={(e) => setNewIssue({...newIssue, description: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg" />
              <select value={newIssue.status} onChange={(e) => setNewIssue({...newIssue, status: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg">
                <option>OPEN</option>
                <option>IN_PROGRESS</option>
                <option>RESOLVED</option>
              </select>
              <input type="number" min="1" max="5" value={newIssue.priority} onChange={(e) => setNewIssue({...newIssue, priority: Number(e.target.value)})} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Priority (1-5)" />
            </div>
            <button onClick={handleAddIssue} disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              Add Issue
            </button>
          </div>
        )}

        {/* Scorecard Section */}
        {activeTab === "scorecard" && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">School Scorecard</h3>
            <div className="space-y-4 mb-6">
              {scorecards.map(sc => (
                <div key={sc.id} className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{sc.schoolName}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <input placeholder="School ID" value={newScorecard.schoolId} onChange={(e) => setNewScorecard({...newScorecard, schoolId: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg" />
              <input placeholder="School Name" value={newScorecard.schoolName} onChange={(e) => setNewScorecard({...newScorecard, schoolName: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg" />
              <input type="number" min="0" max="100" placeholder="Academic" value={newScorecard.academicScore} onChange={(e) => setNewScorecard({...newScorecard, academicScore: Number(e.target.value)})} className="px-3 py-2 border border-gray-300 rounded-lg" />
              <input type="number" min="0" max="100" placeholder="Finance" value={newScorecard.financeScore} onChange={(e) => setNewScorecard({...newScorecard, financeScore: Number(e.target.value)})} className="px-3 py-2 border border-gray-300 rounded-lg" />
              <input type="number" min="0" max="100" placeholder="Quality" value={newScorecard.qualityScore} onChange={(e) => setNewScorecard({...newScorecard, qualityScore: Number(e.target.value)})} className="px-3 py-2 border border-gray-300 rounded-lg" />
              <input type="number" min="0" max="100" step="0.01" placeholder="TDP" value={newScorecard.technologyScore} onChange={(e) => setNewScorecard({...newScorecard, technologyScore: Number(e.target.value)})} className="px-3 py-2 border border-gray-300 rounded-lg" />
              <input type="number" min="0" max="100" placeholder="Theology" value={newScorecard.theologyScore} onChange={(e) => setNewScorecard({...newScorecard, theologyScore: Number(e.target.value)})} className="px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <button onClick={handleAddScorecard} disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              Add Scorecard
            </button>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
