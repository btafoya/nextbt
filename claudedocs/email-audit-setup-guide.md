# Email Audit Setup Guide

## Quick Start

### Step 1: Run Database Migration

**Option A: Using MySQL Command Line**
```bash
mysql -u mantisbt -p mantisbt < db/sql/migrations/001_create_email_audit_table.sql
```

**Option B: Using MantisBT Database**
```bash
# If using different credentials, adjust accordingly
mysql -u YOUR_DB_USER -p YOUR_DB_NAME < db/sql/migrations/001_create_email_audit_table.sql
```

### Step 2: Verify Table Creation
```sql
-- Connect to your database
mysql -u mantisbt -p mantisbt

-- Check table exists
SHOW TABLES LIKE 'mantis_email_audit_table';

-- Verify schema
DESCRIBE mantis_email_audit_table;

-- Should show:
-- +---------------+------------------+------+-----+---------+----------------+
-- | Field         | Type             | Null | Key | Default | Extra          |
-- +---------------+------------------+------+-----+---------+----------------+
-- | id            | int(10) unsigned | NO   | PRI | NULL    | auto_increment |
-- | bug_id        | int(10) unsigned | NO   | MUL | 0       |                |
-- | user_id       | int(10) unsigned | NO   | MUL | 0       |                |
-- | recipient     | varchar(255)     | NO   |     | NULL    |                |
-- | subject       | varchar(255)     | NO   |     | NULL    |                |
-- | channel       | varchar(32)      | NO   | MUL | NULL    |                |
-- | status        | varchar(32)      | NO   | MUL | NULL    |                |
-- | error_message | text             | NO   |     | NULL    |                |
-- | date_sent     | int(10) unsigned | NO   | MUL | 1       |                |
-- +---------------+------------------+------+-----+---------+----------------+
```

### Step 3: Generate Prisma Client
```bash
# From project root
pnpm dlx prisma generate
```

### Step 4: Restart Development Server
```bash
# If server is running, restart it
# Press Ctrl+C to stop, then:
pnpm dev
```

### Step 5: Test the Implementation

1. **Access History Log**:
   - Navigate to http://localhost:3000/history
   - Login as admin user (btafoya)
   - Verify page loads without errors

2. **Trigger a Notification**:
   - Create or update an issue
   - Check that notification is sent
   - Verify email audit entry appears in history log

3. **Verify Display**:
   - Email entries should have blue badges
   - Status indicators (success/failed) should appear
   - Channel information should display (email, pushover, etc.)
   - Unified sorting with bug history should work

## Troubleshooting

### Issue: Table Already Exists
**Error**: `Table 'mantis_email_audit_table' already exists`

**Solution**: Table is already created, skip migration step. Proceed to Step 3.

### Issue: Permission Denied
**Error**: `Access denied for user...`

**Solution**: Ensure you're using correct database credentials:
```bash
# Check your database config
cat config/secrets.ts | grep DATABASE_URL

# Use those credentials for migration
mysql -u YOUR_USER -p YOUR_DATABASE < db/sql/migrations/001_create_email_audit_table.sql
```

### Issue: Prisma Client Not Updated
**Error**: `Property 'mantis_email_audit_table' does not exist on type 'PrismaClient'`

**Solution**: Regenerate Prisma client:
```bash
pnpm dlx prisma generate
# Restart your dev server
```

### Issue: History Page Shows Empty
**Possible Causes**:
1. No notifications have been sent yet → Trigger a notification
2. Table is empty → Normal for new installation
3. Migration not run → Run migration from Step 1
4. Prisma client not updated → Run Step 3

### Issue: Notifications Not Being Logged
**Debug Steps**:
1. Check server console for audit logging errors
2. Verify notification dispatch is working (emails being sent)
3. Check database for entries:
   ```sql
   SELECT * FROM mantis_email_audit_table ORDER BY date_sent DESC LIMIT 10;
   ```
4. Verify `bugId` parameter is being passed to `notifyAll()`

## Verification Queries

### Check Recent Audit Entries
```sql
SELECT
  id,
  bug_id,
  user_id,
  recipient,
  subject,
  channel,
  status,
  FROM_UNIXTIME(date_sent) as sent_at
FROM mantis_email_audit_table
ORDER BY date_sent DESC
LIMIT 10;
```

### Check Success/Failure Rates
```sql
SELECT
  channel,
  status,
  COUNT(*) as count
FROM mantis_email_audit_table
GROUP BY channel, status
ORDER BY channel, status;
```

### Check Failed Notifications
```sql
SELECT
  bug_id,
  recipient,
  channel,
  error_message,
  FROM_UNIXTIME(date_sent) as sent_at
FROM mantis_email_audit_table
WHERE status = 'failed'
ORDER BY date_sent DESC
LIMIT 20;
```

### Verify UNION Query Works
```sql
-- This simulates the API's UNION query
SELECT 'bug_history' as source, COUNT(*) as count FROM mantis_bug_history_table
UNION ALL
SELECT 'email_audit' as source, COUNT(*) as count FROM mantis_email_audit_table;
```

## Testing Checklist

- [ ] Database migration completed successfully
- [ ] Table exists with correct schema
- [ ] Prisma client generated
- [ ] Dev server restarts without errors
- [ ] History log page loads
- [ ] Can create/update an issue
- [ ] Email notification is sent
- [ ] Email audit entry appears in history
- [ ] Entry shows correct channel (email/pushover/etc.)
- [ ] Status badge displays (success/failed)
- [ ] Error messages appear for failed notifications
- [ ] Filtering by bug ID works
- [ ] Filtering by user ID works
- [ ] Pagination works correctly
- [ ] Dark mode displays properly

## Rollback (If Needed)

If you need to remove the email audit table:

```sql
-- Drop the table
DROP TABLE IF EXISTS mantis_email_audit_table;

-- Regenerate Prisma client
-- (from project root)
pnpm dlx prisma generate
```

Then revert the code changes:
```bash
git checkout HEAD -- prisma/schema.prisma
git checkout HEAD -- lib/notify/dispatch.ts
git checkout HEAD -- app/api/history/route.ts
git checkout HEAD -- components/history/HistoryLog.tsx
```

## Next Steps

After successful setup:

1. **Monitor Email Delivery**: Check history log regularly for failed notifications
2. **Analyze Patterns**: Use SQL queries to identify problematic email addresses or channels
3. **Configure Notifications**: Ensure all channels are properly configured in `config/secrets.ts`
4. **Test All Channels**: Verify Postmark, Pushover, Rocket.Chat, Teams all log correctly
5. **Archive Old Data**: Consider archiving audit entries older than 90 days for performance

## Support

For issues or questions:
- Check server console for error messages
- Review `claudedocs/email-audit-implementation.md` for detailed implementation info
- Verify database credentials in `config/secrets.ts`
- Ensure all notification services are properly configured
