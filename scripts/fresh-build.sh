#!/bin/bash
# Fresh build script - clears Next.js cache and rebuilds from scratch
# Usage: pnpm fresh-build or ./scripts/fresh-build.sh

set -e  # Exit on error

echo "🧹 Clearing Next.js build cache..."
rm -rf .next

echo "🏷️  Generating build version..."
export BUILD_ID=$(date +%s)
echo "Build ID: $BUILD_ID"

echo "📦 Running fresh production build..."
next build

echo "✅ Fresh build complete!"
