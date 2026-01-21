import { z } from 'zod';

// Ticket Status enum
export const TicketStatusEnum = z.enum([
  'NEW',
  'IN_PROGRESS',
  'WAITING_CLIENT',
  'BLOCKED',
  'DONE',
  'FROZEN',
]);

// Priority enum
export const PriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

// Activity Type enum
export const ActivityTypeEnum = z.enum([
  'NOTE',
  'STATUS_CHANGE',
  'COMMENT',
  'PRIORITY_CHANGE',
  'TAG_CHANGE',
  'AI_SUGGESTION',
]);

// Ticket schemas
export const createTicketSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  status: TicketStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  tags: z.array(z.string()).optional(),
});

export const updateTicketSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional(),
  status: TicketStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  tags: z.array(z.string()).optional(),
  aiNotes: z.string().optional(),
});

export const updateTicketStatusSchema = z.object({
  status: TicketStatusEnum,
});

// Activity schemas
export const createActivitySchema = z.object({
  type: ActivityTypeEnum,
  content: z.string().min(1).max(5000),
});

// Reminder schemas
export const createReminderSchema = z.object({
  ticketId: z.string().uuid().optional(),
  remindAt: z.string().datetime(),
  message: z.string().max(1000).optional(),
  repeat: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
  autoType: z.enum(['stagnant', 'waiting_client', 'high_priority', 'old_ticket']).optional(),
});

export const updateReminderSchema = z.object({
  remindAt: z.string().datetime().optional(),
  message: z.string().max(1000).optional(),
  repeat: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
  triggered: z.boolean().optional(),
});

// AI schemas
export const chatSchema = z.object({
  message: z.string().min(1).max(5000),
  context: z.object({
    ticketId: z.string().uuid().optional(),
    conversationHistory: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })).optional(),
  }).optional(),
});

export const generateSummarySchema = z.object({
  ticketId: z.string().uuid(),
});

export const analyzeTicketsSchema = z.object({
  ticketIds: z.array(z.string().uuid()).optional(),
});

// Settings schemas
export const updateSettingsSchema = z.object({
  ollamaUrl: z.string().url().optional(),
  ollamaModel: z.string().min(1).optional(),
  ollamaTemperature: z.number().min(0).max(2).optional(),
  aiSystemPrompt: z.string().optional(),
  reminderStagnantDays: z.number().int().min(1).max(365).optional(),
  reminderWaitingClientDays: z.number().int().min(1).max(365).optional(),
  reminderHighPriorityDays: z.number().int().min(1).max(365).optional(),
  reminderOldTicketDays: z.number().int().min(1).max(365).optional(),
  aiAnalysisInterval: z.number().int().min(1).max(24).optional(),
  theme: z.enum(['light', 'dark']).optional(),
});

export const testOllamaSchema = z.object({
  url: z.string().url().optional(),
});

// Query parameter schemas
export const ticketQuerySchema = z.object({
  status: TicketStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'lastActivityAt', 'priority']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.string().transform(Number).refine(n => n > 0 && n <= 100).optional(),
  offset: z.string().transform(Number).refine(n => n >= 0).optional(),
});
