// /app/(dash)/users/page.tsx
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/db/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";

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

      <DataTable columns={columns} data={users} searchColumn="username" />
    </div>
  );
}