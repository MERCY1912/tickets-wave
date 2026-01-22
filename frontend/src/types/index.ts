// Ticket Types
export type TicketStatus = 'NEW' | 'IN_PROGRESS' | 'WAITING_CLIENT' | 'BLOCKED' | 'DONE' | 'FROZEN';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ActivityType = 'NOTE' | 'STATUS_CHANGE' | 'COMMENT' | 'PRIORITY_CHANGE' | 'TAG_CHANGE' | 'AI_SUGGESTION';

// Todo Types
export type TodoPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TodoSource = 'manual' | 'ai_morning_report' | null;

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: Priority;
  tags: string[];
  aiNotes: string | null;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  activities?: TicketActivity[];
  reminders?: Reminder[];
}

export interface TicketActivity {
  id: string;
  ticketId: string;
  type: ActivityType;
  content: string;
  createdAt: string;
  ticket?: {
    id: string;
    title: string;
    status: TicketStatus;
    priority: Priority;
  };
}

export interface Reminder {
  id: string;
  ticketId: string | null;
  remindAt: string;
  message: string | null;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  triggered: boolean;
  autoType: 'stagnant' | 'waiting_client' | 'high_priority' | 'old_ticket' | null;
  createdAt: string;
  updatedAt: string;
  ticket?: {
    id: string;
    title: string;
    status: TicketStatus;
    priority: Priority;
    tags: string[];
  };
}

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  priority: TodoPriority;
  completed: boolean;
  ticketId: string | null;
  source: TodoSource;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  ticket?: {
    id: string;
    title: string;
    status: TicketStatus;
    priority: Priority;
    tags: string[];
  };
}

export interface Settings {
  id: string;
  deepseekModel: string;
  deepseekTemperature: number;
  aiSystemPrompt: string | null;
  hasApiKey: boolean;
  reminderStagnantDays: number;
  reminderWaitingClientDays: number;
  reminderHighPriorityDays: number;
  reminderOldTicketDays: number;
  aiAnalysisInterval: number;
  theme: 'light' | 'dark';
  updatedAt: string;
}

// AI Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  response: string;
  timestamp: string;
  model: string;
}

export interface ChatContext {
  ticketId?: string;
  conversationHistory?: ChatMessage[];
}

// API Types
export interface TicketListParams {
  status?: TicketStatus | '' | string;
  priority?: Priority | '' | string;
  tag?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'lastActivityAt' | 'priority' | string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface TicketListResponse {
  tickets: Ticket[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface DashboardStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  recentTickets: Ticket[];
  stagnantCount: number;
}

// Create/Update Types
export interface CreateTicketInput {
  title: string;
  description?: string;
  status?: TicketStatus;
  priority?: Priority;
  tags?: string[];
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: Priority;
  tags?: string[];
  aiNotes?: string;
}

export interface CreateActivityInput {
  type: ActivityType;
  content: string;
}

export interface CreateReminderInput {
  ticketId?: string;
  remindAt: string;
  message?: string;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
  autoType?: 'stagnant' | 'waiting_client' | 'high_priority' | 'old_ticket';
}

export interface UpdateReminderInput {
  remindAt?: string;
  message?: string;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
  triggered?: boolean;
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  priority?: TodoPriority;
  ticketId?: string;
  source?: TodoSource;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  priority?: TodoPriority;
  completed?: boolean;
}
