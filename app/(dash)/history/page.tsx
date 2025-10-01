import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import HistoryLog from "@/components/history/HistoryLog";

export const metadata: Metadata = {
  title: "Bug History Log | NextBT",
  description: "Complete bug history log for all issues",
};

export default async function HistoryPage() {
  // Ensure user is admin
  await requireAdmin();

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Bug History Log
        </h2>
      </div>

      <div className="flex flex-col gap-10">
        <HistoryLog />
      </div>
    </>
  );
}
