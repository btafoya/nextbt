# NextBT

A modern, user-friendly web interface for MantisBT 2.x bug tracking systems. NextBT provides a simplified, non-technical UI built with Next.js 14, connecting directly to your existing MantisBT MySQL database without requiring schema modifications.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎨 **Modern UI** - Clean, responsive interface built with Next.js 14 App Router and Tailwind CSS
- 📝 **Rich Text Editor** - TipTap WYSIWYG editor with AI-powered writing assistance via OpenRouter
- 🔔 **Multi-Channel Notifications** - Email (Postmark), Push (Pushover), Chat (Rocket.Chat, Microsoft Teams), and Web Push
- 🔌 **MCP Integration** - Model Context Protocol support for Claude Code remote server integration
- 🗃️ **Non-Destructive** - Reads/writes to existing MantisBT tables via Prisma ORM without schema changes
- ✅ **Comprehensive Testing** - 40+ unit and integration tests with Vitest
- 🔐 **Secure Authentication** - Session-based auth using existing MantisBT user accounts

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + TailAdmin Dashboard Theme
- **Database**: Prisma ORM with MySQL (connects to existing MantisBT schema)
- **Editor**: TipTap with OpenRouter AI integration
- **Testing**: Vitest + React Testing Library
- **Notifications**: Postmark, Pushover, Rocket.Chat, Microsoft Teams, Web Push

## Prerequisites

- Node.js 18+ (pnpm recommended)
- Existing MantisBT 2.x MySQL database
- Access credentials for your MantisBT database

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/btafoya/nextbt.git
cd nextbt
pnpm install
```

### 2. Configure Database Connection

Copy the example secrets file and configure your database:

```bash
cp config/secrets.example.ts config/secrets.ts
```

Edit `config/secrets.ts` with your MantisBT database credentials:

```typescript
export const secrets = {
  databaseUrl: "mysql://user:password@localhost:3306/mantisbt",
  // ... other settings
};
```

### 3. Generate Prisma Client

The Prisma schema is already configured to map to MantisBT tables. Generate the client:

```bash
pnpm dlx prisma generate
```

### 4. Start Development Server

```bash
pnpm dev
```

Visit http://localhost:3000 and log in with your existing MantisBT credentials.

## Configuration

### Application Settings

Edit `config/app.config.ts` for application-level settings:

- MantisBT enum definitions (status, priority, severity, reproducibility)
- Session and authentication settings
- Feature flags and defaults

### Notification Services

Configure notification channels in `config/secrets.ts`:

- **Postmark**: Email notifications
- **Pushover**: Mobile push notifications
- **Rocket.Chat**: Team chat integration
- **Microsoft Teams**: Webhooks for team channels
- **Web Push**: Browser push notifications with VAPID keys

### AI Integration

Configure OpenRouter for AI-powered writing assistance:

```typescript
export const secrets = {
  // ...
  openRouterApiKey: "your-openrouter-api-key",
  openRouterModel: "anthropic/claude-3-sonnet"
};
```

## Project Structure

```
├── app/
│   ├── (auth)/              # Authentication pages (login/logout)
│   ├── (dash)/              # Dashboard layout and pages
│   │   ├── issues/          # Issue management (list, create, view, edit)
│   │   ├── projects/        # Project views
│   │   └── search/          # Power search interface
│   └── api/                 # API routes
│       ├── issues/          # Issue CRUD endpoints
│       ├── mcp/             # MCP integration endpoints
│       └── users/           # User management endpoints
├── components/              # React components
│   ├── issues/              # Issue-related components
│   └── wysiwyg/             # TipTap editor components
├── config/                  # Configuration files
├── db/                      # Database client and utilities
├── lib/                     # Shared utilities
│   ├── auth.ts              # Authentication helpers
│   ├── mantis-enums.ts      # MantisBT enum helpers
│   ├── mcp/                 # MCP client library
│   └── notify/              # Notification dispatchers
├── prisma/                  # Prisma schema
└── __tests__/               # Test suite
```

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test         # Run tests with Vitest
pnpm test:ui      # Run tests with UI
pnpm test:coverage # Generate coverage report
```

## Database Schema

NextBT connects to your existing MantisBT database without modifications. The Prisma schema uses `@@map` and `@map` directives to preserve original table and column names:

- `mantis_bug_table` - Issues/bugs
- `mantis_bug_text_table` - Issue descriptions and text content
- `mantis_bugnote_table` + `mantis_bugnote_text_table` - Comments
- `mantis_user_table` - User accounts
- `mantis_project_table` - Projects
- `mantis_project_user_list_table` - User-project access mapping

## Issue Management

NextBT provides comprehensive issue management with all MantisBT fields:

- **Status**: new, feedback, acknowledged, confirmed, assigned, resolved, closed
- **Priority**: none, low, normal, high, urgent, immediate
- **Severity**: feature, trivial, text, tweak, minor, major, crash, block
- **Reproducibility**: always, sometimes, random, have not tried, unable to reproduce, n/a
- **Assignee**: User assignment with project-based permissions

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
pnpm test

# Run with UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

Tests cover:
- MCP client functionality
- API endpoints (issues, users, MCP integration)
- Authentication and session management
- Notification dispatchers

## MCP Integration

NextBT includes Model Context Protocol (MCP) support for Claude Code integration:

- `GET /api/mcp/tools` - List available tools
- `POST /api/mcp/tools` - Execute a tool
- `GET /api/mcp/resources` - List available resources
- `POST /api/mcp/resources` - Read a resource
- `GET /api/mcp/status` - Check connection status

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2025 Brian Tafoya

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI based on [TailAdmin](https://github.com/TailAdmin/free-nextjs-admin-dashboard)
- Integrates with [MantisBT](https://mantisbt.org/)
- Rich text editing powered by [TipTap](https://tiptap.dev/)
- AI integration via [OpenRouter](https://openrouter.ai/)

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/btafoya/nextbt).

---

**Note**: NextBT is a third-party interface and is not officially affiliated with or endorsed by the MantisBT project.