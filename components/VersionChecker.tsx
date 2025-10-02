"use client";

import { useEffect, useState } from "react";

/**
 * Version Checker Component
 * Periodically checks for new builds and prompts user to reload
 */
export default function VersionChecker() {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    // Fetch initial version
    fetch("/api/build-version")
      .then((res) => res.json())
      .then((data) => setCurrentVersion(data.version))
      .catch(console.error);

    // Check for updates every 5 minutes
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/build-version", {
          cache: "no-store",
        });
        const data = await res.json();

        if (currentVersion && data.version !== currentVersion) {
          setShowUpdatePrompt(true);
        }
      } catch (error) {
        console.error("Version check failed:", error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [currentVersion]);

  const handleReload = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-stroke bg-white p-4 shadow-lg dark:border-strokedark dark:bg-boxdark">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="mb-1 font-semibold text-black dark:text-white">
            Update Available
          </h3>
          <p className="text-sm text-bodydark1 dark:text-bodydark">
            A new version is available. Reload to get the latest updates.
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleReload}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
        >
          Reload Now
        </button>
        <button
          onClick={handleDismiss}
          className="rounded border border-stroke px-4 py-2 text-sm font-medium text-black hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
        >
          Later
        </button>
      </div>
    </div>
  );
}
