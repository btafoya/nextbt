# NextBT

A modern, user-friendly web interface for MantisBT 2.x bug tracking systems. NextBT provides a simplified, non-technical UI built with Next.js 14, connecting directly to your existing MantisBT MySQL database without requiring schema modifications.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎨 **Modern UI** - Clean, responsive interface built with Next.js 14 App Router and Tailwind CSS
- 📝 **Rich Text Editor** - TipTap WYSIWYG editor with AI-powered writing assistance via OpenRouter
- 🔔 **Multi-Channel Notifications** - Email (Postmark), Push (Pushover), Chat (Rocket.Chat, Microsoft Teams), and Web Push
- 🔌 **MCP Integration** - Model Context Protocol support for Claude Code remote server integration
- 📚 **API Documentation** - Interactive OpenAPI 3.0 documentation with Swagger UI at `/api-docs`
- 🗃️ **Non-Destructive** - Reads/writes to existing MantisBT tables via Prisma ORM without schema changes
- ✅ **Comprehensive Testing** - 40+ unit tests (Vitest) + 47 accessibility tests (Playwright)
- ♿ **WCAG 2.1 AA Compliant** - Full accessibility testing with automated axe-core audits
- 🏆 **High Code Quality** - 8.8/10 overall score (security: 9.2/10, performance: 8.5/10)
- 🔐 **Secure Authentication** - Encrypted session-based auth with iron-session using existing MantisBT user accounts

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + TailAdmin Dashboard Theme
- **Database**: Prisma ORM with MySQL (connects to existing MantisBT schema)
- **Editor**: TipTap with OpenRouter AI integration
- **Testing**: Vitest + React Testing Library + Playwright (E2E & Accessibility)
- **Accessibility**: axe-core + @axe-core/playwright for WCAG 2.1 AA compliance
- **Notifications**: Postmark, Pushover, Rocket.Chat, Microsoft Teams, Web Push

## Prerequisites

- Node.js 18+ (pnpm recommended)
- Existing MantisBT 2.x MySQL database
- Access credentials for your MantisBT database

## Code Quality

NextBT maintains high code quality standards with comprehensive analysis:

**Overall Score**: 8.8/10 ⭐⭐⭐⭐

| Category | Score | Highlights |
|----------|-------|------------|
| Security | 9.2/10 | AES-256-GCM encryption, XSS prevention, Prisma ORM protection |
| Performance | 8.5/10 | Optimized React hooks, efficient database queries, singleton patterns |
| Architecture | 8.5/10 | Clean separation of concerns, RESTful API, modular design |
| Maintainability | 8.5/10 | TypeScript strict mode, 13,550 lines, minimal technical debt |
| Accessibility | 9.0/10 | WCAG 2.1 AA compliant, 47 automated tests, multi-browser validation |

**Key Metrics**:
- **13,550 lines** of TypeScript code
- **87+ tests** (40 unit + 47 accessibility)
- **26 API endpoints** with OpenAPI 3.0 documentation
- **Only 2 TODO comments** across entire codebase
- **Zero console.log** calls (abstracted logging system)

See `claudedocs/CODE-ANALYSIS-REPORT.md` for complete analysis.

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

### 5. View API Documentation

Interactive API documentation is available at http://localhost:3000/api-docs with Swagger UI for testing all endpoints.

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
│   ├── api/                 # REST API routes
│   │   ├── issues/          # Issue CRUD endpoints
│   │   ├── mcp/             # MCP integration endpoints
│   │   ├── users/           # User management endpoints
│   │   └── openapi.json/    # OpenAPI 3.0 specification endpoint
│   └── api-docs/            # Interactive Swagger UI documentation
├── components/              # React components
│   ├── issues/              # Issue-related components
│   └── wysiwyg/             # TipTap editor components
├── config/                  # Configuration files
├── db/                      # Database client and utilities
├── e2e/                     # End-to-end tests
│   └── accessibility/       # WCAG 2.1 AA accessibility tests (47 tests)
├── lib/                     # Shared utilities
│   ├── auth.ts              # Authentication helpers
│   ├── session-config.ts    # iron-session configuration
│   ├── api-docs.ts          # OpenAPI specification
│   ├── mantis-enums.ts      # MantisBT enum helpers
│   ├── mcp/                 # MCP client library
│   └── notify/              # Notification dispatchers
├── prisma/                  # Prisma schema
├── scripts/                 # Utility scripts
│   └── accessibility-report.ts  # Automated accessibility audit reporting
├── __tests__/               # Unit and integration test suite (40+ tests)
└── claudedocs/              # Comprehensive project documentation
    ├── ACCESSIBILITY-TESTING-GUIDE.md
    ├── CODE-ANALYSIS-REPORT.md
    └── [15+ additional design/architecture docs]
```

## Available Scripts

```bash
# Development
pnpm dev           # Start development server
pnpm build         # Build for production
pnpm start         # Start production server
pnpm lint          # Run ESLint

# Testing
pnpm test              # Run unit tests with Vitest
pnpm test:ui           # Run unit tests with UI
pnpm test:coverage     # Generate coverage report
pnpm test:a11y         # Run accessibility tests with Playwright
pnpm test:a11y:ui      # Run accessibility tests with Playwright UI
pnpm test:a11y:report  # Run accessibility tests and generate report
```

## Production Deployment

### Running with a Fixed Port

By default, Next.js runs on port 3000. To run in production with a specific port:

```bash
# Build the application
pnpm build

# Start with a fixed port (e.g., port 8080)
PORT=8080 pnpm start

# Or set the port inline
NODE_ENV=production PORT=8080 node .next/standalone/server.js
```

### Using a Custom Start Script

You can also create a custom start script in `package.json`:

```json
{
  "scripts": {
    "start:prod": "PORT=8080 next start"
  }
}
```

Then run:

```bash
pnpm start:prod
```

### Environment Variables for Production

For production deployments, ensure you set:

```bash
NODE_ENV=production
PORT=8080                    # Your desired port
DATABASE_URL="mysql://..."   # Production database connection
```

### Production Checklist

- ✅ Run `pnpm build` to create optimized production build
- ✅ Set `NODE_ENV=production` environment variable
- ✅ Configure production database credentials in `config/secrets.ts`
- ✅ Set up notification service credentials (Postmark, Pushover, etc.)
- ✅ Configure HTTPS/SSL (recommended for production)
- ✅ Set up process manager (PM2, systemd) for automatic restarts
- ✅ Configure reverse proxy (nginx, Apache) if needed

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

NextBT includes comprehensive testing at multiple levels:

### Unit & Integration Tests (Vitest)

```bash
pnpm test              # Run all unit tests
pnpm test:ui           # Run with interactive UI
pnpm test:coverage     # Generate coverage report
```

**Coverage (40+ tests)**:
- MCP client functionality
- API endpoints (issues, users, MCP integration)
- Authentication and session management
- Notification dispatchers

### Accessibility Tests (Playwright)

```bash
pnpm test:a11y         # Run 47 WCAG 2.1 AA tests
pnpm test:a11y:ui      # Run with Playwright UI
pnpm test:a11y:report  # Run tests and generate audit report
```

**WCAG 2.1 AA Coverage (47 tests)**:
- Authentication pages (15 tests): form labels, keyboard navigation, focus indicators
- Dashboard (15 tests): landmarks, responsive design, color contrast, ARIA compliance
- Issue management (17 tests): tables, WYSIWYG editor, file uploads, status badges

Tests run across multiple browsers:
- Desktop: Chrome, Firefox, Safari
- Mobile: Chrome (Pixel 5), Safari (iPhone 12)

**Automated Accessibility Audits**: Each test uses axe-core to detect WCAG violations including:
- Perceivable: Non-text content, info/relationships, color contrast
- Operable: Keyboard access, focus order, skip navigation
- Understandable: Language, labels, error identification
- Robust: Valid HTML, ARIA compliance, status messages

See `claudedocs/ACCESSIBILITY-TESTING-GUIDE.md` for complete testing documentation and `claudedocs/CODE-ANALYSIS-REPORT.md` for comprehensive code quality analysis.

## API Documentation

NextBT provides comprehensive REST API documentation with OpenAPI 3.0 and Swagger UI:

- **Interactive Documentation**: Visit `/api-docs` for Swagger UI interface
- **OpenAPI Spec**: JSON specification available at `/api/openapi.json`
- **26 Endpoints**: Covering Authentication, Issues, Projects, Users, Notes, Categories, Files, MCP, AI, and Profile
- **Try It Out**: Test API endpoints directly in the browser with authentication
- **Schema Definitions**: Complete request/response type documentation

### API Categories

- **Authentication** - Login, logout, session management
- **Issues** - Create, read, update, delete bug reports
- **Projects** - Project management and access control
- **Users** - User management and assignments
- **Notes** - Bug comments and discussions
- **Categories** - Project categories
- **Files** - Attachment downloads
- **MCP** - Model Context Protocol integration
- **AI** - AI writing assistance endpoints
- **Profile** - User profile management

## MCP Integration

NextBT includes Model Context Protocol (MCP) support for Claude Code integration:

- `GET /api/mcp/tools` - List available tools
- `POST /api/mcp/tools` - Execute a tool
- `GET /api/mcp/resources` - List available resources
- `POST /api/mcp/resources` - Read a resource
- `GET /api/mcp/status` - Check connection status

See `/api-docs` for detailed endpoint documentation.

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