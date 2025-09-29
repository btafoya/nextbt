// /db/client.ts
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

// Load database URL from config/secrets.ts
let databaseUrl: string | undefined;
try {
  const { secrets } = require("@/config/secrets");
  databaseUrl = secrets.databaseUrl;
} catch (err) {
  console.warn("Warning: config/secrets.ts not found. Create it from config/secrets.example.ts");
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl || process.env.DATABASE_URL || "",
      },
    },
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
