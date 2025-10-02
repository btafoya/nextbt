// /__tests__/lib/notify/webpush.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  subscribeWebPush,
  unsubscribeWebPush,
  getUserWebPushSubscriptions,
  sendWebPush,
} from "@/lib/notify/webpush";
import { prisma } from "@/db/client";

// Mock Prisma client
vi.mock("@/db/client", () => ({
  prisma: {
    mantis_webpush_subscription_table: {
      create: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

// Mock web-push
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}));

// Mock secrets
vi.mock("@/config/secrets", () => ({
  secrets: {
    webPushEnabled: true,
    vapidPublicKey: "test-public-key",
    vapidPrivateKey: "test-private-key",
    fromEmail: "test@example.com",
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Web Push Notification System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("subscribeWebPush", () => {
    it("should create a new subscription", async () => {
      const mockSubscription = {
        id: 1,
        user_id: 1,
        endpoint: "https://push.example.com/sub123",
        p256dh_key: "test-p256dh",
        auth_key: "test-auth",
        user_agent: "Mozilla/5.0",
        ip_address: "192.168.1.1",
        enabled: 1,
        date_created: 1696000000,
        date_last_used: 1696000000,
      };

      vi.mocked(prisma.mantis_webpush_subscription_table.upsert).mockResolvedValue(
        mockSubscription as any
      );

      await subscribeWebPush(
        1,
        {
          endpoint: "https://push.example.com/sub123",
          keys: {
            p256dh: "test-p256dh",
            auth: "test-auth",
          },
        },
        "Mozilla/5.0",
        "192.168.1.1"
      );

      expect(prisma.mantis_webpush_subscription_table.upsert).toHaveBeenCalledWith({
        where: { endpoint: "https://push.example.com/sub123" },
        create: expect.objectContaining({
          user_id: 1,
          endpoint: "https://push.example.com/sub123",
          p256dh_key: "test-p256dh",
          auth_key: "test-auth",
          user_agent: "Mozilla/5.0",
          ip_address: "192.168.1.1",
          enabled: 1,
        }),
        update: expect.any(Object),
      });
    });

    it("should handle missing user agent and IP", async () => {
      const mockSubscription = {
        id: 1,
        user_id: 1,
        endpoint: "https://push.example.com/sub123",
        p256dh_key: "test-p256dh",
        auth_key: "test-auth",
        user_agent: null,
        ip_address: null,
        enabled: 1,
        date_created: 1696000000,
        date_last_used: 1696000000,
      };

      vi.mocked(prisma.mantis_webpush_subscription_table.upsert).mockResolvedValue(
        mockSubscription as any
      );

      await subscribeWebPush(1, {
        endpoint: "https://push.example.com/sub123",
        keys: {
          p256dh: "test-p256dh",
          auth: "test-auth",
        },
      });

      const upsertCall = vi.mocked(prisma.mantis_webpush_subscription_table.upsert).mock.calls[0][0];
      expect(upsertCall.create.user_agent).toBeNull();
      expect(upsertCall.create.ip_address).toBeNull();
    });
  });

  describe("unsubscribeWebPush", () => {
    it("should disable a subscription by endpoint", async () => {
      vi.mocked(prisma.mantis_webpush_subscription_table.updateMany).mockResolvedValue({ count: 1 } as any);

      await unsubscribeWebPush("https://push.example.com/sub123");

      expect(prisma.mantis_webpush_subscription_table.updateMany).toHaveBeenCalledWith({
        where: { endpoint: "https://push.example.com/sub123" },
        data: { enabled: 0 },
      });
    });

    it("should throw if subscription not found", async () => {
      vi.mocked(prisma.mantis_webpush_subscription_table.updateMany).mockRejectedValue(
        new Error("Record not found")
      );

      await expect(
        unsubscribeWebPush("https://push.example.com/nonexistent")
      ).rejects.toThrow();
    });
  });

  describe("getUserWebPushSubscriptions", () => {
    it("should return all active subscriptions for user", async () => {
      const mockSubscriptions = [
        {
          id: 1,
          user_id: 1,
          endpoint: "https://push.example.com/sub1",
          p256dh_key: "key1",
          auth_key: "auth1",
          user_agent: "Chrome",
          ip_address: "192.168.1.1",
          enabled: 1,
          date_created: 1696000000,
          date_last_used: 1696000000,
        },
        {
          id: 2,
          user_id: 1,
          endpoint: "https://push.example.com/sub2",
          p256dh_key: "key2",
          auth_key: "auth2",
          user_agent: "Firefox",
          ip_address: "192.168.1.2",
          enabled: 1,
          date_created: 1696000001,
          date_last_used: 1696000001,
        },
      ];

      vi.mocked(prisma.mantis_webpush_subscription_table.findMany).mockResolvedValue(
        mockSubscriptions as any
      );

      const result = await getUserWebPushSubscriptions(1);

      expect(result).toHaveLength(2);
      expect(result[0].endpoint).toBe("https://push.example.com/sub1");
      expect(result[1].endpoint).toBe("https://push.example.com/sub2");
    });

    it("should only return enabled subscriptions", async () => {
      vi.mocked(prisma.mantis_webpush_subscription_table.findMany).mockResolvedValue([]);

      await getUserWebPushSubscriptions(1);

      expect(prisma.mantis_webpush_subscription_table.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          enabled: 1,
        },
      });
    });

    it("should return empty array if user has no subscriptions", async () => {
      vi.mocked(prisma.mantis_webpush_subscription_table.findMany).mockResolvedValue([]);

      const result = await getUserWebPushSubscriptions(999);

      expect(result).toEqual([]);
    });
  });

  describe("sendWebPush", () => {
    it("should send push to all user subscriptions", async () => {
      const mockSubscriptions = [
        {
          id: 1,
          user_id: 1,
          endpoint: "https://push.example.com/sub1",
          p256dh_key: "key1",
          auth_key: "auth1",
          enabled: 1,
        },
      ];

      vi.mocked(prisma.mantis_webpush_subscription_table.findMany).mockResolvedValue(
        mockSubscriptions as any
      );

      const webpush = await import("web-push");
      vi.mocked(webpush.default.sendNotification).mockResolvedValue({} as any);

      await sendWebPush(1, {
        title: "Test Notification",
        body: "This is a test",
      });

      expect(webpush.default.sendNotification).toHaveBeenCalledWith(
        {
          endpoint: "https://push.example.com/sub1",
          keys: {
            p256dh: "key1",
            auth: "auth1",
          },
        },
        expect.stringContaining("Test Notification")
      );
    });

    it("should include custom data in payload", async () => {
      const mockSubscriptions = [
        {
          id: 1,
          user_id: 1,
          endpoint: "https://push.example.com/sub1",
          p256dh_key: "key1",
          auth_key: "auth1",
          enabled: 1,
        },
      ];

      vi.mocked(prisma.mantis_webpush_subscription_table.findMany).mockResolvedValue(
        mockSubscriptions as any
      );

      const webpush = await import("web-push");
      vi.mocked(webpush.default.sendNotification).mockResolvedValue({} as any);

      await sendWebPush(1, {
        title: "Test",
        body: "Body",
        data: { issueId: 123 },
      });

      const payload = vi.mocked(webpush.default.sendNotification).mock.calls[0][1];
      const parsedPayload = JSON.parse(payload);
      expect(parsedPayload.data).toEqual({ issueId: 123 });
    });

    it("should handle send failures gracefully", async () => {
      const mockSubscriptions = [
        {
          id: 1,
          user_id: 1,
          endpoint: "https://push.example.com/sub1",
          p256dh_key: "key1",
          auth_key: "auth1",
          enabled: 1,
        },
      ];

      vi.mocked(prisma.mantis_webpush_subscription_table.findMany).mockResolvedValue(
        mockSubscriptions as any
      );

      const webpush = await import("web-push");
      vi.mocked(webpush.default.sendNotification).mockRejectedValue(
        new Error("Push service error")
      );

      // Should not throw - failures are handled with Promise.allSettled
      await expect(
        sendWebPush(1, { title: "Test", body: "Body" })
      ).resolves.not.toThrow();
    });
  });
});
