// /config/secrets.example.ts
export const secrets = {
  // NOTE: Prisma needs DATABASE_URL at generate time.
  // For dev, you can export it in your shell just for `prisma generate`/`prisma db pull`.
  databaseUrl: "mysql://user:pass@host:3306/mantis",
  // MantisBT crypto
  cryptoMasterSalt: "YOUR_CRYPTO_MASTER_SALT_HERE",
  // OpenRouter
  openrouterApiKey: "sk-or-...",
  openrouterBaseUrl: "https://openrouter.ai/api/v1",
  openrouterModel: "openai/gpt-4o-mini",
  // Email (Postmark)
  postmarkEnabled: false,
  postmarkServerToken: "POSTMARK_SERVER_TOKEN",
  fromEmail: "support@example.com",
  fromName: "Issue Tracker",
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
  vapidEnabled: false,
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
  // Logging
  enableLogging: true, // Set to false in production to disable console logging
} as const;
