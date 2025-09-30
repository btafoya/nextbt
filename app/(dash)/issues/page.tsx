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
  const session = requireSession();
  const issues = await prisma.mantis_bug_table.findMany({
    where: { project_id: { in: session.projects } },
    orderBy: { last_updated: "desc" },
    take: 50
  });
  return issues;
}

export default async function IssuesPage() {
  const issues = await getIssues();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Issues</h1>
        <Link href="/issues/new">
          <Button className="bg-blue-600 text-white hover:bg-blue-700">New Issue</Button>
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
