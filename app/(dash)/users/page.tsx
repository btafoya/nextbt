// /app/(dash)/users/page.tsx
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/db/client";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getUsers() {
  try {
    requireAdmin();

    const users = await prisma.mantis_user_table.findMany({
      select: {
        id: true,
        username: true,
        realname: true,
        email: true,
        enabled: true,
        protected: true,
        access_level: true,
        last_visit: true,
      },
      orderBy: { username: 'asc' }
    });

    return users;
  } catch {
    return null;
  }
}

function getAccessLevelLabel(level: number): string {
  if (level >= 90) return "Administrator";
  if (level >= 70) return "Manager";
  if (level >= 55) return "Developer";
  if (level >= 40) return "Updater";
  if (level >= 25) return "Reporter";
  return "Viewer";
}

function getAccessLevelColor(level: number): string {
  if (level >= 90) return "text-red-600 font-semibold";
  if (level >= 70) return "text-purple-600 font-medium";
  if (level >= 55) return "text-blue-600";
  if (level >= 40) return "text-green-600";
  return "text-gray-600";
}

export default async function UsersPage() {
  const users = await getUsers();

  if (!users) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Link
          href="/users/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Add User
        </Link>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Real Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Access Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Visit</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">{user.username}</span>
                    {user.protected === 1 && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Protected
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{user.realname || "-"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getAccessLevelColor(user.access_level)}>
                    {getAccessLevelLabel(user.access_level)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.enabled === 1 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Enabled
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Disabled
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {user.last_visit ? new Date(user.last_visit * 1000).toLocaleDateString() : "Never"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <Link
                    href={`/users/${user.id}/edit`}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </Link>
                  {user.protected !== 1 && (
                    <Link
                      href={`/users/${user.id}/delete`}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}