"use client";

import { useEffect, useState, useCallback } from "react";
import { BellAlertIcon, XMarkIcon } from "@heroicons/react/24/outline";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

interface PushNotificationManagerProps {
  onSubscribed?: () => void;
}

export default function PushNotificationManager({
  onSubscribed,
}: PushNotificationManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);

      // Show prompt if not subscribed and permission not denied
      if (!subscription && Notification.permission === "default") {
        // Wait a bit before showing prompt (don't be annoying immediately)
        setTimeout(() => setShowPrompt(true), 3000);
      }
    } catch (err) {
      console.error("Error checking subscription:", err);
    }
  }, []);

  const subscribeToPush = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setError("Notification permission denied");
        setShowPrompt(false);
        return;
      }

      // Register service worker if not already registered
      if (!("serviceWorker" in navigator)) {
        setError("Service workers not supported");
        return;
      }

      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
      }

      // Subscribe to push notifications
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setError("Push notifications not configured");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
      const response = await fetch("/api/push-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            auth: arrayBufferToBase64(subscription.getKey("auth")!),
            p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
          },
          userAgent: navigator.userAgent,
          deviceName: getDeviceName(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription");
      }

      setIsSubscribed(true);
      setShowPrompt(false);
      onSubscribed?.();

      // Show a test notification
      new Notification("Push Notifications Enabled! 🎉", {
        body: "You'll now receive important updates from the GM Portal.",
        icon: "/icon-192x192.png",
      });
    } catch (err: any) {
      console.error("Error subscribing to push:", err);
      setError(err.message || "Failed to enable notifications");
    } finally {
      setLoading(false);
    }
  }, [onSubscribed]);

  const unsubscribeFromPush = useCallback(async () => {
    try {
      setLoading(true);
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Remove from server
        await fetch("/api/push-subscription", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });

        setIsSubscribed(false);
      }
    } catch (err) {
      console.error("Error unsubscribing from push:", err);
      setError("Failed to disable notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  const getDeviceName = () => {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) return "Android Device";
    if (/iPhone|iPad|iPod/i.test(ua)) return "iOS Device";
    if (/Windows/i.test(ua)) return "Windows PC";
    if (/Mac/i.test(ua)) return "Mac";
    if (/Linux/i.test(ua)) return "Linux PC";
    return "Unknown Device";
  };

  // Don't render anything if notifications not supported
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return null;
  }

  // Prompt card
  if (showPrompt && !isSubscribed && permission !== "denied") {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-md animate-slide-up">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-2xl p-4 text-white">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <BellAlertIcon className="w-8 h-8 animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">Stay Updated!</h3>
              <p className="text-sm text-blue-100 mb-3">
                Get instant notifications for reactions, comments, issue updates, and important events.
              </p>
              {error && (
                <p className="text-xs text-red-200 bg-red-900/30 rounded px-2 py-1 mb-2">
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={subscribeToPush}
                  disabled={loading}
                  className="flex-1 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50 text-sm"
                >
                  {loading ? "Enabling..." : "Enable Notifications"}
                </button>
                <button
                  onClick={() => setShowPrompt(false)}
                  className="px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Settings toggle (small persistent button)
  return (
    <div className="fixed bottom-4 right-4 z-40">
      {isSubscribed ? (
        <button
          onClick={unsubscribeFromPush}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-green-700 transition-all flex items-center gap-2 text-sm font-medium disabled:opacity-50"
          title="Push notifications enabled"
        >
          <BellAlertIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Notifications ON</span>
        </button>
      ) : permission === "denied" ? (
        <div
          className="bg-gray-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm"
          title="Enable in browser settings"
        >
          <BellAlertIcon className="w-5 h-5 opacity-50" />
          <span className="hidden sm:inline">Blocked</span>
        </div>
      ) : null}
    </div>
  );
}
