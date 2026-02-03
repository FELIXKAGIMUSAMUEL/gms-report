"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeftIcon, CheckCircleIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";

interface UpcomingEvent {
  id: string;
  date: string;
  activity: string;
  inCharge: string;
  rate?: string;
  priority?: string;
  status?: string;
}

export default function EventsEntryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [newEvent, setNewEvent] = useState<Partial<UpcomingEvent>>({
    date: new Date().toISOString().split("T")[0],
    activity: "",
    inCharge: "",
    priority: "Medium",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch existing events
  useEffect(() => {
    if (status === "authenticated") {
      fetchEvents();
    }
  }, [status]);

  const fetchEvents = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch("/api/events");
      if (response.ok) {
        const data = await response.json();
        setEvents(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!newEvent.activity || !newEvent.inCharge || !newEvent.date) {
        throw new Error("All fields are required");
      }

      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newEvent.date,
          activity: newEvent.activity,
          inCharge: newEvent.inCharge,
          rate: newEvent.priority || "Medium",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save event");
      }

      setSuccess(true);
      setNewEvent({
        date: new Date().toISOString().split("T")[0],
        activity: "",
        inCharge: "",
        priority: "Medium",
      });

      setTimeout(() => setSuccess(false), 3000);
      await fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events?id=${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      await fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
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
          <h1 className="text-3xl font-bold text-gray-900">Manage Upcoming Events</h1>
          <p className="text-gray-600 mt-2">Add, view, and manage school activities and events</p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">Event saved successfully!</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Add New Event Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Event</h3>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
                <input
                  type="date"
                  value={newEvent.date || ""}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={newEvent.priority || "Medium"}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Activity/Event Name</label>
              <input
                type="text"
                value={newEvent.activity || ""}
                onChange={(e) => setNewEvent(prev => ({ ...prev, activity: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="e.g., Staff Meeting, Sports Day, Parent-Teacher Conference"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Person In Charge</label>
              <input
                type="text"
                value={newEvent.inCharge || ""}
                onChange={(e) => setNewEvent(prev => ({ ...prev, inCharge: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="Name of responsible person"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              {loading ? "Adding..." : "Add Event"}
            </button>
          </form>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Events ({events.length})</h3>
          </div>
          {events.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No events added yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {events.map((event) => (
                <div key={event.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{event.activity}</h4>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>📅 {new Date(event.date).toLocaleDateString("en-US", { 
                          weekday: "long", 
                          year: "numeric", 
                          month: "long", 
                          day: "numeric" 
                        })}</p>
                        <p>👤 {event.inCharge}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        (event.rate || event.priority) === 'High' ? 'bg-red-100 text-red-800' :
                        (event.rate || event.priority) === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {event.rate || event.priority || 'Medium'}
                      </span>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete event"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Saved Events Summary */}
        <div className="bg-white mt-8 p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Saved Events</h3>
          {fetchLoading ? (
            <p className="text-gray-600">Loading...</p>
          ) : events.length === 0 ? (
            <p className="text-gray-600">No events saved yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Activity</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">In Charge</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Priority</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {events.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-800">{new Date(e.date).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-sm text-gray-800">{e.activity}</td>
                      <td className="px-3 py-2 text-sm text-gray-800">{e.inCharge}</td>
                      <td className="px-3 py-2 text-sm text-gray-800">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (e.rate || e.priority) === 'High' ? 'bg-red-100 text-red-800' :
                          (e.rate || e.priority) === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {e.rate || e.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setNewEvent({
                                date: e.date,
                                activity: e.activity,
                                inCharge: e.inCharge,
                                priority: e.rate || e.priority || 'Medium',
                              });
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Load
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(e.id)}
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
