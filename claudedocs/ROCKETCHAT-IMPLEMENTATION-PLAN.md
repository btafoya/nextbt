# Rocket.Chat Notification Implementation Plan

**Generated:** 2025-10-03
**Last Updated:** 2025-10-03
**Status:** Phase 5 Complete - Audit & History Integration ✅
**Related:** `NOTIFICATION-IMPLEMENTATION-COMPLETE.md`, `/lib/notify/rocketchat.ts`, `ROCKETCHAT-REST-API-SETUP.md`

---

## 📋 Executive Summary

**Current State:**
- Basic webhook integration (single `POST` with text string)
- No rich formatting, attachments, or channel routing
- Limited to single webhook URL configuration
- Basic error handling without retry logic

**Proposed Enhancement:**
- **Hybrid approach:** Enhanced webhooks + selective REST API
- Rich message formatting with attachments, colors, and fields
- Channel routing based on project, severity, or event type
- REST API integration for advanced features (threading, user lookup, channel management)
- Comprehensive error handling with retry logic and audit integration

**Why This Approach:**
1. ✅ Maintains simplicity (webhooks for 80% of use cases)
2. 🚀 Enables advanced features via REST API (20% high-value scenarios)
3. 🏗️ Aligns with existing multi-channel notification architecture
4. 📊 Integrates seamlessly with audit and history systems
5. 🔄 Future-proof for features like threading and message updates

---

## 🎯 Implementation Goals

### Primary Objectives
1. **Rich Formatting:** Support Rocket.Chat attachments (colors, fields, images, links)
2. **Channel Routing:** Dynamic channel selection based on project/severity/event
3. **REST API Integration:** Optional REST API for advanced features
4. **Error Resilience:** Retry logic, fallback handling, comprehensive logging
5. **Audit Integration:** Track message IDs, delivery status, channel destinations

### Secondary Objectives
1. User mentions and @notifications
2. Message threading for related notifications
3. Custom emojis and avatars per notification type
4. Rate limiting and bulk message optimization
5. Admin UI for channel mapping configuration

---

## 🏗️ Architecture Design

### Configuration Schema

**Enhanced `/config/secrets.ts`:**
```typescript
// Rocket.Chat Configuration
rocketchatEnabled: false,
rocketchatWebhookUrl: "https://chat.example.com/hooks/xxxx",

// Optional: REST API Integration
rocketchatApiUrl?: "https://chat.example.com",  // Base URL for REST API
rocketchatAuthToken?: "your-user-auth-token",   // User auth token OR
rocketchatUserId?: "bot-user-id",               // Bot user ID
rocketchatUsername?: "mantis-bot",              // Bot username for posting

// Optional: Channel Routing
rocketchatDefaultChannel?: "#mantis-bugs",      // Fallback channel
rocketchatChannelMap?: {                        // Per-project channel mapping
  1: "#project-alpha",
  2: "#project-beta",
  0: "#general-issues"  // Default for unmapped projects
},

// Optional: Formatting Preferences
rocketchatUseRichFormatting?: true,             // Enable attachments
rocketchatColorMap?: {                          // Severity-based colors
  critical: "#ff0000",
  high: "#ff6600",
  normal: "#ffcc00",
  low: "#00cc00"
},

// Optional: Advanced Features
rocketchatEnableThreading?: false,              // Keep related notifications in threads
rocketchatMentionUsers?: false,                 // Enable @user mentions
rocketchatRetryAttempts?: 3,                    // Retry failed sends
rocketchatRetryDelay?: 2000,                    // Delay between retries (ms)
```

### REST API Client Design

**`/lib/notify/rocketchat-api.ts`** (New File):
```typescript
import { secrets } from "@/config/secrets";
import { logger } from "@/lib/logger";

interface RocketChatUser {
  _id: string;
  username: string;
  name: string;
}

interface RocketChatChannel {
  _id: string;
  name: string;
  type: "c" | "p" | "d";  // channel, private, direct
}

interface RocketChatMessage {
  _id: string;
  ts: string;
  msg: string;
  channel?: string;
}

export class RocketChatAPI {
  private baseUrl: string;
  private authToken: string;
  private userId: string;

  constructor() {
    if (!secrets.rocketchatApiUrl || !secrets.rocketchatAuthToken) {
      throw new Error("Rocket.Chat REST API not configured");
    }
    this.baseUrl = secrets.rocketchatApiUrl;
    this.authToken = secrets.rocketchatAuthToken;
    this.userId = secrets.rocketchatUserId || "";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1/${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "X-Auth-Token": this.authToken,
        "X-User-Id": this.userId,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`Rocket.Chat API error: ${response.status}`, error);
      throw new Error(`Rocket.Chat API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Send message to channel/user
  async postMessage(
    channel: string,
    text: string,
    attachments?: any[]
  ): Promise<RocketChatMessage> {
    return this.request<RocketChatMessage>("chat.postMessage", {
      method: "POST",
      body: JSON.stringify({
        channel,
        text,
        attachments,
      }),
    });
  }

  // Get user by username
  async getUserByUsername(username: string): Promise<RocketChatUser | null> {
    try {
      const result = await this.request<{ user: RocketChatUser }>(
        `users.info?username=${username}`
      );
      return result.user;
    } catch {
      return null;
    }
  }

  // Get channel info
  async getChannelByName(channelName: string): Promise<RocketChatChannel | null> {
    try {
      const result = await this.request<{ channel: RocketChatChannel }>(
        `channels.info?roomName=${channelName.replace("#", "")}`
      );
      return result.channel;
    } catch {
      return null;
    }
  }

  // Update message (requires message ID)
  async updateMessage(
    messageId: string,
    newText: string
  ): Promise<RocketChatMessage> {
    return this.request<RocketChatMessage>("chat.update", {
      method: "POST",
      body: JSON.stringify({
        roomId: "", // Will be filled from message lookup
        msgId: messageId,
        text: newText,
      }),
    });
  }
}

// Singleton instance
let apiClient: RocketChatAPI | null = null;

export function getRocketChatAPI(): RocketChatAPI | null {
  if (!secrets.rocketchatApiUrl || !secrets.rocketchatAuthToken) {
    return null;  // API not configured
  }
  if (!apiClient) {
    apiClient = new RocketChatAPI();
  }
  return apiClient;
}
```

### Enhanced Webhook Formatting

**`/lib/notify/rocketchat-formatter.ts`** (New File):
```typescript
import { secrets } from "@/config/secrets";

export interface RocketChatAttachment {
  color?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  image_url?: string;
  thumb_url?: string;
  author_name?: string;
  author_link?: string;
  author_icon?: string;
}

export interface RocketChatWebhookPayload {
  text?: string;
  emoji?: string;
  username?: string;
  channel?: string;
  attachments?: RocketChatAttachment[];
}

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

export function formatRocketChatMessage(
  context: NotificationContext
): RocketChatWebhookPayload {
  const useRichFormatting = secrets.rocketchatUseRichFormatting ?? true;

  if (!useRichFormatting) {
    // Simple text-only fallback
    return {
      text: `**${context.subject}**\n${context.body}`,
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

function getSeverityColor(severity?: string): string {
  const colorMap = secrets.rocketchatColorMap || {
    critical: "#ff0000",
    high: "#ff6600",
    normal: "#ffcc00",
    low: "#00cc00",
  };

  const severityKey = severity?.toLowerCase() || "normal";
  return colorMap[severityKey as keyof typeof colorMap] || "#764FA5";
}

function getChannelForProject(projectId?: number): string | undefined {
  if (!projectId || !secrets.rocketchatChannelMap) {
    return secrets.rocketchatDefaultChannel || undefined;
  }

  return (
    secrets.rocketchatChannelMap[projectId] ||
    secrets.rocketchatChannelMap[0] ||
    secrets.rocketchatDefaultChannel ||
    undefined
  );
}

function getEventEmoji(eventType?: string): string {
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
  };

  return emojiMap[eventType || ""] || ":bell:";
}
```

### Enhanced Main Implementation

**`/lib/notify/rocketchat.ts`** (Replace Existing):
```typescript
import { secrets } from "@/config/secrets";
import { logger } from "@/lib/logger";
import {
  formatRocketChatMessage,
  type NotificationContext,
  type RocketChatWebhookPayload,
} from "./rocketchat-formatter";
import { getRocketChatAPI } from "./rocketchat-api";

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

export async function sendRocketChat(
  options: RocketChatOptions
): Promise<{ messageId?: string; channel?: string }> {
  if (!secrets.rocketchatEnabled || !secrets.rocketchatWebhookUrl) {
    logger.warn("Rocket.Chat notifications disabled or not configured");
    return {};
  }

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

  const payload = formatRocketChatMessage(context);

  // Try webhook first (most reliable, simpler)
  try {
    const result = await sendViaWebhook(payload);
    return result;
  } catch (webhookError) {
    logger.error("Rocket.Chat webhook failed:", webhookError);

    // Fallback to REST API if configured
    const api = getRocketChatAPI();
    if (api && payload.channel) {
      try {
        const message = await api.postMessage(
          payload.channel,
          payload.attachments?.[0]?.text || options.body,
          payload.attachments
        );
        logger.info("Rocket.Chat sent via REST API fallback");
        return { messageId: message._id, channel: payload.channel };
      } catch (apiError) {
        logger.error("Rocket.Chat REST API fallback failed:", apiError);
        throw webhookError; // Re-throw original webhook error
      }
    }

    throw webhookError;
  }
}

async function sendViaWebhook(
  payload: RocketChatWebhookPayload,
  retryCount = 0
): Promise<{ messageId?: string; channel?: string }> {
  const maxRetries = secrets.rocketchatRetryAttempts ?? 3;
  const retryDelay = secrets.rocketchatRetryDelay ?? 2000;

  try {
    const response = await fetch(secrets.rocketchatWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Webhook failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    // Webhook success (may not return message ID)
    logger.info("Rocket.Chat webhook sent successfully");
    return { channel: payload.channel };
  } catch (error) {
    if (retryCount < maxRetries) {
      logger.warn(
        `Rocket.Chat webhook retry ${retryCount + 1}/${maxRetries}`,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return sendViaWebhook(payload, retryCount + 1);
    }

    throw error;
  }
}

// Backward compatibility: Simple text-only function
export async function sendRocketChatSimple(text: string): Promise<void> {
  await sendRocketChat({
    subject: "Notification",
    body: text,
  });
}
```

### Integration with Dispatch System

**`/lib/notify/dispatch.ts`** (Update Rocket.Chat Section):
```typescript
// Line 98-128: Replace existing Rocket.Chat block
if (r.rocketchat) {
  const rocketTask = sendRocketChat({
    subject,
    body: text,
    bugId,
    projectId: getProjectIdForBug(bugId), // Helper function
    eventType: eventType || "notification",
    link: bugId ? `/issues/${bugId}` : undefined,
  })
    .then((result) => {
      if (bugId && r.userId) {
        auditEntries.push({
          bugId,
          userId: r.userId,
          recipient: result.channel || "rocketchat",
          subject,
          channel: "rocketchat",
          status: "success",
          metadata: result.messageId
            ? JSON.stringify({ messageId: result.messageId })
            : undefined,
        });
      }
      return { success: true };
    })
    .catch((error) => {
      if (bugId && r.userId) {
        auditEntries.push({
          bugId,
          userId: r.userId,
          recipient: "rocketchat",
          subject,
          channel: "rocketchat",
          status: "failed",
          errorMessage: error.message || String(error),
        });
      }
      throw error;
    });
  tasks.push(rocketTask);
}

// Helper function (add to dispatch.ts)
function getProjectIdForBug(bugId?: number): number | undefined {
  // TODO: Implement project lookup from bug ID
  // Could cache this or pass it through from caller
  return undefined;
}
```

---

## 🔧 Implementation Phases

### Phase 1: Enhanced Webhook Formatting ✅ (Priority: High)
**Estimated Effort:** 4-6 hours
**Dependencies:** None

**Tasks:**
1. Create `/lib/notify/rocketchat-formatter.ts` with rich attachment support
2. Update `/config/secrets.example.ts` with formatting configuration
3. Update `/lib/notify/rocketchat.ts` with enhanced payload generation
4. Add unit tests for formatter (20+ test cases)
5. Test with real Rocket.Chat instance

**Deliverables:**
- ✅ Rich attachments with colors, fields, and links
- ✅ Configurable severity-based color coding
- ✅ Event-based emoji selection
- ✅ Backward compatibility with simple text

### Phase 2: Channel Routing 🚀 (Priority: High)
**Estimated Effort:** 3-4 hours
**Dependencies:** Phase 1

**Tasks:**
1. Add channel mapping configuration to `secrets.ts`
2. Implement channel selection logic in formatter
3. Add fallback to default channel
4. Update dispatch system to pass project context
5. Test multi-channel routing

**Deliverables:**
- ✅ Per-project channel routing
- ✅ Configurable channel mapping
- ✅ Default channel fallback
- ✅ Documentation for channel setup

### Phase 3: REST API Integration 🔌 ✅ COMPLETE (Priority: Medium)
**Estimated Effort:** 6-8 hours (Actual: 6 hours)
**Dependencies:** Phase 1
**Completion Date:** 2025-10-03

**Tasks:**
1. ✅ Create `/lib/notify/rocketchat-api.ts` REST client (400+ lines)
2. ✅ Add REST API configuration to `secrets.ts`
3. ✅ Implement fallback from webhook to REST API in `rocketchat.ts`
4. ✅ Add user lookup and channel validation methods
5. ✅ Test API authentication and endpoints (25 tests)
6. ✅ Update audit logging with message ID metadata support
7. ✅ Update dispatch system to capture and store message IDs

**Deliverables:**
- ✅ REST API client wrapper with complete CRUD operations
- ✅ Webhook → REST API fallback on webhook failure
- ✅ Message ID capture and storage in audit log
- ✅ User and channel lookup capabilities
- ✅ Message update and delete operations
- ✅ Channel validation and membership checks
- ✅ Comprehensive test coverage (25 tests, 100% passing)

### Phase 4: Error Handling & Retry Logic 🔄 (Priority: High)
**Estimated Effort:** 3-4 hours
**Dependencies:** Phase 1

**Tasks:**
1. Add retry configuration to `secrets.ts`
2. Implement exponential backoff retry logic
3. Enhanced error logging with context
4. Integration with audit system
5. Test failure scenarios and recovery

**Deliverables:**
- ✅ Configurable retry attempts and delays
- ✅ Exponential backoff strategy
- ✅ Comprehensive error logging
- ✅ Graceful degradation on permanent failures

### Phase 5: Audit & History Integration 📊 ✅ **COMPLETED**
**Status:** COMPLETE (2025-10-03)
**Actual Effort:** 3 hours
**Dependencies:** Phase 3

**Completed Tasks:**
1. ✅ Update audit entries with message IDs
2. ✅ Store channel destinations in audit log
3. ✅ Add metadata field for Rocket.Chat-specific data
4. ✅ Update history entries with channel info
5. ✅ Test audit log querying and reporting

**Deliverables:**
- ✅ Message ID tracking in audit log (via `error_message` field JSON)
- ✅ Channel destination logging (stored in `recipient` field)
- ✅ Metadata JSON for future extensibility (message IDs, timestamps)
- ✅ Enhanced audit reporting queries in `/lib/notify/rocketchat-audit.ts`
- ✅ Comprehensive test suite (33 tests) in `/__tests__/lib/notify/rocketchat-audit.test.ts`

**Implementation Details:**

**File: `/lib/notify/rocketchat-audit.ts`** (370 lines)
- `extractMessageId()` - Parse message ID from JSON metadata
- `getRocketChatAuditForBug()` - Get all notifications for a bug
- `getRocketChatAuditForUser()` - Get user's notification history
- `findAuditByMessageId()` - Search by Rocket.Chat message ID
- `getRocketChatStats()` - Comprehensive statistics (success rate, webhook vs API usage)
- `getRecentFailures()` - Debug recent failures
- `getNotificationsWithMessageIds()` - Find REST API notifications
- `getDeliveryMethodBreakdown()` - Webhook vs REST API statistics
- `isRocketChatHealthy()` - Health check with success rate monitoring

**File: `/lib/notify/dispatch.ts`** (Updated)
- Enhanced history entries to capture specific Rocket.Chat channel names
- Format: `"rocketchat:#project-alpha"` instead of just `"rocketchat"`
- Uses audit entry data to populate channel-specific information

**Statistics Available:**
- Total sent, success/failure counts, success rate
- Webhook vs REST API usage breakdown
- Message ID capture rate (REST API usage indicator)
- Per-channel delivery statistics
- Recent activity (24h, 7d, 30d)
- Health status monitoring

**Test Coverage:**
- 33 comprehensive tests covering all audit functions
- Edge cases: empty results, malformed JSON, database errors
- Health check scenarios: high/low success rates, no activity
- Statistics calculation validation

### Phase 6: Testing & Documentation 📚 (Priority: High)
**Estimated Effort:** 4-6 hours
**Dependencies:** All phases

**Tasks:**
1. Create comprehensive unit tests (formatter, API, retry logic)
2. Add integration tests with mock Rocket.Chat server
3. Write user documentation for configuration
4. Write developer documentation for extending
5. Create troubleshooting guide

**Deliverables:**
- ✅ 30+ unit tests with 90%+ coverage
- ✅ Integration test suite
- ✅ User configuration guide
- ✅ Developer API documentation
- ✅ Troubleshooting and FAQ document

### Phase 7: Advanced Features 🚀 (Priority: Low - Optional)
**Estimated Effort:** 8-12 hours
**Dependencies:** All previous phases

**Optional Enhancements:**
1. **Message Threading:** Keep related notifications in threads
2. **User Mentions:** Parse reporter/assignee and mention in Rocket.Chat
3. **Message Updates:** Update existing messages on status changes
4. **Bulk Optimization:** Batch multiple notifications into single message
5. **Admin UI:** Web interface for channel mapping configuration
6. **Webhooks:** Receive updates from Rocket.Chat (bidirectional)

---

## 🧪 Testing Strategy

### Unit Tests (`__tests__/lib/notify/rocketchat.test.ts`)

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { formatRocketChatMessage } from "@/lib/notify/rocketchat-formatter";
import { sendRocketChat } from "@/lib/notify/rocketchat";

describe("Rocket.Chat Formatter", () => {
  it("should format basic message with attachment", () => {
    const result = formatRocketChatMessage({
      subject: "Test Issue",
      body: "Description text",
      bugId: 123,
      severity: "high",
    });

    expect(result.attachments).toBeDefined();
    expect(result.attachments![0].title).toBe("Test Issue");
    expect(result.attachments![0].color).toBe("#ff6600"); // high severity
  });

  it("should route to correct channel based on project", () => {
    const result = formatRocketChatMessage({
      subject: "Test",
      body: "Text",
      projectId: 1,
    });

    expect(result.channel).toBe("#project-alpha");
  });

  it("should fallback to default channel for unmapped project", () => {
    const result = formatRocketChatMessage({
      subject: "Test",
      body: "Text",
      projectId: 999,
    });

    expect(result.channel).toBe("#mantis-bugs");
  });

  it("should select appropriate emoji for event type", () => {
    const result = formatRocketChatMessage({
      subject: "Test",
      body: "Text",
      eventType: "issue_resolved",
    });

    expect(result.emoji).toBe(":white_check_mark:");
  });

  it("should include all relevant fields", () => {
    const result = formatRocketChatMessage({
      subject: "Test Issue",
      body: "Description",
      bugId: 123,
      status: "assigned",
      priority: "high",
      severity: "critical",
      reporter: "john.doe",
      assignedTo: "jane.smith",
    });

    const fields = result.attachments![0].fields!;
    expect(fields.find((f) => f.title === "Issue ID")?.value).toBe("#123");
    expect(fields.find((f) => f.title === "Status")?.value).toBe("assigned");
    expect(fields.find((f) => f.title === "Reporter")?.value).toBe("john.doe");
  });
});

describe("Rocket.Chat Sender", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should send via webhook successfully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });

    const result = await sendRocketChat({
      subject: "Test",
      body: "Text",
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("hooks"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("should retry on transient failure", async () => {
    let attemptCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      attemptCount++;
      if (attemptCount < 3) {
        return Promise.resolve({ ok: false, status: 500, text: () => "Error" });
      }
      return Promise.resolve({ ok: true, status: 200 });
    });

    await sendRocketChat({
      subject: "Test",
      body: "Text",
    });

    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("should throw after max retries exceeded", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => "Persistent Error",
    });

    await expect(
      sendRocketChat({
        subject: "Test",
        body: "Text",
      })
    ).rejects.toThrow("Webhook failed");
  });
});
```

### Integration Tests

1. **Mock Rocket.Chat Server:** Use `msw` or `nock` to simulate webhook/API responses
2. **Dispatch System:** Test full notification flow with Rocket.Chat enabled
3. **Audit Logging:** Verify audit entries created correctly
4. **Error Scenarios:** Test network failures, invalid webhooks, API errors

---

## 📚 Documentation Updates

### User Documentation

**`docs/ROCKETCHAT-SETUP.md`** (New File):
```markdown
# Rocket.Chat Notification Setup

## Prerequisites
1. Rocket.Chat server (cloud or self-hosted)
2. Admin access to create incoming webhooks
3. (Optional) User account with auth token for REST API

## Configuration Steps

### Step 1: Create Incoming Webhook
1. Login to Rocket.Chat as admin
2. Navigate to **Administration → Integrations → New Integration → Incoming WebHook**
3. Configure webhook:
   - **Enabled:** Yes
   - **Name:** MantisBT Notifications
   - **Post to Channel:** #mantis-bugs (or your default channel)
   - **Post as:** mantis-bot
   - **Script Enabled:** No (we handle formatting in NextBT)
4. **Save Changes** and copy the **Webhook URL**

### Step 2: Configure NextBT
Edit `/config/secrets.ts`:

```typescript
// Basic Configuration (Webhook Only)
rocketchatEnabled: true,
rocketchatWebhookUrl: "https://chat.example.com/hooks/XXXXX",
rocketchatDefaultChannel: "#mantis-bugs",

// Optional: Rich Formatting
rocketchatUseRichFormatting: true,
rocketchatUsername: "MantisBT",
rocketchatColorMap: {
  critical: "#ff0000",
  high: "#ff6600",
  normal: "#ffcc00",
  low: "#00cc00",
},

// Optional: Channel Routing
rocketchatChannelMap: {
  1: "#project-alpha",
  2: "#project-beta",
  0: "#general-issues",  // Default for unmapped projects
},
```

### Step 3: Test Configuration
```bash
# Send test notification via API
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "rocketchat",
    "subject": "Test Notification",
    "body": "Testing Rocket.Chat integration"
  }'
```

## Advanced: REST API Integration

For features like message updates and threading:

1. Create bot user in Rocket.Chat
2. Generate personal access token or use login API
3. Configure in `secrets.ts`:

```typescript
rocketchatApiUrl: "https://chat.example.com",
rocketchatAuthToken: "your-auth-token",
rocketchatUserId: "bot-user-id",
```

## Troubleshooting

### Webhook Not Receiving Messages
- ✅ Check `rocketchatEnabled: true` in config
- ✅ Verify webhook URL is correct (should include `/hooks/XXXXX`)
- ✅ Ensure Rocket.Chat server is accessible from NextBT
- ✅ Check NextBT logs: `grep "Rocket.Chat" logs/*`
- ✅ Test webhook with `curl` directly

### Messages Not Formatted Properly
- ✅ Enable `rocketchatUseRichFormatting: true`
- ✅ Check color map configuration
- ✅ Verify channel exists and bot has access

### Channel Routing Not Working
- ✅ Verify `rocketchatChannelMap` project IDs match your database
- ✅ Ensure channels exist and start with `#`
- ✅ Check fallback to `rocketchatDefaultChannel`
```

---

## ⚠️ Migration & Rollout Plan

### Backward Compatibility
- ✅ Existing webhook-only config continues to work
- ✅ Simple text fallback if rich formatting fails
- ✅ Graceful degradation if REST API unavailable

### Rollout Steps
1. **Development:** Test with test Rocket.Chat instance
2. **Staging:** Deploy to staging with real channels
3. **Production:** Gradual rollout (monitor audit logs)
4. **Post-Deploy:** Monitor error rates and adjust retry logic

### Rollback Plan
If issues arise:
1. Set `rocketchatEnabled: false` in config (immediate)
2. Revert to previous `rocketchat.ts` file (5 minutes)
3. Restart application (1 minute)

---

## 📊 Success Metrics

### Quantitative Metrics
- ✅ **Delivery Success Rate:** >95% of notifications delivered
- ✅ **Retry Success Rate:** >80% of retries succeed
- ✅ **API Response Time:** <500ms average
- ✅ **Error Rate:** <5% failed deliveries

### Qualitative Metrics
- ✅ Rich formatting adoption: Users prefer attachments over plain text
- ✅ Channel routing effectiveness: Notifications reach correct teams
- ✅ User satisfaction: Feedback from Rocket.Chat users

---

## 🔮 Future Enhancements

### Short-Term (Next 3-6 Months)
1. **Bidirectional Webhooks:** Receive commands from Rocket.Chat (`/mantis resolve 123`)
2. **Interactive Buttons:** Add "Assign to Me", "Close Issue" buttons
3. **Thread Management:** Keep related notifications in conversation threads
4. **Bulk Optimization:** Batch digest notifications into single rich message

### Long-Term (6-12 Months)
1. **Admin UI:** Web interface for channel mapping configuration
2. **Analytics Dashboard:** Notification delivery stats per channel
3. **Smart Routing:** ML-based channel selection based on content
4. **Integration Hub:** Support for other chat platforms (Slack, Discord, Mattermost)

---

## 📝 References

### Rocket.Chat Documentation
- [REST API Reference](https://developer.rocket.chat/apidocs)
- [Incoming Webhooks](https://docs.rocket.chat/use-rocket.chat/workspace-administration/integrations)
- [Message Attachments](https://docs.rocket.chat/use-rocket.chat/workspace-administration/integrations#incoming-webhook-script)
- [Authentication](https://developer.rocket.chat/reference/api/rest-api/authentication)

### Internal Documentation
- `NOTIFICATION-IMPLEMENTATION-COMPLETE.md` - Overall notification system
- `NOTIFICATION-AUDIT-FIX.md` - Audit logging patterns
- `claudedocs/email-audit-implementation.md` - Email audit reference

### Code References
- `/lib/notify/dispatch.ts` - Main notification dispatcher
- `/lib/notify/postmark.ts` - Email implementation (similar pattern)
- `/lib/notify/preference-checker.ts` - User preference validation

---

## ✅ Review Checklist

Before Implementation:
- [ ] Review configuration schema with team
- [ ] Confirm channel naming conventions
- [ ] Decide on REST API requirement (webhook-only vs hybrid)
- [ ] Establish testing environment (test Rocket.Chat instance)
- [ ] Define success metrics and monitoring approach

During Implementation:
- [ ] Follow phase order (webhooks → routing → API → retry)
- [ ] Write tests for each component before integration
- [ ] Update secrets.example.ts with all new options
- [ ] Document all configuration options
- [ ] Test error scenarios and edge cases

Post-Implementation:
- [ ] Deploy to staging and monitor for 48 hours
- [ ] Collect user feedback on formatting and routing
- [ ] Review audit logs for delivery patterns
- [ ] Document any issues encountered and resolutions
- [ ] Plan next phase enhancements based on feedback

---

**Document Status:** ✅ Ready for Review
**Next Action:** Review and approve plan, then begin Phase 1 implementation
**Estimated Total Effort:** 22-31 hours (excluding optional Phase 7)
