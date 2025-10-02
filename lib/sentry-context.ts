/**
 * Sentry Context Utilities
 *
 * Provides consistent tagging and context setting for error tracking
 * across the NextBT application.
 */

import * as Sentry from "@sentry/nextjs";

/**
 * Set project context for issue tracking
 */
export function setSentryProjectContext(projectId: number, projectName?: string) {
  Sentry.setTag("project_id", projectId.toString());
  if (projectName) {
    Sentry.setTag("project_name", projectName);
  }

  Sentry.setContext("project", {
    id: projectId,
    name: projectName,
  });
}

/**
 * Set issue/bug context for tracking
 */
export function setSentryIssueContext(issueData: {
  id: number;
  projectId: number;
  priority?: number;
  severity?: number;
  status?: number;
  category?: string;
}) {
  Sentry.setTag("issue_id", issueData.id.toString());
  Sentry.setTag("issue_project_id", issueData.projectId.toString());

  if (issueData.priority !== undefined) {
    Sentry.setTag("issue_priority", issueData.priority.toString());
  }

  if (issueData.severity !== undefined) {
    Sentry.setTag("issue_severity", issueData.severity.toString());
  }

  if (issueData.status !== undefined) {
    Sentry.setTag("issue_status", issueData.status.toString());
  }

  if (issueData.category) {
    Sentry.setTag("issue_category", issueData.category);
  }

  Sentry.setContext("issue", {
    id: issueData.id,
    projectId: issueData.projectId,
    priority: issueData.priority,
    severity: issueData.severity,
    status: issueData.status,
    category: issueData.category,
  });
}

/**
 * Add breadcrumb for user actions
 */
export function addSentryBreadcrumb(
  category: string,
  message: string,
  level: "fatal" | "error" | "warning" | "log" | "info" | "debug" = "info",
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Track issue creation
 */
export function trackIssueCreation(issueId: number, projectId: number) {
  addSentryBreadcrumb("issue", `Issue created: ${issueId}`, "info", {
    issueId,
    projectId,
    action: "create",
  });
}

/**
 * Track issue update
 */
export function trackIssueUpdate(
  issueId: number,
  projectId: number,
  changes: Record<string, any>
) {
  addSentryBreadcrumb("issue", `Issue updated: ${issueId}`, "info", {
    issueId,
    projectId,
    action: "update",
    changes,
  });
}

/**
 * Track issue deletion
 */
export function trackIssueDeletion(issueId: number, projectId: number) {
  addSentryBreadcrumb("issue", `Issue deleted: ${issueId}`, "warning", {
    issueId,
    projectId,
    action: "delete",
  });
}

/**
 * Track file upload
 */
export function trackFileUpload(
  issueId: number,
  fileName: string,
  fileSize: number
) {
  addSentryBreadcrumb("file", `File uploaded: ${fileName}`, "info", {
    issueId,
    fileName,
    fileSize,
    action: "upload",
  });
}

/**
 * Track search operation
 */
export function trackSearch(query: string, resultCount: number) {
  addSentryBreadcrumb("search", `Search: ${query}`, "info", {
    query,
    resultCount,
  });
}

/**
 * Track API call performance
 */
export function trackApiCall(
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number
) {
  addSentryBreadcrumb("api", `${method} ${endpoint}`, "info", {
    endpoint,
    method,
    statusCode,
    duration,
  });
}

/**
 * Clear issue-specific context (call when navigating away from issue)
 */
export function clearSentryIssueContext() {
  Sentry.setContext("issue", null);
  // Remove issue-specific tags
  ["issue_id", "issue_project_id", "issue_priority", "issue_severity", "issue_status", "issue_category"].forEach(
    (tag) => {
      Sentry.setTag(tag, "");
    }
  );
}

/**
 * Clear project-specific context
 */
export function clearSentryProjectContext() {
  Sentry.setContext("project", null);
  Sentry.setTag("project_id", "");
  Sentry.setTag("project_name", "");
}
