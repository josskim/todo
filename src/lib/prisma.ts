import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL || "";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: pg.Pool;
};

type QueryCallback = (error: Error | null, result?: unknown) => void;
type QueryFunction = (...queryArgs: unknown[]) => Promise<unknown>;

if (!globalForPrisma.pool) {
  const pool = new pg.Pool({
    connectionString,
    max: 2,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

  pool.on("connect", (client) => {
    const originalQuery = client.query.bind(client);
    let initPromise: Promise<unknown> | null = originalQuery("SET timezone='Asia/Seoul'").catch(() => {});

    client.query = function (...args: unknown[]) {
      if (initPromise) {
        const callback = typeof args[args.length - 1] === "function" ? (args.pop() as QueryCallback) : null;
        const query = originalQuery as QueryFunction;
        const promise = initPromise.then(() => query(...args));
        if (callback) {
          promise.then((result) => callback(null, result)).catch((error) => callback(error));
        }
        return promise;
      }
      const query = originalQuery as QueryFunction;
      return query(...args);
    } as typeof client.query;

    initPromise.finally(() => {
      initPromise = null;
    });
  });

  pool.on("error", (error) => {
    console.error("[pg pool] idle client error:", error.message);
  });

  globalForPrisma.pool = pool;
}

const adapter = new PrismaPg(globalForPrisma.pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
