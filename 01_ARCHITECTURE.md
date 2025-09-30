# 01 — Architecture & Data Flow

## Goals
- Preserve MantisBT functionality (projects, categories, issues, notes, attachments, tags, custom fields, relationships, history) **but** present a **simplified** UI for non‑technical users.
- Operate **directly on the existing MantisBT schema**. No schema rename. Prefer **views** for “friendly” shapes.

## Stack
- **Next.js (App Router)** for UI & API routes
- **Tailwind** + TailAdmin theme
- **Prisma** for DB access to MySQL (MantisBT)
- **Iron Session** (cookie-based) auth using Mantis user table
- **WYSIWYG**: TipTap + inline AI (OpenRouter)
- **MCP Integration**: Claude Code remote server support with SSE transport
- **Testing**: Vitest + React Testing Library (40+ tests)
- **Notifications**: Postmark (email), Pushover, Rocket.Chat, Teams, Web Push

## Data Flow
1. **Auth**: User submits username/password → we verify against `mantis_user_table` password (Mantis stores hashed passwords). We rely on MantisBT's hash scheme (use its check function or re‑implement compatible verifier).
2. **Access**: All access derived from **project membership** (`mantis_project_user_list_table`) rather than Mantis roles. You can still read Mantis roles to seed defaults.
3. **Issues**: Basic columns from `mantis_bug_table` + text in `mantis_bug_text_table` + notes in `mantis_bugnote_table`/`mantis_bugnote_text_table`. Attachments from `mantis_bug_file_table` if used.
4. **Custom Fields**: Read from `mantis_custom_field_*` tables. We surface them as dynamic fields on an Issue Form section.
5. **Notifications**: When issue created/updated or note added, we determine **recipients by project access** and route via chosen channels.
6. **MCP Integration**: Claude Code can access MantisLite via MCP protocol for tools, resources, and system integration through authenticated API endpoints.

## Non-Destructive Strategy
- Use **Prisma introspect** to get types.
- Add **SQL views** under `/db/sql/views` for simplified read models (e.g., `v_issue_detail` joins).
- Writes always target the original Mantis tables (using mapped Prisma models).

## Key Tables (typical MantisBT 2.x)
- `mantis_user_table`
- `mantis_project_table`
- `mantis_project_user_list_table`
- `mantis_bug_table`
- `mantis_bug_text_table`
- `mantis_bugnote_table`
- `mantis_bugnote_text_table`
- `mantis_bug_history_table`
- `mantis_bug_file_table` (if attachments)
- `mantis_category_table` or `mantis_project_category_table`
- `mantis_tag_table`, `mantis_bug_tag_table`
- `mantis_custom_field_table`, `mantis_custom_field_string_table`
- `mantis_config_table`

> Table names may differ based on your install prefix; update mappings accordingly.
