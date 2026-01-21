// Shared types for Tickets Wave

export type TicketStatus = 'NEW' | 'IN_PROGRESS' | 'WAITING_CLIENT' | 'BLOCKED' | 'DONE' | 'FROZEN';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ActivityType = 'NOTE' | 'STATUS_CHANGE' | 'COMMENT' | 'PRIORITY_CHANGE' | 'TAG_CHANGE' | 'AI_SUGGESTION';

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: Priority;
  tags: string[];
  aiNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}

export interface TicketActivity {
  id: string;
  ticketId: string;
  type: ActivityType;
  content: string;
  createdAt: Date;
}

export interface Reminder {
  id: string;
  ticketId: string | null;
  remindAt: Date;
  message: string | null;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  triggered: boolean;
  autoType: 'stagnant' | 'waiting_client' | 'high_priority' | 'old_ticket' | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Settings {
  id: string;
  ollamaUrl: string;
  ollamaModel: string;
  ollamaTemperature: number;
  aiSystemPrompt: string | null;
  reminderStagnantDays: number;
  reminderWaitingClientDays: number;
  reminderHighPriorityDays: number;
  reminderOldTicketDays: number;
  aiAnalysisInterval: number;
  theme: 'light' | 'dark';
  updatedAt: Date;
}

// IPC Channel types
export type IPCChannel =
  | 'tickets:get'
  | 'tickets:list'
  | 'tickets:create'
  | 'tickets:update'
  | 'tickets:delete'
  | 'activities:get'
  | 'activities:create'
  | 'reminders:get'
  | 'reminders:create'
  | 'reminders:update'
  | 'reminders:delete'
  | 'ai:chat'
  | 'ai:summarize'
  | 'settings:get'
  | 'settings:update';

// API Request/Response types
export interface APIRequest<T = any> {
  type: IPCChannel;
  payload?: T;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
