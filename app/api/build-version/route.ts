import { NextResponse } from "next/server";
import { getCurrentBuildVersion } from "@/lib/build-version";

/**
 * Build Version API Endpoint
 * Returns current server build version for client-side comparison
 */
export async function GET() {
  return NextResponse.json(
    { version: getCurrentBuildVersion() },
    {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    }
  );
}
