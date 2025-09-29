# 03 — Next.js App Structure & Routing

```
/app
  /(auth)
    login/page.tsx
    logout/route.ts
  /(dash)
    layout.tsx
    page.tsx    // dashboard home
    projects/
      page.tsx
      [projectId]/page.tsx
      [projectId]/members/page.tsx
    issues/
      page.tsx
      new/page.tsx
      [id]/page.tsx
      [id]/edit/page.tsx
      [id]/notes/page.tsx
    search/page.tsx
    admin/
      page.tsx
      notifications/page.tsx
/components
  /ui/*           // TailAdmin-derived components
  /wysiwyg/*      // TipTap + AI inline
  /forms/*        // Issue form, filters
/lib
  /auth.ts
  /db.ts
  /mantis-crypto.ts
  /permissions.ts // project-access-based
  /notify/
    postmark.ts
    pushover.ts
    rocketchat.ts
    teams.ts
    webpush.ts
  /ai/openrouter.ts
/db
  /client.ts
  /sql/views/*.sql
  /compat/README.md
/config
  /secrets.example.ts
  /secrets.ts      // (gitignored)
  /app.config.ts   // non-secret app toggles
```

**Routing Notes**
- We keep **API routes** under `/app/api/*` for auth, issues, notes, search, and notifications.
- Edge middleware enforces auth on `(dash)` group.
