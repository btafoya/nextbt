#!/bin/bash
# scripts/migrate-notification-features.sh
# Runs the notification features database migration

set -e  # Exit on error

echo "🔧 NextBT Notification Features Migration"
echo "=========================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo ""
  echo "Please set it like this:"
  echo "  export DATABASE_URL=\"mysql://user:pass@host:3306/mantisbt\""
  echo ""
  exit 1
fi

echo "📋 Database connection: $(echo $DATABASE_URL | sed 's/:.*@/:***@/')"
echo ""

# Extract database connection details from DATABASE_URL
DB_URL_REGEX="mysql://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^?]+)"

if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASS="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]}"
  DB_NAME="${BASH_REMATCH[5]}"
else
  echo "❌ ERROR: Invalid DATABASE_URL format"
  echo "Expected format: mysql://user:pass@host:port/database"
  exit 1
fi

# Check if migration file exists
MIGRATION_FILE="prisma/migrations/add_notification_features.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ ERROR: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo ""

# Confirm before proceeding
read -p "⚠️  This will add 5 new tables to your database. Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Migration cancelled"
  exit 1
fi

echo ""
echo "🚀 Running migration..."
echo ""

# Run the migration
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration completed successfully!"
  echo ""
  echo "📊 New tables created:"
  echo "  - mantis_notification_queue_table"
  echo "  - mantis_webpush_subscription_table"
  echo "  - mantis_notification_filter_table"
  echo "  - mantis_notification_history_table"
  echo "  - mantis_digest_pref_table"
  echo ""

  # Regenerate Prisma client
  echo "🔄 Regenerating Prisma client..."
  pnpm dlx prisma generate

  echo ""
  echo "✅ All done! Your notification features are ready to use."
  echo ""
  echo "📝 Next steps:"
  echo "  1. Generate VAPID keys: node scripts/generate-vapid-keys.js"
  echo "  2. Add VAPID keys to config/secrets.ts"
  echo "  3. Set up cron job for digest processing"
  echo "  4. Restart your dev server: pnpm dev"
  echo ""
else
  echo ""
  echo "❌ Migration failed!"
  echo "Please check the error message above and try again."
  exit 1
fi
