"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeftIcon, CheckCircleIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";

interface GMProject {
  id: string;
  projectName: string;
  projectManager: string;
  progress: number;
  status?: string;
}

export default function ProjectsEntryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [projects, setProjects] = useState<GMProject[]>([]);
  const [newProject, setNewProject] = useState<Partial<GMProject>>({
    projectName: "",
    projectManager: "",
    progress: 0,
    status: "In Progress",
  });
  const [savingProjects, setSavingProjects] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch existing projects
  useEffect(() => {
    if (status === "authenticated") {
      fetchProjects();
    }
  }, [status]);

  const fetchProjects = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!newProject.projectName || !newProject.projectManager) {
        throw new Error("Project name and manager are required");
      }

      if (newProject.progress! < 0 || newProject.progress! > 100) {
        throw new Error("Progress must be between 0 and 100");
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save project");
      }

      setSuccess(true);
      setNewProject({
        projectName: "",
        projectManager: "",
        progress: 0,
        status: "In Progress",
      });

      setTimeout(() => setSuccess(false), 3000);
      await fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (projectId: string, newProgress: number) => {
    // Update UI immediately (optimistic update)
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId ? { ...p, progress: newProgress } : p
      )
    );

    // Show saving indicator
    setSavingProjects(prev => new Set(prev).add(projectId));

    try {
      // Send update in background (fire and forget)
      const response = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, progress: newProgress }),
      });

      if (!response.ok) {
        // If error, revert to old value and show error
        await fetchProjects();
        setError("Failed to save progress. Reverted to previous value.");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      // Silent error handling - only revert if critical
      await fetchProjects();
      setError("Connection error. Progress reverted.");
      setTimeout(() => setError(null), 3000);
    } finally {
      // Remove saving indicator after a brief delay
      setTimeout(() => {
        setSavingProjects(prev => {
          const newSet = new Set(prev);
          newSet.delete(projectId);
          return newSet;
        });
      }, 500);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await fetch("/api/projects?id=" + projectId, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete project");
      }

      await fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    }
  };

  if (status === "loading" || fetchLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Projects</h1>
          <p className="text-gray-600 mt-2">Track GM projects and their progress</p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">Project saved successfully!</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Add New Project Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Project</h3>
          <form onSubmit={handleAddProject} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                <input
                  type="text"
                  value={newProject.projectName || ""}
                  onChange={(e) => setNewProject(prev => ({ ...prev, projectName: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                  placeholder="e.g., Infrastructure Development"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Manager</label>
                <input
                  type="text"
                  value={newProject.projectManager || ""}
                  onChange={(e) => setNewProject(prev => ({ ...prev, projectManager: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                  placeholder="Name of project manager"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Progress (%)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newProject.progress || 0}
                    onChange={(e) => setNewProject(prev => ({ ...prev, progress: Number(e.target.value) }))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                    required
                  />
                  <span className="px-3 py-2 bg-gray-100 rounded-lg text-gray-600 font-medium">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={newProject.status || "In Progress"}
                  onChange={(e) => setNewProject(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              {loading ? "Adding..." : "Add Project"}
            </button>
          </form>
        </div>

        {/* Projects List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Projects ({projects.length})</h3>
          </div>
          {projects.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No projects added yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {projects.map((project) => (
                <div key={project.id} className="px-6 py-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg">{project.projectName}</h4>
                      <p className="text-sm text-gray-600 mt-1">Manager: <span className="font-medium">{project.projectManager}</span></p>
                    </div>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete project"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{project.progress}%</span>
                        {savingProjects.has(project.id) && (
                          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          project.progress >= 80 ? 'bg-green-500' :
                          project.progress >= 50 ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Progress Input */}
                  <div className="flex gap-2 items-end">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={project.progress}
                      onChange={(e) => handleUpdateProgress(project.id, Number(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      disabled={savingProjects.has(project.id)}
                    />
                    <div className="px-3 py-2 bg-gray-100 rounded text-sm font-medium text-gray-700 min-w-fit">
                      {project.status || "In Progress"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Saved Projects Summary */}
        <div className="bg-white mt-8 p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Saved Projects</h3>
          {fetchLoading ? (
            <p className="text-gray-600">Loading...</p>
          ) : projects.length === 0 ? (
            <p className="text-gray-600">No projects saved yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Project</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Manager</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Progress</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {projects.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-800">{p.projectName}</td>
                      <td className="px-3 py-2 text-sm text-gray-800">{p.projectManager}</td>
                      <td className="px-3 py-2 text-sm text-gray-800">{p.progress}%</td>
                      <td className="px-3 py-2 text-sm text-gray-800">{p.status}</td>
                      <td className="px-3 py-2 text-sm">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setNewProject({
                                projectName: p.projectName,
                                projectManager: p.projectManager,
                                progress: p.progress,
                                status: p.status,
                              });
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Load
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(p.id)}
                            className="px-3 py-1 rounded-md border border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
