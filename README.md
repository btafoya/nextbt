# MantisLite (Next.js + Tailwind + Prisma) — Build Pack for Claude Code

A simplified, non‑technical user–friendly interface for an existing **MantisBT 2.x** MySQL schema, built with:
- **Next.js 14/15 (App Router)** + **Tailwind CSS**
- **TailAdmin Free Next.js Admin Dashboard** theme
- **Prisma** (read/write using existing MantisBT tables via `@@map`/`@map`)
- **TipTap WYSIWYG** with inline **AI chat** powered by **OpenRouter**
- **MCP (Model Context Protocol)** integration with Claude Code remote server support
- **Comprehensive test suite** with Vitest (40+ tests covering MCP client and API endpoints)
- **Notifications** by project access (not user type): **Postmark**, **Pushover**, **Rocket.Chat**, **Microsoft Teams**, and **Web Push**
- No `.env` files by default — uses `/config/*.ts` per the user's preference (you *can* still set env vars if you want).

> **Important:** We point Prisma models to existing tables. We do **not** rename your schema, and we avoid destructive migrations. We include an **introspection step** and a **compatibility layer** (DB views & SQL functions) to smooth over MantisBT quirks.

---

## Quick Start (Claude Code Scriptable)

1) **Clone base** and install deps:
```bash
pnpm dlx create-next-app@latest mantislite --ts --eslint --src-dir --app --import-alias "@/*"
cd mantislite
pnpm add @prisma/client prisma mysql2 zod iron-session
pnpm add -D tailwindcss postcss autoprefixer @types/node @types/express
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder
pnpm add openrouter vapi web-push node-fetch postmark pushover-notifications
```

2) **Drop in TailAdmin** (free Next.js flavor):
- Copy their layout, sidebar, header, cards. Keep our pages under `/app/(dash)/*`.
- Replace colors with your brand as needed.

3) **Configure without .env**:
Edit `/config/secrets.example.ts` → copy to `/config/secrets.ts` and fill actual secrets.

4) **Prisma introspect your existing MantisBT DB** (non-destructive):
```bash
pnpm dlx prisma init --datasource-provider mysql
# Replace .env usage: delete .env, and point schema.prisma to "env(\"DATABASE_URL\")"
# then run introspection using a CLI URL (temporary), or run with env var just for the command:
DATABASE_URL="mysql://user:pass@host:3306/mantis" pnpm prisma db pull
pnpm prisma generate
```
After this, adjust models to add **friendly virtual views** in `sql/views/*.sql` and map a minimal **compat layer** (see `/db/compat/` notes).

5) **Run**:
```bash
pnpm dev
```

6) **Sign-in** (email‑less dev mode): use MantisBT users — we implement session auth against `mantis_user_table`.

---

## High‑Level Modules

- `/app/(auth)`: Login/Logout
- `/app/(dash)/projects/*`: Project listing, boards, filters
- `/app/(dash)/issues/*`: Create, view, edit (maps to `mantis_bug_table` + text/note tables)
- `/app/(dash)/search`: Power search (title, reporter, assignee, status)
- `/app/(dash)/admin`: Permissions, config, notification routing
- `/app/api/mcp/*`: MCP integration endpoints (tools, resources, status)
- `/components/wysiwyg/*`: TipTap + Inline AI Assist (OpenRouter) + Tool menu
- `/lib/mcp/*`: MCP client library for Claude Code remote server integration
- `/lib/notify/*`: Postmark, Pushover, Rocket.Chat, Teams, Web Push
- `/db/*`: Prisma client, SQL compat views, helpers
- `/__tests__/*`: Comprehensive test suite with Vitest (unit + integration tests)

See the other markdown files in this pack to scaffold the project.
