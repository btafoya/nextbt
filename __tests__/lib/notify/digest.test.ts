// /__tests__/lib/notify/digest.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  queueNotification,
  getDigestPreferences,
  updateDigestPreferences,
  getUserQueuedNotifications,
} from "@/lib/notify/digest";
import { prisma } from "@/db/client";

// Mock Prisma client
vi.mock("@/db/client", () => ({
  prisma: {
    mantis_notification_queue_table: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    mantis_digest_pref_table: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    mantis_user_table: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Notification Digest System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("queueNotification", () => {
    it("should queue a notification successfully", async () => {
      const mockQueuedNotification = {
        id: 1,
        user_id: 1,
        bug_id: 100,
        event_type: "new",
        severity: 50,
        priority: 30,
        category_id: 1,
        subject: "New Issue",
        body: "Issue description",
        html_body: "<p>Issue description</p>",
        metadata: { key: "value" },
        status: "pending",
        batch_id: null,
        date_created: 1696000000,
        date_scheduled: 1696000000,
        date_sent: null,
      };

      vi.mocked(prisma.mantis_notification_queue_table.create).mockResolvedValue(
        mockQueuedNotification as any
      );

      const result = await queueNotification({
        userId: 1,
        bugId: 100,
        eventType: "new",
        severity: 50,
        priority: 30,
        categoryId: 1,
        subject: "New Issue",
        body: "Issue description",
        htmlBody: "<p>Issue description</p>",
        metadata: { key: "value" },
      });

      expect(result).toBe(1);
      expect(prisma.mantis_notification_queue_table.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 1,
          bug_id: 100,
          event_type: "new",
          severity: 50,
          priority: 30,
          category_id: 1,
          subject: "New Issue",
          body: "Issue description",
          html_body: "<p>Issue description</p>",
          status: "pending",
        }),
      });
    });

    it("should handle metadata correctly", async () => {
      const mockQueuedNotification = {
        id: 1,
        user_id: 1,
        bug_id: 100,
        event_type: "new",
        metadata: { test: "data" },
      };

      vi.mocked(prisma.mantis_notification_queue_table.create).mockResolvedValue(
        mockQueuedNotification as any
      );

      await queueNotification({
        userId: 1,
        bugId: 100,
        eventType: "new",
        severity: 50,
        priority: 30,
        categoryId: 1,
        subject: "Test",
        body: "Test body",
        metadata: { test: "data" },
      });

      const createCall = vi.mocked(prisma.mantis_notification_queue_table.create).mock.calls[0][0];
      expect(createCall.data.metadata).toEqual({ test: "data" });
    });
  });

  describe("getDigestPreferences", () => {
    it("should return null if none exist", async () => {
      vi.mocked(prisma.mantis_digest_pref_table.findUnique).mockResolvedValue(null);

      const prefs = await getDigestPreferences(1);

      expect(prefs).toBeNull();
    });

    it("should return existing preferences", async () => {
      const mockPrefs = {
        user_id: 1,
        enabled: 1,
        frequency: "hourly",
        time_of_day: 14,
        day_of_week: 3,
        min_notifications: 5,
        include_channels: ["email", "webpush"],
        last_digest_sent: null,
        next_digest_scheduled: null,
      };

      vi.mocked(prisma.mantis_digest_pref_table.findUnique).mockResolvedValue(
        mockPrefs as any
      );

      const prefs = await getDigestPreferences(1);

      expect(prefs).toEqual({
        enabled: true,
        frequency: "hourly",
        timeOfDay: 14,
        dayOfWeek: 3,
        minNotifications: 5,
        includeChannels: ["email", "webpush"],
      });
    });

    it("should handle missing include_channels", async () => {
      const mockPrefs = {
        user_id: 1,
        enabled: 1,
        frequency: "daily",
        time_of_day: 9,
        day_of_week: 1,
        min_notifications: 1,
        include_channels: null,
        last_digest_sent: null,
        next_digest_scheduled: null,
      };

      vi.mocked(prisma.mantis_digest_pref_table.findUnique).mockResolvedValue(
        mockPrefs as any
      );

      const prefs = await getDigestPreferences(1);

      expect(prefs.includeChannels).toEqual(["email"]);
    });
  });

  describe("updateDigestPreferences", () => {
    it("should upsert digest preferences", async () => {
      const mockUpsertResult = {
        user_id: 1,
        enabled: 1,
        frequency: "weekly",
        time_of_day: 9,
        day_of_week: 1,
        min_notifications: 10,
        include_channels: ["email", "webpush"],
        last_digest_sent: null,
        next_digest_scheduled: null,
      };

      vi.mocked(prisma.mantis_digest_pref_table.upsert).mockResolvedValue(
        mockUpsertResult as any
      );

      await updateDigestPreferences(1, {
        enabled: true,
        frequency: "weekly",
        minNotifications: 10,
        includeChannels: ["email", "webpush"],
      });

      expect(prisma.mantis_digest_pref_table.upsert).toHaveBeenCalledWith({
        where: { user_id: 1 },
        create: expect.objectContaining({
          user_id: 1,
          enabled: 1,
          frequency: "weekly",
          min_notifications: 10,
          include_channels: ["email", "webpush"],
        }),
        update: expect.objectContaining({
          enabled: 1,
          frequency: "weekly",
          min_notifications: 10,
          include_channels: ["email", "webpush"],
        }),
      });
    });

    it("should handle partial updates", async () => {
      const mockUpsertResult = {
        user_id: 1,
        enabled: 0,
        frequency: "daily",
        time_of_day: 9,
        day_of_week: 1,
        min_notifications: 1,
        include_channels: ["email"],
        last_digest_sent: null,
        next_digest_scheduled: null,
      };

      vi.mocked(prisma.mantis_digest_pref_table.upsert).mockResolvedValue(
        mockUpsertResult as any
      );

      await updateDigestPreferences(1, { enabled: false });

      const updateCall = vi.mocked(prisma.mantis_digest_pref_table.upsert).mock.calls[0][0];
      expect(updateCall.update.enabled).toBe(0);
      expect(updateCall.update.frequency).toBeUndefined();
    });
  });

  describe("getUserQueuedNotifications", () => {
    it("should return queued notifications for user", async () => {
      const mockNotifications = [
        {
          id: 1,
          user_id: 1,
          bug_id: 100,
          event_type: "new",
          severity: 50,
          priority: 30,
          category_id: 1,
          subject: "Test 1",
          body: "Body 1",
          html_body: null,
          metadata: null,
          status: "pending",
          batch_id: null,
          date_created: 1696000000,
          date_scheduled: 1696000000,
          date_sent: null,
        },
        {
          id: 2,
          user_id: 1,
          bug_id: 101,
          event_type: "updated",
          severity: 40,
          priority: 20,
          category_id: 2,
          subject: "Test 2",
          body: "Body 2",
          html_body: null,
          metadata: null,
          status: "pending",
          batch_id: null,
          date_created: 1696000001,
          date_scheduled: 1696000001,
          date_sent: null,
        },
      ];

      vi.mocked(prisma.mantis_notification_queue_table.findMany).mockResolvedValue(
        mockNotifications as any
      );

      const result = await getUserQueuedNotifications(1);

      expect(result).toHaveLength(2);
      expect(result[0].bug_id).toBe(100);
      expect(result[1].bug_id).toBe(101);
    });

    it("should filter by status if provided", async () => {
      vi.mocked(prisma.mantis_notification_queue_table.findMany).mockResolvedValue([]);

      await getUserQueuedNotifications(1, "sent");

      expect(prisma.mantis_notification_queue_table.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          status: "sent",
        },
        orderBy: { date_created: "desc" },
        take: 100,
      });
    });

    it("should limit results to 100", async () => {
      vi.mocked(prisma.mantis_notification_queue_table.findMany).mockResolvedValue([]);

      await getUserQueuedNotifications(1);

      const callArgs = vi.mocked(prisma.mantis_notification_queue_table.findMany).mock.calls[0][0];
      expect(callArgs.take).toBe(100);
    });
  });
});
