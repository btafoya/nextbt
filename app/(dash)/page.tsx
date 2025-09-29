// /app/(dash)/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
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
  );
}
