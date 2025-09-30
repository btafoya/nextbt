// __tests__/app/api/mcp/status.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/mcp/status/route';

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

describe('/api/mcp/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    vi.mocked(getSession).mockReturnValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return disabled status when MCP is disabled', async () => {
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
    expect(data).toEqual({
      enabled: false,
      connected: false,
      tools: 0,
      resources: 0
    });
  });

  it('should test connection and return counts when enabled', async () => {
    const mockTools = [
      { name: 'tool1', description: 'Test 1', inputSchema: {} },
      { name: 'tool2', description: 'Test 2', inputSchema: {} }
    ];

    const mockResources = [
      { uri: 'resource://1', name: 'Resource 1' },
      { uri: 'resource://2', name: 'Resource 2' },
      { uri: 'resource://3', name: 'Resource 3' }
    ];

    vi.mocked(getSession).mockReturnValue({
      uid: 1,
      username: 'testuser',
      projects: [1]
    });

    vi.mocked(getMCPClient).mockReturnValue({
      isEnabled: () => true,
      testConnection: async () => true,
      listTools: async () => mockTools,
      listResources: async () => mockResources
    } as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      enabled: true,
      connected: true,
      tools: 2,
      resources: 3
    });
  });

  it('should handle connection failure', async () => {
    vi.mocked(getSession).mockReturnValue({
      uid: 1,
      username: 'testuser',
      projects: [1]
    });

    vi.mocked(getMCPClient).mockReturnValue({
      isEnabled: () => true,
      testConnection: async () => false
    } as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      enabled: true,
      connected: false,
      tools: 0,
      resources: 0
    });
  });

  it('should handle errors when getting counts', async () => {
    vi.mocked(getSession).mockReturnValue({
      uid: 1,
      username: 'testuser',
      projects: [1]
    });

    vi.mocked(getMCPClient).mockReturnValue({
      isEnabled: () => true,
      testConnection: async () => true,
      listTools: async () => {
        throw new Error('Failed to get tools');
      },
      listResources: async () => []
    } as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      enabled: true,
      connected: true,
      tools: 0,
      resources: 0
    });
  });

  it('should handle general errors', async () => {
    vi.mocked(getSession).mockReturnValue({
      uid: 1,
      username: 'testuser',
      projects: [1]
    });

    vi.mocked(getMCPClient).mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      enabled: false,
      connected: false,
      tools: 0,
      resources: 0,
      error: 'Failed to check MCP status'
    });
  });
});