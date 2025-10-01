# Notification System Audit & Fix Report

## Executive Summary

Comprehensive audit and correction of the notification preference logic across the entire NextBT application. The notification system now properly respects user preferences for all event types and severity thresholds globally.

## Problems Identified

### 1. **Incomplete Preference Checking** ❌
**Location**: `lib/notify/recipients.ts`
- Only checked `email_on_new` preference
- Ignored all other event types (assigned, feedback, resolved, closed, reopened, bugnote, status, priority)
- **Impact**: Users received notifications for events they had disabled in preferences

### 2. **Missing Severity Validation** ❌
**Location**: `lib/notify/recipients.ts:54-70`
- Only fetched `email_on_new_min_severity`
- Missing all other severity threshold fields
- **Impact**: Could not validate severity thresholds for most notification types

### 3. **Preference Logic Not Used for Actual Sending** ❌
**Location**: `lib/notify/issue-notifications.ts`
- `notifyIssueAction()` sent to ALL project users
- Never consulted user preferences
- **Impact**: Notification preferences were displayed but completely ignored during delivery

### 4. **Duplicate Logic** ❌
**Location**: Two separate systems
- `lib/notify/recipients.ts` - Checked preferences (for display only)
- `lib/notify/issue-notifications.ts` - Actually sent (ignored preferences)
- **Impact**: Code duplication, maintenance burden, logic inconsistency

### 5. **No Event Type Mapping** ❌
**Location**: `lib/notify/issue-notifications.ts`
- No mapping from `IssueAction` to notification event types
- **Impact**: Could not determine which preference field to check

## Solutions Implemented

### 1. **Centralized Preference Checker** ✅
**File**: `lib/notify/preference-checker.ts` (NEW)

**Features**:
- Single source of truth for all preference checking logic
- Supports all 9 notification event types:
  - `new` - New issues created
  - `assigned` - Issue assignments
  - `feedback` - Feedback requests
  - `resolved` - Issues resolved
  - `closed` - Issues closed
  - `reopened` - Issues reopened
  - `bugnote` - Comments/notes added
  - `status` - Status changes
  - `priority` - Priority changes
- Validates both enabled flags AND severity thresholds
- Reusable across all notification scenarios

**Key Functions**:
```typescript
// Check if a single user should be notified
shouldNotifyUser(eventType, issueSeverity, userPreference)

// Get preferences for multiple users efficiently
getUserPreferences(userIds)

// Filter users based on preferences
filterNotificationRecipients(userIds, eventType, issueSeverity)
```

### 2. **Updated Notification Delivery** ✅
**File**: `lib/notify/issue-notifications.ts` (MODIFIED)

**Changes**:
1. **Fetches issue severity** before filtering users
2. **Maps actions to event types**:
   - `created` → `new`
   - `assigned` → `assigned`
   - `commented` → `bugnote`
   - `status_changed` → `status`
3. **Filters recipients** using `filterNotificationRecipients()`
4. **Logs filtering results** for monitoring
5. **Sends only to users who passed preference filter**

**Before**:
```typescript
// Sent to ALL project users (ignoring preferences)
const users = await getProjectUsers(ctx.projectId, ctx.actorId);
emailTasks = users.map(user => sendEmail(...));
```

**After**:
```typescript
// Filter based on preferences first
const { recipients } = await filterNotificationRecipients(
  users.map(u => u.id),
  eventType,
  issue.severity
);
const recipientUsers = users.filter(u => recipientIds.includes(u.id));
emailTasks = recipientUsers.map(user => sendEmail(...));
```

### 3. **Updated Recipient Display Logic** ✅
**File**: `lib/notify/recipients.ts` (MODIFIED)

**Changes**:
1. **Uses centralized `getUserPreferences()`** instead of local query
2. **Uses centralized `shouldNotifyUser()`** for consistency
3. **Supports event type parameter** (defaults to "new" for backward compatibility)
4. **Provides detailed reason strings** with user role context

**Benefits**:
- Consistent logic between display and actual delivery
- Single place to maintain preference checking rules
- Accurate "willReceive" predictions

### 4. **Proper Severity Sanitization** ✅
**Files**: `app/api/profile/notifications/route.ts`, `app/api/users/[id]/notifications/route.ts`

**Already Fixed** (previous work):
- GET endpoints sanitize severity values to minimum 10
- POST endpoints auto-correct invalid values instead of rejecting
- Prevents issues with MantisBT's default 0 values

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│     User Notification Preferences       │
│  (mantis_user_pref_table in database)   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   preference-checker.ts (NEW)           │
│   ┌─────────────────────────────────┐   │
│   │ getUserPreferences()            │   │
│   │ shouldNotifyUser()              │   │
│   │ filterNotificationRecipients()  │   │
│   └─────────────────────────────────┘   │
└─────────────┬───────────────────────────┘
              │
       ┌──────┴──────┐
       │             │
       ▼             ▼
┌─────────────┐ ┌────────────────────┐
│ recipients  │ │ issue-notifications│
│   .ts       │ │      .ts           │
│             │ │                    │
│ Display     │ │ Actual             │
│ who will    │ │ notification       │
│ receive     │ │ sending            │
└─────────────┘ └────────────────────┘
       │                  │
       └────────┬─────────┘
                ▼
        ┌───────────────┐
        │   dispatch.ts  │
        │                │
        │  Send via:     │
        │  - Email       │
        │  - Pushover    │
        │  - Rocket.Chat │
        │  - Teams       │
        └────────────────┘
```

## Testing Recommendations

### 1. **Unit Tests** (Priority: HIGH)
Create tests for `/lib/notify/preference-checker.ts`:
- `shouldNotifyUser()` with all 9 event types
- Severity threshold validation
- Edge cases (null preferences, invalid severities)

### 2. **Integration Tests** (Priority: HIGH)
Test end-to-end notification flow:
- Create issue with different severities (10, 20, 30, 40, 50, 60, 70, 80)
- Set user preferences for different event types
- Verify only matching users receive notifications

### 3. **Manual Testing** (Priority: MEDIUM)
1. Configure user notification preferences via UI
2. Perform issue actions (create, assign, comment, status change)
3. Verify emails sent only to users matching criteria
4. Check notification recipient display shows accurate predictions

## Migration Notes

### Database Schema
**No changes required** - Uses existing `mantis_user_pref_table` structure

### Breaking Changes
**None** - All changes are backward compatible:
- `getNotificationRecipients()` has optional `eventType` parameter (defaults to "new")
- Existing API endpoints unchanged
- Frontend components work without modification

### Deployment Steps
1. Deploy code changes (no database migration needed)
2. Monitor notification logs for filtering results
3. Verify user preferences are being respected
4. Check for any email audit logging errors

## Performance Improvements

### Before
- Fetched limited preference fields
- Multiple database queries
- Checked preferences inconsistently

### After
- **Single batch query** for all user preferences
- **Efficient Map-based lookup** (O(1) per user)
- **Early filtering** reduces notification sending overhead
- **Detailed logging** for monitoring and debugging

## Monitoring

### Key Metrics to Track
1. **Notification filter rate**: `recipientUsers.length / users.length`
2. **Preference coverage**: Users with vs without preferences
3. **Email delivery success rate**: Successful sends / attempted sends
4. **Audit log errors**: Failed email_audit_table inserts

### Log Messages
```
"Filtered X users to Y recipients for {eventType} notifications"
"Notifying X/Y users for issue #Z (eventType, severity N)"
"No users match notification criteria for issue #X"
```

## Future Enhancements

### Potential Improvements
1. **Project-specific preferences** (currently only global `project_id: 0`)
2. **Notification digest** (batch multiple notifications)
3. **Real-time web notifications** (complement email)
4. **Notification history** (show users what notifications they received)
5. **Advanced filters** (notify only for specific categories, priorities)

### Code Quality
1. Add comprehensive unit tests for preference-checker
2. Add integration tests for end-to-end flow
3. Document notification event types in CLAUDE.md
4. Create notification troubleshooting guide

## Files Changed

### New Files
- ✨ `lib/notify/preference-checker.ts` - Centralized preference logic

### Modified Files
- 🔧 `lib/notify/issue-notifications.ts` - Now respects user preferences
- 🔧 `lib/notify/recipients.ts` - Uses centralized preference checker
- 📝 `app/api/profile/notifications/route.ts` - Severity sanitization (previous fix)
- 📝 `app/api/users/[id]/notifications/route.ts` - Severity sanitization (previous fix)

### Documentation
- 📋 `claudedocs/NOTIFICATION-AUDIT-FIX.md` - This report

## Conclusion

The notification system now properly respects user preferences globally across all event types and severity thresholds. The centralized `preference-checker.ts` module ensures consistency between notification recipient display and actual delivery, eliminating the previous disconnect where preferences were shown but ignored.

**Status**: ✅ **COMPLETE** - All critical issues resolved, system ready for testing and deployment.
