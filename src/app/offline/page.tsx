"use client";

import { useEffect, useState } from "react";
import { WifiIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const checkOnline = () => setIsOnline(navigator.onLine);
    
    checkOnline();
    window.addEventListener("online", checkOnline);
    window.addEventListener("offline", checkOnline);

    return () => {
      window.removeEventListener("online", checkOnline);
      window.removeEventListener("offline", checkOnline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.href = "/dashboard";
    } else {
      alert("You're still offline. Please check your internet connection.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Offline Icon */}
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
              <WifiIcon className="w-12 h-12 text-gray-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold leading-none">✕</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            You&apos;re Offline
          </h1>

          {/* Status Message */}
          <p className="text-gray-600 mb-6">
            {isOnline 
              ? "Connection restored! You can now return to the dashboard."
              : "No internet connection. Please check your network settings and try again."
            }
          </p>

          {/* Status Bar */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 ${
            isOnline 
              ? "bg-green-100 text-green-800" 
              : "bg-red-100 text-red-800"
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}></span>
            {isOnline ? "Back Online" : "Offline Mode"}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                isOnline
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!isOnline}
            >
              <ArrowPathIcon className="w-5 h-5" />
              {isOnline ? "Return to Dashboard" : "Waiting for Connection..."}
            </button>

            {!isOnline && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-blue-900 text-sm mb-2">
                  Offline Features Available:
                </h3>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• View previously loaded dashboard data</li>
                  <li>• Read cached reports and documents</li>
                  <li>• Draft content (will sync when online)</li>
                  <li>• Access user profile information</li>
                </ul>
              </div>
            )}
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 mt-6">
            Tip: Once you&apos;re back online, all your offline actions will sync automatically.
          </p>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Having trouble? Try these steps:
          </p>
          <ul className="mt-2 text-xs text-gray-600 space-y-1">
            <li>• Check your WiFi or mobile data connection</li>
            <li>• Restart your router if using WiFi</li>
            <li>• Move to an area with better signal</li>
            <li>• Contact IT support if the problem persists</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
