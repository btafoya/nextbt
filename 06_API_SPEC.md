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
