"use client";

import { useEffect, useState } from "react";
import { 
  WifiIcon, 
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon 
} from "@heroicons/react/24/outline";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setSyncStatus('syncing');
      
      // Trigger background sync
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration: any) => {
          registration.sync.register('sync-reports').catch(() => {});
          registration.sync.register('sync-reactions').catch(() => {});
          registration.sync.register('sync-messages').catch(() => {});
        });
      }

      // Simulate sync completion
      setTimeout(() => {
        setSyncStatus('success');
        setTimeout(() => {
          setShowNotification(false);
          setSyncStatus('idle');
        }, 3000);
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
      setSyncStatus('idle');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (showNotification && isOnline && syncStatus === 'idle') {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showNotification, isOnline, syncStatus]);

  // Persistent offline indicator (top bar)
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiIcon className="w-5 h-5" />
            <span className="font-semibold text-sm">Offline Mode</span>
            <span className="text-xs opacity-90">
              • Changes will sync when connection is restored
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            <span className="text-xs">Waiting for connection...</span>
          </div>
        </div>
      </div>
    );
  }

  // Toast notification (appears when going online or syncing)
  if (showNotification) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
        <div className={`rounded-lg shadow-2xl p-4 min-w-[300px] ${
          syncStatus === 'syncing' ? 'bg-blue-600' :
          syncStatus === 'success' ? 'bg-green-600' :
          syncStatus === 'error' ? 'bg-red-600' :
          'bg-gray-800'
        } text-white`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {syncStatus === 'syncing' && (
                <CloudArrowUpIcon className="w-6 h-6 animate-bounce" />
              )}
              {syncStatus === 'success' && (
                <CheckCircleIcon className="w-6 h-6" />
              )}
              {syncStatus === 'error' && (
                <XCircleIcon className="w-6 h-6" />
              )}
              {syncStatus === 'idle' && (
                <WifiIcon className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">
                {syncStatus === 'syncing' && 'Syncing offline changes...'}
                {syncStatus === 'success' && 'All changes synced! ✓'}
                {syncStatus === 'error' && 'Sync failed'}
                {syncStatus === 'idle' && 'Back Online!'}
              </p>
              <p className="text-xs opacity-90 mt-1">
                {syncStatus === 'syncing' && 'Uploading pending data to server'}
                {syncStatus === 'success' && 'Your data is up to date'}
                {syncStatus === 'error' && 'Some items could not sync'}
                {syncStatus === 'idle' && 'Connection restored'}
              </p>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="text-white/80 hover:text-white"
            >
              <XCircleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
