// /app/(dash)/issues/[id]/page.tsx
import Editor from "@/components/wysiwyg/Editor";

async function getIssue(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/issues/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function IssueShow({ params }: { params: { id: string } }) {
  const issue = await getIssue(params.id);
  if (!issue) return <div className="text-red-600">Issue not found</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{issue.summary}</h1>
      <div className="bg-white border rounded p-4">
        <div className="text-sm text-gray-600">Project #{issue.projectId}</div>
        <div dangerouslySetInnerHTML={{ __html: issue.text?.description ?? "" }} />
      </div>
    </div>
  );
}
