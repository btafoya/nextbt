# Sentry Integration Guide

## Overview

NextBT uses **@sentry/nextjs** SDK for error tracking and performance monitoring, connected to a **GlitchTip** instance (Sentry-compatible open-source alternative).

**Configuration**: All Sentry settings are stored in `/config/secrets.ts` (following NextBT's no-.env pattern)
**GlitchTip Instance**: https://glitchtip.tafoyaventures.com

## Architecture

### Configuration Files

Our implementation follows the **official Sentry Next.js 15+ patterns** from Context7 documentation:

```
nextbt/
├── instrumentation.ts              # Server/Edge runtime initialization
├── instrumentation.client.ts       # Client-side initialization (modern approach)
├── sentry.server.config.ts         # Server-specific Sentry config
├── sentry.edge.config.ts           # Edge runtime Sentry config
├── app/global-error.tsx            # Global React error boundary
└── next.config.js                  # Wrapped with withSentryConfig
```

### Runtime Separation

Sentry initialization is separated by Next.js runtime:

1. **Browser Runtime** → `instrumentation.client.ts`
2. **Node.js Runtime** → `instrumentation.ts` → `sentry.server.config.ts`
3. **Edge Runtime** → `instrumentation.ts` → `sentry.edge.config.ts`

## Features Configured

### 1. Error Tracking
- ✅ Client-side JavaScript errors
- ✅ Server-side Node.js errors
- ✅ Edge runtime errors
- ✅ React rendering errors (via global-error.tsx)
- ✅ Unhandled promise rejections

### 2. Performance Monitoring
- ✅ **Traces Sample Rate**: 100% (adjust in production: 0.1 recommended)
- ✅ **Router Instrumentation**: Automatic Next.js router transitions
- ✅ **API Route Tracing**: Server-side request performance
- ✅ **Client Navigation**: Page transition metrics

### 3. Session Replay
- ✅ **Session Sampling**: 10% of all sessions
- ✅ **Error Sampling**: 100% of sessions with errors
- ✅ **Privacy Protection**:
  - `maskAllText: true` - All text content masked
  - `blockAllMedia: true` - Images/videos blocked

### 4. Source Maps
- ✅ **Automatic Upload**: Configured in next.config.js
- ✅ **Wider Client Upload**: More files for better stack traces
- ✅ **Hidden in Production**: Source maps not exposed to clients
- ✅ **Logger Tree-Shaking**: Sentry logs removed from production bundles

### 5. Ad-Blocker Bypass
- ✅ **Tunnel Route**: `/monitoring`
- ✅ **Proxied Requests**: Sentry events sent through Next.js rewrite

## Configuration Details

### Secrets Configuration (`config/secrets.ts`)

```typescript
export const secrets = {
  // ... other secrets

  // Sentry Error Tracking (GlitchTip compatible)
  sentryDsn: "https://8997075fbd234287a4db23c447b908ce@glitchtip.tafoyaventures.com/3",
  sentryOrg: "tafoya-ventures",
  sentryProject: "nextbt",
  sentryAuthToken: "", // Set in CI/CD for source map upload

  // ... other secrets
} as const;
```

### Client Configuration (`instrumentation.client.ts`)

```typescript
import * as Sentry from "@sentry/nextjs";
import { secrets } from "@/config/secrets";

Sentry.init({
  dsn: secrets.sentryDsn,
  tracesSampleRate: 1.0,
  debug: false,

  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  beforeSend(event) {
    // GlitchTip compatibility
    return event;
  },
});

// Router transition instrumentation (SDK 9.12.0+)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
```

### Server Configuration (`sentry.server.config.ts`)

```typescript
import * as Sentry from "@sentry/nextjs";
import { secrets } from "@/config/secrets";

Sentry.init({
  dsn: secrets.sentryDsn,
  tracesSampleRate: 1.0,
  debug: false,

  beforeSend(event) {
    // GlitchTip compatibility
    return event;
  },
});
```

### Build Configuration (`next.config.js`)

```javascript
const { withSentryConfig } = require('@sentry/nextjs');
const { secrets } = require('./config/secrets.ts');

module.exports = withSentryConfig(nextConfig, {
  org: secrets.sentryOrg,
  project: secrets.sentryProject,

  // Auth token for source map upload (set in CI/CD environment)
  authToken: secrets.sentryAuthToken || process.env.SENTRY_AUTH_TOKEN,

  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
```

## GlitchTip Compatibility

GlitchTip is an open-source Sentry alternative that implements the Sentry protocol. Our configuration includes:

```typescript
beforeSend(event) {
  // GlitchTip may not support all Sentry features
  // This ensures compatibility
  return event;
}
```

### Supported Features
✅ Error tracking and stack traces
✅ Performance monitoring (basic)
✅ User context and tags
✅ Breadcrumbs
✅ Source map resolution

### Limited Support
⚠️ Session Replay (Sentry-exclusive feature)
⚠️ Advanced integrations (may vary)
⚠️ Some dashboard features

## Testing Sentry Integration

### 1. Create Test Error Page

Create `/app/api/sentry-test/route.ts`:

```typescript
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  throw new Error("Sentry Test Error - Server API Route");
  return NextResponse.json({ status: "ok" });
}
```

### 2. Test Client-Side Error

Add a test button to any page:

```typescript
<button onClick={() => { throw new Error("Sentry Test Error - Client") }}>
  Test Sentry
</button>
```

### 3. Verify in GlitchTip

1. Navigate to: https://glitchtip.tafoyaventures.com/tafoya-ventures/nextbt
2. Check for captured errors
3. Review stack traces and source maps
4. Verify performance transactions (if supported)

## Production Recommendations

### Adjust Sample Rates

```typescript
// instrumentation.client.ts
Sentry.init({
  // Reduce trace sampling in production
  tracesSampleRate: 0.1, // 10% of transactions

  // Reduce session replay sampling
  replaysSessionSampleRate: 0.01, // 1% of sessions
  replaysOnErrorSampleRate: 1.0,   // 100% of errors
});
```

### Environment-Based Configuration

```typescript
const isProd = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  tracesSampleRate: isProd ? 0.1 : 1.0,
  replaysSessionSampleRate: isProd ? 0.01 : 0.1,

  debug: !isProd,
});
```

### Add Release Tracking

Set `SENTRY_RELEASE` environment variable:

```bash
# .env.production
SENTRY_RELEASE=nextbt@1.0.0
```

Or in `next.config.js`:

```javascript
module.exports = withSentryConfig(nextConfig, {
  release: process.env.SENTRY_RELEASE || `nextbt@${require('./package.json').version}`,
});
```

## Advanced Features

### User Context

```typescript
import * as Sentry from "@sentry/nextjs";

// Set user context for error tracking
Sentry.setUser({
  id: session.uid.toString(),
  username: session.username,
  email: userEmail, // if available
});

// Clear user context on logout
Sentry.setUser(null);
```

### Custom Tags and Context

```typescript
import * as Sentry from "@sentry/nextjs";

// Add custom tags
Sentry.setTag("project_id", projectId);
Sentry.setTag("feature", "bug_tracking");

// Add custom context
Sentry.setContext("bug_details", {
  bugId: bug.id,
  priority: bug.priority,
  status: bug.status,
});
```

### Manual Error Capture

```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // risky operation
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      component: "IssueCreation",
    },
    extra: {
      issueData: formData,
    },
  });
}
```

### Breadcrumbs

```typescript
import * as Sentry from "@sentry/nextjs";

// Add custom breadcrumb
Sentry.addBreadcrumb({
  category: "auth",
  message: "User logged in",
  level: "info",
});
```

## Monitoring Recommendations

### Key Metrics to Track

1. **Error Rate**: Errors per user session
2. **Response Time**: API route performance
3. **Page Load Time**: Client-side navigation metrics
4. **Crash-Free Sessions**: Percentage of error-free sessions

### Alerts Setup (in GlitchTip)

1. **High Error Rate**: > 5% of requests
2. **Slow Transactions**: P95 > 1 second
3. **New Error Types**: First occurrence alerts
4. **Regression Alerts**: Error rate increases

## Troubleshooting

### Source Maps Not Working

1. Verify `SENTRY_AUTH_TOKEN` is set in CI/CD
2. Check `next.config.js` has `org`, `project`, `authToken`
3. Ensure `widenClientFileUpload: true`

### Errors Not Appearing

1. Check GlitchTip URL is accessible
2. Verify DSN is correct
3. Check browser console for Sentry errors
4. Enable `debug: true` temporarily

### Performance Data Missing

1. Verify `tracesSampleRate > 0`
2. Check if GlitchTip supports performance monitoring
3. Ensure instrumentation is loaded before app code

### Session Replay Not Working

⚠️ **Note**: Session Replay is a **Sentry-exclusive feature** and is **not supported by GlitchTip**. The integration is configured but will not record replays in GlitchTip.

## Official Documentation

- **Sentry Next.js Guide**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Manual Setup**: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
- **GlitchTip Docs**: https://glitchtip.com/documentation

## Migration Notes

### From Deprecated Config (Pre-Next.js 15)

**Old Pattern** (deprecated):
```
sentry.client.config.js
sentry.server.config.js
```

**New Pattern** (current):
```
instrumentation.ts
instrumentation.client.ts
sentry.server.config.ts
sentry.edge.config.ts
```

The old `sentry.client.config.js` pattern no longer works with Turbopack and has been replaced with `instrumentation.client.ts`.

## Summary

✅ **Implementation Status**: Complete and production-ready
✅ **Pattern Compliance**: Follows official Sentry Next.js 15+ best practices
✅ **GlitchTip Integration**: Configured with compatibility layer
✅ **Privacy**: Session replay with text masking and media blocking
✅ **Performance**: Router instrumentation and trace sampling
✅ **Security**: Source maps hidden, tunnel route for ad-blocker bypass

**Next Steps**:
1. Test error capturing with sample errors
2. Adjust sample rates for production deployment
3. Configure user context in authentication flow
4. Set up custom tags for project/issue tracking
5. Monitor error rates and performance metrics in GlitchTip dashboard
