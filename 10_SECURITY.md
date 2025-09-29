# 10 — Security & Privacy Checklist

- Session cookies: `Secure`, `HttpOnly`, `SameSite=Lax`
- Protect API routes with CSRF (for state‑changing POST/PATCH); at least ensure origin check
- Input validation with **zod**
- Escape all rendered user content; TipTap output sanitized (allow a safe subset)
- Rate‑limit login & note creation
- Never include costs/hours/estimates in **notifications** or **AI prompts** (enforce via a content filter utility)
