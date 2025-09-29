// /lib/notify/pushover.ts
import Pushover from "pushover-notifications";
import { secrets } from "@/config/secrets";

const p = new Pushover({ user: secrets.pushoverUserKey, token: secrets.pushoverApiToken });

export async function sendPushover(message: string, title?: string) {
  return new Promise((resolve, reject) => {
    p.send({ message, title }, (err, res) => (err ? reject(err) : resolve(res)));
  });
}
