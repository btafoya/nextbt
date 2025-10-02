import * as Sentry from "@sentry/nextjs";
import { secrets } from "@/config/secrets";

Sentry.init({
  dsn: secrets.sentryDsn,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // GlitchTip compatibility settings
  beforeSend(event) {
    // GlitchTip may not support all Sentry features
    // This ensures compatibility
    return event;
  },
});

// Export router transition instrumentation for better performance tracking
// This is recommended by Sentry for Next.js App Router applications
// Available from SDK version 9.12.0 onwards
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
