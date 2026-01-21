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
    const existingSettings = await prisma.settings.findUnique({
      where: { id: 'singleton' },
    });

    if (!existingSettings) {
      await prisma.settings.create({
        data: {
          id: 'singleton',
          ollamaUrl: 'http://localhost:11434',
          ollamaModel: 'qwen2.5:7b',
          ollamaTemperature: 0.7,
          reminderStagnantDays: 5,
          reminderWaitingClientDays: 3,
          reminderHighPriorityDays: 2,
          reminderOldTicketDays: 14,
          aiAnalysisInterval: 4,
          theme: 'dark',
        },
      });
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}
