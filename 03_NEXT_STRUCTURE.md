# 03 — Next.js App Structure & Routing

```
/app
  /(auth)
    login/page.tsx
    logout/route.ts
  /(dash)
    layout.tsx
    page.tsx    // dashboard home
    projects/
      page.tsx
      [projectId]/page.tsx
      [projectId]/members/page.tsx
    issues/
      page.tsx
      new/page.tsx
      [id]/page.tsx
      [id]/edit/page.tsx
      [id]/notes/page.tsx
    search/page.tsx
    admin/
      page.tsx
      notifications/page.tsx
  /api
    /auth/*         // login, logout
    /issues/*       // CRUD operations
    /mcp/*          // MCP integration endpoints
      /tools/route.ts
      /resources/route.ts
      /status/route.ts
/components
  /ui/*           // TailAdmin-derived components
  /wysiwyg/*      // TipTap + AI inline
  /forms/*        // Issue form, filters
/lib
  /auth.ts
  /db.ts
  /mantis-crypto.ts
  /permissions.ts // project-access-based
  /mcp/
    client.ts     // MCP remote client
  /notify/
    postmark.ts
    pushover.ts
    rocketchat.ts
    teams.ts
    webpush.ts
  /ai/openrouter.ts
/db
  /client.ts
  /sql/views/*.sql
  /compat/README.md
/config
  /secrets.example.ts
  /secrets.ts      // (gitignored)
  /app.config.ts   // non-secret app toggles
/__tests__
  /lib/mcp/*       // MCP client unit tests
  /app/api/mcp/*   // MCP API integration tests
```

**Routing Notes**
- We keep **API routes** under `/app/api/*` for auth, issues, notes, search, notifications, and MCP integration.
- MCP endpoints provide Claude Code integration for tools, resources, and status checks.
- Edge middleware enforces auth on `(dash)` group and all MCP API routes.

**Testing Infrastructure**
- **Vitest Configuration**: `vitest.config.ts` with jsdom environment and React plugin
- **Test Setup**: `vitest.setup.ts` with server-only module mocks and cleanup
- **Unit Tests**: `__tests__/lib/mcp/` for MCP client library (17 tests)
- **Integration Tests**: `__tests__/app/api/mcp/` for API endpoints (24 tests)
- **Coverage**: v8 provider with text, JSON, and HTML reports
