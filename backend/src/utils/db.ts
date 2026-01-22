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
