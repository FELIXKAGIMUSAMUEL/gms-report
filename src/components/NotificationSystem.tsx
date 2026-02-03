import { useEffect, useState, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [displayedNotifications, setDisplayedNotifications] = useState<string[]>([]);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?unreadOnly=true');
      if (response.ok) {
        const data = await response.json();
        
        // Get list of unread notification IDs
        const unreadIds = data.filter((n: NotificationItem) => !n.isRead).map((n: NotificationItem) => n.id);
        
        // Show only new notifications (not already displayed)
        const newNotifications = unreadIds.filter((id: string) => !displayedNotifications.includes(id));
        
        if (newNotifications.length > 0) {
          setDisplayedNotifications(prev => [...prev, ...newNotifications]);
        }
        
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [displayedNotifications]);

  // Fetch notifications every 10 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (displayedNotifications.length === 0) return;

    const lastNotificationId = displayedNotifications[displayedNotifications.length - 1];
    const timer = setTimeout(() => {
      dismissNotification(lastNotificationId);
    }, 5000);

    return () => clearTimeout(timer);
  }, [displayedNotifications]);

  const dismissNotification = async (notificationId: string) => {
    try {
      // Mark as read
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, markAsRead: true }),
      });

      // Remove from displayed
      setDisplayedNotifications(prev => prev.filter(id => id !== notificationId));
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {displayedNotifications.map((notificationId) => {
        const notification = notifications.find(n => n.id === notificationId);
        if (!notification) return null;

        return (
          <div
            key={notificationId}
            className="bg-white rounded-lg shadow-lg border-l-4 border-blue-500 p-4 max-w-sm animate-slide-in"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {notification.title}
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => dismissNotification(notificationId)}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
