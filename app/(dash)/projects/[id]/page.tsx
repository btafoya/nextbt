// /app/(dash)/projects/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/db/client";
import { requireSession } from "@/lib/auth";

async function getProject(id: number) {
  const session = requireSession();

  const project = await prisma.mantis_project_table.findUnique({
    where: { id }
  });

  if (!project || !session.projects.includes(project.id)) {
    return null;
  }

  return project;
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
  const project = await getProject(projectId);
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

      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-3">Project Issues</h2>
        <Link href={`/issues?project=${project.id}`} className="text-blue-600 hover:underline text-sm">
          View all issues in this project →
        </Link>
      </div>
    </div>
  );
}