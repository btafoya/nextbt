// Type definitions for NextBT

export type SessionData = {
  uid: number;
  username: string;
  projects: number[];
};

export type IssueStatus = 10 | 20 | 30 | 40 | 50 | 80 | 90;
export type IssuePriority = 10 | 20 | 30 | 40 | 50 | 60;

export interface Issue {
  id: number;
  project_id: number;
  reporter_id: number;
  handler_id: number | null;
  priority: IssuePriority;
  severity: number;
  status: IssueStatus;
  resolution: number;
  date_submitted: number;
  last_updated: number;
  summary: string;
  bug_text_id: number;
}

export interface User {
  id: number;
  username: string;
  realname: string | null;
  email: string | null;
  enabled: number;
}

export interface Project {
  id: number;
  name: string;
  status: number;
  enabled: number;
}
