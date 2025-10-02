// /config/secrets.example.ts
export const secrets = {
  // NOTE: Prisma needs DATABASE_URL at generate time.
  // For dev, you can export it in your shell just for `prisma generate`/`prisma db pull`.
  databaseUrl: "mysql://user:pass@host:3306/mantis",
  // iron-session encryption
  sessionSecret: "complex_password_at_least_32_characters_long_for_iron_session_encryption",
  // Session lifetime in days (default: 7 days, set to higher value like 30 or 90 for long-life sessions)
  sessionLifeDays: 7, // Recommended: 7-90 days depending on security requirements
  // MantisBT crypto
  cryptoMasterSalt: "YOUR_CRYPTO_MASTER_SALT_HERE",
  // OpenRouter (AI Writer)
  openrouterApiKey: "sk-or-...",
  openrouterBaseUrl: "https://openrouter.ai/api/v1",
  openrouterModel: "openai/gpt-4o-mini",
  openrouterSiteUrl: "https://yourdomain.com",
  openrouterSiteName: "Your Bug Tracker",
  // AI Writer Settings
  aiWriterEnabled: true,
  aiRateLimitRequests: 60, // requests per window
  aiRateLimitWindow: 600, // window in seconds (10 minutes)
  // Email (Postmark)
  postmarkEnabled: false,
  postmarkServerToken: "POSTMARK_SERVER_TOKEN",
  postmarkChannel: "outbound", // Message Stream ID (e.g., "outbound", "issues", "broadcasts")
  fromEmail: "support@example.com",
  fromName: "Issue Tracker",
  messsageSubjectPrepend: "Issue Tracker",
  webmasterEmail: "support@example.com",
  // Pushover
  pushoverEnabled: false,
  pushoverUserKey: "user_key",
  pushoverApiToken: "app_token",
  // Rocket.Chat Incoming Webhook URL
  rocketchatEnabled: false,
  rocketchatWebhookUrl: "https://chat.example.com/hooks/xxxx",
  // Microsoft Teams Incoming Webhook
  teamsEnabled: false,
  teamsWebhookUrl: "https://outlook.office.com/webhook/xxxx",
  // Web Push (VAPID)
  webPushEnabled: false,
  vapidPublicKey: "B...",
  vapidPrivateKey: "x...",
  vapidSubject: "mailto:admin@example.com",
  // Cloudflare Turnstile
  turnstileEnabled: false,
  turnstileSiteKey: "0x4AAAAAAA...",
  turnstileSecretKey: "0x4AAAAAAA...",
  // MCP Remote Server (Claude Code)
  mcpRemoteEnabled: false,
  mcpRemoteUrl: "https://api.example.com/mcp",
  mcpRemoteAuthKey: "your-mcp-api-key-here",
  // Application Base URL (for notification emails and links)
  baseUrl: "https://yourdomain.com", // Production URL (e.g., https://bugs.example.com)
  // Branding
  siteName: "Issue Tracker", // Site name displayed on login page and header
  siteLogo: "/logo.svg", // Path to logo image (relative to public folder, or full URL)
  // Sentry Error Tracking (GlitchTip compatible)
  sentryDsn: "https://public_key@your-glitchtip-instance.com/project_id",
  sentryOrg: "your-org-slug",
  sentryProject: "your-project-slug",
  sentryAuthToken: "", // Optional: For source map upload (set in CI/CD only)
  // Logging
  enableLogging: true, // Set to false in production to disable console logging
} as const;
