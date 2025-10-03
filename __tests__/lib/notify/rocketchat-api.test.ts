// __tests__/lib/notify/rocketchat-api.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  RocketChatAPI,
  getRocketChatAPI,
  isRocketChatAPIAvailable,
} from "@/lib/notify/rocketchat-api";

// Mock secrets configuration
vi.mock("@/config/secrets", () => ({
  secrets: {
    rocketchatApiUrl: "https://chat.example.com",
    rocketchatAuthToken: "test-auth-token",
    rocketchatUserId: "test-user-id",
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Rocket.Chat REST API Client", () => {
  let api: RocketChatAPI;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    api = new RocketChatAPI();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Configuration and Availability", () => {
    it("should be configured when all credentials provided", () => {
      expect(api.isAvailable()).toBe(true);
      expect(isRocketChatAPIAvailable()).toBe(true);
    });

    it("should return singleton instance", () => {
      const instance1 = getRocketChatAPI();
      const instance2 = getRocketChatAPI();
      expect(instance1).toBe(instance2);
    });
  });

  describe("Post Message", () => {
    it("should post message successfully", async () => {
      const mockResponse = {
        success: true,
        message: {
          _id: "msg123",
          rid: "room456",
          msg: "Test message",
          ts: "2025-10-03T10:00:00.000Z",
          u: {
            _id: "test-user-id",
            username: "testbot",
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.postMessage(
        "#test-channel",
        "Test message",
        []
      );

      expect(result).not.toBeNull();
      expect(result?._id).toBe("msg123");
      expect(fetch).toHaveBeenCalledWith(
        "https://chat.example.com/api/v1/chat.postMessage",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "X-Auth-Token": "test-auth-token",
            "X-User-Id": "test-user-id",
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should include attachments in post", async () => {
      const mockResponse = {
        success: true,
        message: {
          _id: "msg123",
          rid: "room456",
          msg: "Test",
          ts: "2025-10-03T10:00:00.000Z",
          u: { _id: "test-user-id", username: "testbot" },
          attachments: [{ title: "Test", text: "Attachment" }],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const attachments = [{ title: "Test", text: "Attachment" }];
      const result = await api.postMessage(
        "#test-channel",
        "Test",
        attachments
      );

      expect(result?.attachments).toBeDefined();
      const body = JSON.parse((fetch as any).mock.calls[0][1].body);
      expect(body.attachments).toEqual(attachments);
    });

    it("should handle post message failure", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Invalid channel" }),
      });

      const result = await api.postMessage("#invalid", "Test");

      expect(result).toBeNull();
    });

    it("should handle network errors", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await api.postMessage("#test", "Test");

      expect(result).toBeNull();
    });
  });

  describe("Update Message", () => {
    it("should update message successfully", async () => {
      const mockResponse = {
        success: true,
        message: {
          _id: "msg123",
          rid: "room456",
          msg: "Updated message",
          ts: "2025-10-03T10:00:00.000Z",
          u: { _id: "test-user-id", username: "testbot" },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.updateMessage("room456", "msg123", "Updated message");

      expect(result).not.toBeNull();
      expect(result?.msg).toBe("Updated message");
    });

    it("should handle update failure", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "Message not found" }),
      });

      const result = await api.updateMessage("room456", "invalid", "Test");

      expect(result).toBeNull();
    });
  });

  describe("Delete Message", () => {
    it("should delete message successfully", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await api.deleteMessage("room456", "msg123");

      expect(result).toBe(true);
    });

    it("should handle delete failure", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: "Forbidden" }),
      });

      const result = await api.deleteMessage("room456", "msg123");

      expect(result).toBe(false);
    });
  });

  describe("User Lookup", () => {
    it("should get user by username", async () => {
      const mockUser = {
        _id: "user123",
        username: "john.doe",
        name: "John Doe",
        status: "online",
        active: true,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      });

      const result = await api.getUserByUsername("john.doe");

      expect(result).not.toBeNull();
      expect(result?.username).toBe("john.doe");
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("users.info?username=john.doe"),
        expect.anything()
      );
    });

    it("should get user by ID", async () => {
      const mockUser = {
        _id: "user123",
        username: "john.doe",
        name: "John Doe",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      });

      const result = await api.getUserById("user123");

      expect(result).not.toBeNull();
      expect(result?._id).toBe("user123");
    });

    it("should handle user not found", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "User not found" }),
      });

      const result = await api.getUserByUsername("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("Channel Operations", () => {
    it("should get channel by name", async () => {
      const mockChannel = {
        _id: "channel123",
        name: "test-channel",
        t: "c" as const,
        ro: false,
        usernames: ["user1", "user2"],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ channel: mockChannel }),
      });

      const result = await api.getChannelByName("test-channel");

      expect(result).not.toBeNull();
      expect(result?.name).toBe("test-channel");
    });

    it("should strip # from channel name", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            channel: { _id: "ch123", name: "test", t: "c" },
          }),
      });

      await api.getChannelByName("#test-channel");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("roomName=test-channel"),
        expect.anything()
      );
    });

    it("should get channel by ID", async () => {
      const mockChannel = {
        _id: "channel123",
        name: "test",
        t: "c" as const,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ channel: mockChannel }),
      });

      const result = await api.getChannelById("channel123");

      expect(result).not.toBeNull();
      expect(result?._id).toBe("channel123");
    });

    it("should validate channel exists", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            channel: { _id: "ch123", name: "test", t: "c" },
          }),
      });

      const result = await api.validateChannel("test");

      expect(result).toBe(true);
    });

    it("should validate channel does not exist", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "Channel not found" }),
      });

      const result = await api.validateChannel("nonexistent");

      expect(result).toBe(false);
    });
  });

  describe("Get Message", () => {
    it("should get message by ID", async () => {
      const mockMessage = {
        _id: "msg123",
        rid: "room456",
        msg: "Test message",
        ts: "2025-10-03T10:00:00.000Z",
        u: { _id: "user123", username: "testuser" },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: mockMessage }),
      });

      const result = await api.getMessage("msg123");

      expect(result).not.toBeNull();
      expect(result?._id).toBe("msg123");
    });

    it("should handle message not found", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "Message not found" }),
      });

      const result = await api.getMessage("invalid");

      expect(result).toBeNull();
    });
  });

  describe("User in Channel Check", () => {
    it("should return true when user is member", async () => {
      const mockChannel = {
        _id: "ch123",
        name: "test",
        t: "c" as const,
        usernames: ["user1", "john.doe", "user3"],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ channel: mockChannel }),
      });

      const result = await api.isUserInChannel("test", "john.doe");

      expect(result).toBe(true);
    });

    it("should return false when user not member", async () => {
      const mockChannel = {
        _id: "ch123",
        name: "test",
        t: "c" as const,
        usernames: ["user1", "user2"],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ channel: mockChannel }),
      });

      const result = await api.isUserInChannel("test", "john.doe");

      expect(result).toBe(false);
    });

    it("should return false when channel not found", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "Channel not found" }),
      });

      const result = await api.isUserInChannel("nonexistent", "john.doe");

      expect(result).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      const result = await api.postMessage("#test", "Test");

      expect(result).toBeNull();
    });

    it("should handle timeout errors", async () => {
      global.fetch = vi
        .fn()
        .mockRejectedValue(new Error("Request timeout"));

      const result = await api.getUserByUsername("test");

      expect(result).toBeNull();
    });
  });
});
