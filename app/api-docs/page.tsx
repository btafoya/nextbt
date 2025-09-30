// /app/api-docs/page.tsx
'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamic import to avoid SSR issues with SwaggerUI
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

/**
 * API Documentation Page
 *
 * Displays interactive Swagger UI documentation for all NextBT REST API endpoints.
 * Includes authentication flows, request/response schemas, and try-it-out functionality.
 */
export default function APIDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b bg-gray-50 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">NextBT API Documentation</h1>
        <p className="mt-1 text-sm text-gray-600">
          Interactive REST API documentation for MantisBT 2.x bug tracking system
        </p>
      </div>
      <SwaggerUI url="/api/openapi.json" />
    </div>
  );
}