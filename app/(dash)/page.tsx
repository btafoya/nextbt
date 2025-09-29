// /app/(dash)/page.tsx
import Link from "next/link";
import { prisma } from "@/db/client";
import { requireSession } from "@/lib/auth";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./issues/columns";

async function getAssignedIssues() {
  const session = requireSession();

  // Get issues assigned to current user that are not resolved/closed
  // Status < 80 means not resolved (80=Resolved, 90=Closed)
  const issues = await prisma.mantis_bug_table.findMany({
    where: {
      project_id: { in: session.projects },
      handler_id: session.uid,
      status: { lt: 80 }
    },
    orderBy: { last_updated: "desc" },
    take: 20
  });

  return issues;
}

async function getReportedIssues() {
  const session = requireSession();

  // Get issues reported by current user that are not resolved/closed
  const issues = await prisma.mantis_bug_table.findMany({
    where: {
      project_id: { in: session.projects },
      reporter_id: session.uid,
      status: { lt: 80 }
    },
    orderBy: { last_updated: "desc" },
    take: 10
  });

  return issues;
}

export default async function HomePage() {
  const session = requireSession();
  const [assignedIssues, reportedIssues] = await Promise.all([
    getAssignedIssues(),
    getReportedIssues()
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/issues" className="border rounded p-4 bg-white hover:shadow">
          <div className="font-semibold">Issues</div>
          <div className="text-sm text-gray-600">Browse and search</div>
        </Link>
        <Link href="/issues/new" className="border rounded p-4 bg-white hover:shadow">
          <div className="font-semibold">New Issue</div>
          <div className="text-sm text-gray-600">Create a simplified ticket</div>
        </Link>
        <Link href="/projects" className="border rounded p-4 bg-white hover:shadow">
          <div className="font-semibold">Projects</div>
          <div className="text-sm text-gray-600">Your accessible projects</div>
        </Link>
      </div>

      {/* Issues Assigned to Me */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Assigned to Me</h2>
          <Link href="/issues?filter=assigned" className="text-sm text-blue-600 hover:underline">
            View all →
          </Link>
        </div>

        {assignedIssues.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">
            No issues assigned to you
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={assignedIssues}
            searchColumn="summary"
            searchPlaceholder="Filter assigned issues..."
          />
        )}
      </div>

      {/* Issues Reported by Me */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Reported by Me</h2>
          <Link href="/issues?filter=reported" className="text-sm text-blue-600 hover:underline">
            View all →
          </Link>
        </div>

        {reportedIssues.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">
            No issues reported by you
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={reportedIssues}
            searchColumn="summary"
            searchPlaceholder="Filter reported issues..."
          />
        )}
      </div>
    </div>
  );
}
