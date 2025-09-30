export const dynamic = "force-dynamic";

// /app/api/mcp/sse/route.ts - MCP Server-Sent Events endpoint
import { NextRequest } from "next/server";
import { NextBTMCPServer } from "@/lib/mcp/server";
import { logger } from "@/lib/logger";

/**
 * MCP SSE endpoint - exposes NextBT as an MCP server
 * Implements the MCP protocol over Server-Sent Events transport
 */
export async function GET(req: NextRequest) {
  // Validate Bearer token
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const token = authHeader.substring(7);
  if (!NextBTMCPServer.validateToken(token)) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const initMessage = {
        jsonrpc: "2.0",
        method: "notifications/initialized",
        params: {
          protocolVersion: "2024-11-05",
          serverInfo: {
            name: "nextbt-mcp-server",
            version: "1.0.0"
          },
          capabilities: {
            tools: {},
            resources: {}
          }
        }
      };

      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initMessage)}\n\n`));
      logger.info("[MCP SSE] Client connected");

      // Keep connection alive with ping every 30 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch (error) {
          logger.error("[MCP SSE] Error sending ping:", error);
          clearInterval(pingInterval);
        }
      }, 30000);

      // Handle cleanup
      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        controller.close();
        logger.info("[MCP SSE] Client disconnected");
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no" // Disable nginx buffering
    }
  });
}

/**
 * Handle MCP method calls via POST
 */
export async function POST(req: NextRequest) {
  // Validate Bearer token
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32600, message: "Unauthorized" },
      id: null
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const token = authHeader.substring(7);
  if (!NextBTMCPServer.validateToken(token)) {
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32600, message: "Unauthorized" },
      id: null
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await req.json();
    const { jsonrpc, method, params, id } = body;

    if (jsonrpc !== "2.0") {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32600, message: "Invalid JSON-RPC version" },
        id
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    logger.info(`[MCP] Method: ${method}`, params);

    // Handle MCP protocol methods
    switch (method) {
      case "initialize":
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          result: {
            protocolVersion: "2024-11-05",
            serverInfo: {
              name: "nextbt-mcp-server",
              version: "1.0.0"
            },
            capabilities: {
              tools: {},
              resources: {}
            }
          },
          id
        }), {
          headers: { "Content-Type": "application/json" }
        });

      case "tools/list":
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          result: {
            tools: NextBTMCPServer.getTools()
          },
          id
        }), {
          headers: { "Content-Type": "application/json" }
        });

      case "tools/call":
        const toolResult = await NextBTMCPServer.executeTool(
          params.name,
          params.arguments || {}
        );
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          result: {
            content: [{
              type: "text",
              text: JSON.stringify(toolResult, null, 2)
            }]
          },
          id
        }), {
          headers: { "Content-Type": "application/json" }
        });

      case "resources/list":
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          result: {
            resources: NextBTMCPServer.getResources()
          },
          id
        }), {
          headers: { "Content-Type": "application/json" }
        });

      case "resources/read":
        const resourceResult = await NextBTMCPServer.readResource(params.uri);
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          result: {
            contents: [{
              uri: params.uri,
              mimeType: "application/json",
              text: JSON.stringify(resourceResult, null, 2)
            }]
          },
          id
        }), {
          headers: { "Content-Type": "application/json" }
        });

      case "ping":
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          result: {},
          id
        }), {
          headers: { "Content-Type": "application/json" }
        });

      default:
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32601,
            message: `Method not found: ${method}`
          },
          id
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
    }
  } catch (error) {
    logger.error("[MCP] Error handling request:", error);
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : "Internal error"
      },
      id: null
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}