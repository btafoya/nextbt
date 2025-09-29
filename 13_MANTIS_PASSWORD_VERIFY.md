# 13 — Password Verify Sketch

Mantis has historically used salted MD5 or its own auth plugin. Safer approach: expose a tiny PHP endpoint in Mantis to verify.

**Option A — Port simple MD5(salt.password)** if your instance uses it:
```ts
import { createHash } from "crypto";
export function legacyMd5Check(password: string, stored: string) {
  // stored might be hex md5 with optional salt. Adjust per your config.
  const md5 = (s: string) => createHash("md5").update(s).digest("hex");
  return md5(password) === stored;
}
```

**Option B — Remote verify**
- Add `verify_password.php` on Mantis side that returns 200/401. Call it from Next.js during login.
