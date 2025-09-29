// /config/public.ts - Public configuration values (safe to expose to client)
import { secrets } from "./secrets";

export const publicConfig = {
  turnstileSiteKey: secrets.turnstileSiteKey,
} as const;