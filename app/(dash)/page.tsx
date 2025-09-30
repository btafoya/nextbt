// /app/(dash)/page.tsx
import Link from "next/link";
import { prisma } from "@/db/client";
import { requireSession } from "@/lib/auth";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./issues/columns";
import { Button } from "@/components/ui/button";

// Disable caching to ensure real-time data updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getAssignedIssues() {
  const session = requireSession();

  // Get active projects for current user
  const activeProjects = await prisma.mantis_project_table.findMany({
    where: {
      id: { in: session.projects },
      enabled: 1,
      status: { in: [10, 30, 50] } // development, release, stable (exclude obsolete)
    },
    select: { id: true }
  });

  const activeProjectIds = activeProjects.map(p => p.id);

  // Get issues assigned to current user that are not resolved/closed
  // Status < 80 means not resolved (80=Resolved, 90=Closed)
  const issues = await prisma.mantis_bug_table.findMany({
    where: {
      project_id: { in: activeProjectIds },
      handler_id: session.uid,
      status: { lt: 80 }
    },
    include: {
      project: {
        select: {
          name: true
        }
      }
    },
    orderBy: { last_updated: "desc" },
    take: 20
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

async function getReportedIssues() {
  const session = requireSession();

  // Get active projects for current user
  const activeProjects = await prisma.mantis_project_table.findMany({
    where: {
      id: { in: session.projects },
      enabled: 1,
      status: { in: [10, 30, 50] } // development, release, stable (exclude obsolete)
    },
    select: { id: true }
  });

  const activeProjectIds = activeProjects.map(p => p.id);

  // Get issues reported by current user that are not resolved/closed
  const issues = await prisma.mantis_bug_table.findMany({
    where: {
      project_id: { in: activeProjectIds },
      reporter_id: session.uid,
      status: { lt: 80 }
    },
    include: {
      project: {
        select: {
          name: true
        }
      }
    },
    orderBy: { last_updated: "desc" },
    take: 10
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

export default async function HomePage() {
  const session = requireSession();
  const [assignedIssues, reportedIssues] = await Promise.all([
    getAssignedIssues(),
    getReportedIssues()
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/issues/new">
          <Button className="bg-blue-600 text-white hover:bg-blue-700">Create New Issue</Button>
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
