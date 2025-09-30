// /lib/mcp/client.ts
import "server-only";
import { secrets } from "@/config/secrets";

/**
 * MCP Remote Server Client
 * Connects to Claude Code MCP remote server via SSE (Server-Sent Events)
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPCallToolRequest {
  name: string;
  arguments?: Record<string, any>;
}

export interface MCPCallToolResponse {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

/**
 * MCP Remote Client for Server-Sent Events (SSE) connections
 */
export class MCPRemoteClient {
  private baseUrl: string;
  private authKey: string;
  private enabled: boolean;

  constructor() {
    this.baseUrl = secrets.mcpRemoteUrl;
    this.authKey = secrets.mcpRemoteAuthKey;
    this.enabled = secrets.mcpRemoteEnabled;
  }

  /**
   * Check if MCP remote is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get authorization headers
   */
  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.authKey}`
    };
  }

  /**
   * List available tools from MCP server
   */
  async listTools(): Promise<MCPTool[]> {
    if (!this.enabled) {
      throw new Error("MCP remote is not enabled");
    }

    try {
      const response = await fetch(`${this.baseUrl}/tools/list`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`Failed to list tools: ${response.statusText}`);
      }

      const data = await response.json();
      return data.tools || [];
    } catch (error) {
      console.error("Error listing MCP tools:", error);
      throw error;
    }
  }

  /**
   * List available resources from MCP server
   */
  async listResources(): Promise<MCPResource[]> {
    if (!this.enabled) {
      throw new Error("MCP remote is not enabled");
    }

    try {
      const response = await fetch(`${this.baseUrl}/resources/list`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`Failed to list resources: ${response.statusText}`);
      }

      const data = await response.json();
      return data.resources || [];
    } catch (error) {
      console.error("Error listing MCP resources:", error);
      throw error;
    }
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(request: MCPCallToolRequest): Promise<MCPCallToolResponse> {
    if (!this.enabled) {
      throw new Error("MCP remote is not enabled");
    }

    try {
      const response = await fetch(`${this.baseUrl}/tools/call`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: request.name,
          arguments: request.arguments || {}
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to call tool: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error calling MCP tool ${request.name}:`, error);
      throw error;
    }
  }

  /**
   * Read a resource from the MCP server
   */
  async readResource(uri: string): Promise<string> {
    if (!this.enabled) {
      throw new Error("MCP remote is not enabled");
    }

    try {
      const response = await fetch(`${this.baseUrl}/resources/read`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ uri })
      });

      if (!response.ok) {
        throw new Error(`Failed to read resource: ${response.statusText}`);
      }

      const data = await response.json();
      return data.contents?.[0]?.text || "";
    } catch (error) {
      console.error(`Error reading MCP resource ${uri}:`, error);
      throw error;
    }
  }

  /**
   * Test connection to MCP server
   */
  async testConnection(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/ping`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({})
      });

      return response.ok;
    } catch (error) {
      console.error("Error testing MCP connection:", error);
      return false;
    }
  }
}

// Singleton instance
let mcpClient: MCPRemoteClient | null = null;

/**
 * Get singleton MCP client instance
 */
export function getMCPClient(): MCPRemoteClient {
  if (!mcpClient) {
    mcpClient = new MCPRemoteClient();
  }
  return mcpClient;
}