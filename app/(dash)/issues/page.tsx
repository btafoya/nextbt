// /app/(dash)/issues/page.tsx
import Link from "next/link";
import { prisma } from "@/db/client";
import { requireSession } from "@/lib/auth";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";

// Disable caching to ensure real-time data updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getIssues() {
  const session = await requireSession();

  // Check if user is admin
  const user = await prisma.mantis_user_table.findUnique({
    where: { id: session.uid },
    select: { access_level: true }
  });

  const isAdmin = user && user.access_level >= 90;

  const issues = await prisma.mantis_bug_table.findMany({
    where: isAdmin ? {} : { project_id: { in: session.projects } },
    include: {
      project: {
        select: {
          name: true
        }
      }
    },
    orderBy: { last_updated: "desc" },
    take: 50
  });

  // Serialize for client component
  return issues.map(issue => ({
    id: issue.id,
    summary: issue.summary,
    status: issue.status,
    priority: issue.priority,
    last_updated: issue.last_updated,
    project: {
      name: issue.project.name
    }
  }));
}

export default async function IssuesPage() {
  const issues = await getIssues();

  return (
    <div className="space-y-4 pb-mobile-nav">
      <div className="flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-bold dark:text-white">Issues</h1>
        <Link href="/issues/new">
          <Button className="bg-blue-600 text-white hover:bg-blue-700 min-h-[44px]">Create New Issue</Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={issues}
        searchColumn="summary"
        searchPlaceholder="Filter issues..."
      />
    </div>
  );
}
