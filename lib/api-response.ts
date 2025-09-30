// /lib/api-response.ts
import { NextResponse } from "next/server";

/**
 * Cache-control headers for API responses to prevent caching
 */
const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

/**
 * Creates a NextResponse with no-cache headers
 */
export function apiResponse<T>(
  data: T,
  options?: {
    status?: number;
    headers?: Record<string, string>;
  }
): NextResponse<T> {
  return NextResponse.json(data, {
    status: options?.status,
    headers: {
      ...NO_CACHE_HEADERS,
      ...options?.headers,
    },
  });
}