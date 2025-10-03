# PWA Implementation Guide - NextBT

**Implementation Date**: 2025-10-03
**PWA Level**: Level 1 (Basic PWA with Lightweight Approach)
**Status**: ✅ Complete

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation & Configuration](#installation--configuration)
4. [Icon Generation Guide](#icon-generation-guide)
5. [User Installation Instructions](#user-installation-instructions)
6. [Features](#features)
7. [Caching Strategy](#caching-strategy)
8. [Testing](#testing)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)

---

## Overview

NextBT has been transformed into a **Progressive Web App (PWA)** that provides:
- ✅ **Installability**: Users can install NextBT to their home screen (mobile/desktop)
- ✅ **Offline Support**: Static assets cached for faster loading
- ✅ **App-like Experience**: Runs in standalone mode without browser UI
- ✅ **Fast Performance**: Intelligent caching strategies for optimal speed
- ✅ **Push Notifications**: Issue updates via existing web push infrastructure
- ❌ **No Offline Editing**: Requires online connection for creating/editing issues (by design)

### Implementation Level: Level 1 (Basic PWA)

**Why Level 1?**
- Bug tracking is primarily a **read-heavy** workflow (viewing issues, checking status)
- Most bug work requires **collaboration context** (comments, history, team visibility)
- Full offline editing adds **complexity with limited ROI** for this use case
- Aligns with existing architecture and **existing web push infrastructure**

### Key Design Decisions

**✅ What We Built:**
- Installable to home screen (mobile/desktop)
- Static asset caching (JS, CSS, images, fonts)
- API response caching (5-minute cache for GET requests)
- Install prompt after 5 seconds (dismissible with localStorage persistence)
- App shortcuts (View Issues, Create Issue)
- Full dark mode support in PWA

**❌ What We Intentionally Excluded:**
- Offline issue creation/editing (requires online connection)
- Background sync queue
- Conflict resolution for offline edits
- IndexedDB for local storage

---

## Architecture

### Tech Stack

- **Next.js 14**: App Router with React Server Components
- **next-pwa 5.6.0**: Zero-config PWA plugin powered by Workbox
- **Workbox**: Google's service worker library for caching strategies
- **Web Push API**: Browser push notifications (existing infrastructure)

### File Structure

```
nextbt/
├── app/
│   └── layout.tsx                      # PWA meta tags and install prompt
├── components/
│   └── PWAInstallPrompt.tsx            # Custom install UI component
├── public/
│   ├── manifest.json                   # Web app manifest
│   ├── icons/                          # PWA icons (to be generated)
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   ├── sw.js                           # Service worker (auto-generated)
│   └── workbox-*.js                    # Workbox runtime (auto-generated)
├── next.config.js                      # PWA configuration with Sentry
└── .gitignore                          # Excludes generated SW files
```

### Service Worker Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│  User Visits Site                                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Service Worker Registration                               │
│  - next-pwa auto-registers /sw.js                         │
│  - Happens on first visit (production only)               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Install Phase                                             │
│  - Precache critical assets (JS, CSS)                     │
│  - Setup runtime caching rules                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Activate Phase                                            │
│  - Service worker takes control                           │
│  - skipWaiting: true (immediate activation)               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Fetch Phase (Runtime)                                     │
│  - Intercepts network requests                            │
│  - Applies caching strategies per urlPattern              │
│  - Falls back to network when needed                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Installation & Configuration

### 1. Dependencies Installed

```bash
pnpm add next-pwa
```

### 2. Next.js Configuration (`next.config.js`)

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    // Google Fonts
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
        },
      },
    },
    // Font files
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    // Images
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    // JavaScript
    {
      urlPattern: /\.(?:js)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-js-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    // CSS
    {
      urlPattern: /\.(?:css|less)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-style-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    // API responses (GET only)
    {
      urlPattern: /\/api\/.*$/i,
      handler: 'NetworkFirst',
      method: 'GET',
      options: {
        cacheName: 'apis',
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

// Wrap existing Sentry config
module.exports = withPWA(withSentryConfig(nextConfig, sentryWebpackPluginOptions));
```

### 3. Web App Manifest (`public/manifest.json`)

```json
{
  "name": "NextBT - Bug Tracker",
  "short_name": "NextBT",
  "description": "Modern interface for MantisBT bug tracking system",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1c2434",
  "orientation": "portrait-primary",
  "icons": [...],
  "categories": ["productivity", "business", "utilities"],
  "shortcuts": [
    {
      "name": "View Issues",
      "url": "/issues"
    },
    {
      "name": "Create Issue",
      "url": "/issues/new"
    }
  ]
}
```

### 4. Root Layout Meta Tags (`app/layout.tsx`)

```typescript
export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: publicConfig.siteName,
  },
  // ... other metadata
};
```

### 5. .gitignore Updates

```gitignore
# PWA generated files (next-pwa)
public/sw.js
public/sw.js.map
public/workbox-*.js
public/workbox-*.js.map
public/worker-*.js
public/worker-*.js.map
public/fallback-*.js
public/fallback-*.js.map
```

---

## Icon Generation Guide

### Required Icon Sizes

NextBT's PWA requires the following icon sizes:

| Size | Purpose | Devices |
|------|---------|---------|
| 72x72 | Small icon | Older Android |
| 96x96 | Small icon | Chrome |
| 128x128 | Small icon | Chrome Web Store |
| 144x144 | Medium icon | Windows |
| 152x152 | Apple touch icon | iPad |
| 192x192 | Standard | Android, maskable |
| 384x384 | Large | Android |
| 512x512 | Extra large | Splash screens, maskable |

### Generation Steps

#### Option 1: Using PWA Asset Generator (Recommended)

```bash
# Install globally
npm install -g pwa-asset-generator

# Generate all icons from your logo
pwa-asset-generator public/logo.svg public/icons \
  --icon-only \
  --favicon \
  --opaque false \
  --padding "10%" \
  --background "#ffffff"
```

#### Option 2: Using ImageMagick

```bash
# Install ImageMagick
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# Create icons directory
mkdir -p public/icons

# Generate icons from SVG
for size in 72 96 128 144 152 192 384 512; do
  convert -background none -resize ${size}x${size} \
    public/logo.svg public/icons/icon-${size}x${size}.png
done
```

#### Option 3: Using Online Tool

1. Visit [PWA Icon Generator](https://www.pwabuilder.com/imageGenerator)
2. Upload `public/logo.svg`
3. Download generated icons
4. Extract to `public/icons/`

### Icon Requirements

✅ **Best Practices:**
- Use **PNG format** with transparency
- Ensure **square aspect ratio** (1:1)
- Add **10% padding** around the icon for safe area
- Use **solid colors** or **simple gradients** (avoid fine details at small sizes)
- Test **dark mode compatibility** (light icons on dark backgrounds)

❌ **Avoid:**
- JPG format (no transparency)
- Non-square images
- Text or details that become unreadable at small sizes
- High-contrast colors that don't work in both themes

### Verification

After generating icons:

```bash
# Verify all icons exist
ls -lh public/icons/

# Expected output:
# icon-72x72.png
# icon-96x96.png
# icon-128x128.png
# icon-144x144.png
# icon-152x152.png
# icon-192x192.png
# icon-384x384.png
# icon-512x512.png
```

---

## User Installation Instructions

### Desktop Installation

#### Chrome/Edge (Windows/Mac/Linux)

1. **Visit NextBT** in Chrome or Edge
2. **Look for install icon** in address bar (⊕ icon)
3. **Click "Install"** button
4. Or use **"Install app" prompt** that appears after 5 seconds
5. **NextBT opens in standalone window** (no browser UI)

**Alternative Method:**
1. Click **three-dot menu** (⋮) in browser
2. Select **"Install NextBT"** or **"Create shortcut"**
3. Check **"Open as window"** option
4. Click **"Install"**

#### Safari (macOS)

1. Visit NextBT in Safari
2. Click **Share button** (square with arrow)
3. Select **"Add to Dock"**
4. NextBT appears in Dock and Applications

### Mobile Installation

#### Android (Chrome/Edge)

1. **Visit NextBT** in Chrome or Edge
2. **Tap "Add to Home Screen" prompt** (appears after 5 seconds)
3. Or tap **three-dot menu** (⋮) → **"Add to Home screen"**
4. **Confirm installation**
5. **Icon appears on home screen**

**Launch:**
- Tap NextBT icon on home screen
- Opens in fullscreen mode (no browser UI)

#### iOS/iPadOS (Safari)

1. **Visit NextBT** in Safari
2. Tap **Share button** (square with arrow up)
3. Scroll down and tap **"Add to Home Screen"**
4. **Edit name** if desired
5. Tap **"Add"**

**Launch:**
- Tap NextBT icon on home screen
- Opens in fullscreen Safari view

### Uninstallation

#### Desktop

- **Chrome/Edge**: Right-click app icon → Uninstall
- **macOS**: Drag from Dock to Trash

#### Mobile

- **Android**: Long-press icon → Uninstall
- **iOS**: Long-press icon → Remove App

---

## Features

### 1. Install Prompt Component

**Location**: `components/PWAInstallPrompt.tsx`

**Features:**
- ✅ Appears 5 seconds after page load
- ✅ Dismissible with "Not Now" button
- ✅ Persistent dismissal via localStorage
- ✅ Respects browser's `beforeinstallprompt` event
- ✅ Dark mode compatible
- ✅ Mobile-responsive (full width on mobile, 384px on desktop)

**User Flow:**
```
Page Load → Wait 5s → Show Prompt
                      ├─ Install → Trigger browser install dialog
                      └─ Not Now → Save to localStorage, hide forever
```

### 2. App Shortcuts

Users can right-click the app icon (desktop) or long-press (mobile) to access:
- **View Issues**: Direct link to `/issues`
- **Create Issue**: Direct link to `/issues/new`

### 3. Offline Support

**What Works Offline:**
- ✅ Previously visited pages (cached HTML)
- ✅ Static assets (JS, CSS, images, fonts)
- ✅ Cached API responses (up to 5 minutes old)
- ✅ App shell and navigation

**What Requires Online:**
- ❌ Creating new issues
- ❌ Editing existing issues
- ❌ Posting comments
- ❌ Real-time data (notifications, updates)

### 4. Push Notifications

**Integration**: Uses existing web push infrastructure (`lib/notify/webpush.ts`)

**Notification Types:**
- Issue created
- Issue updated
- Issue assigned to you
- Comment added to watched issue
- Status changed
- Priority changed

**Configuration**: See `config/secrets.ts` for VAPID keys setup

---

## Caching Strategy

### Cache Storage Hierarchy

NextBT uses **Workbox caching strategies** optimized for each resource type:

#### 1. CacheFirst (Long-lived assets)

**Google Fonts** (365 days)
```javascript
urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i
cacheName: 'google-fonts'
maxEntries: 4
```

**Why?** Fonts rarely change, long cache reduces network requests.

#### 2. StaleWhileRevalidate (Frequently updated)

**Images** (24 hours, 64 entries)
```javascript
urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i
cacheName: 'static-image-assets'
```

**Fonts** (7 days, 4 entries)
```javascript
urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2)$/i
cacheName: 'static-font-assets'
```

**JavaScript** (24 hours, 32 entries)
```javascript
urlPattern: /\.(?:js)$/i
cacheName: 'static-js-assets'
```

**CSS** (24 hours, 32 entries)
```javascript
urlPattern: /\.(?:css|less)$/i
cacheName: 'static-style-assets'
```

**Why?** Serves cached version immediately, updates cache in background.

#### 3. NetworkFirst (Dynamic data)

**API Responses** (5 minutes, 16 entries)
```javascript
urlPattern: /\/api\/.*$/i
method: 'GET'
cacheName: 'apis'
networkTimeoutSeconds: 10
```

**Why?** Prioritizes fresh data, falls back to cache if network fails.

### Cache Limits

| Cache Name | Max Entries | Max Age |
|------------|-------------|---------|
| google-fonts | 4 | 365 days |
| static-font-assets | 4 | 7 days |
| static-image-assets | 64 | 24 hours |
| static-js-assets | 32 | 24 hours |
| static-style-assets | 32 | 24 hours |
| apis | 16 | 5 minutes |

### Cache Inspection

**Chrome DevTools:**
1. Open DevTools (F12)
2. Go to **Application** tab
3. Expand **Cache Storage** in sidebar
4. View cached resources by cache name

**Clear Cache:**
```javascript
// In browser console
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

---

## Testing

### Manual Testing Checklist

#### Installation Testing

- [ ] **Desktop Chrome**: Install button appears in address bar
- [ ] **Desktop Edge**: Install prompt after 5 seconds
- [ ] **Android Chrome**: Add to Home Screen prompt appears
- [ ] **iOS Safari**: Add to Home Screen via Share button
- [ ] **Dismissal**: "Not Now" button hides prompt permanently
- [ ] **Reinstall**: Clearing localStorage shows prompt again

#### Offline Testing

1. **Load site while online**
2. **Open DevTools** → **Application** → **Service Workers**
3. **Check "Offline" checkbox**
4. **Navigate** to previously visited pages
5. **Verify**:
   - [ ] Static pages load from cache
   - [ ] Images display correctly
   - [ ] CSS/JS work properly
   - [ ] API requests fail gracefully (show offline message)

#### Caching Testing

1. **Load issue list** (`/issues`)
2. **Open DevTools** → **Network** tab
3. **Reload page**
4. **Verify**:
   - [ ] Static assets served from service worker
   - [ ] API responses cached (check `from disk cache`)
   - [ ] Images load instantly (cached)

#### Push Notification Testing

1. **Enable notifications** in profile
2. **Create test issue** (different user)
3. **Verify**:
   - [ ] Browser notification appears
   - [ ] Notification includes issue title
   - [ ] Clicking opens issue detail page

### Automated Testing

```bash
# Run Lighthouse PWA audit
npx lighthouse https://your-nextbt-domain.com --view \
  --only-categories=pwa \
  --chrome-flags="--headless"

# Expected scores:
# - Installable: ✅ Pass
# - PWA Optimized: ✅ Pass
# - Service Worker: ✅ Registered
# - Manifest: ✅ Valid
```

### Browser Compatibility

| Browser | Installation | Service Worker | Push Notifications |
|---------|--------------|----------------|--------------------|
| Chrome (Desktop) | ✅ Full | ✅ Full | ✅ Full |
| Edge (Desktop) | ✅ Full | ✅ Full | ✅ Full |
| Firefox (Desktop) | ⚠️ Partial | ✅ Full | ✅ Full |
| Safari (macOS) | ✅ Add to Dock | ✅ Full | ⚠️ Limited |
| Chrome (Android) | ✅ Full | ✅ Full | ✅ Full |
| Safari (iOS) | ✅ Full | ✅ Full | ❌ Not supported |

---

## Security Considerations

### Service Worker Security

#### 1. HTTPS Required

**Why?** Service workers only work on HTTPS (or localhost for dev).

```
❌ http://example.com  → Service worker disabled
✅ https://example.com → Service worker enabled
✅ http://localhost    → Service worker enabled (dev only)
```

#### 2. Scope Limitations

**Service worker scope**: `/` (entire origin)

```javascript
// Only intercepts requests under same origin
✅ https://nextbt.example.com/api/issues
✅ https://nextbt.example.com/static/image.png
❌ https://external-api.com/data (not intercepted)
```

#### 3. Cache Poisoning Prevention

**Workbox automatically:**
- ✅ Validates cache responses
- ✅ Checks response status codes
- ✅ Only caches successful responses (200-299)
- ✅ Ignores opaque responses (cross-origin without CORS)

#### 4. Session Cookies

**iron-session cookies are NOT cached** (by design):
- Cookies travel with requests (not intercepted by service worker)
- Session validation happens server-side
- No session data stored in cache

#### 5. Sensitive Data

**API responses cached for 5 minutes only:**
- Short cache lifetime reduces stale data exposure
- User must be online for fresh data
- Logout clears all caches

### Best Practices

```javascript
// ✅ DO: Cache public static assets
{ urlPattern: /\/images\/.*\.png$/, handler: 'CacheFirst' }

// ✅ DO: Use short cache times for dynamic data
{ urlPattern: /\/api\/.*$/, expiration: { maxAgeSeconds: 300 } }

// ❌ DON'T: Cache authentication endpoints
// (not needed, we use NetworkFirst with short expiration)

// ❌ DON'T: Cache sensitive user data long-term
// (our 5-minute API cache handles this)
```

### Permissions

PWA requires user permission for:
- **Notifications**: Requested on first notification subscription
- **Installation**: Implicit via install prompt
- **Storage**: Automatic (cache storage)

---

## Troubleshooting

### Service Worker Not Registering

**Symptoms:**
- Install prompt doesn't appear
- No caching behavior
- DevTools shows "No service workers"

**Solutions:**

1. **Check HTTPS**: Service workers require HTTPS (or localhost)
   ```bash
   # Dev: use localhost
   pnpm dev
   # Production: ensure HTTPS configured
   ```

2. **Check browser console** for errors:
   ```javascript
   // Look for:
   Failed to register service worker: SecurityError
   ```

3. **Clear browser cache**:
   - Chrome: DevTools → Application → Clear storage
   - Edge: Settings → Privacy → Clear browsing data

4. **Verify next-pwa config**:
   ```javascript
   // next.config.js
   const withPWA = require('next-pwa')({
     disable: process.env.NODE_ENV === 'development', // ← Check this
   });
   ```

### Install Prompt Not Appearing

**Symptoms:**
- No install button in address bar
- Custom prompt never shows

**Solutions:**

1. **Check localStorage**: User may have dismissed prompt
   ```javascript
   // Browser console
   localStorage.removeItem('pwa-install-dismissed');
   ```

2. **Verify manifest.json** is accessible:
   ```bash
   curl https://your-domain.com/manifest.json
   # Should return valid JSON
   ```

3. **Check `beforeinstallprompt` event**:
   ```javascript
   // Add to page for debugging
   window.addEventListener('beforeinstallprompt', (e) => {
     console.log('beforeinstallprompt fired', e);
   });
   ```

4. **Browser requirements**:
   - Chrome: Requires HTTPS + service worker + manifest + 30s engagement
   - Safari: Different mechanism (Share → Add to Home Screen)

### Caching Issues

**Symptoms:**
- Old content still showing after deploy
- Updates not appearing

**Solutions:**

1. **Force service worker update**:
   ```javascript
   // Browser console
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(reg => reg.update());
   });
   ```

2. **Clear all caches**:
   ```javascript
   // Browser console
   caches.keys().then(names => {
     names.forEach(name => caches.delete(name));
   });
   ```

3. **Check `skipWaiting` config**:
   ```javascript
   // next.config.js
   const withPWA = require('next-pwa')({
     skipWaiting: true, // ← Should be true for immediate updates
   });
   ```

4. **Hard reload**: Ctrl+Shift+R (Chrome/Edge) or Cmd+Shift+R (Mac)

### Icons Not Displaying

**Symptoms:**
- Default browser icon showing
- Broken image icons in home screen

**Solutions:**

1. **Verify icons exist**:
   ```bash
   ls -lh public/icons/
   # All required sizes should be present
   ```

2. **Check manifest.json paths**:
   ```json
   {
     "icons": [
       { "src": "/icons/icon-192x192.png", "sizes": "192x192" }
     ]
   }
   ```
   Note: Paths are relative to public folder

3. **Validate icon format**:
   - Must be PNG with transparency
   - Square aspect ratio (1:1)
   - Correct dimensions (exact size, not scaled)

4. **Test icon accessibility**:
   ```bash
   curl -I https://your-domain.com/icons/icon-192x192.png
   # Should return 200 OK
   ```

### Push Notifications Not Working

**Symptoms:**
- Browser doesn't request notification permission
- Notifications not appearing

**Solutions:**

1. **Check browser support**:
   - iOS Safari: ❌ Not supported
   - Desktop Safari: ⚠️ Limited support
   - Chrome/Edge/Firefox: ✅ Full support

2. **Verify VAPID keys** in `config/secrets.ts`:
   ```typescript
   export const secrets = {
     webPushEnabled: true,
     vapidPublicKey: "B...", // Must start with B
     vapidPrivateKey: "x...",
   };
   ```

3. **Check permission status**:
   ```javascript
   // Browser console
   console.log(Notification.permission);
   // Should be: 'granted', 'denied', or 'default'
   ```

4. **Request permission manually**:
   ```javascript
   // Browser console
   Notification.requestPermission().then(permission => {
     console.log('Permission:', permission);
   });
   ```

5. **Verify subscription** in DevTools:
   - Application → Service Workers → Check subscription

### Development Mode Issues

**Symptoms:**
- Service worker working in production but not development

**Expected behavior:**
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  disable: process.env.NODE_ENV === 'development', // ← Disabled in dev by design
});
```

**Why disabled in development?**
- Service worker caching interferes with hot module replacement (HMR)
- Faster iteration without cache invalidation
- Clearer debugging without service worker layer

**To test in development:**
```javascript
// Temporarily change to:
disable: false,
```

Then run production build:
```bash
pnpm build
pnpm start
```

### Performance Issues

**Symptoms:**
- Slow page loads despite caching
- High memory usage

**Solutions:**

1. **Check cache sizes**:
   ```javascript
   // Browser console
   navigator.storage.estimate().then(estimate => {
     console.log('Usage:', estimate.usage / 1024 / 1024, 'MB');
     console.log('Quota:', estimate.quota / 1024 / 1024, 'MB');
   });
   ```

2. **Review cache limits**:
   ```javascript
   // next.config.js - Adjust maxEntries if needed
   expiration: {
     maxEntries: 64, // Reduce if memory constrained
     maxAgeSeconds: 24 * 60 * 60,
   }
   ```

3. **Clear old caches**:
   ```bash
   # In production, old caches auto-cleared by Workbox
   # Manual clear:
   caches.keys().then(names => {
     names.forEach(name => {
       if (!name.includes('current-version')) {
         caches.delete(name);
       }
     });
   });
   ```

4. **Monitor service worker performance**:
   - DevTools → Performance → Record
   - Look for slow cache lookups or excessive network requests

---

## Additional Resources

### Official Documentation

- **next-pwa**: https://github.com/shadowwalker/next-pwa
- **Workbox**: https://developer.chrome.com/docs/workbox/
- **Web App Manifest**: https://web.dev/add-manifest/
- **Service Workers**: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **Push API**: https://developer.mozilla.org/en-US/docs/Web/API/Push_API

### Testing Tools

- **Lighthouse**: https://developers.google.com/web/tools/lighthouse
- **PWA Builder**: https://www.pwabuilder.com/
- **Manifest Validator**: https://manifest-validator.appspot.com/

### Browser Support

- **Can I Use - Service Workers**: https://caniuse.com/serviceworkers
- **Can I Use - Push API**: https://caniuse.com/push-api
- **Can I Use - Web App Manifest**: https://caniuse.com/web-app-manifest

---

## Changelog

### 2025-10-03 - Initial PWA Implementation (v0.1.0)

**Added:**
- ✅ next-pwa 5.6.0 integration with Workbox
- ✅ Web app manifest with NextBT branding
- ✅ PWA meta tags in root layout
- ✅ Custom install prompt component
- ✅ Runtime caching strategies for static assets and APIs
- ✅ App shortcuts (View Issues, Create Issue)
- ✅ .gitignore rules for generated service worker files
- ✅ Comprehensive documentation

**Configuration:**
- ✅ Level 1 PWA: Basic installability with static caching
- ✅ No offline editing (by design)
- ✅ Integration with existing web push notifications
- ✅ Dark mode support in PWA

**Security:**
- ✅ HTTPS enforcement (service worker requirement)
- ✅ Short cache times for API responses (5 minutes)
- ✅ Session cookies not cached
- ✅ Scope limited to same origin

---

## Support

For issues or questions about NextBT PWA implementation:

1. **Check this guide first** - Most common issues covered in Troubleshooting
2. **Browser DevTools** - Application tab shows service worker status and caches
3. **Project maintainer** - See CLAUDE.md for project contacts

---

**Last Updated**: 2025-10-03
**Next Review**: After production deployment and user feedback
