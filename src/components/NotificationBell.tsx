"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BellIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error loading notifications", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, markAsRead: true }),
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
    } catch (error) {
      console.error("Failed to mark notification read", error);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;
    try {
      await Promise.all(
        unread.map((notification) =>
          fetch("/api/notifications", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notificationId: notification.id, markAsRead: true }),
          })
        )
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    } catch (error) {
      console.error("Failed to mark all notifications read", error);
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  }, []);

  const toggleOpen = async () => {
    if (!open) {
      await fetchNotifications();
    }
    setOpen(!open);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <BellIcon className="h-6 w-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-2 py-1 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div>
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              <p className="text-xs text-gray-500">Messages, reports, and system updates</p>
            </div>
            <div className="flex items-center gap-2">
              {loading && <ArrowPathIcon className="h-4 w-4 text-gray-400 animate-spin" />}
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all read
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y">
            {notifications.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-500 text-center">No notifications yet.</p>
            )}

            {notifications.map((notification) => (
              <div key={notification.id} className="px-4 py-3 flex gap-3">
                <div className="pt-1">
                  {notification.isRead ? (
                    <CheckCircleIcon className="h-4 w-4 text-gray-300" />
                  ) : (
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-1" aria-hidden />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{notification.title}</p>
                    <p className="text-[11px] text-gray-500 whitespace-nowrap">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 overflow-hidden text-ellipsis">{notification.message}</p>
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Clear notification"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
