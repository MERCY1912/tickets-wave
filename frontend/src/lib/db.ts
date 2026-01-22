import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create libsql client for Turso
const libsql = createClient({
  url: process.env.DATABASE_URL || 'file:./dev.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Create Prisma client with libSQL adapter
const adapter = new PrismaLibSql(libsql);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
