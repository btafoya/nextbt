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
import { getSeverityLabel } from "@/lib/mantis-enums";

async function getIssue(id: number) {
  const session = requireSession();

  const issue = await prisma.mantis_bug_table.findUnique({
    where: { id },
    include: {
      project: true,
      reporter: true,
      text: true
    }
  });

  if (!issue || !session.projects.includes(issue.project_id)) {
    return null;
  }

  return issue;
}

export default async function IssueShow({ params }: { params: { id: string } }) {
  const session = requireSession();
  const issueId = parseInt(params.id, 10);
  if (isNaN(issueId)) notFound();

  const issue = await getIssue(issueId);
  if (!issue) notFound();

  const description = issue.text?.description || "";
  const userCanEdit = await canEditIssue(session, issue);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">#{issue.id} - {issue.summary}</h1>
        <div className="flex gap-2">
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
        </div>
      </div>

      {/* Status change buttons */}
      <StatusActions issueId={issue.id} currentStatus={issue.status} canEdit={userCanEdit} />

      <div className="bg-white border rounded p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Project:</span>{" "}
            <Link href={`/projects/${issue.project_id}`} className="text-blue-600 hover:underline">
              {issue.project.name}
            </Link>
          </div>
          <div>
            <span className="font-semibold">Reporter:</span>{" "}
            <Link href={`/issues?reporter=${issue.reporter_id}`} className="text-blue-600 hover:underline">
              {issue.reporter.realname || issue.reporter.username}
            </Link>
          </div>
          <div>
            <span className="font-semibold">Severity:</span> {getSeverityLabel(issue.severity)}
          </div>
          <div>
            <span className="font-semibold">Date Submitted:</span> {new Date(issue.date_submitted * 1000).toLocaleDateString()}
          </div>
        </div>

        <hr />

        <div>
          <h2 className="font-semibold mb-2">Description</h2>
          <HtmlContent html={description} />
        </div>

        {issue.text?.steps_to_reproduce && (
          <div>
            <h2 className="font-semibold mb-2">Steps to Reproduce</h2>
            <HtmlContent html={issue.text.steps_to_reproduce} />
          </div>
        )}

        {issue.text?.additional_information && (
          <div>
            <h2 className="font-semibold mb-2">Additional Information</h2>
            <HtmlContent html={issue.text.additional_information} />
          </div>
        )}
      </div>

      {/* Activity timeline - notes and attachments combined */}
      <ActivityTimeline issueId={issue.id} currentUserId={session.uid} />
    </div>
  );
}
