import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Create libsql client for Turso
const libsql = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Create Prisma client with libSQL adapter
const adapter = new PrismaLibSql(libsql);

export const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Initialize database
export async function initializeDatabase(): Promise<void> {
  try {
    // Check if database is accessible
    await prisma.$connect();

    console.log('Database connected successfully (Turso)');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
