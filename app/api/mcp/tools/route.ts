// /app/api/mcp/tools/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMCPClient } from "@/lib/mcp/client";

/**
 * List available MCP tools
 */
export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = getMCPClient();

    if (!client.isEnabled()) {
      return NextResponse.json({
        error: "MCP remote is not enabled",
        tools: []
      }, { status: 200 });
    }

    const tools = await client.listTools();
    return NextResponse.json({ tools });
  } catch (error) {
    console.error("Error listing MCP tools:", error);
    return NextResponse.json({
      error: "Failed to list MCP tools",
      tools: []
    }, { status: 500 });
  }
}

/**
 * Call an MCP tool
 */
export async function POST(req: Request) {
  const session = getSession();
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
    const { name, arguments: args } = body;

    if (!name) {
      return NextResponse.json({
        error: "Tool name is required"
      }, { status: 400 });
    }

    const result = await client.callTool({ name, arguments: args });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error calling MCP tool:", error);
    return NextResponse.json({
      error: "Failed to call MCP tool",
      isError: true
    }, { status: 500 });
  }
}