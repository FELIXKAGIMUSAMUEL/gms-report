"use client";

import { useEffect, useState } from "react";

export default function PushNotificationSetup() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);

      // Check for existing subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setSubscription(existingSubscription);
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const subscribeToPush = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        alert('Push notification permission denied');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // In production, you'd get this from your backend
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'YOUR_VAPID_PUBLIC_KEY';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      setSubscription(subscription);

      // Send subscription to backend
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      console.log('Push subscription successful:', subscription);
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        setSubscription(null);

        // Remove subscription from backend
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
      }
    } catch (error) {
      console.error('Unsubscribe failed:', error);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Push Notifications</h3>
          <p className="text-xs text-gray-600 mt-1">
            {subscription ? '✓ Enabled' : 'Get alerts on your device'}
          </p>
        </div>
        {permission === 'granted' && subscription ? (
          <button
            onClick={unsubscribeFromPush}
            className="px-4 py-2 text-sm font-semibold text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
          >
            Disable
          </button>
        ) : (
          <button
            onClick={subscribeToPush}
            className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Enable
          </button>
        )}
      </div>
    </div>
  );
}

// VAPID key conversion
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
