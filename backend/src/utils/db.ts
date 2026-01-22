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

// Initialize database and create tables if needed
export async function initializeDatabase(): Promise<void> {
  try {
    // Check if database is accessible
    await prisma.$connect();

    // In production, push schema if tables don't exist
    if (process.env.NODE_ENV === 'production') {
      try {
        // Try to query User table to see if schema exists
        await prisma.user.count();
      } catch (error: any) {
        if (error.code === 'P2021') {
          // Table doesn't exist - run db push
          console.log('[DB] Tables not found, running prisma db push...');
          const { execSync } = require('child_process');
          execSync('npx prisma db push --skip-generate', {
            cwd: process.cwd(),
            stdio: 'inherit',
          });
          console.log('[DB] Schema created successfully');
        } else {
          throw error;
        }
      }
    }

    console.log('Database connected successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
