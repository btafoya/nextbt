// /lib/notify/postmark.ts
import * as Postmark from "postmark";
import { secrets } from "@/config/secrets";

const client = new Postmark.ServerClient(secrets.postmarkServerToken);

export async function sendEmail(to: string, subject: string, html: string) {
  // Using type assertion to include MessageStream parameter
  // MessageStream is supported by Postmark API but not fully typed in library
  await client.sendEmail({
    From: `${secrets.fromName} <${secrets.fromEmail}>`,
    To: to,
    Subject: `${secrets.messsageSubjectPrepend} ${subject}`,
    HtmlBody: html,
    MessageStream: secrets.postmarkChannel, // Routes email through configured stream
  } as any);
}
