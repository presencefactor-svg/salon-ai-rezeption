import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function databaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.database_POSTGRES_PRISMA_URL ||
    process.env.database_POSTGRES_URL_NON_POOLING ||
    process.env.database_DATABASE_URL ||
    process.env.database_POSTGRES_URL
  );
}

const url = databaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
    ...(url ? { datasources: { db: { url } } } : {}),
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
