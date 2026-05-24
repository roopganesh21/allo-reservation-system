import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Prevent multiple instances of Prisma and pg connection pool during hot reload in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  pgPool: pg.Pool;
};

const connectionString = process.env.DATABASE_URL;

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter, log: ["query"] });
} else {
  if (!globalForPrisma.prisma) {
    // Disable strict TLS check in local development for Supabase connection safety
    if (connectionString?.includes("supabase")) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }
    
    const pool = new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    
    globalForPrisma.pgPool = pool;
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter, log: ["query"] });
  }
  prisma = globalForPrisma.prisma;
}

export default prisma;
export { prisma };
