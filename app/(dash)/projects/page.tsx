// /app/(dash)/projects/page.tsx
import Link from "next/link";
import { prisma } from "@/db/client";
import { requireSession } from "@/lib/auth";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";

async function getProjects() {
  const session = requireSession();

  const projects = await prisma.mantis_project_table.findMany({
    where: {
      id: { in: session.projects }
    },
    orderBy: { name: "asc" }
  });

  return projects;
}

export default async function ProjectsPage() {
  const session = requireSession();
  const projects = await getProjects();
  const isAdmin = session.uid && (await prisma.mantis_user_table.findUnique({ where: { id: session.uid } }))?.access_level >= 90;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        {isAdmin && (
          <Link href="/projects/new">
            <Button>New Project</Button>
          </Link>
        )}
      </div>

      <DataTable
        columns={columns}
        data={projects}
        searchColumn="name"
        searchPlaceholder="Filter projects..."
      />
    </div>
  );
}