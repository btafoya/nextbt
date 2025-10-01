#!/bin/bash
# scripts/setup-cron.sh
# Automated setup for digest processing cron job

set -e

echo "🔧 NextBT Digest Cron Setup"
echo "============================="
echo ""

# Get project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_PATH=$(which node)

echo "📁 Project directory: $PROJECT_DIR"
echo "📍 Node.js path: $NODE_PATH"
echo ""

# Check if script exists
if [ ! -f "$PROJECT_DIR/scripts/process-digests.js" ]; then
  echo "❌ ERROR: process-digests.js not found in scripts/"
  exit 1
fi

# Test the script
echo "🧪 Testing digest processor script..."
cd "$PROJECT_DIR"
if $NODE_PATH scripts/process-digests.js; then
  echo "✅ Script test passed!"
else
  echo "❌ Script test failed - please fix errors before setting up cron"
  exit 1
fi

echo ""
echo "Select cron frequency:"
echo "  1) Every 15 minutes (recommended)"
echo "  2) Every 30 minutes"
echo "  3) Every hour"
echo "  4) Custom"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
  1)
    CRON_SCHEDULE="*/15 * * * *"
    DESCRIPTION="every 15 minutes"
    ;;
  2)
    CRON_SCHEDULE="*/30 * * * *"
    DESCRIPTION="every 30 minutes"
    ;;
  3)
    CRON_SCHEDULE="0 * * * *"
    DESCRIPTION="every hour"
    ;;
  4)
    read -p "Enter cron schedule (e.g., '*/15 * * * *'): " CRON_SCHEDULE
    DESCRIPTION="custom schedule"
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

# Create log directory
LOG_FILE="/var/log/nextbt-digest.log"
echo ""
echo "📝 Creating log file: $LOG_FILE"

if [ -w "/var/log" ]; then
  touch "$LOG_FILE" 2>/dev/null || sudo touch "$LOG_FILE"
  sudo chown $USER:$USER "$LOG_FILE" 2>/dev/null || true
  echo "✅ Log file created"
else
  echo "⚠️  Cannot write to /var/log - using local logs/"
  LOG_FILE="$PROJECT_DIR/logs/digest.log"
  mkdir -p "$PROJECT_DIR/logs"
  touch "$LOG_FILE"
  echo "✅ Using local log file: $LOG_FILE"
fi

# Build cron command
CRON_CMD="$CRON_SCHEDULE cd $PROJECT_DIR && $NODE_PATH scripts/process-digests.js >> $LOG_FILE 2>&1"

echo ""
echo "📋 Cron job to be added:"
echo "   $CRON_CMD"
echo ""
read -p "Add this cron job? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Setup cancelled"
  exit 1
fi

# Add to crontab
(crontab -l 2>/dev/null | grep -v "process-digests.js"; echo "$CRON_CMD") | crontab -

echo ""
echo "✅ Cron job added successfully!"
echo ""
echo "📊 Current crontab:"
crontab -l | grep "process-digests.js"
echo ""
echo "📝 Logs will be written to: $LOG_FILE"
echo ""
echo "Next steps:"
echo "  1. Monitor logs: tail -f $LOG_FILE"
echo "  2. Verify cron execution in 15 minutes"
echo "  3. Check digest delivery in user preferences"
echo ""
echo "To remove the cron job:"
echo "  crontab -e  # Then delete the line containing 'process-digests.js'"
echo ""
