export const dynamic = "force-dynamic";

// /app/api/openapi.json/route.ts
import { NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/api-docs';

/**
 * OpenAPI JSON Specification Endpoint
 *
 * Serves the complete OpenAPI 3.0 specification for the NextBT API.
 * This endpoint is consumed by the Swagger UI and can be used with
 * API testing tools like Postman, Insomnia, or automated testing frameworks.
 */
export async function GET() {
  return NextResponse.json(swaggerSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}