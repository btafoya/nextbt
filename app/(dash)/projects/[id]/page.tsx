// /app/(dash)/projects/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/db/client";
import { requireSession } from "@/lib/auth";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "../../issues/columns";

// Disable caching to ensure real-time data updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getProject(id: number) {
  const session = requireSession();

  // Check if user is admin
  const user = await prisma.mantis_user_table.findUnique({
    where: { id: session.uid },
    select: { access_level: true }
  });

  const isAdmin = user && user.access_level >= 90;

  const project = await prisma.mantis_project_table.findUnique({
    where: { id }
  });

  // Admins can access all projects, regular users only their assigned projects
  if (!project || (!isAdmin && !session.projects.includes(project.id))) {
    return null;
  }

  return project;
}

async function getProjectIssues(projectId: number) {
  const issues = await prisma.mantis_bug_table.findMany({
    where: { project_id: projectId },
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

async function canEditProject(projectId: number, userId: number) {
  const user = await prisma.mantis_user_table.findUnique({
    where: { id: userId }
  });

  // Admins can edit any project
  if (user && user.access_level >= 90) return true;

  // Check project-specific manager access
  const access = await prisma.mantis_project_user_list_table.findFirst({
    where: {
      project_id: projectId,
      user_id: userId,
      access_level: { gte: 70 } // Developer or Manager
    }
  });

  return !!access;
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const projectId = parseInt(params.id, 10);
  if (isNaN(projectId)) notFound();

  const session = requireSession();
  const [project, issues] = await Promise.all([
    getProject(projectId),
    getProjectIssues(projectId)
  ]);

  if (!project) notFound();

  const canEdit = await canEditProject(projectId, session.uid);

  const statusLabels: Record<number, string> = {
    10: "Development",
    30: "Release",
    50: "Stable",
    70: "Obsolete"
  };

  const viewStateLabels: Record<number, string> = {
    10: "Public",
    50: "Private"
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <div className="flex gap-2">
          <Link href="/projects" className="border rounded p-2 text-sm">
            Back to Projects
          </Link>
          {canEdit && (
            <Link href={`/projects/${project.id}/edit`} className="border rounded p-2 bg-blue-600 text-white text-sm hover:bg-blue-700">
              Edit Project
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white border rounded p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Status:</span>{" "}
            {statusLabels[project.status] || project.status}
          </div>
          <div>
            <span className="font-semibold">View State:</span>{" "}
            {viewStateLabels[project.view_state] || project.view_state}
          </div>
          <div>
            <span className="font-semibold">Enabled:</span>{" "}
            {project.enabled ? "Yes" : "No"}
          </div>
          <div>
            <span className="font-semibold">Project ID:</span> {project.id}
          </div>
        </div>

        {project.description && (
          <>
            <hr />
            <div>
              <h2 className="font-semibold mb-2">Description</h2>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: project.description }} />
            </div>
          </>
        )}
      </div>

      <div className="bg-white border rounded p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Project Issues</h2>
          <Link href={`/issues/new`} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">
            New Issue
          </Link>
        </div>
        {issues.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No issues found for this project
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={issues}
            searchColumn="summary"
            searchPlaceholder="Filter project issues..."
          />
        )}
      </div>
    </div>
  );
}