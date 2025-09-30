# Testing Guide

## Overview

NextBT uses Vitest as the testing framework with React Testing Library for component testing and comprehensive test coverage for the MCP integration.

## Test Structure

```
__tests__/
├── lib/
│   └── mcp/
│       └── client.test.ts         # MCP client unit tests
└── app/
    └── api/
        └── mcp/
            ├── tools.test.ts      # Tools API endpoint tests
            ├── resources.test.ts  # Resources API endpoint tests
            └── status.test.ts     # Status API endpoint tests
```

## Running Tests

### Basic Test Execution

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### Targeted Test Execution

```bash
# Run specific test file
pnpm test client.test.ts

# Run tests matching pattern
pnpm test mcp

# Run tests in specific directory
pnpm test __tests__/lib/mcp
```

## Test Configuration

### Vitest Configuration (`vitest.config.ts`)

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})
```

### Test Setup (`vitest.setup.ts`)

- Configures Testing Library
- Adds custom matchers
- Handles cleanup after each test

## MCP Integration Tests

### Unit Tests - MCP Client (`__tests__/lib/mcp/client.test.ts`)

Tests for the MCP client library covering:

**Connection Management**
- `isEnabled()` - Check if MCP is enabled
- `testConnection()` - Verify server connectivity
- Singleton instance pattern

**Tool Operations**
- `listTools()` - Fetch available tools
- `callTool()` - Execute tool with arguments
- Error handling and authentication

**Resource Operations**
- `listResources()` - List available resources
- `readResource()` - Read resource content
- URI validation

**Test Coverage**
- ✅ Enabled/disabled state handling
- ✅ Authentication headers
- ✅ Error handling and retries
- ✅ Response parsing
- ✅ Network failure scenarios

### Integration Tests - API Endpoints

#### Tools API (`__tests__/app/api/mcp/tools.test.ts`)

**GET /api/mcp/tools**
- Authentication validation
- MCP enabled/disabled handling
- Tools list retrieval
- Error handling

**POST /api/mcp/tools**
- Tool execution with arguments
- Request validation
- Response formatting
- Error scenarios

#### Resources API (`__tests__/app/api/mcp/resources.test.ts`)

**GET /api/mcp/resources**
- Resource listing
- Authentication checks
- MCP availability handling

**POST /api/mcp/resources**
- Resource reading by URI
- URI validation
- Content retrieval
- Error handling

#### Status API (`__tests__/app/api/mcp/status.test.ts`)

**GET /api/mcp/status**
- Connection status checking
- Tools and resources counting
- Enabled/disabled state
- Error handling

## Writing Tests

### Test Structure Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Component/Feature Name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Specific Functionality', () => {
    it('should describe expected behavior', async () => {
      // Arrange - Setup test data and mocks
      const mockData = { ... };
      vi.mocked(dependency).mockReturnValue(mockData);

      // Act - Execute the code under test
      const result = await functionUnderTest();

      // Assert - Verify expected outcomes
      expect(result).toBe(expected);
      expect(dependency).toHaveBeenCalledWith(...);
    });
  });
});
```

### Mocking Dependencies

**Mocking Modules**
```typescript
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn()
}));

import { getSession } from '@/lib/auth';
vi.mocked(getSession).mockReturnValue({ ... });
```

**Mocking Fetch**
```typescript
global.fetch = vi.fn();

(global.fetch as any).mockResolvedValueOnce({
  ok: true,
  json: async () => ({ data: 'value' })
});
```

### Testing API Routes

```typescript
import { GET, POST } from '@/app/api/route';

// Test GET endpoint
const response = await GET();
const data = await response.json();
expect(response.status).toBe(200);

// Test POST endpoint
const req = new Request('http://localhost/api', {
  method: 'POST',
  body: JSON.stringify({ ... })
});
const response = await POST(req);
```

## Coverage Goals

- **Unit Tests**: ≥80% coverage for client libraries
- **Integration Tests**: ≥70% coverage for API routes
- **Critical Paths**: 100% coverage for authentication and MCP core functionality

## Continuous Integration

### Pre-commit Checks
```bash
# Run before committing
pnpm test
pnpm lint
```

### CI/CD Pipeline
```yaml
- name: Run Tests
  run: pnpm test --coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## Best Practices

### DO
✅ Write tests for new features before implementation (TDD)
✅ Test both success and error scenarios
✅ Use descriptive test names that explain behavior
✅ Mock external dependencies (API calls, database)
✅ Clean up after each test (use `beforeEach`, `afterEach`)
✅ Test edge cases and boundary conditions
✅ Keep tests isolated and independent

### DON'T
❌ Test implementation details (test behavior, not internals)
❌ Share state between tests
❌ Make tests depend on execution order
❌ Test third-party library code
❌ Use real database or external services
❌ Write tests that depend on timing
❌ Ignore failing tests

## Troubleshooting

### Common Issues

**Import Resolution Errors**
```bash
# Ensure path aliases are configured in vitest.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './')
  }
}
```

**Module Mock Not Working**
```typescript
// Mock must be defined before imports
vi.mock('@/lib/module', () => ({ ... }));
import { function } from '@/lib/module'; // After mock
```

**Async Tests Timing Out**
```typescript
// Increase timeout for slow tests
it('slow test', async () => { ... }, 10000); // 10 second timeout
```

**Cleanup Issues**
```typescript
// Use afterEach to clean up
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
```

## References

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)