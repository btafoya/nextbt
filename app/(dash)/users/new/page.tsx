// /app/(dash)/users/new/page.tsx
import { requireAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { UserForm } from "@/components/users/UserForm";

// Disable caching to ensure real-time data updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewUserPage() {
  try {
    await requireAdmin();
  } catch {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Create New User</h1>
      <UserForm mode="create" />
    </div>
  );
}