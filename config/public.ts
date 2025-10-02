// /config/public.ts - Public configuration values (safe to expose to client)
import { secrets } from "./secrets";

export const publicConfig = {
  turnstileEnabled: secrets.turnstileEnabled,
  turnstileSiteKey: secrets.turnstileSiteKey,
  siteName: secrets.siteName,
  siteLogo: secrets.siteLogo,
} as const;