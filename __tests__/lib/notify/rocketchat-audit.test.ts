// __tests__/lib/notify/rocketchat-audit.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  extractMessageId,
  getRocketChatAuditForBug,
  getRocketChatAuditForUser,
  findAuditByMessageId,
  getRocketChatStats,
  getRecentFailures,
  getNotificationsWithMessageIds,
  getDeliveryMethodBreakdown,
  isRocketChatHealthy,
} from "@/lib/notify/rocketchat-audit";

// Mock database client
vi.mock("@/db/client", () => ({
  prisma: {
    mantis_email_audit_table: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { prisma } from "@/db/client";

describe("Rocket.Chat Audit Reporting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("extractMessageId", () => {
    it("should extract message ID from valid JSON metadata", () => {
      const metadata = JSON.stringify({
        messageId: "abc123xyz",
        timestamp: "2025-10-03T10:00:00Z",
      });

      const result = extractMessageId(metadata);

      expect(result).toBe("abc123xyz");
    });

    it("should return null for non-JSON strings", () => {
      const result = extractMessageId("This is not JSON");

      expect(result).toBeNull();
    });

    it("should return null for JSON without messageId", () => {
      const metadata = JSON.stringify({
        timestamp: "2025-10-03T10:00:00Z",
        channel: "#test",
      });

      const result = extractMessageId(metadata);

      expect(result).toBeNull();
    });

    it("should return null for malformed JSON", () => {
      const result = extractMessageId("{invalid json}");

      expect(result).toBeNull();
    });

    it("should handle empty strings", () => {
      const result = extractMessageId("");

      expect(result).toBeNull();
    });
  });

  describe("getRocketChatAuditForBug", () => {
    it("should retrieve all Rocket.Chat audit entries for a bug", async () => {
      const mockEntries = [
        {
          id: 1,
          bug_id: 123,
          user_id: 1,
          recipient: "#mantis-bugs",
          subject: "Bug Created",
          status: "success",
          date_sent: Math.floor(Date.now() / 1000),
          error_message: JSON.stringify({ messageId: "msg123" }),
        },
        {
          id: 2,
          bug_id: 123,
          user_id: 2,
          recipient: "#project-alpha",
          subject: "Bug Updated",
          status: "success",
          date_sent: Math.floor(Date.now() / 1000) - 3600,
          error_message: JSON.stringify({ messageId: "msg456" }),
        },
      ];

      (prisma.mantis_email_audit_table.findMany as any).mockResolvedValue(
        mockEntries
      );

      const result = await getRocketChatAuditForBug(123);

      expect(result).toHaveLength(2);
      expect(result[0].bugId).toBe(123);
      expect(result[0].metadata?.messageId).toBe("msg123");
      expect(result[1].metadata?.messageId).toBe("msg456");
      expect(prisma.mantis_email_audit_table.findMany).toHaveBeenCalledWith({
        where: {
          bug_id: 123,
          channel: "rocketchat",
        },
        orderBy: { date_sent: "desc" },
      });
    });

    it("should return empty array when no entries found", async () => {
      (prisma.mantis_email_audit_table.findMany as any).mockResolvedValue([]);

      const result = await getRocketChatAuditForBug(999);

      expect(result).toEqual([]);
    });

    it("should handle database errors gracefully", async () => {
      (prisma.mantis_email_audit_table.findMany as any).mockRejectedValue(
        new Error("Database error")
      );

      const result = await getRocketChatAuditForBug(123);

      expect(result).toEqual([]);
    });

    it("should separate success and failure entries", async () => {
      const mockEntries = [
        {
          id: 1,
          bug_id: 123,
          user_id: 1,
          recipient: "#mantis-bugs",
          subject: "Success",
          status: "success",
          date_sent: Math.floor(Date.now() / 1000),
          error_message: JSON.stringify({ messageId: "msg123" }),
        },
        {
          id: 2,
          bug_id: 123,
          user_id: 2,
          recipient: "#mantis-bugs",
          subject: "Failure",
          status: "failed",
          date_sent: Math.floor(Date.now() / 1000) - 3600,
          error_message: "Connection timeout",
        },
      ];

      (prisma.mantis_email_audit_table.findMany as any).mockResolvedValue(
        mockEntries
      );

      const result = await getRocketChatAuditForBug(123);

      expect(result[0].metadata).toBeTruthy();
      expect(result[0].errorMessage).toBeUndefined();
      expect(result[1].metadata).toBeNull();
      expect(result[1].errorMessage).toBe("Connection timeout");
    });
  });

  describe("getRocketChatAuditForUser", () => {
    it("should retrieve user's Rocket.Chat notification history", async () => {
      const mockEntries = [
        {
          id: 1,
          bug_id: 123,
          user_id: 5,
          recipient: "#mantis-bugs",
          subject: "Bug Created",
          status: "success",
          date_sent: Math.floor(Date.now() / 1000),
          error_message: JSON.stringify({ messageId: "msg123" }),
        },
      ];

      (prisma.mantis_email_audit_table.findMany as any).mockResolvedValue(
        mockEntries
      );

      const result = await getRocketChatAuditForUser(5);

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(5);
      expect(prisma.mantis_email_audit_table.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 5,
          channel: "rocketchat",
        },
        orderBy: { date_sent: "desc" },
        take: 20,
      });
    });

    it("should respect custom limit parameter", async () => {
      (prisma.mantis_email_audit_table.findMany as any).mockResolvedValue([]);

      await getRocketChatAuditForUser(5, 50);

      expect(prisma.mantis_email_audit_table.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      (prisma.mantis_email_audit_table.findMany as any).mockRejectedValue(
        new Error("Database error")
      );

      const result = await getRocketChatAuditForUser(5);

      expect(result).toEqual([]);
    });
  });

  describe("findAuditByMessageId", () => {
    it("should find audit entry by Rocket.Chat message ID", async () => {
      const mockEntries = [
        {
          id: 1,
          bug_id: 123,
          user_id: 5,
          recipient: "#mantis-bugs",
          subject: "Bug Created",
          status: "success",
          date_sent: Math.floor(Date.now() / 1000),
          error_message: JSON.stringify({ messageId: "msg123" }),
        },
      ];

      (prisma.mantis_email_audit_table.findMany as any).mockResolvedValue(
        mockEntries
      );

      const result = await findAuditByMessageId("msg123");

      expect(result).not.toBeNull();
      expect(result?.metadata?.messageId).toBe("msg123");
      expect(prisma.mantis_email_audit_table.findMany).toHaveBeenCalledWith({
        where: {
          channel: "rocketchat",
          status: "success",
          error_message: {
            contains: "msg123",
          },
        },
        take: 1,
      });
    });

    it("should return null when message ID not found", async () => {
      (prisma.mantis_email_audit_table.findMany as any).mockResolvedValue([]);

      const result = await findAuditByMessageId("nonexistent");

      expect(result).toBeNull();
    });

    it("should handle database errors gracefully", async () => {
      (prisma.mantis_email_audit_table.findMany as any).mockRejectedValue(
        new Error("Database error")
      );

      const result = await findAuditByMessageId("msg123");

      expect(result).toBeNull();
    });
  });

  describe("getRocketChatStats", () => {
    it("should calculate comprehensive statistics", async () => {
      const now = Math.floor(Date.now() / 1000);
      const mockEntries = [
        // Recent success with message ID (REST API)
        {
          id: 1,
          bug_id: 123,
          user_id: 1,
          recipient: "#project-alpha",
          status: "success",
          date_sent: now - 3600, // 1 hour ago
          error_message: JSON.stringify({ messageId: "msg123" }),
        },
        // Recent success without message ID (webhook)
        {
          id: 2,
          bug_id: 124,
          user_id: 2,
          recipient: "#project-beta",
          status: "success",
          date_sent: now - 7200, // 2 hours ago
          error_message: JSON.stringify({ timestamp: "2025-10-03T10:00:00Z" }),
        },
        // Recent failure
        {
          id: 3,
          bug_id: 125,
          user_id: 3,
          recipient: "#project-alpha",
          status: "failed",
          date_sent: now - 10800, // 3 hours ago
          error_message: "Connection timeout",
        },
        // Old entry (outside 24h window)
        {
          id: 4,
          bug_id: 126,
          user_id: 4,
          recipient: "#project-alpha",
          status: "success",
          date_sent: now - 8 * 24 * 3600, // 8 days ago
          error_message: JSON.stringify({ messageId: "msg456" }),
        },
      ];

      (prisma.mantis_email_audit_table.findMany as any).mockResolvedValue(
        mockEntries
      );

      const result = await getRocketChatStats(30);

      expect(result.totalSent).toBe(4);
      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(1);
      expect(result.successRate).toBe(75);
      expect(result.webhookCount).toBe(1);
      expect(result.restApiCount).toBe(2);
      expect(result.messageIdCaptureRate).toBe(66.67);
      expect(result.byChannel["#project-alpha"]).toBe(3);
      expect(result.byChannel["#project-beta"]).toBe(1);
      expect(result.recentActivity.last24h).toBe(3);
      expect(result.recentActivity.last7d).toBe(3);
      expect(result.recentActivity.last30d).toBe(4);
    });

    it("should handle empty dataset", async () => {
      (prisma.mantis_email_audit_table.findMany as any).mockResolvedValue([]);

      const result = await getRocketChatStats(30);

      expect(result.totalSent).toBe(0);
      expect(result.successRate).toBe(0);
      expect(result.messageIdCaptureRate).toBe(0);
      expect(result.byChannel).toEqual({});
    });

    it("should handle database errors gracefully", async () => {
      (prisma.mantis_email_audit_table.findMany as any).mockRejectedValue(
        new Error("Database error")
      );

      const result = await getRocketChatStats(30);

      expect(result.totalSent).toBe(0);
      expect(result.successRate).toBe(0);
    });

    it("should correctly identify webhook vs REST API usage", async () => {
      const now = Math.floor(Date.now() / 1000);
      const mockEntries = [
        {
          id: 1,
          bug_id: 123,
          user_id: 1,
          recipient: "#test",
          status: "success",
          date_sent: now - 3600,
          error_message: JSON.stringify({ messageId: "msg123" }), // REST API
        },
        {
          id: 2,
          bug_id: 124,
          user_id: 2,
          recipient: "#test",
          status: "success",
          date_sent: now - 3600,
          error_message: JSON.stringify({ timestamp: "2025-10-03" }), // Webhook
        },
        {
          id: 3,
          bug_id: 125,
          user_id: 3,
          recipient: "#test",
          status: "success",
          date_sent: now - 3600,
          error_message: "", // Webhook (no metadata)
        },
      ];

      (prisma.mantis_email_audit_table.findMany as any).mockResolvedValue(
        mockEntries
      );

      const result = await getRocketChatStats(7);

      expect(result.restApiCount).toBe(1);
      expect(result.webhookCount).toBe(2);
    });
  });

  describe("getRecentFailures", () => {
    it("should retrieve recent failed notifications", async () => {
      const mockEntries = [
        {
          id: 1,
          bug_id: 123,
          user_id: 1,
          recipient: "#mantis-bugs",
          subject: "Failed Notification",
          status: "failed",
          date_sent: Math.floor(Date.now() / 1000),
          error_message: "Connection timeout",
        },
      ];

      (prisma.mantis_email_audit_table.findMany as any).mockResolvedValue(
        mockEntries
      );

      const result = await getRecentFailures(10);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("failed");
      expect(result[0].errorMessage).toBe("Connection timeout");
      expect(result[0].metadata).toBeNull();
      expect(prisma.mantis_email_audit_table.findMany).toHaveBeenCalledWith({
        where: {
          channel: "rocketchat",
          status: "failed",
        },
        orderBy: { date_sent: "desc" },
        take: 10,
      });
    });

    it("should handle empty results", async () => {
      (prisma.mantis_email_audit_table.findMany as any).mockResolvedValue([]);

      const result = await getRecentFailures();

      expect(result).toEqual([]);
    });

    it("should handle database errors gracefully", async () => {
      (prisma.mantis_email_audit_table.findMany as any).mockRejectedValue(
        new Error("Database error")
      );

      const result = await getRecentFailures();

      expect(result).toEqual([]);
    });
  });

  describe("getNotificationsWithMessageIds", () => {
    it("should retrieve notifications sent via REST API", async () => {
      const mockEntries = [
        {
          id: 1,
          bug_id: 123,
          user_id: 1,
          recipient: "#mantis-bugs",
          subject: "REST API Notification",
          status: "success",
          date_sent: Math.floor(Date.now() / 1000),
          error_message: JSON.stringify({ messageId: "msg123" }),
        },
      ];

      (prisma.mantis_email_audit_table.findMany as any).mockResolvedValue(
        mockEntries
      );

      const result = await getNotificationsWithMessageIds(20);

      expect(result).toHaveLength(1);
      expect(result[0].metadata?.messageId).toBe("msg123");
      expect(prisma.mantis_email_audit_table.findMany).toHaveBeenCalledWith({
        where: {
          channel: "rocketchat",
          status: "success",
          error_message: {
            contains: "messageId",
          },
        },
        orderBy: { date_sent: "desc" },
        take: 20,
      });
    });

    it("should handle empty results", async () => {
      (prisma.mantis_email_audit_table.findMany as any).mockResolvedValue([]);

      const result = await getNotificationsWithMessageIds();

      expect(result).toEqual([]);
    });

    it("should handle database errors gracefully", async () => {
      (prisma.mantis_email_audit_table.findMany as any).mockRejectedValue(
        new Error("Database error")
      );

      const result = await getNotificationsWithMessageIds();

      expect(result).toEqual([]);
    });
  });

  describe("getDeliveryMethodBreakdown", () => {
    it("should calculate webhook vs REST API breakdown", async () => {
      const now = Math.floor(Date.now() / 1000);
      const mockEntries = [
        {
          id: 1,
          bug_id: 123,
          user_id: 1,
          recipient: "#test",
          status: "success",
          date_sent: now - 3600,
          error_message: JSON.stringify({ messageId: "msg123" }),
        },
        {
          id: 2,
          bug_id: 124,
          user_id: 2,
          recipient: "#test",
          status: "success",
          date_sent: now - 7200,
          error_message: JSON.stringify({ timestamp: "2025-10-03" }),
        },
        {
          id: 3,
          bug_id: 125,
          user_id: 3,
          recipient: "#test",
          status: "success",
          date_sent: now - 10800,
          error_message: JSON.stringify({ timestamp: "2025-10-03" }),
        },
      ];

      (prisma.mantis_email_audit_table.findMany as any).mockResolvedValue(
        mockEntries
      );

      const result = await getDeliveryMethodBreakdown(7);

      expect(result.restApi).toBe(1);
      expect(result.webhook).toBe(2);
      expect(result.total).toBe(3);
    });

    it("should handle empty results", async () => {
      (prisma.mantis_email_audit_table.findMany as any).mockResolvedValue([]);

      const result = await getDeliveryMethodBreakdown(7);

      expect(result.restApi).toBe(0);
      expect(result.webhook).toBe(0);
      expect(result.total).toBe(0);
    });

    it("should handle database errors gracefully", async () => {
      (prisma.mantis_email_audit_table.findMany as any).mockRejectedValue(
        new Error("Database error")
      );

      const result = await getDeliveryMethodBreakdown(7);

      expect(result.restApi).toBe(0);
      expect(result.webhook).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe("isRocketChatHealthy", () => {
    it("should report healthy when success rate is high", async () => {
      const now = Math.floor(Date.now() / 1000);
      const mockEntries = [
        {
          id: 1,
          bug_id: 123,
          user_id: 1,
          recipient: "#test",
          status: "success",
          date_sent: now - 3600,
          error_message: "",
        },
        {
          id: 2,
          bug_id: 124,
          user_id: 2,
          recipient: "#test",
          status: "success",
          date_sent: now - 7200,
          error_message: "",
        },
        {
          id: 3,
          bug_id: 125,
          user_id: 3,
          recipient: "#test",
          status: "success",
          date_sent: now - 10800,
          error_message: "",
        },
        {
          id: 4,
          bug_id: 126,
          user_id: 4,
          recipient: "#test",
          status: "success",
          date_sent: now - 14400,
          error_message: "",
        },
        {
          id: 5,
          bug_id: 127,
          user_id: 5,
          recipient: "#test",
          status: "failed",
          date_sent: now - 18000,
          error_message: "Timeout",
        },
      ];

      (prisma.mantis_email_audit_table.findMany as any).mockResolvedValue(
        mockEntries
      );

      const result = await isRocketChatHealthy();

      expect(result.healthy).toBe(true);
      expect(result.recentSuccessRate).toBe(80);
      expect(result.lastSuccessfulDelivery).toBe(now - 3600);
      expect(result.issuesSummary).toBeUndefined();
    });

    it("should report unhealthy when success rate is low", async () => {
      const now = Math.floor(Date.now() / 1000);
      const mockEntries = [
        {
          id: 1,
          bug_id: 123,
          user_id: 1,
          recipient: "#test",
          status: "failed",
          date_sent: now - 3600,
          error_message: "Connection timeout",
        },
        {
          id: 2,
          bug_id: 124,
          user_id: 2,
          recipient: "#test",
          status: "failed",
          date_sent: now - 7200,
          error_message: "Invalid webhook",
        },
        {
          id: 3,
          bug_id: 125,
          user_id: 3,
          recipient: "#test",
          status: "success",
          date_sent: now - 10800,
          error_message: "",
        },
      ];

      (prisma.mantis_email_audit_table.findMany as any).mockResolvedValue(
        mockEntries
      );

      const result = await isRocketChatHealthy();

      expect(result.healthy).toBe(false);
      expect(result.recentSuccessRate).toBe(33.33);
      expect(result.issuesSummary).toContain("Low success rate");
      expect(result.issuesSummary).toContain("Connection timeout");
    });

    it("should handle no recent notifications", async () => {
      (prisma.mantis_email_audit_table.findMany as any).mockResolvedValue([]);

      const result = await isRocketChatHealthy();

      expect(result.healthy).toBe(true);
      expect(result.recentSuccessRate).toBe(0);
      expect(result.issuesSummary).toBe("No notifications sent in last 24 hours");
    });

    it("should handle database errors gracefully", async () => {
      (prisma.mantis_email_audit_table.findMany as any).mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await isRocketChatHealthy();

      expect(result.healthy).toBe(false);
      expect(result.recentSuccessRate).toBe(0);
      expect(result.issuesSummary).toContain("Error checking health");
    });

    it("should identify last successful delivery", async () => {
      const now = Math.floor(Date.now() / 1000);
      const successTime = now - 5000;
      const mockEntries = [
        {
          id: 1,
          bug_id: 123,
          user_id: 1,
          recipient: "#test",
          status: "failed",
          date_sent: now - 1000,
          error_message: "Error",
        },
        {
          id: 2,
          bug_id: 124,
          user_id: 2,
          recipient: "#test",
          status: "success",
          date_sent: successTime,
          error_message: "",
        },
        {
          id: 3,
          bug_id: 125,
          user_id: 3,
          recipient: "#test",
          status: "failed",
          date_sent: now - 10000,
          error_message: "Error",
        },
      ];

      (prisma.mantis_email_audit_table.findMany as any).mockResolvedValue(
        mockEntries
      );

      const result = await isRocketChatHealthy();

      expect(result.lastSuccessfulDelivery).toBe(successTime);
    });
  });
});
