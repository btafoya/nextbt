// /app/(dash)/users/[id]/edit/page.tsx
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/db/client";
import { notFound } from "next/navigation";
import { UserForm } from "@/components/users/UserForm";

// Disable caching to ensure real-time data updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getUser(id: number) {
  try {
    requireAdmin();

    const user = await prisma.mantis_user_table.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        realname: true,
        email: true,
        enabled: true,
        access_level: true,
      }
    });

    return user;
  } catch {
    return null;
  }
}

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const userId = parseInt(params.id, 10);
  if (isNaN(userId)) {
    notFound();
  }

  const user = await getUser(userId);
  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edit User: {user.username}</h1>
      <UserForm mode="edit" user={user} />
    </div>
  );
}