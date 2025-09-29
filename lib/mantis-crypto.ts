// /lib/mantis-crypto.ts
import { createHash } from "crypto";

/**
 * Minimal placeholder. Replace to match your MantisBT auth scheme.
 * Many older installs used MD5(password) or salted MD5. Newer may use PHP password_hash().
 * For guaranteed correctness, expose a tiny verify endpoint from Mantis and call that.
 */
export async function verifyMantisPassword(inputPassword: string, storedHash: string): Promise<boolean> {
  // Legacy naive check (do NOT use in production without validating your instance's scheme)
  const md5 = (s: string) => createHash("md5").update(s).digest("hex");
  if (storedHash.length == 32) {
    return md5(inputPassword) === storedHash;
  }
  // TODO: implement actual matching or remote verify
  return false;
}
