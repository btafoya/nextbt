#!/bin/bash
# Fresh build script - clears Next.js cache and rebuilds from scratch
# Usage: pnpm fresh-build or ./scripts/fresh-build.sh

set -e  # Exit on error

echo "🧹 Clearing Next.js build cache..."
rm -rf .next

echo "🏷️  Generating build version..."
export BUILD_ID=$(date +%s)
echo "Build ID: $BUILD_ID"

echo "🔧 Extracting Sentry configuration..."
# Extract Sentry config from TypeScript config and export as environment variables
export SENTRY_ORG=$(grep -o 'sentryOrg: *"[^"]*"' config/secrets.ts | sed 's/.*"\([^"]*\)".*/\1/')
export SENTRY_PROJECT=$(grep -o 'sentryProject: *"[^"]*"' config/secrets.ts | sed 's/.*"\([^"]*\)".*/\1/')
export SENTRY_AUTH_TOKEN=$(grep -o 'sentryAuthToken: *"[^"]*"' config/secrets.ts | sed 's/.*"\([^"]*\)".*/\1/')

if [ -n "$SENTRY_ORG" ] && [ -n "$SENTRY_PROJECT" ]; then
  echo "✓ Sentry configuration loaded (org: $SENTRY_ORG, project: $SENTRY_PROJECT)"
else
  echo "⚠ Sentry configuration not found or incomplete"
fi

echo "📦 Running fresh production build..."
next build

echo "✅ Fresh build complete!"
