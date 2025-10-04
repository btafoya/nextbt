"use client";

import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";

interface Subscription {
  id: string;
  endpoint: string;
  userAgent: string;
  createdAt: string;
}

interface VapidKeyResponse {
  publicKey: string;
}

export default function WebPushManager() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [vapidKey, setVapidKey] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [message, setMessage] = useState("");
  const [browserSupported, setBrowserSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // Check browser support client-side only
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;

    console.log('[WebPush] Browser support check:', {
      hasServiceWorker,
      hasPushManager,
      navigator: typeof navigator,
      window: typeof window
    });

    const isSupported = hasServiceWorker && hasPushManager;
    console.log('[WebPush] Setting browserSupported to:', isSupported);
    setBrowserSupported(isSupported);

    if (!isSupported) {
      setMessage("Your browser does not support Web Push notifications");
      console.log('[WebPush] Browser NOT supported');
    } else {
      console.log('[WebPush] Browser IS supported');
    }

    fetchVapidKey();
    fetchSubscriptions();
  }, []);

  async function fetchVapidKey() {
    try {
      console.log('[WebPush] Fetching VAPID key...');
      const res = await fetch("/api/profile/webpush/vapid-key");
      console.log('[WebPush] VAPID key response status:', res.status);

      if (res.ok) {
        const data: VapidKeyResponse = await res.json();
        console.log('[WebPush] VAPID key received:', data.publicKey ? 'Yes' : 'No');
        setVapidKey(data.publicKey);
      } else if (res.status === 401 || res.status === 403) {
        console.log('[WebPush] Auth error, redirecting to login');
        window.location.href = "/login";
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('[WebPush] VAPID key fetch failed:', res.status, errorData);
        setMessage(`Failed to load VAPID key: ${res.status}`);
      }
    } catch (error) {
      console.error('[WebPush] Error fetching VAPID key:', error);
      logger.error("Error fetching VAPID key:", error);
      setMessage("Error loading push notification settings");
    }
  }

  async function fetchSubscriptions() {
    try {
      const res = await fetch("/api/profile/webpush/subscriptions");
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
      } else if (res.status === 401 || res.status === 403) {
        window.location.href = "/login";
      }
    } catch (error) {
      logger.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  }

  async function subscribeToPush() {
    if (browserSupported !== true) {
      setMessage("Browser does not support push notifications");
      return;
    }

    // Check current notification permission
    if (Notification.permission === "denied") {
      setMessage("Notifications are blocked. Please enable them in your browser settings and reload the page.");
      return;
    }

    setSubscribing(true);
    setMessage("");

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Convert VAPID key to Uint8Array
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
          .replace(/-/g, "+")
          .replace(/_/g, "/");

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Send subscription to server
      const res = await fetch("/api/profile/webpush/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (res.ok) {
        setMessage("Successfully subscribed to push notifications");
        setTimeout(() => setMessage(""), 3000);
        fetchSubscriptions();
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to subscribe");
      }
    } catch (error) {
      logger.error("Error subscribing to push:", error);

      // Check if error is due to permission denial
      if (error instanceof Error) {
        if (error.name === "NotAllowedError" || error.message.includes("permission")) {
          setMessage("Permission denied. Please enable notifications in your browser settings.");
        } else if (error.message.includes("service worker")) {
          setMessage("Service worker registration failed. Please refresh the page and try again.");
        } else {
          setMessage(`Error subscribing: ${error.message}`);
        }
      } else {
        setMessage("Error subscribing to push notifications");
      }
    } finally {
      setSubscribing(false);
    }
  }

  async function unsubscribe(endpoint: string) {
    try {
      const res = await fetch("/api/profile/webpush/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });

      if (res.ok) {
        setMessage("Successfully unsubscribed");
        setTimeout(() => setMessage(""), 3000);
        fetchSubscriptions();
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to unsubscribe");
      }
    } catch (error) {
      logger.error("Error unsubscribing:", error);
      setMessage("Error unsubscribing from push notifications");
    }
  }

  async function sendTestNotification() {
    try {
      const res = await fetch("/api/profile/webpush/test", {
        method: "POST",
      });

      if (res.ok) {
        setMessage("Test notification sent successfully");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to send test notification");
      }
    } catch (error) {
      logger.error("Error sending test notification:", error);
      setMessage("Error sending test notification");
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function truncateEndpoint(endpoint: string) {
    if (endpoint.length <= 50) return endpoint;
    return endpoint.substring(0, 47) + "...";
  }

  if (loading) {
    return (
      <div className="text-center py-8 dark:text-bodydark">
        Loading Web Push settings...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-boxdark border dark:border-strokedark rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">
        Web Push Notifications
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Receive browser push notifications for important updates even when NextBT is closed.
      </p>

      {/* Browser Compatibility Warning */}
      {browserSupported === false && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-300">
            ⚠️ Your browser does not support Web Push notifications. Please use a modern browser like Chrome, Firefox, or Edge.
          </p>
        </div>
      )}

      {/* Subscribe Button */}
      {browserSupported === true && (
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={subscribeToPush}
            disabled={subscribing || !vapidKey}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {subscribing ? "Subscribing..." : "🔔 Subscribe to Push Notifications"}
          </button>

          {subscriptions.length > 0 && (
            <button
              onClick={sendTestNotification}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              📤 Send Test Notification
            </button>
          )}
        </div>
      )}

      {/* Status Message */}
      {message && (
        <div
          className={`mb-6 p-3 rounded-lg ${
            message.includes("success") || message.includes("Successfully")
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          {message}
        </div>
      )}

      {/* Active Subscriptions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold dark:text-white">
          Active Subscriptions ({subscriptions.length})
        </h3>

        {subscriptions.length === 0 ? (
          <div className="p-4 border dark:border-strokedark rounded-lg text-center text-gray-500 dark:text-gray-400">
            No active push subscriptions. Click &quot;Subscribe to Push Notifications&quot; to enable.
          </div>
        ) : (
          <div className="space-y-3">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 border dark:border-strokedark rounded-lg hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">📱</span>
                      <span className="font-medium dark:text-white">
                        {sub.userAgent || "Unknown Device"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>
                        <span className="font-medium">Endpoint:</span>{" "}
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {truncateEndpoint(sub.endpoint)}
                        </code>
                      </p>
                      <p>
                        <span className="font-medium">Created:</span> {formatDate(sub.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => unsubscribe(sub.endpoint)}
                    className="ml-4 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Unsubscribe
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
          🔔 About Web Push Notifications
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>
            Push notifications work even when your browser is closed (if browser allows)
          </li>
          <li>
            Each device/browser requires a separate subscription
          </li>
          <li>
            You can unsubscribe any device at any time
          </li>
          <li>
            Notifications are sent via the Web Push API standard (VAPID)
          </li>
          <li>
            Permission must be granted by your browser before subscribing
          </li>
        </ul>
      </div>
    </div>
  );
}
