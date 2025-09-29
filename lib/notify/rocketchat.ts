// /lib/notify/rocketchat.ts
import { secrets } from "@/config/secrets";

export async function sendRocketChat(text: string) {
  await fetch(secrets.rocketchatWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
}
