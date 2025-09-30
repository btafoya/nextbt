export const dynamic = "force-dynamic";

// /app/api/mcp/resources/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMCPClient } from "@/lib/mcp/client";
import { logger } from "@/lib/logger";

/**
 * List available MCP resources
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = getMCPClient();

    if (!client.isEnabled()) {
      return NextResponse.json({
        error: "MCP remote is not enabled",
        resources: []
      }, { status: 200 });
    }

    const resources = await client.listResources();
    return NextResponse.json({ resources });
  } catch (error) {
    logger.error("Error listing MCP resources:", error);
    return NextResponse.json({
      error: "Failed to list MCP resources",
      resources: []
    }, { status: 500 });
  }
}

/**
 * Read an MCP resource
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = getMCPClient();

    if (!client.isEnabled()) {
      return NextResponse.json({
        error: "MCP remote is not enabled"
      }, { status: 400 });
    }

    const body = await req.json();
    const { uri } = body;

    if (!uri) {
      return NextResponse.json({
        error: "Resource URI is required"
      }, { status: 400 });
    }

    const content = await client.readResource(uri);
    return NextResponse.json({ content });
  } catch (error) {
    logger.error("Error reading MCP resource:", error);
    return NextResponse.json({
      error: "Failed to read MCP resource"
    }, { status: 500 });
  }
}