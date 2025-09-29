# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Context (Read First)

- **Tech Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma ORM, MySQL
- **UI Framework**: [TailAdmin Free Next.js Admin Dashboard](https://github.com/TailAdmin/free-nextjs-admin-dashboard)
- **Core Purpose**: Simplified UI for existing MantisBT 2.x bug tracking system
- **Database Approach**: Read/write to existing MantisBT schema via Prisma (non-destructive, uses `@@map`/`@map`)
- **Key Integration**: TipTap WYSIWYG editor with AI assist (OpenRouter), multi-channel notifications (Postmark, Pushover, Rocket.Chat, Teams, Web Push)
- **Platform**: Web application interfacing with existing MantisBT MySQL database
- **DO NOT**: Modify MantisBT schema directly, rename existing database tables, create destructive migrations, use .env files (use `/config/*.ts` instead)

## Additional Documentation

Complete design documentation available:
- **15_UIUX_DESIGN.md** - UI/UX design system, layout specifications, component patterns
- **16_COMPONENT_LIBRARY.md** - Component specifications with TypeScript examples
- **17_ARCHITECTURE_DIAGRAMS.md** - System architecture diagrams and data flow visualizations
- **18_DEPLOYMENT_GUIDE.md** - Deployment options (Vercel, Docker, VPS), environment setup

## Development Commands

```bash
# Install dependencies
pnpm install

# Development server (http://localhost:3000)
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint

# Prisma operations (use DATABASE_URL env var temporarily for these commands)
DATABASE_URL="mysql://mantisbt:mantisbt@localhost:3306/mantisbt" pnpm dlx prisma db pull  # Introspect existing schema
pnpm dlx prisma generate  # Generate Prisma client
pnpm dlx prisma studio     # Open Prisma Studio GUI
```

## High-Level Architecture

### Configuration System (No .env Files)
- **Primary config**: `/config/secrets.ts` (copy from `secrets.example.ts`)
- **App config**: `/config/app.config.ts` - Application settings
- All secrets (database, API keys, notification services) defined in TypeScript config files
- Prisma requires `DATABASE_URL` environment variable only for CLI operations

### Database Layer (`/db/` and `/prisma/`)
- **Prisma Schema**: `prisma/schema.prisma` - Maps to existing MantisBT tables
- **Client**: `db/client.ts` - Singleton Prisma client with dev mode global caching
- **Key Pattern**: All Prisma models use `@@map` and `@map` to preserve original MantisBT table/column names
- **Non-Destructive**: Never run migrations that alter MantisBT schema; use SQL views/functions for compatibility layers

### Authentication & Sessions (`/lib/auth.ts`, `/middleware.ts`)
- **Session mechanism**: JSON cookie named "mantislite" with `{uid, username, projects[]}`
- **Middleware**: Protects dashboard routes, redirects unauthenticated users to login
- **Auth endpoints**: `/app/api/auth/login/route.ts` and `/app/api/auth/logout/route.ts`
- **Validation**: Uses MantisBT password hashing (`lib/mantis-crypto.ts`)

### Route Organization
- **`/app/(auth)/login/`**: Login page (outside dashboard layout)
- **`/app/(dash)/`**: Main dashboard layout with sidebar/header
  - `issues/` - Issue listing, creation, detail views
  - `projects/` - Project management (planned)
  - `search/` - Power search interface (planned)
  - `admin/` - Admin configuration (planned)
- **`/app/api/`**: API routes for CRUD operations
  - `issues/` - Issue CRUD
  - `issues/[id]/notes/` - Bug notes
  - `auth/` - Login/logout

### Key Components
- **`/components/wysiwyg/Editor.tsx`**: TipTap rich text editor integration
- **`/components/wysiwyg/InlineAI.tsx`**: AI assistant integration with OpenRouter
- TailAdmin components (layout, sidebar, header, cards) for dashboard UI

### Notification System (`/lib/notify/`)
- **Multi-channel**: Postmark (email), Pushover, Rocket.Chat, Microsoft Teams, Web Push
- **Dispatch**: `notify/dispatch.ts` routes notifications to configured channels
- **Project-based**: Notifications configured per project access, not user type

### AI Integration (`/lib/ai/`)
- **OpenRouter client**: `ai/openrouter.ts` for inline writing assistance
- **TipTap integration**: AI suggestions directly in WYSIWYG editor

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
const session = requireSession(); // Throws if not authenticated
const { uid, username, projects } = session;
```

### API Route Pattern
```typescript
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/db/client";

export async function GET() {
  try {
    const session = requireSession();
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
- Use MantisBT test accounts for development authentication
- Verify operations against existing MantisBT data (read-only initially)
- Test notification channels independently via `/lib/notify/*` modules

## Code Style
- TypeScript strict mode enabled
- Server-only utilities use `import "server-only"` directive
- Tailwind CSS for all styling (using TailAdmin design system)
- API routes follow Next.js 14 App Router conventions (`route.ts` files)