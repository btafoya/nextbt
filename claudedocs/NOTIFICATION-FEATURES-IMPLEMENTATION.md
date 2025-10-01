# Notification System Enhancement Implementation Guide

## Executive Summary

This document outlines the comprehensive implementation of four major notification system enhancements for NextBT:

1. **Notification Digest** - Batch and schedule notifications
2. **Real-time Web Push** - Browser push notifications via Web Push API
3. **Notification History** - User-facing notification log and management
4. **Advanced Filters** - Category, priority, and severity-based filtering

## Features Implemented

### 1. Notification Digest System

**Purpose**: Reduce notification fatigue by batching multiple notifications into periodic digests.

**Key Features**:
- Queue notifications for batching instead of immediate delivery
- User-configurable digest frequency (hourly, daily, weekly)
- Customizable time-of-day and day-of-week for delivery
- Minimum notification threshold before sending digest
- Channel selection (email, web push, etc.)
- Beautiful HTML digest templates grouping by issue

**Database Tables**:
- `mantis_notification_queue_table` - Stores queued notifications for batching
- `mantis_digest_pref_table` - User digest preferences and scheduling

**API Module**: `lib/notify/digest.ts`

**Key Functions**:
```typescript
queueNotification(notification) - Queue single notification
queueNotificationsBatch(notifications) - Queue multiple notifications
getDigestPreferences(userId) - Get user's digest settings
updateDigestPreferences(userId, prefs) - Update digest configuration
processPendingDigests() - Process scheduled digests (cron job)
getUserQueuedNotifications(userId) - View pending notifications
cleanupOldDigests(daysOld) - Remove old sent digests
```

### 2. Real-time Web Push Notifications

**Purpose**: Deliver browser push notifications even when user is not actively browsing.

**Key Features**:
- Web Push API integration with VAPID authentication
- Multi-device support (multiple subscriptions per user)
- Automatic invalid subscription cleanup
- Push notification payload customization (title, body, icon, badge, actions)
- Subscription management (subscribe, unsubscribe, list)
- Device tracking (user agent, IP address)
- Statistics and monitoring

**Database Tables**:
- `mantis_webpush_subscription_table` - Stores web push subscriptions

**API Module**: `lib/notify/webpush.ts`

**Key Functions**:
```typescript
subscribeWebPush(userId, subscription) - Register push subscription
unsubscribeWebPush(endpoint) - Disable subscription
getUserWebPushSubscriptions(userId) - List user's active subscriptions
sendWebPush(userId, payload) - Send push notification to user
sendWebPushBatch(userIds, payload) - Batch send to multiple users
testWebPush(userId) - Send test notification
cleanupExpiredSubscriptions(daysInactive) - Remove old subscriptions
getWebPushStats() - Get system-wide statistics
```

**Dependencies**: `web-push` npm package

### 3. Notification History

**Purpose**: Provide users with complete visibility into all notifications they've received.

**Key Features**:
- Comprehensive notification log per user
- Read/unread status tracking
- Pagination and filtering (by event type, issue, read status)
- Batch operations (mark as read, delete)
- Statistics dashboard (by event type, channel, time period)
- Issue notification timeline view
- Automatic cleanup of old read notifications

**Database Tables**:
- `mantis_notification_history_table` - User notification history log

**API Module**: `lib/notify/history.ts`

**Key Functions**:
```typescript
logNotificationHistory(entry) - Log single notification
logNotificationHistoryBatch(entries) - Log multiple notifications
getUserNotificationHistory(userId, options) - Get paginated history
markNotificationAsRead(notificationId) - Mark as read
markNotificationsAsRead(notificationIds) - Batch mark as read
markAllNotificationsAsRead(userId) - Mark all as read
getUnreadNotificationCount(userId) - Get unread count
getUserNotificationStats(userId) - Get detailed statistics
deleteNotificationHistory(notificationId) - Delete notification
cleanupOldNotificationHistory(userId, daysOld) - Auto-cleanup
getIssueNotificationTimeline(bugId) - Issue-centric view
```

### 4. Advanced Notification Filters

**Purpose**: Give users granular control over which notifications they receive.

**Key Features**:
- Filter by category, priority, severity, tags, project
- Three action types: notify, ignore, digest_only
- Per-filter channel override (email only, web push only, etc.)
- Global and project-specific filters
- Filter precedence (later filters override earlier)
- Suggested filter values based on user's issue history
- Filter statistics and usage tracking

**Database Tables**:
- `mantis_notification_filter_table` - User notification filters

**API Module**: `lib/notify/filters.ts`

**Key Functions**:
```typescript
createNotificationFilter(filter) - Create new filter
updateNotificationFilter(filterId, updates) - Update filter
deleteNotificationFilter(filterId) - Delete filter
getUserNotificationFilters(userId, projectId) - List user's filters
checkNotificationFilters(userId, projectId, issue) - Check if notification matches
applyNotificationFilters(recipients, projectId, issue) - Filter recipients
getSuggestedFilterValues(userId, filterType) - Get suggested values
getUserFilterStats(userId) - Get filter statistics
```

**Filter Types**:
- `category` - Filter by issue category
- `priority` - Filter by priority level (exact or range: "30-60")
- `severity` - Filter by severity level (exact or range: "50-80")
- `tag` - Filter by issue tags
- `project` - Filter by project
- `custom` - Extensible for future custom filters

**Filter Actions**:
- `notify` - Send notification immediately
- `ignore` - Suppress notification entirely
- `digest_only` - Queue for digest only, no immediate notification

## Installation Steps

### Step 1: Install Dependencies

```bash
pnpm add web-push
pnpm add -D @types/web-push
```

### Step 2: Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Save the public and private keys to your `config/secrets.ts`:

```typescript
webPushEnabled: true,
vapidPublicKey: "BN...(public key here)",
vapidPrivateKey: "x...(private key here)",
vapidSubject: "mailto:support@yourdomain.com",
```

### Step 3: Run Database Migration

```bash
# Apply the SQL migration
mysql -u mantisbt -p mantisbt < prisma/migrations/add_notification_features.sql

# Regenerate Prisma client
pnpm dlx prisma generate
```

### Step 4: Verify Schema

Check that the new tables exist:

```bash
mysql -u mantisbt -p mantisbt -e "SHOW TABLES LIKE 'mantis_notification%'; SHOW TABLES LIKE 'mantis_webpush%'; SHOW TABLES LIKE 'mantis_digest%';"
```

Expected output:
- `mantis_notification_queue_table`
- `mantis_notification_filter_table`
- `mantis_notification_history_table`
- `mantis_webpush_subscription_table`
- `mantis_digest_pref_table`

### Step 5: Set Up Cron Job for Digest Processing

Add to your system crontab or use a process manager:

```bash
# Process digests every hour
0 * * * * curl -X POST https://yourdomain.com/api/cron/process-digests

# Or run as Node.js script
0 * * * * node /path/to/nextbt/scripts/process-digests.js
```

## API Endpoints (To Be Created)

The following API endpoints should be created to expose these features:

### Digest Endpoints
- `GET /api/profile/digest` - Get user's digest preferences
- `PUT /api/profile/digest` - Update digest preferences
- `GET /api/profile/digest/queue` - View queued notifications
- `POST /api/cron/process-digests` - Trigger digest processing (internal)

### Web Push Endpoints
- `POST /api/profile/webpush/subscribe` - Subscribe to web push
- `POST /api/profile/webpush/unsubscribe` - Unsubscribe from web push
- `GET /api/profile/webpush/subscriptions` - List subscriptions
- `POST /api/profile/webpush/test` - Send test notification
- `GET /api/admin/webpush/stats` - Get system statistics (admin)

### Notification History Endpoints
- `GET /api/profile/notifications/history` - Get notification history (paginated)
- `GET /api/profile/notifications/unread-count` - Get unread count
- `PATCH /api/profile/notifications/:id/read` - Mark as read
- `PATCH /api/profile/notifications/mark-all-read` - Mark all as read
- `DELETE /api/profile/notifications/:id` - Delete notification
- `GET /api/profile/notifications/stats` - Get statistics
- `GET /api/issues/:id/notification-timeline` - Get issue notification timeline

### Filter Endpoints
- `GET /api/profile/filters` - List user's filters
- `POST /api/profile/filters` - Create new filter
- `PUT /api/profile/filters/:id` - Update filter
- `DELETE /api/profile/filters/:id` - Delete filter
- `GET /api/profile/filters/suggestions/:type` - Get suggested values
- `GET /api/profile/filters/stats` - Get filter statistics

## Integration with Existing System

### Update `lib/notify/issue-notifications.ts`

The existing `notifyIssueAction()` function should be enhanced to:

1. **Check advanced filters** before sending
2. **Queue for digest** if user has digest_only action
3. **Log to history** after successful delivery
4. **Support web push** as additional channel

Example integration:

```typescript
import { applyNotificationFilters } from "@/lib/notify/filters";
import { queueNotification } from "@/lib/notify/digest";
import { logNotificationHistory } from "@/lib/notify/history";
import { sendWebPush } from "@/lib/notify/webpush";

// In notifyIssueAction():
// 1. Get issue details (already done)
// 2. Filter recipients by preferences (already done)
// 3. Apply advanced filters (NEW)
const filterResult = await applyNotificationFilters(
  recipientUsers.map(u => ({ userId: u.id })),
  ctx.projectId,
  {
    categoryId: issue.category_id,
    priority: issue.priority,
    severity: issue.severity,
  }
);

// 4. Queue for digest users
for (const userId of filterResult.digestOnly) {
  await queueNotification({
    userId,
    bugId: ctx.issueId,
    eventType,
    severity: issue.severity,
    priority: issue.priority,
    categoryId: issue.category_id,
    subject,
    body: textNotification,
    htmlBody: html,
  });
}

// 5. Send immediate notifications
const immediateRecipients = recipientUsers.filter(u =>
  filterResult.notify.includes(u.id)
);

// 6. Send via configured channels + web push
const webPushTasks = immediateRecipients.map(user =>
  sendWebPush(user.id, {
    title: subject,
    body: textNotification,
    data: { issueId: ctx.issueId, action: ctx.action }
  })
);

await Promise.allSettled(webPushTasks);

// 7. Log to history
await logNotificationHistoryBatch(
  immediateRecipients.map(user => ({
    userId: user.id,
    bugId: ctx.issueId,
    eventType,
    subject,
    body: textNotification,
    channelsSent: ["email", "webpush"], // based on what succeeded
  }))
);
```

## UI Components (Recommendations)

### 1. Digest Preferences Component
**Location**: `components/profile/DigestPreferences.tsx`

Features:
- Enable/disable digest
- Frequency selector (hourly/daily/weekly)
- Time picker for daily/weekly
- Day-of-week selector for weekly
- Minimum notifications threshold
- Channel selection checkboxes
- Preview of next scheduled digest

### 2. Web Push Subscription Component
**Location**: `components/profile/WebPushSettings.tsx`

Features:
- Subscribe/unsubscribe button
- Permission status indicator
- List of active subscriptions (with device info)
- Test notification button
- Per-device enable/disable
- Browser compatibility warning

### 3. Notification History Component
**Location**: `components/profile/NotificationHistory.tsx`

Features:
- Paginated notification list
- Filter by event type, read status
- Mark as read/unread
- Delete notifications
- Bulk actions (mark all read, delete selected)
- Statistics dashboard
- Search by issue ID or subject

### 4. Notification Filters Component
**Location**: `components/profile/NotificationFilters.tsx`

Features:
- Filter list with enable/disable toggles
- Add filter wizard:
  - Type selector (category, priority, severity)
  - Value picker (with suggestions)
  - Action selector (notify, ignore, digest_only)
  - Channel overrides
- Edit/delete filters
- Filter statistics
- Test filter matching

## Testing Recommendations

### Unit Tests

Create tests for core modules:

```typescript
// __tests__/lib/notify/digest.test.ts
describe("Notification Digest", () => {
  test("queue notification", () => {});
  test("process pending digests", () => {});
  test("calculate next digest time", () => {});
});

// __tests__/lib/notify/webpush.test.ts
describe("Web Push", () => {
  test("subscribe user", () => {});
  test("send push notification", () => {});
  test("handle expired subscriptions", () => {});
});

// __tests__/lib/notify/filters.test.ts
describe("Notification Filters", () => {
  test("create filter", () => {});
  test("check filter match", () => {});
  test("apply filters to recipients", () => {});
});
```

### Integration Tests

Test end-to-end notification flow:

1. Create issue → check queue/history
2. Configure digest → verify batching
3. Subscribe to web push → verify delivery
4. Create filter → verify suppression/routing

### Manual Testing

1. **Digest System**:
   - Enable digest with hourly frequency
   - Trigger multiple notifications
   - Wait for digest to be sent
   - Verify email contains all batched notifications

2. **Web Push**:
   - Subscribe from browser
   - Trigger notification
   - Verify push appears (even when tab closed)
   - Test on multiple devices

3. **Notification History**:
   - Create notifications
   - View history page
   - Mark as read, delete
   - Check statistics

4. **Filters**:
   - Create category filter with "ignore" action
   - Trigger notification for that category
   - Verify it's suppressed
   - Create priority filter with "digest_only"
   - Verify it queues instead of sending immediately

## Performance Considerations

### Database Indexes

All critical queries are covered by indexes:
- `mantis_notification_queue_table`: (user_id, status), (batch_id), (date_scheduled, status)
- `mantis_webpush_subscription_table`: (endpoint), (user_id, enabled)
- `mantis_notification_filter_table`: (user_id, project_id, enabled), (filter_type)
- `mantis_notification_history_table`: (user_id, read_status), (bug_id), (date_sent)
- `mantis_digest_pref_table`: Primary key on user_id

### Caching Opportunities

1. **User preferences**: Cache digest preferences in Redis (expire: 1 hour)
2. **Filter rules**: Cache active filters per user (expire: 5 minutes)
3. **Web push subscriptions**: Cache active subscriptions (expire: 10 minutes)

### Batch Operations

All modules support batch operations to minimize database round-trips:
- `queueNotificationsBatch()` - Batch queue
- `sendWebPushBatch()` - Batch web push
- `logNotificationHistoryBatch()` - Batch history logging
- `markNotificationsAsRead()` - Batch mark as read

### Cleanup Jobs

Schedule regular cleanup to prevent table bloat:

```bash
# Daily: Clean up old sent digests (>30 days)
0 2 * * * curl -X POST https://yourdomain.com/api/cron/cleanup-digests

# Weekly: Clean up expired web push subscriptions (>90 days)
0 3 * * 0 curl -X POST https://yourdomain.com/api/cron/cleanup-webpush

# Monthly: Clean up old read notifications (>90 days per user)
0 4 1 * * curl -X POST https://yourdomain.com/api/cron/cleanup-history
```

## Security Considerations

### Web Push Security

- VAPID keys should be kept secret
- Subscriptions tied to user accounts
- Validate subscription ownership before sending
- Rate limit push notifications per user
- Sanitize push payload data

### Filter Security

- Users can only create filters for their own account
- Validate filter values to prevent injection
- Limit number of filters per user (e.g., 50 max)
- Prevent complex regex in custom filters

### History Security

- Users can only access their own notification history
- Sanitize notification body content (no XSS)
- Respect issue view permissions (don't show restricted issues)

## Monitoring and Logging

### Key Metrics to Track

1. **Digest System**:
   - Digests sent per period
   - Average notifications per digest
   - Digest open rates (if tracked)
   - Queue depth and processing time

2. **Web Push**:
   - Active subscriptions count
   - Push delivery success rate
   - Expired/invalid subscription rate
   - Push click-through rate (if tracked)

3. **Notification History**:
   - Notifications logged per day
   - Average time to mark as read
   - History retention (days before cleanup)
   - Storage size

4. **Filters**:
   - Active filters per user (average)
   - Filter match rate
   - Most common filter types
   - Suppressed notifications count

### Log Messages

All modules include comprehensive logging:

```
[Digest] Queued notification 12345 for user 67
[Digest] Sent digest to user 67 with 15 notifications
[WebPush] Subscribed user 67 to web push
[WebPush] Sent web push to user 67 (subscription 89)
[WebPush] Disabled invalid subscription 89 for user 67
[History] Logged notification history 12345 for user 67
[Filters] Applied filters: 10 notify, 2 ignore, 3 digest-only
[Filters] Matched category filter: Category 5
```

## Future Enhancements

### Phase 2 Features

1. **Smart Digest Timing**: Analyze user activity patterns to send digests when most likely to be read
2. **Notification Bundling**: Group related notifications (e.g., multiple comments on same issue)
3. **Priority Routing**: Route high-priority issues to immediate notification despite digest preferences
4. **Cross-Device Sync**: Sync read status across web push and email
5. **Notification Templates**: Customizable notification templates per user
6. **A/B Testing**: Test digest timings and formats for optimal engagement

### Advanced Filtering

1. **Regex Filters**: Support regex patterns for advanced matching
2. **Compound Filters**: AND/OR logic for multiple conditions
3. **User Mention Filters**: Filter based on @mentions
4. **Time-Based Filters**: Only notify during work hours
5. **Geolocation Filters**: Filter based on user location/timezone

## Files Created

### Core Modules
- ✨ `lib/notify/digest.ts` - Notification digest and queuing system
- ✨ `lib/notify/webpush.ts` - Web Push notification delivery
- ✨ `lib/notify/history.ts` - Notification history and tracking
- ✨ `lib/notify/filters.ts` - Advanced notification filtering

### Database
- 📋 `prisma/migrations/add_notification_features.sql` - SQL migration
- 🔧 `prisma/schema.prisma` - Updated with 5 new tables

### Documentation
- 📚 `claudedocs/NOTIFICATION-FEATURES-IMPLEMENTATION.md` - This document

## Conclusion

This implementation provides a comprehensive notification enhancement system that:

✅ Reduces notification fatigue through intelligent batching
✅ Enables real-time browser notifications via Web Push API
✅ Provides complete notification visibility and management
✅ Offers granular control over notification routing and delivery

All features are designed to work seamlessly with the existing notification preference system and maintain backward compatibility. The modular architecture allows features to be adopted incrementally or all at once based on deployment needs.

**Status**: ✅ **CORE IMPLEMENTATION COMPLETE** - Ready for API endpoint creation, UI development, and testing.
