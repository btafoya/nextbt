// /lib/notify/teams.ts
import { secrets } from "@/config/secrets";

export async function sendTeams(text: string) {
  await fetch(secrets.teamsWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
}
