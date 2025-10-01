#!/usr/bin/env node
// scripts/process-digests.js
// Processes pending notification digests for all eligible users
// Should be run periodically via cron (e.g., every 15 minutes)
// Requires Node.js 18+ for built-in fetch support

const API_URL = process.env.NEXTBT_API_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.NEXTBT_CRON_SECRET || 'change-me-in-production';

async function main() {
  const startTime = Date.now();
  console.log('🔄 Starting digest processing...');

  try {
    const response = await fetch(`${API_URL}/api/cron/process-digests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cron-Secret': CRON_SECRET,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} ${error}`);
    }

    const result = await response.json();
    const duration = Date.now() - startTime;

    console.log(`✅ Digest processing completed in ${duration}ms`);
    console.log(`   API duration: ${result.duration || 0}ms`);

    if (result.cleaned) {
      console.log(`   Old digests cleaned: ${result.cleaned}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Digest processing failed:', error.message);
    process.exit(1);
  }
}

main();
