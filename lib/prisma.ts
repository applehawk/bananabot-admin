import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const isBuildTime = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy');

export const prisma =
  globalForPrisma.prisma ||
  (isBuildTime
    ? (new Proxy({}, {
      get: (target, prop) => {
        if (prop === '$connect') return () => Promise.resolve();
        if (prop === '$disconnect') return () => Promise.resolve();
        // Return a function that returns a promise that resolves to null for any model query
        return () => {
          // Return a proxy that can handle chained calls like .findMany().then()
          return new Promise((resolve) => resolve(null));
        };
      }
    }) as unknown as PrismaClient)
    : (() => {
      const connectionString = process.env.DATABASE_URL!;
      const adapter = new PrismaPg({ connectionString });
      return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    })());

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
