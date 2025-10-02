import * as Sentry from "@sentry/nextjs";
import { secrets } from "@/config/secrets";

Sentry.init({
  dsn: secrets.sentryDsn,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // GlitchTip compatibility settings
  beforeSend(event) {
    // GlitchTip may not support all Sentry features
    // This ensures compatibility
    return event;
  },
});
