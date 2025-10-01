// /components/issues/NotificationRecipients.tsx
import { getNotificationRecipients } from "@/lib/notify/recipients";
import { secrets } from "@/config/secrets";

export default async function NotificationRecipients({ issueId }: { issueId: number }) {
  const recipients = await getNotificationRecipients(issueId);

  if (recipients.length === 0) {
    return null;
  }

  const enabledCount = recipients.filter(r => r.willReceive).length;

  return (
    <div className="bg-white dark:bg-boxdark border dark:border-strokedark rounded p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold dark:text-white">
          Notification Recipients
        </h2>
        <div className="flex items-center gap-2">
          {secrets.postmarkEnabled ? (
            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
              Email Enabled
            </span>
          ) : (
            <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
              Email Disabled
            </span>
          )}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {enabledCount} of {recipients.length} will receive notifications
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {recipients.map((recipient) => (
          <div
            key={recipient.id}
            className={`flex items-center justify-between p-3 rounded border ${
              recipient.willReceive
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  recipient.willReceive
                    ? "bg-green-500 dark:bg-green-400"
                    : "bg-gray-400 dark:bg-gray-600"
                }`}
              />
              <div>
                <div className="font-medium dark:text-white">
                  {recipient.realname || recipient.username}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {recipient.email}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-xs ${
                  recipient.willReceive
                    ? "text-green-700 dark:text-green-300"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {recipient.reason}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!secrets.postmarkEnabled && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> Email notifications are currently disabled in configuration.
            Enable Postmark in <code className="text-xs bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">config/secrets.ts</code> to send notifications.
          </p>
        </div>
      )}
    </div>
  );
}
