"use client";

import { useEffect, useState } from "react";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed-until";
const SNOOZE_DAYS = 3; // re-show after 3 days if dismissed

export default function PWAInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already running as installed PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    // Check snooze/dismiss timestamp
    const until = localStorage.getItem(DISMISSED_KEY);
    if (until && Date.now() < Number(until)) return;

    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;
    const android = /android/i.test(ua);
    setIsIOS(ios);
    setIsAndroid(android);

    if (ios) {
      // iOS Safari only (no beforeinstallprompt)
      const isSafari = /safari/i.test(ua) && !/crios|fxios/i.test(ua);
      if (isSafari) setShow(true);
      return;
    }

    // Android Chrome + desktop Chrome — wait for browser prompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Listen for successful installation
  useEffect(() => {
    const handler = () => setShow(false);
    window.addEventListener("appinstalled", handler);
    return () => window.removeEventListener("appinstalled", handler);
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    setShow(false);
    if (outcome === "dismissed") {
      // Snooze for 3 days
      localStorage.setItem(DISMISSED_KEY, String(Date.now() + SNOOZE_DAYS * 86_400_000));
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now() + SNOOZE_DAYS * 86_400_000));
    setShow(false);
  };

  if (installed || !show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="mx-3 mb-3 sm:mx-auto sm:max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Brand accent bar */}
        <div className="h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400" />

        <div className="p-4 flex items-start gap-3">
          {/* App icon */}
          <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden shadow-md border border-gray-100 bg-white flex items-center justify-center">
            <img src="/sak.jpg" alt="SAK" className="w-12 h-12 object-contain" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight">
              {isAndroid ? "Add GMS Report to Home" : "Install GMS Report"}
            </p>

            {isAndroid ? (
              <>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                  Install on your Android device for fast access, offline use, and push notifications &mdash; no Play Store needed.
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    onClick={handleInstall}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                  >
                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                    Add to Home Screen
                  </button>
                  <button onClick={handleDismiss} className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 font-medium">
                    Later
                  </button>
                </div>
              </>
            ) : isIOS ? (
              <>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                  Add to your home screen for instant access and notifications.
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                  <span>Tap</span>
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 rounded text-blue-700 font-bold">⬆</span>
                  <span>then &ldquo;Add to Home Screen&rdquo;</span>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                  Add to your home screen for fast access, offline use, and push notifications.
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    onClick={handleInstall}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                  >
                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                    Install App
                  </button>
                  <button onClick={handleDismiss} className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 font-medium">
                    Later
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Dismiss"
          >
            <XMarkIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Android hint footer */}
        {isAndroid && (
          <div className="px-4 pb-3 flex items-center gap-1.5 text-[10px] text-gray-400">
            <span>✓ No Play Store needed</span>
            <span className="mx-1">·</span>
            <span>✓ Works offline</span>
            <span className="mx-1">·</span>
            <span>✓ Push notifications</span>
          </div>
        )}
      </div>
    </div>
  );
}
