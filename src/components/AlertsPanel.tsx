"use client";

import { useState, useEffect } from "react";
import { 
  BellAlertIcon, 
  XMarkIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface Alert {
  id: string;
  type: string;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    fetchAlerts();
    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  };

  const dismissAlert = (alertId: string) => {
    setDismissed([...dismissed, alertId]);
  };

  const visibleAlerts = alerts.filter(a => !dismissed.includes(a.id));
  const criticalCount = visibleAlerts.filter(a => a.priority === "critical").length;
  const highCount = visibleAlerts.filter(a => a.priority === "high").length;

  const getIcon = (type: string) => {
    switch (type) {
      case "RED_ISSUE_ESCALATION":
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      case "UPCOMING_EVENT":
        return <CalendarIcon className="w-5 h-5" />;
      case "WEEKLY_REPORT_REMINDER":
        return <DocumentTextIcon className="w-5 h-5" />;
      case "OVERDUE_TODO":
        return <CheckCircleIcon className="w-5 h-5" />;
      default:
        return <BellAlertIcon className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <>
      {/* Alert Badge - Fixed to top right on mobile */}
      <div className="fixed top-20 right-4 md:relative md:top-0 md:right-0 z-30">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all border-2 border-orange-400"
          aria-label="View alerts"
        >
          <BellAlertIcon className="w-6 h-6 text-orange-600 animate-pulse" />
          {visibleAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-600 rounded-full">
              {visibleAlerts.length}
            </span>
          )}
        </button>
      </div>

      {/* Alerts Panel */}
      {isOpen && (
        <>
          {/* Mobile Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed top-32 right-4 md:absolute md:top-12 md:right-0 w-[calc(100vw-2rem)] md:w-96 max-h-[70vh] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <div className="flex items-center gap-2">
                <BellAlertIcon className="w-5 h-5" />
                <h3 className="font-bold">Alerts & Reminders</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Summary */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">
                  {visibleAlerts.length} active alert{visibleAlerts.length !== 1 ? "s" : ""}
                </span>
                <div className="flex gap-2">
                  {criticalCount > 0 && (
                    <span className="px-2 py-1 text-xs font-bold text-red-700 bg-red-100 rounded">
                      {criticalCount} critical
                    </span>
                  )}
                  {highCount > 0 && (
                    <span className="px-2 py-1 text-xs font-bold text-orange-700 bg-orange-100 rounded">
                      {highCount} high
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Alerts List */}
            <div className="overflow-y-auto max-h-[calc(70vh-120px)]">
              {visibleAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border-l-4 ${
                    alert.priority === "critical"
                      ? "border-red-500 bg-red-50/30"
                      : alert.priority === "high"
                      ? "border-orange-500 bg-orange-50/30"
                      : "border-yellow-500 bg-yellow-50/30"
                  } border-b border-gray-200 hover:bg-white transition-colors`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getPriorityColor(alert.priority)}`}>
                      {getIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-gray-900">
                          {alert.title}
                        </h4>
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title="Dismiss"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-gray-700">{alert.message}</p>
                      {alert.actionUrl && (
                        <a
                          href={alert.actionUrl}
                          className="inline-block mt-2 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          {alert.actionText || "View"}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
