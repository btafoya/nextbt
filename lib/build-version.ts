/**
 * Build Version Detection System
 * Generates a unique build ID based on build timestamp
 */

import "server-only";

// Generate build ID at build time (will be baked into the server bundle)
export const BUILD_VERSION = process.env.BUILD_ID || Date.now().toString();

// API endpoint will return this version for client-side comparison
export function getCurrentBuildVersion(): string {
  return BUILD_VERSION;
}
