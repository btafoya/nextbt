# Cache-Busting Implementation

**Date**: 2025-10-02
**Status**: Complete
**Purpose**: Prevent browser caching to ensure users always load fresh builds after deployment

## Problem

After deploying new builds, users were seeing cached HTML/JavaScript/CSS, causing:
- Old UI with outdated features
- Stale API responses
- Potential bugs from version mismatches

## Solution: 4-Layer Cache-Busting Strategy

### 1. HTTP Headers - Next.js Configuration
**File**: `next.config.js`

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        { key: 'Pragma', value: 'no-cache' },
        { key: 'Expires', value: '0' },
      ],
    },
  ]
}
```

**Impact**: Prevents browser from caching HTML pages

### 2. Build Hash - Automatic Next.js Feature
**How it works**: Next.js automatically generates hash-based filenames for static assets during build:
- `_next/static/chunks/[hash].js`
- `_next/static/css/[hash].css`

**Impact**: New builds generate new filenames → browser fetches fresh assets

### 3. Version Detection - Client-Side Auto-Reload
**Files**:
- `lib/build-version.ts` - Server-side build ID generator
- `app/api/build-version/route.ts` - API endpoint for version checking
- `components/VersionChecker.tsx` - Client component with periodic version checks

**Flow**:
1. Build script generates unique `BUILD_ID` (Unix timestamp)
2. Server bakes `BUILD_ID` into bundle at build time
3. Client fetches initial version on page load
4. Client checks `/api/build-version` every 5 minutes
5. If version changed → show update prompt with "Reload Now" button

**Impact**: Users notified within 5 minutes of new deployment

### 4. Caddy Configuration - Proxy-Level Cache Control
**File**: `caddy/Caddyfile.example`

```caddy
header {
  # Prevent caching of HTML pages
  @html {
    path *.html /
  }
  Cache-Control "no-store, must-revalidate" @html
  Pragma "no-cache" @html
  Expires "0" @html

  # Allow caching for static assets (hash-based filenames)
  @static {
    path /_next/static/*
  }
  Cache-Control "public, max-age=31536000, immutable" @static
}
```

**Impact**:
- HTML never cached by proxy or browser
- Static assets cached aggressively (safe due to hash-based filenames)

## Deployment Process

### Build Script Enhancement
**File**: `scripts/fresh-build.sh`

```bash
export BUILD_ID=$(date +%s)
next build
```

**Impact**: Every build gets unique version identifier

### Production Deployment
1. **Build**: `pnpm build` (generates new BUILD_ID)
2. **Deploy**: Copy `.next` folder to production server
3. **Restart**: `systemctl restart nextbt`
4. **Users**: Within 5 minutes, see update prompt and reload for fresh build

### Caddy Deployment
1. **Update Caddyfile**: Copy `caddy/Caddyfile.example` to `/etc/caddy/Caddyfile`
2. **Reload**: `systemctl reload caddy`

## Testing

### Verify Cache Headers
```bash
curl -I https://www.example.com/
# Should see: Cache-Control: no-store, must-revalidate
```

### Verify Version Detection
```bash
curl https://www.example.com/api/build-version
# Returns: {"version":"1733126400"}
```

### Verify Auto-Reload
1. Deploy new build with different BUILD_ID
2. Wait 5 minutes (or refresh browser DevTools Network tab)
3. Should see update prompt in bottom-right corner
4. Click "Reload Now" → fresh page load

## Performance Considerations

### What's NOT Cached
- HTML pages (must revalidate every request)
- API responses (already configured via `staleTimes: 0`)

### What IS Cached
- Static assets in `_next/static/*` (safe, hash-based filenames)
- Images, fonts (should be CDN-optimized separately)

### Trade-offs
- ✅ **Pro**: Always fresh builds, no stale UI bugs
- ✅ **Pro**: User-friendly update prompts, not forced reloads
- ⚠️ **Con**: Slightly higher server load (HTML not cached)
- ⚠️ **Con**: 5-minute detection window (configurable in VersionChecker.tsx)

## Configuration Options

### Adjust Check Interval
**File**: `components/VersionChecker.tsx:23`

```typescript
const interval = setInterval(async () => {
  // ...
}, 5 * 60 * 1000); // Change this value (milliseconds)
```

**Options**:
- `1 * 60 * 1000` = 1 minute (more responsive, higher load)
- `10 * 60 * 1000` = 10 minutes (less responsive, lower load)
- `30 * 60 * 1000` = 30 minutes (minimal load, slow updates)

### Disable Auto-Reload Prompt
**File**: `app/layout.tsx:30`

```tsx
{/* <VersionChecker /> */}  // Comment out to disable
```

### Force Immediate Reload (No Prompt)
**File**: `components/VersionChecker.tsx:32-34`

```typescript
if (currentVersion && data.version !== currentVersion) {
  window.location.reload(); // Immediate reload, no prompt
}
```

## Monitoring

### Check Current Build Version
```bash
# Server-side (SSH to production)
grep -r "BUILD_VERSION" .next/server/

# Client-side (Browser DevTools Console)
fetch('/api/build-version').then(r => r.json()).then(console.log)
```

### Verify Version Changes After Deployment
```bash
# Before deploy
curl https://www.example.com/api/build-version
# {"version":"1733126400"}

# After deploy (new build)
curl https://www.example.com/api/build-version
# {"version":"1733130000"} ← Different version
```

## Troubleshooting

### Users Still Seeing Old Version
1. **Check Build ID Changed**: `curl /api/build-version` before/after deploy
2. **Verify Cache Headers**: `curl -I /` should show `no-store`
3. **Check Caddy Config**: Ensure Caddyfile updated and reloaded
4. **Force Hard Refresh**: Ctrl+Shift+R (Chrome/Firefox)

### Update Prompt Not Appearing
1. **Check Browser Console**: Errors in VersionChecker?
2. **Verify API Endpoint**: `curl /api/build-version` returns JSON?
3. **Check Interval**: Is check interval too long? (default 5 min)
4. **Verify Component Loaded**: Search DOM for VersionChecker element

### Build ID Not Changing
1. **Check Build Script**: `BUILD_ID` set before `next build`?
2. **Verify Environment Variable**: `echo $BUILD_ID` in build script
3. **Check Build Output**: Should see "Build ID: [timestamp]" in logs

## Related Files

- `next.config.js` - HTTP headers configuration
- `lib/build-version.ts` - Server-side version management
- `app/api/build-version/route.ts` - Version API endpoint
- `components/VersionChecker.tsx` - Client-side version checker
- `app/layout.tsx` - VersionChecker integration
- `scripts/fresh-build.sh` - Build ID generation
- `caddy/Caddyfile.example` - Proxy cache configuration

## References

- [Next.js Headers Configuration](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
- [HTTP Cache-Control Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [Caddy Header Directive](https://caddyserver.com/docs/caddyfile/directives/header)
