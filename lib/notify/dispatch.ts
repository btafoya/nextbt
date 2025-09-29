// /lib/notify/dispatch.ts
import { sendEmail } from "@/lib/notify/postmark";
import { sendPushover } from "@/lib/notify/pushover";
import { sendRocketChat } from "@/lib/notify/rocketchat";
import { sendTeams } from "@/lib/notify/teams";

// Web push typically needs stored subscriptions per user
export async function notifyAll(recipients: { email?: string; pushover?: boolean; rocketchat?: boolean; teams?: boolean; webpush?: any }[], subject: string, text: string, html?: string) {
  const tasks: Promise<any>[] = [];

  for (const r of recipients) {
    if (r.email) tasks.push(sendEmail(r.email, subject, html ?? `<pre>${text}</pre>`));
    if (r.pushover) tasks.push(sendPushover(text, subject) as any);
    if (r.rocketchat) tasks.push(sendRocketChat(`**${subject}**\n${text}`));
    if (r.teams) tasks.push(sendTeams(`**${subject}**\n${text}`));
    if (r.webpush) {
      // TODO: implement sendWebPush(subscription, payload)
    }
  }

  await Promise.allSettled(tasks);
}
