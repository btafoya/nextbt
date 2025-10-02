// /__tests__/lib/notify/history.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  logNotificationHistory,
  getUserNotificationHistory,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  getUserNotificationStats,
} from "@/lib/notify/history";
import { prisma } from "@/db/client";

// Mock Prisma client
vi.mock("@/db/client", () => ({
  prisma: {
    mantis_notification_history_table: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      deleteMany: vi.fn(),
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

describe("Notification History System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("logNotificationHistory", () => {
    it("should create a history entry", async () => {
      const mockHistoryEntry = {
        id: 1,
        user_id: 1,
        bug_id: 100,
        event_type: "new",
        subject: "New Issue",
        body: "Issue created",
        channels_sent: ["email"],
        read_status: 0,
        date_sent: 1696000000,
        date_read: null,
      };

      vi.mocked(prisma.mantis_notification_history_table.create).mockResolvedValue(
        mockHistoryEntry as any
      );

      const result = await logNotificationHistory({
        userId: 1,
        bugId: 100,
        eventType: "new",
        subject: "New Issue",
        body: "Issue created",
        channelsSent: ["email"],
      });

      expect(result).toBe(1);
      expect(prisma.mantis_notification_history_table.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 1,
          bug_id: 100,
          event_type: "new",
          subject: "New Issue",
          body: "Issue created",
          channels_sent: ["email"],
          read_status: 0,
        }),
      });
    });

    it("should handle empty channels_sent", async () => {
      const mockHistoryEntry = {
        id: 1,
        user_id: 1,
        bug_id: 100,
        event_type: "new",
        subject: "Test",
        body: "Body",
        channels_sent: [],
        read_status: 0,
        date_sent: 1696000000,
        date_read: null,
      };

      vi.mocked(prisma.mantis_notification_history_table.create).mockResolvedValue(
        mockHistoryEntry as any
      );

      await logNotificationHistory({
        userId: 1,
        bugId: 100,
        eventType: "new",
        subject: "Test",
        body: "Body",
        channelsSent: [],
      });

      const createCall = vi.mocked(prisma.mantis_notification_history_table.create).mock.calls[0][0];
      expect(createCall.data.channels_sent).toEqual([]);
    });
  });

  describe("getUserNotificationHistory", () => {
    it("should return paginated history", async () => {
      const mockHistory = [
        {
          id: 1,
          user_id: 1,
          bug_id: 100,
          event_type: "new",
          subject: "Issue 1",
          body: "Body 1",
          channels_sent: ["email"],
          read_status: 0,
          date_sent: 1696000000,
          date_read: null,
        },
        {
          id: 2,
          user_id: 1,
          bug_id: 101,
          event_type: "updated",
          subject: "Issue 2",
          body: "Body 2",
          channels_sent: ["email", "webpush"],
          read_status: 1,
          date_sent: 1696000001,
          date_read: 1696000100,
        },
      ];

      vi.mocked(prisma.mantis_notification_history_table.findMany).mockResolvedValue(
        mockHistory as any
      );

      const result = await getUserNotificationHistory(1, { limit: 50, offset: 0 });

      expect(result).toHaveLength(2);
      expect(result[0].bugId).toBe(100);
      expect(result[0].readStatus).toBe(false);
      expect(result[1].bugId).toBe(101);
      expect(result[1].readStatus).toBe(true);
    });

    it("should filter by unread only", async () => {
      vi.mocked(prisma.mantis_notification_history_table.findMany).mockResolvedValue([]);

      await getUserNotificationHistory(1, { unreadOnly: true });

      expect(prisma.mantis_notification_history_table.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          user_id: 1,
          read_status: 0,
        }),
        orderBy: { date_sent: "desc" },
        take: 50,
        skip: 0,
      });
    });

    it("should filter by event type", async () => {
      vi.mocked(prisma.mantis_notification_history_table.findMany).mockResolvedValue([]);

      await getUserNotificationHistory(1, { eventType: "commented" });

      expect(prisma.mantis_notification_history_table.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          user_id: 1,
          event_type: "commented",
        }),
        orderBy: { date_sent: "desc" },
        take: 50,
        skip: 0,
      });
    });

    it("should filter by bug ID", async () => {
      vi.mocked(prisma.mantis_notification_history_table.findMany).mockResolvedValue([]);

      await getUserNotificationHistory(1, { bugId: 123 });

      expect(prisma.mantis_notification_history_table.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          user_id: 1,
          bug_id: 123,
        }),
        orderBy: { date_sent: "desc" },
        take: 50,
        skip: 0,
      });
    });

    it("should respect limit and offset", async () => {
      vi.mocked(prisma.mantis_notification_history_table.findMany).mockResolvedValue([]);

      await getUserNotificationHistory(1, { limit: 10, offset: 20 });

      const callArgs = vi.mocked(prisma.mantis_notification_history_table.findMany).mock.calls[0][0];
      expect(callArgs.take).toBe(10);
      expect(callArgs.skip).toBe(20);
    });
  });

  describe("markNotificationAsRead", () => {
    it("should mark notification as read", async () => {
      vi.mocked(prisma.mantis_notification_history_table.update).mockResolvedValue({} as any);

      await markNotificationAsRead(123);

      expect(prisma.mantis_notification_history_table.update).toHaveBeenCalledWith({
        where: {
          id: 123,
        },
        data: {
          read_status: 1,
          date_read: expect.any(Number),
        },
      });
    });
  });

  describe("markAllNotificationsAsRead", () => {
    it("should mark all unread notifications as read", async () => {
      vi.mocked(prisma.mantis_notification_history_table.updateMany).mockResolvedValue({
        count: 5,
      } as any);

      const result = await markAllNotificationsAsRead(1);

      expect(result).toBe(5);
      expect(prisma.mantis_notification_history_table.updateMany).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          read_status: 0,
        },
        data: {
          read_status: 1,
          date_read: expect.any(Number),
        },
      });
    });

    it("should return 0 if no unread notifications", async () => {
      vi.mocked(prisma.mantis_notification_history_table.updateMany).mockResolvedValue({
        count: 0,
      } as any);

      const result = await markAllNotificationsAsRead(1);

      expect(result).toBe(0);
    });
  });

  describe("getUnreadNotificationCount", () => {
    it("should return count of unread notifications", async () => {
      vi.mocked(prisma.mantis_notification_history_table.count).mockResolvedValue(7);

      const result = await getUnreadNotificationCount(1);

      expect(result).toBe(7);
      expect(prisma.mantis_notification_history_table.count).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          read_status: 0,
        },
      });
    });

    it("should return 0 if no unread notifications", async () => {
      vi.mocked(prisma.mantis_notification_history_table.count).mockResolvedValue(0);

      const result = await getUnreadNotificationCount(999);

      expect(result).toBe(0);
    });
  });

  describe("getUserNotificationStats", () => {
    it("should return comprehensive stats", async () => {
      vi.mocked(prisma.mantis_notification_history_table.count)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(15) // unread
        .mockResolvedValueOnce(85); // read

      // Mock groupBy for event types
      vi.mocked(prisma.mantis_notification_history_table.groupBy)
        .mockResolvedValueOnce([
          { event_type: "new", _count: 50 },
          { event_type: "updated", _count: 30 },
        ] as any)
        .mockResolvedValueOnce([
          { date_sent: Math.floor(Date.now() / 1000) - 3600, _count: 10 },
        ] as any);

      const mockHistory = [
        {
          channels_sent: ["email"],
          date_sent: Math.floor(Date.now() / 1000) - 3600,
        },
        {
          channels_sent: ["webpush"],
          date_sent: Math.floor(Date.now() / 1000) - 7200,
        },
      ];

      vi.mocked(prisma.mantis_notification_history_table.findMany).mockResolvedValue(
        mockHistory as any
      );

      const result = await getUserNotificationStats(1);

      expect(result.total).toBe(100);
      expect(result.unread).toBe(15);
      expect(result.byEventType).toHaveProperty("new");
      expect(result.byChannel).toHaveProperty("email");
      expect(result.byChannel).toHaveProperty("webpush");
      expect(result.recentActivity).toHaveProperty("last24h");
      expect(result.recentActivity).toHaveProperty("last7d");
    });

    it("should handle empty history", async () => {
      vi.mocked(prisma.mantis_notification_history_table.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      vi.mocked(prisma.mantis_notification_history_table.groupBy)
        .mockResolvedValue([] as any);

      vi.mocked(prisma.mantis_notification_history_table.findMany).mockResolvedValue([]);

      const result = await getUserNotificationStats(999);

      expect(result.total).toBe(0);
      expect(result.unread).toBe(0);
      expect(result.byChannel).toEqual({});
    });
  });
});
