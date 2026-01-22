import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Initialize database with default settings
export async function initializeDatabase(): Promise<void> {
  try {
    // Check if database is accessible
    await prisma.$connect();

    // Note: Settings initialization is handled per-user now,
    // so we don't create a singleton settings record anymore
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
