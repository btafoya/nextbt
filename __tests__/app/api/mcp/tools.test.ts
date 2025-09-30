// __tests__/app/api/mcp/tools.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/mcp/tools/route';

// Mock auth module
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn()
}));

// Mock MCP client module
vi.mock('@/lib/mcp/client', () => ({
  getMCPClient: vi.fn()
}));

import { getSession } from '@/lib/auth';
import { getMCPClient } from '@/lib/mcp/client';

describe('/api/mcp/tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET - List Tools', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getSession).mockReturnValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return empty tools array when MCP is disabled', async () => {
      vi.mocked(getSession).mockReturnValue({
        uid: 1,
        username: 'testuser',
        projects: [1]
      });

      vi.mocked(getMCPClient).mockReturnValue({
        isEnabled: () => false
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.error).toBe('MCP remote is not enabled');
      expect(data.tools).toEqual([]);
    });

    it('should return tools list when MCP is enabled', async () => {
      const mockTools = [
        { name: 'tool1', description: 'Test tool 1', inputSchema: {} },
        { name: 'tool2', description: 'Test tool 2', inputSchema: {} }
      ];

      vi.mocked(getSession).mockReturnValue({
        uid: 1,
        username: 'testuser',
        projects: [1]
      });

      vi.mocked(getMCPClient).mockReturnValue({
        isEnabled: () => true,
        listTools: async () => mockTools
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tools).toEqual(mockTools);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(getSession).mockReturnValue({
        uid: 1,
        username: 'testuser',
        projects: [1]
      });

      vi.mocked(getMCPClient).mockReturnValue({
        isEnabled: () => true,
        listTools: async () => {
          throw new Error('MCP server error');
        }
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to list MCP tools');
      expect(data.tools).toEqual([]);
    });
  });

  describe('POST - Call Tool', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getSession).mockReturnValue(null);

      const req = new Request('http://localhost:3000/api/mcp/tools', {
        method: 'POST',
        body: JSON.stringify({ name: 'test-tool' })
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when MCP is disabled', async () => {
      vi.mocked(getSession).mockReturnValue({
        uid: 1,
        username: 'testuser',
        projects: [1]
      });

      vi.mocked(getMCPClient).mockReturnValue({
        isEnabled: () => false
      } as any);

      const req = new Request('http://localhost:3000/api/mcp/tools', {
        method: 'POST',
        body: JSON.stringify({ name: 'test-tool' })
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('MCP remote is not enabled');
    });

    it('should return 400 when tool name is missing', async () => {
      vi.mocked(getSession).mockReturnValue({
        uid: 1,
        username: 'testuser',
        projects: [1]
      });

      vi.mocked(getMCPClient).mockReturnValue({
        isEnabled: () => true
      } as any);

      const req = new Request('http://localhost:3000/api/mcp/tools', {
        method: 'POST',
        body: JSON.stringify({})
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Tool name is required');
    });

    it('should call tool and return result', async () => {
      const mockResult = {
        content: [{ type: 'text', text: 'Tool result' }],
        isError: false
      };

      vi.mocked(getSession).mockReturnValue({
        uid: 1,
        username: 'testuser',
        projects: [1]
      });

      vi.mocked(getMCPClient).mockReturnValue({
        isEnabled: () => true,
        callTool: async (request) => {
          expect(request.name).toBe('test-tool');
          expect(request.arguments).toEqual({ param: 'value' });
          return mockResult;
        }
      } as any);

      const req = new Request('http://localhost:3000/api/mcp/tools', {
        method: 'POST',
        body: JSON.stringify({
          name: 'test-tool',
          arguments: { param: 'value' }
        })
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockResult);
    });

    it('should handle tool call errors', async () => {
      vi.mocked(getSession).mockReturnValue({
        uid: 1,
        username: 'testuser',
        projects: [1]
      });

      vi.mocked(getMCPClient).mockReturnValue({
        isEnabled: () => true,
        callTool: async () => {
          throw new Error('Tool execution failed');
        }
      } as any);

      const req = new Request('http://localhost:3000/api/mcp/tools', {
        method: 'POST',
        body: JSON.stringify({ name: 'failing-tool' })
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to call MCP tool');
      expect(data.isError).toBe(true);
    });
  });
});