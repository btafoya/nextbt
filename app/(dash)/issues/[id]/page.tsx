// /app/(dash)/issues/[id]/page.tsx
import { prisma } from "@/db/client";
import { requireSession } from "@/lib/auth";
import { canEditIssue } from "@/lib/permissions";
import { StatusBadge } from "@/components/issues/StatusBadge";
import { PriorityBadge } from "@/components/issues/PriorityBadge";
import ActivityTimeline from "@/components/issues/ActivityTimeline";
import StatusActions from "@/components/issues/StatusActions";
import HtmlContent from "@/components/issues/HtmlContent";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSeverityLabel, getStatusLabel, getPriorityLabel, getReproducibilityLabel } from "@/lib/mantis-enums";

// Disable caching to ensure real-time data updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getIssue(id: number) {
  const session = await requireSession();

  // Check if user is admin
  const user = await prisma.mantis_user_table.findUnique({
    where: { id: session.uid },
    select: { access_level: true }
  });

  const isAdmin = user && user.access_level >= 90;

  const issue = await prisma.mantis_bug_table.findUnique({
    where: { id },
    include: {
      project: true,
      reporter: true,
      handler: true,
      text: true
    }
  });

  // Admins can access all issues, regular users only their project issues
  if (!issue || (!isAdmin && !session.projects.includes(issue.project_id))) {
    return null;
  }

  return issue;
}

export default async function IssueShow({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const issueId = parseInt(params.id, 10);
  if (isNaN(issueId)) notFound();

  const issue = await getIssue(issueId);
  if (!issue) notFound();

  const description = issue.text?.description || "";
  const userCanEdit = await canEditIssue(session, issue);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-white">#{issue.id} - {issue.summary}</h1>
        <div className="flex gap-2">
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
          {userCanEdit && (
            <Link
              href={`/issues/${issue.id}/edit`}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Status change buttons */}
      <StatusActions issueId={issue.id} currentStatus={issue.status} canEdit={userCanEdit} />

      <div className="bg-white dark:bg-boxdark border dark:border-strokedark rounded p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm dark:text-gray-300">
          <div>
            <span className="font-semibold dark:text-white">Project:</span>{" "}
            <Link href={`/projects/${issue.project_id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
              {issue.project.name}
            </Link>
          </div>
          <div>
            <span className="font-semibold dark:text-white">Reporter:</span>{" "}
            <Link href={`/issues?reporter=${issue.reporter_id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
              {issue.reporter.realname || issue.reporter.username}
            </Link>
          </div>
          <div>
            <span className="font-semibold dark:text-white">Status:</span> {getStatusLabel(issue.status)}
          </div>
          <div>
            <span className="font-semibold dark:text-white">Priority:</span> {getPriorityLabel(issue.priority)}
          </div>
          <div>
            <span className="font-semibold dark:text-white">Severity:</span> {getSeverityLabel(issue.severity)}
          </div>
          <div>
            <span className="font-semibold dark:text-white">Reproducibility:</span> {getReproducibilityLabel(issue.reproducibility)}
          </div>
          <div>
            <span className="font-semibold dark:text-white">Assignee:</span>{" "}
            {issue.handler_id === 0 ? (
              <span className="text-gray-500 dark:text-gray-400">Unassigned</span>
            ) : issue.handler ? (
              <Link href={`/issues?handler=${issue.handler_id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                {issue.handler.realname || issue.handler.username}
              </Link>
            ) : (
              <span>User #{issue.handler_id}</span>
            )}
          </div>
          <div>
            <span className="font-semibold dark:text-white">Date Submitted:</span> {new Date(issue.date_submitted * 1000).toLocaleDateString()}
          </div>
        </div>

        <hr className="dark:border-strokedark" />

        <div>
          <h2 className="font-semibold mb-2 dark:text-white">Description</h2>
          <HtmlContent html={description} />
        </div>

        {issue.text?.steps_to_reproduce && (
          <div>
            <h2 className="font-semibold mb-2 dark:text-white">Steps to Reproduce</h2>
            <HtmlContent html={issue.text.steps_to_reproduce} />
          </div>
        )}

        {issue.text?.additional_information && (
          <div>
            <h2 className="font-semibold mb-2 dark:text-white">Additional Information</h2>
            <HtmlContent html={issue.text.additional_information} />
          </div>
        )}
      </div>

      {/* Activity timeline - notes and attachments combined */}
      <ActivityTimeline issueId={issue.id} currentUserId={session.uid} />
    </div>
  );
}
