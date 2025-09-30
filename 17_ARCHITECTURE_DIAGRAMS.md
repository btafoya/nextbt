# 17 — Architecture Diagrams & Data Flow

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        NextBT System                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────┐         ┌──────────────────────────────┐
│   Client Browser    │         │   External Services          │
│                     │         │                              │
│  - React/Next.js UI │         │  - OpenRouter (AI)           │
│  - TipTap Editor    │         │  - Postmark (Email)          │
│  - Tailwind CSS     │         │  - Pushover (Push)           │
└──────────┬──────────┘         │  - Rocket.Chat (Webhook)     │
           │                    │  - MS Teams (Webhook)        │
           │ HTTPS              │  - Web Push (VAPID)          │
           │                    └─────────────┬────────────────┘
           ▼                                  │
┌─────────────────────────────────────────────┼────────────────┐
│         Next.js 14 Server (App Router)      │                │
│  ┌────────────────────────────────────────┐ │                │
│  │  Middleware (Auth Check)               │ │                │
│  └─────────────┬──────────────────────────┘ │                │
│                │                             │                │
│  ┌─────────────▼──────────────────────────┐ │                │
│  │  App Routes                            │ │                │
│  │  ┌──────────────┬──────────────────┐  │ │                │
│  │  │ (auth)       │ (dash)           │  │ │                │
│  │  │ - login      │ - dashboard      │  │ │                │
│  │  │ - logout     │ - issues         │  │ │                │
│  │  │              │ - projects       │  │ │                │
│  │  │              │ - search         │  │ │                │
│  │  └──────────────┴──────────────────┘  │ │                │
│  └────────────────────────────────────────┘ │                │
│                │                             │                │
│  ┌─────────────▼──────────────────────────┐ │                │
│  │  API Routes (/app/api)                 │ │                │
│  │  - /auth/login                         │ │                │
│  │  - /auth/logout                        │ │                │
│  │  - /issues (CRUD)                      │ │                │
│  │  - /issues/[id]/notes                  │ │                │
│  │  - /notifications/send                 │ │                │
│  └─────────────┬──────────────────────────┘ │                │
│                │                             │                │
│  ┌─────────────▼──────────────────────────┐ │                │
│  │  Business Logic Layer                  │ │                │
│  │  ┌──────────────────────────────────┐  │ │                │
│  │  │ /lib                             │  │ │                │
│  │  │ - auth.ts (session mgmt)         │  │ │                │
│  │  │ - mantis-crypto.ts (pwd verify)  │  │ │                │
│  │  │ - permissions.ts (access control)│  │ │                │
│  │  │ - /notify/* (multi-channel)      │◄─┼─┘                │
│  │  │ - /ai/openrouter.ts              │◄─────────────────┐  │
│  │  └──────────────────────────────────┘  │               │  │
│  └─────────────┬──────────────────────────┘               │  │
│                │                                           │  │
│  ┌─────────────▼──────────────────────────┐               │  │
│  │  Data Access Layer                     │               │  │
│  │  ┌──────────────────────────────────┐  │               │  │
│  │  │ Prisma Client                    │  │               │  │
│  │  │ - Generated models               │  │               │  │
│  │  │ - Type-safe queries              │  │               │  │
│  │  │ - @@map to MantisBT tables       │  │               │  │
│  │  └────────────┬─────────────────────┘  │               │  │
│  └───────────────┼────────────────────────┘               │  │
└──────────────────┼─────────────────────────────────────────┘  │
                   │                                             │
                   ▼                                             │
┌─────────────────────────────────────────────────────────┐     │
│              Existing MantisBT 2.x MySQL Database       │     │
│  ┌───────────────────────────────────────────────────┐  │     │
│  │  Core Tables                                      │  │     │
│  │  - mantis_user_table (auth)                      │  │     │
│  │  - mantis_project_table                          │  │     │
│  │  - mantis_project_user_list_table (access)      │  │     │
│  │  - mantis_bug_table (issues)                     │  │     │
│  │  - mantis_bug_text_table (descriptions)         │  │     │
│  │  - mantis_bugnote_table (comments)               │  │     │
│  │  - mantis_bugnote_text_table (comment text)     │  │     │
│  │  - mantis_bug_history_table (audit trail)       │  │     │
│  │  - mantis_bug_file_table (attachments)          │  │     │
│  │  - mantis_category_table                         │  │     │
│  │  - mantis_tag_table, mantis_bug_tag_table       │  │     │
│  │  - mantis_custom_field_* (custom fields)        │  │     │
│  └───────────────────────────────────────────────────┘  │     │
│                                                          │     │
│  ┌───────────────────────────────────────────────────┐  │     │
│  │  SQL Views (Compat Layer)                        │  │     │
│  │  - v_issue_detail (denormalized issue data)     │  │     │
│  │  - v_user_projects (user access mapping)        │  │     │
│  └───────────────────────────────────────────────────┘  │     │
└─────────────────────────────────────────────────────────┘     │
                                                                 │
Legend:                                                          │
────   Data flow                                                 │
◄───   Outbound API calls                                       │
```

## Authentication Flow

```
┌─────────────┐
│ User enters │
│ credentials │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ POST /api/auth/login                │
│ { username, password }              │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Prisma: Find user in                │
│ mantis_user_table                   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ lib/mantis-crypto.ts                │
│ Verify password hash                │
│ (MD5 or password_hash)              │
└──────┬──────────────────────────────┘
       │
       ├─── Invalid ──► Return 401
       │
       ▼ Valid
┌─────────────────────────────────────┐
│ Load user's project access from     │
│ mantis_project_user_list_table      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Create session cookie "nextbt"  │
│ {                                   │
│   uid: user.id,                     │
│   username: user.username,          │
│   projects: [1, 2, 5]               │
│ }                                   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Set HttpOnly, Secure cookie         │
│ Redirect to dashboard               │
└─────────────────────────────────────┘
```

## Issue Creation Flow

```
User fills form
/issues/new
       │
       ▼
┌─────────────────────────────────────┐
│ Form validation (client-side)       │
│ - Required fields                   │
│ - Field formats                     │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ POST /api/issues                    │
│ {                                   │
│   title, projectId, description,    │
│   status, priority, assigneeId      │
│ }                                   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Middleware: Check auth              │
│ requireSession()                    │
└──────┬──────────────────────────────┘
       │
       ├─── Not authed ──► 401
       │
       ▼
┌─────────────────────────────────────┐
│ Validate: User has access to        │
│ project (session.projects includes) │
└──────┬──────────────────────────────┘
       │
       ├─── No access ──► 403
       │
       ▼
┌─────────────────────────────────────┐
│ Transaction:                         │
│ 1. Create mantis_bug_text_table     │
│    record (description, steps, etc) │
│ 2. Create mantis_bug_table record   │
│    with bug_text_id                 │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ lib/notify/dispatch.ts              │
│ Determine recipients:                │
│ - Project members                   │
│ - Watching users                    │
│ - Assignee                          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Send notifications via:              │
│ - Postmark (email)                  │
│ - Pushover (mobile push)            │
│ - Rocket.Chat (webhook)             │
│ - MS Teams (webhook)                │
│ - Web Push (browser)                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Return issue ID                     │
│ Redirect to /issues/{id}            │
└─────────────────────────────────────┘
```

## Note/Comment Creation Flow

```
User adds comment
/issues/[id]
       │
       ▼
┌─────────────────────────────────────┐
│ TipTap Editor                       │
│ - Rich text formatting              │
│ - Optional AI assist                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ POST /api/issues/[id]/notes         │
│ { text, viewState }                 │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Verify: User has access to issue    │
│ (via project membership)            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Transaction:                         │
│ 1. Create mantis_bugnote_text_table │
│    record                           │
│ 2. Create mantis_bugnote_table      │
│    record with bugnote_text_id      │
│ 3. Update mantis_bug_table          │
│    last_updated timestamp           │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Dispatch notifications              │
│ - Issue watchers                    │
│ - Project members                   │
│ - @mentioned users (if supported)   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Return note data                    │
│ Optimistic UI update                │
└─────────────────────────────────────┘
```

## AI Assistant Integration Flow

```
User selects text in TipTap editor
Clicks AI button
       │
       ▼
┌─────────────────────────────────────┐
│ InlineAI Component                  │
│ - Quick actions menu                │
│ - Custom prompt input               │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ lib/ai/openrouter.ts                │
│ callOpenRouter(prompt, context)     │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ POST https://openrouter.ai/api/v1   │
│ Headers:                            │
│ - Authorization: Bearer {apiKey}    │
│ - HTTP-Referer: {appUrl}            │
│ Body:                               │
│ {                                   │
│   model: "gpt-4o-mini",            │
│   messages: [                       │
│     {role: "system", content: ...}, │
│     {role: "user", content: ...}    │
│   ]                                 │
│ }                                   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ OpenRouter processes request        │
│ Routes to selected model            │
│ Returns completion                  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Insert AI response into editor      │
│ at cursor position                  │
└─────────────────────────────────────┘
```

## Notification Dispatch Flow

```
Event occurs:
- Issue created
- Issue updated
- Note added
- Status changed
       │
       ▼
┌─────────────────────────────────────┐
│ lib/notify/dispatch.ts              │
│ dispatchNotification(event)         │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Determine recipients:                │
│ 1. Query mantis_project_user_list   │
│    for project members              │
│ 2. Query mantis_bug_monitor_table   │
│    for watchers                     │
│ 3. Include assignee if changed      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Load user notification preferences  │
│ from mantis_user_pref_table         │
│ - Email enabled?                    │
│ - Push enabled?                     │
│ - Severity filters                  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Parallel notification dispatch:      │
└──────┬──────────────────────────────┘
       │
       ├──► lib/notify/postmark.ts
       │    └─► Postmark API (email)
       │
       ├──► lib/notify/pushover.ts
       │    └─► Pushover API (mobile)
       │
       ├──► lib/notify/rocketchat.ts
       │    └─► Rocket.Chat webhook
       │
       ├──► lib/notify/teams.ts
       │    └─► MS Teams webhook
       │
       └──► Web Push API (browser)
```

## Data Model Relationships

```
┌──────────────────┐
│  mantis_user     │
│  - id            │
│  - username      │
│  - email         │
│  - password      │
└────────┬─────────┘
         │
         │ 1:N (membership)
         │
         ▼
┌─────────────────────────────┐
│ mantis_project_user_list    │
│ - project_id                │
│ - user_id                   │
│ - access_level              │
└────────┬────────────────────┘
         │
         │ N:1
         │
         ▼
┌──────────────────┐
│ mantis_project   │
│ - id             │
│ - name           │
│ - status         │
└────────┬─────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────┐          ┌──────────────────┐
│  mantis_bug      │  1:1     │ mantis_bug_text  │
│  - id            │◄─────────┤ - id             │
│  - project_id    │          │ - description    │
│  - reporter_id   │          │ - steps          │
│  - handler_id    │          │ - additional     │
│  - bug_text_id   │          └──────────────────┘
│  - status        │
│  - priority      │
└────────┬─────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────┐          ┌─────────────────────┐
│ mantis_bugnote   │  1:1     │ mantis_bugnote_text │
│ - id             │◄─────────┤ - id                │
│ - bug_id         │          │ - note              │
│ - reporter_id    │          └─────────────────────┘
│ - bugnote_text_id│
└────────┬─────────┘
         │
         │
┌────────┴─────────┐
│ mantis_bug_file  │
│ - id             │
│ - bug_id         │
│ - filename       │
│ - content        │
└──────────────────┘
```

## Session & Security Architecture

```
┌─────────────────────────────────────┐
│ Client Request                      │
│ Cookie: nextbt={session_data}   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Next.js Middleware                  │
│ /middleware.ts                      │
│                                     │
│ 1. Check cookie exists              │
│ 2. Parse session JSON               │
│ 3. Validate structure               │
└──────┬──────────────────────────────┘
       │
       ├─── Invalid ──► Redirect /login
       │
       ▼ Valid
┌─────────────────────────────────────┐
│ Route Handler                       │
│ (Page or API route)                 │
│                                     │
│ lib/auth.ts:                        │
│ - getSession() → SessionData        │
│ - requireSession() → throw if null  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Permission Check                    │
│ lib/permissions.ts                  │
│                                     │
│ - Verify user has project access    │
│ - Check operation permissions       │
│ - session.projects.includes(id)     │
└──────┬──────────────────────────────┘
       │
       ├─── No access ──► 403 Forbidden
       │
       ▼ Authorized
┌─────────────────────────────────────┐
│ Execute business logic              │
│ Return response                     │
└─────────────────────────────────────┘

Cookie Security:
- HttpOnly: true (prevents XSS)
- Secure: true (HTTPS only)
- SameSite: Lax (CSRF protection)
- Path: / (app-wide)
```

## Deployment Architecture

```
┌──────────────────────────────────────┐
│         CDN / Edge Network           │
│  (Static assets, images, fonts)      │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│      Next.js Application Server      │
│      (Vercel, Docker, Node.js)       │
│                                      │
│  - Server-side rendering             │
│  - API routes                        │
│  - Middleware                        │
│  - Static generation                 │
└──────────────┬───────────────────────┘
               │
               ├─────► External APIs
               │       - OpenRouter
               │       - Postmark
               │       - Pushover
               │       - Rocket.Chat
               │       - MS Teams
               │
               ▼
┌──────────────────────────────────────┐
│    Existing MantisBT MySQL Server    │
│    (Read/Write access)               │
│                                      │
│  Connection pooling via Prisma       │
│  Read-only views for performance     │
└──────────────────────────────────────┘
```