# 11 — Claude Code Playbook

> Paste this into Claude and say “Generate the project now.”

1) **Create Next.js app** (see README quick start).
2) **Install deps** (as listed).
3) **Copy** files from this pack into the repo paths.
4) **Add TailAdmin** theme files and wire sidebar/topbar.
5) **Create `/config/secrets.ts` from example`**.
6) **Run Prisma introspection** against the existing Mantis DB and adjust the starter schema.
7) **Create SQL views** in `/db/sql/views` and ensure read access.
8) **Implement `/lib/mantis-crypto.ts`** to verify passwords.
9) **Build Auth pages** under `(auth)` and guard `(dash)` with middleware.
10) **Scaffold Issues CRUD**, Notes CRUD, Search, and Project list.
11) **Wire TipTap + Inline AI** components.
12) **Implement notifications** dispatcher + per-user prefs.
13) **Smoke test** with a seed project and demo users.
