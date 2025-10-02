import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Sentry Test API Route
 *
 * This endpoint intentionally throws an error to test Sentry error tracking.
 * Visit: http://localhost:3818/api/sentry-test
 *
 * Expected behavior:
 * 1. Error is captured by Sentry
 * 2. Error appears in GlitchTip dashboard
 * 3. Stack trace includes source maps
 */
export function GET() {
  throw new Error("Sentry Example API Route Error - Server-Side Test");

  // This code is unreachable but required for type checking
  return NextResponse.json({ data: "Testing Sentry Error..." });
}
