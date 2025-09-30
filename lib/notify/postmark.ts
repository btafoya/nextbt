// /lib/notify/postmark.ts
import * as Postmark from "postmark";
import { secrets } from "@/config/secrets";

const client = new Postmark.ServerClient(secrets.postmarkServerToken);

export async function sendEmail(to: string, subject: string, html: string) {
  await client.sendEmail({
    From: `${secrets.fromName} <${secrets.fromEmail}>`,
    To: to,
    Subject: subject,
    HtmlBody: html,
  });
}
