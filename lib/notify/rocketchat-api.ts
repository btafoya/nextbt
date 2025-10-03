// /lib/notify/rocketchat-api.ts
import { secrets } from "@/config/secrets";
import { logger } from "@/lib/logger";

/**
 * Rocket.Chat user information
 */
export interface RocketChatUser {
  _id: string;
  username: string;
  name: string;
  status?: string;
  active?: boolean;
}

/**
 * Rocket.Chat channel/room information
 */
export interface RocketChatChannel {
  _id: string;
  name: string;
  fname?: string;
  t: "c" | "p" | "d"; // c=channel, p=private, d=direct
  ro?: boolean; // read-only
  usernames?: string[];
}

/**
 * Rocket.Chat message structure
 */
export interface RocketChatMessage {
  _id: string;
  rid: string; // room ID
  msg: string;
  ts: string; // timestamp
  u: {
    _id: string;
    username: string;
    name?: string;
  };
  attachments?: any[];
  urls?: any[];
  mentions?: any[];
  channels?: any[];
  starred?: boolean;
  pinned?: boolean;
}

/**
 * REST API response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Rocket.Chat REST API client
 * Based on official Rocket.Chat REST API v1 documentation
 */
export class RocketChatAPI {
  private baseUrl: string;
  private authToken: string;
  private userId: string;
  private isConfigured: boolean;

  constructor() {
    this.baseUrl = secrets.rocketchatApiUrl || "";
    this.authToken = secrets.rocketchatAuthToken || "";
    this.userId = secrets.rocketchatUserId || "";
    this.isConfigured = !!(this.baseUrl && this.authToken && this.userId);
  }

  /**
   * Check if REST API is properly configured
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Make authenticated request to Rocket.Chat REST API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    if (!this.isConfigured) {
      logger.warn("Rocket.Chat REST API not configured");
      return { success: false, error: "API not configured" };
    }

    const url = `${this.baseUrl}/api/v1/${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "X-Auth-Token": this.authToken,
          "X-User-Id": this.userId,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error(`Rocket.Chat API error: ${response.status}`, data);
        return {
          success: false,
          error: data.error || response.statusText,
        };
      }

      return { success: true, data };
    } catch (error) {
      logger.error("Rocket.Chat API request failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Post message to channel or direct message
   *
   * @param channel - Channel name (#channel) or username (@user) or room ID
   * @param text - Message text
   * @param attachments - Optional message attachments
   * @returns Posted message with ID and metadata
   */
  async postMessage(
    channel: string,
    text: string,
    attachments?: any[]
  ): Promise<RocketChatMessage | null> {
    const payload: any = {
      channel,
      text,
    };

    if (attachments && attachments.length > 0) {
      payload.attachments = attachments;
    }

    const response = await this.request<{ message: RocketChatMessage }>(
      "chat.postMessage",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    if (response.success && response.data) {
      logger.info("Message posted via REST API", {
        messageId: response.data.message._id,
        channel,
      });
      return response.data.message;
    }

    logger.error("Failed to post message via REST API:", response.error);
    return null;
  }

  /**
   * Update existing message
   *
   * @param roomId - Room ID where message exists
   * @param messageId - Message ID to update
   * @param text - New message text
   * @returns Updated message or null
   */
  async updateMessage(
    roomId: string,
    messageId: string,
    text: string
  ): Promise<RocketChatMessage | null> {
    const response = await this.request<{ message: RocketChatMessage }>(
      "chat.update",
      {
        method: "POST",
        body: JSON.stringify({
          roomId,
          msgId: messageId,
          text,
        }),
      }
    );

    if (response.success && response.data) {
      logger.info("Message updated via REST API", { messageId, roomId });
      return response.data.message;
    }

    logger.error("Failed to update message:", response.error);
    return null;
  }

  /**
   * Delete message
   *
   * @param roomId - Room ID where message exists
   * @param messageId - Message ID to delete
   * @returns Success boolean
   */
  async deleteMessage(roomId: string, messageId: string): Promise<boolean> {
    const response = await this.request<{ success: boolean }>(
      "chat.delete",
      {
        method: "POST",
        body: JSON.stringify({
          roomId,
          msgId: messageId,
        }),
      }
    );

    if (response.success) {
      logger.info("Message deleted via REST API", { messageId, roomId });
      return true;
    }

    logger.error("Failed to delete message:", response.error);
    return false;
  }

  /**
   * Get user information by username
   *
   * @param username - Username to lookup (without @)
   * @returns User information or null
   */
  async getUserByUsername(username: string): Promise<RocketChatUser | null> {
    const response = await this.request<{ user: RocketChatUser }>(
      `users.info?username=${encodeURIComponent(username)}`
    );

    if (response.success && response.data) {
      return response.data.user;
    }

    logger.warn(`User not found: ${username}`, response.error);
    return null;
  }

  /**
   * Get user information by user ID
   *
   * @param userId - User ID to lookup
   * @returns User information or null
   */
  async getUserById(userId: string): Promise<RocketChatUser | null> {
    const response = await this.request<{ user: RocketChatUser }>(
      `users.info?userId=${encodeURIComponent(userId)}`
    );

    if (response.success && response.data) {
      return response.data.user;
    }

    logger.warn(`User not found: ${userId}`, response.error);
    return null;
  }

  /**
   * Get channel information by name
   *
   * @param channelName - Channel name (without #)
   * @returns Channel information or null
   */
  async getChannelByName(
    channelName: string
  ): Promise<RocketChatChannel | null> {
    const cleanName = channelName.replace(/^#/, "");
    const response = await this.request<{ channel: RocketChatChannel }>(
      `channels.info?roomName=${encodeURIComponent(cleanName)}`
    );

    if (response.success && response.data) {
      return response.data.channel;
    }

    logger.warn(`Channel not found: ${channelName}`, response.error);
    return null;
  }

  /**
   * Get channel information by ID
   *
   * @param roomId - Room/Channel ID
   * @returns Channel information or null
   */
  async getChannelById(roomId: string): Promise<RocketChatChannel | null> {
    const response = await this.request<{ channel: RocketChatChannel }>(
      `channels.info?roomId=${encodeURIComponent(roomId)}`
    );

    if (response.success && response.data) {
      return response.data.channel;
    }

    logger.warn(`Channel not found: ${roomId}`, response.error);
    return null;
  }

  /**
   * Validate that a channel exists and is accessible
   *
   * @param channelName - Channel name to validate
   * @returns True if channel exists and is accessible
   */
  async validateChannel(channelName: string): Promise<boolean> {
    const channel = await this.getChannelByName(channelName);
    return channel !== null;
  }

  /**
   * Get message by ID
   *
   * @param messageId - Message ID to retrieve
   * @returns Message or null
   */
  async getMessage(messageId: string): Promise<RocketChatMessage | null> {
    const response = await this.request<{ message: RocketChatMessage }>(
      `chat.getMessage?msgId=${encodeURIComponent(messageId)}`
    );

    if (response.success && response.data) {
      return response.data.message;
    }

    logger.warn(`Message not found: ${messageId}`, response.error);
    return null;
  }

  /**
   * Check if user is member of channel
   *
   * @param channelName - Channel name
   * @param username - Username to check
   * @returns True if user is member
   */
  async isUserInChannel(
    channelName: string,
    username: string
  ): Promise<boolean> {
    const channel = await this.getChannelByName(channelName);
    if (!channel || !channel.usernames) {
      return false;
    }

    return channel.usernames.includes(username);
  }
}

/**
 * Singleton instance of Rocket.Chat API client
 */
let apiClient: RocketChatAPI | null = null;

/**
 * Get or create Rocket.Chat REST API client instance
 *
 * @returns API client instance or null if not configured
 */
export function getRocketChatAPI(): RocketChatAPI | null {
  if (!apiClient) {
    apiClient = new RocketChatAPI();
  }

  if (!apiClient.isAvailable()) {
    return null;
  }

  return apiClient;
}

/**
 * Check if REST API is configured and available
 */
export function isRocketChatAPIAvailable(): boolean {
  const api = getRocketChatAPI();
  return api !== null && api.isAvailable();
}
