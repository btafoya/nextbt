import "server-only";
import { secrets } from "@/config/secrets";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory store for rate limiting (simplest approach without DB changes)
// In production, consider using Redis or similar
const rateLimitStore = new Map<string, RateLimitRecord>();

export class AIRateLimiter {
  private static readonly DEFAULT_REQUESTS = secrets.aiRateLimitRequests || 60;
  private static readonly DEFAULT_WINDOW = secrets.aiRateLimitWindow || 600; // seconds

  /**
   * Check if a user has exceeded their rate limit
   */
  static async check(
    userId: string,
    maxRequests?: number,
    windowSeconds?: number
  ): Promise<RateLimitResult> {
    const limit = maxRequests || this.DEFAULT_REQUESTS;
    const window = windowSeconds || this.DEFAULT_WINDOW;
    const now = Date.now();
    const windowStart = now - window * 1000;

    // Get or create user record
    let record = rateLimitStore.get(userId);
    if (!record) {
      record = { timestamps: [] };
      rateLimitStore.set(userId, record);
    }

    // Filter out old timestamps outside the window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    const remaining = Math.max(0, limit - record.timestamps.length);
    const resetAt = new Date(
      record.timestamps.length > 0
        ? record.timestamps[0] + window * 1000
        : now + window * 1000
    );

    return {
      allowed: record.timestamps.length < limit,
      remaining,
      resetAt,
    };
  }

  /**
   * Record a new AI request for rate limiting
   */
  static async record(userId: string): Promise<void> {
    const now = Date.now();

    let record = rateLimitStore.get(userId);
    if (!record) {
      record = { timestamps: [] };
      rateLimitStore.set(userId, record);
    }

    record.timestamps.push(now);
  }

  /**
   * Clean up old rate limit records
   */
  static async cleanup(olderThanHours: number = 24): Promise<number> {
    const cutoff = Date.now() - olderThanHours * 60 * 60 * 1000;
    let cleanedCount = 0;

    // Convert to array to avoid iterator issues
    const entries = Array.from(rateLimitStore.entries());

    for (const [userId, record] of entries) {
      // Remove timestamps older than cutoff
      const originalLength = record.timestamps.length;
      record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

      // If no recent timestamps, remove the user record entirely
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(userId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Get current usage stats for a user
   */
  static async getUsageStats(
    userId: string,
    windowSeconds?: number
  ): Promise<{
    used: number;
    limit: number;
    percentage: number;
    resetAt: Date;
  }> {
    const window = windowSeconds || this.DEFAULT_WINDOW;
    const limit = this.DEFAULT_REQUESTS;
    const now = Date.now();
    const windowStart = now - window * 1000;

    const record = rateLimitStore.get(userId);
    if (!record) {
      return {
        used: 0,
        limit,
        percentage: 0,
        resetAt: new Date(now + window * 1000),
      };
    }

    const recentTimestamps = record.timestamps.filter((ts) => ts > windowStart);
    const used = recentTimestamps.length;

    return {
      used,
      limit,
      percentage: (used / limit) * 100,
      resetAt: new Date(
        recentTimestamps.length > 0
          ? recentTimestamps[0] + window * 1000
          : now + window * 1000
      ),
    };
  }

  /**
   * Reset rate limit for a user (admin action)
   */
  static async reset(userId: string): Promise<void> {
    rateLimitStore.delete(userId);
  }
}

// Run cleanup periodically (every hour)
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      AIRateLimiter.cleanup(24).catch(console.error);
    },
    60 * 60 * 1000
  ); // 1 hour
}