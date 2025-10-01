# Email Audit Logging Implementation

## Overview
Implemented comprehensive email notification auditing system that logs all sent notifications (email, Pushover, Rocket.Chat, Teams) and integrates with the bug history log using SQL UNION for unified display.

## Implementation Details

### 1. Database Schema
**New Table**: `mantis_email_audit_table`

**File**: `/prisma/schema.prisma`

**Columns**:
- `id` - Auto-increment primary key
- `bug_id` - Reference to issue/bug
- `user_id` - User who triggered or received notification
- `recipient` - Email address or channel identifier
- `subject` - Notification subject line
- `channel` - Notification channel (email, pushover, rocketchat, teams, webpush)
- `status` - Delivery status (success, failed, pending)
- `error_message` - Error details if delivery failed
- `date_sent` - Unix timestamp of send attempt

**Indexes**:
- `idx_email_audit_bug_id` - Fast lookups by bug
- `idx_email_audit_user_id` - Fast lookups by user
- `idx_email_audit_date_sent` - Chronological sorting
- `idx_email_audit_channel` - Filter by notification channel
- `idx_email_audit_status` - Filter by delivery status

### 2. SQL Migration
**File**: `/db/sql/migrations/001_create_email_audit_table.sql`

**Usage**:
```bash
mysql -u mantisbt -p mantisbt < db/sql/migrations/001_create_email_audit_table.sql
```

### 3. Email Audit Utility
**File**: `/lib/notify/email-audit.ts`

**Functions**:
- `logEmailAudit(entry)` - Log single notification
- `logEmailAuditBatch(entries)` - Log multiple notifications efficiently
- `getEmailAuditStats(bugId)` - Get statistics by channel and status
- `getUserEmailAudit(userId, limit)` - Get recent notifications for a user

**Example Usage**:
```typescript
import { logEmailAudit } from "@/lib/notify/email-audit";

await logEmailAudit({
  bugId: 123,
  userId: 1,
  recipient: "user@example.com",
  subject: "Bug #123 Updated",
  channel: "email",
  status: "success"
});
```

### 4. Notification Dispatch Integration
**File**: `/lib/notify/dispatch.ts`

**Changes**:
- Added audit logging to all notification channels
- Captures success/failure status for each notification
- Logs errors with detailed error messages
- Non-blocking audit logging (doesn't fail notifications on audit errors)

**Features**:
- Automatic logging for all channels (email, Pushover, Rocket.Chat, Teams)
- Success/failure tracking with error details
- Asynchronous logging to avoid blocking notification delivery
- Graceful error handling for audit failures

### 5. Unified History API
**File**: `/app/api/history/route.ts`

**Changes**:
- Uses SQL UNION to combine `mantis_bug_history_table` and `mantis_email_audit_table`
- Sorts all entries by datetime in descending order (newest first)
- Maintains proper pagination across unified results
- Enriches data with user and bug information

**SQL Strategy**:
```sql
SELECT ... FROM mantis_bug_history_table WHERE ...
UNION ALL
SELECT ... FROM mantis_email_audit_table WHERE ...
ORDER BY date_modified DESC
LIMIT ? OFFSET ?
```

**API Response**:
```json
{
  "data": [
    {
      "id": 1,
      "source": "email_audit",
      "user_id": 1,
      "bug_id": 123,
      "field_name": "email_notification",
      "new_value": "user@example.com",
      "recipient": "user@example.com",
      "subject": "Bug #123 Updated",
      "channel": "email",
      "status": "success",
      "date_modified": 1633024800,
      "user": {...},
      "bug": {...}
    },
    {
      "id": 2,
      "source": "bug_history",
      "field_name": "status",
      "old_value": "10",
      "new_value": "20",
      "type": 0,
      "date_modified": 1633024700,
      ...
    }
  ],
  "pagination": {...}
}
```

### 6. History Log UI Updates
**File**: `/components/history/HistoryLog.tsx`

**New Features**:
- Displays both bug history and email audit entries in unified table
- Color-coded badges:
  - Blue badge for email audit entries
  - Green badge for bug history entries
- Status indicators for email deliveries:
  - Green: success
  - Red: failed
  - Yellow: pending
- Channel display (email, pushover, rocketchat, teams)
- Error message tooltips for failed deliveries
- Responsive design with proper dark mode support

**Visual Indicators**:
- Field Name column shows notification channel for email entries
- New Value column displays recipient with status badge
- Type column shows "Email" badge instead of numeric type
- Error messages shown with truncation and full text on hover

## Data Flow

### Email Notification Flow
1. **Trigger**: Issue created/updated
2. **Recipients**: System identifies users to notify
3. **Dispatch**: `notifyAll()` sends notifications via configured channels
4. **Success/Failure**: Each channel reports success or failure
5. **Audit Log**: Entry created in `mantis_email_audit_table`
6. **History Display**: Appears in unified history log

### Audit Entry Lifecycle
```
Issue Event → notifyAll() → Send Notification
                              ↓
                         Success/Failure
                              ↓
                         logEmailAudit()
                              ↓
                    mantis_email_audit_table
                              ↓
                         UNION with bug_history
                              ↓
                    Unified History Display
```

## Usage

### Viewing Email Audit Logs
1. Navigate to `/history` as admin user
2. View unified log with both bug changes and email notifications
3. Filter by:
   - Bug ID (see all notifications for specific issue)
   - User ID (see all notifications sent to/by user)
   - Field name (filter to show only email notifications)

### Analyzing Email Delivery
```typescript
// Get email stats for a bug
const stats = await getEmailAuditStats(123);
// Returns: [
//   { channel: "email", status: "success", _count: 5 },
//   { channel: "pushover", status: "failed", _count: 1 }
// ]

// Get recent emails for a user
const recent = await getUserEmailAudit(1, 10);
// Returns last 10 email notifications
```

### Debugging Failed Notifications
1. Go to History Log
2. Look for entries with red "failed" badges
3. Hover over error message for full error details
4. Check channel and recipient for configuration issues

## Database Migration Steps

1. **Backup Database**:
   ```bash
   mysqldump -u mantisbt -p mantisbt > backup.sql
   ```

2. **Run Migration**:
   ```bash
   mysql -u mantisbt -p mantisbt < db/sql/migrations/001_create_email_audit_table.sql
   ```

3. **Verify Table**:
   ```sql
   DESCRIBE mantis_email_audit_table;
   SELECT COUNT(*) FROM mantis_email_audit_table;
   ```

4. **Generate Prisma Client**:
   ```bash
   pnpm dlx prisma generate
   ```

## Benefits

### Compliance & Auditing
- Complete audit trail of all notifications
- Tracks delivery success/failure rates
- Identifies problematic email addresses or channels
- Provides evidence of notification attempts

### Debugging & Monitoring
- Quickly identify notification failures
- Monitor email delivery rates by channel
- Track which users receive notifications
- Diagnose configuration issues

### Analytics
- Notification volume by bug
- Channel effectiveness metrics
- User engagement tracking
- Error pattern identification

## Future Enhancements

### Potential Improvements
- Real-time notification status dashboard
- Automated alerts for high failure rates
- Email delivery retry mechanism
- Notification preference analytics
- Export audit logs to CSV
- Webhook for external monitoring systems
- Notification templates tracking
- Delivery time analytics

### Integration Opportunities
- Grafana dashboard for visualization
- Prometheus metrics export
- Slack notifications for critical failures
- PagerDuty integration for persistent failures

## Testing

### Manual Testing Steps
1. Create or update an issue
2. Verify email notifications are sent
3. Check History Log for email audit entries
4. Verify entries show correct channel, status, recipient
5. Test filtering by bug ID, user ID
6. Verify pagination works across unified results
7. Test with failed notifications (invalid email)
8. Verify error messages are captured

### Test Scenarios
- ✅ Successful email delivery
- ✅ Failed email delivery with error message
- ✅ Multiple channels (email + Pushover + Teams)
- ✅ Unified sorting with bug history
- ✅ Pagination across UNION results
- ✅ Filter by bug ID
- ✅ Filter by user ID
- ✅ Dark mode display
- ✅ Error message tooltips

## Performance Considerations

### Optimizations Applied
- Indexed all query columns for fast lookups
- Asynchronous audit logging (doesn't block notifications)
- Batch logging support for multiple notifications
- Efficient SQL UNION with proper indexes
- Graceful error handling (audit failures don't break notifications)

### Scaling Recommendations
- Archive old audit entries after 90 days
- Partition table by date for large volumes
- Consider separate read replica for history queries
- Implement caching for frequently accessed stats
