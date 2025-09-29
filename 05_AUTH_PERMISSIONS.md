# 05 — Auth & Project‑Access Permissions

## Auth
- Verify credentials against `mantis_user_table`.
- Mantis 2.x default hashing is **MD5 with salt** (older) or **password_hash** (newer plugins). Your install may vary.
- Implement `verifyMantisPassword(input, storedHash)` in `/lib/mantis-crypto.ts`. If you also run MantisPHP, you can expose a small HTTP endpoint there to verify; otherwise, port the hash logic.

## Session
- Use `iron-session` with a signed cookie. Store user `id`, `username`, and a list of `projectIds` joined via `mantis_project_user_list_table`.

## Authorization (Simplified)
- **Everything** is keyed off of *project access*:
  - Can view project → can view issues in it (except private notes if you decide to honor `view_state`).
  - Can comment → add notes.
  - Can edit assigned or own reported issues; allow admins (configurable) to edit all in project.
- A small policy layer in `/lib/permissions.ts` centralizes checks.
