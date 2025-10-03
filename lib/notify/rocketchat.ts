// /lib/notify/rocketchat.ts
import { secrets } from "@/config/secrets";
import { logger } from "@/lib/logger";
import {
  formatRocketChatMessage,
  type NotificationContext,
  type RocketChatWebhookPayload,
} from "./rocketchat-formatter";
import { getRocketChatAPI } from "./rocketchat-api";

/**
 * Options for sending Rocket.Chat notifications
 */
export interface RocketChatOptions {
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
 * Result from sending Rocket.Chat notification
 */
export interface RocketChatResult {
  messageId?: string;
  channel?: string;
  success: boolean;
}

/**
 * Send notification to Rocket.Chat with rich formatting and retry logic
 *
 * @param options - Notification context and metadata
 * @returns Result with message ID and channel (if available)
 */
export async function sendRocketChat(
  options: RocketChatOptions
): Promise<RocketChatResult> {
  if (!secrets.rocketchatEnabled) {
    logger.log("Rocket.Chat notifications disabled");
    return { success: false };
  }

  if (!secrets.rocketchatWebhookUrl) {
    logger.error("Rocket.Chat webhook URL not configured");
    return { success: false };
  }

  // Build notification context
  const context: NotificationContext = {
    subject: options.subject,
    body: options.body,
    bugId: options.bugId,
    projectId: options.projectId,
    severity: options.severity,
    priority: options.priority,
    status: options.status,
    eventType: options.eventType,
    reporter: options.reporter,
    assignedTo: options.assignedTo,
    link: options.link,
  };

  // Format message with rich attachments
  const payload = formatRocketChatMessage(context);

  // Send via webhook with retry logic
  try {
    const result = await sendViaWebhook(payload);
    logger.info("Rocket.Chat notification sent successfully", {
      channel: payload.channel,
      bugId: options.bugId,
    });
    return {
      success: true,
      channel: payload.channel,
      ...result,
    };
  } catch (webhookError) {
    logger.error("Rocket.Chat webhook failed:", webhookError);

    // Fallback to REST API if configured
    const api = getRocketChatAPI();
    if (api && payload.channel) {
      try {
        logger.info("Attempting REST API fallback", {
          channel: payload.channel,
        });

        const message = await api.postMessage(
          payload.channel,
          payload.attachments?.[0]?.text || options.body,
          payload.attachments
        );

        if (message) {
          logger.info("Rocket.Chat sent via REST API fallback", {
            messageId: message._id,
          });
          return {
            success: true,
            messageId: message._id,
            channel: payload.channel,
          };
        }
      } catch (apiError) {
        logger.error("Rocket.Chat REST API fallback failed:", apiError);
      }
    }

    // Both webhook and API failed
    return { success: false };
  }
}

/**
 * Send payload via webhook with automatic retry logic
 */
async function sendViaWebhook(
  payload: RocketChatWebhookPayload,
  retryCount = 0
): Promise<Partial<RocketChatResult>> {
  const maxRetries = secrets.rocketchatRetryAttempts ?? 3;
  const retryDelay = secrets.rocketchatRetryDelay ?? 2000;

  try {
    // Remove channel from webhook payload (webhooks post to fixed channel)
    // Keep channel info for return value and REST API fallback
    const { channel: _channel, ...webhookPayload } = payload;

    const response = await fetch(secrets.rocketchatWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Webhook failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    // Webhook success (webhooks typically don't return message IDs)
    logger.log("Rocket.Chat webhook request succeeded");
    return { channel: payload.channel };
  } catch (error) {
    const isLastAttempt = retryCount >= maxRetries - 1;

    if (!isLastAttempt) {
      logger.warn(
        `Rocket.Chat webhook retry ${retryCount + 1}/${maxRetries}:`,
        error
      );

      // Wait before retrying (exponential backoff)
      const delay = retryDelay * Math.pow(2, retryCount);
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry with incremented count
      return sendViaWebhook(payload, retryCount + 1);
    }

    // All retries exhausted
    logger.error(`Rocket.Chat webhook failed after ${maxRetries} attempts`);
    throw error;
  }
}

/**
 * Backward compatibility: Simple text-only function
 * @deprecated Use sendRocketChat() with options instead
 */
export async function sendRocketChatSimple(text: string): Promise<void> {
  await sendRocketChat({
    subject: "Notification",
    body: text,
  });
}
