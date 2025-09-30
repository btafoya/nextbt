export const dynamic = "force-dynamic";

// /app/api/mcp/status/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMCPClient } from "@/lib/mcp/client";
import { logger } from "@/lib/logger";

/**
 * Check MCP remote server status and test connection
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = getMCPClient();

    const status = {
      enabled: client.isEnabled(),
      connected: false,
      tools: 0,
      resources: 0
    };

    if (status.enabled) {
      // Test connection
      status.connected = await client.testConnection();

      if (status.connected) {
        // Get counts if connected
        try {
          const tools = await client.listTools();
          const resources = await client.listResources();
          status.tools = tools.length;
          status.resources = resources.length;
        } catch (error) {
          logger.error("Error getting MCP counts:", error);
        }
      }
    }

    return NextResponse.json(status);
  } catch (error) {
    logger.error("Error checking MCP status:", error);
    return NextResponse.json({
      enabled: false,
      connected: false,
      tools: 0,
      resources: 0,
      error: "Failed to check MCP status"
    }, { status: 500 });
  }
}