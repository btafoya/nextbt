// /app/(dash)/profile/notifications/page.tsx
"use client";

import { useState } from "react";
import NotificationPreferences from "@/components/profile/NotificationPreferences";
import DigestPreferences from "@/components/profile/DigestPreferences";
import WebPushManager from "@/components/profile/WebPushManager";
import NotificationHistory from "@/components/profile/NotificationHistory";
import NotificationFilters from "@/components/profile/NotificationFilters";

type Tab = "preferences" | "digest" | "webpush" | "history" | "filters";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("preferences");

  const tabs = [
    { id: "preferences" as Tab, label: "Email Preferences", icon: "📧" },
    { id: "digest" as Tab, label: "Digest Settings", icon: "📦" },
    { id: "webpush" as Tab, label: "Push Notifications", icon: "🔔" },
    { id: "history" as Tab, label: "History", icon: "📜" },
    { id: "filters" as Tab, label: "Filters", icon: "🔍" },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Notification Center
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your notification preferences, digest settings, push notifications, history, and filters
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b dark:border-strokedark">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors
                ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }
              `}
              aria-current={activeTab === tab.id ? "page" : undefined}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "preferences" && <NotificationPreferences />}
        {activeTab === "digest" && <DigestPreferences />}
        {activeTab === "webpush" && <WebPushManager />}
        {activeTab === "history" && <NotificationHistory />}
        {activeTab === "filters" && <NotificationFilters />}
      </div>
    </div>
  );
}
