# 07 — Notifications (Project‑Access–Based)

On events:
- Issue created
- Issue updated (status/assignee/summary/any field)
- Note added

**Recipients:** union of users with access to the issue's project, filtered by simple preferences (e.g., "Only my assigned issues").

## Channels

### Postmark (Email)
`/lib/notify/postmark.ts`
```ts
import { secrets } from "@/config/secrets";
import Postmark from "postmark";

const client = new Postmark.ServerClient(secrets.postmarkServerToken);

export async function sendEmail(to: string, subject: string, html: string) {
  await client.sendEmail({
    From: secrets.fromEmail,
    To: to,
    Subject: subject,
    HtmlBody: html
  });
}
```

### Pushover
```ts
import { secrets } from "@/config/secrets";
import Pushover from "pushover-notifications";

const p = new Pushover({ user: secrets.pushoverUserKey, token: secrets.pushoverApiToken });

export async function sendPushover(message: string, title?: string) {
  return new Promise((resolve, reject) => {
    p.send({ message, title }, (err, res) => (err ? reject(err) : resolve(res)));
  });
}
```

### Rocket.Chat (Incoming Webhook)
```ts
import { secrets } from "@/config/secrets";
export async function sendRocketChat(text: string) {
  await fetch(secrets.rocketchatWebhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
}
```

### Microsoft Teams (Incoming Webhook)
```ts
import { secrets } from "@/config/secrets";
export async function sendTeams(text: string) {
  await fetch(secrets.teamsWebhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
}
```

### Web Push
```ts
import webpush from "web-push";
import { secrets } from "@/config/secrets";

webpush.setVapidDetails(secrets.vapidSubject, secrets.vapidPublicKey, secrets.vapidPrivateKey);

export async function sendWebPush(subscription: any, payload: any) {
  await webpush.sendNotification(subscription, JSON.stringify(payload));
}
```

## Template
- Central dispatcher at `/lib/notify/dispatch.ts` that formats a concise summary and calls each enabled channel based on per-user prefs.
