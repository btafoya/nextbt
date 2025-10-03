# NextBT

A modern, user-friendly web interface for MantisBT 2.x bug tracking systems. NextBT provides a simplified, non-technical UI built with Next.js 14, connecting directly to your existing MantisBT MySQL database without requiring schema modifications.

![NextBT Screenshot](readme-assets/NextJS-Bug-Tracker.png)

[![Build and Test](https://github.com/btafoya/nextbt/actions/workflows/build-test.yml/badge.svg)](https://github.com/btafoya/nextbt/actions/workflows/build-test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎨 **Modern UI** - Clean, responsive interface built with Next.js 14 App Router and Tailwind CSS
- 📱 **Progressive Web App** - Installable to home screen (mobile/desktop), offline-ready static assets, app shortcuts, intelligent caching strategies
- 🎨 **Custom Branding** - Configurable site name and logo displayed on login and dashboard with Next.js Image optimization
- 🌓 **Dark Mode** - Full dark mode support with comprehensive theming across all pages and components
- 📝 **Rich Text Editor** - TipTap WYSIWYG editor with AI-powered writing assistance via OpenRouter
- 📄 **Markdown Rendering** - GitHub Flavored Markdown support with react-markdown, remark-gfm, and @tailwindcss/typography
- 🔔 **Advanced Notifications** - Multi-channel (Email, Push, Chat, Web Push), digest batching, history tracking, advanced filters, email audit logging
- 🔌 **MCP Integration** - Model Context Protocol support for Claude Code remote server integration
- 📚 **API Documentation** - Interactive OpenAPI 3.0 documentation with Swagger UI at `/api-docs`
- 🐛 **Error Tracking** - Sentry/GlitchTip integration for error monitoring, performance tracking, and session replay
- 🗃️ **Non-Destructive** - Reads/writes to existing MantisBT tables via Prisma ORM without schema changes
- ✅ **Comprehensive Testing** - 40+ unit tests (Vitest) + 47 accessibility tests (Playwright)
- ♿ **WCAG 2.1 AA Compliant** - Full accessibility testing with automated axe-core audits
- 🏆 **High Code Quality** - 8.8/10 overall score (security: 9.2/10, performance: 8.5/10)
- 🔐 **Secure Authentication** - AES-256-GCM encrypted session auth with iron-session using existing MantisBT user accounts
- 🔄 **Smart Redirects** - Automatic return URL handling after login with graceful session timeout handling
- 🛡️ **Session Protection** - Comprehensive middleware protection for all dashboard routes with automatic redirect on expiration

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **PWA**: next-pwa 5.6.0 with Workbox for service worker generation and intelligent caching
- **Styling**: Tailwind CSS + TailAdmin Dashboard Theme + @tailwindcss/typography
- **Theming**: Dark mode support with TailAdmin color system
- **Database**: Prisma ORM with MySQL (connects to existing MantisBT schema)
- **Editor**: TipTap with OpenRouter AI integration
- **Markdown**: react-markdown with remark-gfm (GitHub Flavored Markdown) and remark-breaks
- **Testing**: Vitest + React Testing Library + Playwright (E2E & Accessibility)
- **Accessibility**: axe-core + @axe-core/playwright for WCAG 2.1 AA compliance
- **Notifications**: Postmark, Pushover, Rocket.Chat, Microsoft Teams, Web Push
- **Error Tracking**: Sentry (@sentry/nextjs) with GlitchTip compatibility

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
- **23,300+ lines** of TypeScript code
- **200+ tests** (157+ unit test cases + 47 accessibility tests)
- **51 API endpoints** with OpenAPI 3.0 documentation
- **14 notification system modules** (email, push, web push, digest, history, filters)
- **Minimal technical debt** with abstracted logging system

See `claudedocs/CODE-ANALYSIS-REPORT.md` for complete analysis.

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/btafoya/nextbt.git
cd nextbt
pnpm install
```

### 2. Configure Application

Copy the example configuration files:

```bash
cp config/secrets.example.ts config/secrets.ts
cp public/logo.example.svg public/logo.svg
```

Edit `config/secrets.ts` with your MantisBT database credentials and branding:

```typescript
export const secrets = {
  databaseUrl: "mysql://user:password@localhost:3306/mantisbt",

  // Branding (customize these values)
  siteName: "Your Bug Tracker",  // Displayed on login page and sidebar
  siteLogo: "/logo.svg",          // Path to your custom logo

  // Sentry Error Tracking (optional, GlitchTip compatible)
  sentryDsn: "https://public_key@your-sentry-instance.com/project_id",
  sentryOrg: "your-org-slug",
  sentryProject: "your-project-slug",
  sentryAuthToken: "", // Set in CI/CD for source map upload

  // ... other settings
};
```

**Customize your logo**: Replace `public/logo.svg` with your own logo. The placeholder logo will not be committed to git.

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

## Progressive Web App (PWA)

NextBT is a full-featured Progressive Web App that can be installed on your device for a native app-like experience.

### Features

- 📱 **Install to Home Screen** - Works on mobile (iOS/Android) and desktop (Chrome/Edge/Safari)
- ⚡ **Fast Loading** - Intelligent caching strategies for optimal performance
- 📴 **Offline Access** - View previously loaded content without internet connection
- 🚀 **App-like Experience** - Runs in standalone mode without browser UI
- 🔔 **Push Notifications** - Receive issue updates via browser notifications
- ⚙️ **App Shortcuts** - Quick access to View Issues and Create Issue

### Installation

#### Desktop (Chrome/Edge/Safari)
1. Visit NextBT in your browser
2. Look for the install icon (⊕) in the address bar
3. Click "Install" or wait for the install prompt
4. The app opens in its own window

#### Mobile (Android)
1. Visit NextBT in Chrome or Edge
2. Tap "Add to Home Screen" prompt (appears after 5 seconds)
3. Or tap the three-dot menu → "Install app"
4. Icon appears on your home screen

#### Mobile (iOS/iPadOS)
1. Visit NextBT in Safari
2. Tap the Share button (square with arrow)
3. Scroll and tap "Add to Home Screen"
4. Tap "Add" to confirm

### PWA Architecture

**Service Worker**: Auto-generated with Workbox for intelligent caching
- **CacheFirst**: Google Fonts (365 days)
- **StaleWhileRevalidate**: Images (24h), JS (24h), CSS (24h), Fonts (7d)
- **NetworkFirst**: API responses (5min cache, 10s timeout)

**Security**: HTTPS required, session cookies not cached, 5-minute API cache expiration

**No Offline Editing**: Creating/editing issues requires an online connection (by design for data integrity)

For detailed PWA documentation, icon generation, and troubleshooting, see `claudedocs/PWA-IMPLEMENTATION-GUIDE.md`.

## Configuration

### Application Settings

Edit `config/app.config.ts` for application-level settings:

- MantisBT enum definitions (status, priority, severity, reproducibility)
- Session and authentication settings
- Feature flags and defaults

### Notification System

Configure notification channels in `config/secrets.ts`:

- **Email (Postmark)**: Email notifications with message stream support and delivery audit logging
- **Push (Pushover)**: Mobile push notifications for iOS/Android
- **Chat Integration**: Rocket.Chat and Microsoft Teams webhook support
- **Web Push**: Browser push notifications with VAPID keys (Chrome, Firefox, Edge)
- **Digest System**: Batch notifications for hourly/daily/weekly delivery
- **History Tracking**: Complete notification log for user visibility
- **Advanced Filters**: Category/priority/severity-based filtering with custom actions
- **Email Audit**: Comprehensive delivery tracking and troubleshooting

### AI Integration

Configure OpenRouter for AI-powered writing assistance:

```typescript
export const secrets = {
  // ...
  openRouterApiKey: "your-openrouter-api-key",
  openRouterModel: "anthropic/claude-3-sonnet"
};
```

### Error Tracking

Configure Sentry/GlitchTip for error monitoring and performance tracking:

```typescript
export const secrets = {
  // ...
  sentryDsn: "https://public_key@your-sentry-instance.com/project_id",
  sentryOrg: "your-org-slug",
  sentryProject: "your-project-slug",
  sentryAuthToken: "" // Optional: Set in CI/CD for source map upload
};
```

**Features**:
- Automatic error tracking (client, server, edge runtimes)
- User context tracking (set on login/logout)
- Performance monitoring with traces
- Session replay (10% sampling, 100% on errors)
- Custom tags for projects/issues
- Breadcrumb tracking for user actions

See `claudedocs/SENTRY-INTEGRATION.md` for complete setup guide.

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
│   ├── wysiwyg/             # TipTap editor components
│   └── PWAInstallPrompt.tsx # Custom PWA install prompt
├── config/                  # Configuration files
├── db/                      # Database client and utilities
├── e2e/                     # End-to-end tests
│   └── accessibility/       # WCAG 2.1 AA accessibility tests (47 tests)
├── lib/                     # Shared utilities
│   ├── auth.ts              # Authentication helpers
│   ├── session-config.ts    # iron-session configuration
│   ├── api-docs.ts          # OpenAPI specification
│   ├── mantis-enums.ts      # MantisBT enum helpers
│   ├── sentry-context.ts    # Sentry tagging and context utilities
│   ├── mcp/                 # MCP client library
│   ├── ai/                  # AI integration (OpenRouter)
│   └── notify/              # Notification system (14 modules)
│       ├── dispatch.ts      # Multi-channel routing
│       ├── postmark.ts      # Email notifications
│       ├── pushover.ts      # Push notifications
│       ├── rocketchat.ts    # Rocket.Chat integration
│       ├── teams.ts         # Microsoft Teams integration
│       ├── webpush.ts       # Web Push notifications
│       ├── digest.ts        # Digest batching system
│       ├── history.ts       # Notification history log
│       ├── filters.ts       # Advanced filtering
│       └── email-audit.ts   # Email delivery audit
├── prisma/                  # Prisma schema
├── public/                  # Static assets
│   ├── manifest.json        # PWA web app manifest
│   ├── icons/               # PWA icons (180x180, 192x192, 512x512)
│   └── sw.js                # Service worker (auto-generated)
├── scripts/                 # Utility scripts
│   └── accessibility-report.ts  # Automated accessibility audit reporting
├── __tests__/               # Unit and integration test suite (157+ test cases across 11 files)
│   ├── lib/mcp/             # MCP client tests
│   ├── app/api/mcp/         # MCP API integration tests
│   └── [additional test suites]
├── instrumentation.ts       # Server/Edge Sentry initialization
├── instrumentation.client.ts # Client-side Sentry initialization
├── sentry.server.config.ts  # Server Sentry configuration
├── sentry.edge.config.ts    # Edge runtime Sentry configuration
└── claudedocs/              # Comprehensive project documentation (21+ docs)
    ├── ACCESSIBILITY-TESTING-GUIDE.md
    ├── SENTRY-INTEGRATION.md
    ├── CODE-ANALYSIS-REPORT.md
    ├── SESSION-TIMEOUT-FIX.md
    ├── PWA-IMPLEMENTATION-GUIDE.md
    ├── NOTIFICATION-IMPLEMENTATION-COMPLETE.md
    ├── NOTIFICATION-FEATURES-IMPLEMENTATION.md
    ├── API-DOCUMENTATION-IMPLEMENTATION.md
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

- ✅ Run `pnpm build` to create optimized production build (PWA enabled automatically)
- ✅ Set `NODE_ENV=production` environment variable
- ✅ Configure production database credentials in `config/secrets.ts`
- ✅ Set up notification service credentials (Postmark, Pushover, etc.)
- ✅ Configure HTTPS/SSL (required for PWA service workers and production use)
- ✅ Generate PWA icons if not already present (see PWA section above)
- ✅ Set up process manager (PM2, systemd) for automatic restarts
- ✅ Configure reverse proxy (nginx, Apache) if needed
- ✅ Test PWA installation on target devices (mobile/desktop)

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
- **Markdown Support**: Full GitHub Flavored Markdown rendering in notes and descriptions (tables, task lists, code blocks)
- **Dark Mode**: Complete dark theme support for enhanced readability and reduced eye strain

## Testing

NextBT includes comprehensive testing at multiple levels:

### Unit & Integration Tests (Vitest)

```bash
pnpm test              # Run all unit tests
pnpm test:ui           # Run with interactive UI
pnpm test:coverage     # Generate coverage report
```

**Coverage (157+ test cases across 11 test files)**:
- MCP client functionality (17 test cases)
- API endpoints (issues, users, MCP integration) (24+ test cases)
- Authentication and session management
- Notification system modules (email, push, digest, filters)
- Issue management and CRUD operations
- Comprehensive integration tests

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
- **51 Endpoints**: Covering Authentication, Issues, Projects, Users, Notes, Categories, Files, History, Attachments, Profile, MCP, AI, and Debug
- **Try It Out**: Test API endpoints directly in the browser with authentication
- **Schema Definitions**: Complete request/response type documentation

### API Categories

- **Authentication** - Login, logout, session management
- **Issues** - Create, read, update, delete bug reports with full MantisBT field support
- **Projects** - Project management and access control
- **Users** - User management and assignments
- **Notes** - Bug comments and discussions
- **Categories** - Project categories
- **Files** - Attachment downloads and management
- **History** - Bug history tracking and user activity logs
- **Attachments** - File upload and download operations
- **Profile** - User profile management
- **MCP** - Model Context Protocol integration for Claude Code
- **AI** - AI writing assistance endpoints with OpenRouter
- **Debug** - Development debugging endpoints (session, memberships)

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
- PWA powered by [next-pwa](https://github.com/shadowwalker/next-pwa) and [Workbox](https://developer.chrome.com/docs/workbox/)
- UI based on [TailAdmin](https://github.com/TailAdmin/free-nextjs-admin-dashboard)
- Integrates with [MantisBT](https://mantisbt.org/)
- Rich text editing powered by [TipTap](https://tiptap.dev/)
- AI integration via [OpenRouter](https://openrouter.ai/)

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/btafoya/nextbt).

---

**Note**: NextBT is a third-party interface and is not officially affiliated with or endorsed by the MantisBT project.