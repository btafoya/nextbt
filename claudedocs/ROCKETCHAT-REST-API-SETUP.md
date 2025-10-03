# Rocket.Chat REST API Setup Guide

**Created:** 2025-10-03
**Status:** Production Ready
**Related:** `ROCKETCHAT-IMPLEMENTATION-PLAN.md`

---

## 📋 Overview

This guide explains how to configure and use the Rocket.Chat REST API integration for advanced features like message ID tracking, message updates, user lookup, and channel validation.

**When to Use REST API:**
- ✅ Need message IDs for future updates/threading
- ✅ Want to update or delete existing messages
- ✅ Need to validate users or channels before sending
- ✅ Want automatic fallback when webhooks fail
- ✅ Building advanced notification features

**When Webhooks Are Sufficient:**
- ✅ Simple one-way notifications
- ✅ No need for message tracking
- ✅ Basic rich formatting is enough
- ✅ Webhook reliability is acceptable

---

## 🔧 Configuration Steps

### Step 1: Create Bot User in Rocket.Chat

1. **Login as Admin** to your Rocket.Chat instance
2. **Navigate to:** Administration → Users → New User
3. **Configure Bot User:**
   - **Name:** MantisBT Bot (or your choice)
   - **Username:** `mantis-bot`
   - **Email:** `mantis-bot@yourdomain.com`
   - **Password:** Generate secure password
   - **Roles:** `bot` (required), optionally `user`
   - **Verified:** Yes
   - **Set Owner:** Admin user

4. **Create User** and note the credentials

### Step 2: Generate Authentication Token

**Option A: Via REST API (Recommended)**

```bash
curl -X POST https://chat.example.com/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{
    "user": "mantis-bot",
    "password": "YOUR_BOT_PASSWORD"
  }'
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "authToken": "YOUR_AUTH_TOKEN_HERE",
    "userId": "YOUR_USER_ID_HERE"
  }
}
```

**Option B: Via Personal Access Tokens**

1. Login as bot user
2. Navigate to: My Account → Personal Access Tokens
3. Click "Add Token"
4. Name: `MantisBT Integration`
5. Generate and copy token

### Step 3: Configure NextBT

Edit `/config/secrets.ts`:

```typescript
// Basic Webhook Configuration (existing)
rocketchatEnabled: true,
rocketchatWebhookUrl: "https://chat.example.com/hooks/xxxxx",

// REST API Configuration (add these)
rocketchatApiUrl: "https://chat.example.com",
rocketchatAuthToken: "YOUR_AUTH_TOKEN_HERE",
rocketchatUserId: "YOUR_USER_ID_HERE",

// Optional: Bot username for API posts
rocketchatUsername: "mantis-bot",
```

### Step 4: Test Configuration

**Test Webhook (should still work):**
```bash
curl -X POST YOUR_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"text":"Test from NextBT webhook"}'
```

**Test REST API:**
```bash
curl -X POST https://chat.example.com/api/v1/chat.postMessage \
  -H "X-Auth-Token: YOUR_AUTH_TOKEN" \
  -H "X-User-Id: YOUR_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "#mantis-bugs",
    "text": "Test from NextBT REST API"
  }'
```

Both should post messages to your channel.

---

## 🚀 Feature Overview

### Automatic Fallback

When webhook fails, REST API is automatically used:

```typescript
// Automatic flow:
1. Try webhook (fast, simple)
2. If webhook fails → Try REST API (returns message ID)
3. If both fail → Log error and return failure
```

**Benefits:**
- Increased reliability (dual-path delivery)
- Captures message IDs when API is used
- No code changes required (automatic)

### Message ID Tracking

When REST API is used, message IDs are captured:

```typescript
// In audit log (error_message field stores JSON):
{
  "messageId": "abc123xyz",
  "timestamp": "2025-10-03T10:00:00Z"
}
```

**Use Cases:**
- Update notification when issue status changes
- Delete notification when issue is spam
- Thread related notifications together

### User Lookup

Validate users before mentioning:

```typescript
import { getRocketChatAPI } from "@/lib/notify/rocketchat-api";

const api = getRocketChatAPI();
if (api) {
  const user = await api.getUserByUsername("john.doe");
  if (user) {
    // User exists, can mention: @john.doe
  }
}
```

### Channel Validation

Verify channels exist before sending:

```typescript
const api = getRocketChatAPI();
if (api) {
  const isValid = await api.validateChannel("project-alpha");
  if (isValid) {
    // Channel exists, safe to send
  }
}
```

### Message Updates

Update existing messages (requires message ID):

```typescript
const api = getRocketChatAPI();
if (api) {
  await api.updateMessage(
    "roomId123",
    "messageId456",
    "Updated: Issue resolved!"
  );
}
```

### Message Deletion

Remove messages (requires message ID):

```typescript
const api = getRocketChatAPI();
if (api) {
  await api.deleteMessage("roomId123", "messageId456");
}
```

---

## 📊 Configuration Reference

### Complete Configuration Example

```typescript
// /config/secrets.ts

export const secrets = {
  // ... other config ...

  // Rocket.Chat Webhook (Phase 1)
  rocketchatEnabled: true,
  rocketchatWebhookUrl: "https://chat.example.com/hooks/abc123",
  rocketchatUsername: "MantisBT",
  rocketchatDefaultChannel: "#mantis-bugs",
  rocketchatUseRichFormatting: true,

  // Retry Logic (Phase 1)
  rocketchatRetryAttempts: 3,
  rocketchatRetryDelay: 2000, // milliseconds

  // Color Mapping (Phase 1)
  rocketchatColorMap: {
    critical: "#ff0000",
    high: "#ff6600",
    normal: "#ffcc00",
    low: "#00cc00",
    info: "#0099ff",
  },

  // Channel Routing (Phase 2)
  rocketchatChannelMap: {
    1: "#project-alpha",
    2: "#project-beta",
    3: "#project-gamma",
    0: "#general-issues", // Default
  },

  // REST API (Phase 3) - OPTIONAL
  rocketchatApiUrl: "https://chat.example.com",
  rocketchatAuthToken: "your-auth-token-here",
  rocketchatUserId: "your-user-id-here",
};
```

### Configuration Priority

1. **Webhook URL** (required for all functionality)
2. **Rich Formatting** (recommended, enabled by default)
3. **Channel Routing** (optional, defaults to default channel)
4. **REST API** (optional, enables advanced features)

---

## 🔍 Troubleshooting

### REST API Not Working

**Problem:** Messages sent via webhook, but API fallback doesn't trigger

**Solution:**
1. Verify `rocketchatApiUrl`, `rocketchatAuthToken`, `rocketchatUserId` are set
2. Test authentication manually with curl (see Step 4)
3. Check bot user has permissions to post in target channels
4. Review logs for REST API errors

**Logs to check:**
```bash
grep "Rocket.Chat" logs/* | grep -i "error\|fail"
```

### Message IDs Not Captured

**Problem:** Audit log doesn't show message IDs

**Cause:** Message IDs are only captured when REST API is used (not webhooks)

**To Force REST API:**
1. Temporarily disable webhook: `rocketchatWebhookUrl: ""`
2. Send test notification
3. Check audit log for message ID in `error_message` field (JSON format)

### Authentication Errors

**Problem:** `401 Unauthorized` errors in logs

**Solution:**
1. Verify auth token hasn't expired (tokens can expire)
2. Regenerate token using login API
3. Update `rocketchatAuthToken` in secrets.ts
4. Restart NextBT application

### Channel Access Errors

**Problem:** `403 Forbidden` when posting to channel

**Solution:**
1. Verify bot user is member of target channel
2. Add bot to channel: `/invite @mantis-bot` in Rocket.Chat
3. Check channel permissions allow bots to post
4. Verify channel name spelling (case-sensitive)

---

## 🎯 Best Practices

### Security

✅ **DO:**
- Use bot account with limited permissions
- Rotate authentication tokens periodically (every 90 days)
- Store tokens in secrets.ts (never commit to git)
- Use HTTPS for API endpoints

❌ **DON'T:**
- Share bot credentials across environments
- Use admin accounts for bot operations
- Commit secrets.ts to version control
- Use HTTP (unencrypted) connections

### Performance

✅ **DO:**
- Keep webhook as primary method (faster)
- Use REST API only when needed (fallback)
- Cache channel validations (avoid repeated lookups)
- Batch multiple notifications when possible

❌ **DON'T:**
- Disable webhooks if REST API is configured
- Make REST API calls in loops (slow)
- Validate channels on every send (expensive)

### Reliability

✅ **DO:**
- Monitor audit logs for delivery failures
- Set appropriate retry counts (3-5 recommended)
- Use exponential backoff for retries
- Log message IDs for future operations

❌ **DON'T:**
- Set retry count too high (>10 causes delays)
- Ignore webhook failures (investigate root cause)
- Assume all messages delivered successfully

---

## 📈 Monitoring

### Key Metrics to Track

1. **Delivery Success Rate:**
   ```sql
   SELECT
     channel,
     COUNT(*) as total,
     SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
     (SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as success_rate
   FROM mantis_email_audit_table
   WHERE channel = 'rocketchat'
   AND date_sent > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY))
   GROUP BY channel;
   ```

2. **Webhook vs REST API Usage:**
   ```sql
   SELECT
     CASE
       WHEN error_message LIKE '%messageId%' THEN 'REST API'
       ELSE 'Webhook'
     END as method,
     COUNT(*) as count
   FROM mantis_email_audit_table
   WHERE channel = 'rocketchat'
   AND status = 'success'
   AND date_sent > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY))
   GROUP BY method;
   ```

3. **Message ID Capture Rate:**
   ```sql
   SELECT
     COUNT(*) as total_sent,
     SUM(CASE WHEN error_message LIKE '%messageId%' THEN 1 ELSE 0 END) as with_message_id,
     (SUM(CASE WHEN error_message LIKE '%messageId%' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as capture_rate
   FROM mantis_email_audit_table
   WHERE channel = 'rocketchat'
   AND status = 'success'
   AND date_sent > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY));
   ```

### Health Check Endpoint

Create a health check to verify REST API connectivity:

```typescript
// /app/api/health/rocketchat/route.ts
import { getRocketChatAPI } from "@/lib/notify/rocketchat-api";

export async function GET() {
  const api = getRocketChatAPI();

  if (!api) {
    return Response.json({
      status: "unconfigured",
      available: false
    });
  }

  try {
    // Test with user lookup (lightweight operation)
    const user = await api.getUserById(api.getUserId());
    return Response.json({
      status: "healthy",
      available: true,
      userId: user?._id
    });
  } catch (error) {
    return Response.json({
      status: "error",
      available: false,
      error: String(error)
    }, { status: 500 });
  }
}
```

---

## 🔮 Future Enhancements

Possible future additions (not yet implemented):

1. **Message Threading:** Keep related notifications in threads
2. **User Mentions:** Auto-mention assignee/reporter in messages
3. **Interactive Buttons:** Add "Assign to Me", "Close Issue" buttons
4. **Bidirectional Webhooks:** Receive commands from Rocket.Chat
5. **Bulk Operations:** Batch multiple notifications into one message

See `ROCKETCHAT-IMPLEMENTATION-PLAN.md` Phase 7 for details.

---

## 📚 Additional Resources

**Rocket.Chat Documentation:**
- [REST API Reference](https://developer.rocket.chat/apidocs)
- [Authentication](https://developer.rocket.chat/reference/api/rest-api/authentication)
- [Chat Methods](https://developer.rocket.chat/reference/api/rest-api/endpoints/team-collaboration-endpoints/chat)
- [User Management](https://developer.rocket.chat/reference/api/rest-api/endpoints/user-management)

**NextBT Documentation:**
- Implementation Plan: `claudedocs/ROCKETCHAT-IMPLEMENTATION-PLAN.md`
- Main Documentation: `CLAUDE.md`
- Notification System: `NOTIFICATION-IMPLEMENTATION-COMPLETE.md`

**Code References:**
- REST API Client: `/lib/notify/rocketchat-api.ts`
- Main Sender: `/lib/notify/rocketchat.ts`
- Message Formatter: `/lib/notify/rocketchat-formatter.ts`
- Dispatch Integration: `/lib/notify/dispatch.ts`

---

**Document Status:** ✅ Complete and Production Ready
**Last Updated:** 2025-10-03
**Version:** 1.0
