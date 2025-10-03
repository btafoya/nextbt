# Session Timeout Graceful Handling - Implementation

**Date**: 2025-10-03
**Status**: ✅ Implemented and Deployed
**Commit**: 9a2ae6a

## Problem Statement

When user sessions expired or timed out due to inactivity, accessing protected routes resulted in application errors instead of graceful redirects to the login page. This affected user experience and created confusion when users encountered error messages instead of being prompted to re-authenticate.

### Affected Routes
- `/profile` - User profile management
- `/history` - Bug history log (admin)
- `/projects` - Project listing and management
- `/issues` - Issue listing and detail views
- All other dashboard routes under `/(dash)/`

## Root Cause Analysis

### 1. Incomplete Middleware Protection

**File**: `middleware.ts:26`

**Issue**: Middleware only protected specific routes explicitly:
```typescript
const inDash = url.startsWith("/issues") || url.startsWith("/projects") || url === "/";
```

**Problem**: Routes like `/profile` and `/history` were not included in the protection logic, allowing them to bypass middleware session validation and fail at the component level.

### 2. Missing Client-Side Error Handling

**File**: `app/(dash)/profile/page.tsx:29`

**Issue**: Client-side fetch operations did not handle 401/403 responses:
```typescript
fetch("/api/profile", { cache: 'no-store' })
  .then(res => res.json())
  .catch(() => {
    setError("Failed to load profile");
  });
```

**Problem**: When API returned 401/403 due to expired session, the error was caught generically without triggering redirect to login.

### 3. Server-Side Error Throwing

**File**: `app/(dash)/history/page.tsx:12`

**Issue**: Server components using `requireAdmin()` or `requireSession()` would throw errors:
```typescript
await requireAdmin(); // Throws "Not authenticated" or "Admin access required"
```

**Problem**: Errors thrown in server components would result in error pages instead of redirects.

## Solution Implementation

### 1. Comprehensive Middleware Protection

**File**: `middleware.ts:25-28`

**Change**: Protect all routes except explicit public routes:
```typescript
// Before (incomplete)
const inDash = url.startsWith("/issues") || url.startsWith("/projects") || url === "/";

// After (comprehensive)
const isPublicRoute = url.startsWith("/login") || url.startsWith("/api/");
const inDash = !isPublicRoute;
```

**Rationale**:
- Inverted logic: instead of listing protected routes, list public routes
- Simpler and more maintainable
- Catches all dashboard routes by default
- API routes excluded because they handle auth internally via `requireSession()`

### 2. Enhanced Middleware Configuration

**File**: `middleware.ts:62-75`

**Change**: Updated matcher comments and config:
```typescript
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     * - login page
     * - all API routes (they handle their own auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|login|api/).*)",
  ],
};
```

**Rationale**:
- Clearer documentation of what's excluded
- Explicitly excludes all `/api/*` routes from middleware
- API routes handle their own authentication via `requireSession()`

### 3. Client-Side Auth Error Handling

**File**: `app/(dash)/profile/page.tsx:29-54`

**Change**: Added 401/403 response detection and redirect:
```typescript
fetch("/api/profile", { cache: 'no-store' })
  .then(res => {
    if (res.status === 401 || res.status === 403) {
      // Session expired - redirect to login
      const returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/login?returnUrl=${returnUrl}`;
      return null;
    }
    if (!res.ok) {
      throw new Error("Failed to fetch profile");
    }
    return res.json();
  })
  .then(data => {
    if (data) {
      setProfile(data);
      setRealname(data.realname || "");
      setEmail(data.email || "");
      setLoading(false);
    }
  })
```

**Rationale**:
- Explicitly checks for authentication errors (401/403)
- Redirects to login with returnUrl for seamless post-login navigation
- Prevents showing generic error messages for auth failures
- Preserves user's intended destination

## Session Flow After Fix

```
┌─────────────────────────────────────────────────────────────┐
│ User accesses protected route (e.g., /profile, /history)   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │ Middleware Validation │
          └───────────┬───────────┘
                      │
           ┌──────────┴──────────┐
           │                     │
    ┌──────▼──────┐      ┌──────▼───────┐
    │ Valid       │      │ Invalid or   │
    │ Session     │      │ Expired      │
    └──────┬──────┘      └──────┬───────┘
           │                     │
           │                     ▼
           │         ┌───────────────────────────────┐
           │         │ Redirect to:                  │
           │         │ /login?returnUrl=<original>   │
           │         └───────────┬───────────────────┘
           │                     │
           │                     ▼
           │         ┌───────────────────────┐
           │         │ User logs in          │
           │         └───────────┬───────────┘
           │                     │
           │         ┌───────────▼───────────────────┐
           │         │ Redirect to returnUrl         │
           │         │ (original destination)        │
           │         └───────────┬───────────────────┘
           │                     │
           └─────────────────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │ Access granted        │
          │ + Update activity     │
          └───────────────────────┘
```

## Protected Routes (Complete List)

### Now Protected by Middleware
- ✅ `/` - Dashboard home
- ✅ `/issues` - Issue listing
- ✅ `/issues/[id]` - Issue details
- ✅ `/issues/new` - Create issue
- ✅ `/issues/[id]/edit` - Edit issue
- ✅ `/projects` - Project listing
- ✅ `/projects/[id]` - Project details
- ✅ `/projects/new` - Create project
- ✅ `/projects/[id]/edit` - Edit project
- ✅ `/profile` - User profile (**FIXED**)
- ✅ `/profile/activity` - User activity log (**FIXED**)
- ✅ `/history` - Bug history log (admin) (**FIXED**)
- ✅ `/users` - User management (admin)
- ✅ `/users/[id]/edit` - Edit user
- ✅ `/users/new` - Create user
- ✅ `/users/[id]/delete` - Delete user

### Public Routes (No Auth Required)
- `/login` - Login page
- `/api/*` - All API routes (handle auth internally)
- `/_next/*` - Next.js static assets
- `/public/*` - Public static files
- `/favicon.ico`, `/logo.svg`, etc. - Static assets

## API Route Authentication

API routes continue to handle their own authentication via `requireSession()` or `requireAdmin()`:

**Pattern**:
```typescript
export async function GET() {
  try {
    const session = await requireSession(); // Throws if not authenticated
    // ... handle request
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: err instanceof Error && err.message.includes("authenticated") ? 401 : 500 }
    );
  }
}
```

**Why**: API routes may be accessed by external clients, scripts, or mobile apps that don't follow browser redirect semantics. They return proper HTTP status codes (401/403) for authentication failures.

## Testing Verification

### Manual Testing Steps

1. **Setup**:
   ```bash
   pnpm dev
   ```

2. **Test Session Timeout**:
   - Login to application
   - Open Browser DevTools → Application → Cookies
   - Delete the session cookie (`iron-session`)
   - Navigate to any protected route (e.g., `/profile`, `/history`)
   - **Expected**: Redirect to `/login?returnUrl=/profile`
   - Login with valid credentials
   - **Expected**: Redirect back to `/profile` (or original destination)

3. **Test API Error Handling**:
   - Login to application
   - Open DevTools → Network tab
   - Navigate to `/profile`
   - Delete session cookie mid-load
   - Refresh page
   - **Expected**: 401 response from `/api/profile`
   - **Expected**: Automatic redirect to login

4. **Test Inactivity Timeout**:
   - Login to application
   - Wait for inactivity timeout (2 hours - adjust `SESSION_CONFIG.INACTIVITY_TIMEOUT` in `lib/session-config.ts` to 1 minute for testing)
   - Navigate to any protected route
   - **Expected**: Session expired, redirect to login

### Automated Testing (Future)

Consider adding E2E tests with Playwright:

```typescript
test('session timeout redirects to login with returnUrl', async ({ page }) => {
  await page.goto('/login');
  await loginAsUser(page, 'testuser', 'password');

  // Clear session cookie
  await page.context().clearCookies();

  // Navigate to protected route
  await page.goto('/profile');

  // Should redirect to login with returnUrl
  await expect(page).toHaveURL('/login?returnUrl=%2Fprofile');

  // Login again
  await loginAsUser(page, 'testuser', 'password');

  // Should redirect back to profile
  await expect(page).toHaveURL('/profile');
});
```

## Session Configuration

**File**: `lib/session-config.ts`

**Key Settings**:
```typescript
export const SESSION_CONFIG = {
  // Session expires after 7 days
  SESSION_LIFETIME: 7 * 24 * 60 * 60 * 1000,

  // Inactivity timeout: 2 hours
  INACTIVITY_TIMEOUT: 2 * 60 * 60 * 1000,

  // Refresh if within 1 day of expiration
  REFRESH_THRESHOLD: 24 * 60 * 60 * 1000,

  // Admin access level (90 = administrator)
  ADMIN_ACCESS_LEVEL: 90,
};
```

**Session Data Structure**:
```typescript
interface SessionData {
  uid: number;                // User ID
  username: string;           // Username
  projects: number[];         // Accessible project IDs
  createdAt: number;          // Unix timestamp
  lastActivity: number;       // Unix timestamp
  expiresAt: number;          // Unix timestamp
  access_level: number;       // MantisBT access level
}
```

## Security Considerations

### 1. Cookie Security
- ✅ `httpOnly: true` - Prevents JavaScript access
- ✅ `secure: true` (production) - HTTPS only
- ✅ `sameSite: "lax"` - CSRF protection
- ✅ AES-256-GCM encryption via iron-session

### 2. Session Validation
- ✅ Expiration timestamp validation
- ✅ Inactivity timeout enforcement
- ✅ Automatic session refresh (within threshold)
- ✅ Activity timestamp updates on each request

### 3. Redirect Security
- ✅ returnUrl parameter properly encoded
- ✅ No open redirect vulnerability (all redirects are internal)
- ✅ Preserves original destination after authentication

## Performance Impact

### Minimal Overhead
- Middleware runs on every request (already present)
- Session validation is lightweight (cookie decryption + timestamp checks)
- No additional database queries added
- Client-side redirect is instant (no loading states needed)

### Caching Considerations
- API routes use `export const dynamic = "force-dynamic"` to prevent caching
- Session cookie is automatically included in all requests
- No impact on static assets or public routes

## Related Documentation

- **05_AUTH_PERMISSIONS.md** - Authentication and permission system overview
- **CLAUDE.md** - Authentication & Sessions section (lines 86-95)
- **lib/auth.ts** - Session management functions
- **lib/session-config.ts** - Session configuration and validation
- **middleware.ts** - Route protection implementation

## Future Enhancements

### Potential Improvements
1. **Session Refresh UI**: Show notification when session is about to expire
2. **Remember Me**: Optional extended session lifetime (30 days)
3. **Multi-Device Management**: Show active sessions, allow remote logout
4. **Session Activity Log**: Track login/logout events in user activity log
5. **Rate Limiting**: Prevent brute force login attempts
6. **Two-Factor Authentication**: Optional 2FA for sensitive accounts

### Accessibility
- Consider adding ARIA live region for session timeout warnings
- Screen reader announcements for session expiration
- Keyboard navigation for login form after redirect

## Changelog

### 2025-10-03 - Initial Implementation
- ✅ Expanded middleware protection to all dashboard routes
- ✅ Added 401/403 error handling in client-side profile page
- ✅ Updated middleware matcher configuration
- ✅ Tested and verified session timeout redirect flow
- ✅ Documentation created

---

**Implemented by**: Claude Code
**Reviewed by**: Brian Tafoya
**Deployed**: 2025-10-03
