// /lib/mantis-crypto.ts
import { createHash } from "crypto";
import { secrets } from "@/config/secrets";

/**
 * Helper function for MD5 hashing
 */
const md5 = (s: string) => createHash("md5").update(s).digest("hex");

/**
 * Minimal placeholder. Replace to match your MantisBT auth scheme.
 * Many older installs used MD5(password) or salted MD5. Newer may use PHP password_hash().
 * For guaranteed correctness, expose a tiny verify endpoint from Mantis and call that.
 */
export async function verifyMantisPassword(inputPassword: string, storedHash: string): Promise<boolean> {
  // Legacy naive check (do NOT use in production without validating your instance's scheme)

  // Simple MD5 check (32 chars = standard MD5)
  if (storedHash.length === 32) {
    return md5(inputPassword) === storedHash;
  }

  // Salted MD5 check using crypto master salt
  // MantisBT typically uses: md5(password + salt)
  if (storedHash.length === 32 && secrets.cryptoMasterSalt) {
    const saltedHash = md5(inputPassword + secrets.cryptoMasterSalt);
    if (saltedHash === storedHash) {
      return true;
    }
  }

  // TODO: implement actual matching or remote verify for password_hash() hashes
  return false;
}

/**
 * Hash a password using MantisBT's password scheme
 * Uses MD5 with optional salt for compatibility with existing MantisBT installations
 */
export async function hashMantisPassword(password: string): Promise<string> {
  // Use salted MD5 if crypto master salt is configured
  if (secrets.cryptoMasterSalt) {
    return md5(password + secrets.cryptoMasterSalt);
  }

  // Fall back to simple MD5 (not recommended for production)
  return md5(password);
}
