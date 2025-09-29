// /app/(dash)/issues/page.tsx
import Link from "next/link";

async function getIssues() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/issues`, { cache: "no-store" });
  return res.json();
}

export default async function IssuesPage() {
  const issues = await getIssues();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Issues</h1>
      <div className="grid gap-2">
        {issues.map((i: any) => (
          <Link key={i.id} href={`/issues/${i.id}`} className="border rounded p-3 bg-white hover:shadow">
            <div className="font-medium">{i.summary}</div>
            <div className="text-xs text-gray-600">Project #{i.projectId} • Updated {new Date(i.lastUpdated * 1000).toLocaleString()}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
