import "server-only";
import { secrets } from "@/config/secrets";

/**
 * Simple AI settings manager using secrets config
 * For future: Can be extended to support user-level overrides
 */
export class AISettingsManager {
  /**
   * Check if AI Writer is enabled
   */
  static isEnabled(): boolean {
    return secrets.aiWriterEnabled;
  }

  /**
   * Get the default model
   */
  static getDefaultModel(): string {
    return secrets.openrouterModel;
  }

  /**
   * Get rate limit settings
   */
  static getRateLimits(): {
    requests: number;
    windowSeconds: number;
  } {
    return {
      requests: secrets.aiRateLimitRequests,
      windowSeconds: secrets.aiRateLimitWindow,
    };
  }
}