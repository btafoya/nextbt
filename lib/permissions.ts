// /lib/permissions.ts
import "server-only";
import { SessionData } from "@/lib/auth";

export function canViewProject(session: SessionData, projectId: number) {
  return session.projects.includes(projectId);
}

export function canEditIssue(session: SessionData, issue: { reporterId: number; handlerId: number | null; projectId: number; }) {
  if (!canViewProject(session, issue.projectId)) return false;
  return issue.reporterId === session.uid || issue.handlerId === session.uid;
}

export function canComment(session: SessionData, projectId: number) {
  return canViewProject(session, projectId);
}
