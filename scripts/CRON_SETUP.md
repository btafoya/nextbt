# Digest Processing Cron Setup

This guide explains how to set up automated digest processing for NextBT notifications.

## Overview

The digest system processes pending notifications and sends them in batches based on user preferences (hourly, daily, or weekly). A cron job runs periodically to check for eligible users and send their digests.

## Prerequisites

- Node.js 18+ installed on the server (for built-in fetch support)
- NextBT project deployed and running
- Database connection configured in `config/secrets.ts`
- VAPID keys configured in `config/secrets.ts` (for web push)
- Environment variables set:
  - `NEXTBT_API_URL` - Your NextBT server URL (default: http://localhost:3000)
  - `NEXTBT_CRON_SECRET` - Secret for API authentication (default: change-me-in-production)

## Quick Setup

### 1. Test the Script Manually

First, verify the script works correctly:

```bash
cd /home/btafoya/docker-stacks/nextbt
node scripts/process-digests.js
```

You should see output like:
```
🔄 Starting digest processing...
Found 3 users eligible for digest processing
✅ Digest processing completed in 234ms
```

### 2. Set Up Cron Job

Edit your crontab:

```bash
crontab -e
```

Add one of these lines based on your preferred frequency:

**Every 15 minutes** (recommended for responsive digests):
```cron
*/15 * * * * cd /home/btafoya/docker-stacks/nextbt && /usr/bin/node scripts/process-digests.js >> /var/log/nextbt-digest.log 2>&1
```

**Every hour** (for less frequent processing):
```cron
0 * * * * cd /home/btafoya/docker-stacks/nextbt && /usr/bin/node scripts/process-digests.js >> /var/log/nextbt-digest.log 2>&1
```

**Every 30 minutes** (balanced approach):
```cron
*/30 * * * * cd /home/btafoya/docker-stacks/nextbt && /usr/bin/node scripts/process-digests.js >> /var/log/nextbt-digest.log 2>&1
```

### 3. Create Log Directory

Ensure the log file location exists and is writable:

```bash
sudo touch /var/log/nextbt-digest.log
sudo chown $USER:$USER /var/log/nextbt-digest.log
```

### 4. Verify Cron Job

Check that your cron job is scheduled:

```bash
crontab -l
```

Monitor the log file:

```bash
tail -f /var/log/nextbt-digest.log
```

## Docker Setup

If running in Docker, you have two options:

### Option 1: External Cron (Recommended)

Run cron on the host system and execute the script in the Docker container:

```cron
*/15 * * * * docker exec nextbt-app node /app/scripts/process-digests.js >> /var/log/nextbt-digest.log 2>&1
```

### Option 2: Internal Cron

Install cron inside the Docker container and configure it there. Add to your Dockerfile:

```dockerfile
RUN apt-get update && apt-get install -y cron

# Copy cron file
COPY scripts/digest-cron /etc/cron.d/digest-cron
RUN chmod 0644 /etc/cron.d/digest-cron
RUN crontab /etc/cron.d/digest-cron

# Start cron
CMD cron && npm start
```

Create `scripts/digest-cron`:
```
*/15 * * * * cd /app && node scripts/process-digests.js >> /var/log/nextbt-digest.log 2>&1
```

## Systemd Timer (Alternative to Cron)

For modern Linux systems, you can use systemd timers instead of cron.

### Create Service File

`/etc/systemd/system/nextbt-digest.service`:

```ini
[Unit]
Description=NextBT Digest Processing
After=network.target

[Service]
Type=oneshot
User=btafoya
WorkingDirectory=/home/btafoya/docker-stacks/nextbt
ExecStart=/usr/bin/node /home/btafoya/docker-stacks/nextbt/scripts/process-digests.js
StandardOutput=append:/var/log/nextbt-digest.log
StandardError=append:/var/log/nextbt-digest.log
```

### Create Timer File

`/etc/systemd/system/nextbt-digest.timer`:

```ini
[Unit]
Description=NextBT Digest Processing Timer
Requires=nextbt-digest.service

[Timer]
OnBootSec=5min
OnUnitActiveSec=15min
Unit=nextbt-digest.service

[Install]
WantedBy=timers.target
```

### Enable and Start Timer

```bash
sudo systemctl daemon-reload
sudo systemctl enable nextbt-digest.timer
sudo systemctl start nextbt-digest.timer

# Check status
sudo systemctl status nextbt-digest.timer
sudo systemctl list-timers nextbt-digest.timer
```

## Monitoring and Troubleshooting

### Check Logs

```bash
# View recent logs
tail -n 100 /var/log/nextbt-digest.log

# Follow logs in real-time
tail -f /var/log/nextbt-digest.log

# Search for errors
grep -i error /var/log/nextbt-digest.log
```

### Manual Execution

Test the script manually with verbose logging:

```bash
cd /home/btafoya/docker-stacks/nextbt
NODE_ENV=development node scripts/process-digests.js
```

### Common Issues

**Issue: "Module not found" errors**
- Solution: Ensure you're in the project directory and dependencies are installed
  ```bash
  cd /home/btafoya/docker-stacks/nextbt
  pnpm install
  ```

**Issue: Database connection errors**
- Solution: Verify `config/secrets.ts` has correct database credentials
- Check that MySQL is running and accessible

**Issue: No digests being sent**
- Solution: Verify users have digest preferences enabled:
  ```sql
  SELECT * FROM mantis_digest_pref_table WHERE enabled = 1;
  ```

**Issue: Cron job not running**
- Solution: Check cron service is running:
  ```bash
  sudo systemctl status cron  # Debian/Ubuntu
  sudo systemctl status crond # CentOS/RHEL
  ```

### Performance Tuning

For high-volume installations:

1. **Adjust frequency**: Run more often (every 5-10 minutes) for real-time digests
2. **Batch processing**: Process users in batches if you have thousands of users
3. **Parallel processing**: Run multiple digest processors with user ID ranges
4. **Database indexes**: Ensure indexes exist on queue table columns

Example batch cron setup:
```cron
# Process users 1-1000
*/15 * * * * cd /app && node scripts/process-digests.js --start-user 1 --end-user 1000 >> /var/log/digest-1.log 2>&1

# Process users 1001-2000
*/15 * * * * cd /app && node scripts/process-digests.js --start-user 1001 --end-user 2000 >> /var/log/digest-2.log 2>&1
```

## Cleanup

The script automatically cleans up old digests (30+ days) daily at 2:00 AM. You can adjust this in `scripts/process-digests.js`:

```javascript
// Clean up digests older than 60 days
const cleaned = await cleanupOldDigests(60);
```

## Health Checks

Add a health check endpoint to monitor digest processing:

```typescript
// app/api/health/digests/route.ts
export async function GET() {
  const lastRun = await getLastDigestRun();
  const queueSize = await getQueueSize();

  return NextResponse.json({
    status: "healthy",
    lastRun,
    queueSize,
    timestamp: new Date().toISOString()
  });
}
```

Monitor this endpoint:
```bash
curl http://localhost:3000/api/health/digests
```

## Next Steps

1. Test digest functionality with a test user account
2. Set up monitoring/alerting for failed digest deliveries
3. Configure log rotation for `/var/log/nextbt-digest.log`
4. Consider using a process manager like PM2 or supervisord for production
