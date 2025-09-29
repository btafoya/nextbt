# 04 — Config (no `.env`)

Create two files:

## `/config/secrets.example.ts`
```ts
export const secrets = {
  databaseUrl: "mysql://user:pass@host:3306/mantis",
  // OpenRouter
  openrouterApiKey: "sk-or-...",
  openrouterBaseUrl: "https://openrouter.ai/api/v1",
  openrouterModel: "openai/gpt-4o-mini", // choose any allowed model

  // Email (Postmark)
  postmarkServerToken: "POSTMARK_SERVER_TOKEN",
  fromEmail: "no-reply@example.com",

  // Pushover
  pushoverUserKey: "u...",
  pushoverApiToken: "a...",

  // Rocket.Chat Incoming Webhook URL
  rocketchatWebhookUrl: "https://chat.example.com/hooks/xxxx",

  // Microsoft Teams Incoming Webhook
  teamsWebhookUrl: "https://outlook.office.com/webhook/xxxx",

  // Web Push (VAPID)
  vapidPublicKey: "B...",
  vapidPrivateKey: "x...",
  vapidSubject: "mailto:admin@example.com"
} as const;
```

## `/config/secrets.ts`
- Copy the example, fill with **real values**. Git‑ignore this file.
