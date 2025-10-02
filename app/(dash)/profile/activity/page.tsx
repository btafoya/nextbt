// /app/(dash)/profile/activity/page.tsx
import { requireSession } from "@/lib/auth";
import UserActivityLog from "@/components/profile/UserActivityLog";

export default async function ProfileActivityPage() {
  await requireSession();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold dark:text-white">Activity Log</h1>
      <p className="text-gray-600 dark:text-gray-400">
        View your login/logout history and profile changes
      </p>
      <UserActivityLog />
    </div>
  );
}
