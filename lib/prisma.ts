import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient | null;
};

/**
 * Legacy Next.js Prisma client (MongoDB).
 *
 * In this project, the real database is handled by the Express backend
 * using its own Prisma/PostgreSQL client. The Next.js Prisma schema
 * still points at a MongoDB DATABASE_URL, which is not configured.
 *
 * To avoid crashing the Next.js dev server with
 * "Environment variable not found: DATABASE_URL" while still allowing
 * callers to safely check `if (!prisma?.model) return null;`,
 * we only instantiate PrismaClient when DATABASE_URL is present.
 */
let prismaInstance: PrismaClient | null = null;

if (process.env.DATABASE_URL) {
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance;
