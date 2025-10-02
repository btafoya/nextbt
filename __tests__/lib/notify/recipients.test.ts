// /__tests__/lib/notify/recipients.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getNotificationRecipients } from "@/lib/notify/recipients";
import { prisma } from "@/db/client";

// Mock the Prisma client
vi.mock("@/db/client", () => ({
  prisma: {
    mantis_bug_table: {
      findUnique: vi.fn(),
    },
    mantis_project_user_list_table: {
      findMany: vi.fn(),
    },
    mantis_user_pref_table: {
      findMany: vi.fn(),
    },
  },
}));

// Mock secrets
vi.mock("@/config/secrets", () => ({
  secrets: {
    postmarkEnabled: true,
  },
}));

describe("getNotificationRecipients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array if issue not found", async () => {
    vi.mocked(prisma.mantis_bug_table.findUnique).mockResolvedValue(null);

    const result = await getNotificationRecipients(999);

    expect(result).toEqual([]);
  });

  it("should filter out disabled users", async () => {
    const mockIssue = {
      project_id: 1,
      reporter_id: 1,
      handler_id: 2,
      severity: 50,
    };

    const mockProjectUsers = [
      {
        project_id: 1,
        user_id: 1,
        access_level: 25,
        user: {
          id: 1,
          username: "user1",
          realname: "User One",
          email: "user1@example.com",
          enabled: 1,
        },
      },
      {
        project_id: 1,
        user_id: 2,
        access_level: 25,
        user: {
          id: 2,
          username: "user2",
          realname: "User Two",
          email: "user2@example.com",
          enabled: 0, // Disabled
        },
      },
    ];

    const mockPrefs = [
      {
        user_id: 1,
        email_on_new: 1,
        email_on_new_min_severity: 10,
      },
    ];

    vi.mocked(prisma.mantis_bug_table.findUnique).mockResolvedValue(
      mockIssue as any
    );
    vi.mocked(prisma.mantis_project_user_list_table.findMany).mockResolvedValue(
      mockProjectUsers as any
    );
    vi.mocked(prisma.mantis_user_pref_table.findMany).mockResolvedValue(
      mockPrefs as any
    );

    const result = await getNotificationRecipients(1);

    expect(result).toHaveLength(1);
    expect(result[0].username).toBe("user1");
  });

  it("should check severity threshold", async () => {
    const mockIssue = {
      project_id: 1,
      reporter_id: 1,
      handler_id: 0,
      severity: 30, // Medium severity
    };

    const mockProjectUsers = [
      {
        project_id: 1,
        user_id: 1,
        access_level: 25,
        user: {
          id: 1,
          username: "user1",
          realname: "User One",
          email: "user1@example.com",
          enabled: 1,
        },
      },
    ];

    const mockPrefs = [
      {
        user_id: 1,
        email_on_new: 1,
        email_on_new_min_severity: 50, // Requires high severity
      },
    ];

    vi.mocked(prisma.mantis_bug_table.findUnique).mockResolvedValue(
      mockIssue as any
    );
    vi.mocked(prisma.mantis_project_user_list_table.findMany).mockResolvedValue(
      mockProjectUsers as any
    );
    vi.mocked(prisma.mantis_user_pref_table.findMany).mockResolvedValue(
      mockPrefs as any
    );

    const result = await getNotificationRecipients(1);

    expect(result).toHaveLength(1);
    expect(result[0].willReceive).toBe(false);
    expect(result[0].reason).toBe("Severity 30 below threshold 50");
  });

  it("should identify reporter correctly", async () => {
    const mockIssue = {
      project_id: 1,
      reporter_id: 1,
      handler_id: 0,
      severity: 50,
    };

    const mockProjectUsers = [
      {
        project_id: 1,
        user_id: 1,
        access_level: 25,
        user: {
          id: 1,
          username: "reporter",
          realname: "Reporter User",
          email: "reporter@example.com",
          enabled: 1,
        },
      },
    ];

    const mockPrefs = [
      {
        user_id: 1,
        email_on_new: 1,
        email_on_new_min_severity: 10,
      },
    ];

    vi.mocked(prisma.mantis_bug_table.findUnique).mockResolvedValue(
      mockIssue as any
    );
    vi.mocked(prisma.mantis_project_user_list_table.findMany).mockResolvedValue(
      mockProjectUsers as any
    );
    vi.mocked(prisma.mantis_user_pref_table.findMany).mockResolvedValue(
      mockPrefs as any
    );

    const result = await getNotificationRecipients(1);

    expect(result).toHaveLength(1);
    expect(result[0].willReceive).toBe(true);
    expect(result[0].reason).toContain("Reporter");
  });

  it("should sort recipients with will-receive first", async () => {
    const mockIssue = {
      project_id: 1,
      reporter_id: 1,
      handler_id: 0,
      severity: 50,
    };

    const mockProjectUsers = [
      {
        project_id: 1,
        user_id: 1,
        access_level: 25,
        user: {
          id: 1,
          username: "aaa_user",
          realname: "AAA User",
          email: "aaa@example.com",
          enabled: 1,
        },
      },
      {
        project_id: 1,
        user_id: 2,
        access_level: 25,
        user: {
          id: 2,
          username: "zzz_user",
          realname: "ZZZ User",
          email: "zzz@example.com",
          enabled: 1,
        },
      },
    ];

    const mockPrefs = [
      {
        user_id: 1,
        email_on_new: 0, // Disabled
        email_on_new_min_severity: 10,
      },
      {
        user_id: 2,
        email_on_new: 1, // Enabled
        email_on_new_min_severity: 10,
      },
    ];

    vi.mocked(prisma.mantis_bug_table.findUnique).mockResolvedValue(
      mockIssue as any
    );
    vi.mocked(prisma.mantis_project_user_list_table.findMany).mockResolvedValue(
      mockProjectUsers as any
    );
    vi.mocked(prisma.mantis_user_pref_table.findMany).mockResolvedValue(
      mockPrefs as any
    );

    const result = await getNotificationRecipients(1);

    expect(result).toHaveLength(2);
    // User with email enabled should come first
    expect(result[0].username).toBe("zzz_user");
    expect(result[0].willReceive).toBe(true);
    expect(result[1].username).toBe("aaa_user");
    expect(result[1].willReceive).toBe(false);
  });
});
