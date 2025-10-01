#!/bin/bash
# Fresh build script - clears Next.js cache and rebuilds from scratch
# Usage: pnpm fresh-build or ./scripts/fresh-build.sh

set -e  # Exit on error

echo "🧹 Clearing Next.js build cache..."
rm -rf .next

echo "📦 Running fresh production build..."
next build

echo "✅ Fresh build complete!"
