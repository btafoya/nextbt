// __tests__/app/api/mcp/resources.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/mcp/resources/route';

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

describe('/api/mcp/resources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET - List Resources', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getSession).mockReturnValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return empty resources array when MCP is disabled', async () => {
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
      expect(data.resources).toEqual([]);
    });

    it('should return resources list when MCP is enabled', async () => {
      const mockResources = [
        { uri: 'resource://test1', name: 'Test Resource 1', description: 'First test resource' },
        { uri: 'resource://test2', name: 'Test Resource 2', description: 'Second test resource' }
      ];

      vi.mocked(getSession).mockReturnValue({
        uid: 1,
        username: 'testuser',
        projects: [1]
      });

      vi.mocked(getMCPClient).mockReturnValue({
        isEnabled: () => true,
        listResources: async () => mockResources
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.resources).toEqual(mockResources);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(getSession).mockReturnValue({
        uid: 1,
        username: 'testuser',
        projects: [1]
      });

      vi.mocked(getMCPClient).mockReturnValue({
        isEnabled: () => true,
        listResources: async () => {
          throw new Error('MCP server error');
        }
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to list MCP resources');
      expect(data.resources).toEqual([]);
    });
  });

  describe('POST - Read Resource', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getSession).mockReturnValue(null);

      const req = new Request('http://localhost:3000/api/mcp/resources', {
        method: 'POST',
        body: JSON.stringify({ uri: 'resource://test' })
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

      const req = new Request('http://localhost:3000/api/mcp/resources', {
        method: 'POST',
        body: JSON.stringify({ uri: 'resource://test' })
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('MCP remote is not enabled');
    });

    it('should return 400 when URI is missing', async () => {
      vi.mocked(getSession).mockReturnValue({
        uid: 1,
        username: 'testuser',
        projects: [1]
      });

      vi.mocked(getMCPClient).mockReturnValue({
        isEnabled: () => true
      } as any);

      const req = new Request('http://localhost:3000/api/mcp/resources', {
        method: 'POST',
        body: JSON.stringify({})
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Resource URI is required');
    });

    it('should read resource and return content', async () => {
      const mockContent = 'This is the resource content';

      vi.mocked(getSession).mockReturnValue({
        uid: 1,
        username: 'testuser',
        projects: [1]
      });

      vi.mocked(getMCPClient).mockReturnValue({
        isEnabled: () => true,
        readResource: async (uri) => {
          expect(uri).toBe('resource://test-resource');
          return mockContent;
        }
      } as any);

      const req = new Request('http://localhost:3000/api/mcp/resources', {
        method: 'POST',
        body: JSON.stringify({ uri: 'resource://test-resource' })
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content).toBe(mockContent);
    });

    it('should handle resource read errors', async () => {
      vi.mocked(getSession).mockReturnValue({
        uid: 1,
        username: 'testuser',
        projects: [1]
      });

      vi.mocked(getMCPClient).mockReturnValue({
        isEnabled: () => true,
        readResource: async () => {
          throw new Error('Resource not found');
        }
      } as any);

      const req = new Request('http://localhost:3000/api/mcp/resources', {
        method: 'POST',
        body: JSON.stringify({ uri: 'resource://missing' })
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to read MCP resource');
    });
  });
});