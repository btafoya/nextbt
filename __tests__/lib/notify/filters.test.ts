// /__tests__/lib/notify/filters.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createNotificationFilter,
  updateNotificationFilter,
  deleteNotificationFilter,
  getUserNotificationFilters,
  checkNotificationFilters,
  getSuggestedFilterValues,
} from "@/lib/notify/filters";
import { prisma } from "@/db/client";

// Mock Prisma client
vi.mock("@/db/client", () => ({
  prisma: {
    mantis_notification_filter_table: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    mantis_bug_table: {
      findMany: vi.fn(),
    },
    mantis_category_table: {
      findMany: vi.fn(),
    },
    mantis_tag_table: {
      findMany: vi.fn(),
    },
    mantis_project_user_list_table: {
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Notification Filter System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createNotificationFilter", () => {
    it("should create a filter successfully", async () => {
      const mockFilter = {
        id: 1,
        user_id: 1,
        project_id: 0,
        enabled: 1,
        filter_type: "priority",
        filter_value: "50",
        action: "notify",
        channels: ["email"],
        date_created: 1696000000,
        date_modified: 1696000000,
      };

      vi.mocked(prisma.mantis_notification_filter_table.create).mockResolvedValue(
        mockFilter as any
      );

      const result = await createNotificationFilter({
        userId: 1,
        projectId: 0,
        enabled: true,
        filterType: "priority",
        filterValue: "50",
        action: "notify",
        channels: ["email"],
      });

      expect(result).toBe(1);
      expect(prisma.mantis_notification_filter_table.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 1,
          project_id: 0,
          enabled: 1,
          filter_type: "priority",
          filter_value: "50",
          action: "notify",
          channels: ["email"],
        }),
      });
    });

    it("should default to global filter (project_id: 0)", async () => {
      const mockFilter = {
        id: 1,
        user_id: 1,
        project_id: 0,
        enabled: 1,
        filter_type: "category",
        filter_value: "Bug",
        action: "ignore",
        channels: [],
        date_created: 1696000000,
        date_modified: 1696000000,
      };

      vi.mocked(prisma.mantis_notification_filter_table.create).mockResolvedValue(
        mockFilter as any
      );

      await createNotificationFilter({
        userId: 1,
        projectId: 0,
        enabled: true,
        filterType: "category",
        filterValue: "Bug",
        action: "ignore",
        channels: [],
      });

      const createCall = vi.mocked(prisma.mantis_notification_filter_table.create).mock.calls[0][0];
      expect(createCall.data.project_id).toBe(0);
    });
  });

  describe("updateNotificationFilter", () => {
    it("should update filter fields", async () => {
      vi.mocked(prisma.mantis_notification_filter_table.update).mockResolvedValue({} as any);

      await updateNotificationFilter(123, {
        enabled: false,
        action: "digest_only",
      });

      expect(prisma.mantis_notification_filter_table.update).toHaveBeenCalledWith({
        where: {
          id: 123,
        },
        data: expect.objectContaining({
          enabled: 0,
          action: "digest_only",
        }),
      });
    });

    it("should not update undefined fields", async () => {
      vi.mocked(prisma.mantis_notification_filter_table.update).mockResolvedValue({} as any);

      await updateNotificationFilter(123, {
        enabled: true,
      });

      const updateCall = vi.mocked(prisma.mantis_notification_filter_table.update).mock.calls[0][0];
      expect(updateCall.data.enabled).toBe(1);
      expect(updateCall.data.filter_value).toBeUndefined();
      expect(updateCall.data.action).toBeUndefined();
    });
  });

  describe("deleteNotificationFilter", () => {
    it("should delete a filter", async () => {
      vi.mocked(prisma.mantis_notification_filter_table.delete).mockResolvedValue({} as any);

      await deleteNotificationFilter(123);

      expect(prisma.mantis_notification_filter_table.delete).toHaveBeenCalledWith({
        where: {
          id: 123,
        },
      });
    });
  });

  describe("getUserNotificationFilters", () => {
    it("should return all filters for user", async () => {
      const mockFilters = [
        {
          id: 1,
          user_id: 1,
          project_id: 0,
          enabled: 1,
          filter_type: "priority",
          filter_value: "50",
          action: "notify",
          channels: ["email"],
          date_created: 1696000000,
          date_modified: 1696000000,
        },
        {
          id: 2,
          user_id: 1,
          project_id: 5,
          enabled: 1,
          filter_type: "category",
          filter_value: "Bug",
          action: "ignore",
          channels: [],
          date_created: 1696000001,
          date_modified: 1696000001,
        },
      ];

      vi.mocked(prisma.mantis_notification_filter_table.findMany).mockResolvedValue(
        mockFilters as any
      );

      const result = await getUserNotificationFilters(1);

      expect(result).toHaveLength(2);
      expect(result[0].filterType).toBe("priority");
      expect(result[1].filterType).toBe("category");
    });

    it("should filter by project ID", async () => {
      vi.mocked(prisma.mantis_notification_filter_table.findMany).mockResolvedValue([]);

      await getUserNotificationFilters(1, 5);

      expect(prisma.mantis_notification_filter_table.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          project_id: 5,
        },
        orderBy: { date_created: "desc" },
      });
    });
  });

  describe("checkNotificationFilters", () => {
    it("should return no match if no filters", async () => {
      vi.mocked(prisma.mantis_notification_filter_table.findMany).mockResolvedValue([]);

      const result = await checkNotificationFilters(1, 5, {
        categoryId: 1,
        priority: 30,
        severity: 50,
      });

      expect(result.matched).toBe(false);
      expect(result.action).toBe("notify");
    });

    it("should match priority filter", async () => {
      const mockFilters = [
        {
          id: 1,
          user_id: 1,
          project_id: 0,
          enabled: 1,
          filter_type: "priority",
          filter_value: "50",
          action: "notify",
          channels: ["email"],
          date_created: 1696000000,
          date_modified: 1696000000,
        },
      ];

      vi.mocked(prisma.mantis_notification_filter_table.findMany).mockResolvedValue(
        mockFilters as any
      );

      const result = await checkNotificationFilters(1, 5, {
        categoryId: 1,
        priority: 50,
        severity: 40,
      });

      expect(result.matched).toBe(true);
      expect(result.action).toBe("notify");
      expect(result.channels).toEqual(["email"]);
    });

    it("should match severity range filter", async () => {
      const mockFilters = [
        {
          id: 1,
          user_id: 1,
          project_id: 0,
          enabled: 1,
          filter_type: "severity",
          filter_value: "40-60",
          action: "digest_only",
          channels: [],
          date_created: 1696000000,
          date_modified: 1696000000,
        },
      ];

      vi.mocked(prisma.mantis_notification_filter_table.findMany).mockResolvedValue(
        mockFilters as any
      );

      const result = await checkNotificationFilters(1, 5, {
        categoryId: 1,
        priority: 30,
        severity: 50,
      });

      expect(result.matched).toBe(true);
      expect(result.action).toBe("digest_only");
    });

    it("should prioritize ignore action", async () => {
      const mockFilters = [
        {
          id: 1,
          user_id: 1,
          project_id: 0,
          enabled: 1,
          filter_type: "priority",
          filter_value: "50",
          action: "notify",
          channels: ["email"],
          date_created: 1696000000,
          date_modified: 1696000000,
        },
        {
          id: 2,
          user_id: 1,
          project_id: 0,
          enabled: 1,
          filter_type: "severity",
          filter_value: "40",
          action: "ignore",
          channels: [],
          date_created: 1696000001,
          date_modified: 1696000001,
        },
      ];

      vi.mocked(prisma.mantis_notification_filter_table.findMany).mockResolvedValue(
        mockFilters as any
      );

      const result = await checkNotificationFilters(1, 5, {
        categoryId: 1,
        priority: 50,
        severity: 40,
      });

      // Ignore action should take precedence
      expect(result.matched).toBe(true);
      expect(result.action).toBe("ignore");
    });

    it("should check both global and project-specific filters", async () => {
      vi.mocked(prisma.mantis_notification_filter_table.findMany).mockResolvedValue([]);

      await checkNotificationFilters(1, 5, {
        categoryId: 1,
        priority: 30,
        severity: 50,
      });

      expect(prisma.mantis_notification_filter_table.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          project_id: { in: [0, 5] },
          enabled: 1,
        },
        orderBy: { date_created: "desc" },
      });
    });
  });

  describe("getSuggestedFilterValues", () => {
    it("should suggest category values", async () => {
      // Mock user projects
      vi.mocked(prisma.mantis_project_user_list_table.findMany).mockResolvedValue([
        { project_id: 1 },
        { project_id: 2 },
      ] as any);

      // Mock $queryRaw for categories
      const mockCategories = [
        { category_id: 1, count: BigInt(10), name: "Bug" },
        { category_id: 2, count: BigInt(5), name: "Feature" },
        { category_id: 3, count: BigInt(3), name: "Enhancement" },
      ];

      vi.mocked(prisma.$queryRaw).mockResolvedValue(mockCategories as any);

      const result = await getSuggestedFilterValues(1, "category");

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("value");
      expect(result[0]).toHaveProperty("count");
      expect(result[0]).toHaveProperty("label");
    });

    it("should suggest priority values", async () => {
      // Mock user projects
      vi.mocked(prisma.mantis_project_user_list_table.findMany).mockResolvedValue([
        { project_id: 1 },
      ] as any);

      // Mock $queryRaw for priorities
      const mockPriorities = [
        { priority: 10, count: BigInt(5) },
        { priority: 30, count: BigInt(10) },
        { priority: 50, count: BigInt(15) },
      ];

      vi.mocked(prisma.$queryRaw).mockResolvedValue(mockPriorities as any);

      const result = await getSuggestedFilterValues(1, "priority");

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("value");
      expect(result[0]).toHaveProperty("count");
    });

    it("should suggest severity values", async () => {
      // Mock user projects
      vi.mocked(prisma.mantis_project_user_list_table.findMany).mockResolvedValue([
        { project_id: 1 },
      ] as any);

      // Mock $queryRaw for severities
      const mockSeverities = [
        { severity: 10, count: BigInt(5) },
        { severity: 50, count: BigInt(10) },
        { severity: 70, count: BigInt(8) },
      ];

      vi.mocked(prisma.$queryRaw).mockResolvedValue(mockSeverities as any);

      const result = await getSuggestedFilterValues(1, "severity");

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("value");
      expect(result[0]).toHaveProperty("label");
    });

    it("should return empty array for unknown filter type", async () => {
      const result = await getSuggestedFilterValues(1, "unknown" as any);

      expect(result).toEqual([]);
    });
  });
});
