// /lib/logger.ts
import { secrets } from "@/config/secrets";

export const logger = {
  log: (...args: any[]) => {
    if (secrets.enableLogging) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (secrets.enableLogging) {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (secrets.enableLogging) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (secrets.enableLogging) {
      console.info(...args);
    }
  }
};