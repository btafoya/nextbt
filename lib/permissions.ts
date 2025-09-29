// /lib/permissions.ts
import "server-only";
import { SessionData } from "@/lib/auth";
import { prisma } from "@/db/client";

export function canViewProject(session: SessionData, projectId: number) {
  return session.projects.includes(projectId);
}

export async function getUserAccessLevel(userId: number): Promise<number> {
  const user = await prisma.mantis_user_table.findUnique({
    where: { id: userId }
  });
  return user?.access_level ?? 0;
}

export async function getProjectAccessLevel(userId: number, projectId: number): Promise<number> {
  const projectAccess = await prisma.mantis_project_user_list_table.findFirst({
    where: {
      user_id: userId,
      project_id: projectId
    }
  });

  if (projectAccess) return projectAccess.access_level;

  // Fall back to global access level
  return await getUserAccessLevel(userId);
}

// MantisBT access levels:
// 10 = Viewer, 25 = Reporter, 40 = Updater, 55 = Developer, 70 = Manager, 90 = Administrator
export function canEditIssue(session: SessionData, issue: { reporter_id: number; handler_id: number | null; project_id: number; }) {
  if (!canViewProject(session, issue.project_id)) return false;
  // Reporter or handler can edit, or developers+ can edit any issue
  return issue.reporter_id === session.uid || issue.handler_id === session.uid;
}

export async function canDeleteIssue(session: SessionData, issue: { reporter_id: number; project_id: number; }): Promise<boolean> {
  if (!canViewProject(session, issue.project_id)) return false;

  const accessLevel = await getProjectAccessLevel(session.uid, issue.project_id);
  // Managers (70+) can delete any issue, reporters can delete their own
  return accessLevel >= 70 || issue.reporter_id === session.uid;
}

export function canComment(session: SessionData, projectId: number) {
  return canViewProject(session, projectId);
}

export async function canEditNote(session: SessionData, note: { reporter_id: number; }): Promise<boolean> {
  // Users can only edit their own notes
  return note.reporter_id === session.uid;
}

export async function canDeleteNote(session: SessionData, note: { reporter_id: number; }, projectId: number): Promise<boolean> {
  const accessLevel = await getProjectAccessLevel(session.uid, projectId);
  // Managers (70+) can delete any note, users can delete their own
  return accessLevel >= 70 || note.reporter_id === session.uid;
}
