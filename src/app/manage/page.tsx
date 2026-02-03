"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type ManageEventStatus = "ACTIVE" | "COMPLETED";
type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
type IssueItemStatus = "ACTIVE" | "COMPLETED";

type ManageEvent = {
  id: string;
  date: string;
  activity: string;
  inCharge: string;
  rate?: string;
  status?: ManageEventStatus;
};

type ManageIssue = {
  id: string;
  issue: string;
  inCharge: string;
  status: IssueStatus;
  itemStatus?: IssueItemStatus;
  createdAt?: string;
};

export default function ManagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("events");

  // Events state
  const [events, setEvents] = useState<ManageEvent[]>([]);
  const [newEvent, setNewEvent] = useState({
    date: "",
    activity: "",
    inCharge: "",
    rate: "",
    status: "ACTIVE" as ManageEventStatus,
  });
  const [eventStatusFilter, setEventStatusFilter] = useState<ManageEventStatus | "ALL">("ACTIVE");
  const [editingEvent, setEditingEvent] = useState<ManageEvent | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);

  // Projects state
  const [projects, setProjects] = useState<any[]>([]);
  const [newProject, setNewProject] = useState({
    projectName: "",
    progress: 0,
    projectManager: "",
  });

  // Scorecard state
  const [scorecards, setScorecard] = useState<any[]>([]);
  const [newScorecard, setNewScorecard] = useState({
    week: new Date().getWeek(),
    year: 2026,
    school: "",
    academicPercent: 0,
    financePercent: 0,
    qualityPercent: 0,
    tdpPercent: 0,
    theologyPercent: 0,
  });

  // Issues state
  const [issues, setIssues] = useState<ManageIssue[]>([]);
  const [newIssue, setNewIssue] = useState({
    issue: "",
    inCharge: "",
    status: "OPEN" as IssueStatus,
    itemStatus: "ACTIVE" as IssueItemStatus,
  });
  const [issueStatusFilter, setIssueStatusFilter] = useState<IssueItemStatus | "ALL">("ACTIVE");
  const [editingIssue, setEditingIssue] = useState<ManageIssue | null>(null);
  const [savingIssue, setSavingIssue] = useState(false);

  const daysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDateInput = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session.user.role !== "GM") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, activeTab, eventStatusFilter, issueStatusFilter]);

  const fetchData = async () => {
    try {
      switch (activeTab) {
        case "events":
          const eventsRes = await fetch(`/api/events?status=${eventStatusFilter}`);
          const eventsData = await eventsRes.json();
          setEvents(Array.isArray(eventsData) ? eventsData : eventsData.data || []);
          break;
        case "projects":
          const projectsRes = await fetch("/api/projects");
          const projectsData = await projectsRes.json();
          setProjects(projectsData);
          break;
        case "scorecard":
          const scorecardRes = await fetch("/api/scorecard");
          const scorecardData = await scorecardRes.json();
          setScorecard(scorecardData);
          break;
        case "issues":
          const issuesRes = await fetch(`/api/issues?status=${issueStatusFilter}`);
          const issuesData = await issuesRes.json();
          setIssues(Array.isArray(issuesData) ? issuesData : issuesData.data || []);
          break;
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      });
      if (res.ok) {
        fetchData();
        setNewEvent({ date: "", activity: "", inCharge: "", rate: "", status: "ACTIVE" });
      }
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  const handleStartEditEvent = (event: ManageEvent) => {
    setEditingEvent({ ...event, date: formatDateInput(event.date) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEventEdit = () => {
    setEditingEvent(null);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    try {
      setSavingEvent(true);
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingEvent),
      });
      if (res.ok) {
        setEditingEvent(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setSavingEvent(false);
    }
  };

  const handleUpdateEventStatus = async (id: string, status: ManageEventStatus) => {
    try {
      setSavingEvent(true);
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        if (editingEvent?.id === id) {
          setEditingEvent((prev) => (prev ? { ...prev, status } : prev));
        }
        fetchData();
      }
    } catch (error) {
      console.error("Error updating event status:", error);
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    try {
      setSavingEvent(true);
      const res = await fetch(`/api/events?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        if (editingEvent?.id === id) setEditingEvent(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setSavingEvent(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });
      if (res.ok) {
        fetchData();
        setNewProject({ projectName: "", progress: 0, projectManager: "" });
      }
    } catch (error) {
      console.error("Error adding project:", error);
    }
  };

  const handleAddScorecard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/scorecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newScorecard),
      });
      if (res.ok) {
        fetchData();
        setNewScorecard({
          week: new Date().getWeek(),
          year: 2026,
          school: "",
          academicPercent: 0,
          financePercent: 0,
          qualityPercent: 0,
          tdpPercent: 0,
          theologyPercent: 0,
        });
      }
    } catch (error) {
      console.error("Error adding scorecard:", error);
    }
  };

  const handleAddIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIssue),
      });
      if (res.ok) {
        fetchData();
        setNewIssue({ issue: "", inCharge: "", status: "OPEN", itemStatus: "ACTIVE" });
      }
    } catch (error) {
      console.error("Error adding issue:", error);
    }
  };

  const handleStartEditIssue = (issue: ManageIssue) => {
    setEditingIssue(issue);
  };

  const handleCancelIssueEdit = () => {
    setEditingIssue(null);
  };

  const handleSaveIssue = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingIssue) return;
    try {
      setSavingIssue(true);
      const res = await fetch(`/api/issues?id=${editingIssue.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue: editingIssue.issue,
          inCharge: editingIssue.inCharge,
          status: editingIssue.status,
          itemStatus: editingIssue.itemStatus,
        }),
      });
      if (res.ok) {
        setEditingIssue(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error updating issue:", error);
    } finally {
      setSavingIssue(false);
    }
  };

  const handleUpdateIssueStatus = async (id: string, status: IssueStatus) => {
    try {
      setSavingIssue(true);
      const res = await fetch(`/api/issues?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        if (editingIssue?.id === id) {
          setEditingIssue((prev) => (prev ? { ...prev, status } : prev));
        }
        fetchData();
      }
    } catch (error) {
      console.error("Error updating issue status:", error);
    } finally {
      setSavingIssue(false);
    }
  };

  const handleUpdateIssueItemStatus = async (id: string, itemStatus: IssueItemStatus) => {
    try {
      setSavingIssue(true);
      const res = await fetch("/api/issues", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, itemStatus }),
      });
      if (res.ok) {
        if (editingIssue?.id === id) {
          setEditingIssue((prev) => (prev ? { ...prev, itemStatus } : prev));
        }
        fetchData();
      }
    } catch (error) {
      console.error("Error updating issue item status:", error);
    } finally {
      setSavingIssue(false);
    }
  };

  const handleDeleteIssue = async (id: string) => {
    if (!confirm("Delete this issue?")) return;
    try {
      setSavingIssue(true);
      const res = await fetch(`/api/issues?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        if (editingIssue?.id === id) setEditingIssue(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting issue:", error);
    } finally {
      setSavingIssue(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!session || session.user.role !== "GM") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Manage Data</h1>
            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "events", label: "Upcoming Events" },
              { id: "projects", label: "GM Projects" },
              { id: "scorecard", label: "Weekly Scorecard" },
              { id: "issues", label: "Red Issues" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Upcoming Events Tab */}
        {activeTab === "events" && (
          <div className="space-y-6">
            {events.some((e) => (e.status ?? "ACTIVE") !== "COMPLETED" && daysUntil(e.date) <= 2) && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 text-sm font-semibold">Heads up</p>
                <p className="text-amber-700 text-sm">
                  You have events due soon or overdue. Mark them done/archived or adjust dates as needed.
                </p>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add / Edit Event</h2>
                <p className="text-sm text-gray-600">Add new events or edit an existing one, then mark done/archive when completed.</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Status filter</label>
                <select
                  value={eventStatusFilter}
                  onChange={(e) => setEventStatusFilter(e.target.value as ManageEventStatus | "ALL")}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed / Archived</option>
                  <option value="ALL">All</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <form onSubmit={editingEvent ? handleSaveEvent : handleAddEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="date"
                  value={editingEvent ? editingEvent.date : newEvent.date}
                  onChange={(e) =>
                    editingEvent
                      ? setEditingEvent({ ...editingEvent, date: e.target.value })
                      : setNewEvent({ ...newEvent, date: e.target.value })
                  }
                  className="border rounded-lg px-4 py-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Activity"
                  value={editingEvent ? editingEvent.activity : newEvent.activity}
                  onChange={(e) =>
                    editingEvent
                      ? setEditingEvent({ ...editingEvent, activity: e.target.value })
                      : setNewEvent({ ...newEvent, activity: e.target.value })
                  }
                  className="border rounded-lg px-4 py-2"
                  required
                />
                <input
                  type="text"
                  placeholder="In-Charge"
                  value={editingEvent ? editingEvent.inCharge : newEvent.inCharge}
                  onChange={(e) =>
                    editingEvent
                      ? setEditingEvent({ ...editingEvent, inCharge: e.target.value })
                      : setNewEvent({ ...newEvent, inCharge: e.target.value })
                  }
                  className="border rounded-lg px-4 py-2"
                  required
                />
                <select
                  value={editingEvent ? editingEvent.rate ?? "" : newEvent.rate}
                  onChange={(e) =>
                    editingEvent
                      ? setEditingEvent({ ...editingEvent, rate: e.target.value })
                      : setNewEvent({ ...newEvent, rate: e.target.value })
                  }
                  className="border rounded-lg px-4 py-2"
                  required
                >
                  <option value="">Select Priority</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <select
                  value={editingEvent ? editingEvent.status ?? "ACTIVE" : newEvent.status}
                  onChange={(e) =>
                    editingEvent
                      ? setEditingEvent({ ...editingEvent, status: e.target.value as ManageEventStatus })
                      : setNewEvent({ ...newEvent, status: e.target.value as ManageEventStatus })
                  }
                  className="border rounded-lg px-4 py-2"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed / Archived</option>
                </select>
                <div className="md:col-span-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={savingEvent}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                  >
                    {savingEvent ? "Saving..." : editingEvent ? "Update Event" : "Add Event"}
                  </button>
                  {editingEvent && (
                    <button
                      type="button"
                      onClick={handleCancelEventEdit}
                      className="text-gray-700 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Event List</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Activity</th>
                      <th className="text-left py-3 px-4">In-Charge</th>
                      <th className="text-left py-3 px-4">Priority</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Due</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => {
                      const dueIn = daysUntil(event.date);
                      const isEditing = editingEvent?.id === event.id;
                      return (
                        <tr key={event.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="date"
                                value={editingEvent?.date || ""}
                                onChange={(e) => setEditingEvent((prev) => prev ? { ...prev, date: e.target.value } : prev)}
                                className="border rounded px-2 py-1 text-sm"
                              />
                            ) : (
                              new Date(event.date).toLocaleDateString()
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingEvent?.activity || ""}
                                onChange={(e) => setEditingEvent((prev) => prev ? { ...prev, activity: e.target.value } : prev)}
                                className="border rounded px-2 py-1 w-full text-sm"
                              />
                            ) : (
                              event.activity
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingEvent?.inCharge || ""}
                                onChange={(e) => setEditingEvent((prev) => prev ? { ...prev, inCharge: e.target.value } : prev)}
                                className="border rounded px-2 py-1 text-sm"
                              />
                            ) : (
                              event.inCharge
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <select
                                value={editingEvent?.rate || ""}
                                onChange={(e) => setEditingEvent((prev) => prev ? { ...prev, rate: e.target.value } : prev)}
                                className="border rounded px-2 py-1 text-sm"
                              >
                                <option value="">Select</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                              </select>
                            ) : (
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  event.rate === "High"
                                    ? "bg-red-100 text-red-800"
                                    : event.rate === "Medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {event.rate}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                (event.status ?? "ACTIVE") === "COMPLETED"
                                  ? "bg-gray-200 text-gray-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {(event.status ?? "ACTIVE") === "COMPLETED" ? "Completed / Archived" : "Active"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {dueIn < 0 ? (
                              <span className="text-red-600 font-semibold">Overdue {Math.abs(dueIn)}d</span>
                            ) : dueIn === 0 ? (
                              <span className="text-amber-700 font-semibold">Due today</span>
                            ) : (
                              <span className="text-gray-700">In {dueIn} day{dueIn === 1 ? "" : "s"}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={handleSaveEvent}
                                    className="text-blue-700 px-3 py-1 border border-blue-200 rounded hover:bg-blue-50 text-xs"
                                    disabled={savingEvent}
                                  >
                                    {savingEvent ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    onClick={handleCancelEventEdit}
                                    className="text-gray-700 px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 text-xs"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleStartEditEvent(event)}
                                    className="text-blue-700 px-3 py-1 border border-blue-200 rounded hover:bg-blue-50 text-xs"
                                  >
                                    Edit
                                  </button>
                                  {(event.status ?? "ACTIVE") === "ACTIVE" ? (
                                    <button
                                      onClick={() => handleUpdateEventStatus(event.id, "COMPLETED")}
                                      className="text-green-700 px-3 py-1 border border-green-200 rounded hover:bg-green-50 text-xs"
                                    >
                                      Mark Done / Archive
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleUpdateEventStatus(event.id, "ACTIVE")}
                                      className="text-amber-700 px-3 py-1 border border-amber-200 rounded hover:bg-amber-50 text-xs"
                                    >
                                      Re-Open
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteEvent(event.id)}
                                    className="text-red-700 px-3 py-1 border border-red-200 rounded hover:bg-red-50 text-xs"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* GM Projects Tab */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Add New Project</h2>
              <form onSubmit={handleAddProject} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Project Name"
                  value={newProject.projectName}
                  onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
                  className="border rounded-lg px-4 py-2"
                  required
                />
                <input
                  type="number"
                  placeholder="Progress %"
                  value={newProject.progress}
                  onChange={(e) => setNewProject({ ...newProject, progress: parseInt(e.target.value) })}
                  className="border rounded-lg px-4 py-2"
                  min="0"
                  max="100"
                  required
                />
                <input
                  type="text"
                  placeholder="Project Manager"
                  value={newProject.projectManager}
                  onChange={(e) => setNewProject({ ...newProject, projectManager: e.target.value })}
                  className="border rounded-lg px-4 py-2"
                  required
                />
                <button
                  type="submit"
                  className="md:col-span-3 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Add Project
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Project List</h2>
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{project.projectName}</h3>
                      <span className="text-sm text-gray-600">{project.projectManager}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full flex items-center justify-center text-xs text-white font-semibold"
                        style={{ width: `${project.progress}%` }}
                      >
                        {project.progress}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Red Issues Tab */}
        {activeTab === "issues" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add / Edit Red Issue</h2>
                <p className="text-sm text-gray-600">Track blockers, assign owners, update status, and archive when resolved.</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Show</label>
                <select
                  value={issueStatusFilter}
                  onChange={(e) => setIssueStatusFilter(e.target.value as IssueItemStatus | "ALL")}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Archived</option>
                  <option value="ALL">All</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <form onSubmit={editingIssue ? handleSaveIssue : handleAddIssue} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Issue Description"
                  value={editingIssue ? editingIssue.issue : newIssue.issue}
                  onChange={(e) =>
                    editingIssue
                      ? setEditingIssue({ ...editingIssue, issue: e.target.value })
                      : setNewIssue({ ...newIssue, issue: e.target.value })
                  }
                  className="border rounded-lg px-4 py-2 md:col-span-2"
                  required
                />
                <input
                  type="text"
                  placeholder="In-Charge"
                  value={editingIssue ? editingIssue.inCharge : newIssue.inCharge}
                  onChange={(e) =>
                    editingIssue
                      ? setEditingIssue({ ...editingIssue, inCharge: e.target.value })
                      : setNewIssue({ ...newIssue, inCharge: e.target.value })
                  }
                  className="border rounded-lg px-4 py-2"
                />
                <select
                  value={editingIssue ? editingIssue.status : newIssue.status}
                  onChange={(e) =>
                    editingIssue
                      ? setEditingIssue({ ...editingIssue, status: e.target.value as IssueStatus })
                      : setNewIssue({ ...newIssue, status: e.target.value as IssueStatus })
                  }
                  className="border rounded-lg px-4 py-2"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
                <select
                  value={editingIssue ? editingIssue.itemStatus ?? "ACTIVE" : newIssue.itemStatus}
                  onChange={(e) =>
                    editingIssue
                      ? setEditingIssue({ ...editingIssue, itemStatus: e.target.value as IssueItemStatus })
                      : setNewIssue({ ...newIssue, itemStatus: e.target.value as IssueItemStatus })
                  }
                  className="border rounded-lg px-4 py-2"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Archived</option>
                </select>
                <div className="md:col-span-4 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={savingIssue}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                  >
                    {savingIssue ? "Saving..." : editingIssue ? "Update Issue" : "Add Issue"}
                  </button>
                  {editingIssue && (
                    <button
                      type="button"
                      onClick={handleCancelIssueEdit}
                      className="text-gray-700 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Issues Tracker</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Issue</th>
                      <th className="text-left py-3 px-4">In-Charge</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Archive</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.length === 0 && (
                      <tr>
                        <td className="py-6 px-4 text-center text-gray-500 text-sm" colSpan={5}>
                          No issues found for this filter.
                        </td>
                      </tr>
                    )}
                    {issues.map((issue) => {
                      const isEditing = editingIssue?.id === issue.id;
                      return (
                        <tr key={issue.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingIssue?.issue || ""}
                                onChange={(e) => setEditingIssue((prev) => prev ? { ...prev, issue: e.target.value } : prev)}
                                className="border rounded px-2 py-1 w-full"
                              />
                            ) : (
                              <span className="font-medium text-gray-900">{issue.issue}</span>
                            )}
                            <p className="text-xs text-gray-500">{issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : ""}</p>
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingIssue?.inCharge || ""}
                                onChange={(e) => setEditingIssue((prev) => prev ? { ...prev, inCharge: e.target.value } : prev)}
                                className="border rounded px-2 py-1 w-full"
                              />
                            ) : (
                              issue.inCharge
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={isEditing ? editingIssue?.status : issue.status}
                              onChange={(e) =>
                                isEditing
                                  ? setEditingIssue((prev) => prev ? { ...prev, status: e.target.value as IssueStatus } : prev)
                                  : handleUpdateIssueStatus(issue.id, e.target.value as IssueStatus)
                              }
                              className={`px-2 py-1 rounded border text-xs font-semibold ${
                                (isEditing ? editingIssue?.status : issue.status) === "RESOLVED"
                                  ? "bg-green-100 text-green-800"
                                  : (isEditing ? editingIssue?.status : issue.status) === "IN_PROGRESS"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              <option value="OPEN">Open</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="RESOLVED">Resolved</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-[11px] font-semibold ${
                              (issue.itemStatus ?? "ACTIVE") === "COMPLETED" ? "bg-gray-200 text-gray-800" : "bg-blue-100 text-blue-800"
                            }`}>
                              {(issue.itemStatus ?? "ACTIVE") === "COMPLETED" ? "Archived" : "Active"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={handleSaveIssue}
                                    className="text-blue-700 px-3 py-1 border border-blue-200 rounded hover:bg-blue-50 text-xs"
                                    disabled={savingIssue}
                                  >
                                    {savingIssue ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    onClick={handleCancelIssueEdit}
                                    className="text-gray-700 px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 text-xs"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleStartEditIssue(issue)}
                                    className="text-blue-700 px-3 py-1 border border-blue-200 rounded hover:bg-blue-50 text-xs"
                                  >
                                    Edit
                                  </button>
                                  {(issue.itemStatus ?? "ACTIVE") === "ACTIVE" ? (
                                    <button
                                      onClick={() => handleUpdateIssueItemStatus(issue.id, "COMPLETED")}
                                      className="text-green-700 px-3 py-1 border border-green-200 rounded hover:bg-green-50 text-xs"
                                      disabled={savingIssue}
                                    >
                                      Mark Archived
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleUpdateIssueItemStatus(issue.id, "ACTIVE")}
                                      className="text-amber-700 px-3 py-1 border border-amber-200 rounded hover:bg-amber-50 text-xs"
                                      disabled={savingIssue}
                                    >
                                      Reopen
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteIssue(issue.id)}
                                    className="text-red-700 px-3 py-1 border border-red-200 rounded hover:bg-red-50 text-xs"
                                    disabled={savingIssue}
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Scorecard Tab - Simplified due to complexity */}
        {activeTab === "scorecard" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Weekly School Scorecard</h2>
            <p className="text-gray-600 mb-4">
              This section allows you to track weekly performance metrics across schools.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Week</th>
                    <th className="text-left py-2 px-2">School</th>
                    <th className="text-left py-2 px-2">Academic %</th>
                    <th className="text-left py-2 px-2">Finance %</th>
                    <th className="text-left py-2 px-2">Quality %</th>
                    <th className="text-left py-2 px-2">TDP %</th>
                    <th className="text-left py-2 px-2">Theology %</th>
                  </tr>
                </thead>
                <tbody>
                  {scorecards.map((card) => (
                    <tr key={card.id} className="border-b">
                      <td className="py-2 px-2">{card.week}</td>
                      <td className="py-2 px-2">{card.school}</td>
                      <td className="py-2 px-2">{card.academicPercent.toFixed(1)}%</td>
                      <td className="py-2 px-2">{card.financePercent.toFixed(1)}%</td>
                      <td className="py-2 px-2">{card.qualityPercent.toFixed(1)}%</td>
                      <td className="py-2 px-2">{card.tdpPercent.toFixed(1)}%</td>
                      <td className="py-2 px-2">{card.theologyPercent.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Helper to get current week number
declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function () {
  const onejan = new Date(this.getFullYear(), 0, 1);
  return Math.ceil(((this.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
};
