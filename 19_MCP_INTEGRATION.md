# MCP Integration Guide

## Overview

NextBT supports integration with Claude Code MCP (Model Context Protocol) remote servers, enabling enhanced AI-powered features and tool integration.

## Configuration

### 1. Enable MCP Remote Server

Edit `/config/secrets.ts`:

```typescript
export const secrets = {
  // ... other config ...

  // MCP Remote Server (Claude Code)
  mcpRemoteEnabled: true,
  mcpRemoteUrl: "https://your-mcp-server.com/mcp",
  mcpRemoteAuthKey: "your-api-key-here"
} as const;
```

### 2. Configure MCP Server in .mcp.json

The project includes a `.mcp.json` configuration file with MCP remote server settings:

```json
{
  "mcpServers": {
    "nextbt-remote": {
      "type": "sse",
      "url": "${MCP_REMOTE_URL:-https://api.example.com/mcp}",
      "headers": {
        "Authorization": "Bearer ${MCP_REMOTE_AUTH_KEY}"
      },
      "disabled": true
    }
  }
}
```

To enable, set `"disabled": false` and configure environment variables:
- `MCP_REMOTE_URL` - Your MCP server endpoint
- `MCP_REMOTE_AUTH_KEY` - Authentication key/token

## MCP Client API

### Server-Side Client

Use the MCP client in server-side code:

```typescript
import { getMCPClient } from "@/lib/mcp/client";

// Get singleton client instance
const client = getMCPClient();

// Check if enabled
if (client.isEnabled()) {
  // List available tools
  const tools = await client.listTools();

  // Call a tool
  const result = await client.callTool({
    name: "example-tool",
    arguments: { param: "value" }
  });

  // List resources
  const resources = await client.listResources();

  // Read a resource
  const content = await client.readResource("resource://uri");

  // Test connection
  const connected = await client.testConnection();
}
```

## API Endpoints

### Check MCP Status

```
GET /api/mcp/status
```

Returns connection status and available tools/resources count.

**Response:**
```json
{
  "enabled": true,
  "connected": true,
  "tools": 5,
  "resources": 10
}
```

### List Available Tools

```
GET /api/mcp/tools
```

Returns list of available MCP tools.

**Response:**
```json
{
  "tools": [
    {
      "name": "tool-name",
      "description": "Tool description",
      "inputSchema": { ... }
    }
  ]
}
```

### Call an MCP Tool

```
POST /api/mcp/tools
```

**Request:**
```json
{
  "name": "tool-name",
  "arguments": {
    "param1": "value1"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Tool response"
    }
  ],
  "isError": false
}
```

### List Resources

```
GET /api/mcp/resources
```

Returns list of available MCP resources.

**Response:**
```json
{
  "resources": [
    {
      "uri": "resource://example",
      "name": "Resource Name",
      "description": "Resource description",
      "mimeType": "text/plain"
    }
  ]
}
```

### Read a Resource

```
POST /api/mcp/resources
```

**Request:**
```json
{
  "uri": "resource://example"
}
```

**Response:**
```json
{
  "content": "Resource content here"
}
```

## Security

- All MCP API endpoints require authentication (session required)
- API keys/tokens stored securely in `/config/secrets.ts` (gitignored)
- MCP server connections use Bearer token authentication
- MCP integration can be completely disabled via `mcpRemoteEnabled` flag

## Connection Types

NextBT supports SSE (Server-Sent Events) MCP remote servers:

- **SSE**: Long-lived HTTP connection for real-time updates
- Automatic reconnection on connection loss
- Supports authentication headers

## Environment Variables

For production deployments, use environment variables:

```bash
# MCP Configuration
export MCP_REMOTE_ENABLED=true
export MCP_REMOTE_URL=https://your-mcp-server.com/mcp
export MCP_REMOTE_AUTH_KEY=your-api-key-here
```

## Troubleshooting

### Connection Issues

1. Verify `mcpRemoteEnabled` is `true` in secrets config
2. Check MCP server URL is accessible
3. Validate authentication key is correct
4. Use `/api/mcp/status` endpoint to test connection

### Tool Execution Errors

1. Verify tool exists via `/api/mcp/tools` endpoint
2. Check tool input schema matches your arguments
3. Review server logs for detailed error messages
4. Ensure session authentication is valid

## Example Integration

```typescript
// In a server component or API route
import { getMCPClient } from "@/lib/mcp/client";

export async function processWithMCP(data: string) {
  const client = getMCPClient();

  if (!client.isEnabled()) {
    return { error: "MCP not enabled" };
  }

  try {
    // Call MCP tool for processing
    const result = await client.callTool({
      name: "process-data",
      arguments: { data }
    });

    return {
      success: true,
      result: result.content[0]?.text
    };
  } catch (error) {
    console.error("MCP processing error:", error);
    return { error: "Processing failed" };
  }
}
```

## References

- [Claude Code MCP Documentation](https://docs.claude.com/en/docs/claude-code/mcp)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)