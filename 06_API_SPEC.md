# 06 — API Spec (App Router routes)

All routes under `/app/api/*`, JSON bodies, `iron-session` cookie required unless noted.

- `POST /api/auth/login` — { username, password }
- `POST /api/auth/logout`

- `GET /api/projects` — list projects current user can access
- `GET /api/projects/:id/members`

- `GET /api/issues` — query by project, status, search term, tag, assignee
- `POST /api/issues` — create (maps to `mantis_bug_table` + `mantis_bug_text_table`)
- `GET /api/issues/:id`
- `PATCH /api/issues/:id` — update fields
- `POST /api/issues/:id/notes` — add note (`mantis_bugnote_*`)
- `GET /api/issues/:id/history`

- `GET /api/custom-fields/:projectId` — list custom fields bound to project
- `GET /api/tags?search=...` — autocomplete

- `POST /api/notify/test` — send a test notification for the current user

## MCP Integration Endpoints

MCP (Model Context Protocol) endpoints for Claude Code remote server integration. All require authentication.

- `GET /api/mcp/tools` — List available MCP tools
  - **Response**: `{ tools: MCPTool[] }` or `{ error: string, tools: [] }`
  - Returns empty array if MCP is disabled

- `POST /api/mcp/tools` — Execute an MCP tool
  - **Request**: `{ name: string, arguments?: Record<string, any> }`
  - **Response**: `MCPCallToolResponse` with content and isError flag
  - **Errors**: 400 (missing tool name), 401 (unauthorized), 500 (execution failure)

- `GET /api/mcp/resources` — List available MCP resources
  - **Response**: `{ resources: MCPResource[] }` or `{ error: string, resources: [] }`
  - Returns empty array if MCP is disabled

- `POST /api/mcp/resources` — Read an MCP resource
  - **Request**: `{ uri: string }`
  - **Response**: `{ content: string }`
  - **Errors**: 400 (missing URI), 401 (unauthorized), 500 (read failure)

- `GET /api/mcp/status` — Check MCP connection status
  - **Response**: `{ enabled: boolean, connected: boolean, tools: number, resources: number }`
  - Returns health status and count of available tools/resources

See [19_MCP_INTEGRATION.md](./19_MCP_INTEGRATION.md) for detailed MCP configuration and usage.
