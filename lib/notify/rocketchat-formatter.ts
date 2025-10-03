// /lib/notify/rocketchat-formatter.ts
import { secrets } from "@/config/secrets";

/**
 * Rocket.Chat attachment field definition
 */
export interface RocketChatField {
  title: string;
  value: string;
  short?: boolean;
}

/**
 * Rocket.Chat message attachment structure
 * Based on official Rocket.Chat webhook documentation
 */
export interface RocketChatAttachment {
  color?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: RocketChatField[];
  image_url?: string;
  thumb_url?: string;
  author_name?: string;
  author_link?: string;
  author_icon?: string;
}

/**
 * Complete Rocket.Chat webhook payload
 */
export interface RocketChatWebhookPayload {
  text?: string;
  emoji?: string;
  username?: string;
  channel?: string;
  attachments?: RocketChatAttachment[];
}

/**
 * Notification context for formatting
 */
export interface NotificationContext {
  subject: string;
  body: string;
  bugId?: number;
  projectId?: number;
  severity?: string;
  priority?: string;
  status?: string;
  eventType?: string;
  reporter?: string;
  assignedTo?: string;
  link?: string;
}

/**
 * Format notification context into Rocket.Chat webhook payload with rich attachments
 */
export function formatRocketChatMessage(
  context: NotificationContext
): RocketChatWebhookPayload {
  const useRichFormatting = secrets.rocketchatUseRichFormatting ?? true;

  if (!useRichFormatting) {
    // Simple text-only fallback
    return {
      text: `**${context.subject}**\n${context.body}`,
      username: secrets.rocketchatUsername || "MantisBT",
      channel: getChannelForProject(context.projectId),
    };
  }

  // Determine color based on severity/priority
  const color = getSeverityColor(context.severity || context.priority);

  // Build rich attachment
  const attachment: RocketChatAttachment = {
    color,
    title: context.subject,
    title_link: context.link ? `${secrets.baseUrl}${context.link}` : undefined,
    text: context.body,
    fields: [],
  };

  // Add fields based on available data
  if (context.bugId) {
    attachment.fields!.push({
      title: "Issue ID",
      value: `#${context.bugId}`,
      short: true,
    });
  }

  if (context.status) {
    attachment.fields!.push({
      title: "Status",
      value: context.status,
      short: true,
    });
  }

  if (context.priority) {
    attachment.fields!.push({
      title: "Priority",
      value: context.priority,
      short: true,
    });
  }

  if (context.severity) {
    attachment.fields!.push({
      title: "Severity",
      value: context.severity,
      short: true,
    });
  }

  if (context.reporter) {
    attachment.fields!.push({
      title: "Reporter",
      value: context.reporter,
      short: true,
    });
  }

  if (context.assignedTo) {
    attachment.fields!.push({
      title: "Assigned To",
      value: context.assignedTo,
      short: true,
    });
  }

  // Determine channel from project mapping
  const channel = getChannelForProject(context.projectId);

  // Select emoji based on event type
  const emoji = getEventEmoji(context.eventType);

  return {
    username: secrets.rocketchatUsername || "MantisBT",
    emoji,
    channel,
    attachments: [attachment],
  };
}

/**
 * Get color code based on severity/priority level
 */
function getSeverityColor(severity?: string): string {
  if (!severity) {
    return "#764FA5"; // Default purple
  }

  const colorMap = secrets.rocketchatColorMap || {
    critical: "#ff0000",
    high: "#ff6600",
    normal: "#ffcc00",
    low: "#00cc00",
    info: "#0099ff",
  };

  const severityKey = severity.toLowerCase() as keyof typeof colorMap;
  return colorMap[severityKey] || "#764FA5";
}

/**
 * Get target channel based on project mapping
 */
function getChannelForProject(projectId?: number): string | undefined {
  // No project ID - use default channel
  if (!projectId) {
    return secrets.rocketchatDefaultChannel || undefined;
  }

  // Check if channel mapping is configured
  const channelMap = secrets.rocketchatChannelMap;
  if (!channelMap || Object.keys(channelMap).length === 0) {
    return secrets.rocketchatDefaultChannel || undefined;
  }

  // Look up project-specific channel
  const projectChannel = (channelMap as Record<number, string>)[projectId];
  if (projectChannel) {
    return projectChannel;
  }

  // Fallback to default for unmapped projects (key 0)
  return (channelMap as Record<number, string>)[0] || secrets.rocketchatDefaultChannel || undefined;
}

/**
 * Get emoji icon based on notification event type
 */
function getEventEmoji(eventType?: string): string {
  if (!eventType) {
    return ":bell:"; // Default notification bell
  }

  const emojiMap: Record<string, string> = {
    issue_created: ":new:",
    issue_updated: ":pencil:",
    issue_resolved: ":white_check_mark:",
    issue_closed: ":lock:",
    note_added: ":speech_balloon:",
    status_changed: ":arrows_counterclockwise:",
    priority_changed: ":exclamation:",
    assigned: ":bust_in_silhouette:",
    reopened: ":rotating_light:",
    severity_changed: ":warning:",
  };

  return emojiMap[eventType] || ":bell:";
}
