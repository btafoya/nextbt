# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Context (Read First)

- **Project Name**: NextBT (Next.js Bug Tracker for MantisBT)
- **Tech Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma ORM, MySQL
- **UI Framework**: [TailAdmin Free Next.js Admin Dashboard](https://github.com/TailAdmin/free-nextjs-admin-dashboard)
- **Progressive Web App**: Level 1 PWA with next-pwa 5.6.0, installable, offline-ready static assets, app shortcuts
- **Theming**: Full dark mode support with TailAdmin color system across all components
- **Markdown**: GitHub Flavored Markdown rendering with react-markdown, remark-gfm, remark-breaks, @tailwindcss/typography
- **Core Purpose**: Simplified UI for existing MantisBT 2.x bug tracking system
- **Database Approach**: Read/write to existing MantisBT schema via Prisma (non-destructive, uses `@@map`/`@map`)
- **Key Integration**: TipTap WYSIWYG editor with AI assist (OpenRouter), MCP (Model Context Protocol) for Claude Code, multi-channel notifications (Postmark, Pushover, Rocket.Chat, Teams, Web Push), Sentry error tracking (GlitchTip)
- **Platform**: Installable Progressive Web App interfacing with existing MantisBT MySQL database
- **DO NOT**: Modify MantisBT schema directly, rename existing database tables, create destructive migrations, use .env files (use `/config/*.ts` instead)

## Additional Documentation

Complete design documentation available:
- **15_UIUX_DESIGN.md** - UI/UX design system, layout specifications, component patterns
- **16_COMPONENT_LIBRARY.md** - Component specifications with TypeScript examples
- **17_ARCHITECTURE_DIAGRAMS.md** - System architecture diagrams and data flow visualizations
- **18_DEPLOYMENT_GUIDE.md** - Deployment options (Vercel, Docker, VPS), environment setup
- **19_MCP_INTEGRATION.md** - MCP (Model Context Protocol) integration guide for Claude Code
- **20_TESTING_GUIDE.md** - Comprehensive testing guide with Vitest (40+ tests)
- **claudedocs/ACCESSIBILITY-TESTING-GUIDE.md** - WCAG 2.1 AA accessibility testing with Playwright (47 tests)
- **claudedocs/CODE-ANALYSIS-REPORT.md** - Comprehensive code quality, security, and architecture analysis
- **claudedocs/NOTIFICATION-AUDIT-FIX.md** - Notification preference system audit and comprehensive fixes
- **claudedocs/NOTIFICATION-FEATURES-IMPLEMENTATION.md** - Advanced notification features (digest, web push, history, filters)
- **claudedocs/NOTIFICATION-IMPLEMENTATION-COMPLETE.md** - Complete notification system implementation summary
- **claudedocs/ROCKETCHAT-IMPLEMENTATION-PLAN.md** - Rocket.Chat REST API and webhook integration (Phase 5 complete)
- **claudedocs/ROCKETCHAT-REST-API-SETUP.md** - Rocket.Chat REST API setup and configuration guide
- **claudedocs/GESTURE-IMPLEMENTATION-SUMMARY.md** - Mobile swipe gesture implementation for sidebar navigation
- **claudedocs/GESTURE-QUICK-REFERENCE.md** - Quick reference guide for swipe gesture usage
- **claudedocs/CACHE-BUSTING-IMPLEMENTATION.md** - Comprehensive cache-busting system implementation
- **claudedocs/ISSUE-FORM-ENHANCEMENT-SPEC.md** - Category-based dynamic issue forms for non-technical users
- **claudedocs/API-DOCUMENTATION-IMPLEMENTATION.md** - OpenAPI 3.0 and Swagger UI implementation guide
- **claudedocs/email-audit-implementation.md** - Email delivery audit system implementation
- **claudedocs/bug-history-implementation.md** - Bug history tracking implementation
- **claudedocs/SENTRY-INTEGRATION.md** - Sentry/GlitchTip error tracking integration guide
- **claudedocs/SESSION-TIMEOUT-FIX.md** - Session timeout graceful handling implementation (2025-10-03)
- **claudedocs/PWA-IMPLEMENTATION-GUIDE.md** - Progressive Web App implementation with next-pwa, caching strategies, installation guide (2025-10-03)

## Development Commands

```bash
# Install dependencies
pnpm install

# Development server (http://localhost:3000)
pnpm dev

# Production build (clears cache first)
pnpm build

# Cached build (uses existing .next cache)
pnpm build:cached

# Start production server
pnpm start

# Linting
pnpm lint

# Testing
pnpm test              # Run all tests
pnpm test:ui           # Run tests with UI
pnpm test:coverage     # Run tests with coverage report

# Prisma operations (use DATABASE_URL env var temporarily for these commands)
DATABASE_URL="mysql://mantisbt:mantisbt@localhost:3306/mantisbt" pnpm dlx prisma db pull  # Introspect existing schema
pnpm dlx prisma generate  # Generate Prisma client
pnpm dlx prisma studio     # Open Prisma Studio GUI
```

## High-Level Architecture

### Configuration System (No .env Files)
- **Primary config**: `/config/secrets.ts` (copy from `secrets.example.ts`)
- **Public config**: `/config/public.ts` - Client-safe configuration (Turnstile, branding)
- **App config**: `/config/app.config.ts` - Application settings
- **Branding**: `siteName` and `siteLogo` configured in secrets.ts, exposed via public.ts
- All secrets (database, API keys, notification services, branding) defined in TypeScript config files
- Prisma requires `DATABASE_URL` environment variable only for CLI operations
- **Git Safety**: Custom logos (logo.svg, logo.png, favicon.ico) ignored, logo.example.svg committed as template

### Database Layer (`/db/` and `/prisma/`)
- **Prisma Schema**: `prisma/schema.prisma` - Maps to existing MantisBT tables
- **Client**: `db/client.ts` - Singleton Prisma client with dev mode global caching
- **Key Pattern**: All Prisma models use `@@map` and `@map` to preserve original MantisBT table/column names
- **Non-Destructive**: Never run migrations that alter MantisBT schema; use SQL views/functions for compatibility layers

### Authentication & Sessions (`/lib/auth.ts`, `/lib/session-config.ts`, `/middleware.ts`)
- **Session mechanism**: iron-session encrypted cookie with AES-256-GCM encryption
- **Session data**: `{uid, username, projects[], createdAt, lastActivity, expiresAt}`
- **Security**: 7-day expiration, 2-hour inactivity timeout, automatic refresh
- **Middleware**: Protects ALL dashboard routes (except `/login` and `/api/*`), validates sessions, redirects unauthenticated users to login with returnUrl parameter
- **Protected Routes**: All routes under `/(dash)/` including `/profile`, `/history`, `/projects`, `/issues`, `/users`
- **API Authentication**: API routes handle their own auth via `requireSession()` and return 401/403 status codes
- **Smart Redirects**: Login page captures returnUrl query parameter and redirects back after successful authentication
- **Graceful Timeout**: Session expiration automatically redirects to login with preservation of intended destination
- **Auth endpoints**: `/app/api/auth/login/route.ts` and `/app/api/auth/logout/route.ts`
- **Validation**: Uses MantisBT password hashing (`lib/mantis-crypto.ts`)
- **Important**: All auth functions are async (use `await requireSession()`, `await getSession()`)
- **Suspense Boundaries**: Login page wraps useSearchParams in Suspense for static rendering compatibility

### Route Organization
- **`/app/(auth)/login/`**: Login page (outside dashboard layout)
- **`/app/(dash)/`**: Main dashboard layout with sidebar/header
  - `issues/` - Issue listing, creation, detail views
  - `projects/` - Project management (planned)
  - `search/` - Power search interface (planned)
  - `admin/` - Admin configuration (planned)
- **`/app/api/`**: REST API routes for CRUD operations
  - `issues/` - Issue CRUD
  - `issues/[id]/notes/` - Bug notes
  - `auth/` - Login/logout
  - `mcp/` - MCP integration endpoints (tools, resources, status)
  - `openapi.json` - OpenAPI 3.0 specification
- **`/app/api-docs/`**: Interactive Swagger UI for API documentation

### Key Components
- **`/components/wysiwyg/Editor.tsx`**: TipTap rich text editor integration
- **`/components/wysiwyg/InlineAI.tsx`**: AI assistant integration with OpenRouter
- **`/components/issues/HtmlContent.tsx`**: Markdown renderer with react-markdown, remark-gfm support, and dark mode styling
- **`/components/ClientThemeWrapper.tsx`**: Dark mode theme management with localStorage persistence
- **`/components/layout/Sidebar.tsx`**: Dashboard sidebar with custom branding, mobile gestures (swipe to open/close)
- **`/app/(auth)/login/page.tsx`**: Login page with custom branding, Turnstile support, and return URL redirect handling
- **`/components/PWAInstallPrompt.tsx`**: Custom PWA install prompt with dismissal persistence
- **`/lib/hooks/useSwipe.ts`**: Custom React hooks for swipe gesture detection (useSwipe, useEdgeSwipe)
- **`/lib/cache-busting.ts`**: Build-time cache version management and invalidation
- **Notification Preferences UI** (`/app/(dash)/profile/notifications/page.tsx`):
  - **`/components/profile/NotificationPreferences.tsx`**: Email notification preferences with severity thresholds
  - **`/components/profile/DigestPreferences.tsx`**: Digest settings (frequency, time, channels)
  - **`/components/profile/WebPushManager.tsx`**: Web push subscription management
  - **`/components/profile/NotificationHistory.tsx`**: Paginated notification history viewer
  - **`/components/profile/NotificationFilters.tsx`**: Advanced filter management UI
- TailAdmin components (layout, sidebar, header, cards) for dashboard UI with comprehensive dark mode support

### Progressive Web App (`/public/manifest.json`, `next.config.js`)
- **PWA Level**: Level 1 (Basic PWA with lightweight approach)
- **Framework**: next-pwa 5.6.0 with Workbox for service worker generation
- **Installability**: Users can install to home screen (mobile/desktop) via custom prompt or browser UI
- **Offline Support**: Static assets (JS, CSS, images, fonts) cached for offline access
- **Caching Strategies**:
  - **CacheFirst**: Google Fonts (365 days)
  - **StaleWhileRevalidate**: Images (24h), JS (24h), CSS (24h), Fonts (7d)
  - **NetworkFirst**: API responses (5min cache, 10s timeout)
- **App Shortcuts**: View Issues, Create Issue (right-click/long-press app icon)
- **Service Worker**: Auto-generated at `/public/sw.js` (disabled in development)
- **Install Prompt**: Custom UI appears after 5 seconds, dismissible with localStorage persistence
- **Icons**: 8 sizes (72x72 to 512x512) required in `/public/icons/` directory
- **Manifest**: `/public/manifest.json` with NextBT branding, shortcuts, and PWA metadata
- **Meta Tags**: PWA-specific meta tags in `app/layout.tsx` for iOS/Android support
- **Security**: HTTPS required, service worker scoped to origin, short API cache (5min)
- **No Offline Editing**: Requires online connection for creating/editing issues (by design)
- **Documentation**: See `claudedocs/PWA-IMPLEMENTATION-GUIDE.md` for comprehensive guide

### Notification System (`/lib/notify/`)
- **Multi-channel**: Postmark (email), Pushover, Rocket.Chat, Microsoft Teams, Web Push
- **Preference System**: `preference-checker.ts` validates 9 event types + severity thresholds globally
- **Digest System**: `digest.ts` batches notifications for scheduled delivery (hourly/daily/weekly)
- **Web Push**: `webpush.ts` delivers browser push notifications via Web Push API with VAPID
- **History**: `history.ts` logs all notifications for user visibility and management
- **Advanced Filters**: `filters.ts` provides category/priority/severity-based filtering with actions (notify/ignore/digest_only)
- **Dispatch**: `dispatch.ts` routes notifications to configured channels
- **Project-based**: Notifications configured per project access, not user type
- **Rocket.Chat Integration**:
  - `rocketchat.ts` - Enhanced webhook sender with retry logic and REST API fallback
  - `rocketchat-formatter.ts` - Rich message formatting with attachments, colors, fields, emojis
  - `rocketchat-api.ts` - REST API client for message operations, user/channel lookup
  - `rocketchat-audit.ts` - Comprehensive audit reporting and statistics (9 functions)
  - Rich formatting: Severity-based colors, event-based emojis, clickable links, structured fields
  - Channel routing: Per-project channel mapping with default fallback
  - Retry logic: Configurable attempts (default 3) with exponential backoff
  - REST API features: Message IDs, message updates/deletes, user lookup, channel validation
  - Audit functions: Stats, health checks, message ID tracking, delivery method breakdown
  - Error handling: Comprehensive logging and graceful degradation
  - See `claudedocs/ROCKETCHAT-IMPLEMENTATION-PLAN.md` and `ROCKETCHAT-REST-API-SETUP.md`
- **Database Tables**:
  - `mantis_notification_queue_table` - Digest queuing
  - `mantis_webpush_subscription_table` - Web push subscriptions
  - `mantis_notification_history_table` - User notification log
  - `mantis_notification_filter_table` - Advanced filters
  - `mantis_digest_pref_table` - Digest preferences
  - `mantis_email_audit_table` - Delivery audit log

### MCP Integration (`/lib/mcp/`)
- **MCP Client**: `mcp/client.ts` - Claude Code remote server client
- **Protocol**: Server-Sent Events (SSE) transport with Bearer token authentication
- **API Endpoints**: `/app/api/mcp/*` for tools, resources, and status
- **Configuration**: `config/secrets.ts` with mcpRemoteEnabled, mcpRemoteUrl, mcpRemoteAuthKey

### AI Integration (`/lib/ai/`)
- **OpenRouter client**: `ai/openrouter.ts` for inline writing assistance
- **TipTap integration**: AI suggestions directly in WYSIWYG editor

### API Documentation (`/lib/api-docs.ts`, `/app/api-docs/`)
- **OpenAPI 3.0 Specification**: Complete API documentation with 26 endpoints
- **Interactive Swagger UI**: Available at `/api-docs` for testing and exploration
- **JSON Endpoint**: OpenAPI spec available at `/api/openapi.json`
- **Categories**: Authentication, Issues, Projects, Users, Notes, Categories, Files, MCP, AI, Profile
- **Schema Definitions**: Request/response types for all endpoints
- **Authentication**: iron-session cookie-based authentication documented

### MantisBT Schema Notes
- **Core tables**:
  - `mantis_bug_table` (issues) - Main issue/bug data
  - `mantis_bug_text_table` - Issue description, steps, additional info (LongText)
  - `mantis_bugnote_table` + `mantis_bugnote_text_table` - Comments/notes on issues
  - `mantis_user_table` - User accounts and authentication
  - `mantis_project_table` - Projects
  - `mantis_project_user_list_table` - User-project access mapping
- **Prisma mapping**: All models in `schema.prisma` preserve original table names via `@@map`
- **Field types**: MantisBT uses `Int` for timestamps (Unix epochs), `SmallInt` for status/priority enums

## Path Aliases
- `@/*` maps to project root - Use for all imports (e.g., `@/db/client`, `@/lib/auth`)

## Important Patterns

### Accessing Database
```typescript
import { prisma } from "@/db/client";
// Query existing MantisBT tables - DO NOT mutate schema
const bugs = await prisma.mantis_bug_table.findMany();
```

### Session Validation
```typescript
import { requireSession } from "@/lib/auth";
const session = await requireSession(); // Async - returns encrypted session data
const { uid, username, projects } = session;
```

### API Route Pattern
```typescript
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/db/client";

export async function GET() {
  try {
    const session = await requireSession(); // Always await session functions
    const data = await prisma.mantis_bug_table.findMany({
      where: { project_id: { in: session.projects } }
    });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "error message" }, { status: 500 });
  }
}
```

### Notification Dispatch
```typescript
import { dispatchNotification } from "@/lib/notify/dispatch";
await dispatchNotification({
  projectId: 1,
  event: "issue_created",
  title: "New Issue",
  body: "Issue description",
  link: "/issues/123"
});
```

## Testing Approach
- **Test Framework**: Vitest 3.2 with jsdom environment and React Testing Library
- **Test Suites**: 40+ tests covering unit and integration scenarios
  - `__tests__/lib/mcp/client.test.ts` - MCP client unit tests (17 tests)
  - `__tests__/app/api/mcp/*.test.ts` - MCP API integration tests (24 tests)
- **Coverage**: v8 provider with text, JSON, and HTML reports
- **Development**: Use MantisBT test accounts for authentication testing
- **Validation**: Verify operations against existing MantisBT data (read-only initially)
- **Notifications**: Test channels independently via `/lib/notify/*` modules
- See **20_TESTING_GUIDE.md** for comprehensive testing documentation

## Recent Improvements (October 2025)

### Notification Preferences UI (October 4, 2025) ✅
- **Complete UI Implementation**: 5-tab notification center with Email Preferences, Digest Settings, Push Notifications, History, and Filters
- **Digest Management**: Frequency selection (hourly/daily/weekly), time/day scheduling, channel selection, minimum notification threshold
- **Web Push**: Browser push subscription management with VAPID keys, active subscription listing, test notifications, unsubscribe functionality
- **Notification History**: Paginated viewer with event type icons, channel badges, read/unread status, mark as read, filter by channel
- **Advanced Filters**: Create/edit/delete filters, category/priority/severity criteria, action selection (notify/ignore/digest), test functionality, statistics
- **Comprehensive Testing**: Unit tests for all components, 12 E2E accessibility tests (WCAG 2.1 AA compliance)
- **Documentation**: Updated CLAUDE.md, README.md, TODO with implementation details
- See `/app/(dash)/profile/notifications/page.tsx` for complete implementation

## Recent Improvements (September-October 2025)

### Rocket.Chat Integration Enhancement (de089a3, cedd483, 1be5476)
- **REST API Client**: Full REST API integration with message operations, user/channel lookup
- **Rich Formatting**: Severity-based colors, event-based emojis, clickable links, structured fields via attachments
- **Enhanced Webhooks**: Retry logic with exponential backoff (default 3 attempts), REST API fallback
- **Channel Routing**: Per-project channel mapping with default fallback configuration
- **Audit System**: Comprehensive audit reporting with 9 functions (stats, health checks, message tracking, delivery methods)
- **Error Handling**: Graceful degradation with comprehensive logging
- See `claudedocs/ROCKETCHAT-IMPLEMENTATION-PLAN.md` and `ROCKETCHAT-REST-API-SETUP.md`

### Mobile Experience Improvements (5b3f08d, cab4460)
- **Swipe Gestures**: Custom React hooks for natural touch navigation (`useSwipe`, `useEdgeSwipe`)
- **Edge Swipe**: Swipe from left edge to open sidebar, swipe right to close
- **Content Swipe**: Swipe left/right on sidebar content for quick open/close
- **Responsive Navigation**: Mobile-optimized sidebar with hamburger menu and touch-friendly controls
- **Performance**: Passive event listeners, configurable thresholds, automatic cleanup
- See `claudedocs/GESTURE-IMPLEMENTATION-SUMMARY.md` and `GESTURE-QUICK-REFERENCE.md`

### Cache Busting System (4c4c044)
- **Build-Time Hashing**: Automatic cache version generation on each build
- **Static Asset Management**: CSS, JS, images, fonts cache invalidation
- **Service Worker Sync**: Coordinated cache clearing across browser and service worker
- **Developer Tools**: Cache management utilities and debugging endpoints
- See `claudedocs/CACHE-BUSTING-IMPLEMENTATION.md`

### Category-Based Dynamic Forms (0fcd94e)
- **Non-Technical UI**: Simplified issue submission with category-driven field visibility
- **Smart Field Management**: Context-aware form fields based on issue category selection
- **UX Enhancement**: Reduced cognitive load for non-technical users
- See `claudedocs/ISSUE-FORM-ENHANCEMENT-SPEC.md`

### Dark Mode Implementation (September 2025)
- Comprehensive dark mode styling across all pages and components
- Theme toggle in user profile with localStorage persistence
- Dark mode classes: `dark:bg-boxdark`, `dark:bg-meta-4`, `dark:text-bodydark`, `dark:border-strokedark`
- Consistent theming in forms, inputs, cards, tables, and navigation
- Proper contrast and readability in both light and dark themes

### Markdown Rendering (September 2025)
- Replaced `marked` library with `react-markdown` per Next.js best practices
- Added `remark-gfm` for GitHub Flavored Markdown (tables, strikethrough, task lists, autolinks)
- Added `remark-breaks` for automatic line break conversion (newlines → `<br>`)
- Integrated `@tailwindcss/typography` plugin for beautiful prose styling
- Dark mode support with `dark:prose-invert` for optimal readability
- Maintains image lightbox functionality and HTML sanitization
- Proper rendering in issue descriptions and bug notes

## Code Style
- TypeScript strict mode enabled
- Server-only utilities use `import "server-only"` directive
- Tailwind CSS for all styling (using TailAdmin design system with dark mode)
- API routes follow Next.js 14 App Router conventions (`route.ts` files)
- Markdown content rendered with react-markdown + remark plugins
- Dark mode classes applied consistently across all components